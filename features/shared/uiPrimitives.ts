import type { ViewStyle } from 'react-native';
import type { ThemeColors } from '../settings/ThemeContext';
import { FRESH_COLORS, FRESH_COLORS_DARK } from './freshDirection';

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
} as const;

type ShadowLevel = 'soft' | 'raised' | 'strong';
type ButtonTone = 'primary' | 'secondary' | 'danger' | 'warning' | 'special';

// Shared "Fresh Direction" accent palette: one hue per context (primary blue,
// plus the four sparingly-used secondary accents), each with a solid, a
// darker "shadow" shade (used as the flat-offset bottom-border), and soft
// tint backgrounds for light/dark mode.
export const DESIGN_ACCENTS = {
  blue: { solid: FRESH_COLORS.primaryBlue, shadow: FRESH_COLORS.primaryBlueShadow, soft: '#DBEAFE', softDark: '#173259' },
  teal: { solid: '#17B8A6', shadow: '#0F8A7D', soft: '#CCFBF1', softDark: '#0F332F' },
  mauve: { solid: '#9B7EDE', shadow: '#6E52B0', soft: '#EDE4FB', softDark: '#2E2350' },
  amber: { solid: '#E0A458', shadow: '#B8823A', soft: '#FDF0DC', softDark: '#3D2B0F' },
  coral: { solid: '#FF7A59', shadow: '#D65A3D', soft: '#FFE4DA', softDark: '#3D1E14' },
  grey: { solid: '#94A3B8', shadow: '#64748B', soft: '#F1F5F9', softDark: '#28303D' },
} as const;

export const studySurfaceTokens = {
  light: {
    panel: '#EEF5FF',
    panelBorder: '#7ABCF2',
    control: '#FFFFFF',
    controlBorder: '#B9DDF8',
    search: '#F8FAFF',
    searchBorder: '#99AAFC',
    searchActive: '#99AAFC',
    text: '#243041',
    muted: '#607089',
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

// "Fresh Direction" palette for the four grammar exercise screens (Quiz, Fill,
// Reorder, Translate): a single accent-blue prompt card with a soft diffuse
// shadow, pill-shaped progress dashes, and white/cream answer surfaces —
// replaces the old flat-offset-border look. Colors are converted from the
// design mockups' oklch values to hex for React Native.
export const grammarGameTokens = {
  light: {
    panelSurface: '#FFFDF9',
    panelBorder: '#FFFDF9',
    panelBottom: '#FFFDF9',
    panelShadow: '#000000',
    promptSurface: '#4AA3D2',
    promptBorder: '#4AA3D2',
    promptBottom: '#4AA3D2',
    promptText: '#FFFFFF',
    metaText: '#767165',
    metaStrong: 'rgba(255,255,255,0.85)',
    progressLabelText: '#595549',
    checkButtonBg: '#4AA3D2',
    trayDivider: 'rgba(255,255,255,0.25)',
    blankSlotColor: '#4AA3D2',
    statusSurface: '#FFFFFF',
    statusBorder: '#FFFFFF',
    progressTrack: '#DCD7C9',
    progressFill: '#4AA3D2',
    badgeSurface: '#FFFFFF',
    badgeBorder: '#FFFFFF',
    badgeText: '#374151',
    answerSurface: '#FFFDF9',
    answerBorder: '#E3DECF',
    answerBottom: '#E3DECF',
    answerText: '#1E1A10',
    answerSelectedSurface: '#DBEAFE',
    answerSelectedBorder: '#4AA3D2',
    answerSelectedBottom: '#2584B2',
    inputSurface: '#FFFFFF',
    inputFocusedSurface: '#EAF4FB',
    wordBankSurface: '#F4F2EA',
    wordBankBorder: '#E2DED3',
    wordChipSurface: '#FFFFFF',
    wordChipBorder: '#EDE8DB',
    wordChipBottom: '#EDE8DB',
    wordChipText: '#252117',
    selectedWordSurface: '#4AA3D2',
    selectedWordBorder: '#4AA3D2',
    selectedWordBottom: '#4AA3D2',
    selectedWordText: '#FFFFFF',
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
    panel: tokens.panel,
    panelBorder: tokens.panelBorder,
    control: tokens.control,
    controlBorder: tokens.controlBorder,
    search: tokens.search,
    searchBorder: tokens.searchBorder,
    searchActive: tokens.searchActive,
    text: isDarkMode ? colors.text : tokens.text,
    muted: isDarkMode ? colors.secondaryText : tokens.muted,
    action: tokens.action,
    startBackground: colors.buttonBackground,
    startText: colors.buttonText,
    selectedSurface: colors.primarySoft,
    selectedBorder: colors.primary,
    photoFrame: isDarkMode ? '#F8FBFF' : '#FFFFFF',
    photoFrameBorder: '#FFFFFF',
    photoFallback: isDarkMode ? '#203754' : '#EAF2FA',
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
  buttonBackground: colors.buttonBackground ?? colors.primary,
  buttonText: colors.buttonText,
});

// "Hard offset + soft ambient" signature shadow (Fresh Direction §1): a
// crisp opaque offset in a darker tone of the surface, plus a soft ambient
// blur — never a plain single-value box-shadow. `level` grades how
// prominent the card reads (soft = ordinary card, raised = control/pill,
// strong = modal/elevated surface); each step scales both the hard offset
// and the ambient blur together so the two parts always read as one shadow.
export const getSoftShadow = (
  isDarkMode: boolean,
  level: ShadowLevel = 'soft'
): ViewStyle => {
  const offsetColor = isDarkMode ? FRESH_COLORS_DARK.whiteCardShadow : FRESH_COLORS.whiteCardShadow;
  const hard = level === 'strong' ? '3px 5px 0' : level === 'raised' ? '2px 4px 0' : '2px 3px 0';
  const blur = level === 'strong' ? 20 : level === 'raised' ? 16 : 12;
  const ambientAlpha = isDarkMode
    ? (level === 'strong' ? 0.36 : level === 'raised' ? 0.32 : 0.28)
    : (level === 'strong' ? 0.08 : level === 'raised' ? 0.06 : 0.04);

  return {
    boxShadow: `${hard} ${offsetColor}, 0px ${Math.round(blur / 3)}px ${blur}px rgba(0,0,0,${ambientAlpha})`,
  } as ViewStyle;
};

export const getPanelStyle = (
  colors: ThemeColors,
  isDarkMode: boolean,
  level: ShadowLevel = 'soft'
): ViewStyle => ({
  backgroundColor: colors.card,
  borderColor: isDarkMode ? colors.border : '#E7E1D6',
  borderWidth: isDarkMode ? 1.5 : 1.25,
  borderRadius: uiRadii.card,
  ...getSoftShadow(isDarkMode, level),
});

export const getInsetSurfaceStyle = (colors: ThemeColors, isDarkMode: boolean): ViewStyle => ({
  backgroundColor: isDarkMode ? colors.surface : '#F4F1EA',
  borderColor: isDarkMode ? colors.border : '#E7E1D6',
  borderWidth: isDarkMode ? 1.5 : 1,
  borderRadius: uiRadii.panel,
});

export const getPrimaryButtonStyle = (colors: ThemeColors, isDarkMode: boolean): ViewStyle => ({
  backgroundColor: colors.buttonBackground ?? colors.primary,
  borderColor: isDarkMode ? colors.primary : colors.buttonBackground,
  borderBottomColor: isDarkMode ? colors.borderStrong : colors.primary,
  borderWidth: 1.5,
  borderBottomWidth: 3,
  borderRadius: uiRadii.control,
  ...getSoftShadow(isDarkMode, 'raised'),
});

export const getButtonToneColors = (colors: ThemeColors, isDarkMode: boolean, tone: ButtonTone = 'primary') => {
  switch (tone) {
    case 'secondary':
      return {
        background: isDarkMode ? colors.surface : '#FFFFFF',
        border: isDarkMode ? colors.borderStrong : colors.border,
        bottom: isDarkMode ? colors.borderStrong : '#D9D2C4',
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
    borderRadius: uiRadii.control,
    ...getSoftShadow(isDarkMode, tone === 'primary' ? 'raised' : 'soft'),
  };
};

export const getButtonTextColor = (
  colors: ThemeColors,
  isDarkMode: boolean,
  tone: ButtonTone = 'primary'
) => getButtonToneColors(colors, isDarkMode, tone).text;
