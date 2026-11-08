import { readJSON, removeKey, writeJSON } from './storage.js';

const SESSION_KEY = 'session';
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const toId = (email) => email.trim().toLowerCase();

/**
 * Local stand-in for the auth API. Every function is async so a backend can replace the bodies
 * without touching the callers.
 */
export async function getSession() {
  return readJSON(SESSION_KEY);
}

export async function signIn({ name, email }) {
  const cleanName = name.trim();
  if (!cleanName) throw new Error('Tell us your name.');
  if (!EMAIL_PATTERN.test(email.trim())) throw new Error('That email doesn’t look right.');

  const id = toId(email);
  const known = readJSON(`users.${id}`);
  const user = { id, name: cleanName, email: email.trim(), onboarded: known?.onboarded ?? false };
  writeJSON(`users.${id}`, user);
  writeJSON(SESSION_KEY, user);
  return user;
}

export async function updateUser(changes) {
  const session = readJSON(SESSION_KEY);
  if (!session) throw new Error('Not signed in.');
  const user = { ...session, ...changes };
  writeJSON(`users.${user.id}`, user);
  writeJSON(SESSION_KEY, user);
  return user;
}

export async function signOut() {
  removeKey(SESSION_KEY);
}
