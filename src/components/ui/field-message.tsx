import { CircleAlert } from 'lucide-react-native';
import { View } from 'react-native';

import { colors } from '@/theme/tokens';

import { Text } from './text';

/** Monochrome validation message with an alert icon (Figma validation frames). */
export function FieldMessage({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <View className="mt-2 flex-row items-center gap-2" accessibilityLiveRegion="polite">
      <CircleAlert size={15} color={colors.ink} strokeWidth={2} />
      <Text variant="message" className="flex-1">
        {message}
      </Text>
    </View>
  );
}
