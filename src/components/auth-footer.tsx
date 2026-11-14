import { Pressable, View } from 'react-native';

import { Text } from './ui/text';

/** "New here? Create Account" / "Already have an account? Sign In" */
export function AuthFooter({ prompt, action, onPress }: { prompt: string; action: string; onPress: () => void }) {
  return (
    <View className="flex-row items-center justify-center py-2">
      <Text variant="subtitle">{prompt} </Text>
      <Pressable onPress={onPress} hitSlop={12} accessibilityRole="link" accessibilityLabel={action}>
        <Text variant="link">{action}</Text>
      </Pressable>
    </View>
  );
}
