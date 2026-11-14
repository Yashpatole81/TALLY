import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

/**
 * Type scale from the Figma (sizes in pt). Each weight uses its own Inter face because Android
 * doesn't synthesize weights for custom fonts. Add a variant instead of overriding font classes.
 */
const VARIANTS = {
  hero: 'font-inter-bold text-[44px] leading-[48px] tracking-[-1.6px]',
  title: 'font-inter-semibold text-[28px] leading-[34px] tracking-[-0.6px]',
  heading: 'font-inter-semibold text-[24px] leading-[30px] tracking-[-0.5px]',
  greeting: 'font-inter-semibold text-[22px] leading-[28px] tracking-[-0.4px]',
  sheetAmount: 'font-inter-semibold text-[48px] leading-[56px] tracking-[-1.4px]',
  display: 'font-inter-semibold text-[36px] leading-[42px] tracking-[-1px]',
  amountInput: 'font-inter-semibold text-[30px] leading-[36px] tracking-[-0.8px]',
  amount: 'font-inter-semibold text-[20px] leading-[26px] tracking-[-0.3px]',
  section: 'font-inter-semibold text-[16px] leading-[22px] tracking-[-0.2px]',
  body: 'font-inter text-[15px] leading-[21px]',
  bodyMedium: 'font-inter-medium text-[15px] leading-[21px]',
  subtitle: 'font-inter text-[14px] leading-[20px]',
  label: 'font-inter-medium text-[13px] leading-[18px]',
  message: 'font-inter text-[13px] leading-[18px]',
  rowTitle: 'font-inter-medium text-[14px] leading-[19px]',
  link: 'font-inter-semibold text-[14px] leading-[20px]',
  caption: 'font-inter text-[12px] leading-[16px]',
  small: 'font-inter text-[11px] leading-[15px]',
  overline: 'font-inter-medium text-[10px] leading-[14px] tracking-[0.6px] uppercase',
  sectionLabel: 'font-inter-medium text-[11px] leading-[14px] tracking-[0.6px] uppercase',
  micro: 'font-inter-medium text-[9px] leading-[12px] tracking-[0.6px] uppercase',
  initial: 'font-inter text-[26px] leading-[32px]',
} as const;

const TONES = {
  ink: 'text-ink',
  muted: 'text-muted',
  inverse: 'text-surface',
} as const;

export type TextVariant = keyof typeof VARIANTS;
export type TextTone = keyof typeof TONES;

export interface TextProps extends RNTextProps {
  variant?: TextVariant;
  tone?: TextTone;
  /** Layout/spacing classes only. Typography comes from `variant`, color from `tone`. */
  className?: string;
}

const MUTED_BY_DEFAULT: ReadonlySet<TextVariant> = new Set(['subtitle', 'caption', 'overline', 'sectionLabel', 'micro', 'small']);

export function Text({ variant = 'body', tone, className, ...rest }: TextProps) {
  const resolvedTone = tone ?? (MUTED_BY_DEFAULT.has(variant) ? 'muted' : 'ink');
  return <RNText className={`${VARIANTS[variant]} ${TONES[resolvedTone]} ${className ?? ''}`} {...rest} />;
}
