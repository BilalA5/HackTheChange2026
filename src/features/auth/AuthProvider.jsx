import { useCallback, useEffect, useMemo, useState } from 'react';
import * as authService from '@/services/auth.js';
import { AuthContext } from './auth-context.js';

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    authService.getSession().then((session) => {
      if (!active) return;
      setUser(session);
      setReady(true);
    });
    return () => {
      active = false;
    };
  }, []);

  const signIn = useCallback(async (details) => {
    const signedIn = await authService.signIn(details);
    setUser(signedIn);
    return signedIn;
  }, []);

  const signOut = useCallback(async () => {
    await authService.signOut();
    setUser(null);
  }, []);

  const updateUser = useCallback(async (changes) => {
    const updated = await authService.updateUser(changes);
    setUser(updated);
    return updated;
  }, []);

  const value = useMemo(
    () => ({ user, ready, signIn, signOut, updateUser }),
    [user, ready, signIn, signOut, updateUser],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}
