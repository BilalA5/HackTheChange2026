import { createContext, use } from 'react';

export const AuthContext = createContext(null);

export function useAuth() {
  const auth = use(AuthContext);
  if (!auth) throw new Error('useAuth must be used inside AuthProvider');
  return auth;
}

export function homePathFor(user) {
  return user.onboarded ? '/app' : '/onboarding';
}
