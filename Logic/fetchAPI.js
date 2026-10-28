/**
 * Gemini API Handler — native fetch(), no SDK.
 */

const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';

/**
 * Dynamically fetches all supported generative models for an API key.
 * @param {string} apiKey
 * @returns {Promise<{success: boolean, models?: Array<{id: string, name: string}>, error?: string}>}
 */
export async function fetchGeminiModels(apiKey) {
    if (!apiKey || !apiKey.trim()) {
        return { success: false, error: 'No API key provided.' };
    }

    try {
        const response = await fetch(
            `${GEMINI_BASE_URL}/models?key=${encodeURIComponent(apiKey.trim())}`,
            { method: 'GET', headers: { 'Content-Type': 'application/json' } }
        );

        if (response.ok) {
            const data = await response.json();
            const models = (data.models || [])
                .filter(m => m.supportedGenerationMethods?.includes('generateContent'))
                .map(m => ({
                    id: m.name.replace('models/', ''),
                    name: m.displayName || m.name.replace('models/', '')
                }))
                .sort((a, b) => {
                    // Flash models first, then by name descending (newer first)
                    const aFlash = a.id.includes('flash') ? 0 : 1;
                    const bFlash = b.id.includes('flash') ? 0 : 1;
                    if (aFlash !== bFlash) return aFlash - bFlash;
                    return b.id.localeCompare(a.id);
                });

            return { success: true, models };
        } else {
            const err = await response.json().catch(() => ({}));
            return { success: false, error: err.error?.message || `HTTP ${response.status}` };
        }
    } catch (e) {
        return { success: false, error: 'Network error. Check your connection.' };
    }
}

/**
 * Sends the conversation history to Gemini and returns the reply.
 * @param {string} apiKey
 * @param {string} modelId
 * @param {Array<{role: 'user'|'ai', content: string}>} history
 * @param {string} [systemPrompt]
 * @returns {Promise<{success: boolean, content?: string, error?: string, rawError?: string}>}
 */
export async function askGemini(apiKey, modelId, history, systemPrompt) {
    if (!apiKey) return { success: false, error: 'No Gemini API key configured.' };

    const model = (modelId || '').trim();
    const endpoint = `${GEMINI_BASE_URL}/models/${model}:generateContent?key=${encodeURIComponent(apiKey.trim())}`;

    // Map history to Gemini's role format
    const contents = history
        .filter(m => m.content && typeof m.content === 'string')
        .map(m => ({
            role: m.role === 'user' ? 'user' : 'model',
            parts: [{ text: m.content }]
        }));

    if (contents.length === 0) return { success: false, error: 'No message content.' };

    const payload = {
        contents,
        generationConfig: { temperature: 0.7, topP: 0.95, maxOutputTokens: 2048 }
    };

    if (systemPrompt) {
        payload.systemInstruction = { parts: [{ text: systemPrompt }] };
    }

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            const data = await response.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) return { success: true, content: text };

            if (data.candidates?.[0]?.finishReason === 'SAFETY') {
                return { success: false, error: 'Response blocked by safety filters. Try rephrasing.', rawError: JSON.stringify(data.candidates[0]) };
            }
            return { success: false, error: 'Gemini returned an empty response.', rawError: JSON.stringify(data) };
        } else {
            const err = await response.json().catch(() => ({}));
            return { success: false, error: err.error?.message || `HTTP ${response.status}`, rawError: JSON.stringify(err) };
        }
    } catch (e) {
        return { success: false, error: 'Network request failed.', rawError: String(e) };
    }
}
