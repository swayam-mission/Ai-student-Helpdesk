/**
 * IndexedDB — persists single chat session.
 */

const DB_NAME = 'StudentHelpdeskDB';
const DB_VERSION = 1;
const STORE_NAME = 'chatHistory';

function openDB() {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = e => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

export async function saveChatHistory(history) {
    try {
        const db = await openDB();
        await new Promise((resolve, reject) => {
            const tx = db.transaction([STORE_NAME], 'readwrite');
            const req = tx.objectStore(STORE_NAME).put({ id: 'session', history });
            req.onsuccess = resolve;
            req.onerror = () => reject(req.error);
        });
    } catch (e) {
        console.error('IndexedDB save error:', e);
    }
}

export async function loadChatHistory() {
    try {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction([STORE_NAME], 'readonly');
            const req = tx.objectStore(STORE_NAME).get('session');
            req.onsuccess = () => resolve(req.result?.history || []);
            req.onerror = () => reject(req.error);
        });
    } catch (e) {
        return [];
    }
}

export async function clearChatHistory() {
    try {
        const db = await openDB();
        await new Promise((resolve, reject) => {
            const tx = db.transaction([STORE_NAME], 'readwrite');
            const req = tx.objectStore(STORE_NAME).delete('session');
            req.onsuccess = resolve;
            req.onerror = () => reject(req.error);
        });
    } catch (e) {
        console.error('IndexedDB clear error:', e);
    }
}
