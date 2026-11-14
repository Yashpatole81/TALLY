import { ArrowLeft } from 'lucide-react-native';
import { router } from 'expo-router';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { type Edge, SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/theme/tokens';

import { Text } from './text';

interface ScreenProps {
  children: React.ReactNode;
  /** Pinned to the bottom, outside the scroll area (primary actions). */
  footer?: React.ReactNode;
  scroll?: boolean;
  edges?: Edge[];
  contentClassName?: string;
}

/** Canvas-colored screen with the 24pt margins from the UI kit. Forms avoid the keyboard. */
export function Screen({ children, footer, scroll = true, edges = ['top', 'bottom'], contentClassName }: ScreenProps) {
  const body = scroll ? (
    <ScrollView
      className="flex-1"
      contentContainerClassName={`px-6 pb-6 ${contentClassName ?? ''}`}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}>
      {children}
    </ScrollView>
  ) : (
    <View className={`flex-1 px-6 ${contentClassName ?? ''}`}>{children}</View>
  );
  return (
    <SafeAreaView edges={edges} className="flex-1 bg-canvas">
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {body}
        {footer ? <View className="px-6 pb-2 pt-3">{footer}</View> : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/** Back arrow plus an optional step counter ("2 of 4"). */
export function BackHeader({ step, onBack, right }: { step?: string; onBack?: () => void; right?: React.ReactNode }) {
  const canGoBack = router.canGoBack();
  return (
    <View className="h-14 flex-row items-center justify-between">
      {onBack || canGoBack ? (
        <Pressable
          onPress={onBack ?? (() => router.back())}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          className="-ml-2 h-11 w-11 items-center justify-center">
          <ArrowLeft size={24} color={colors.ink} strokeWidth={1.8} />
        </Pressable>
      ) : (
        <View />
      )}
      {step ? <Text variant="message" tone="muted">{step}</Text> : right ?? null}
    </View>
  );
}

/** Title + subtitle block used at the top of auth and onboarding screens. */
export function ScreenTitle({ title, subtitle, className }: { title: string; subtitle?: string; className?: string }) {
  return (
    <View className={`mt-6 ${className ?? ''}`}>
      <Text variant="title" accessibilityRole="header">
        {title}
      </Text>
      {subtitle ? (
        <Text variant="subtitle" className="mt-2">
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}
