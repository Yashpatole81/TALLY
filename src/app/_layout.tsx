import '@/global.css';
import '@/theme/interop';

// Per-weight subpaths: the package root would bundle all 18 Inter files (~6 MB).
import { Inter_400Regular } from '@expo-google-fonts/inter/400Regular';
import { Inter_500Medium } from '@expo-google-fonts/inter/500Medium';
import { Inter_600SemiBold } from '@expo-google-fonts/inter/600SemiBold';
import { Inter_700Bold } from '@expo-google-fonts/inter/700Bold';
import { QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { type Href, type NativeStackNavigationOptions, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import * as WebBrowser from 'expo-web-browser';
import { useEffect } from 'react';

WebBrowser.maybeCompleteAuthSession();
import { ActivityIndicator, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useBootstrap } from '@/data/bootstrap';
import { useProfile } from '@/data/hooks';
import { queryClient } from '@/data/query-client';
import { startSessionListener, useSessionStore } from '@/stores/session-store';
import { colors } from '@/theme/tokens';

void SplashScreen.preventAutoHideAsync();

/** Native form sheet for Add/Edit transaction and small pickers (no JS-built sheets). */
const SHEET: NativeStackNavigationOptions = {
  presentation: 'formSheet',
  sheetAllowedDetents: [0.75, 1],
  sheetGrabberVisible: true,
  sheetCornerRadius: 24,
  contentStyle: { backgroundColor: colors.surface },
};

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold });
  useEffect(() => startSessionListener(), []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <StatusBar style="dark" />
          {fontsLoaded ? <RootNavigator /> : null}
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

/**
 * Route access is decided by session + onboarding state with Stack.Protected. Screens a guard
 * hides can't be reached, even by deep link. The splash stays up until the state is known.
 */
function RootNavigator() {
  const status = useSessionStore((state) => state.status);
  const user = useSessionStore((state) => state.session?.user);
  const fallbackName = typeof user?.user_metadata?.full_name === 'string' ? user.user_metadata.full_name : '';
  const boot = useBootstrap(user?.id, fallbackName);
  const profile = useProfile(user?.id);

  const signedIn = status === 'signedIn';
  const onboarded = Boolean(profile.data?.onboardedAt);
  const settled =
    status === 'signedOut' ||
    (signedIn &&
      ((boot.state === 'ready' && profile.isFetched) || boot.state === 'offline-empty' || boot.state === 'in-use'));
  // Where a blocked route sends you. By default it would be the (auth) or (onboarding) group
  // itself, and on web a group URL like /(auth) isn't a page ("Nothing here").
  const landing: Href = !signedIn ? '/welcome' : onboarded ? '/' : '/personal-details';

  useEffect(() => {
    if (settled) void SplashScreen.hideAsync();
  }, [settled]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.canvas } }}>
        <Stack.Protected guard={signedIn && onboarded} redirectTo={landing}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="add-transaction" options={SHEET} />
          <Stack.Screen name="notifications" options={SHEET} />
          <Stack.Screen name="transactions" />
          <Stack.Screen name="edit-profile" />
          <Stack.Screen name="edit-salary" />
          <Stack.Screen name="edit-goal" />
        </Stack.Protected>
        <Stack.Protected guard={signedIn && !onboarded} redirectTo={landing}>
          <Stack.Screen name="(onboarding)" />
        </Stack.Protected>
        <Stack.Protected guard={!signedIn} redirectTo={landing}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>
        <Stack.Protected guard={signedIn} redirectTo={landing}>
          <Stack.Screen name="new-password" />
        </Stack.Protected>
        <Stack.Screen name="auth/callback" />
        <Stack.Screen name="auth/reset" />
        <Stack.Screen name="+not-found" />
      </Stack>
      {signedIn && boot.state === 'offline-empty' ? (
        <RetryOverlay
          title="Can’t reach Tally."
          subtitle="Connect to the internet once so we can load your budget on this device."
          onRetry={boot.retry}
        />
      ) : null}
      {signedIn && boot.state === 'in-use' ? (
        <RetryOverlay
          title="Tally is open in another tab."
          subtitle="Your browser lets one tab at a time use Tally’s data. Close the other tab, then try again."
          // Web only. expo-sqlite's worker can't recover from the failed open, so reload the page.
          onRetry={() => globalThis.location.reload()}
        />
      ) : null}
      {/* Cover the stack until we know where this user belongs, so no screen flashes by: while the
          session loads (web has no splash screen) and right after sign-in, until we know whether
          this user is onboarded. */}
      {!settled ? <LoadingOverlay /> : null}
    </View>
  );
}

function LoadingOverlay() {
  return (
    <View
      style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: colors.canvas }}
      className="items-center justify-center"
      accessibilityLabel="Loading your budget"
      accessibilityViewIsModal>
      <ActivityIndicator color={colors.ink} />
    </View>
  );
}

function RetryOverlay({ title, subtitle, onRetry }: { title: string; subtitle: string; onRetry: () => void }) {
  return (
    <View
      style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: colors.canvas }}
      className="justify-center px-6"
      accessibilityViewIsModal>
      <Text variant="title">{title}</Text>
      <Text variant="subtitle" className="mb-8 mt-2">
        {subtitle}
      </Text>
      <Button label="Try Again" onPress={onRetry} />
    </View>
  );
}
