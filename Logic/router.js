/**
 * Chat router — passes the conversation to Gemini API.
 * No predefined answers, no fake data.
 */

import { askGemini } from './fetchAPI.js';
import { systemPrompt } from './systemPrompt.js';

/**
 * Routes a student query to Gemini.
 *
 * @param {Object} opts
 * @param {string}  opts.apiKey
 * @param {string}  opts.modelId
 * @param {Array}   opts.chatHistory  — full history including current user message
 * @param {Function} onResponse       — callback(content, isError, rawError, source)
 */
export async function routeStudentQuery({ apiKey, modelId, chatHistory }, onResponse) {
    if (!apiKey || !apiKey.trim()) {
        onResponse(
            '**No Gemini API key configured.**\n\nOpen **Settings ⚙️**, paste your free key from [Google AI Studio](https://aistudio.google.com/app/apikey), and save.',
            true, null, 'no_key'
        );
        return;
    }

    const result = await askGemini(apiKey, modelId, chatHistory, systemPrompt);

    if (result.success) {
        onResponse(result.content, false, null, 'gemini');
    } else {
        onResponse(`**Error:** ${result.error}`, true, result.rawError, 'gemini_error');
    }
}
