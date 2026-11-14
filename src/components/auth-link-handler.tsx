import { type Href, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { completeAuthWithCode } from '@/lib/auth';
import { colors } from '@/theme/tokens';

import { Button } from './ui/button';
import { Screen, ScreenTitle } from './ui/screen';

/**
 * Landing route for auth deep links (tally://auth/…?code=…). Exchanges the PKCE code, then
 * continues to `next`. Link error text is never displayed: query params are attacker-controlled.
 */
export function AuthLinkHandler({ next }: { next: Href }) {
  const params = useLocalSearchParams<{ code?: string; error?: string; error_description?: string }>();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    completeAuthWithCode(params.code, params.error ?? params.error_description)
      .then(() => {
        if (active) router.replace(next);
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
    };
  }, [params.code, params.error, params.error_description, next]);

  if (!failed) {
    return (
      <View className="flex-1 items-center justify-center bg-canvas" accessibilityLabel="Signing you in">
        <ActivityIndicator color={colors.ink} />
      </View>
    );
  }
  return (
    <Screen scroll={false} footer={<Button label="Back to Tally" onPress={() => router.replace('/')} />}>
      <ScreenTitle
        title="That link didn’t work."
        subtitle="It may have expired or already been used. Request a new one and open it on this phone."
        className="mt-16"
      />
    </Screen>
  );
}
