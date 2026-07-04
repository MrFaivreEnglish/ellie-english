import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ExerciseMode } from './GrammarExerciseUtils';
import { useTheme } from '../../settings/ThemeContext';
import { scaleValue } from '../../shared/responsiveLayout';
import { getSoftShadow, uiRadii } from '../../shared/uiPrimitives';

interface GrammarModeTabsProps {
  modes: { key: ExerciseMode; label: string }[];
  activeMode: ExerciseMode;
  onChangeMode: (mode: ExerciseMode) => void;
  layoutScale?: number;
}

const grammarModeIcons: Record<ExerciseMode, React.ComponentProps<typeof MaterialIcons>['name']> = {
  quiz: 'quiz',
  fill: 'edit-note',
  reorder: 'swap-vert',
  translate: 'translate',
};

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

  return (
    <View
      style={[
        styles.exerciseModeButtons,
        compactModeButtons && styles.exerciseModeButtonsCompact,
        { maxWidth: scaleValue(460, layoutScale) },
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
                marginHorizontal: compactModeButtons ? 3 : scaleValue(8, layoutScale),
                paddingVertical: compactModeButtons
                  ? 9
                  : Platform.OS === 'web'
                    ? scaleValue(10, layoutScale)
                    : 12,
                backgroundColor: isDarkMode ? colors.surface : colors.card,
                borderColor: colors.borderStrong,
              },
              getSoftShadow(isDarkMode, active ? 'raised' : 'soft'),
              active && [
                styles.activeExerciseModeButton,
                {
                  backgroundColor: colors.buttonBackground ?? colors.primary,
                  borderColor: colors.primary,
                  shadowColor: colors.buttonBackground ?? colors.primary,
                },
              ],
            ]}
          >
            <MaterialIcons
              name={grammarModeIcons[mode.key]}
              size={compactModeButtons ? 15 : 18}
              color={active ? colors.buttonText : colors.primary}
            />
            <Text
              style={[
                styles.exerciseModeButtonText,
                compactModeButtons && styles.exerciseModeButtonTextCompact,
                { color: colors.text, fontSize: scaleValue(compactModeButtons ? 14 : 16, layoutScale) },
                isDesktopWeb && styles.exerciseModeButtonTextDesktopWeb,
                active && styles.activeExerciseModeButtonText,
                active && { color: colors.buttonText },
              ]}
              numberOfLines={1}
              ellipsizeMode="tail"
              allowFontScaling={false}
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
    maxWidth: 460,
    alignSelf: 'center',
    marginBottom: 0,
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
    borderWidth: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    borderRadius: uiRadii.control,
  },
  exerciseModeButtonCompact: {
    minHeight: 42,
    marginHorizontal: 3,
    paddingHorizontal: 3,
    paddingVertical: 9,
    gap: 3,
  },
  activeExerciseModeButton: {
    backgroundColor: '#1982d2ff',
    borderColor: '#105b94ff',
  },
  exerciseModeButtonText: {
    flexShrink: 1,
    maxWidth: '100%',
    fontSize: 16,
    lineHeight: 19,
    fontWeight: '400',
  },
  exerciseModeButtonTextCompact: {
    fontSize: 14,
    lineHeight: 17,
  },
  exerciseModeButtonTextDesktopWeb: {
    fontWeight: '600',
  },
  activeExerciseModeButtonText: {
    color: '#fff',
  },
});
