/** @type {import('tailwindcss').Config} */
// Tokens sampled from the Figma file (REFERENCE/UI, 2x exports). Keep in sync with src/theme/tokens.ts.
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  // Light-only app (no dark design yet). 'class' keeps it light even when the OS is dark, and on web
  // it avoids NativeWind's "Cannot manually set color scheme, as dark mode is type 'media'" error.
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        canvas: '#F2F2F0', // warm neutral screen background
        surface: '#FFFFFF', // cards, inputs, sheets
        ink: '#171717', // primary text, primary button, selection, validation
        muted: '#777777', // secondary text, placeholders, inactive tabs
        line: '#E8E8E5', // hairline borders and dividers
        subtle: '#F6F6F3', // info chips
        tile: '#EAEAE7', // transaction icon tiles
        track: '#F2F2F0', // progress tracks
        icon: '#555555', // inline secondary icons
        chart: {
          1: '#171717',
          2: '#666666',
          3: '#A5A5A0',
          4: '#D2D2CC',
        },
      },
      fontFamily: {
        // One family per weight: Android does not synthesize weights for custom fonts.
        inter: ['Inter_400Regular'],
        'inter-medium': ['Inter_500Medium'],
        'inter-semibold': ['Inter_600SemiBold'],
        'inter-bold': ['Inter_700Bold'],
      },
      borderRadius: {
        tile: '10px',
        chip: '12px',
        control: '14px', // buttons, inputs, selection cards
        card: '16px',
      },
    },
  },
  plugins: [],
};
