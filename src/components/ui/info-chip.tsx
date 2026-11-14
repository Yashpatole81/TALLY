import { Info } from 'lucide-react-native';
import { View } from 'react-native';

import { colors } from '@/theme/tokens';

import { Text } from './text';

/** Quiet explanatory note: subtle fill, hairline border, info icon (Figma salary setup). */
export function InfoChip({ children, title }: { children: React.ReactNode; title?: string }) {
  return (
    <View className="flex-row rounded-control border border-line bg-subtle px-4 py-3.5">
      <View className="mr-3 pt-0.5">
        <Info size={18} color={colors.muted} strokeWidth={1.6} />
      </View>
      <View className="flex-1 gap-1">
        {title ? <Text variant="label">{title}</Text> : null}
        <Text variant="subtitle">{children}</Text>
      </View>
    </View>
  );
}
