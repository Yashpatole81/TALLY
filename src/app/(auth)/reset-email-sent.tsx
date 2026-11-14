import { useLocalSearchParams } from 'expo-router';

import { EmailSent } from '@/components/email-sent';
import { sendPasswordReset } from '@/lib/auth';

export default function ResetEmailSent() {
  const { email = '' } = useLocalSearchParams<{ email?: string }>();
  return (
    <EmailSent
      title="Check your inbox."
      lead="We’ve sent a password reset link to:"
      email={email}
      instructions="Follow the link in your email to choose a new password."
      onResend={() => sendPasswordReset(email)}
    />
  );
}
