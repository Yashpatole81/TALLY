/**
 * Design tokens for places that need raw values (SVG, charts, icon colors, placeholders).
 * Sampled from the Figma exports. Keep in sync with tailwind.config.js.
 */
export const colors = {
  canvas: '#F2F2F0',
  surface: '#FFFFFF',
  ink: '#171717',
  muted: '#777777',
  line: '#E8E8E5',
  subtle: '#F6F6F3',
  tile: '#EAEAE7',
  track: '#F2F2F0',
  icon: '#555555',
  radioIdle: '#D2D2CC',
  onInk: '#FFFFFF',
} as const;

/** Greyscale ramp for charts, darkest = largest share (Figma Insights). */
export const chartRamp = ['#171717', '#666666', '#A5A5A0', '#D2D2CC', '#E4E4DF'] as const;

export const layout = {
  screenPadding: 24,
  buttonHeight: 48,
  inputHeight: 52,
  controlRadius: 14,
  cardRadius: 16,
  iconStroke: 1.6,
} as const;

export const fonts = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
} as const;
