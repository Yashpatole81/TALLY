import { ChevronRight } from 'lucide-react-native';
import { View } from 'react-native';

import { colors } from '@/theme/tokens';

import { Divider } from './ui/card';
import { PressableScale } from './ui/pressable-scale';
import { Text } from './ui/text';

/** "Monthly salary — ₹16,000 ›" row inside a settings card (Figma Settings). */
export function SettingsRow({
  label,
  value,
  onPress,
  divider = true,
}: {
  label: string;
  value: string;
  onPress?: () => void;
  divider?: boolean;
}) {
  return (
    <View>
      <PressableScale
        onPress={onPress}
        disabled={!onPress}
        accessibilityRole={onPress ? 'button' : 'text'}
        accessibilityLabel={`${label}, ${value}`}
        className="min-h-[52px] flex-row items-center py-3.5">
        <Text variant="body" className="flex-1 pr-3">
          {label}
        </Text>
        <Text variant="subtitle" numberOfLines={1} className="max-w-[55%]">
          {value}
        </Text>
        {onPress ? (
          <View className="ml-3">
            <ChevronRight size={16} color={colors.ink} strokeWidth={1.8} />
          </View>
        ) : null}
      </PressableScale>
      {divider ? <Divider /> : null}
    </View>
  );
}
