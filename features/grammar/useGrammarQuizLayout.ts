import { useState } from 'react';
import { Platform, useWindowDimensions } from 'react-native';
import { useTheme } from '../settings/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { clampNumber, getWebLessonImageScale, getWebLessonScale, scaleValue } from '../shared/responsiveLayout';
import { CARD_HEIGHT, type ExerciseMode } from './grammarExercises/GrammarExerciseUtils';

export const ANDROID_SECOND_VIEW_LAYOUT = {
  modeRowTopGap: 18,
  modeRowTopGapWithStatusBar: 4,
};

export const useGrammarQuizLayout = () => {
  const { colors, isDarkMode, isGrammarGameMode, isGrammarSpeechEnabled, isAndroidStatusBarEnabled } = useTheme();
  const insets = useSafeAreaInsets();
  const { width: windowWidth, height: rawWindowHeight } = useWindowDimensions();

  const [exerciseMode, setExerciseMode] = useState<ExerciseMode>('quiz');
  const [viewportHeight, setViewportHeight] = useState(rawWindowHeight);
  const [isSecondViewActive, setIsSecondViewActive] = useState(false);
  const [stableWindowHeight, setStableWindowHeight] = useState(rawWindowHeight);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const keyboardHeightDrop = stableWindowHeight - rawWindowHeight;
  const isKeyboardOpen = keyboardHeight > 0 || keyboardHeightDrop > 120;
  const isFillKeyboardOpen = exerciseMode === 'fill' && isKeyboardOpen;
  const windowHeight = isKeyboardOpen ? stableWindowHeight : rawWindowHeight;
  const lessonViewportHeight = viewportHeight > 0 ? viewportHeight : windowHeight;
  const isAndroidLesson = Platform.OS === 'android';
  const isDesktopWebLayout = Platform.OS === 'web' && windowWidth >= 768;
  const isCompactScreen = lessonViewportHeight < 760 || windowWidth < 390;
  const isKeyboardTightScreen = !isDesktopWebLayout && (lessonViewportHeight < 700 || windowWidth < 380);
  const isLargeScreen = lessonViewportHeight > 900 && windowWidth >= 400;
  const webLessonScale = getWebLessonScale(windowWidth, lessonViewportHeight);
  const webLessonImageScale = getWebLessonImageScale(windowWidth, lessonViewportHeight);
  const isScaledWebLesson = isDesktopWebLayout && webLessonScale > 1;
  const webLessonMediaMaxWidth = Platform.OS === 'web'
    ? Math.round(clampNumber(windowWidth * 0.78, 860, 1320))
    : undefined;
  const lessonMediaWidth = Math.round(
    Platform.OS === 'web'
      ? Math.min(windowWidth * 0.96, webLessonMediaMaxWidth ?? windowWidth * 0.96)
      : windowWidth * 0.96
  );
  const lessonImageContentScale = 1;
  const webExerciseMaxWidth = Platform.OS === 'web'
    ? isDesktopWebLayout
      ? Math.round(clampNumber(windowWidth * 0.66, 860, 1040))
      : scaleValue(760, webLessonScale)
    : undefined;
  const quizCardHeight = Platform.OS === 'web'
    ? scaleValue(isDesktopWebLayout ? 320 : CARD_HEIGHT, webLessonScale)
    : CARD_HEIGHT;
  const quizOptionGap = Platform.OS === 'web' ? scaleValue(6, webLessonScale) : 6;
  const quizOptionHeight = (quizCardHeight - quizOptionGap * 3) / 4;
  const layoutTopInset = Platform.OS === 'ios'
    ? (insets.top > 0 ? insets.top : 0)
    : Platform.OS === 'android' && isAndroidStatusBarEnabled
      ? insets.top
      : 0;
  const layoutBottomInset = Platform.OS === 'android' ? 0 : insets.bottom;
  const stickyHeaderTopPadding = Platform.OS === 'web' ? 4 : 6;
  const androidSecondViewTopInset = Platform.OS === 'android' && isAndroidStatusBarEnabled ? layoutTopInset : 0;
  const androidModeRowTopGap = Platform.OS === 'android' && isAndroidStatusBarEnabled
    ? ANDROID_SECOND_VIEW_LAYOUT.modeRowTopGapWithStatusBar
    : ANDROID_SECOND_VIEW_LAYOUT.modeRowTopGap;
  const stickyHeaderPinnedTopPadding = Platform.OS === 'android'
    ? androidSecondViewTopInset + androidModeRowTopGap
    : stickyHeaderTopPadding;

  const STICKY_TOP_SNAP_OFFSET = 0;
  const QUIZ_VIEW_SNAP_EXTRA = 0;
  const FILL_VIEW_SNAP_EXTRA = 0;
  const REORDER_VIEW_SNAP_EXTRA = 0;
  const TRANSLATE_VIEW_SNAP_EXTRA = 0;
  const FIRST_VIEW_BOTTOM_SPACE = isCompactScreen ? 20 : 28;
  const FIRST_VIEW_PEEK = 0;
  const FIRST_VIEW_MODE_RAISE = isAndroidLesson
    ? (isCompactScreen ? 22 : 26)
    : isDesktopWebLayout
      ? 0
      : (isCompactScreen ? 14 : 18);
  const FIRST_VIEW_SECOND_VIEW_GUARD = 44;

  return {
    colors, isDarkMode, isGrammarGameMode, isGrammarSpeechEnabled, isAndroidStatusBarEnabled,
    insets, windowWidth, rawWindowHeight,
    exerciseMode, setExerciseMode,
    viewportHeight, setViewportHeight,
    isSecondViewActive, setIsSecondViewActive,
    stableWindowHeight, setStableWindowHeight,
    keyboardHeight, setKeyboardHeight,
    keyboardHeightDrop, isKeyboardOpen, isFillKeyboardOpen, windowHeight, lessonViewportHeight,
    isAndroidLesson, isDesktopWebLayout, isCompactScreen, isKeyboardTightScreen, isLargeScreen,
    webLessonScale, webLessonImageScale, isScaledWebLesson, webLessonMediaMaxWidth,
    lessonMediaWidth, lessonImageContentScale, webExerciseMaxWidth,
    quizCardHeight, quizOptionGap, quizOptionHeight,
    layoutTopInset, layoutBottomInset, stickyHeaderTopPadding,
    androidSecondViewTopInset, androidModeRowTopGap, stickyHeaderPinnedTopPadding,
    STICKY_TOP_SNAP_OFFSET,
    QUIZ_VIEW_SNAP_EXTRA, FILL_VIEW_SNAP_EXTRA, REORDER_VIEW_SNAP_EXTRA, TRANSLATE_VIEW_SNAP_EXTRA,
    FIRST_VIEW_BOTTOM_SPACE, FIRST_VIEW_PEEK, FIRST_VIEW_MODE_RAISE, FIRST_VIEW_SECOND_VIEW_GUARD,
  };
};
