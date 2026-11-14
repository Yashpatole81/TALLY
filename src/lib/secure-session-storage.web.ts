import type { secureSessionStorage as nativeStorage } from './secure-session-storage';

/**
 * Web build of the Supabase session storage. Browsers have no keychain, and expo-secure-store has
 * no web implementation, so the session lives in `localStorage` (supabase-js's own web default).
 *
 * This is weaker than the phone: any script running on this origin can read the tokens. Tally
 * loads no third-party scripts, and logging out removes them. `localStorage` (not
 * `sessionStorage`) because email links open in a new tab, and that tab needs the PKCE verifier.
 */
export const secureSessionStorage: typeof nativeStorage = {
  getItem: async (key) => globalThis.localStorage.getItem(key),
  setItem: async (key, value) => {
    globalThis.localStorage.setItem(key, value);
  },
  removeItem: async (key) => {
    globalThis.localStorage.removeItem(key);
  },
};
