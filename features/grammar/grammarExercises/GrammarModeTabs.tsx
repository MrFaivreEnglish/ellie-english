import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { ExerciseMode } from './GrammarExerciseUtils';
import { useTheme } from '../../settings/ThemeContext';
import { scaleValue } from '../../shared/responsiveLayout';
import { getSoftShadow, uiRadii } from '../../shared/uiPrimitives';
import { freshFontFamily } from '../../shared/freshDirection';

interface GrammarModeTabsProps {
  modes: { key: ExerciseMode; label: string }[];
  activeMode: ExerciseMode;
  onChangeMode: (mode: ExerciseMode) => void;
  layoutScale?: number;
}

// Pill-shaped segmented control (track + raised active pill) matching the
// "Fresh Direction" header design shared by Quiz/Fill/Reorder/Translate.
const GrammarModeTabs: React.FC<GrammarModeTabsProps> = ({
  modes,
  activeMode,
  onChangeMode,
  layoutScale = 1,
}) => {
  const { colors, isDarkMode } = useTheme();
  const { width } = useWindowDimensions();
  const isDesktopWeb = Platform.OS === 'web' && width >= 768;
  const compactModeButtons = Platform.OS !== 'web' && width < 390;
  const tabColors = isDarkMode
    ? { track: colors.surface, inactiveText: colors.secondaryText, activePill: colors.card, activeText: '#3FA0DB' }
    : { track: '#ECE8DD', inactiveText: colors.secondaryText, activePill: '#FFFFFF', activeText: '#4AA3D2' };

  return (
    <View
      style={[
        styles.exerciseModeButtons,
        compactModeButtons && styles.exerciseModeButtonsCompact,
        { maxWidth: scaleValue(380, layoutScale), backgroundColor: tabColors.track },
      ]}
    >
      {modes.map(mode => {
        const active = activeMode === mode.key;

        return (
          <TouchableOpacity
            key={mode.key}
            onPress={() => onChangeMode(mode.key)}
            activeOpacity={0.82}
            accessibilityRole="button"
            accessibilityLabel={`Switch to ${mode.label}`}
            accessibilityState={{ selected: active }}
            style={[
              styles.exerciseModeButton,
              compactModeButtons && styles.exerciseModeButtonCompact,
              {
                marginHorizontal: compactModeButtons ? 3 : scaleValue(4, layoutScale),
                paddingVertical: compactModeButtons
                  ? 9
                  : Platform.OS === 'web'
                    ? scaleValue(10, layoutScale)
                    : 12,
              },
              active && [
                styles.activeExerciseModeButton,
                { backgroundColor: tabColors.activePill },
                !isDarkMode && getSoftShadow(isDarkMode, 'soft'),
              ],
            ]}
          >
            <Text
              style={[
                styles.exerciseModeButtonText,
                compactModeButtons && styles.exerciseModeButtonTextCompact,
                { color: tabColors.inactiveText, fontSize: scaleValue(compactModeButtons ? 13 : 16, layoutScale) },
                isDesktopWeb && styles.exerciseModeButtonTextDesktopWeb,
                active && { color: tabColors.activeText, fontWeight: freshFontFamily.extrabold },
              ]}
              numberOfLines={1}
              ellipsizeMode="tail"
              allowFontScaling={false}
              adjustsFontSizeToFit
              minimumFontScale={0.72}
            >
              {mode.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

export default React.memo(GrammarModeTabs);

const styles = StyleSheet.create({
  exerciseModeButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 380,
    alignSelf: 'center',
    marginBottom: 0,
    borderRadius: uiRadii.pill,
    padding: 3,
    gap: 2,
  },
  exerciseModeButtonsCompact: {
    maxWidth: '100%',
  },
  exerciseModeButton: {
    flex: 1,
    minWidth: 0,
    minHeight: 44,
    paddingVertical: Platform.OS === 'web' ? 10 : 12,
    paddingHorizontal: 5,
    marginHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: uiRadii.control,
  },
  exerciseModeButtonCompact: {
    minHeight: 42,
    marginHorizontal: 3,
    paddingHorizontal: 3,
    paddingVertical: 9,
  },
  activeExerciseModeButton: {},
  exerciseModeButtonText: {
    flexShrink: 1,
    maxWidth: '100%',
    fontWeight: freshFontFamily.semibold,
    fontSize: 16,
    lineHeight: 19,
  },
  exerciseModeButtonTextCompact: {
    fontSize: 13,
    lineHeight: 16,
  },
  exerciseModeButtonTextDesktopWeb: {},
});
