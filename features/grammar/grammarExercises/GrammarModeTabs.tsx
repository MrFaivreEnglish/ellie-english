import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ExerciseMode } from './GrammarExerciseUtils';
import { useTheme } from '../../settings/ThemeContext';
import { scaleValue } from '../../shared/responsiveLayout';

interface GrammarModeTabsProps {
  modes: { key: ExerciseMode; label: string }[];
  activeMode: ExerciseMode;
  onChangeMode: (mode: ExerciseMode) => void;
  layoutScale?: number;
}

const GrammarModeTabs: React.FC<GrammarModeTabsProps> = ({
  modes,
  activeMode,
  onChangeMode,
  layoutScale = 1,
}) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.exerciseModeButtons, { maxWidth: scaleValue(460, layoutScale) }]}>
      {modes.map(mode => {
        const active = activeMode === mode.key;

        return (
          <TouchableOpacity
            key={mode.key}
            onPress={() => onChangeMode(mode.key)}
            accessibilityRole="button"
            accessibilityLabel={`Switch to ${mode.label}`}
            accessibilityState={{ selected: active }}
            style={[
              styles.exerciseModeButton,
              {
                marginHorizontal: scaleValue(8, layoutScale),
                paddingVertical: Platform.OS === 'web' ? scaleValue(10, layoutScale) : 12,
              },
              active && [
                styles.activeExerciseModeButton,
                { backgroundColor: colors.primary, borderColor: colors.borderStrong },
              ],
            ]}
          >
            <Text
              style={[
                styles.exerciseModeButtonText,
                { fontSize: scaleValue(16, layoutScale) },
                active && styles.activeExerciseModeButtonText,
              ]}
            >
              {mode.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

export default GrammarModeTabs;

const styles = StyleSheet.create({
  exerciseModeButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 460,
    alignSelf: 'center',
    marginBottom: Platform.OS === 'web' ? 0 : 20,
  },
  exerciseModeButton: {
    flex: 1,
    paddingVertical: Platform.OS === 'web' ? 10 : 12,
    marginHorizontal: 8,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#d7dde5',
    alignItems: 'center',
  },
  activeExerciseModeButton: {
    backgroundColor: '#1982d2ff',
    borderColor: '#105b94ff',
  },
  exerciseModeButtonText: {
    color: '#000000ff',
    fontSize: 16,
    fontWeight: '600',
  },
  activeExerciseModeButtonText: {
    color: '#fff',
  },
});
