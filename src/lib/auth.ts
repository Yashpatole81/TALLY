import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

import { requireSupabase } from './supabase';

WebBrowser.maybeCompleteAuthSession();

/** Deep-link targets. Add both to Supabase → Authentication → URL Configuration → Redirect URLs. */
export const AUTH_CALLBACK_PATH = 'auth/callback';
export const PASSWORD_RESET_PATH = 'auth/reset';

export function redirectUrl(path: string): string {
  return Linking.createURL(path);
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
  const { data, error } = await client.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo, skipBrowserRedirect: true },
  });
  if (error) throw error;
  if (!data.url) throw new Error('No OAuth URL returned');
  if (Platform.OS === 'web') {
    // Not a popup: the popup would load the whole app on /auth/callback, and both windows would
    // try to exchange the same one-time code.
    window.location.assign(data.url);
    return 'redirected';
  }
  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type !== 'success') return 'cancelled';
  await completeAuthFromUrl(result.url);
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
  if (linkError) throw new Error(String(linkError));
  if (!code) throw new Error('This link is invalid or has expired.');
  if (exchangedCodes.has(code)) return;
  exchangedCodes.add(code);
  const { error } = await requireSupabase().auth.exchangeCodeForSession(code);
  if (error) {
    exchangedCodes.delete(code);
    throw error;
  }
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
