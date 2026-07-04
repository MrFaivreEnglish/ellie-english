import { Platform, type ViewStyle } from 'react-native';
import type { ThemeColors } from '../settings/ThemeContext';

export const uiRadii = {
  card: 18,
  panel: 16,
  control: 12,
  thumbnail: 14,
  pill: 999,
} as const;

type ShadowLevel = 'soft' | 'raised' | 'strong';
type ButtonTone = 'primary' | 'secondary' | 'danger' | 'warning' | 'special';

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

export const grammarGameTokens = {
  light: {
    panelSurface: '#FFFFFF',
    panelBorder: '#C7D8E6',
    panelBottom: '#9EC6E2',
    panelShadow: '#0D3B66',
    promptSurface: '#EAF5FF',
    promptBorder: '#B9D6EA',
    promptBottom: '#83B7DC',
    promptText: '#172B3F',
    metaText: '#52657A',
    metaStrong: '#165E9C',
    statusSurface: '#EFF7FF',
    statusBorder: '#C6DCEB',
    progressTrack: '#CFE4F7',
    progressFill: '#1F7AD1',
    badgeSurface: '#E8F4FF',
    badgeBorder: '#AFCFE8',
    badgeText: '#0E5D9E',
    answerSurface: '#FFFFFF',
    answerBorder: '#D4E0EA',
    answerBottom: '#B5CADC',
    answerText: '#172B3F',
    answerSelectedSurface: '#D8EDFF',
    answerSelectedBorder: '#5DA7DE',
    answerSelectedBottom: '#2C7DBA',
    inputSurface: '#FFFFFF',
    inputFocusedSurface: '#D8EDFF',
    wordBankSurface: '#EDF7FF',
    wordBankBorder: '#C1D8E9',
    wordChipSurface: '#FFFFFF',
    wordChipBorder: '#B8D5EA',
    wordChipBottom: '#86BDE2',
    wordChipText: '#17324A',
    selectedWordSurface: '#1F7AD1',
    selectedWordBorder: '#8CC7F0',
    selectedWordBottom: '#2C7DBA',
    selectedWordText: '#FFFFFF',
    heartFilled: '#E91E63',
    heartEmpty: '#8AA0B6',
    heartLost: '#D90452',
    correctSurface: '#DDF7E9',
    correctBorder: '#56BE82',
    correctBottom: '#279461',
    correctText: '#074D2A',
    incorrectSurface: '#FFE3EA',
    incorrectBorder: '#F06A7F',
    incorrectBottom: '#CC435B',
    incorrectText: '#7E112C',
    feedbackSurface: '#19A85E',
    feedbackBorder: '#087D44',
    feedbackText: '#FFFFFF',
  },
  dark: {
    panelSurface: '#071423',
    panelBorder: '#2B4763',
    panelBottom: '#4D8DC4',
    panelShadow: '#000000',
    promptSurface: '#0E2A46',
    promptBorder: '#31506B',
    promptBottom: '#4D8DC4',
    promptText: '#F7FBFF',
    metaText: '#BED7EF',
    metaStrong: '#9AD8FF',
    statusSurface: '#0B1D33',
    statusBorder: '#28445F',
    progressTrack: '#17324D',
    progressFill: '#64B5FF',
    badgeSurface: '#102542',
    badgeBorder: '#3D6389',
    badgeText: '#D7ECFF',
    answerSurface: '#12365A',
    answerBorder: '#6FA8D4',
    answerBottom: '#4D8DC4',
    answerText: '#FFFFFF',
    answerSelectedSurface: '#155D9E',
    answerSelectedBorder: '#75B8E8',
    answerSelectedBottom: '#4D8DC4',
    inputSurface: '#0B1728',
    inputFocusedSurface: '#155D9E',
    wordBankSurface: '#06101D',
    wordBankBorder: '#35536F',
    wordChipSurface: '#243A55',
    wordChipBorder: '#7A9BB8',
    wordChipBottom: '#466986',
    wordChipText: '#F7FAFF',
    selectedWordSurface: '#6B5AE8',
    selectedWordBorder: '#C9C2FF',
    selectedWordBottom: '#5748C8',
    selectedWordText: '#FFFFFF',
    heartFilled: '#FF4F8B',
    heartEmpty: '#5C7EA3',
    heartLost: '#FF2E63',
    correctSurface: '#0E3C2A',
    correctBorder: '#44E08A',
    correctBottom: '#20B864',
    correctText: '#E9FFF2',
    incorrectSurface: '#4A1223',
    incorrectBorder: '#FF6F8F',
    incorrectBottom: '#FF3B68',
    incorrectText: '#FFE8EE',
    feedbackSurface: '#15A967',
    feedbackBorder: '#8FF2B3',
    feedbackText: '#FFFFFF',
  },
} as const;

export const darkGameAccents = {
  answerArea: grammarGameTokens.dark.answerSurface,
  answerAreaBorder: grammarGameTokens.dark.answerBorder,
  answerAreaBottom: grammarGameTokens.dark.answerBottom,
  wordArea: grammarGameTokens.dark.wordBankSurface,
  wordAreaBorder: grammarGameTokens.dark.wordBankBorder,
  wordCard: grammarGameTokens.dark.wordChipSurface,
  wordCardPressed: grammarGameTokens.dark.selectedWordSurface,
  wordCardBorder: grammarGameTokens.dark.wordChipBorder,
  wordText: grammarGameTokens.dark.wordChipText,
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

export const getSoftShadow = (
  isDarkMode: boolean,
  level: ShadowLevel = 'soft'
): ViewStyle => {
  const height = level === 'strong' ? 6 : level === 'raised' ? 4 : 2;
  const radius = Platform.OS === 'web'
    ? (level === 'strong' ? 8 : level === 'raised' ? 5 : 3)
    : (level === 'strong' ? 12 : level === 'raised' ? 8 : 5);
  const opacity = isDarkMode
    ? (level === 'strong' ? 0.28 : level === 'raised' ? 0.2 : 0.14)
    : (level === 'strong' ? 0.12 : level === 'raised' ? 0.08 : 0.05);

  return {
    shadowColor: '#000',
    shadowOffset: { width: 0, height },
    shadowOpacity: opacity,
    shadowRadius: radius,
    elevation: Platform.OS === 'android' ? (level === 'strong' ? 5 : level === 'raised' ? 3 : 1) : 0,
  };
};

export const getPanelStyle = (
  colors: ThemeColors,
  isDarkMode: boolean,
  level: ShadowLevel = 'soft'
): ViewStyle => ({
  backgroundColor: colors.card,
  borderColor: isDarkMode ? colors.border : '#D6E2EE',
  borderWidth: isDarkMode ? 1.5 : 1.25,
  borderRadius: uiRadii.card,
  ...getSoftShadow(isDarkMode, level),
});

export const getInsetSurfaceStyle = (colors: ThemeColors, isDarkMode: boolean): ViewStyle => ({
  backgroundColor: isDarkMode ? colors.surface : '#F8FAFF',
  borderColor: isDarkMode ? colors.border : '#D6E2EE',
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
        bottom: isDarkMode ? colors.borderStrong : '#B9C8D6',
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
