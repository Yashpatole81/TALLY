import { useLocalSearchParams } from 'expo-router';

import { EmailSent } from '@/components/email-sent';
import { resendSignUpEmail } from '@/lib/auth';

/** Shown after sign-up when the Supabase project requires email confirmation. */
export default function CheckEmail() {
  const { email = '' } = useLocalSearchParams<{ email?: string }>();
  return (
    <EmailSent
      title="Confirm your email."
      lead="We’ve sent a confirmation link to:"
      email={email}
      instructions="Open the link on this phone to finish creating your account."
      onResend={() => resendSignUpEmail(email)}
    />
  );
}
