import { router } from 'expo-router';
import { Mail } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { friendlyError } from '@/lib/errors';
import { haptics } from '@/lib/haptics';
import { colors } from '@/theme/tokens';

import { Button } from './ui/button';
import { FieldMessage } from './ui/field-message';
import { BackHeader, Screen } from './ui/screen';
import { Text } from './ui/text';

const RESEND_COOLDOWN_SECONDS = 30;

interface EmailSentProps {
  title: string;
  lead: string;
  email: string;
  instructions: string;
  onResend: () => Promise<void>;
}

/** "Check your inbox." layout (Figma Reset Email Sent), reused for sign-up confirmation. */
export function EmailSent({ title, lead, email, instructions, onResend }: EmailSentProps) {
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string>();

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const resend = async () => {
    setBusy(true);
    setMessage(undefined);
    try {
      await onResend();
      haptics.success();
      setMessage('Sent again. It can take a minute to arrive.');
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (error) {
      haptics.error();
      setMessage(friendlyError(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen
      scroll={false}
      footer={
        <View className="items-center gap-1">
          <Text variant="message" tone="muted">
            No email yet? Check your spam folder.
          </Text>
          <Button
            variant="link"
            label={cooldown > 0 ? `Resend Email (${cooldown}s)` : 'Resend Email'}
            disabled={cooldown > 0}
            loading={busy}
            onPress={resend}
          />
          <Button label="Back to Sign In" onPress={() => router.replace('/sign-in')} className="mt-2 self-stretch" />
        </View>
      }>
      <BackHeader />
      <View className="mt-12 h-14 w-14 items-center justify-center rounded-control bg-surface">
        <Mail size={24} color={colors.ink} strokeWidth={1.6} />
      </View>
      <Text variant="title" className="mt-8" accessibilityRole="header">
        {title}
      </Text>
      <Text variant="subtitle" className="mt-2">
        {lead}
      </Text>
      <Text variant="body" className="mt-6" selectable>
        {email}
      </Text>
      <Text variant="subtitle" className="mt-6">
        {instructions}
      </Text>
      <FieldMessage message={message} />
    </Screen>
  );
}
