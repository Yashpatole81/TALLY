import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  ReduceMotion,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

import { colors } from '@/theme/tokens';

/**
 * Progress indicators only animate when their value changes (state indication), not on every
 * mount. Home is opened tens of times a day, which the frequency gate says not to animate.
 */
const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);
const TIMING = { duration: 300, easing: EASE_OUT, reduceMotion: ReduceMotion.System } as const;
const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

/** Spent-of-budget bar. The fill is absolute and childless, so animating width is cheap and keeps the radius. */
export function ProgressBar({ fraction, label }: { fraction: number; label: string }) {
  const progress = useSharedValue(clamp01(fraction));
  useEffect(() => {
    progress.set(withTiming(clamp01(fraction), TIMING));
  }, [fraction, progress]);
  const fillStyle = useAnimatedStyle(() => ({ width: `${progress.get() * 100}%` }));
  return (
    <View
      className="h-1.5 overflow-hidden rounded-full bg-track"
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamp01(fraction) * 100) }}>
      <Animated.View
        style={[{ position: 'absolute', left: 0, top: 0, bottom: 0, borderRadius: 999, backgroundColor: colors.ink }, fillStyle]}
      />
    </View>
  );
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/** Savings ring (mock: 30% of ₹30,000). */
export function ProgressRing({
  fraction,
  size = 64,
  stroke = 7,
  children,
  label,
}: {
  fraction: number;
  size?: number;
  stroke?: number;
  children?: React.ReactNode;
  label: string;
}) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = useSharedValue(clamp01(fraction));
  useEffect(() => {
    progress.set(withTiming(clamp01(fraction), TIMING));
  }, [fraction, progress]);
  const animatedProps = useAnimatedProps(() => ({ strokeDashoffset: circumference * (1 - progress.get()) }));
  return (
    <View
      style={{ width: size, height: size }}
      className="items-center justify-center"
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamp01(fraction) * 100) }}>
      <Svg width={size} height={size} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke={colors.track} strokeWidth={stroke} fill="none" />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.ink}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          animatedProps={animatedProps}
        />
      </Svg>
      {children}
    </View>
  );
}
