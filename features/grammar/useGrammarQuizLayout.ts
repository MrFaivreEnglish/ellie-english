import { useState } from 'react';
import { Platform, useWindowDimensions } from 'react-native';
import { useTheme } from '../settings/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getTopSafeAreaInset, getWebLessonScale, isDesktopWebWidth, scaleValue } from '../shared/responsiveLayout';
import { reservesSoftKeyboardSpace, useStableViewportHeight } from '../shared/softKeyboardLayout';
import type { ExerciseMode } from './grammarExercises/GrammarExerciseUtils';
















export const useGrammarQuizLayout = () => {
  const { colors, isDarkMode, isGrammarGameMode, isGrammarSpeechEnabled, isAndroidStatusBarEnabled } = useTheme();
  const insets = useSafeAreaInsets();
  const { width: windowWidth, height: rawWindowHeight } = useWindowDimensions();

  const [exerciseMode, setExerciseMode] = useState<ExerciseMode>('quiz');
  const stableViewportHeight = useStableViewportHeight();






  const isDesktopWebLayout = isDesktopWebWidth(windowWidth, undefined, stableViewportHeight);





  const isTabletLayout = !isDesktopWebLayout && Math.min(windowWidth, stableViewportHeight) >= 600;


  const hasSoftKeyboard = reservesSoftKeyboardSpace(windowWidth);





  const reservesFillKeyboardSpace = exerciseMode === 'fill' && hasSoftKeyboard;
  const isCompactScreen = stableViewportHeight < 760 || windowWidth < 390;
  const webLessonScale = getWebLessonScale(windowWidth, stableViewportHeight);






  const isScaledWebLesson = webLessonScale > 1;
  const lessonImageContentScale = 1;



  const quizOptionGap = scaleValue(Platform.OS === 'web' ? 15 : 13, webLessonScale);
  const layoutTopInset = getTopSafeAreaInset(Platform.OS, insets.top, isAndroidStatusBarEnabled);

  return {
    colors, isDarkMode, isGrammarGameMode, isGrammarSpeechEnabled,
    insets, windowWidth, rawWindowHeight, stableViewportHeight,
    exerciseMode, setExerciseMode,
    hasSoftKeyboard, reservesFillKeyboardSpace,
    isDesktopWebLayout, isTabletLayout, isCompactScreen,
    webLessonScale, isScaledWebLesson,
    lessonImageContentScale,
    quizOptionGap,
    layoutTopInset,
  };
};
