import { useState } from 'react';
import { Pressable, type PressableProps } from 'react-native';
import Animated, { useReducedMotion } from 'react-native-reanimated';

export interface PressableScaleProps extends Omit<PressableProps, 'children' | 'style'> {
  /** Classes for the visible box that scales (background, border, padding, content layout). */
  className?: string;
  /** Classes for the outer touch target's placement in its parent (flex-1, margins, self-stretch). */
  containerClassName?: string;
  children: React.ReactNode;
}

/**
 * Press feedback per the animation guidelines: scale to 0.97 on press-in (100ms ease-out) and
 * back on release (150ms). It's a state-driven change, so it's a Reanimated CSS transition on the
 * UI thread, not a per-frame shared value. Turned off for reduced motion.
 */
export function PressableScale({
  className,
  containerClassName,
  children,
  onPressIn,
  onPressOut,
  hitSlop,
  ...rest
}: PressableScaleProps) {
  const [pressed, setPressed] = useState(false);
  const reduceMotion = useReducedMotion();
  return (
    <Pressable
      {...rest}
      className={containerClassName}
      hitSlop={hitSlop ?? 4}
      pressRetentionOffset={{ top: 16, bottom: 16, left: 16, right: 16 }}
      onPressIn={(event) => {
        setPressed(true);
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        setPressed(false);
        onPressOut?.(event);
      }}>
      <Animated.View
        className={className}
        style={{
          transform: [{ scale: pressed && !reduceMotion ? 0.97 : 1 }],
          transitionProperty: 'transform',
          transitionDuration: pressed ? 100 : 150,
          transitionTimingFunction: 'ease-out',
        }}>
        {children}
      </Animated.View>
    </Pressable>
  );
}
