




import { Platform, type ViewStyle } from 'react-native';




export const APP_LIGHT_COLORWAYS = {
  standard: {
    background: '#F1F5FE',
    outerBackground: '#E7ECF6',
    border: '#D7DEEB',
    surface: '#FFFFFF',
    surfaceAlt: '#E8EEFA',
    exerciseSurface: '#E8EEF8',
    controlSurface: '#E7ECF7',
    controlText: '#3D485C',
    text: '#202838',
    secondaryText: '#616C80',
    tertiaryText: '#7E899C',
    breadcrumbLink: '#566A8A',
    breadcrumbSeparator: '#97A1B2',
    cardShadow: '#D8DFEA',
    pillShadow: '#CBD3E0',
    progressTrack: '#D7DEEB',
  },
  shinyEllie: {
    background: '#FFF7EC',
    outerBackground: '#F3ECE3',
    border: '#E6DED3',
    surface: '#FAF3EA',
    surfaceAlt: '#F2EAE0',
    exerciseSurface: '#F2EAE0',
    controlSurface: '#F7EFE5',
    controlText: '#4E4A44',
    text: '#2B2925',
    secondaryText: '#69645D',
    tertiaryText: '#888178',
    breadcrumbLink: '#665F57',
    breadcrumbSeparator: '#A69E94',
    cardShadow: '#E3DBD0',
    pillShadow: '#D8CFC3',
    progressTrack: '#E8E0D5',
  },
} as const;




export const FRESH_COLORS = {

  pageBackground: APP_LIGHT_COLORWAYS.standard.background,
  pageBackgroundOuter: APP_LIGHT_COLORWAYS.standard.outerBackground,
  cardSurface: '#FFFFFF',
  surfaceAlt: APP_LIGHT_COLORWAYS.standard.surfaceAlt,
  controlSurface: APP_LIGHT_COLORWAYS.standard.controlSurface,
  controlText: APP_LIGHT_COLORWAYS.standard.controlText,
  hairline: APP_LIGHT_COLORWAYS.standard.border,
  divider: APP_LIGHT_COLORWAYS.standard.border,


  inkPrimary: APP_LIGHT_COLORWAYS.standard.text,
  inkSecondary: APP_LIGHT_COLORWAYS.standard.secondaryText,
  inkTertiary: APP_LIGHT_COLORWAYS.standard.tertiaryText,
  inkTertiaryHi: APP_LIGHT_COLORWAYS.standard.tertiaryText,
  breadcrumbLink: APP_LIGHT_COLORWAYS.standard.breadcrumbLink,
  breadcrumbSeparator: APP_LIGHT_COLORWAYS.standard.breadcrumbSeparator,


  primaryBlue: '#0D7DD4',
  primaryBluePressed: '#0055A9',
  primaryBlueShadow: '#005EB3',






  exerciseBlue: '#7692FF',
  exerciseBlueLabel: '#3D64FF',
  exerciseBlueTint: '#E6ECFF',
  exerciseBlueShadow: '#3D64FF',
  exerciseBlueInkOnFill: '#101B5C',


  vocabCoralSolid: '#CA5747',
  vocabCoralShadow: '#A8372A',
  vocabCoralChipFill: '#FFEDEA',
  vocabCoralChipBorder: '#F8D5CF',
  vocabCoralChipText: '#562E27',


  grammarLavenderFill: '#EBF2FF',
  grammarLavenderBorder: '#D1DEF9',
  grammarLavenderText: '#2A4072',


  streakDanger: '#D64938',
  streakDangerShadow: '#B32517',
  heartFilled: '#CC272E',
  heartEmpty: '#D0CEC7',


  goalCardPurple: '#7541B8',
  goalCardPurpleShadow: '#591F97',


  tileGrammar: '#73A9E1',
  tileGrammarShadow: '#558AC0',
  tileVocabulary: '#66C4BE',
  tileVocabularyShadow: '#44A49E',
  tileChapters: '#D8A4CC',
  tileChaptersShadow: '#B886AC',
  tileSettings: '#A8AFB8',
  tileSettingsShadow: '#899098',


  whiteCardShadow: APP_LIGHT_COLORWAYS.standard.cardShadow,
  pillWarmShadow: APP_LIGHT_COLORWAYS.standard.pillShadow,
  progressTodo: APP_LIGHT_COLORWAYS.standard.progressTrack,
} as const;





export const CHAPTER_LEVEL_COLORS = {
  '6e': {
    solid: '#EB9191', shadow: '#C97273', border: '#EBAAA9',
    wash: '#FEF0EF', tint: '#FFE7E6', textDark: '#822A30',
  },
  '5e': {
    solid: '#CB9FD5', shadow: '#AB80B5', border: '#D0B1D7',
    wash: '#F8F0FA', tint: '#FFECFF', textDark: '#64396E',
  },
  '4e': {
    solid: '#A4A2E8', shadow: '#8683C7', border: '#B8B8EA',
    wash: '#F2F2FE', tint: '#F1F1FF', textDark: '#484286',
  },
  '3e': {
    solid: '#80A5E3', shadow: '#6287C2', border: '#A4BFEB',
    wash: '#EEF4FE', tint: '#E2F7FF', textDark: '#274B88',
  },
  '3A': {
    solid: '#6FB789', shadow: '#50986B', border: '#9ACCAA',
    wash: '#ECF7EF', tint: '#DCFFE7', textDark: '#005E31',
  },
  irregular: {
    solid: '#6EB1BD', shadow: '#4F929D', border: '#9AC7CF',
    wash: '#E9F6F9', tint: '#DBFCFF', textDark: '#005864',
  },
} as const;







export const FRESH_COLORS_DARK = {
  pageBackground: '#070F1C',
  cardSurface: '#0D1A2E',
  hairline: '#16233A',
  divider: '#16233A',

  inkPrimary: '#F5F3EE',
  inkSecondary: '#B8C0CC',
  inkTertiary: '#8B96A6',

  primaryBlue: '#5AA8F5',
  primaryBluePressed: '#3D8FE0',
  primaryBlueShadow: '#08131F',

  exerciseBlue: '#3FA0DB',
  exerciseBlueLabel: '#7FC4EE',
  exerciseBlueTint: '#12345A',
  exerciseBlueShadow: '#08131F',

  vocabCoralSolid: '#E07A63',
  vocabCoralShadow: '#08131F',
  vocabCoralChipFill: '#3D1E14',
  vocabCoralChipBorder: '#5A3226',
  vocabCoralChipText: '#FFDCD2',

  grammarLavenderFill: '#1B2440',
  grammarLavenderBorder: '#2E3D66',
  grammarLavenderText: '#B7CBFF',

  streakDanger: '#E8604C',
  heartFilled: '#E8524F',
  heartEmpty: '#2A3B58',

  goalCardPurple: '#9A6BDB',
  goalCardPurpleShadow: '#08131F',

  tileGrammar: '#4E86C4',
  tileGrammarShadow: '#08131F',
  tileVocabulary: '#3FA398',
  tileVocabularyShadow: '#08131F',
  tileChapters: '#B87DAB',
  tileChaptersShadow: '#08131F',
  tileSettings: '#6E7C8E',
  tileSettingsShadow: '#08131F',

  whiteCardShadow: '#08131F',
  pillWarmShadow: '#08131F',
  progressTodo: '#16233A',
} as const;







export const freshFontFamily = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
} as const;

export type FreshFontWeight = keyof typeof freshFontFamily;



export const freshType = {
  screenTitle: { fontWeight: freshFontFamily.extrabold, fontSize: 29 },
  cardTitle: { fontWeight: freshFontFamily.extrabold, fontSize: 17 },
  questionText: { fontWeight: freshFontFamily.extrabold, fontSize: 26 },
  body: { fontWeight: freshFontFamily.semibold, fontSize: 14 },
  bodyBold: { fontWeight: freshFontFamily.bold, fontSize: 14 },
  meta: { fontWeight: freshFontFamily.semibold, fontSize: 12.5 },
  overline: {
    fontWeight: freshFontFamily.bold,
    fontSize: 10.5,
    letterSpacing: 0.7,
    textTransform: 'uppercase' as const,
  },
} as const;








export const freshSpacing = {
  gutterPhone: 22,
  gutterDesktop: 36,
  rhythm: [10, 12, 14, 18, 22, 26] as const,
  exerciseMaxWidth: 640,
};







const rgba = (hex: string, alpha: number) => {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
};


export const freshCardShadow = (isDarkMode: boolean, pressed = false): ViewStyle => {
  const offset = isDarkMode ? FRESH_COLORS_DARK.whiteCardShadow : FRESH_COLORS.whiteCardShadow;
  const hard = pressed ? '1px 2px 0' : '2px 3px 0';
  const ambientAlpha = isDarkMode ? 0.28 : 0.04;
  return { boxShadow: `${hard} ${offset}, 0px 4px 12px ${rgba('#000000', ambientAlpha)}` } as ViewStyle;
};


export const freshPillShadow = (isDarkMode: boolean, pressed = false): ViewStyle => {
  const offset = isDarkMode ? FRESH_COLORS_DARK.pillWarmShadow : FRESH_COLORS.pillWarmShadow;
  const hard = pressed ? '1px 2px 0' : '2px 3px 0';
  const ambientAlpha = isDarkMode ? 0.3 : 0.05;
  return { boxShadow: `${hard} ${offset}, 0px 4px 12px ${rgba('#000000', ambientAlpha)}` } as ViewStyle;
};


export const freshTileShadow = (shadowHex: string, large = false, pressed = false): ViewStyle => {
  const hard = pressed ? '1px 2px 0' : large ? '2px 4px 0' : '2px 3px 0';
  return { boxShadow: `${hard} ${shadowHex}, 0px 4px 12px ${rgba('#000000', 0.05)}` } as ViewStyle;
};


export const freshSmallPillShadow = (shadowHex: string): ViewStyle =>
  ({ boxShadow: `1px 1px 0 ${shadowHex}, 0px 4px 12px ${rgba('#000000', 0.05)}` } as ViewStyle);


export const freshGlowShadow = (glowHex: string = FRESH_COLORS.exerciseBlue): ViewStyle =>
  ({ boxShadow: `0px 6px 14px ${rgba(glowHex, 0.3)}` } as ViewStyle);





export const freshPressTransform = (pressed: boolean): ViewStyle =>
  pressed ? { transform: [{ translateX: 1 }, { translateY: 1 }] } : {};

export const freshTransition = Platform.OS === 'web' ? { transitionDuration: '140ms', transitionTimingFunction: 'ease-out' } : {};
