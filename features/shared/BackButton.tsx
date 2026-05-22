import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../settings/ThemeContext';
import { getMenuCopy } from './menuCopy';

interface BackButtonProps {
  /**
   * Optional custom label – defaults to "Back".
   */
  label?: string;
  /**
   * Optional press handler – when omitted the button simply performs `navigation.goBack()`.
   */
  onPress?: () => void;
  /**
   * Override container style if needed by a specific screen.
   */
  style?: ViewStyle;
  /**
   * Override text style if needed by a specific screen.
   */
  textStyle?: TextStyle;
}

/**
 * A tiny, theme-aware back button so we don't duplicate the same JSX & styles
 * across multiple screens.  Usage:
 *
 * ```tsx
 * <BackButton onPress={() => navigation.navigate('Home')} />
 * ```
 */
const BackButton: React.FC<BackButtonProps> = ({
  label,
  onPress,
  style,
  textStyle,
}) => {
  const navigation = useNavigation<any>();
  const { colors, menuLanguage } = useTheme();
  const copy = getMenuCopy(menuLanguage).common;
  const resolvedLabel = label ?? copy.back;

  const handlePress = React.useCallback(() => {
    if (onPress) {
      onPress();
    } else {
      navigation.goBack();
    }
  }, [navigation, onPress]);

  return (
    <TouchableOpacity
      style={[styles.button, style]}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={resolvedLabel}
    >
      <MaterialIcons name="arrow-back" size={24} color={colors.text} />
      <Text style={[styles.label, { color: colors.text }, textStyle]}>{resolvedLabel}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    marginTop: 4,
    paddingVertical: 6,
    paddingHorizontal: 0,
    // Align with content column – most ScrollViews add 8 px horizontal padding
    marginLeft: 4,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    marginLeft: 4,
    fontSize: 16,
    fontWeight: '500',
  },
});

export default BackButton;
