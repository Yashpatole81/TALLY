import type { Session } from '@supabase/supabase-js';
import { create } from 'zustand';

import { supabase } from '@/lib/supabase';

export type SessionStatus = 'loading' | 'signedOut' | 'signedIn';

interface SessionState {
  status: SessionStatus;
  session: Session | null;
  setSession: (session: Session | null) => void;
}

export const useSessionStore = create<SessionState>()((set) => ({
  status: 'loading',
  session: null,
  setSession: (session) => set({ session, status: session ? 'signedIn' : 'signedOut' }),
}));

/** Current user's id, or undefined when signed out. */
export const useUserId = () => useSessionStore((state) => state.session?.user.id);

/** True while `userId` is still the signed-in user (background work checks this before writing). */
export const isCurrentUser = (userId: string) => useSessionStore.getState().session?.user.id === userId;

/**
 * Mirrors Supabase auth state into the store. The listener only sets state: calling other
 * Supabase methods inside it can deadlock the auth client.
 * @returns unsubscribe function
 */
export function startSessionListener(): () => void {
  const { setSession } = useSessionStore.getState();
  if (!supabase) {
    setSession(null);
    return () => undefined;
  }
  supabase.auth
    .getSession()
    .then(({ data }) => setSession(data.session))
    .catch(() => setSession(null));
  const { data } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
  return () => data.subscription.unsubscribe();
}
