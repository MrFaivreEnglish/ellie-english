import { Platform } from 'react-native';
import { useMemo, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { clampNumber, getWebLessonImageScale, getWebLessonScale, scaleValue } from '../shared/responsiveLayout';
import { getApkPreviewStatusBarInset, isApkLayoutPreviewEnabled } from '../shared/apkPreview';

export type VocabularyMode = 'flashcards' | 'matching' | 'typing';

const ANDROID_SECOND_VIEW = {
  modeRowTopGap: 8,
  modeRowTopGapWithStatusBar: 4,
  bodyTopGapCompact: 10,
  bodyTopGapRegular: 14,
  toolbarHeightCompact: 52,
  toolbarHeightRegular: 56,
  gameTopGap: 2,
};

export function useLessonLayout({
  mode,
  viewportHeight,
  screenWidth,
  rawScreenHeight,
  keyboardHeight,
  stableScreenHeight,
  hasMatchingCategoryControls,
  isAndroidStatusBarEnabled,
}: {
  mode: VocabularyMode;
  viewportHeight: number;
  screenWidth: number;
  rawScreenHeight: number;
  keyboardHeight: number;
  stableScreenHeight: number;
  hasMatchingCategoryControls: boolean;
  isAndroidStatusBarEnabled: boolean;
}) {
  const insets = useSafeAreaInsets();
  const useApkPreviewLayout = isApkLayoutPreviewEnabled();

  const isAndroidLesson = Platform.OS === 'android' || useApkPreviewLayout;
  const isWebLessonLayout = Platform.OS === 'web' && !useApkPreviewLayout;
  const useReservedModeShell = isAndroidLesson || isWebLessonLayout;
  const isCompactPracticeMode = mode === 'matching' || mode === 'typing';
  const lessonLayoutWidth = useApkPreviewLayout ? Math.min(screenWidth, 430) : screenWidth;

  const keyboardHeightDrop = stableScreenHeight - rawScreenHeight;
  const isTypingKeyboardOpen = mode === 'typing' && (keyboardHeight > 0 || keyboardHeightDrop > 120);
  const screenHeight = isTypingKeyboardOpen ? stableScreenHeight : rawScreenHeight;
  const lessonViewportHeight = viewportHeight > 0 ? viewportHeight : screenHeight;
  const isCompactScreen = lessonViewportHeight < 760 || lessonLayoutWidth < 390;
  const isLargeScreen = lessonViewportHeight > 900 && lessonLayoutWidth >= 400;

  const webLessonScale = getWebLessonScale(lessonLayoutWidth, lessonViewportHeight);
  const webLessonImageScale = getWebLessonImageScale(lessonLayoutWidth, lessonViewportHeight);
  const isDesktopWebLesson = isWebLessonLayout && lessonLayoutWidth >= 768;
  const isScaledWebLesson = isDesktopWebLesson && webLessonScale > 1;

  const webLessonMediaMaxWidth = isWebLessonLayout
    ? Math.round(clampNumber(lessonLayoutWidth * 0.78, 860, 1320))
    : undefined;
  const lessonMediaWidth = Math.round(
    isWebLessonLayout
      ? Math.min(lessonLayoutWidth * 0.96, webLessonMediaMaxWidth ?? lessonLayoutWidth * 0.96)
      : lessonLayoutWidth * 0.96
  );
  const lessonImageContentScale = 1;
  const webLessonGameMaxWidth = isWebLessonLayout
    ? isDesktopWebLesson
      ? Math.round(clampNumber(lessonLayoutWidth * 0.62, 840, 1040))
      : scaleValue(760, webLessonScale)
    : undefined;
  const webTypingGameMaxWidth = isWebLessonLayout
    ? Math.round(clampNumber(lessonLayoutWidth * 0.7, 820, 1060))
    : undefined;
  const webMatchingGameMaxWidth = isWebLessonLayout
    ? Math.round(clampNumber(lessonLayoutWidth * 0.82, 820, 1240))
    : undefined;

  const androidTopInsetValue = useApkPreviewLayout ? getApkPreviewStatusBarInset() : insets.top;
  const layoutTopInset = Platform.OS === 'ios'
    ? (insets.top > 0 ? insets.top : 0)
    : isAndroidLesson && isAndroidStatusBarEnabled
      ? androidTopInsetValue
      : 0;
  const layoutBottomInset = isAndroidLesson ? 0 : insets.bottom;
  const stickyHeaderTopPadding = isWebLessonLayout ? 4 : 6;
  const androidModeRowTopGap = isAndroidLesson && isAndroidStatusBarEnabled
    ? ANDROID_SECOND_VIEW.modeRowTopGapWithStatusBar
    : ANDROID_SECOND_VIEW.modeRowTopGap;
  // Note: androidSecondViewTopInset (status bar height) is deliberately NOT
  // added here — it's already reserved once via layoutTopInset on the
  // ScrollView's own contentContainerStyle. Adding it again on top of the
  // mode-bar shell double-counted the status bar and left a large gap above
  // the mode row on the very first view that web (which has no status bar
  // inset here) never showed.
  const stickyHeaderPinnedTopPadding = isAndroidLesson
    ? androidModeRowTopGap
    : stickyHeaderTopPadding;

  const STICKY_TOP_SNAP_OFFSET = 0;
  const FLASHCARDS_VIEW_SNAP_EXTRA = 0;
  const TYPING_VIEW_SNAP_EXTRA = isAndroidLesson ? 0 : isTypingKeyboardOpen ? (isCompactScreen ? 42 : 28) : 0;
  const FLASHCARDS_VIEWPORT_TRIM = isAndroidLesson
    ? isCompactScreen ? 12 : 18
    : isCompactScreen ? 44 : 68;
  const BOTTOM_NAVIGATION_RESERVE = isWebLessonLayout
    ? (lessonLayoutWidth >= 768 ? 58 : 58)
    : isAndroidLesson
      ? Math.max(insets.bottom, 12)
      : 50 + Math.max(insets.bottom, 0);

  // The category-controls row also always shows the audio-match toggle while
  // in Match mode (even for lessons with no categories), so its height must
  // be reserved whenever mode === 'matching' too — not just when a category
  // picker is present — or the board budget undercounts the row and the
  // match tiles end up sized differently depending on whether a category
  // happens to be selectable.
  const hasAndroidGameToolbar = isAndroidLesson && (hasMatchingCategoryControls || mode === 'flashcards' || mode === 'matching');
  const MATCHING_CATEGORY_CONTROLS_HEIGHT = (hasMatchingCategoryControls || mode === 'matching')
    ? isWebLessonLayout && lessonLayoutWidth >= 768 ? 38 : 46
    : 0;
  const MATCHING_GAME_TOP_SPACE = isAndroidLesson
    ? 0
    : (isWebLessonLayout && lessonLayoutWidth >= 768 ? 4 : 0) + 2;

  const FIRST_VIEW_BOTTOM_SPACE = isCompactScreen ? 20 : 28;
  const FIRST_VIEW_PEEK = 0;
  const FIRST_VIEW_MODE_RAISE = isAndroidLesson
    ? (isCompactScreen ? 22 : 26)
    : isDesktopWebLesson
      ? 0
      : (isCompactScreen ? 14 : 18);
  const FIRST_VIEW_SECOND_VIEW_GUARD = 44;
  const SECOND_VIEW_CONTROLS_HEIGHT = isCompactScreen ? 46 : 50;
  const ANDROID_GAME_TOOLBAR_HEIGHT = hasAndroidGameToolbar
    ? isCompactScreen
      ? ANDROID_SECOND_VIEW.toolbarHeightCompact
      : ANDROID_SECOND_VIEW.toolbarHeightRegular
    : 0;
  const ANDROID_GAME_CONTENT_TOP_PADDING = isAndroidLesson ? ANDROID_SECOND_VIEW.gameTopGap : 0;
  const LESSON_BODY_TOP_BUFFER = isCompactPracticeMode
    ? 0
    : isAndroidLesson
      ? isCompactScreen ? ANDROID_SECOND_VIEW.bodyTopGapCompact : ANDROID_SECOND_VIEW.bodyTopGapRegular
      : isCompactScreen ? 6 : 8;
  const flashcardModuleTopDrop = mode === 'flashcards' && !isDesktopWebLesson
    ? isAndroidLesson
      ? (isCompactScreen ? 10 : 12)
      : (isCompactScreen ? 14 : 18)
    : 0;
  const flashcardSectionTopSpace = (isAndroidLesson ? 0 : 8) + flashcardModuleTopDrop;
  // Keep Write's full-size layout when the keyboard opens.
  const typingKeyboardInset = 0;
  const secondViewBottomReserve = isWebLessonLayout || isTypingKeyboardOpen ? 0 : BOTTOM_NAVIGATION_RESERVE;
  const scrollBottomPadding = isAndroidLesson && !isTypingKeyboardOpen ? 0 : Math.max(insets.bottom, 4);
  const compactModeButtons = lessonLayoutWidth < 390;

  const [titleBlockHeight, setTitleBlockHeight] = useState(72);
  const [stickyHeaderHeight, setStickyHeaderHeight] = useState(112);

  const overviewMinHeight = Math.max(
    isCompactScreen ? 420 : 500,
    lessonViewportHeight - layoutTopInset - layoutBottomInset - stickyHeaderHeight - FIRST_VIEW_PEEK - FIRST_VIEW_MODE_RAISE
  );

  const lessonImageHeight = useMemo(() => {
    const imageReservedGap = isWebLessonLayout
      ? (isCompactScreen ? 54 : 60)
      : (isCompactScreen ? 10 : 14);
    const availableHeight = overviewMinHeight - titleBlockHeight - FIRST_VIEW_BOTTOM_SPACE - imageReservedGap;
    const minHeight = Math.round(clampNumber(
      lessonViewportHeight * (isCompactScreen ? 0.45 : 0.53),
      isCompactScreen ? 300 : 405,
      isCompactScreen ? 400 : 545
    ));
    const maxByViewport = Math.round(clampNumber(
      lessonViewportHeight * (isCompactScreen ? 0.72 : isLargeScreen ? 0.82 : 0.78),
      isCompactScreen ? 430 : 560,
      isLargeScreen ? 1060 : 900
    ));
    const maxByWidth = isWebLessonLayout
      ? Math.round(clampNumber(lessonLayoutWidth * 0.95, 680, 1260) * webLessonImageScale)
      : Math.round(clampNumber(lessonLayoutWidth * 2.05, 560, isLargeScreen ? 1040 : 910));
    const maxHeight = Math.max(minHeight, Math.min(maxByViewport, maxByWidth));
    return Math.round(clampNumber(availableHeight, minHeight, maxHeight));
  }, [FIRST_VIEW_BOTTOM_SPACE, isCompactScreen, isLargeScreen, isWebLessonLayout, lessonLayoutWidth, lessonViewportHeight, overviewMinHeight, titleBlockHeight, webLessonImageScale]);

  const secondViewMinHeight = useMemo(() => {
    const availableHeight =
      lessonViewportHeight - layoutBottomInset - stickyHeaderHeight - secondViewBottomReserve - (isCompactScreen ? 8 : 12);
    return Math.max(isCompactScreen ? 250 : 280, availableHeight);
  }, [isCompactScreen, layoutBottomInset, lessonViewportHeight, secondViewBottomReserve, stickyHeaderHeight]);

  const secondViewShellMinHeight = isAndroidLesson
    ? lessonViewportHeight
    : stickyHeaderHeight + secondViewMinHeight;

  const androidPracticeViewportHeight = useMemo(() => {
    if (!isAndroidLesson) return undefined;
    const availableHeight =
      secondViewMinHeight - LESSON_BODY_TOP_BUFFER - ANDROID_GAME_TOOLBAR_HEIGHT - ANDROID_GAME_CONTENT_TOP_PADDING - FLASHCARDS_VIEWPORT_TRIM;
    return Math.max(isCompactScreen ? 220 : 260, availableHeight);
  }, [ANDROID_GAME_CONTENT_TOP_PADDING, ANDROID_GAME_TOOLBAR_HEIGHT, FLASHCARDS_VIEWPORT_TRIM, LESSON_BODY_TOP_BUFFER, isCompactScreen, isAndroidLesson, secondViewMinHeight]);

  const gameViewportMinHeight = useMemo(() => {
    if (isAndroidLesson) return androidPracticeViewportHeight ?? (isCompactScreen ? 220 : 260);
    const baseHeight = secondViewMinHeight - SECOND_VIEW_CONTROLS_HEIGHT - FLASHCARDS_VIEWPORT_TRIM - (isCompactScreen ? 6 : 10);
    return Math.max(isCompactScreen ? 170 : 190, baseHeight);
  }, [androidPracticeViewportHeight, FLASHCARDS_VIEWPORT_TRIM, SECOND_VIEW_CONTROLS_HEIGHT, isCompactScreen, isAndroidLesson, secondViewMinHeight]);

  const flashcardLayoutHeight = Math.max(150, gameViewportMinHeight - flashcardSectionTopSpace);

  const matchingViewportMinHeight = useMemo(() => {
    if (isAndroidLesson) return androidPracticeViewportHeight ?? (isCompactScreen ? 260 : 320);
    const availableHeight = lessonViewportHeight
      - stickyHeaderHeight - BOTTOM_NAVIGATION_RESERVE - LESSON_BODY_TOP_BUFFER
      - MATCHING_CATEGORY_CONTROLS_HEIGHT - MATCHING_GAME_TOP_SPACE;
    return Math.max(isCompactScreen ? 260 : 320, availableHeight);
  }, [androidPracticeViewportHeight, BOTTOM_NAVIGATION_RESERVE, LESSON_BODY_TOP_BUFFER, MATCHING_CATEGORY_CONTROLS_HEIGHT, MATCHING_GAME_TOP_SPACE, isCompactScreen, isAndroidLesson, lessonViewportHeight, stickyHeaderHeight]);

  const typingViewportMinHeight = useMemo(() => {
    if (isAndroidLesson) return androidPracticeViewportHeight ?? (isCompactScreen ? 220 : 260);
    const availableHeight = secondViewMinHeight - SECOND_VIEW_CONTROLS_HEIGHT - FLASHCARDS_VIEWPORT_TRIM - (isCompactScreen ? 6 : 10);
    return Math.max(isCompactScreen ? 170 : 190, availableHeight);
  }, [androidPracticeViewportHeight, FLASHCARDS_VIEWPORT_TRIM, SECOND_VIEW_CONTROLS_HEIGHT, isCompactScreen, isAndroidLesson, secondViewMinHeight]);

  const matchingViewSnapExtra = useMemo(() => {
    if (isAndroidLesson) return 0;
    const bottomNavigationReserve = isWebLessonLayout
      ? (lessonLayoutWidth >= 768 ? 64 : 58)
      : Math.max(insets.bottom, 42);
    const gameTopSpace = (isWebLessonLayout && lessonLayoutWidth >= 768 ? 4 : 0) + 2;
    const visiblePracticeHeight = Math.max(1, lessonViewportHeight - stickyHeaderHeight - bottomNavigationReserve);
    const matchingTopChromeHeight = MATCHING_CATEGORY_CONTROLS_HEIGHT + gameTopSpace;
    const matchingContentHeight = LESSON_BODY_TOP_BUFFER + matchingTopChromeHeight + matchingViewportMinHeight;
    return Math.max(0, matchingContentHeight - visiblePracticeHeight);
  }, [LESSON_BODY_TOP_BUFFER, MATCHING_CATEGORY_CONTROLS_HEIGHT, insets.bottom, isAndroidLesson, isWebLessonLayout, lessonLayoutWidth, lessonViewportHeight, matchingViewportMinHeight, stickyHeaderHeight]);

  return {
    insets,
    useApkPreviewLayout,
    isAndroidLesson,
    isWebLessonLayout,
    useReservedModeShell,
    lessonLayoutWidth,
    isTypingKeyboardOpen,
    lessonViewportHeight,
    isCompactScreen,
    webLessonScale,
    isDesktopWebLesson,
    isScaledWebLesson,
    webLessonMediaMaxWidth,
    lessonMediaWidth,
    lessonImageContentScale,
    webLessonGameMaxWidth,
    webTypingGameMaxWidth,
    webMatchingGameMaxWidth,
    layoutTopInset,
    stickyHeaderPinnedTopPadding,
    STICKY_TOP_SNAP_OFFSET,
    FLASHCARDS_VIEW_SNAP_EXTRA,
    TYPING_VIEW_SNAP_EXTRA,
    FIRST_VIEW_SECOND_VIEW_GUARD,
    LESSON_BODY_TOP_BUFFER,
    ANDROID_GAME_TOOLBAR_HEIGHT,
    hasAndroidGameToolbar,
    flashcardModuleTopDrop,
    compactModeButtons,
    typingKeyboardInset,
    scrollBottomPadding,
    titleBlockHeight,
    setTitleBlockHeight,
    stickyHeaderHeight,
    setStickyHeaderHeight,
    overviewMinHeight,
    lessonImageHeight,
    secondViewMinHeight,
    secondViewShellMinHeight,
    gameViewportMinHeight,
    flashcardLayoutHeight,
    matchingViewportMinHeight,
    typingViewportMinHeight,
    matchingViewSnapExtra,
  };
}
