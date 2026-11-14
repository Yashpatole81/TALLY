import { ConfigurationError } from './supabase';

/**
 * Maps backend/auth errors to short, calm copy. Raw server messages are not shown verbatim,
 * since they can be noisy or leak internals.
 */
export function friendlyError(error: unknown): string {
  if (error instanceof ConfigurationError) return error.message;
  const message = error instanceof Error ? error.message : typeof error === 'string' ? error : '';
  const code = (error as { code?: unknown } | null)?.code;
  const text = `${typeof code === 'string' ? code : ''} ${message}`.toLowerCase();

  if (text.includes('invalid login credentials') || text.includes('invalid_credentials')) {
    return 'That email and password don’t match.';
  }
  if (text.includes('email not confirmed') || text.includes('email_not_confirmed')) {
    return 'Confirm your email first. Check your inbox for the link.';
  }
  if (text.includes('already registered') || text.includes('user_already_exists')) {
    return 'An account with this email already exists. Try signing in.';
  }
  if (text.includes('rate limit') || text.includes('over_email_send_rate_limit') || text.includes('429')) {
    return 'Too many attempts. Wait a minute and try again.';
  }
  if (text.includes('weak') && text.includes('password')) {
    return 'Choose a stronger password.';
  }
  if (text.includes('network') || text.includes('fetch') || text.includes('timed out')) {
    return 'Can’t reach Tally right now. Check your connection.';
  }
  return 'Something went wrong. Please try again.';
}
