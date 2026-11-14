import { AuthLinkHandler } from '@/components/auth-link-handler';

/** Email confirmation and Google OAuth redirect target. */
export default function AuthCallback() {
  return <AuthLinkHandler next="/" />;
}
