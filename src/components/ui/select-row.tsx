import { ChevronRight } from 'lucide-react-native';
import { View } from 'react-native';

import { colors } from '@/theme/tokens';

import { PressableScale } from './pressable-scale';
import { Text } from './text';

interface SelectRowProps {
  label: string;
  value: string;
  onPress?: () => void;
  /** Points the chevron down when an inline picker is open. */
  expanded?: boolean;
  /** Placement in the parent. */
  className?: string;
  accessibilityHint?: string;
}

/** "Date — Today, 4 Nov ›" card row (Figma Interface essentials). Read-only without onPress. */
export function SelectRow({ label, value, onPress, expanded, className, accessibilityHint }: SelectRowProps) {
  return (
    <PressableScale
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label}, ${value}`}
      accessibilityHint={accessibilityHint}
      accessibilityState={expanded === undefined ? undefined : { expanded }}
      containerClassName={className}
      className="h-[52px] flex-row items-center rounded-control border border-line bg-surface px-4">
      <Text variant="body" tone="muted" className="flex-1">
        {label}
      </Text>
      <Text variant="body" numberOfLines={1} className="mr-3 max-w-[60%]">
        {value}
      </Text>
      {onPress ? (
        <View style={{ transform: [{ rotate: expanded ? '90deg' : '0deg' }] }}>
          <ChevronRight size={18} color={colors.muted} strokeWidth={1.8} />
        </View>
      ) : null}
    </PressableScale>
  );
}
