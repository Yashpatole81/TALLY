import { AuthLinkHandler } from '@/components/auth-link-handler';

/** Password recovery link target. After the code exchange the user picks a new password. */
export default function AuthReset() {
  return <AuthLinkHandler next="/new-password" />;
}
