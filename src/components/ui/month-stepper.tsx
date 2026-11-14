import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { addMonths, formatMonthYear, type MonthKey } from '@/domain/dates';
import { haptics } from '@/lib/haptics';
import { colors } from '@/theme/tokens';

import { Text } from './text';

interface MonthStepperProps {
  label: string;
  value: MonthKey;
  onChange: (month: MonthKey) => void;
  min: MonthKey;
  max: MonthKey;
}

/** Row card with ‹ month › controls, for choosing a savings target month. */
export function MonthStepper({ label, value, onChange, min, max }: MonthStepperProps) {
  const step = (delta: number) => {
    const next = addMonths(value, delta);
    if (next < min || next > max) return;
    haptics.selection();
    onChange(next);
  };
  const button = (delta: number, enabled: boolean, a11y: string, Icon: typeof ChevronLeft) => (
    <Pressable
      onPress={() => step(delta)}
      disabled={!enabled}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={a11y}
      accessibilityState={{ disabled: !enabled }}
      className={`h-11 w-11 items-center justify-center ${enabled ? '' : 'opacity-30'}`}>
      <Icon size={20} color={colors.ink} strokeWidth={1.8} />
    </Pressable>
  );
  return (
    <View
      className="h-[52px] flex-row items-center rounded-control border border-line bg-surface pl-4"
      accessibilityRole="adjustable"
      accessibilityLabel={`${label}, ${formatMonthYear(value)}`}>
      <Text variant="body" tone="muted" className="flex-1">
        {label}
      </Text>
      {button(-1, value > min, 'Earlier month', ChevronLeft)}
      <Text variant="body" className="min-w-[118px] text-center">
        {formatMonthYear(value)}
      </Text>
      {button(1, value < max, 'Later month', ChevronRight)}
    </View>
  );
}
