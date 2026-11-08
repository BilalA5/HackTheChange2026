import { readJSON, removeKey, writeJSON } from './storage.js';

const keyFor = ({ userId, scenarioId, persona }) => `chat.${userId}.${scenarioId}.${persona}`;

export function loadConversation(thread) {
  return readJSON(keyFor(thread));
}

export function saveConversation(thread, messages) {
  writeJSON(keyFor(thread), messages);
}

export function clearConversation(thread) {
  removeKey(keyFor(thread));
}
