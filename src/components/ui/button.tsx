import { ActivityIndicator, View } from 'react-native';

import { colors } from '@/theme/tokens';

import { PressableScale } from './pressable-scale';
import { Text } from './text';

type Variant = 'primary' | 'secondary' | 'link';

export interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  /** Placement in the parent (e.g. "flex-1", "mt-3"). */
  className?: string;
  accessibilityHint?: string;
}

const BOX: Record<Variant, string> = {
  primary: 'h-12 rounded-control bg-ink',
  secondary: 'h-12 rounded-control border border-line bg-surface',
  link: 'h-11',
};

/** 48pt buttons with 14pt corners (Figma "Onboarding UI kit"). */
export function Button({
  label,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  icon,
  className,
  accessibilityHint,
}: ButtonProps) {
  const inactive = disabled || loading;
  return (
    <PressableScale
      onPress={() => onPress()}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: inactive, busy: loading }}
      containerClassName={className}
      className={`${BOX[variant]} flex-row items-center justify-center px-5 ${disabled ? 'opacity-40' : ''}`}>
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? colors.onInk : colors.ink} />
      ) : (
        <View className="flex-row items-center gap-3">
          {icon}
          <Text variant="bodyMedium" tone={variant === 'primary' ? 'inverse' : 'ink'}>
            {label}
          </Text>
        </View>
      )}
    </PressableScale>
  );
}
