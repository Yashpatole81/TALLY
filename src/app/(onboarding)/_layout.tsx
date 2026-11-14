import { Stack } from 'expo-router';

import { colors } from '@/theme/tokens';

export const unstable_settings = { anchor: 'personal-details' };

export default function OnboardingLayout() {
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.canvas } }} />;
}
