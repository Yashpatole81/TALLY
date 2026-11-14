import { Image, Pressable, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { haptics } from '@/lib/haptics';
import { colors } from '@/theme/tokens';

import { Text } from './text';

/** Hairline "OR" separator between Google and email sign-in. */
export function OrDivider() {
  return (
    <View
      className="my-5 flex-row items-center gap-4"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants">
      <View className="h-px flex-1 bg-line" />
      <Text variant="small">OR</Text>
      <View className="h-px flex-1 bg-line" />
    </View>
  );
}

/** Monochrome Google "G" as drawn in the Figma (Lucide ships no brand marks). */
export function GoogleMark({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessibilityElementsHidden>
      <Path
        fill={colors.ink}
        d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
      />
    </Svg>
  );
}

/** Round avatar: the photo when present, otherwise the first initial. */
export function Avatar({ name, uri, size = 64 }: { name: string; uri?: string | null; size?: number }) {
  const initial = name.trim().charAt(0).toUpperCase() || '·';
  return (
    <View
      style={{ width: size, height: size }}
      className="items-center justify-center overflow-hidden rounded-full border border-line bg-surface">
      {uri ? (
        <Image source={{ uri }} style={{ width: size, height: size }} accessibilityIgnoresInvertColors />
      ) : (
        <Text variant="initial">{initial}</Text>
      )}
    </View>
  );
}

/** Selectable pill used for categories and income sources. */
export function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={() => {
        haptics.selection();
        onPress();
      }}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      hitSlop={{ top: 4, bottom: 4 }}
      className={`h-9 items-center justify-center rounded-full px-4 ${
        selected ? 'bg-ink' : 'border border-line bg-surface'
      }`}>
      <Text variant="label" tone={selected ? 'inverse' : 'ink'}>
        {label}
      </Text>
    </Pressable>
  );
}

/** Calm empty state for lists and charts. */
export function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <View className="items-center rounded-card border border-line bg-surface px-6 py-8">
      <Text variant="bodyMedium" className="text-center">
        {title}
      </Text>
      <Text variant="subtitle" className="mt-1 text-center">
        {message}
      </Text>
    </View>
  );
}

/** Small uppercase heading above grouped cards ("SALARY & BUDGET"). */
export function SectionLabel({ children, className }: { children: string; className?: string }) {
  return (
    <Text variant="sectionLabel" className={`mb-3 ${className ?? ''}`} accessibilityRole="header">
      {children}
    </Text>
  );
}
