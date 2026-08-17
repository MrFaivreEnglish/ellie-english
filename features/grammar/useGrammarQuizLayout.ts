import { useState } from 'react';
import { Platform, useWindowDimensions } from 'react-native';
import { useTheme } from '../settings/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { clampNumber, getWebLessonImageScale, getWebLessonScale, scaleValue } from '../shared/responsiveLayout';
import { CARD_HEIGHT, type ExerciseMode } from './grammarExercises/GrammarExerciseUtils';

export const ANDROID_SECOND_VIEW_LAYOUT = {
  modeRowTopGap: 8,
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
    ? (isDesktopWebLayout ? Math.round(clampNumber(windowWidth * 0.62, 760, 1080)) : scaleValue(672, webLessonScale))
    : undefined;
  // Fill/Reorder/Translate size their own card internally and only need a
  // small shared floor here (this is what quizCardHeight used to be, for
  // every mode, before Quiz got its own viewport-aware height below).
  const exerciseCardBaseHeight = Platform.OS === 'web' ? scaleValue(284, webLessonScale) : CARD_HEIGHT;
  // On desktop, the 4-option stack targets ~40% of the viewport height (20%
  // less than the initial ~50% pass), so it still reads as "big" while
  // leaving the header/question card/bottom nav their own share and never
  // forcing a scroll on typical desktop sizes.
  const quizCardHeight = Platform.OS === 'web'
    ? (isDesktopWebLayout
        ? Math.round(clampNumber(lessonViewportHeight * 0.4, 340, 512))
        : scaleValue(284, webLessonScale))
    : CARD_HEIGHT;
  const quizOptionGap = Platform.OS === 'web' ? scaleValue(12, webLessonScale) : 10;
  const quizOptionHeight = (quizCardHeight - quizOptionGap * 3) / 4;
  const layoutTopInset = Platform.OS === 'ios'
    ? (insets.top > 0 ? insets.top : 0)
    : Platform.OS === 'android' && isAndroidStatusBarEnabled
      ? insets.top
      : 0;
  const layoutBottomInset = Platform.OS === 'android' ? 0 : insets.bottom;
  const stickyHeaderTopPadding = Platform.OS === 'web' ? 4 : 6;
  const androidModeRowTopGap = Platform.OS === 'android' && isAndroidStatusBarEnabled
    ? ANDROID_SECOND_VIEW_LAYOUT.modeRowTopGapWithStatusBar
    : ANDROID_SECOND_VIEW_LAYOUT.modeRowTopGap;
  // Note: the status bar inset is deliberately NOT added here — it's already
  // reserved once via layoutTopInset on the ScrollView's own
  // contentContainerStyle. Adding it again on top of the mode-bar shell
  // double-counted the status bar and left a large gap above the mode row on
  // the very first view that web (no status bar inset here) never showed.
  const stickyHeaderPinnedTopPadding = Platform.OS === 'android'
    ? androidModeRowTopGap
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
    quizCardHeight, quizOptionGap, quizOptionHeight, exerciseCardBaseHeight,
    layoutTopInset, layoutBottomInset, stickyHeaderTopPadding,
    androidModeRowTopGap, stickyHeaderPinnedTopPadding,
    STICKY_TOP_SNAP_OFFSET,
    QUIZ_VIEW_SNAP_EXTRA, FILL_VIEW_SNAP_EXTRA, REORDER_VIEW_SNAP_EXTRA, TRANSLATE_VIEW_SNAP_EXTRA,
    FIRST_VIEW_BOTTOM_SPACE, FIRST_VIEW_PEEK, FIRST_VIEW_MODE_RAISE, FIRST_VIEW_SECOND_VIEW_GUARD,
  };
};
