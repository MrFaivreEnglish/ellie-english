import type { ThemeColors } from '../../settings/ThemeContext';

// Converted from the OKLCH values in the Vocab Rush spec (sRGB, D65, no gamut remap beyond clamp).
export const vocabRushColors = {
  background: '#f9f5eb', // oklch(0.97 0.014 90)
  cardBg: '#ffffff',
  pickerButtonBg: '#f4f1e8',
  backButtonIcon: '#322e22', // oklch(0.3 0.02 90)
  title: '#1e1a10', // oklch(0.22 0.02 90)
  timerRed: '#d73337', // oklch(0.58 0.2 25)
  divider: '#dad7d0', // oklch(0.88 0.01 90)
  comboLabel: '#767165', // oklch(0.55 0.02 90)
  comboValue: '#0d7dd4', // oklch(0.58 0.16 250)
  scoreValue: '#1e1a10', // oklch(0.22 0.02 90)
  progressTrack: '#e3decf', // oklch(0.9 0.02 90)
  progressFill: '#d73337', // oklch(0.58 0.2 25)
  instructionText: '#322e22', // oklch(0.3 0.02 90)
  cardText: '#1e1a10', // oklch(0.22 0.02 90)
  cardSelectedBg: '#0d7dd4', // oklch(0.58 0.16 250)
  matchedBorder: '#b8d8bd', // oklch(0.85 0.05 150)
  matchedBg: '#e9f6eb', // oklch(0.96 0.02 150)
  matchedCheck: '#5c8e67', // oklch(0.6 0.08 150)
  navInactive: '#595549', // oklch(0.45 0.02 90)
  navActive: '#0d7dd4', // oklch(0.58 0.16 250)
  gameOverIconBg: '#ebddb9', // oklch(0.9 0.05 90)
  gameOverSecondaryText: '#686357', // oklch(0.5 0.02 90)
} as const;

export type VocabRushPalette = Record<keyof typeof vocabRushColors, string>;

// In dark mode, Vocab Rush drops its own warm palette entirely and maps onto the
// app's actual ThemeColors — so it looks like the same dark theme as Settings,
// Home, etc. rather than a bespoke "dark version" that can drift out of sync.
export const vocabRushColorsForTheme = (isDarkMode: boolean, themeColors: ThemeColors): VocabRushPalette => {
  if (!isDarkMode) return vocabRushColors;

  return {
    background: themeColors.background,
    cardBg: themeColors.card,
    pickerButtonBg: themeColors.surface,
    backButtonIcon: themeColors.text,
    title: themeColors.text,
    timerRed: themeColors.danger,
    divider: themeColors.border,
    comboLabel: themeColors.secondaryText,
    comboValue: themeColors.primary,
    scoreValue: themeColors.text,
    progressTrack: themeColors.surface,
    progressFill: themeColors.danger,
    instructionText: themeColors.secondaryText,
    cardText: themeColors.text,
    cardSelectedBg: themeColors.primary,
    matchedBorder: themeColors.success,
    matchedBg: themeColors.successSoft,
    matchedCheck: themeColors.success,
    navInactive: themeColors.secondaryText,
    navActive: themeColors.primary,
    gameOverIconBg: themeColors.surfaceAlt,
    gameOverSecondaryText: themeColors.secondaryText,
  };
};
