import { cssInterop } from 'nativewind';
import Animated from 'react-native-reanimated';

/** Let Reanimated's Animated.View accept `className` (NativeWind only maps core RN components). */
cssInterop(Animated.View, { className: 'style' });
