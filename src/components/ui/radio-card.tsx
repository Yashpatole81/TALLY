import { View } from 'react-native';

import { haptics } from '@/lib/haptics';

import { PressableScale } from './pressable-scale';
import { Text } from './text';

interface RadioCardProps {
  label: string;
  selected: boolean;
  onSelect: () => void;
  /** Muted trailing tag, e.g. "Recommended". */
  tag?: string;
  /** Placement in the parent (e.g. "flex-1" for side-by-side cards). */
  className?: string;
}

/** Selection card: ink border and filled dot when selected, plain white otherwise (Figma). */
export function RadioCard({ label, selected, onSelect, tag, className }: RadioCardProps) {
  return (
    <PressableScale
      onPress={() => {
        if (!selected) haptics.selection();
        onSelect();
      }}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={tag ? `${label}, ${tag}` : label}
      containerClassName={className}
      className={`min-h-[46px] flex-row items-center rounded-control border-[1.5px] bg-surface px-4 py-3 ${
        selected ? 'border-ink' : 'border-surface'
      }`}>
      <View
        className={`h-[18px] w-[18px] items-center justify-center rounded-full ${
          selected ? 'bg-ink' : 'border border-chart-4 bg-surface'
        }`}>
        {selected ? <View className="h-[7px] w-[7px] rounded-full bg-surface" /> : null}
      </View>
      <View className="ml-3 flex-1 flex-row flex-wrap items-center gap-x-3">
        <Text variant="body">{label}</Text>
        {tag ? <Text variant="caption">{tag}</Text> : null}
      </View>
    </PressableScale>
  );
}
