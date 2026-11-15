import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

import { requireSupabase } from './supabase';

WebBrowser.maybeCompleteAuthSession();

/** Deep-link targets. Add both to Supabase → Authentication → URL Configuration → Redirect URLs. */
export const AUTH_CALLBACK_PATH = 'auth/callback';
export const PASSWORD_RESET_PATH = 'auth/reset';

export function redirectUrl(path: string): string {
  const cleanPath = path.replace(/^\/+/, '');
  const hostUri = Constants.expoConfig?.hostUri;

  // In Expo Go, deep links require the dev server host and the '/--/' prefix
  // e.g. exp://192.168.1.42:8081/--/auth/callback
  if (Constants.expoGoConfig || hostUri) {
    if (hostUri) {
      return `exp://${hostUri}/--/${cleanPath}`;
    }
    if (Constants.linkingUri) {
      const base = Constants.linkingUri.replace(/\/--($|\/.*$)/, '').replace(/\/+$/, '');
      return `${base}/--/${cleanPath}`;
    }
  }

  // Standalone APK (EAS build) or production build: uses custom scheme (e.g. tally://auth/callback)
  return Linking.createURL(cleanPath);
}

export async function signInWithEmail(email: string, password: string): Promise<void> {
  const { error } = await requireSupabase().auth.signInWithPassword({ email, password });
  if (error) throw error;
}

/** @returns needsConfirmation when the project requires email confirmation (no session yet). */
export async function signUpWithEmail(
  fullName: string,
  email: string,
  password: string
): Promise<{ needsConfirmation: boolean }> {
  const { data, error } = await requireSupabase().auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName }, emailRedirectTo: redirectUrl(AUTH_CALLBACK_PATH) },
  });
  if (error) throw error;
  return { needsConfirmation: !data.session };
}

export async function resendSignUpEmail(email: string): Promise<void> {
  const { error } = await requireSupabase().auth.resend({
    type: 'signup',
    email,
    options: { emailRedirectTo: redirectUrl(AUTH_CALLBACK_PATH) },
  });
  if (error) throw error;
}

export async function sendPasswordReset(email: string): Promise<void> {
  const { error } = await requireSupabase().auth.resetPasswordForEmail(email, {
    redirectTo: redirectUrl(PASSWORD_RESET_PATH),
  });
  if (error) throw error;
}

export async function updatePassword(password: string): Promise<void> {
  const { error } = await requireSupabase().auth.updateUser({ password });
  if (error) throw error;
}

/**
 * Google sign-in (PKCE). On a phone it runs in a system auth browser session and resolves
 * 'cancelled' if the user backs out. On web this tab goes to Google and comes back on
 * /auth/callback, so it resolves 'redirected' while the page is leaving.
 */
export async function signInWithGoogle(): Promise<'success' | 'cancelled' | 'redirected'> {
  const client = requireSupabase();
  const redirectTo = redirectUrl(AUTH_CALLBACK_PATH);
  console.log('[AUTH] >>> Starting Google Sign-In...');
  console.log('[AUTH] App Redirect URL (redirectTo):', redirectTo);

  const { data, error } = await client.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo, skipBrowserRedirect: true },
  });
  if (error) {
    console.error('[AUTH] signInWithOAuth error:', error);
    throw error;
  }
  console.log('[AUTH] Supabase OAuth URL:', data.url);
  if (!data.url) throw new Error('No OAuth URL returned');
  if (Platform.OS === 'web') {
    // Not a popup: the popup would load the whole app on /auth/callback, and both windows would
    // try to exchange the same one-time code.
    window.location.assign(data.url);
    return 'redirected';
  }
  console.log('[AUTH] Opening browser session with WebBrowser.openAuthSessionAsync...');
  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  console.log('[AUTH] WebBrowser result:', JSON.stringify(result));
  if (result.type !== 'success') {
    console.log('[AUTH] WebBrowser session ended without success. Type:', result.type);
    return 'cancelled';
  }
  console.log('[AUTH] WebBrowser returned URL:', result.url);
  await completeAuthFromUrl(result.url);
  console.log('[AUTH] >>> Google Sign-In SUCCESS!');
  return 'success';
}

/** Codes already exchanged. On Android the same redirect can arrive twice (auth session + deep link). */
const exchangedCodes = new Set<string>();

/**
 * Finishes an auth redirect (OAuth, email confirmation, password recovery) by exchanging its
 * PKCE `code`. The code verifier never leaves this device, so a leaked link is useless elsewhere.
 * @throws Error when the link carries an error or no usable code.
 */
export async function completeAuthFromUrl(url: string): Promise<void> {
  const { queryParams } = Linking.parse(url);
  await completeAuthWithCode(
    typeof queryParams?.code === 'string' ? queryParams.code : undefined,
    queryParams?.error_description ?? queryParams?.error
  );
}

export async function completeAuthWithCode(code: string | undefined, linkError?: unknown): Promise<void> {
  console.log('[AUTH] completeAuthWithCode called.');
  if (linkError) {
    console.error('[AUTH] Link error received:', linkError);
    throw new Error(String(linkError));
  }
  if (!code) {
    console.error('[AUTH] No code found in redirect URL.');
    throw new Error('This link is invalid or has expired.');
  }
  if (exchangedCodes.has(code)) {
    console.log('[AUTH] Code already exchanged, skipping duplicate.');
    return;
  }
  exchangedCodes.add(code);
  console.log('[AUTH] Exchanging PKCE code with Supabase...');
  const { data, error } = await requireSupabase().auth.exchangeCodeForSession(code);
  if (error) {
    console.error('[AUTH] exchangeCodeForSession failed:', error);
    exchangedCodes.delete(code);
    throw error;
  }
  console.log('[AUTH] Session exchanged successfully for user:', data.user?.email);
}

/**
 * Revokes the session on the server when reachable. Either way, the session is removed from this
 * device. (A failed global sign-out alone would leave tokens stored locally.)
 */
export async function signOutRemote(): Promise<void> {
  const client = requireSupabase();
  const { error } = await client.auth.signOut();
  if (error) {
    const local = await client.auth.signOut({ scope: 'local' });
    if (local.error) throw local.error;
  }
}
