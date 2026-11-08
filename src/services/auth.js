import { api, call } from './backend.js';
import { readJSON, removeKey, writeJSON } from './storage.js';

const SESSION_KEY = 'session';
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const toId = (email) => email.trim().toLowerCase();

function remember(user) {
  writeJSON(SESSION_KEY, user);
  return user;
}

export async function getSession() {
  const session = readJSON(SESSION_KEY);
  if (!session) return null;
  try {
    const user = await call('query', api.users.get, { id: session.id }, () => readJSON(`users.${session.id}`));
    return user ? remember(user) : session;
  } catch {
    return session;
  }
}

export async function signIn({ name, email }) {
  const cleanName = name.trim();
  if (!cleanName) throw new Error('Tell us your name.');
  if (!EMAIL_PATTERN.test(email.trim())) throw new Error('That email doesn’t look right.');

  const id = toId(email);
  const user = await call('mutation', api.users.signIn, { id, name: cleanName, email: email.trim() }, () => {
    const known = readJSON(`users.${id}`);
    const local = { id, name: cleanName, email: email.trim(), onboarded: known?.onboarded ?? false };
    writeJSON(`users.${id}`, local);
    return local;
  });
  return remember(user);
}

export async function updateUser(changes) {
  const session = readJSON(SESSION_KEY);
  if (!session) throw new Error('Not signed in.');
  const user = await call('mutation', api.users.update, { id: session.id, changes }, () => {
    const local = { ...session, ...changes };
    writeJSON(`users.${local.id}`, local);
    return local;
  });
  return remember(user);
}

export async function signOut() {
  removeKey(SESSION_KEY);
}
