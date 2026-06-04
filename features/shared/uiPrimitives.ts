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

export const darkGameAccents = {
  wordArea: '#1D5C91',
  wordAreaBorder: '#5BA9DD',
  wordCard: '#2C78CF',
  wordCardPressed: '#215FAA',
  wordCardBorder: '#9BD7FF',
  wordText: '#FFFFFF',
} as const;

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
  borderColor: isDarkMode ? colors.border : '#DDE8F2',
  borderWidth: 1,
  borderRadius: uiRadii.card,
  ...getSoftShadow(isDarkMode, level),
});

export const getInsetSurfaceStyle = (colors: ThemeColors, isDarkMode: boolean): ViewStyle => ({
  backgroundColor: isDarkMode ? colors.surface : '#F6FAFE',
  borderColor: isDarkMode ? colors.borderStrong : '#D7E6F3',
  borderWidth: 1,
  borderRadius: uiRadii.panel,
});

export const getPrimaryButtonStyle = (colors: ThemeColors, isDarkMode: boolean): ViewStyle => ({
  backgroundColor: colors.buttonBackground ?? colors.primary,
  borderColor: isDarkMode ? colors.primary : colors.borderStrong,
  borderBottomColor: isDarkMode ? colors.borderStrong : colors.borderStrong,
  borderWidth: 1.5,
  borderBottomWidth: 3,
  borderRadius: uiRadii.control,
  ...getSoftShadow(isDarkMode, 'raised'),
});
