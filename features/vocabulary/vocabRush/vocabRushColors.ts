import type { ThemeColors } from '../../settings/ThemeContext';


export const vocabRushColors = {
  background: '#fff7ec',
  cardBg: '#ffffff',
  pickerButtonBg: '#faf3ea',
  backButtonIcon: '#322e22',
  title: '#1e1a10',
  timerRed: '#d73337',
  divider: '#e6ded3',
  comboLabel: '#767165',
  comboValue: '#3D64FF',
  scoreValue: '#1e1a10',
  progressTrack: '#e8e0d5',
  progressFill: '#d73337',
  instructionText: '#322e22',
  cardText: '#1e1a10',
  cardSelectedBg: '#7692FF',



  cardSelectedText: '#101B5C',
  matchedBorder: '#b8d8bd',
  matchedBg: '#e9f6eb',
  matchedCheck: '#5c8e67',
  navInactive: '#595549',
  navActive: '#7692FF',
  gameOverIconBg: '#ebddb9',
  gameOverSecondaryText: '#686357',
} as const;

export type VocabRushPalette = Record<keyof typeof vocabRushColors, string>;




export const vocabRushColorsForTheme = (isDarkMode: boolean, themeColors: ThemeColors): VocabRushPalette => {
  if (!isDarkMode) {
    return {
      ...vocabRushColors,
      background: themeColors.background,
      cardBg: themeColors.card,
      pickerButtonBg: themeColors.surface,
      backButtonIcon: themeColors.text,
      title: themeColors.text,
      divider: themeColors.border,
      comboLabel: themeColors.secondaryText,
      scoreValue: themeColors.text,
      progressTrack: themeColors.progressTrack,
      instructionText: themeColors.text,
      cardText: themeColors.text,
      navInactive: themeColors.secondaryText,
      gameOverSecondaryText: themeColors.secondaryText,
    };
  }

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
    progressTrack: themeColors.progressTrack,
    progressFill: themeColors.danger,
    instructionText: themeColors.secondaryText,
    cardText: themeColors.text,
    cardSelectedBg: themeColors.primary,
    cardSelectedText: themeColors.buttonText,
    matchedBorder: themeColors.success,
    matchedBg: themeColors.successSoft,
    matchedCheck: themeColors.success,
    navInactive: themeColors.secondaryText,
    navActive: themeColors.primary,
    gameOverIconBg: themeColors.surfaceAlt,
    gameOverSecondaryText: themeColors.secondaryText,
  };
};
