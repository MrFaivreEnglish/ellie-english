import React from 'react';
import { StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native';
import type { ThemeColors } from '../settings/ThemeContext';
import { triggerSelectionHaptic } from './haptics';
import MaterialIcons from './ThemedMaterialIcon';
import { getWebLessonScale, scaleValue } from './responsiveLayout';

export type PracticeCollapseButtonProps = {
  colors: ThemeColors;
  isDarkMode: boolean;
  isDesktopWeb: boolean;
  // Optional — defaults to computing its own from the window if the caller
  // hasn't already worked one out (PracticeSheet passes its own to avoid a
  // second useWindowDimensions read).
  scale?: number;
  onPress: () => void;
};

const PracticeCollapseButton: React.FC<PracticeCollapseButtonProps> = ({
  colors,
  isDarkMode,
  isDesktopWeb,
  scale,
  onPress,
}) => {
  const { width, height } = useWindowDimensions();
  const webLessonScale = scale ?? getWebLessonScale(width, height);

  return (
    <TouchableOpacity
      activeOpacity={0.82}
      onPress={() => {
        triggerSelectionHaptic();
        onPress();
      }}
      accessibilityRole="button"
      accessibilityLabel="Back to lesson"
      style={[
        styles.button,
        {
          height: isDesktopWeb ? 40 : scaleValue(34, webLessonScale),
          width: isDesktopWeb ? 40 : scaleValue(34, webLessonScale),
          backgroundColor: isDarkMode ? colors.surface : colors.card,
          borderColor: colors.borderStrong,
        },
      ]}
    >
      <MaterialIcons
        name="arrow-downward"
        size={isDesktopWeb ? 22 : scaleValue(18, webLessonScale)}
        color={colors.borderStrong}
      />
    </TouchableOpacity>
  );
};

export default React.memo(PracticeCollapseButton);

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1.5,
    flexShrink: 0,
    justifyContent: 'center',
  },
});
