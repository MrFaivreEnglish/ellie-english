import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Platform, useWindowDimensions, Modal, KeyboardAvoidingView, Keyboard, LayoutAnimation, UIManager } from 'react-native';
import BackButton from '../shared/BackButton';
import ImageWithCredit from '../shared/ImageWithCredit';
import VocabularyFlashcard from './VocabularyFlashcard';
import VocabularyMatching from './VocabularyMatching';
import VocabularyCompletionModal from './VocabularyCompletionModal';
import { VocabularySecondViewShell } from './VocabularySecondViewShell';
import { useTheme } from '../settings/ThemeContext';
import { useVocabularyGame } from './useVocabularyGame';
import { getLessonImage, getLessonThumbnailSource, getMatchingSetCount, shuffleArray } from './vocabularyUtils';
import { Word } from '../../types/VocabularyTypes';
import { useTypingGame } from './useTypingGame';
import VocabularyTyping from './TypingView';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { clampNumber, getWebLessonImageScale, getWebLessonScale, scaleValue } from '../shared/responsiveLayout';
import { getApkPreviewStatusBarInset, isApkLayoutPreviewEnabled } from '../shared/apkPreview';
import { markPracticeActivityToday } from '../progress/xpStorage';
import { saveLastLesson } from '../progress/lastLessonStorage';
import { getLevelDisplayLabel, isMasterLevel } from '../progress/xpLevels';
import { triggerSelectionHaptic, triggerSuccessHaptic } from '../shared/haptics';
import {
  getLearnedFlashcardKeys,
  recordLearnedFlashcardToday,
  saveLearnedFlashcardKeys,
} from './flashcardProgressStorage';
import { getSoftShadow, uiRadii } from '../shared/uiPrimitives';

const shuffleWordList = (words: Word[]) => shuffleArray(words);
const LESSON_MODE_ENABLED = false;
const MAIN_TAB_TARGETS = ['Grammar', 'Vocabulary', 'Lessons', 'Settings'];
const ANDROID_SECOND_VIEW_LAYOUT = {
  modeRowTopGap: 18,
  modeRowTopGapWithStatusBar: 4,
  bodyTopGapCompact: 10,
  bodyTopGapRegular: 14,
  toolbarHeightCompact: 52,
  toolbarHeightRegular: 56,
  gameTopGap: 2,
};
type VocabularyMode = 'flashcards' | 'matching' | 'typing';
const vocabularyWordKey = (word: Word) => `${word.english.trim().toLowerCase()}|${word.french.trim().toLowerCase()}`;
const resolveVocabularyMode = (value: any): VocabularyMode =>
  value === 'matching' || value === 'typing' || value === 'flashcards' ? value : 'flashcards';
const getInitialReverseDirection = (lesson: any) => !!lesson?.initialReverseDirection;
type FlashcardLessonPhase = 'initial' | 'review';

export default function VocabularyLessonScreen({ route, navigation }: any): any {
  const { isDarkMode, colors, isVocabTimerMode, isVocabTimerRecordSavingEnabled, isAndroidStatusBarEnabled } = useTheme();
  const insets = useSafeAreaInsets();
  const initialRouteMode = resolveVocabularyMode(route?.params?.initialMode);

  const { width: screenWidth, height: rawScreenHeight } = useWindowDimensions();
  const [mode, setMode] = useState<VocabularyMode>(initialRouteMode);
  const [viewportHeight, setViewportHeight] = useState(rawScreenHeight);
  const [isSecondViewActive, setIsSecondViewActive] = useState(false);
  const [stableScreenHeight, setStableScreenHeight] = useState(rawScreenHeight);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const useApkPreviewLayout = isApkLayoutPreviewEnabled();
  const isAndroidLesson = Platform.OS === 'android' || useApkPreviewLayout;
  const isWebLessonLayout = Platform.OS === 'web' && !useApkPreviewLayout;
  const useReservedModeShell = isAndroidLesson || isWebLessonLayout;
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
  const androidSecondViewTopInset = isAndroidLesson && isAndroidStatusBarEnabled ? layoutTopInset : 0;
  const androidModeRowTopGap = isAndroidLesson && isAndroidStatusBarEnabled
    ? ANDROID_SECOND_VIEW_LAYOUT.modeRowTopGapWithStatusBar
    : ANDROID_SECOND_VIEW_LAYOUT.modeRowTopGap;
  const stickyHeaderPinnedTopPadding = isAndroidLesson
    ? androidSecondViewTopInset + androidModeRowTopGap
    : stickyHeaderTopPadding;
  const STICKY_TOP_SNAP_OFFSET = 0;
  const FLASHCARDS_VIEW_SNAP_EXTRA = 0;
  const TYPING_VIEW_SNAP_EXTRA = isAndroidLesson ? 0 : isTypingKeyboardOpen ? (isCompactScreen ? 42 : 28) : 0;
  const FLASHCARDS_VIEWPORT_TRIM = isAndroidLesson
    ? isCompactScreen ? 12 : 18
    : isCompactScreen ? 44 : 68;
  const TYPING_VIEWPORT_TRIM = isWebLessonLayout && lessonLayoutWidth >= 768
    ? (isCompactScreen ? 8 : 14)
    : isAndroidLesson
      ? (isCompactScreen ? 4 : 8)
      : FLASHCARDS_VIEWPORT_TRIM;
  const BOTTOM_NAVIGATION_RESERVE = isWebLessonLayout
    ? (lessonLayoutWidth >= 768 ? 58 : 58)
    : isAndroidLesson
      ? Math.max(insets.bottom, 12)
      : 50 + Math.max(insets.bottom, 0);
  const hasMatchingCategoryControls = Array.isArray(route?.params?.lesson?.flashcards?.[0]?.words);
  const hasAndroidGameToolbar = isAndroidLesson && (hasMatchingCategoryControls || mode === 'flashcards');
  const MATCHING_CATEGORY_CONTROLS_HEIGHT = hasMatchingCategoryControls
    ? isWebLessonLayout && lessonLayoutWidth >= 768
      ? 38
      : 46
    : 0;
  const MATCHING_GAME_TOP_SPACE = isAndroidLesson
    ? 0
    : (isWebLessonLayout && lessonLayoutWidth >= 768 ? 4 : 0) + 2;
  const FIRST_VIEW_BOTTOM_SPACE = isCompactScreen ? 20 : 28;
  const FIRST_VIEW_PEEK = 0;
  const SECOND_VIEW_CONTROLS_HEIGHT = isCompactScreen ? 46 : 50;
  const ANDROID_GAME_TOOLBAR_HEIGHT = hasAndroidGameToolbar
    ? isCompactScreen
      ? ANDROID_SECOND_VIEW_LAYOUT.toolbarHeightCompact
      : ANDROID_SECOND_VIEW_LAYOUT.toolbarHeightRegular
    : 0;
  const ANDROID_GAME_CONTENT_TOP_PADDING = isAndroidLesson ? ANDROID_SECOND_VIEW_LAYOUT.gameTopGap : 0;
  const LESSON_BODY_TOP_BUFFER = isAndroidLesson
    ? isCompactScreen ? ANDROID_SECOND_VIEW_LAYOUT.bodyTopGapCompact : ANDROID_SECOND_VIEW_LAYOUT.bodyTopGapRegular
    : mode === 'matching'
      ? isCompactScreen ? 3 : 5
      : isCompactScreen ? 6 : 8;
  const flashcardModuleTopDrop = mode === 'flashcards' && !isDesktopWebLesson
    ? isAndroidLesson
      ? (isCompactScreen ? 10 : 12)
      : (isCompactScreen ? 14 : 18)
    : 0;
  const flashcardSectionTopSpace = (isAndroidLesson ? 0 : 8) + flashcardModuleTopDrop;
  const typingKeyboardInset = isTypingKeyboardOpen
    ? isWebLessonLayout
      ? 12
      : (isCompactScreen ? 24 : 32)
    : 0;
  const secondViewBottomReserve =
    isWebLessonLayout || isTypingKeyboardOpen ? 0 : BOTTOM_NAVIGATION_RESERVE;
  const scrollBottomPadding =
    isAndroidLesson && !isTypingKeyboardOpen ? 0 : Math.max(insets.bottom, 4);
  const compactModeButtons = lessonLayoutWidth < 390;
  const [titleBlockHeight, setTitleBlockHeight] = useState(72);
  const [stickyHeaderHeight, setStickyHeaderHeight] = useState(112);

  const { lesson, backLabel = 'Back to Vocabulary', backTarget } = route.params;
  const lessonIdentity = useMemo(
    () => String(lesson?.id || lesson?.title || 'lesson'),
    [lesson?.id, lesson?.title]
  );
  const isBorrowedVocabularyLesson = !!backTarget && backTarget !== 'Vocabulary';
  const borrowedVocabularyLessonResetRef = useRef(false);
  const resetBorrowedVocabularyLesson = useCallback(() => {
    if (!isBorrowedVocabularyLesson || borrowedVocabularyLessonResetRef.current) return;

    borrowedVocabularyLessonResetRef.current = true;

    if (typeof navigation.popToTop === 'function') {
      navigation.popToTop();
      return;
    }

    navigation.navigate('VocabularyList');
  }, [isBorrowedVocabularyLesson, navigation]);

  useEffect(() => {
    borrowedVocabularyLessonResetRef.current = false;
  }, [isBorrowedVocabularyLesson, lesson?.id]);

  const handleBackPress = useCallback(() => {
    if (!backTarget) {
      navigation.goBack();
      return;
    }

    const parentNavigation = navigation.getParent?.();
    const parentRouteNames = parentNavigation?.getState?.()?.routeNames ?? [];
    const isMainTabTarget = MAIN_TAB_TARGETS.includes(backTarget);

    if (isMainTabTarget && typeof parentNavigation?.jumpTo === 'function') {
      resetBorrowedVocabularyLesson();
      parentNavigation.jumpTo(backTarget);
      return;
    }

    if (parentNavigation && parentRouteNames.includes(backTarget)) {
      parentNavigation.navigate(backTarget);
      return;
    }

    if (parentNavigation && isMainTabTarget && parentRouteNames.includes('MainTabs')) {
      parentNavigation.navigate('MainTabs', { screen: backTarget });
      return;
    }

    navigation.navigate(backTarget);
  }, [backTarget, navigation, resetBorrowedVocabularyLesson]);

  useEffect(() => {
    if (!isBorrowedVocabularyLesson) return undefined;

    const parentNavigation = navigation.getParent?.();
    if (!parentNavigation?.addListener) return undefined;

    return parentNavigation.addListener('tabPress', (event: any) => {
      const parentState = parentNavigation.getState?.();
      const pressedRoute = parentState?.routes?.find((tabRoute: any) => tabRoute.key === event.target);

      if (!pressedRoute) return;

      resetBorrowedVocabularyLesson();
    });
  }, [isBorrowedVocabularyLesson, navigation, resetBorrowedVocabularyLesson]);

  useEffect(() => {
    if (!isBorrowedVocabularyLesson) return undefined;

    const parentNavigation = navigation.getParent?.();
    if (!parentNavigation?.addListener) return undefined;

    return parentNavigation.addListener('state', (event: any) => {
      const parentState = event?.data?.state ?? parentNavigation.getState?.();
      const activeRoute = parentState?.routes?.[parentState.index ?? 0];

      if (activeRoute?.name && activeRoute.name !== 'Vocabulary') {
        resetBorrowedVocabularyLesson();
      }
    });
  }, [isBorrowedVocabularyLesson, navigation, resetBorrowedVocabularyLesson]);

  const scrollViewRef = useRef<ScrollView>(null);
  const overviewHeightRef = useRef(0);
  const secondViewYRef = useRef(0);
  const matchingViewportLockRef = useRef({ width: screenWidth, height: lessonViewportHeight });
  const initializedLessonKeyRef = useRef<string | null>(null);
  const pendingKeyboardHideScrollModeRef = useRef<VocabularyMode | null>(null);
  const getSecondViewScrollY = useCallback((snapExtra = 0) => {
    if (isAndroidLesson) {
      const secondViewAnchorY = secondViewYRef.current > 0
        ? secondViewYRef.current
        : overviewHeightRef.current + layoutTopInset;

      return Math.max(0, secondViewAnchorY + snapExtra);
    }

    return Math.max(0, overviewHeightRef.current + snapExtra);
  }, [isAndroidLesson, layoutTopInset]);
  const overviewMinHeight = Math.max(
    isCompactScreen ? 420 : 500,
    lessonViewportHeight - layoutTopInset - layoutBottomInset - stickyHeaderHeight - FIRST_VIEW_PEEK
  );

  useEffect(() => {
    if (lesson?.isLearnedMix) return;

    const lastLessonType = backTarget === 'Grammar' || lesson?.practiceType === 'vocabulary'
      ? 'grammar'
      : 'vocabulary';

    void saveLastLesson({
      type: lastLessonType,
      lessonId: lesson?.id != null ? String(lesson.id) : undefined,
      title: lesson.title,
    });
  }, [backTarget, lesson?.id, lesson?.isLearnedMix, lesson?.practiceType, lesson.title]);

  const scheduleSoftLayoutChange = useCallback(() => {
    if (Platform.OS === 'android') {
      UIManager.setLayoutAnimationEnabledExperimental?.(true);
    }

    LayoutAnimation.configureNext(
      LayoutAnimation.create(
        260,
        LayoutAnimation.Types.easeInEaseOut,
        LayoutAnimation.Properties.scaleXY
      )
    );
  }, []);

  useEffect(() => {
    const heightDrop = stableScreenHeight - rawScreenHeight;

    if (!isTypingKeyboardOpen || rawScreenHeight > stableScreenHeight || heightDrop < 80) {
      scheduleSoftLayoutChange();
      setStableScreenHeight(rawScreenHeight);
    }
  }, [isTypingKeyboardOpen, rawScreenHeight, scheduleSoftLayoutChange, stableScreenHeight]);

  const lessonImageHeight = useMemo(() => {
    const imageReservedGap = isWebLessonLayout
      ? (isCompactScreen ? 62 : 70)
      : (isCompactScreen ? 64 : 72);
    const availableHeight =
      overviewMinHeight - titleBlockHeight - FIRST_VIEW_BOTTOM_SPACE - imageReservedGap;

    const minHeight = Math.round(clampNumber(
      lessonViewportHeight * (isCompactScreen ? 0.42 : 0.5),
      isCompactScreen ? 280 : 380,
      isCompactScreen ? 380 : 520
    ));
    const maxByViewport = Math.round(clampNumber(
      lessonViewportHeight * (isCompactScreen ? 0.72 : isLargeScreen ? 0.82 : 0.78),
      isCompactScreen ? 430 : 560,
      isLargeScreen ? 1060 : 900
    ));
    const maxByWidth = isWebLessonLayout
      ? Math.round(clampNumber(lessonLayoutWidth * 0.95, 680, 1260) * webLessonImageScale)
      : Math.round(clampNumber(lessonLayoutWidth * 1.8, 500, isLargeScreen ? 940 : 820));
    const maxHeight = Math.max(minHeight, Math.min(maxByViewport, maxByWidth));

    return Math.round(clampNumber(availableHeight, minHeight, maxHeight));
  }, [FIRST_VIEW_BOTTOM_SPACE, isCompactScreen, isLargeScreen, isWebLessonLayout, lessonLayoutWidth, lessonViewportHeight, overviewMinHeight, titleBlockHeight, webLessonImageScale]);

  const secondViewMinHeight = useMemo(() => {
    const availableHeight =
      lessonViewportHeight -
      layoutBottomInset -
      stickyHeaderHeight -
      secondViewBottomReserve -
      (isCompactScreen ? 8 : 12);
    const minHeight = isCompactScreen ? 250 : 280;
    return Math.max(minHeight, availableHeight);
  }, [
    isCompactScreen,
    layoutBottomInset,
    lessonViewportHeight,
    secondViewBottomReserve,
    stickyHeaderHeight,
  ]);
  const secondViewShellMinHeight = isAndroidLesson
    ? lessonViewportHeight
    : stickyHeaderHeight + secondViewMinHeight;

  const androidPracticeViewportHeight = useMemo(() => {
    if (!isAndroidLesson) return undefined;

    const availableHeight =
      secondViewMinHeight -
      LESSON_BODY_TOP_BUFFER -
      ANDROID_GAME_TOOLBAR_HEIGHT -
      ANDROID_GAME_CONTENT_TOP_PADDING -
      FLASHCARDS_VIEWPORT_TRIM;

    return Math.max(isCompactScreen ? 220 : 260, availableHeight);
  }, [
    ANDROID_GAME_CONTENT_TOP_PADDING,
    ANDROID_GAME_TOOLBAR_HEIGHT,
    FLASHCARDS_VIEWPORT_TRIM,
    LESSON_BODY_TOP_BUFFER,
    isCompactScreen,
    isAndroidLesson,
    secondViewMinHeight,
  ]);

  const gameViewportMinHeight = useMemo(() => {
    if (isAndroidLesson) {
      return androidPracticeViewportHeight ?? (isCompactScreen ? 220 : 260);
    }

    const baseHeight =
      secondViewMinHeight - SECOND_VIEW_CONTROLS_HEIGHT - FLASHCARDS_VIEWPORT_TRIM - (isCompactScreen ? 6 : 10);
    return Math.max(isCompactScreen ? 170 : 190, baseHeight);
  }, [
    androidPracticeViewportHeight,
    FLASHCARDS_VIEWPORT_TRIM,
    SECOND_VIEW_CONTROLS_HEIGHT,
    isCompactScreen,
    isAndroidLesson,
    secondViewMinHeight,
  ]);
  const flashcardLayoutHeight = Math.max(150, gameViewportMinHeight - flashcardSectionTopSpace);

  const matchingViewportMinHeight = useMemo(() => {
    if (isAndroidLesson) {
      return androidPracticeViewportHeight ?? (isCompactScreen ? 260 : 320);
    }

    const availableHeight = lessonViewportHeight
      - stickyHeaderHeight
      - BOTTOM_NAVIGATION_RESERVE
      - LESSON_BODY_TOP_BUFFER
      - MATCHING_CATEGORY_CONTROLS_HEIGHT
      - MATCHING_GAME_TOP_SPACE;

    return Math.max(
      isCompactScreen ? 260 : 320,
      availableHeight
    );
  }, [
    androidPracticeViewportHeight,
    BOTTOM_NAVIGATION_RESERVE,
    LESSON_BODY_TOP_BUFFER,
    MATCHING_CATEGORY_CONTROLS_HEIGHT,
    MATCHING_GAME_TOP_SPACE,
    isCompactScreen,
    isAndroidLesson,
    lessonViewportHeight,
    stickyHeaderHeight,
  ]);

  const typingViewportMinHeight = useMemo(() => {
    if (isAndroidLesson) {
      return androidPracticeViewportHeight ?? (isCompactScreen ? 220 : 260);
    }

    const availableHeight =
      secondViewMinHeight - SECOND_VIEW_CONTROLS_HEIGHT - TYPING_VIEWPORT_TRIM - (isCompactScreen ? 2 : 8);
    const minHeight = isCompactScreen ? 320 : 420;

    return Math.max(minHeight, availableHeight);
  }, [
    androidPracticeViewportHeight,
    TYPING_VIEWPORT_TRIM,
    SECOND_VIEW_CONTROLS_HEIGHT,
    isCompactScreen,
    isAndroidLesson,
    secondViewMinHeight,
  ]);

  const matchingViewSnapExtra = useMemo(() => {
    if (isAndroidLesson) return 0;

    const bottomNavigationReserve = isWebLessonLayout
      ? (lessonLayoutWidth >= 768 ? 64 : 58)
      : isAndroidLesson
        ? Math.max(insets.bottom, 12)
        : Math.max(insets.bottom, 42);
    const gameTopSpace = isAndroidLesson
      ? MATCHING_GAME_TOP_SPACE
      : (isWebLessonLayout && lessonLayoutWidth >= 768 ? 4 : 0) + 2;
    const visiblePracticeHeight = Math.max(
      1,
      lessonViewportHeight - stickyHeaderHeight - bottomNavigationReserve
    );
    const matchingTopChromeHeight = isAndroidLesson
      ? ANDROID_GAME_TOOLBAR_HEIGHT + ANDROID_GAME_CONTENT_TOP_PADDING
      : MATCHING_CATEGORY_CONTROLS_HEIGHT + gameTopSpace;
    const matchingContentHeight =
      LESSON_BODY_TOP_BUFFER + matchingTopChromeHeight + matchingViewportMinHeight;

    return Math.max(0, matchingContentHeight - visiblePracticeHeight);
  }, [
    ANDROID_GAME_CONTENT_TOP_PADDING,
    ANDROID_GAME_TOOLBAR_HEIGHT,
    LESSON_BODY_TOP_BUFFER,
    MATCHING_CATEGORY_CONTROLS_HEIGHT,
    MATCHING_GAME_TOP_SPACE,
    insets.bottom,
    isAndroidLesson,
    isWebLessonLayout,
    lessonLayoutWidth,
    lessonViewportHeight,
    matchingViewportMinHeight,
    stickyHeaderHeight,
  ]);

  // Flashcards state
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [reverseDirection, setReverseDirection] = useState(() => getInitialReverseDirection(lesson));
  const [flashcardDeckWords, setFlashcardDeckWords] = useState<Word[]>([]);
  const [shuffledFlashcards, setShuffledFlashcards] = useState<Word[]>([]);
  const [isFlashcardDeckShuffled, setIsFlashcardDeckShuffled] = useState(false);
  const [timerMode, setTimerMode] = useState(isVocabTimerMode);
  const [isFirstCompletion, setIsFirstCompletion] = useState(false);
  const [isPersonalBest, setIsPersonalBest] = useState(false);
  const [completionVisible, setCompletionVisible] = useState(false);
  const [startedTimerMode, setStartedTimerMode] = useState(isVocabTimerMode);
  const [lessonModeEnabled, setLessonModeEnabled] = useState(false);
  const [learnedFlashcardKeys, setLearnedFlashcardKeys] = useState<Set<string>>(new Set());
  const [knownFlashcardKeys, setKnownFlashcardKeys] = useState<Set<string>>(new Set());
  const [reviewFlashcardKeys, setReviewFlashcardKeys] = useState<Set<string>>(new Set());
  const [seenBackFlashcardKeys, setSeenBackFlashcardKeys] = useState<Set<string>>(new Set());
  const [flashcardLessonPhase, setFlashcardLessonPhase] = useState<FlashcardLessonPhase>('initial');
  const [flashcardProgressModeEnabled, setFlashcardProgressModeEnabled] = useState(false);
  const [lessonSummaryVisible, setLessonSummaryVisible] = useState(false);
  const [categoryPickerOpen, setCategoryPickerOpen] = useState(false);

  // Words
  const allWords = useMemo(() => {
    if (!lesson?.flashcards) return [];
    return Array.isArray(lesson.flashcards[0]?.words)
      ? lesson.flashcards.flatMap((c: any) => c.words)
      : lesson.flashcards;
  }, [lesson?.flashcards]);

const categories = useMemo<string[]>(() => {
  if (!lesson?.flashcards) return [];

  // grouped format
  if (Array.isArray(lesson.flashcards[0]?.words)) {
    return lesson.flashcards
      .map((c: any) => c.category)
      .filter(Boolean);
  }

  // flat format → no categories
  return [];
}, [lesson?.flashcards]);

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const previousLessonIdentityRef = useRef(lessonIdentity);
  const allowMultiCategorySelection = !!lesson?.allowMultiCategorySelection;
  const categoryPickerTitle =
    typeof lesson?.categoryPickerTitle === 'string' ? lesson.categoryPickerTitle : 'Select category';
  const categoryPickerLabel =
    typeof lesson?.categoryPickerLabel === 'string' ? lesson.categoryPickerLabel : 'Category';
  const categoryPickerAllLabel =
    typeof lesson?.categoryPickerAllLabel === 'string' ? lesson.categoryPickerAllLabel : 'All';
  const forceTimerResetOnNextInitRef = useRef<boolean>(false);

  useEffect(() => {
    if (previousLessonIdentityRef.current === lessonIdentity) return;

    previousLessonIdentityRef.current = lessonIdentity;
    setSelectedCategories([]);
    setCategoryPickerOpen(false);
  }, [lessonIdentity]);

  const selectedCategoryGroup = useMemo(() => {
    if (!Array.isArray(lesson?.flashcards?.[0]?.words)) return null;
    if (selectedCategories.length !== 1) return null;

    return lesson.flashcards.find((group: any) => group.category === selectedCategories[0]) ?? null;
  }, [lesson?.flashcards, selectedCategories]);
  const selectedCategoryImage = selectedCategoryGroup?.imageUrl ?? selectedCategoryGroup?.image;

  // Hero image selection
  const localImageSource = useMemo(() => getLessonThumbnailSource(lesson), [lesson]);

  const preferredImageSource = useMemo(() => {
    if (selectedCategoryImage) {
      return typeof selectedCategoryImage === 'string' ? { uri: selectedCategoryImage } : selectedCategoryImage;
    }

    if (lesson?.imageUrl || lesson?.image) {
      const raw = (lesson.imageUrl ?? lesson.image) as any;
      return typeof raw === 'string' ? { uri: raw } : raw;
    }

    const local = getLessonThumbnailSource(lesson);
    if (local) return local;

    const mapped = getLessonImage(lesson.title);
    return { uri: mapped };
  }, [lesson?.imageUrl, lesson?.image, lesson?.title, selectedCategoryImage]);

  // Image URI helper (for Android sizing)
  const preferredImageUri = useMemo(() => {
    if (selectedCategoryImage) {
      if (typeof selectedCategoryImage === 'string') return selectedCategoryImage;

      try {
        // @ts-ignore
        const resolved = Image.resolveAssetSource(selectedCategoryImage);
        if (resolved?.uri) return resolved.uri;
      } catch {}
    }

    if (lesson?.imageUrl || lesson?.image) {
      const raw = (lesson.imageUrl ?? lesson.image) as any;
      if (typeof raw === 'string') return raw;

      try {
        // @ts-ignore
        const resolved = Image.resolveAssetSource(raw);
        if (resolved?.uri) return resolved.uri;
      } catch {}
    }

    if (localImageSource) {
      try {
        // @ts-ignore
        const resolved = Image.resolveAssetSource(localImageSource);
        if (resolved?.uri) return resolved.uri;
      } catch {}
    }

    return getLessonImage(lesson.title);
  }, [lesson?.imageUrl, lesson?.image, lesson?.title, localImageSource, selectedCategoryImage]);

  // Filtered words
  const filteredWords = useMemo(() => {
    if (!categories.length) return allWords;
    if (!selectedCategories?.length) return allWords;

    const chosen = lesson.flashcards
      .filter((c: any) => selectedCategories.includes(c.category))
      .flatMap((c: any) => c.words);

    return chosen.length ? chosen : allWords;
  }, [lesson?.flashcards, allWords, categories.length, selectedCategories]);

  const activeCategoryKey = useMemo(() => {
    if (!categories.length) return `${lessonIdentity}::All`;
    if (!selectedCategories?.length) return `${lessonIdentity}::All`;
    const selectedCategoryKey = categories
      .filter((category) => selectedCategories.includes(category))
      .join('+');
    return `${lessonIdentity}::${selectedCategoryKey || 'All'}`;
  }, [categories, categories.length, lessonIdentity, selectedCategories]);
  const flashcardProgressLessonKey = useMemo(
    () => lessonIdentity,
    [lessonIdentity]
  );

  // Game hook
  const {
    gameState,
    setGameState,
    matchingGamePairs,
    initializeGameSet,
    handleCardPress,
    resetGameState,
    startTimer,
    stopTimer,
    matchingSessionXp,
    lastMatchingXpGain,
    matchingReviewWords,
  } = useVocabularyGame(
    filteredWords,
    timerMode,
    mode === 'matching',
    activeCategoryKey,
    isVocabTimerRecordSavingEnabled
  );

  const focusCleanupRef = useRef({ stopTimer, resetGameState, setGameState });

  useEffect(() => {
    focusCleanupRef.current = { stopTimer, resetGameState, setGameState };
  }, [stopTimer, resetGameState, setGameState]);

  const bestTimeForActiveCategory = useMemo(() => {
    const bestTime = gameState.bestTimeByCategory?.[activeCategoryKey];
    return typeof bestTime === 'number' && bestTime > 0 ? bestTime : null;
  }, [gameState.bestTimeByCategory, activeCategoryKey]);

  const allSetsCompleted = useMemo(() => {
    return (
      gameState.currentSet >= getMatchingSetCount(filteredWords.length) - 1 &&
      gameState.matchedPairs.length === (matchingGamePairs?.english?.length || 0) * 2 &&
      matchingGamePairs?.english?.length > 0
    );
  }, [
    gameState.currentSet,
    gameState.matchedPairs.length,
    matchingGamePairs?.english?.length,
    filteredWords.length,
  ]);
  const currentFlashcardWord = shuffledFlashcards[currentWordIndex] ?? null;
  const currentFlashcardKey = currentFlashcardWord ? vocabularyWordKey(currentFlashcardWord) : null;
  const currentFlashcardLearned = !!currentFlashcardKey && learnedFlashcardKeys.has(currentFlashcardKey);
  const learnedFlashcardCount = useMemo(
    () => filteredWords.reduce(
      (total: number, word: Word) => total + (learnedFlashcardKeys.has(vocabularyWordKey(word)) ? 1 : 0),
      0
    ),
    [filteredWords, learnedFlashcardKeys]
  );
  const flashcardsComplete = filteredWords.length > 0 && knownFlashcardKeys.size >= filteredWords.length;
  const matchingUnlocked = !lessonModeEnabled || flashcardsComplete;
  const typingUnlocked = !lessonModeEnabled || (flashcardsComplete && allSetsCompleted);
  const currentWordReadyToMarkKnown = !!currentFlashcardKey && seenBackFlashcardKeys.has(currentFlashcardKey);
  const activeCategoryLabel = useMemo(() => {
    if (!selectedCategories.length) return categoryPickerAllLabel;
    if (allowMultiCategorySelection && selectedCategories.length > 1) {
      return `${selectedCategories.length} selected`;
    }
    return selectedCategories[0];
  }, [allowMultiCategorySelection, categoryPickerAllLabel, selectedCategories]);

  const hasCompletedBeforeRef = useRef(false);
  useEffect(() => {
    if (mode !== 'matching' || !allSetsCompleted) return;
    if (!gameState.hasCompletedOnce) return;
    if (completionVisible) return;

    setIsPersonalBest(!!gameState.lastCompletionWasPersonalBest);

    if (!hasCompletedBeforeRef.current) {
      setIsFirstCompletion(true);
      hasCompletedBeforeRef.current = true;
    } else {
      setIsFirstCompletion(false);
    }

    setCompletionVisible(true);
  }, [
    allSetsCompleted,
    completionVisible,
    gameState.hasCompletedOnce,
    gameState.lastCompletionWasPersonalBest,
    mode,
  ]);

  // Focus cleanup only. Do not include game-pair/progress values here, because
  // changing the callback while focused runs cleanup and resets the match game.
  useFocusEffect(
    React.useCallback(() => {
      if (mode === 'matching' && filteredWords.length > 0) {
        focusCleanupRef.current.resetGameState({ preserveTimer: false });
        initializeGameSet({ preserveTimer: false });
        setCompletionVisible(false);
      }

      return () => {
        focusCleanupRef.current.stopTimer();
        focusCleanupRef.current.resetGameState({ preserveTimer: false });
      };
    }, [filteredWords.length, initializeGameSet, mode])
  );

  useEffect(() => {
    if (!startedTimerMode && timerMode !== isVocabTimerMode) {
      setTimerMode(isVocabTimerMode);
      if (!isVocabTimerMode) {
        stopTimer();
        setGameState((prev) => ({ ...prev, timer: 0 }));
      }
    }
  }, [startedTimerMode, timerMode, isVocabTimerMode, stopTimer, setGameState]);

  useEffect(() => {
    const setReady = (matchingGamePairs?.english?.length || 0) > 0;

    if (timerMode && mode === 'matching' && setReady && !allSetsCompleted) {
      startTimer();
    }
  }, [timerMode, mode, matchingGamePairs?.english?.length, allSetsCompleted, startTimer]);

  // Sync settings
  useEffect(() => {
    setTimerMode(isVocabTimerMode);

    if (prevIsVocabTimerModeRef.current && !isVocabTimerMode) {
      stopTimer();

      setGameState((prev) => ({
        currentSet: 0,
        matchedPairs: [],
        selectedCard: null,
        totalScore: 0,
        timer: 0,
        bestTimeByCategory: { ...prev.bestTimeByCategory },
        hasCompletedOnce: false,
        consecutiveCorrect: 0,
        incorrectPair: null,
        hasAdvancedSet: false,
        isInputLocked: false,
        lastCompletionWasPersonalBest: false,
      }));

      setStartedTimerMode(false);
      setIsFirstCompletion(false);
      setIsPersonalBest(false);

      forceTimerResetOnNextInitRef.current = true;
    }

    prevIsVocabTimerModeRef.current = isVocabTimerMode;
  }, [isVocabTimerMode]);

  // Flashcards init
  useEffect(() => {
    let active = true;
    setLearnedFlashcardKeys(new Set());

    getLearnedFlashcardKeys(flashcardProgressLessonKey).then((keys) => {
      if (active) setLearnedFlashcardKeys(keys);
    });

    return () => {
      active = false;
    };
  }, [flashcardProgressLessonKey]);

  useEffect(() => {
    if (filteredWords.length > 0) {
      setFlashcardDeckWords(filteredWords);
      setCurrentWordIndex(0);
      setIsFlipped(false);
      setReverseDirection(getInitialReverseDirection(lesson));
      setIsFlashcardDeckShuffled(false);
      setShuffledFlashcards(filteredWords);

      const preserve = !!timerMode && !forceTimerResetOnNextInitRef.current;
      initializeGameSet({ preserveTimer: preserve });
      setKnownFlashcardKeys(new Set());
      setReviewFlashcardKeys(new Set());
      setSeenBackFlashcardKeys(new Set());
      setFlashcardLessonPhase('initial');
      setFlashcardProgressModeEnabled(false);
      setLessonSummaryVisible(false);

      forceTimerResetOnNextInitRef.current = false;
      return;
    }

    setFlashcardDeckWords([]);
    setShuffledFlashcards([]);
    setCurrentWordIndex(0);
    setIsFlashcardDeckShuffled(false);
    setIsFlipped(false);
  }, [filteredWords, lesson]);

  // Matching reset
  useEffect(() => {
    if (mode === 'matching' && filteredWords.length > 0) {
      resetGameState();
      initializeGameSet();
      setCompletionVisible(false);
    }
  }, [mode, filteredWords.length]);

  const [typingShuffleSeed, setTypingShuffleSeed] = useState(0);

  const typingWords = useMemo(() => {
    if (mode !== 'typing' || !filteredWords.length) {
      return [];
    }

    return shuffleWordList(filteredWords);
  }, [filteredWords, mode, typingShuffleSeed]);

  const allowTypingSlashAlternatives = !String(lesson?.title ?? '')
    .toLowerCase()
    .includes('irregular verbs');
  const typingGame = useTypingGame(typingWords, { allowSlashAlternatives: allowTypingSlashAlternatives });
  const typingLevelLabel = getLevelDisplayLabel(typingGame.level);
  const isTypingLevelMaster = isMasterLevel(typingGame.level);
  const lessonSteps = [
    {
      key: 'flashcards',
      label: flashcardLessonPhase === 'review' ? 'Review' : 'Flashcards',
      active: mode === 'flashcards',
      complete: flashcardsComplete,
      locked: false,
    },
    {
      key: 'matching',
      label: 'Matching',
      active: mode === 'matching',
      complete: allSetsCompleted,
      locked: !matchingUnlocked,
    },
    {
      key: 'typing',
      label: 'Write',
      active: mode === 'typing',
      complete: lessonSummaryVisible || (lessonModeEnabled && mode === 'typing' && typingGame.isSessionComplete),
      locked: !typingUnlocked,
    },
  ];

  useEffect(() => {
    if (mode === 'typing') {
      typingGame.reset?.();
    }
  }, [mode, typingShuffleSeed]);

  const getModeSnapExtra = useCallback((targetMode: VocabularyMode) => {
    if (isWebLessonLayout) return 0;

    if (targetMode === 'typing') return TYPING_VIEW_SNAP_EXTRA;
    if (targetMode === 'flashcards') return FLASHCARDS_VIEW_SNAP_EXTRA;
    return matchingViewSnapExtra;
  }, [
    FLASHCARDS_VIEW_SNAP_EXTRA,
    TYPING_VIEW_SNAP_EXTRA,
    isWebLessonLayout,
    matchingViewSnapExtra,
  ]);

  useEffect(() => {
    const lessonKey = `${lessonIdentity}::${initialRouteMode}`;
    if (initializedLessonKeyRef.current === lessonKey) return;
    initializedLessonKeyRef.current = lessonKey;

    const scrollToInitialMode = (animated: boolean) => {
      if (initialRouteMode === 'flashcards') {
        scrollViewRef.current?.scrollTo({ y: 0, animated });
        return;
      }

      const snapExtra = getModeSnapExtra(initialRouteMode);
      const targetY = getSecondViewScrollY(STICKY_TOP_SNAP_OFFSET + snapExtra);

      scrollViewRef.current?.scrollTo({ y: targetY, animated });
    };
    const delayedScrolls: ReturnType<typeof setTimeout>[] = [];

    setMode(initialRouteMode);
    if (useReservedModeShell && initialRouteMode !== 'flashcards') {
      setIsSecondViewActive(true);
    }

    requestAnimationFrame(() => {
      scrollToInitialMode(false);
    });

    if (initialRouteMode !== 'flashcards') {
      delayedScrolls.push(setTimeout(() => scrollToInitialMode(false), 260));
      delayedScrolls.push(setTimeout(() => scrollToInitialMode(true), 540));
    }

    return () => {
      delayedScrolls.forEach(clearTimeout);
    };
  }, [
    FLASHCARDS_VIEW_SNAP_EXTRA,
    getModeSnapExtra,
    getSecondViewScrollY,
    STICKY_TOP_SNAP_OFFSET,
    TYPING_VIEW_SNAP_EXTRA,
    initialRouteMode,
    lessonIdentity,
    matchingViewSnapExtra,
    useReservedModeShell,
  ]);

  useEffect(() => {
    if (!lessonModeEnabled || !flashcardsComplete || mode !== 'flashcards') return;

    setMode('matching');
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({
        y: getSecondViewScrollY(STICKY_TOP_SNAP_OFFSET + getModeSnapExtra('matching')),
        animated: true,
      });
    }, 120);
  }, [flashcardsComplete, getModeSnapExtra, getSecondViewScrollY, lessonModeEnabled, mode, STICKY_TOP_SNAP_OFFSET]);

  const scrollToGame = useCallback((targetMode: VocabularyMode = mode, animated = true) => {
    const snapExtra = getModeSnapExtra(targetMode);
    const targetY = getSecondViewScrollY(STICKY_TOP_SNAP_OFFSET + snapExtra);

    if (useReservedModeShell) {
      setIsSecondViewActive(true);
    }

    requestAnimationFrame(() => {
      scrollViewRef.current?.scrollTo({
        y: targetY,
        animated,
      });
    });

    setTimeout(() => {
      scrollViewRef.current?.scrollTo({
        y: targetY,
        animated,
      });
    }, 180);
  }, [getModeSnapExtra, getSecondViewScrollY, useReservedModeShell, STICKY_TOP_SNAP_OFFSET, mode]);

  useEffect(() => {
    if (!isWebLessonLayout) return;

    const previousViewport = matchingViewportLockRef.current;
    const viewportChanged =
      Math.abs(previousViewport.width - screenWidth) > 1 ||
      Math.abs(previousViewport.height - lessonViewportHeight) > 1;

    matchingViewportLockRef.current = { width: screenWidth, height: lessonViewportHeight };

    if (!viewportChanged || mode !== 'matching') return;

    setTimeout(() => scrollToGame('matching', false), 40);
    setTimeout(() => scrollToGame('matching', false), 220);
  }, [isWebLessonLayout, lessonViewportHeight, mode, screenWidth, scrollToGame]);

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', (event) => {
      if (mode !== 'typing') return;

      scheduleSoftLayoutChange();
      setKeyboardHeight(event.endCoordinates?.height ?? Math.max(0, stableScreenHeight - rawScreenHeight));
      setTimeout(() => scrollToGame('typing', false), 60);
      setTimeout(() => scrollToGame('typing', false), 240);
    });
    const hideSub = Keyboard.addListener('keyboardDidHide', () => {
      scheduleSoftLayoutChange();
      setKeyboardHeight(0);

      const pendingMode = pendingKeyboardHideScrollModeRef.current;
      if (!pendingMode) return;

      pendingKeyboardHideScrollModeRef.current = null;
      setTimeout(() => scrollToGame(pendingMode, true), 40);
      setTimeout(() => scrollToGame(pendingMode, false), 220);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [mode, rawScreenHeight, scheduleSoftLayoutChange, scrollToGame, stableScreenHeight]);

  const handleShuffleTypingWords = () => {
    if (!filteredWords.length) return;

    setTypingShuffleSeed((prev) => prev + 1);
  };

  const handleFlashcardFlip = () => {
    triggerSelectionHaptic();
    const willShowBack = !isFlipped;
    setIsFlipped(willShowBack);

    if (willShowBack && currentFlashcardKey) {
      setSeenBackFlashcardKeys((prev) => {
        const next = new Set(prev);
        next.add(currentFlashcardKey);
        return next;
      });
    }
  };

  const shuffleFlashcards = () => {
    const wordsForDeck = flashcardDeckWords.length > 0 ? flashcardDeckWords : shuffledFlashcards;
    if (!wordsForDeck.length) return;

    triggerSelectionHaptic();
    setCurrentWordIndex(0);
    setIsFlipped(false);

    if (isFlashcardDeckShuffled) {
      setIsFlashcardDeckShuffled(false);
      setShuffledFlashcards(wordsForDeck);
      return;
    }

    setIsFlashcardDeckShuffled(true);
    setShuffledFlashcards(shuffleWordList(wordsForDeck));
  };

const goToNextWord = () => {
  if (currentWordIndex < shuffledFlashcards.length - 1) {
    triggerSelectionHaptic();
  }

  setCurrentWordIndex((p) => {
    if (p >= shuffledFlashcards.length - 1) {
      return p; // STOP at last card
    }
    return p + 1;
  });

  setIsFlipped(false);
};

const goToPrevWord = () => {
  if (currentWordIndex > 0) {
    triggerSelectionHaptic();
  }

  setCurrentWordIndex((p) => {
    if (p <= 0) {
      return p; // STOP at first card
    }
    return p - 1;
  });

  setIsFlipped(false);
};

  const restartFlashcardDeck = (wordsForDeck: Word[], phase: FlashcardLessonPhase) => {
    setFlashcardDeckWords(wordsForDeck);
    setShuffledFlashcards(wordsForDeck);
    setCurrentWordIndex(0);
    setIsFlipped(false);
    setIsFlashcardDeckShuffled(false);
    setFlashcardLessonPhase(phase);
  };

  const reviewFlashcardWords = (wordsForReview: Word[]) => {
    if (!wordsForReview.length) return;

    setCompletionVisible(false);
    setFlashcardDeckWords(wordsForReview);
    setShuffledFlashcards(wordsForReview);
    setCurrentWordIndex(0);
    setIsFlipped(false);
    setIsFlashcardDeckShuffled(false);
    setFlashcardLessonPhase('review');
    setMode('flashcards');
    scrollToGame('flashcards');
  };

  const startLearnedReviewGame = () => {
    if (!filteredWords.length || learnedFlashcardCount < filteredWords.length) return;

    triggerSuccessHaptic();
    setCompletionVisible(false);
    resetGameState();
    initializeGameSet();
    setMode('matching');
    scrollToGame('matching');
  };

  const resetLessonModeProgress = (keepLessonMode = lessonModeEnabled) => {
    setKnownFlashcardKeys(new Set());
    setReviewFlashcardKeys(new Set());
    setSeenBackFlashcardKeys(new Set());
    setFlashcardLessonPhase('initial');
    setFlashcardProgressModeEnabled(false);
    setLessonSummaryVisible(false);
    setCompletionVisible(false);
    setFlashcardDeckWords(filteredWords);
    setShuffledFlashcards(filteredWords);
    setCurrentWordIndex(0);
    setIsFlipped(false);
    setIsFlashcardDeckShuffled(false);
    resetGameState();
    initializeGameSet();
    typingGame.reset?.();

    if (keepLessonMode) {
      setMode('flashcards');
    }
  };

  const handleToggleLessonMode = () => {
    if (!LESSON_MODE_ENABLED) return;

    setLessonModeEnabled((prev) => {
      const next = !prev;

      if (next) {
        resetLessonModeProgress(true);
      } else {
        resetLessonModeProgress(false);
      }

      return next;
    });
  };

  const handleToggleCurrentFlashcardLearned = () => {
    const currentWord = shuffledFlashcards[currentWordIndex];
    if (!currentWord) return;

    const key = vocabularyWordKey(currentWord);
    const alreadyLearned = learnedFlashcardKeys.has(key);
    if (!alreadyLearned && !seenBackFlashcardKeys.has(key)) return;

    const nextLearned = !alreadyLearned;
    if (nextLearned) {
      triggerSuccessHaptic();
    } else {
      triggerSelectionHaptic();
    }

    setLearnedFlashcardKeys((prev) => {
      const next = new Set(prev);

      if (nextLearned) {
        next.add(key);
      } else {
        next.delete(key);
      }

    void saveLearnedFlashcardKeys(flashcardProgressLessonKey, next);
      return next;
    });

    if (nextLearned) {
      void markPracticeActivityToday(`vocabulary:flashcard-learnt:${lesson.title}:${key}`);
    }

    void recordLearnedFlashcardToday(flashcardProgressLessonKey, key, nextLearned);
  };

  const handleMarkFlashcardKnown = () => {
    const currentWord = shuffledFlashcards[currentWordIndex];
    if (!currentWord) return;

    const key = vocabularyWordKey(currentWord);
    const alreadyKnown = knownFlashcardKeys.has(key);
    const nextKnownCount = alreadyKnown ? knownFlashcardKeys.size : knownFlashcardKeys.size + 1;

    if (!alreadyKnown) {
      void markPracticeActivityToday(`vocabulary:flashcard:${lesson.title}:${key}`);

      setKnownFlashcardKeys((prev) => {
        const next = new Set(prev);
        next.add(key);
        return next;
      });
    }

    if (currentWordIndex < shuffledFlashcards.length - 1) {
      goToNextWord();
      return;
    }

    if (lessonModeEnabled) {
      if (nextKnownCount >= filteredWords.length) {
        setMode('matching');
        scrollToGame('matching');
        return;
      }

      if (flashcardLessonPhase === 'initial' && reviewFlashcardKeys.size > 0) {
        const reviewWords = filteredWords.filter((word: Word) => reviewFlashcardKeys.has(vocabularyWordKey(word)));

        if (reviewWords.length > 0) {
          restartFlashcardDeck(reviewWords, 'review');
        }
      }
    }
  };

  const handleMarkFlashcardForReview = () => {
    const currentWord = shuffledFlashcards[currentWordIndex];
    if (!currentWord) return;

    const key = vocabularyWordKey(currentWord);

    setReviewFlashcardKeys((prev) => {
      const next = new Set(prev);
      next.add(key);
      return next;
    });

    if (currentWordIndex < shuffledFlashcards.length - 1) {
      goToNextWord();
      return;
    }

    const reviewWords = filteredWords.filter(
      (word: Word) => reviewFlashcardKeys.has(vocabularyWordKey(word)) || vocabularyWordKey(word) === key
    );

    if (flashcardLessonPhase === 'initial') {
      if (reviewWords.length > 0) {
        restartFlashcardDeck(reviewWords, 'review');
      }
      return;
    }

    if (flashcardLessonPhase === 'review' && reviewWords.length > 0) {
      restartFlashcardDeck(reviewWords, 'review');
    }
  };

  const handleModeChange = (nextMode: VocabularyMode) => {
    if (nextMode === 'matching' && !matchingUnlocked) return;
    if (nextMode === 'typing' && !typingUnlocked) return;
    if (nextMode !== mode) {
      triggerSelectionHaptic();
    }

    const shouldScrollAfterKeyboardHides = mode === 'typing' && nextMode !== 'typing' && isTypingKeyboardOpen;
    const keepReservedSecondViewPinned = useReservedModeShell && isSecondViewActive;
    pendingKeyboardHideScrollModeRef.current =
      shouldScrollAfterKeyboardHides && !keepReservedSecondViewPinned ? nextMode : null;

    Keyboard.dismiss();
    scheduleSoftLayoutChange();
    setMode(nextMode);

    if (keepReservedSecondViewPinned) {
      setIsSecondViewActive(true);
      scrollToGame(nextMode, false);
      return;
    }

    scrollToGame(nextMode);

    if (shouldScrollAfterKeyboardHides) {
      setTimeout(() => scrollToGame(nextMode, false), 360);
    }
  };

  const handleContinueToTyping = () => {
    triggerSelectionHaptic();
    setCompletionVisible(false);
    Keyboard.dismiss();
    setMode('typing');
    scrollToGame('typing');
  };

  const handleLessonTypingComplete = () => {
    if (!lessonModeEnabled) return;
    setLessonSummaryVisible(true);
  };

  const handleReplayLessonFlow = () => {
    resetLessonModeProgress(true);
  };

  const handleExitLessonMode = () => {
    setLessonSummaryVisible(false);
    setLessonModeEnabled(false);
    resetLessonModeProgress(false);
  };

  const handleReplay = (activateTimerMode = false) => {
    triggerSelectionHaptic();
    Keyboard.dismiss();
    setTimerMode(!!activateTimerMode);
    hasCompletedBeforeRef.current = true;

    if (activateTimerMode) setStartedTimerMode(true);

    resetGameState();
    setIsFirstCompletion(false);
    setIsPersonalBest(false);
    initializeGameSet();

    setMode('matching');
    setCompletionVisible(false);
    scrollToGame();
  };

  const toggleCategory = (cat: string) => {
    triggerSelectionHaptic();
    setSelectedCategories((prev) => {
      if (cat === categoryPickerAllLabel) return [];
      if (allowMultiCategorySelection) {
        const next = prev.includes(cat)
          ? prev.filter((item) => item !== cat)
          : [...prev, cat];

        return next;
      }
      if (prev.length === 1 && prev[0] === cat) return [];
      return [cat];
    });
    if (!allowMultiCategorySelection) {
      setCategoryPickerOpen(false);
    }

    forceTimerResetOnNextInitRef.current = true;
    stopTimer();

    setGameState((prev) => ({ ...prev, timer: 0 }));
  };

  const prevIsVocabTimerModeRef = useRef(isVocabTimerMode);

  useEffect(() => {
    if (!LESSON_MODE_ENABLED && lessonModeEnabled) {
      setLessonModeEnabled(false);
    }
  }, [lessonModeEnabled]);

  const renderCategoryPickerButton = () => {
    if (categories.length === 0) return null;

    return (
      <TouchableOpacity
        activeOpacity={0.82}
        onPress={() => {
          triggerSelectionHaptic();
          Keyboard.dismiss();
          setCategoryPickerOpen((current) => !current);
        }}
        accessibilityRole="button"
        accessibilityLabel={`Choose ${categoryPickerLabel.toLowerCase()}`}
        accessibilityState={{ expanded: categoryPickerOpen }}
        style={[
          styles.categoryPickerButton,
          isAndroidLesson && styles.categoryPickerButtonAndroid,
          {
            backgroundColor: colors.surface,
            borderColor: colors.borderStrong,
          },
        ]}
      >
        <Text
          style={[styles.categoryPickerText, { color: colors.text }]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.82}
        >
          {categoryPickerLabel}: {activeCategoryLabel}
        </Text>
        <MaterialIcons
          name={categoryPickerOpen ? 'expand-less' : 'expand-more'}
          size={20}
          color={colors.primary}
        />
      </TouchableOpacity>
    );
  };

  const renderFlashcardProgressButton = () => {
    if (mode !== 'flashcards') return null;

    return (
      <TouchableOpacity
        activeOpacity={0.82}
        onPress={() => {
          triggerSelectionHaptic();
          setFlashcardProgressModeEnabled((current) => !current);
        }}
        accessibilityRole="switch"
        accessibilityLabel={flashcardProgressModeEnabled ? 'Turn off Save Words' : 'Turn on Save Words'}
        accessibilityState={{ checked: flashcardProgressModeEnabled }}
        style={[
          styles.progressModeButton,
          isAndroidLesson && styles.progressModeButtonAndroid,
          {
            backgroundColor: flashcardProgressModeEnabled ? (colors.primarySoft ?? colors.surfaceAlt) : colors.surface,
            borderColor: flashcardProgressModeEnabled ? colors.primary : colors.borderStrong,
          },
        ]}
      >
        <MaterialIcons
          name={flashcardProgressModeEnabled ? 'toggle-on' : 'toggle-off'}
          size={20}
          color={flashcardProgressModeEnabled ? colors.primary : colors.secondaryText}
        />
        <Text
          style={[
            styles.progressModeText,
            { color: flashcardProgressModeEnabled ? colors.primary : colors.text },
          ]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.82}
        >
          Save words
        </Text>
        <Text
          style={[
            styles.progressModeMeta,
            { color: flashcardProgressModeEnabled ? colors.primary : colors.secondaryText },
          ]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.86}
        >
          {flashcardProgressModeEnabled ? `${learnedFlashcardCount}/${filteredWords.length}` : 'Off'}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderCategoryControls = () => {
    const categoryButton = renderCategoryPickerButton();
    const progressButton = renderFlashcardProgressButton();

    if (!categoryButton && !progressButton) return null;

    return (
      <View
        style={[
          styles.categoryControlsRow,
          isWebLessonLayout && lessonLayoutWidth >= 768 && styles.categoryControlsRowDesktopWeb,
          isAndroidLesson && styles.categoryControlsRowAndroid,
          isAndroidLesson && mode === 'matching' && styles.categoryControlsRowAndroidMatching,
        ]}
      >
        {categoryButton}
        {progressButton}
      </View>
    );
  };

  const renderModeButtons = (placement: 'overview' | 'sticky' = 'sticky') => {
    const showSideActions = placement === 'sticky' && isSecondViewActive;

    return (
      <View
        style={[
          styles.modeButtonsWrap,
          placement === 'overview' && styles.overviewModeButtonsWrap,
          isAndroidLesson && styles.modeButtonsWrapAndroid,
          isScaledWebLesson && { paddingHorizontal: scaleValue(16, webLessonScale) },
        ]}
      >
        <View style={[styles.modeHeaderRow, isScaledWebLesson && { maxWidth: scaleValue(showSideActions ? 560 : 520, webLessonScale), gap: scaleValue(8, webLessonScale) }]}>
          {showSideActions && (
            <TouchableOpacity
              accessibilityLabel={backLabel}
              accessibilityRole="button"
              onPress={handleBackPress}
              style={[
                styles.imageShortcutButton,
                {
                  backgroundColor: isDarkMode ? colors.surface : colors.card,
                  borderColor: colors.border,
                  width: scaleValue(42, webLessonScale),
                  height: scaleValue(42, webLessonScale),
                },
              ]}
            >
              <MaterialIcons name="arrow-back" size={scaleValue(21, webLessonScale)} color={colors.text} />
            </TouchableOpacity>
          )}
          <View
            style={[
              styles.modeButtons,
              compactModeButtons && styles.modeButtonsCompact,
              isScaledWebLesson && { maxWidth: scaleValue(showSideActions ? 460 : 520, webLessonScale) },
            ]}
          >
          {[
            { key: 'flashcards' as const, label: 'Cards', icon: 'style' as const },
            { key: 'matching' as const, label: 'Match', icon: 'grid-view' as const },
            { key: 'typing' as const, label: 'Write', icon: 'edit' as const },
          ].map((item) => {
            const active = mode === item.key;

            return (
              <TouchableOpacity
                key={item.key}
                activeOpacity={0.82}
                style={[
                  styles.modeButton,
                  isAndroidLesson && styles.modeButtonAndroid,
                  compactModeButtons && styles.modeButtonCompact,
                  {
                    backgroundColor: isDarkMode ? colors.surface : colors.card,
                    borderColor: colors.borderStrong,
                    shadowColor: active ? colors.primary : '#000',
                  },
                  getSoftShadow(isDarkMode, active ? 'raised' : 'soft'),
                  isScaledWebLesson && {
                    marginHorizontal: scaleValue(8, webLessonScale),
                    paddingVertical: scaleValue(10, webLessonScale),
                  },
                  active && [
                    styles.activeMode,
                    {
                      backgroundColor: colors.buttonBackground,
                      borderColor: colors.primary,
                      shadowColor: colors.buttonBackground,
                    },
                  ],
                  lessonModeEnabled &&
                    ((item.key === 'matching' && !matchingUnlocked) ||
                      (item.key === 'typing' && !typingUnlocked)) &&
                    styles.modeButtonLocked,
                ]}
                disabled={
                  lessonModeEnabled &&
                  ((item.key === 'matching' && !matchingUnlocked) ||
                    (item.key === 'typing' && !typingUnlocked))
                }
                onPress={() => handleModeChange(item.key)}
                accessibilityRole="button"
                accessibilityLabel={`Switch to ${item.label}`}
                accessibilityState={{
                  selected: active,
                  disabled:
                    lessonModeEnabled &&
                    ((item.key === 'matching' && !matchingUnlocked) ||
                      (item.key === 'typing' && !typingUnlocked)),
                }}
              >
                <MaterialIcons
                  name={item.icon}
                  size={compactModeButtons ? 15 : 18}
                  color={active ? '#FFFFFF' : colors.primary}
                />
                <Text
                  style={[
                    styles.modeText,
                    compactModeButtons && styles.modeTextCompact,
                    isAndroidLesson && styles.modeTextAndroid,
                    isAndroidLesson && compactModeButtons && styles.modeTextCompactAndroid,
                    { color: active ? '#FFFFFF' : colors.text },
                    isDesktopWebLesson && styles.modeTextDesktopWeb,
                    isScaledWebLesson && { fontSize: scaleValue(16, webLessonScale) },
                    active && styles.modeTextActive,
                  ]}
                  numberOfLines={1}
                  allowFontScaling={false}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
          {showSideActions && (
            <TouchableOpacity
              accessibilityLabel="Open lesson image"
              accessibilityRole="button"
              onPress={() =>
                navigation.navigate('FullImageModal', {
                  source: preferredImageSource,
                  uri: preferredImageUri,
                })
              }
              style={[
                styles.imageShortcutButton,
                {
                  backgroundColor: isDarkMode ? colors.surface : colors.card,
                  borderColor: colors.border,
                  width: scaleValue(42, webLessonScale),
                  height: scaleValue(42, webLessonScale),
                },
              ]}
            >
              <MaterialIcons name="image" size={scaleValue(21, webLessonScale)} color={colors.text} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const handleViewportLayout = useCallback((event: any) => {
    const nextHeight = Math.round(event.nativeEvent.layout.height);
    if (nextHeight <= 0) return;

    setViewportHeight((currentHeight) => {
      if (isTypingKeyboardOpen && nextHeight < currentHeight) {
        return currentHeight;
      }

      return Math.abs(currentHeight - nextHeight) > 1 ? nextHeight : currentHeight;
    });
  }, [isTypingKeyboardOpen]);

  const handleLessonScroll = useCallback((event: any) => {
    const y = event.nativeEvent.contentOffset?.y ?? 0;
    if (overviewHeightRef.current <= 0) return;

    const secondViewThreshold = isAndroidLesson
      ? Math.max(0, (secondViewYRef.current || overviewHeightRef.current + layoutTopInset) - 2)
      : Math.max(0, overviewHeightRef.current - stickyHeaderHeight - 2);
    const nextIsSecondViewActive = y >= secondViewThreshold;

    setIsSecondViewActive((current) => (
      current === nextIsSecondViewActive ? current : nextIsSecondViewActive
    ));
  }, [isAndroidLesson, layoutTopInset, stickyHeaderHeight]);

  const renderSecondViewContent = (placement: 'flow' | 'stage' = 'flow') => {
    const isStage = placement === 'stage';

    return (
      <View
        pointerEvents={isStage ? 'box-none' : 'auto'}
        style={[
          styles.lessonBody,
          isAndroidLesson && styles.lessonBodyAndroid,
          isStage && styles.lessonBodyAndroidStage,
          isStage
            ? { paddingTop: LESSON_BODY_TOP_BUFFER }
            : { minHeight: secondViewMinHeight, paddingTop: LESSON_BODY_TOP_BUFFER },
        ]}
      >
        {LESSON_MODE_ENABLED && lessonModeEnabled && (
          <View style={[styles.lessonProgressCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.lessonProgressTitle, { color: colors.secondaryText }]}>Lesson Path</Text>
            <View style={styles.lessonProgressRow}>
              {lessonSteps.map((step, index) => (
                <React.Fragment key={step.key}>
                  <View style={styles.lessonStepItem}>
                    <View
                      style={[
                        styles.lessonStepDot,
                        step.complete && { backgroundColor: colors.success },
                        step.active && { backgroundColor: colors.primary },
                        step.locked && styles.lessonStepDotLocked,
                      ]}
                    />
                    <Text
                      style={[
                        styles.lessonStepLabel,
                        step.complete && { color: colors.successText },
                        step.active && { color: colors.primary },
                        step.locked && styles.lessonStepLabelLocked,
                      ]}
                    >
                      {step.label}
                    </Text>
                  </View>
                  {index < lessonSteps.length - 1 && <View style={[styles.lessonStepLine, { backgroundColor: colors.border }]} />}
                </React.Fragment>
              ))}
            </View>
          </View>
        )}

        {isAndroidLesson && hasAndroidGameToolbar ? (
          <View style={[styles.gameToolbarAndroid, { height: ANDROID_GAME_TOOLBAR_HEIGHT }]}>
            {renderCategoryControls()}
          </View>
        ) : (
          renderCategoryControls()
        )}

        <View
          pointerEvents={isStage ? 'box-none' : 'auto'}
          style={[
            styles.gameViewport,
            isAndroidLesson && styles.gameViewportAndroid,
            isStage && styles.gameViewportAndroidStage,
            isWebLessonLayout && lessonLayoutWidth >= 768 && styles.gameViewportDesktopWeb,
            isAndroidLesson && mode === 'matching' && styles.gameViewportAndroidMatching,
            isWebLessonLayout && {
              alignSelf: 'center',
              maxWidth: mode === 'matching'
                ? webMatchingGameMaxWidth
                : mode === 'typing'
                  ? webTypingGameMaxWidth
                  : webLessonGameMaxWidth,
              width: '100%',
              paddingHorizontal: scaleValue(16, webLessonScale),
            },
            {
              minHeight: mode === 'matching'
                ? matchingViewportMinHeight
                : mode === 'typing'
                  ? typingViewportMinHeight
                  : gameViewportMinHeight,
            },
          ]}
        >
          {mode === 'flashcards' && (
            <View
              style={[
                styles.gameSection,
                styles.flashcardsSection,
                isAndroidLesson && styles.gameSectionAndroidUnified,
                flashcardModuleTopDrop > 0 && { paddingTop: flashcardModuleTopDrop },
              ]}
            >
              <VocabularyFlashcard
                words={shuffledFlashcards}
                currentIndex={currentWordIndex}
                isShuffled={isFlashcardDeckShuffled}
                isFlipped={isFlipped}
                reverseDirection={reverseDirection}
                onFlip={handleFlashcardFlip}
                onNext={goToNextWord}
                onPrevious={goToPrevWord}
                onShuffle={shuffleFlashcards}
                onStartLearnedReviewGame={startLearnedReviewGame}
                progressModeEnabled={flashcardProgressModeEnabled}
                sideLabels={lesson?.flashcardLabels}
                onToggleDirection={() => {
                  triggerSelectionHaptic();
                  setReverseDirection((p) => !p);
                  setIsFlipped(false);
                }}
                lessonModeEnabled={lessonModeEnabled}
                onToggleLessonMode={LESSON_MODE_ENABLED ? handleToggleLessonMode : undefined}
                onMarkKnown={handleMarkFlashcardKnown}
                onMarkReview={handleMarkFlashcardForReview}
                onToggleLearned={handleToggleCurrentFlashcardLearned}
                isCurrentWordLearned={currentFlashcardLearned}
                learnedCount={learnedFlashcardCount}
                totalWordCount={filteredWords.length}
                isCurrentWordKnown={!!shuffledFlashcards[currentWordIndex] && knownFlashcardKeys.has(vocabularyWordKey(shuffledFlashcards[currentWordIndex]))}
                knownCount={knownFlashcardKeys.size}
                currentWordReadyToMarkKnown={currentWordReadyToMarkKnown}
                layoutHeight={flashcardLayoutHeight}
                forceAndroidLayout={useApkPreviewLayout}
                colors={colors}
                isDarkMode={isDarkMode}
              />
            </View>
          )}

          {mode === 'matching' && (
            <View
              style={[
                styles.gameSection,
                styles.matchingGameSection,
                isAndroidLesson && styles.gameSectionAndroidUnified,
                isAndroidLesson && styles.matchingGameSectionAndroid,
                {
                  minHeight: matchingViewportMinHeight,
                  ...(isAndroidLesson ? { height: matchingViewportMinHeight } : null),
                },
              ]}
            >
              <VocabularyMatching
                gameState={gameState}
                matchingGamePairs={matchingGamePairs}
                onCardPress={handleCardPress}
                colors={colors}
                isDarkMode={isDarkMode}
                words={filteredWords}
                timerMode={timerMode}
                bestTimeForActiveCategory={bestTimeForActiveCategory}
                matchingSessionXp={matchingSessionXp}
                lastMatchingXpGain={lastMatchingXpGain}
                availableHeight={matchingViewportMinHeight}
                forceAndroidLayout={useApkPreviewLayout}
              />

              <VocabularyCompletionModal
                visible={completionVisible}
                gameState={gameState}
                timerMode={timerMode}
                wordsLength={filteredWords.length}
                isDarkMode={isDarkMode}
                onReplay={handleReplay}
                isFirstCompletion={isFirstCompletion}
                isPersonalBest={isPersonalBest}
                colors={colors}
                startedTimerMode={startedTimerMode}
                bestTimeForActiveCategory={bestTimeForActiveCategory}
                matchingSessionXp={matchingSessionXp}
                reviewWords={matchingReviewWords}
                onReviewWords={() => reviewFlashcardWords(matchingReviewWords)}
                primaryActionLabel={LESSON_MODE_ENABLED && lessonModeEnabled ? 'Continue to Write' : undefined}
                onPrimaryAction={LESSON_MODE_ENABLED && lessonModeEnabled ? handleContinueToTyping : undefined}
              />
            </View>
          )}

          {mode === 'typing' && (
            <View
              style={[
                styles.gameSection,
                styles.typingGameSection,
                isAndroidLesson && styles.gameSectionAndroidUnified,
                isWebLessonLayout && lessonLayoutWidth >= 768 && {
                  minHeight: typingViewportMinHeight,
                },
              ]}
            >
              <VocabularyTyping
                words={typingWords}
                typingGame={typingGame}
                colors={colors}
                isDarkMode={isDarkMode}
                allowSlashAlternatives={allowTypingSlashAlternatives}
                promptLabel={lesson?.typingPromptLabel}
                answerPlaceholder={lesson?.typingAnswerPlaceholder}
                keyboardVisible={isTypingKeyboardOpen}
                layoutHeight={
                  isAndroidLesson
                    ? typingViewportMinHeight
                    : isWebLessonLayout && lessonLayoutWidth >= 768
                      ? typingViewportMinHeight
                      : lessonViewportHeight
                }
                forceAndroidLayout={useApkPreviewLayout}
                onShuffle={handleShuffleTypingWords}
                onSessionComplete={handleLessonTypingComplete}
                suppressCompletionScreen={LESSON_MODE_ENABLED && lessonModeEnabled}
              />
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      onLayout={handleViewportLayout}
    >
      <ScrollView
        ref={scrollViewRef}
        style={[styles.container, { backgroundColor: colors.background }]}
        stickyHeaderIndices={useReservedModeShell ? [] : [1]}
        contentContainerStyle={{
          paddingTop: layoutTopInset,
          paddingBottom: scrollBottomPadding + typingKeyboardInset,
        }}
        onScroll={handleLessonScroll}
        scrollEventThrottle={16}
        keyboardShouldPersistTaps="always"
        bounces={false}
        alwaysBounceVertical={false}
        overScrollMode="never"
      >
        <View
          style={[
            styles.overviewSection,
            { minHeight: overviewMinHeight },
          ]}
          onLayout={(event) => {
            overviewHeightRef.current = event.nativeEvent.layout.height;
          }}
        >
          <BackButton
            label={backLabel}
            style={isAndroidLesson ? styles.androidTopBackButton : undefined}
            onPress={handleBackPress}
          />
          <View
            style={[
              styles.header,
              isWebLessonLayout ? styles.webHeader : undefined,
              { backgroundColor: colors.card },
            ]}
            onLayout={(event) => {
              setTitleBlockHeight(event.nativeEvent.layout.height);
            }}
          >
            <Text
              style={[
                styles.title,
                isWebLessonLayout ? styles.webTitle : undefined,
                isScaledWebLesson && { fontSize: scaleValue(22, webLessonScale), marginLeft: scaleValue(8, webLessonScale) },
                { color: colors.text },
              ]}
            >
              {lesson.title}
            </Text>
          </View>

          <ImageWithCredit
            source={preferredImageSource as any}
            style={
              isWebLessonLayout
                ? [styles.lessonImage, styles.webLessonImage, { height: lessonImageHeight, maxWidth: webLessonMediaMaxWidth }]
                : [styles.lessonImage, { height: lessonImageHeight }]
            }
            onPress={() =>
              navigation.navigate('FullImageModal', {
                source: preferredImageSource,
                uri: preferredImageUri,
              })
            }
          />
        </View>

        {useReservedModeShell ? (
          <VocabularySecondViewShell
            backgroundColor={colors.background}
            headerTopPadding={stickyHeaderPinnedTopPadding}
            headerBottomPadding={isWebLessonLayout ? 18 : 14}
            minHeight={secondViewShellMinHeight}
            modeBar={renderModeButtons()}
            onLayout={(event) => {
              secondViewYRef.current = event.nativeEvent.layout.y;
            }}
            onHeaderLayout={(event) => {
              setStickyHeaderHeight(event.nativeEvent.layout.height);
            }}
          >
            {renderSecondViewContent('stage')}
          </VocabularySecondViewShell>
        ) : (
          <View
            style={[
              styles.stickyHeader,
              isWebLessonLayout ? styles.webStickyHeader : undefined,
              !isSecondViewActive && styles.stickyHeaderFirstView,
              isWebLessonLayout && !isSecondViewActive ? styles.webStickyHeaderFirstView : undefined,
              { backgroundColor: colors.background, paddingTop: stickyHeaderPinnedTopPadding },
            ]}
            onLayout={(event) => {
              secondViewYRef.current = event.nativeEvent.layout.y;
              setStickyHeaderHeight(event.nativeEvent.layout.height);
            }}
          >
            {renderModeButtons()}
          </View>
        )}

        {useReservedModeShell ? (
          null
        ) : (
        <View
          style={[
            styles.lessonBody,
            isAndroidLesson && styles.lessonBodyAndroid,
            { minHeight: secondViewMinHeight, paddingTop: LESSON_BODY_TOP_BUFFER },
          ]}
        >

        {LESSON_MODE_ENABLED && lessonModeEnabled && (
          <View style={[styles.lessonProgressCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.lessonProgressTitle, { color: colors.secondaryText }]}>Lesson Path</Text>
            <View style={styles.lessonProgressRow}>
              {lessonSteps.map((step, index) => (
                <React.Fragment key={step.key}>
                  <View style={styles.lessonStepItem}>
                    <View
                      style={[
                        styles.lessonStepDot,
                        step.complete && { backgroundColor: colors.success },
                        step.active && { backgroundColor: colors.primary },
                        step.locked && styles.lessonStepDotLocked,
                      ]}
                    />
                    <Text
                      style={[
                        styles.lessonStepLabel,
                        step.complete && { color: colors.successText },
                        step.active && { color: colors.primary },
                        step.locked && styles.lessonStepLabelLocked,
                      ]}
                    >
                      {step.label}
                    </Text>
                  </View>
                  {index < lessonSteps.length - 1 && <View style={[styles.lessonStepLine, { backgroundColor: colors.border }]} />}
                </React.Fragment>
              ))}
            </View>
          </View>
        )}

        {isAndroidLesson ? (
          <View style={[styles.gameToolbarAndroid, { height: ANDROID_GAME_TOOLBAR_HEIGHT }]}>
            {mode === 'typing' ? null : renderCategoryControls()}
          </View>
        ) : (
          renderCategoryControls()
        )}

        {/* CONTENT */}
        <View
          style={[
            styles.gameViewport,
            isAndroidLesson && styles.gameViewportAndroid,
            isWebLessonLayout && lessonLayoutWidth >= 768 && styles.gameViewportDesktopWeb,
            isAndroidLesson && mode === 'matching' && styles.gameViewportAndroidMatching,
            isWebLessonLayout && {
              alignSelf: 'center',
              maxWidth: mode === 'matching'
                ? webMatchingGameMaxWidth
                : mode === 'typing'
                  ? webTypingGameMaxWidth
                  : webLessonGameMaxWidth,
              width: '100%',
              paddingHorizontal: scaleValue(16, webLessonScale),
            },
            {
              minHeight: mode === 'matching'
                ? matchingViewportMinHeight
                : mode === 'typing'
                  ? typingViewportMinHeight
                  : gameViewportMinHeight,
            },
          ]}
        >
          {mode === 'flashcards' && (
            <View
              style={[
                styles.gameSection,
                styles.flashcardsSection,
                isAndroidLesson && styles.gameSectionAndroidUnified,
                flashcardModuleTopDrop > 0 && { paddingTop: flashcardModuleTopDrop },
              ]}
            >
            <VocabularyFlashcard
              words={shuffledFlashcards}
              currentIndex={currentWordIndex}
              isShuffled={isFlashcardDeckShuffled}
              isFlipped={isFlipped}
              reverseDirection={reverseDirection}
              onFlip={handleFlashcardFlip}
              onNext={goToNextWord}
              onPrevious={goToPrevWord}
              onShuffle={shuffleFlashcards}
              onStartLearnedReviewGame={startLearnedReviewGame}
              progressModeEnabled={flashcardProgressModeEnabled}
              sideLabels={lesson?.flashcardLabels}
              onToggleDirection={() => {
                triggerSelectionHaptic();
                setReverseDirection((p) => !p);
                setIsFlipped(false);
              }}
              lessonModeEnabled={lessonModeEnabled}
              onToggleLessonMode={LESSON_MODE_ENABLED ? handleToggleLessonMode : undefined}
              onMarkKnown={handleMarkFlashcardKnown}
              onMarkReview={handleMarkFlashcardForReview}
              onToggleLearned={handleToggleCurrentFlashcardLearned}
              isCurrentWordLearned={currentFlashcardLearned}
              learnedCount={learnedFlashcardCount}
              totalWordCount={filteredWords.length}
              isCurrentWordKnown={!!shuffledFlashcards[currentWordIndex] && knownFlashcardKeys.has(vocabularyWordKey(shuffledFlashcards[currentWordIndex]))}
              knownCount={knownFlashcardKeys.size}
              currentWordReadyToMarkKnown={currentWordReadyToMarkKnown}
              layoutHeight={flashcardLayoutHeight}
              forceAndroidLayout={useApkPreviewLayout}
              colors={colors}
              isDarkMode={isDarkMode}
            />
            </View>
          )}

          {mode === 'matching' && (
            <View
              style={[
                styles.gameSection,
                styles.matchingGameSection,
                isAndroidLesson && styles.gameSectionAndroidUnified,
                isAndroidLesson && styles.matchingGameSectionAndroid,
                {
                  minHeight: matchingViewportMinHeight,
                  ...(isAndroidLesson ? { height: matchingViewportMinHeight } : null),
                },
              ]}
            >
            <VocabularyMatching
              gameState={gameState}
              matchingGamePairs={matchingGamePairs}
              onCardPress={handleCardPress}
              colors={colors}
              isDarkMode={isDarkMode}
              words={filteredWords}
              timerMode={timerMode}
              bestTimeForActiveCategory={bestTimeForActiveCategory}
              matchingSessionXp={matchingSessionXp}
              lastMatchingXpGain={lastMatchingXpGain}
              availableHeight={matchingViewportMinHeight}
              forceAndroidLayout={useApkPreviewLayout}
            />

            <VocabularyCompletionModal
              visible={completionVisible}
              gameState={gameState}
              timerMode={timerMode}
              wordsLength={filteredWords.length}
              isDarkMode={isDarkMode}
              onReplay={handleReplay}
              isFirstCompletion={isFirstCompletion}
              isPersonalBest={isPersonalBest}
              colors={colors}
              startedTimerMode={startedTimerMode}
              bestTimeForActiveCategory={bestTimeForActiveCategory}
              matchingSessionXp={matchingSessionXp}
              reviewWords={matchingReviewWords}
              onReviewWords={() => reviewFlashcardWords(matchingReviewWords)}
              primaryActionLabel={LESSON_MODE_ENABLED && lessonModeEnabled ? 'Continue to Write' : undefined}
              onPrimaryAction={LESSON_MODE_ENABLED && lessonModeEnabled ? handleContinueToTyping : undefined}
            />
            </View>
          )}

          {mode === 'typing' && (
            <View
              style={[
                styles.gameSection,
                styles.typingGameSection,
                isAndroidLesson && styles.gameSectionAndroidUnified,
                isWebLessonLayout && lessonLayoutWidth >= 768 && {
                  minHeight: typingViewportMinHeight,
                },
              ]}
            >
            <VocabularyTyping
              words={typingWords}
              typingGame={typingGame}
              colors={colors}
              isDarkMode={isDarkMode}
              allowSlashAlternatives={allowTypingSlashAlternatives}
              promptLabel={lesson?.typingPromptLabel}
              answerPlaceholder={lesson?.typingAnswerPlaceholder}
              keyboardVisible={isTypingKeyboardOpen}
              layoutHeight={
                isAndroidLesson
                  ? typingViewportMinHeight
                  : isWebLessonLayout && lessonLayoutWidth >= 768
                    ? typingViewportMinHeight
                    : lessonViewportHeight
              }
              forceAndroidLayout={useApkPreviewLayout}
              onShuffle={handleShuffleTypingWords}
              onSessionComplete={handleLessonTypingComplete}
              suppressCompletionScreen={LESSON_MODE_ENABLED && lessonModeEnabled}
            />
            </View>
          )}
        </View>
        </View>
        )}
      </ScrollView>
      <Modal visible={categoryPickerOpen} transparent animationType="slide">
        <TouchableOpacity
          activeOpacity={1}
          style={styles.categorySheetBackdrop}
          onPress={() => setCategoryPickerOpen(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={[
              styles.categorySheet,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                paddingBottom: Math.max(insets.bottom, 16),
              },
            ]}
            onPress={() => {}}
          >
            <View style={styles.categorySheetHeader}>
              <Text style={[styles.categorySheetTitle, { color: colors.text }]}>{categoryPickerTitle}</Text>
              <TouchableOpacity
                onPress={() => setCategoryPickerOpen(false)}
                style={styles.categorySheetDoneButton}
                accessibilityRole="button"
                accessibilityLabel="Close category picker"
              >
                <Text style={[styles.categorySheetDoneText, { color: colors.primary }]}>Done</Text>
              </TouchableOpacity>
            </View>

            {[categoryPickerAllLabel, ...categories].map((cat) => {
              const active =
                (cat === categoryPickerAllLabel && selectedCategories.length === 0) ||
                selectedCategories.includes(cat);
              const isAllOption = cat === categoryPickerAllLabel;

              return (
                <TouchableOpacity
                  key={cat}
                  onPress={() => toggleCategory(cat)}
                  accessibilityRole="button"
                  accessibilityLabel={`Select ${cat}`}
                  accessibilityState={{ selected: active }}
                  style={[
                    styles.categorySheetOption,
                    {
                      backgroundColor: active ? colors.primarySoft : 'transparent',
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <MaterialIcons
                    name={
                      active
                        ? allowMultiCategorySelection && !isAllOption
                          ? 'check-box'
                          : 'check-circle'
                        : allowMultiCategorySelection && !isAllOption
                          ? 'check-box-outline-blank'
                          : 'radio-button-unchecked'
                    }
                    size={20}
                    color={active ? colors.primary : colors.secondaryText}
                  />
                  <Text style={[styles.categorySheetOptionText, { color: colors.text }]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
      <Modal visible={LESSON_MODE_ENABLED && lessonSummaryVisible} transparent animationType="fade">
        <View style={styles.lessonSummaryBackdrop}>
          <View style={[styles.lessonSummaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.lessonSummaryTitle, { color: colors.text }]}>Lesson Complete</Text>
            <Text style={[styles.lessonSummarySubtitle, { color: colors.secondaryText }]}>
              Flashcards, matching, and writing done.
            </Text>

            <View style={styles.lessonSummaryMetrics}>
              <View style={[styles.lessonSummaryMetricBox, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                <Text style={[styles.lessonSummaryMetricLabel, { color: colors.secondaryText }]}>Known</Text>
                <Text style={[styles.lessonSummaryMetricValue, { color: colors.text }]}>
                  {knownFlashcardKeys.size}/{filteredWords.length}
                </Text>
              </View>
              <View style={[styles.lessonSummaryMetricBox, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                <Text style={[styles.lessonSummaryMetricLabel, { color: colors.secondaryText }]}>Matching</Text>
                <Text style={[styles.lessonSummaryMetricValue, { color: colors.text }]}>
                  {gameState.totalScore}/{filteredWords.length}
                </Text>
              </View>
              <View style={[styles.lessonSummaryMetricBox, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                <Text style={[styles.lessonSummaryMetricLabel, { color: colors.secondaryText }]}>Writing points</Text>
                <Text style={[styles.lessonSummaryMetricValue, { color: colors.text }]}>
                  +{typingGame.sessionXp}
                </Text>
              </View>
            </View>

            <Text style={[styles.lessonSummaryLevelText, { color: isTypingLevelMaster ? '#8A5A00' : colors.text }]}>
              {typingLevelLabel}
            </Text>

            <View style={styles.lessonSummaryActions}>
              <TouchableOpacity
                style={[styles.lessonSummarySecondaryButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={handleExitLessonMode}
              >
                <Text style={[styles.lessonSummarySecondaryButtonText, { color: colors.text }]}>Free Practice</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.lessonSummaryPrimaryButton, { backgroundColor: colors.primary }]}
                onPress={handleReplayLessonFlow}
              >
                <Text style={styles.lessonSummaryPrimaryButtonText}>Replay Lesson</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  webHeader: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  androidTopBackButton: {
    marginTop: 0,
  },
  overviewSection: {
    paddingBottom: 18,
  },
  stickyHeader: {
    paddingTop: 10,
    paddingBottom: 14,
    position: 'relative',
    zIndex: 20,
  },
  webStickyHeader: {
    paddingBottom: 18,
  },
  stickyHeaderFirstView: {
    paddingBottom: 14,
    position: 'relative',
    zIndex: 1,
  },
  webStickyHeaderFirstView: {
    paddingBottom: 18,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
    marginLeft: 8,
  },
  webTitle: {
    fontSize: 22,
    marginTop: 0,
  },
  lessonImage: {
    width: '96%',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 8,
    borderRadius: 18,
    resizeMode: 'contain',
  },
  webLessonImage: {
    marginTop: 6,
    marginBottom: 4,
  },
  lessonBody: {
    justifyContent: 'flex-start',
    position: 'relative',
    zIndex: 2,
  },
  lessonBodyAndroid: {
    zIndex: 0,
    elevation: 0,
  },
  lessonBodyAndroidStage: {
    flex: 1,
    minHeight: 0,
  },
  modeButtonsWrap: {
    paddingHorizontal: 16,
  },
  modeButtonsWrapAndroid: {
    paddingHorizontal: 12,
  },
  overviewModeButtonsWrap: {
    marginTop: 8,
    marginBottom: 8,
  },
  modeHeaderRow: {
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  modeButtons: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 460,
    alignSelf: 'center',
    marginBottom: 0,
  },
  modeButtonsCompact: {
    maxWidth: '100%',
  },
  imageShortcutButton: {
    width: 42,
    height: 42,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 0,
  },
  stickyActionButtonHidden: {
    opacity: 0,
  },
  modeButton: {
    flex: 1,
    minWidth: 0,
    minHeight: 44,
    paddingVertical: Platform.OS === 'web' ? 10 : 12,
    paddingHorizontal: 5,
    marginHorizontal: 8,
    borderRadius: uiRadii.control,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    borderWidth: 2,
  },
  modeButtonAndroid: {
    paddingVertical: 12,
  },
  modeButtonCompact: {
    minHeight: 42,
    marginHorizontal: 3,
    paddingHorizontal: 3,
    paddingVertical: 9,
    gap: 3,
  },
  activeMode: {
    backgroundColor: '#1982d2ff',
    borderColor: '#105b94ff',
  },
  modeButtonLocked: {
    opacity: 0.45,
  },
  modeText: {
    flexShrink: 1,
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 19,
  },
  modeTextCompact: {
    fontSize: 13,
    lineHeight: 16,
  },
  modeTextAndroid: {
    fontSize: 16,
    lineHeight: 19,
    fontWeight: '500',
  },
  modeTextCompactAndroid: {
    fontSize: 14,
    lineHeight: 17,
  },
  modeTextDesktopWeb: {
    fontWeight: '800',
  },
  modeTextActive: {
    color: '#ffffffff',
  },
  lessonProgressCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#d8e2ec',
  },
  lessonProgressTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#4B5B6A',
    marginBottom: 12,
    textAlign: 'center',
  },
  lessonProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lessonStepItem: {
    alignItems: 'center',
    minWidth: 78,
  },
  lessonStepDot: {
    width: 12,
    height: 12,
    borderRadius: 999,
    backgroundColor: '#D0D7DE',
    marginBottom: 6,
  },
  lessonStepDotActive: {
    backgroundColor: '#1671B6',
  },
  lessonStepDotComplete: {
    backgroundColor: '#58CC02',
  },
  lessonStepDotLocked: {
    backgroundColor: '#BCC6D0',
  },
  lessonStepLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6B7A89',
  },
  lessonStepLabelActive: {
    color: '#1671B6',
  },
  lessonStepLabelComplete: {
    color: '#2F8F2F',
  },
  lessonStepLabelLocked: {
    color: '#9AA5B1',
  },
  lessonStepLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#D8E2EC',
    marginHorizontal: 6,
    marginBottom: 18,
  },
  categoryRow: {
    marginTop: 8,
    marginBottom: 0,
    flexGrow: 0,
    minHeight: 44,
  },
  categorySlot: {
    minHeight: 34,
    justifyContent: 'center',
    paddingTop: 0,
  },
  categoryRowWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 34,
    paddingLeft: 16,
  },
  categoryPickerWrap: {
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryControlsRow: {
    position: 'relative',
    zIndex: 5,
    elevation: 5,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    marginTop: 0,
    marginBottom: 18,
  },
  categoryControlsRowDesktopWeb: {
    marginTop: 0,
    marginBottom: 11,
    paddingHorizontal: 12,
  },
  categoryControlsRowAndroid: {
    minHeight: 42,
    marginBottom: 0,
    paddingHorizontal: 12,
    flexWrap: 'nowrap',
  },
  categoryControlsRowAndroidMatching: {
    marginBottom: 0,
  },
  categoryPickerButton: {
    position: 'relative',
    zIndex: 6,
    elevation: 6,
    minHeight: 34,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    maxWidth: '100%',
  },
  categoryPickerButtonAndroid: {
    flexShrink: 1,
    minWidth: 0,
  },
  categoryPickerText: {
    fontSize: 13,
    fontWeight: '600',
    flexShrink: 1,
  },
  progressModeButton: {
    minHeight: 34,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  progressModeButtonAndroid: {
    flexShrink: 0,
  },
  progressModeText: {
    maxWidth: 118,
    fontSize: 13,
    fontWeight: '700',
  },
  progressModeMeta: {
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  categoryLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: '#5B6773',
    marginRight: 10,
  },
  categoryRowContent: {
    paddingRight: 0,
    minHeight: 34,
    alignItems: 'center',
  },
  categorySpacer: {
    minHeight: 34,
  },
  gameToolbarAndroid: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gameViewport: {
    paddingHorizontal: 16,
    paddingBottom: 0,
    justifyContent: 'flex-start',
  },
  gameViewportAndroid: {
    paddingTop: 6,
  },
  gameViewportAndroidStage: {
    flex: 1,
    minHeight: 0,
  },
  gameViewportAndroidMatching: {
    paddingHorizontal: 8,
    alignItems: 'stretch',
  },
  gameViewportDesktopWeb: {
    paddingTop: 4,
  },
  gameSection: {
    marginTop: 2,
  },
  gameSectionAndroidUnified: {
    width: '100%',
    marginTop: 0,
    paddingTop: 0,
    justifyContent: 'flex-start',
  },
  flashcardsSection: {
    justifyContent: 'flex-start',
    paddingTop: 6,
  },
  secondaryGameSection: {
    justifyContent: 'flex-start',
    paddingTop: 8,
  },
  matchingGameSection: {
    justifyContent: 'flex-start',
    paddingTop: 0,
  },
  matchingGameSectionAndroid: {
    width: '100%',
  },
  typingGameSection: {
    justifyContent: 'flex-start',
    paddingTop: 0,
  },
  closeButton: {
    position: 'absolute',
    zIndex: 100,
  },
  categoryChip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    height: 44,
    borderRadius: 11,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#ddd',
    marginRight: 10,
  },
  categoryChipActive: {
 backgroundColor: '#1da5c4ff',
    borderColor: '#1881cdff',
  },
  categoryText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#666',
  },
  categoryTextActive: {
    color: '#ffffff',
  },
  categorySheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.36)',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 0,
  },
  categorySheet: {
    width: '100%',
    maxWidth: 800,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderWidth: 1,
    paddingTop: 14,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 12,
  },
  categorySheetHeader: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  categorySheetTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  categorySheetDoneButton: {
    minHeight: 36,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categorySheetDoneText: {
    fontSize: 15,
    fontWeight: '700',
  },
  categorySheetOption: {
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  categorySheetOptionText: {
    fontSize: 16,
    fontWeight: '600',
  },
  lessonSummaryBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  lessonSummaryCard: {
    width: '100%',
    maxWidth: 460,
    borderRadius: 18,
    padding: 22,
    borderWidth: 1.5,
    borderColor: '#DDE5EE',
  },
  lessonSummaryTitle: {
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 6,
  },
  lessonSummarySubtitle: {
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 18,
  },
  lessonSummaryMetrics: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
  },
  lessonSummaryMetricBox: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 12,
    borderColor: '#DDE5EE',
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  lessonSummaryMetricLabel: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
  },
  lessonSummaryMetricValue: {
    fontSize: 19,
    fontWeight: '800',
  },
  lessonSummaryLevelText: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 18,
  },
  lessonSummaryActions: {
    flexDirection: 'row',
    gap: 10,
  },
  lessonSummaryPrimaryButton: {
    flex: 1,
    backgroundColor: '#1671B6',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  lessonSummaryPrimaryButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
  lessonSummarySecondaryButton: {
    flex: 1,
    backgroundColor: '#EEF3F8',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  lessonSummarySecondaryButtonText: {
    color: '#44505C',
    fontSize: 15,
    fontWeight: '800',
  },
});
