import { View, type ViewProps } from 'react-native';

/** White surface, 16pt corners, hairline border ("A calm place for your money."). */
export function Card({ className, ...rest }: ViewProps & { className?: string }) {
  return <View className={`rounded-card border border-line bg-surface ${className ?? ''}`} {...rest} />;
}

/** Hairline divider used inside cards and lists. */
export function Divider({ className }: { className?: string }) {
  return <View className={`h-px bg-line ${className ?? ''}`} />;
}
