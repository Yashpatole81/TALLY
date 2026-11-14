import { View } from 'react-native';

import { Text } from '../ui/text';

/** "Food ▬▬▬▬ ₹2,800": label, proportional bar on a track, value (Figma Insights). */
export function BarRow({ label, fraction, value, color }: { label: string; fraction: number; value: string; color: string }) {
  const width = `${Math.round(Math.min(1, Math.max(0, fraction)) * 100)}%` as const;
  return (
    <View className="flex-row items-center" accessible accessibilityLabel={`${label} ${value}`}>
      <Text variant="subtitle" className="w-[84px]" numberOfLines={1}>
        {label}
      </Text>
      <View className="mx-3 h-2 flex-1 overflow-hidden rounded-full bg-track">
        <View style={{ width, height: '100%', borderRadius: 999, backgroundColor: color }} />
      </View>
      <Text variant="subtitle" tone="ink" className="min-w-[72px] text-right">
        {value}
      </Text>
    </View>
  );
}
