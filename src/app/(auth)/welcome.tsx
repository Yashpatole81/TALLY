import { router } from 'expo-router';
import { View } from 'react-native';

import { Button } from '@/components/ui/button';
import { InfoChip } from '@/components/ui/info-chip';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { isSupabaseConfigured } from '@/lib/supabase';

export default function Welcome() {
  return (
    <Screen
      scroll={false}
      footer={
        <View className="gap-2">
          <Button label="Get Started" onPress={() => router.push('/sign-up')} />
          <Button variant="link" label="I already have an account" onPress={() => router.push('/sign-in')} />
        </View>
      }>
      <View className="mt-8 flex-row items-center gap-4">
        {/* The logo isn't designed yet (the Figma shows a "LOGO" placeholder). */}
        <View className="h-11 w-11 items-center justify-center rounded-chip border border-line bg-surface">
          <Text variant="section">T</Text>
        </View>
        <Text variant="section">Tally</Text>
      </View>
      <View className="flex-1 justify-center">
        <Text variant="hero" accessibilityRole="header">
          Your money.{'\n'}Your month.
        </Text>
        <Text variant="body" tone="muted" className="mt-5 max-w-[320px]">
          A simpler way to manage your salary and monthly spending.
        </Text>
        {!isSupabaseConfigured && __DEV__ ? (
          <View className="mt-8">
            <InfoChip title="Backend not connected">
              Copy .env.example to .env, add your Supabase URL and publishable key, then restart Expo.
            </InfoChip>
          </View>
        ) : null}
      </View>
    </Screen>
  );
}
