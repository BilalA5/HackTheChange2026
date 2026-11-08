import { api, call } from './backend.js';
import { readJSON, removeKey, removeKeysStartingWith, writeJSON } from './storage.js';

const keyFor = ({ userId, stopId, persona }) => `chat.${userId}.${stopId}.${persona}`;

export function loadConversation(thread) {
  return call('query', api.conversations.get, thread, () => readJSON(keyFor(thread)));
}

export function saveConversation(thread, messages) {
  return call('mutation', api.conversations.save, { ...thread, messages }, () => writeJSON(keyFor(thread), messages));
}

export function clearConversation(thread) {
  return call('mutation', api.conversations.clear, thread, () => removeKey(keyFor(thread)));
}

export function clearAllConversations(userId) {
  return call('mutation', api.conversations.clearAll, { userId }, () => removeKeysStartingWith(`chat.${userId}.`));
}
