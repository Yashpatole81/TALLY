import { router } from 'expo-router';
import { X } from 'lucide-react-native';
import { useState } from 'react';
import { Linking, Pressable, Switch, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { setNotificationsEnabled } from '@/data/actions';
import { useProfile } from '@/data/hooks';
import { todayISO } from '@/domain/dates';
import { haptics } from '@/lib/haptics';
import { remindersSupported } from '@/lib/notifications';
import { useUserId } from '@/stores/session-store';
import { colors } from '@/theme/tokens';

/** Salary reminder toggle (form sheet). Reminders are local notifications, scheduled on this device. */
export default function NotificationsSheet() {
  const userId = useUserId();
  const profile = useProfile(userId).data;
  const [denied, setDenied] = useState(false);
  const [busy, setBusy] = useState(false);
  if (!userId || !profile) return null;

  const toggle = async (enabled: boolean) => {
    setBusy(true);
    try {
      const ok = await setNotificationsEnabled(userId, enabled, todayISO());
      setDenied(!ok);
      if (ok) haptics.selection();
    } finally {
      setBusy(false);
    }
  };

  return (
    <View className="flex-1 bg-surface px-6 pt-6">
      <View className="flex-row items-center justify-between">
        <Text variant="greeting" accessibilityRole="header">
          Notifications
        </Text>
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Close"
          className="h-9 w-9 items-center justify-center rounded-full bg-canvas">
          <X size={18} color={colors.ink} strokeWidth={1.8} />
        </Pressable>
      </View>
      <Card className="mt-6 flex-row items-center px-5 py-4">
        <View className="flex-1 pr-4">
          <Text variant="body">Salary reminders</Text>
          <Text variant="caption" className="mt-1">
            A note at 9:00 on payday when your next budget is ready.
          </Text>
        </View>
        <Switch
          value={profile.notificationsEnabled}
          onValueChange={(value) => void toggle(value)}
          disabled={busy || !remindersSupported}
          trackColor={{ true: colors.ink, false: colors.line }}
          thumbColor={colors.surface}
          ios_backgroundColor={colors.line}
          accessibilityLabel="Salary reminders"
        />
      </Card>
      {!remindersSupported ? (
        <Text variant="message" className="mt-4">
          Payday reminders work in the Android and iOS app. Browsers can’t schedule them.
        </Text>
      ) : denied ? (
        <View className="mt-4 gap-3">
          <Text variant="message">Notifications are turned off for Tally. Allow them in your phone’s settings.</Text>
          <Button variant="secondary" label="Open Settings" onPress={() => void Linking.openSettings()} />
        </View>
      ) : null}
    </View>
  );
}
