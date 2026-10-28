/**
 * CampusPulse AI — Student Helpdesk Chatbot
 * Clean Gemini API wrapper. No fake data, no predefined answers.
 */

import { fetchGeminiModels } from './Logic/fetchAPI.js';
import { routeStudentQuery } from './Logic/router.js';
import { saveChatHistory, loadChatHistory, clearChatHistory } from './Logic/indexDB.js';

// ── State ──────────────────────────────────────────────────────────────────
let chatHistory = [];
let apiKey = localStorage.getItem('helpdesk_key') || '';
let modelId = localStorage.getItem('helpdesk_model') || '';
let fetchedModels = [];

// ── DOM refs ───────────────────────────────────────────────────────────────
const messages      = document.getElementById('messages');
const welcome       = document.getElementById('welcome');
const inputEl       = document.getElementById('input');
const sendBtn       = document.getElementById('sendBtn');
const modelPillLabel = document.getElementById('modelPillLabel');
const engineLabel   = document.getElementById('engineLabel');

const settingsModal = document.getElementById('settingsModal');
const apiKeyInput   = document.getElementById('apiKeyInput');
const modelSelect   = document.getElementById('modelSelect');
const apiStatus     = document.getElementById('apiStatus');
const modelHint     = document.getElementById('modelHint');
const validateBtn   = document.getElementById('validateBtn');
const saveBtn       = document.getElementById('saveBtn');

const clearModal        = document.getElementById('clearModal');
const clearConfirmInput = document.getElementById('clearConfirmInput');
const clearErr          = document.getElementById('clearErr');

const sidebar = document.getElementById('sidebar');

// ── Init ───────────────────────────────────────────────────────────────────
async function init() {
    chatHistory = await loadChatHistory();
    renderHistory();
    updateStatusBar();

    if (apiKey) {
        // Silently fetch models in the background for the pill label
        fetchGeminiModels(apiKey).then(res => {
            if (res.success) {
                fetchedModels = res.models;
                // If saved model is gone from list, default to first
                if (modelId && !fetchedModels.find(m => m.id === modelId)) {
                    modelId = fetchedModels[0]?.id || '';
                    localStorage.setItem('helpdesk_model', modelId);
                }
                updateStatusBar();
            }
        });
    }

    setupEvents();
}

// ── Status bar ─────────────────────────────────────────────────────────────
function updateStatusBar() {
    const label = modelId || (apiKey ? 'No model selected' : 'No API key');
    modelPillLabel.textContent = label;
    engineLabel.textContent = apiKey ? (modelId || 'Key set, no model') : 'Offline';
}

// ── Chat rendering ─────────────────────────────────────────────────────────
function renderHistory() {
    // Remove all existing message rows
    messages.querySelectorAll('.msg-row').forEach(el => el.remove());

    if (chatHistory.length === 0) {
        welcome.style.display = 'block';
    } else {
        welcome.style.display = 'none';
        chatHistory.forEach(m => appendToDOM(m.role, m.content));
    }
    scrollBottom();
}

function appendMessage(role, content) {
    welcome.style.display = 'none';
    chatHistory.push({ role, content });
    saveChatHistory(chatHistory);
    appendToDOM(role, content);
    scrollBottom();
}

function appendToDOM(role, content) {
    const row = document.createElement('div');
    row.className = `msg-row ${role}`;

    const bubble = document.createElement('div');
    bubble.className = 'bubble';

    if (role === 'ai') {
        const md = document.createElement('div');
        md.className = 'md';
        try {
            md.innerHTML = DOMPurify.sanitize(marked.parse(content || ''));
            if (window.renderMathInElement) {
                renderMathInElement(md, {
                    delimiters: [
                        { left: '$$', right: '$$', display: true },
                        { left: '$', right: '$', display: false }
                    ],
                    throwOnError: false
                });
            }
        } catch {
            md.textContent = content;
        }
        bubble.appendChild(md);

        // Copy button
        const actions = document.createElement('div');
        actions.className = 'bubble-actions';
        const copyBtn = document.createElement('button');
        copyBtn.className = 'copy-btn';
        copyBtn.textContent = '📋 Copy';
        copyBtn.onclick = () => {
            navigator.clipboard.writeText(content);
            copyBtn.textContent = '✅ Copied';
            setTimeout(() => { copyBtn.textContent = '📋 Copy'; }, 1500);
        };
        actions.appendChild(copyBtn);
        bubble.appendChild(actions);
    } else {
        bubble.textContent = content;
    }

    row.appendChild(bubble);
    messages.appendChild(row);
}

function showTyping() {
    removeTyping();
    const row = document.createElement('div');
    row.className = 'typing-row';
    row.id = 'typing';
    row.innerHTML = '<div class="typing-bubble"><div class="dot"></div><div class="dot"></div><div class="dot"></div></div>';
    messages.appendChild(row);
    scrollBottom();
}

function removeTyping() {
    document.getElementById('typing')?.remove();
}

function scrollBottom() {
    messages.scrollTop = messages.scrollHeight;
}

// ── Send ───────────────────────────────────────────────────────────────────
async function handleSend(text) {
    text = (text || inputEl.value).trim();
    if (!text) return;

    inputEl.value = '';
    inputEl.style.height = 'auto';
    sendBtn.disabled = true;

    appendMessage('user', text);
    showTyping();

    await routeStudentQuery(
        { apiKey, modelId, chatHistory },
        (content, isError, rawError, source) => {
            removeTyping();
            appendMessage('ai', content);
            if (rawError) console.error('[Gemini raw error]', rawError);
        }
    );

    sendBtn.disabled = false;
    inputEl.focus();
}

// ── Model dropdown helpers ─────────────────────────────────────────────────
function setModelDropdownLoading(msg) {
    modelSelect.innerHTML = '';
    const opt = document.createElement('option');
    opt.textContent = msg;
    opt.value = '';
    opt.disabled = true;
    opt.selected = true;
    modelSelect.appendChild(opt);
    modelSelect.disabled = true;
}

function populateModelDropdown(models) {
    modelSelect.innerHTML = '';
    modelSelect.disabled = false;
    models.forEach(m => {
        const opt = document.createElement('option');
        opt.value = m.id;
        opt.textContent = `${m.name}`;
        if (m.id === modelId) opt.selected = true;
        modelSelect.appendChild(opt);
    });
    if (!modelSelect.value && models.length) {
        modelSelect.selectedIndex = 0;
    }
}

async function loadModels(key) {
    setModelDropdownLoading('Fetching models from Google API...');
    modelHint.textContent = 'Querying generativelanguage.googleapis.com...';
    apiStatus.className = 'api-status';
    apiStatus.textContent = '';

    const res = await fetchGeminiModels(key);

    if (res.success && res.models.length > 0) {
        fetchedModels = res.models;
        populateModelDropdown(res.models);
        apiStatus.className = 'api-status ok';
        apiStatus.textContent = `✅ Valid key — ${res.models.length} models loaded.`;
        modelHint.textContent = 'Select a model below.';
        return true;
    } else {
        fetchedModels = [];
        setModelDropdownLoading('Could not load models.');
        apiStatus.className = 'api-status err';
        apiStatus.textContent = `❌ ${res.error}`;
        modelHint.textContent = 'Check your API key and try again.';
        return false;
    }
}

// ── Events ─────────────────────────────────────────────────────────────────
function setupEvents() {
    // Textarea auto-grow + send button enable
    inputEl.addEventListener('input', () => {
        inputEl.style.height = 'auto';
        inputEl.style.height = Math.min(inputEl.scrollHeight, 160) + 'px';
        sendBtn.disabled = inputEl.value.trim() === '';
    });

    inputEl.addEventListener('keydown', e => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (!sendBtn.disabled) handleSend();
        }
    });

    sendBtn.addEventListener('click', () => handleSend());

    // New chat
    document.getElementById('newChatBtn').addEventListener('click', async () => {
        if (chatHistory.length === 0) {
            inputEl.focus();
            return;
        }
        chatHistory = [];
        await clearChatHistory();
        renderHistory();
        inputEl.value = '';
        inputEl.style.height = 'auto';
        sendBtn.disabled = true;
        inputEl.focus();
        // Close sidebar on mobile after starting new chat
        sidebar.classList.remove('open');
    });

    // Export
    document.getElementById('exportBtn').addEventListener('click', () => {
        if (!chatHistory.length) { alert('No conversation to export.'); return; }
        let md = `# Student Helpdesk Transcript\n*Exported: ${new Date().toLocaleString()}*\n\n`;
        chatHistory.forEach(m => {
            md += `**${m.role === 'user' ? 'Student' : 'Assistant'}:**\n${m.content}\n\n`;
        });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([md], { type: 'text/markdown' }));
        a.download = `helpdesk_${Date.now()}.md`;
        a.click();
    });

    // Clear
    document.getElementById('clearBtn').addEventListener('click', () => {
        clearConfirmInput.value = '';
        clearErr.style.display = 'none';
        clearModal.classList.add('open');
        clearConfirmInput.focus();
    });
    document.getElementById('closeClear').addEventListener('click', () => clearModal.classList.remove('open'));
    document.getElementById('cancelClear').addEventListener('click', () => clearModal.classList.remove('open'));
    document.getElementById('confirmClear').addEventListener('click', async () => {
        if (clearConfirmInput.value.trim().toUpperCase() !== 'DELETE') {
            clearErr.style.display = 'block';
            clearModal.querySelector('.modal').classList.remove('shake');
            void clearModal.querySelector('.modal').offsetWidth;
            clearModal.querySelector('.modal').classList.add('shake');
            return;
        }
        chatHistory = [];
        await clearChatHistory();
        renderHistory();
        clearModal.classList.remove('open');
    });

    // Settings open
    const openSettings = () => {
        apiKeyInput.value = apiKey;
        apiStatus.textContent = '';
        apiStatus.className = 'api-status';
        if (fetchedModels.length > 0) {
            populateModelDropdown(fetchedModels);
        } else if (apiKey) {
            loadModels(apiKey);
        } else {
            setModelDropdownLoading('Enter an API key to load models...');
        }
        settingsModal.classList.add('open');
        apiKeyInput.focus();
    };

    document.getElementById('settingsBtn').addEventListener('click', openSettings);
    document.getElementById('topbarSettingsBtn').addEventListener('click', openSettings);
    document.getElementById('closeSettings').addEventListener('click', () => settingsModal.classList.remove('open'));

    // API key input — debounce fetch
    let debounce;
    apiKeyInput.addEventListener('input', () => {
        clearTimeout(debounce);
        const key = apiKeyInput.value.trim();
        if (!key) {
            setModelDropdownLoading('Enter an API key to load models...');
            apiStatus.textContent = '';
            return;
        }
        debounce = setTimeout(() => loadModels(key), 600);
    });

    // Validate button
    validateBtn.addEventListener('click', async () => {
        const key = apiKeyInput.value.trim();
        if (!key) { apiStatus.className = 'api-status err'; apiStatus.textContent = 'Enter an API key first.'; return; }
        validateBtn.textContent = 'Loading...';
        validateBtn.disabled = true;
        await loadModels(key);
        validateBtn.textContent = 'Validate & Load Models';
        validateBtn.disabled = false;
    });

    // Save settings
    saveBtn.addEventListener('click', () => {
        const key = apiKeyInput.value.trim();
        const model = modelSelect.value;

        apiKey = key;
        modelId = model;

        key ? localStorage.setItem('helpdesk_key', key) : localStorage.removeItem('helpdesk_key');
        model ? localStorage.setItem('helpdesk_model', model) : localStorage.removeItem('helpdesk_model');

        updateStatusBar();
        settingsModal.classList.remove('open');
    });

    // Mobile menu
    document.getElementById('menuBtn')?.addEventListener('click', () => sidebar.classList.toggle('open'));

    // Close modals on overlay click
    settingsModal.addEventListener('click', e => { if (e.target === settingsModal) settingsModal.classList.remove('open'); });
    clearModal.addEventListener('click', e => { if (e.target === clearModal) clearModal.classList.remove('open'); });

    // Escape
    window.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
            settingsModal.classList.remove('open');
            clearModal.classList.remove('open');
        }
    });
}

init();
