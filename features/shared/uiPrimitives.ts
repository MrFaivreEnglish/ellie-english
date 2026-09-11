import type { ViewStyle } from 'react-native';
import type { ThemeColors } from '../settings/ThemeContext';
import { FRESH_COLORS, FRESH_COLORS_DARK } from './freshDirection';



export const withColorAlpha = (color: string, alpha: number): string => {
  const match = /^#([0-9a-f]{6})$/i.exec(color.trim());
  if (!match) return color;

  const value = parseInt(match[1], 16);
  const clampedAlpha = Math.max(0, Math.min(1, alpha));

  return `rgba(${(value >> 16) & 255}, ${(value >> 8) & 255}, ${value & 255}, ${clampedAlpha})`;
};





export const uiRadii = {
  card: 15,
  panel: 18,
  control: 12,
  thumbnail: 14,
  pill: 999,
  promptCard: 24,
  exerciseCard: 20,
  quizOption: 14,
  chip: 10,
  headerButton: 14,
  largeTile: 19,
  iconButton: 11,
  chapterBadge: 11,
} as const;

type ShadowLevel = 'soft' | 'raised' | 'strong';
type ButtonTone = 'primary' | 'secondary' | 'danger' | 'warning' | 'special';





export const DESIGN_ACCENTS = {
  blue: { solid: FRESH_COLORS.primaryBlue, shadow: FRESH_COLORS.primaryBlueShadow, soft: '#DBEAFE', softDark: '#173259' },
  teal: { solid: '#17B8A6', shadow: '#0F8A7D', soft: '#CCFBF1', softDark: '#0F332F' },
  mauve: { solid: '#9B7EDE', shadow: '#6E52B0', soft: '#EDE4FB', softDark: '#2E2350' },
  amber: { solid: '#E0A458', shadow: '#B8823A', soft: '#FDF0DC', softDark: '#3D2B0F' },
  coral: { solid: '#FF7A59', shadow: '#D65A3D', soft: '#FFE4DA', softDark: '#3D1E14' },
  green: { solid: '#22B573', shadow: '#178256', soft: '#DCFCE7', softDark: '#123625' },
  grey: { solid: '#94A3B8', shadow: '#64748B', soft: '#F1F5F9', softDark: '#28303D' },
} as const;







export const LESSON_CHROME_COLORS = {
  pageBackground: FRESH_COLORS.pageBackground,
  ink: FRESH_COLORS.inkPrimary,
  idleText: FRESH_COLORS.controlText,
  idleBackground: FRESH_COLORS.controlSurface,
  chipIdleText: FRESH_COLORS.controlText,
  chipIdleBg: FRESH_COLORS.controlSurface,
  chipIdleBorder: '#B7C2D9',
  divider: FRESH_COLORS.divider,
  breadcrumbLink: FRESH_COLORS.breadcrumbLink,
  breadcrumbSeparator: FRESH_COLORS.breadcrumbSeparator,
  accent: FRESH_COLORS.primaryBlue,
  accentShadow: 'rgba(13,125,212,0.3)',
  backGlyph: FRESH_COLORS.controlText,
} as const;

export const studySurfaceTokens = {
  light: {
    panel: '#E4EBF7',
    panelBorder: '#7ABCF2',
    control: '#FFFFFF',
    controlBorder: '#B8CAE3',
    search: '#F9FBFF',
    searchBorder: '#8FA9D6',
    searchActive: '#99AAFC',
    text: FRESH_COLORS.inkPrimary,
    muted: FRESH_COLORS.inkSecondary,
    action: '#164B7D',
  },
  dark: {
    panel: '#0F2135',
    panelBorder: '#4D92C9',
    control: '#132438',
    controlBorder: '#36516C',
    search: '#111F32',
    searchBorder: '#99AAFC',
    searchActive: '#99AAFC',
    text: '#F7FAFF',
    muted: '#C8D5EA',
    action: '#D8EEFF',
  },
} as const;

export const selectionTrayTokens = {
  light: {
    surface: '#D7DDFF',
    control: '#FFFFFF',
    border: '#99AAFC',
    text: '#1F2448',
    muted: '#4A527D',
    action: '#26346D',
    stackFrame: '#FFFFFF',
  },
  dark: {
    surface: '#211F4A',
    control: '#151B38',
    border: '#99AAFC',
    text: '#F7FAFF',
    muted: '#D9DEFF',
    action: '#F1F3FF',
    stackFrame: '#FFFFFF',
  },
} as const;






export const grammarGameTokens = {
  light: {
    panelSurface: '#FFFDF9',
    panelBorder: '#FFFDF9',
    panelBottom: '#FFFDF9',
    panelShadow: '#000000',




    promptSurface: '#7692FF',
    promptBorder: '#7692FF',
    promptBottom: '#7692FF',
    promptText: FRESH_COLORS.exerciseBlueInkOnFill,
    metaText: FRESH_COLORS.inkSecondary,
    metaStrong: 'rgba(255,255,255,0.85)',
    progressLabelText: FRESH_COLORS.inkSecondary,
    checkButtonBg: '#7692FF',
    trayDivider: 'rgba(255,255,255,0.25)',


    blankSlotColor: '#ABD2FA',
    statusSurface: '#FFFFFF',
    statusBorder: '#FFFFFF',
    progressTrack: FRESH_COLORS.progressTodo,
    progressFill: '#7692FF',
    badgeSurface: '#FFFFFF',
    badgeBorder: '#FFFFFF',
    badgeText: '#374151',
    answerSurface: '#FFFDF9',
    answerBorder: FRESH_COLORS.hairline,
    answerBottom: FRESH_COLORS.hairline,
    answerText: FRESH_COLORS.inkPrimary,
    answerSelectedSurface: '#E6ECFF',
    answerSelectedBorder: '#7692FF',
    answerSelectedBottom: '#3D64FF',
    inputSurface: '#FFFFFF',
    inputFocusedSurface: '#FFFFFF',
    wordBankSurface: '#E8EEF8',
    wordBankBorder: '#E8EEF8',
    wordChipSurface: '#FFFFFF',
    wordChipBorder: FRESH_COLORS.hairline,
    wordChipBottom: FRESH_COLORS.hairline,
    wordChipText: FRESH_COLORS.inkPrimary,



    selectedWordSurface: '#7692FF',
    selectedWordBorder: '#7692FF',
    selectedWordBottom: '#3D64FF',
    selectedWordText: FRESH_COLORS.exerciseBlueInkOnFill,
    heartFilled: '#CC272E',
    heartEmpty: '#D0CEC7',
    heartLost: '#E0201F',
    correctSurface: '#CCFBF1',
    correctBorder: '#17B8A6',
    correctBottom: '#0F8A7D',
    correctText: '#0B5B52',
    incorrectSurface: '#FFE4DA',
    incorrectBorder: '#FF7A59',
    incorrectBottom: '#D65A3D',
    incorrectText: '#7A2E1C',
    feedbackSurface: '#22C55E',
    feedbackBorder: '#16A34A',
    feedbackText: '#FFFFFF',
  },
  dark: {
    panelSurface: '#0D1A2E',
    panelBorder: '#0D1A2E',
    panelBottom: '#0D1A2E',
    panelShadow: '#000000',
    promptSurface: '#004E75',
    promptBorder: '#004E75',
    promptBottom: '#004E75',
    promptText: '#FFFFFF',
    metaText: '#7D8086',
    metaStrong: 'rgba(255,255,255,0.75)',
    progressLabelText: '#BABEC4',
    checkButtonBg: '#0092D7',
    trayDivider: 'rgba(255,255,255,0.15)',
    blankSlotColor: '#0092D7',
    statusSurface: '#FFFFFF',
    statusBorder: '#FFFFFF',
    progressTrack: '#16233A',
    progressFill: '#16A4E2',
    badgeSurface: '#1E293B',
    badgeBorder: '#1E293B',
    badgeText: '#E2E8F0',
    answerSurface: '#0D1A2E',
    answerBorder: '#26374F',
    answerBottom: '#26374F',
    answerText: '#E3E5E8',
    answerSelectedSurface: '#1B3E6E',
    answerSelectedBorder: '#16A4E2',
    answerSelectedBottom: '#5AA8F5',
    inputSurface: '#0D1A2E',
    inputFocusedSurface: '#12345A',
    wordBankSurface: '#0A1526',
    wordBankBorder: '#2E4262',
    wordChipSurface: '#FFFFFF',
    wordChipBorder: '#FFFFFF',
    wordChipBottom: '#FFFFFF',
    wordChipText: '#252117',
    selectedWordSurface: '#0092D7',
    selectedWordBorder: '#0092D7',
    selectedWordBottom: '#0092D7',
    selectedWordText: '#FFFFFF',
    heartFilled: '#D74745',
    heartEmpty: '#2A3B58',
    heartLost: '#FF3B3B',
    correctSurface: '#0F332F',
    correctBorder: '#4FD9C4',
    correctBottom: '#17B8A6',
    correctText: '#E9FFFC',
    incorrectSurface: '#3D1E14',
    incorrectBorder: '#FF9478',
    incorrectBottom: '#FF7A59',
    incorrectText: '#FFEDE7',
    feedbackSurface: '#22C55E',
    feedbackBorder: '#4ADE80',
    feedbackText: '#FFFFFF',
  },
} as const;

export const getStudySurfaceColors = (colors: ThemeColors, isDarkMode: boolean) => {
  const tokens = isDarkMode ? studySurfaceTokens.dark : studySurfaceTokens.light;

  return {
    panel: isDarkMode ? tokens.panel : colors.surfaceAlt,
    panelBorder: isDarkMode ? tokens.panelBorder : colors.border,
    control: isDarkMode ? tokens.control : colors.card,
    controlBorder: isDarkMode ? tokens.controlBorder : colors.border,
    search: isDarkMode ? tokens.search : colors.card,
    searchBorder: isDarkMode ? tokens.searchBorder : colors.border,
    searchActive: tokens.searchActive,
    text: colors.text,
    muted: colors.secondaryText,
    action: tokens.action,
    startBackground: colors.buttonBackground,
    startText: colors.buttonText,
    selectedSurface: colors.primarySoft,
    selectedBorder: colors.primary,
    photoFrame: isDarkMode ? '#F8FBFF' : '#FFFFFF',
    photoFrameBorder: '#FFFFFF',
    photoFallback: isDarkMode ? '#203754' : colors.surfaceAlt,
    softEdge: isDarkMode ? 'rgba(255,255,255,0.12)' : 'rgba(31,122,209,0.12)',
    goldSurface: isDarkMode ? '#2F260D' : '#FFF7D7',
    goldBorder: isDarkMode ? '#FFD166' : '#E1AF2C',
    goldText: isDarkMode ? '#FFF2B7' : '#6B4A00',
  };
};

export const getSelectionTrayColors = (colors: ThemeColors, isDarkMode: boolean) => {
  const tokens = isDarkMode ? selectionTrayTokens.dark : selectionTrayTokens.light;

  return {
    ...tokens,
    startBackground: colors.buttonBackground,
    startText: colors.buttonText,
  };
};

export const getGrammarGameColors = (colors: ThemeColors, isDarkMode: boolean) => ({
  ...(isDarkMode ? grammarGameTokens.dark : grammarGameTokens.light),
  ...(isDarkMode ? {} : {
      panelSurface: colors.card,
      panelBorder: colors.border,
      panelBottom: colors.border,
      metaText: colors.secondaryText,
      progressLabelText: colors.secondaryText,
      statusSurface: colors.card,
      statusBorder: colors.border,
      badgeSurface: colors.card,
      badgeBorder: colors.border,
      badgeText: colors.text,
      answerSurface: colors.card,
      answerBorder: colors.border,
      answerBottom: colors.border,
      answerText: colors.text,
      inputSurface: colors.card,
      inputFocusedSurface: colors.card,
      progressTrack: colors.progressTrack,
      wordBankSurface: colors.exerciseSurface,
      wordBankBorder: colors.exerciseSurface,
      wordChipSurface: colors.card,
      wordChipBorder: colors.border,
      wordChipBottom: colors.border,
      wordChipText: colors.text,
    }),






  correctSurface: '#22C55E',
  correctBorder: '#16A34A',
  correctBottom: '#15803D',
  correctText: '#FFFFFF',
  feedbackSurface: '#22C55E',
  feedbackBorder: '#16A34A',
  feedbackText: '#FFFFFF',



  selectedWordText: '#FFFFFF',
  checkButtonBg: colors.primary,
  buttonBackground: colors.buttonBackground ?? colors.primary,
  buttonText: colors.buttonText,
});







export const getSoftShadow = (
  isDarkMode: boolean,
  level: ShadowLevel = 'soft',
  lightShadowColor: string = FRESH_COLORS.whiteCardShadow,
  isPixelMode = false
): ViewStyle => {
  const offsetColor = isDarkMode ? FRESH_COLORS_DARK.whiteCardShadow : lightShadowColor;

  if (isPixelMode) {
    const offset = level === 'strong' ? 5 : level === 'raised' ? 4 : 3;
    return {
      boxShadow: `${offset}px ${offset}px 0 ${offsetColor}`,
      elevation: 0,
      shadowOpacity: 0,
    } as ViewStyle;
  }

  const hard = level === 'strong' ? '3px 5px 0' : level === 'raised' ? '2px 4px 0' : '2px 3px 0';
  const blur = level === 'strong' ? 20 : level === 'raised' ? 16 : 12;
  const ambientAlpha = isDarkMode
    ? (level === 'strong' ? 0.36 : level === 'raised' ? 0.32 : 0.28)
    : (level === 'strong' ? 0.08 : level === 'raised' ? 0.06 : 0.04);

  return {
    boxShadow: `${hard} ${offsetColor}, 0px ${Math.round(blur / 3)}px ${blur}px rgba(0,0,0,${ambientAlpha})`,
  } as ViewStyle;
};



const LINEN_CARD_RADIUS = 14;

export const getPanelStyle = (
  colors: ThemeColors,
  isDarkMode: boolean,
  level: ShadowLevel = 'soft'
): ViewStyle => (
  colors.visualStyle === 'pixel'
    ? {
        backgroundColor: colors.card,
        borderColor: colors.borderStrong,
        borderWidth: 2,
        borderRadius: 2,
        ...getSoftShadow(isDarkMode, level, colors.shadow, true),
      }
    : isDarkMode
    ? {
        backgroundColor: colors.card,
        borderColor: colors.border,
        borderWidth: 1.5,
        borderRadius: uiRadii.card,
        ...getSoftShadow(isDarkMode, level, colors.shadow),
      }
    : {
        backgroundColor: colors.card,
        borderRadius: LINEN_CARD_RADIUS,
        boxShadow: `0px 2px 6px ${withColorAlpha(colors.shadow, 0.72)}`,
      }
);

export const getInsetSurfaceStyle = (colors: ThemeColors, isDarkMode: boolean): ViewStyle => (
  colors.visualStyle === 'pixel'
    ? {
        backgroundColor: colors.surface,
        borderColor: colors.borderStrong,
        borderWidth: 2,
        borderRadius: 2,
        ...getSoftShadow(isDarkMode, 'soft', colors.shadow, true),
      }
    : isDarkMode
    ? {
        backgroundColor: colors.surface,
        borderColor: colors.border,
        borderWidth: 1.5,
        borderRadius: uiRadii.panel,
      }
    : {
        backgroundColor: colors.surface,
        borderRadius: LINEN_CARD_RADIUS,
        boxShadow: `0px 2px 6px ${withColorAlpha(colors.shadow, 0.72)}`,
      }
);

export const getPrimaryButtonStyle = (colors: ThemeColors, isDarkMode: boolean): ViewStyle => ({
  backgroundColor: colors.buttonBackground ?? colors.primary,
  borderColor: isDarkMode ? colors.primary : colors.buttonBackground,
  borderBottomColor: isDarkMode ? colors.borderStrong : colors.primary,
  borderWidth: 1.5,
  borderBottomWidth: 3,
  borderRadius: colors.visualStyle === 'pixel' ? 2 : uiRadii.control,
  ...getSoftShadow(isDarkMode, 'raised', colors.shadow, colors.visualStyle === 'pixel'),
});

export const getButtonToneColors = (colors: ThemeColors, isDarkMode: boolean, tone: ButtonTone = 'primary') => {
  switch (tone) {
    case 'secondary':
      return {
        background: isDarkMode ? colors.surface : '#FFFFFF',
        border: isDarkMode ? colors.borderStrong : colors.border,
        bottom: isDarkMode ? colors.borderStrong : colors.border,
        text: colors.text,
      };
    case 'danger':
      return {
        background: colors.dangerSoft,
        border: colors.danger,
        bottom: colors.danger,
        text: colors.danger,
      };
    case 'warning':
      return {
        background: colors.warningSoft,
        border: colors.warning,
        bottom: colors.warning,
        text: isDarkMode ? '#FFF7D6' : '#6B4A00',
      };
    case 'special':
      return {
        background: isDarkMode ? '#2F260D' : '#FFF7D7',
        border: isDarkMode ? '#FFD166' : '#E1AF2C',
        bottom: isDarkMode ? '#FFD166' : '#B98616',
        text: isDarkMode ? '#FFF7D6' : '#6B4A00',
      };
    case 'primary':
    default:
      return {
        background: colors.buttonBackground ?? colors.primary,
        border: isDarkMode ? colors.primary : colors.buttonBackground,
        bottom: isDarkMode ? colors.borderStrong : colors.primary,
        text: colors.buttonText,
      };
  }
};

export const getButtonStyle = (
  colors: ThemeColors,
  isDarkMode: boolean,
  tone: ButtonTone = 'primary'
): ViewStyle => {
  const toneColors = getButtonToneColors(colors, isDarkMode, tone);

  return {
    backgroundColor: toneColors.background,
    borderColor: toneColors.border,
    borderBottomColor: toneColors.bottom,
    borderWidth: 1.5,
    borderBottomWidth: tone === 'secondary' ? 2 : 3,
    borderRadius: colors.visualStyle === 'pixel' ? 2 : uiRadii.control,
    ...getSoftShadow(
      isDarkMode,
      tone === 'primary' ? 'raised' : 'soft',
      colors.shadow,
      colors.visualStyle === 'pixel'
    ),
  };
};

export const getPixelSurfaceStyle = (
  colors: ThemeColors,
  isDarkMode: boolean,
  level: ShadowLevel = 'soft'
): ViewStyle => colors.visualStyle === 'pixel'
  ? {
      borderRadius: 2,
      borderWidth: 2,
      borderColor: colors.borderStrong,
      ...getSoftShadow(isDarkMode, level, colors.shadow, true),
    }
  : {};

export const getButtonTextColor = (
  colors: ThemeColors,
  isDarkMode: boolean,
  tone: ButtonTone = 'primary'
) => getButtonToneColors(colors, isDarkMode, tone).text;
