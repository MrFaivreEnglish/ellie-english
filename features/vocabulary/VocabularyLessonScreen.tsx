import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Platform, useWindowDimensions, Modal, KeyboardAvoidingView, Keyboard } from 'react-native';
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
import { MaterialIcons } from '@expo/vector-icons';
import { scaleValue } from '../shared/responsiveLayout';
import { useLessonLayout, VocabularyMode } from './useLessonLayout';
import { markPracticeActivityToday } from '../progress/xpStorage';
import { saveLastLesson } from '../progress/lastLessonStorage';
import { triggerSelectionHaptic, triggerSuccessHaptic } from '../shared/haptics';
import {
  getLearnedFlashcardKeys,
  recordLearnedFlashcardToday,
  saveLearnedFlashcardKeys,
} from './flashcardProgressStorage';
import { getSoftShadow, uiRadii } from '../shared/uiPrimitives';
import { FRESH_COLORS } from '../shared/freshDirection';
import SoundWaveIcon from '../shared/SoundWaveIcon';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { VocabularyStackParamList, RootStackParamList } from '../../types/navigationTypes';
import type { VocabGroup } from '../../types/lessonTypes';

const shuffleWordList = (words: Word[]) => shuffleArray(words);
const MAIN_TAB_TARGETS = ['Grammar', 'Vocabulary', 'Lessons', 'Settings'];
const vocabularyWordKey = (word: Word) => `${word.english.trim().toLowerCase()}|${word.french.trim().toLowerCase()}`;
const resolveVocabularyMode = (value: any): VocabularyMode =>
  value === 'matching' || value === 'typing' || value === 'flashcards' ? value : 'flashcards';
const getInitialReverseDirection = (lesson: any) => !!lesson?.initialReverseDirection;
type MixedVocabularyImageCard = {
  id: string;
  title?: string;
  imageUrl: string;
};

type Props = CompositeScreenProps<
  NativeStackScreenProps<VocabularyStackParamList, 'VocabularyLesson'>,
  NativeStackScreenProps<RootStackParamList>
>;

const fmtMs = (ms: number) => {
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
};

export default function VocabularyLessonScreen({ route, navigation }: Props) {
  const { isDarkMode, colors, isVocabTimerMode, isVocabTimerRecordSavingEnabled, isAndroidStatusBarEnabled, isVocabAudioMatchMode, toggleVocabAudioMatchMode } = useTheme();
  const initialRouteMode = resolveVocabularyMode(route?.params?.initialMode);
  const { width: screenWidth, height: rawScreenHeight } = useWindowDimensions();
  const [mode, setMode] = useState<VocabularyMode>(initialRouteMode);
  const [viewportHeight, setViewportHeight] = useState(rawScreenHeight);
  const [isSecondViewActive, setIsSecondViewActive] = useState(false);
  const [stableScreenHeight, setStableScreenHeight] = useState(rawScreenHeight);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const { lesson, backLabel = 'Back to Vocabulary', backTarget } = route.params;
  const hasMatchingCategoryControls = Array.isArray((lesson?.flashcards?.[0] as any)?.words);
  const useRefillMatching = !!lesson?.useRefillMatching;

  const {
    useApkPreviewLayout,
    isAndroidLesson,
    isWebLessonLayout,
    useReservedModeShell,
    lessonLayoutWidth,
    isTypingKeyboardOpen,
    lessonViewportHeight,
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
  } = useLessonLayout({
    mode,
    viewportHeight,
    screenWidth,
    rawScreenHeight,
    keyboardHeight,
    stableScreenHeight,
    hasMatchingCategoryControls,
    isAndroidStatusBarEnabled,
  });
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

    if (isMainTabTarget && typeof (parentNavigation as any)?.jumpTo === 'function') {
      resetBorrowedVocabularyLesson();
      (parentNavigation as any).jumpTo(backTarget);
      return;
    }

    if (parentNavigation && parentRouteNames.includes(backTarget)) {
      (parentNavigation as any).navigate(backTarget);
      return;
    }

    if (parentNavigation && isMainTabTarget && parentRouteNames.includes('MainTabs')) {
      (parentNavigation as any).navigate('MainTabs', { screen: backTarget });
      return;
    }

    (navigation as any).navigate(backTarget);
  }, [backTarget, navigation, resetBorrowedVocabularyLesson]);

  useEffect(() => {
    if (!isBorrowedVocabularyLesson) return undefined;

    const parentNavigation = navigation.getParent?.();
    if (!parentNavigation?.addListener) return undefined;

    return (parentNavigation as any).addListener('tabPress', (event: any) => {
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
  const lastLessonScrollYRef = useRef(0);
  const lastLessonScrollDirectionRef = useRef<'up' | 'down'>('down');
  const secondViewThresholdRef = useRef(0);
  const isManualLessonScrollRef = useRef(false);
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

  const scheduleSoftLayoutChange = useCallback(() => {}, []);

  useEffect(() => {
    const heightDrop = stableScreenHeight - rawScreenHeight;

    if (!isTypingKeyboardOpen || rawScreenHeight > stableScreenHeight || heightDrop < 80) {
      scheduleSoftLayoutChange();
      setStableScreenHeight(rawScreenHeight);
    }
  }, [isTypingKeyboardOpen, rawScreenHeight, scheduleSoftLayoutChange, stableScreenHeight]);

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
  const [completionModalReady, setCompletionModalReady] = useState(false);
  const [startedTimerMode, setStartedTimerMode] = useState(isVocabTimerMode);
  const [learnedFlashcardKeys, setLearnedFlashcardKeys] = useState<Set<string>>(new Set());
  const [learnedFlashcardKeysLoaded, setLearnedFlashcardKeysLoaded] = useState(false);
  const [knownFlashcardKeys, setKnownFlashcardKeys] = useState<Set<string>>(new Set());
  const [reviewFlashcardKeys, setReviewFlashcardKeys] = useState<Set<string>>(new Set());
  const [seenBackFlashcardKeys, setSeenBackFlashcardKeys] = useState<Set<string>>(new Set());
  const [flashcardProgressModeEnabled, setFlashcardProgressModeEnabled] = useState(false);
  const [categoryPickerOpen, setCategoryPickerOpen] = useState(false);
  const [categoryPickerAnchor, setCategoryPickerAnchor] = useState({ x: 16, y: 0, width: 200, height: 40 });
  const categoryPickerButtonRef = useRef<View>(null);

  // Words
  const allWords = useMemo(() => {
    if (!lesson?.flashcards) return [];
    return Array.isArray((lesson.flashcards[0] as any)?.words)
      ? lesson.flashcards.flatMap((c: any) => c.words)
      : lesson.flashcards;
  }, [lesson?.flashcards]);

const categories = useMemo<string[]>(() => {
  if (!lesson?.flashcards) return [];

  // grouped format
  if (Array.isArray((lesson.flashcards[0] as any)?.words)) {
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
    if (!Array.isArray((lesson?.flashcards?.[0] as any)?.words)) return null;
    if (selectedCategories.length !== 1) return null;

    return (lesson.flashcards.find((group: any) => group.category === selectedCategories[0]) as VocabGroup) ?? null;
  }, [lesson?.flashcards, selectedCategories]);
  const selectedCategoryImage = selectedCategoryGroup?.imageUrl ?? selectedCategoryGroup?.image;
  const mixedLessonImageCards = useMemo<MixedVocabularyImageCard[]>(() => {
    if (!lesson?.isVocabularyMix) return [];

    if (Array.isArray(lesson.sourceLessonImageCards)) {
      return lesson.sourceLessonImageCards
        .filter((imageCard: { id?: string | number; title?: string; imageUrl?: string } | null | undefined): imageCard is { id?: string | number; title?: string; imageUrl: string } =>
          typeof imageCard?.imageUrl === 'string' && imageCard.imageUrl.trim().length > 0
        )
        .map((imageCard: { id?: string | number; title?: string; imageUrl: string }, index: number) => ({
          id: String(imageCard.id ?? imageCard.imageUrl ?? index),
          title: imageCard.title,
          imageUrl: imageCard.imageUrl.trim(),
        }));
    }

    if (Array.isArray(lesson.sourceLessonImages)) {
      return lesson.sourceLessonImages
        .filter((imageUrl: unknown): imageUrl is string => typeof imageUrl === 'string' && imageUrl.trim().length > 0)
        .map((imageUrl: string, index: number) => ({
          id: `${imageUrl}-${index}`,
          title: undefined,
          imageUrl: imageUrl.trim(),
        }));
    }

    return [];
  }, [lesson?.isVocabularyMix, lesson?.sourceLessonImageCards, lesson?.sourceLessonImages]);
  const shouldShowMixedImageCarousel = !selectedCategoryImage && mixedLessonImageCards.length > 1;

  // Prefetch every slide up front so swiping the carousel doesn't re-trigger
  // the "Loading picture…" placeholder for images that are about to be seen.
  useEffect(() => {
    if (!shouldShowMixedImageCarousel) return;

    let cancelled = false;
    mixedLessonImageCards.forEach((imageCard) => {
      if (cancelled) return;
      Image.prefetch(imageCard.imageUrl).catch(() => {});
    });

    return () => {
      cancelled = true;
    };
  }, [mixedLessonImageCards, shouldShowMixedImageCarousel]);

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
    isVocabTimerRecordSavingEnabled,
    useRefillMatching
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
    if (useRefillMatching) {
      return filteredWords.length > 0 && gameState.totalScore >= filteredWords.length;
    }

    return (
      gameState.currentSet >= getMatchingSetCount(filteredWords.length) - 1 &&
      gameState.matchedPairs.length === (matchingGamePairs?.english?.length || 0) * 2 &&
      matchingGamePairs?.english?.length > 0
    );
  }, [
    gameState.currentSet,
    gameState.matchedPairs.length,
    gameState.totalScore,
    matchingGamePairs?.english?.length,
    filteredWords.length,
    useRefillMatching,
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
  const matchingUnlocked = true;
  const typingUnlocked = true;
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
    setCompletionModalReady(true);
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
    setLearnedFlashcardKeysLoaded(false);

    getLearnedFlashcardKeys(flashcardProgressLessonKey).then((keys) => {
      if (active) {
        setLearnedFlashcardKeys(keys);
        setLearnedFlashcardKeysLoaded(true);
      }
    }).catch(() => {});

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
      setFlashcardProgressModeEnabled(false);

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
      isManualLessonScrollRef.current = false;
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

  const scrollToGame = useCallback((targetMode: VocabularyMode = mode, animated = true) => {
    isManualLessonScrollRef.current = false;
    const snapExtra = getModeSnapExtra(targetMode);
    const targetY = getSecondViewScrollY(STICKY_TOP_SNAP_OFFSET + snapExtra);

    if (useReservedModeShell) {
      setIsSecondViewActive(true);
    }

    requestAnimationFrame(() => {
      scrollViewRef.current?.scrollTo({ y: targetY, animated });
    });

    setTimeout(() => {
      scrollViewRef.current?.scrollTo({ y: targetY, animated });
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

  const restartFlashcardDeck = (wordsForDeck: Word[]) => {
    setFlashcardDeckWords(wordsForDeck);
    setShuffledFlashcards(wordsForDeck);
    setCurrentWordIndex(0);
    setIsFlipped(false);
    setIsFlashcardDeckShuffled(false);
  };

  const reviewFlashcardWords = (wordsForReview: Word[]) => {
    if (!wordsForReview.length) return;

    setCompletionVisible(false);
    setFlashcardDeckWords(wordsForReview);
    setShuffledFlashcards(wordsForReview);
    setCurrentWordIndex(0);
    setIsFlipped(false);
    setIsFlashcardDeckShuffled(false);
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

    if (reviewWords.length > 0) {
      restartFlashcardDeck(reviewWords);
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

  const handleLessonTypingComplete = () => {};

  const handleGoToAccount = useCallback(() => {
    setCompletionVisible(false);
    const rootNav = navigation.getParent?.()?.getParent?.();
    rootNav?.navigate('Account' as never);
  }, [navigation]);

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

  const renderCategoryPickerButton = () => {
    if (categories.length === 0) return null;

    return (
      <TouchableOpacity
        ref={categoryPickerButtonRef}
        activeOpacity={0.82}
        onPress={() => {
          triggerSelectionHaptic();
          Keyboard.dismiss();
          if (categoryPickerOpen) { setCategoryPickerOpen(false); return; }
          categoryPickerButtonRef.current?.measureInWindow((x, y, width, height) => {
            setCategoryPickerAnchor({ x, y, width, height });
            setCategoryPickerOpen(true);
          });
        }}
        accessibilityRole="button"
        accessibilityLabel={`Choose ${categoryPickerLabel.toLowerCase()}`}
        accessibilityState={{ expanded: categoryPickerOpen }}
        style={[
          styles.categoryPickerButton,
          isAndroidLesson && styles.categoryPickerButtonAndroid,
          {
            backgroundColor: isDarkMode ? colors.surface : colors.card,
            borderColor: colors.border,
          },
        ]}
      >
        <Text
          style={[styles.categoryPickerText, { color: colors.text }]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.82}
        >
          {selectedCategories.length ? activeCategoryLabel : `${categoryPickerLabel}: ${activeCategoryLabel}`}
        </Text>
        <MaterialIcons
          name={categoryPickerOpen ? 'expand-less' : 'expand-more'}
          size={18}
          color={colors.secondaryText}
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
            backgroundColor: flashcardProgressModeEnabled
              ? (isDarkMode ? '#0E2E1E' : '#dbfce0')
              : (isDarkMode ? colors.surface : colors.card),
            borderColor: flashcardProgressModeEnabled ? '#5cb572' : colors.border,
          },
        ]}
      >
        <View
          style={[
            styles.progressModeCheckbox,
            {
              backgroundColor: flashcardProgressModeEnabled ? '#1c8742' : 'transparent',
              borderColor: flashcardProgressModeEnabled ? '#1c8742' : (isDarkMode ? colors.border : '#CCC5B5'),
            },
          ]}
        >
          {flashcardProgressModeEnabled && (
            <MaterialIcons name="check" size={10} color="#FFFFFF" />
          )}
        </View>
        <Text
          style={[
            styles.progressModeText,
            { color: flashcardProgressModeEnabled ? (isDarkMode ? '#8FE3A3' : '#005f21') : colors.text },
          ]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.82}
        >
          {flashcardProgressModeEnabled
            ? `Saving · ${learnedFlashcardKeysLoaded ? learnedFlashcardCount : 0}/${filteredWords.length}`
            : 'Save words'}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderAudioMatchToggle = () => {
    if (mode !== 'matching') return null;

    const audioAccent = isDarkMode ? '#4BBAF4' : FRESH_COLORS.exerciseBlue;

    return (
      <TouchableOpacity
        activeOpacity={0.82}
        onPress={() => {
          triggerSelectionHaptic();
          toggleVocabAudioMatchMode();
          // Audio and text match are treated as separate, standalone rounds —
          // switching mid-round would let a player who's already seen the
          // text carry that knowledge into audio mode (or vice versa), so
          // force a fresh shuffle every time the toggle changes.
          Keyboard.dismiss();
          stopTimer();
          resetGameState();
          initializeGameSet();
        }}
        accessibilityRole="switch"
        accessibilityLabel={isVocabAudioMatchMode ? 'Turn off audio match mode' : 'Turn on audio match mode'}
        accessibilityState={{ checked: isVocabAudioMatchMode }}
        style={[
          styles.audioMatchToggle,
          {
            backgroundColor: isDarkMode ? '#1D252E' : colors.card,
            borderColor: isDarkMode ? 'transparent' : colors.border,
            borderWidth: isDarkMode ? 0 : 1,
          },
        ]}
      >
        {compactModeButtons ? (
          <SoundWaveIcon size={15} color={audioAccent} />
        ) : (
          <Text style={[styles.audioMatchToggleText, { color: colors.text }]} numberOfLines={1}>
            Audio Mode
          </Text>
        )}
        <View
          style={[
            styles.audioMatchSwitchTrack,
            { backgroundColor: isVocabAudioMatchMode ? audioAccent : (isDarkMode ? '#262F38' : colors.border) },
          ]}
        >
          <View
            style={[
              styles.audioMatchSwitchKnob,
              { left: isVocabAudioMatchMode ? 15 : 2.5 },
            ]}
          />
        </View>
      </TouchableOpacity>
    );
  };

  const renderCategoryControls = () => {
    const categoryButton = renderCategoryPickerButton();
    const progressButton = renderFlashcardProgressButton();
    const audioToggle = renderAudioMatchToggle();

    if (!categoryButton && !progressButton && !audioToggle) return null;

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
        {audioToggle}
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
        <View style={[styles.modeHeaderRow, showSideActions && styles.modeHeaderRowFloatingActions, isScaledWebLesson && { maxWidth: scaleValue(showSideActions ? 560 : 520, webLessonScale), gap: scaleValue(8, webLessonScale) }]}>
          <View
            style={[
              styles.modeButtons,
              compactModeButtons && styles.modeButtonsCompact,
              isScaledWebLesson && { maxWidth: scaleValue(380, webLessonScale) },
              { backgroundColor: isDarkMode ? colors.surface : '#ECE8DD' },
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
                    backgroundColor: 'transparent',
                    borderColor: 'transparent',
                    borderWidth: 0,
                  },
                  isScaledWebLesson && {
                    marginHorizontal: scaleValue(8, webLessonScale),
                    paddingVertical: scaleValue(10, webLessonScale),
                  },
                  active && [
                    styles.activeMode,
                    {
                      backgroundColor: isDarkMode ? colors.card : '#FFFFFF',
                      borderColor: 'transparent',
                    },
                  ],
                ]}
                onPress={() => handleModeChange(item.key)}
                accessibilityRole="button"
                accessibilityLabel={`Switch to ${item.label}`}
                accessibilityState={{ selected: active }}
              >
                <Text
                  style={[
                    styles.modeText,
                    compactModeButtons && styles.modeTextCompact,
                    isAndroidLesson && styles.modeTextAndroid,
                    isAndroidLesson && compactModeButtons && styles.modeTextCompactAndroid,
                    { color: active ? (isDarkMode ? '#3FA0DB' : FRESH_COLORS.exerciseBlue) : colors.secondaryText, fontWeight: active ? '800' : '600' },
                    isDesktopWebLesson && styles.modeTextDesktopWeb,
                    isScaledWebLesson && { fontSize: scaleValue(16, webLessonScale) },
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
            <>
            <TouchableOpacity
              accessibilityLabel={backLabel}
              accessibilityRole="button"
              onPress={handleBackPress}
              style={[
                styles.imageShortcutButton,
                styles.headerFloatingActionButton,
                styles.headerFloatingBackButton,
                {
                  backgroundColor: isDarkMode ? colors.surface : colors.card,
                  borderColor: colors.border,
                  width: scaleValue(isAndroidLesson ? 38 : 42, webLessonScale),
                  height: scaleValue(isAndroidLesson ? 38 : 42, webLessonScale),
                },
              ]}
            >
              <MaterialIcons name="arrow-back" size={scaleValue(21, webLessonScale)} color={colors.text} />
            </TouchableOpacity>
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
                styles.headerFloatingActionButton,
                styles.headerFloatingImageButton,
                {
                  backgroundColor: isDarkMode ? colors.surface : colors.card,
                  borderColor: colors.border,
                  width: scaleValue(isAndroidLesson ? 38 : 42, webLessonScale),
                  height: scaleValue(isAndroidLesson ? 38 : 42, webLessonScale),
                },
              ]}
            >
              <MaterialIcons name="image" size={scaleValue(21, webLessonScale)} color={colors.text} />
            </TouchableOpacity>
            </>
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
    const previousY = lastLessonScrollYRef.current;
    lastLessonScrollYRef.current = y;
    if (y > previousY + 0.5) lastLessonScrollDirectionRef.current = 'down';
    if (y < previousY - 0.5) lastLessonScrollDirectionRef.current = 'up';
    if (overviewHeightRef.current <= 0) return;

    const secondViewThreshold = isAndroidLesson
      ? Math.max(0, (secondViewYRef.current || overviewHeightRef.current + layoutTopInset) - 2)
      : Math.max(0, overviewHeightRef.current - stickyHeaderHeight - 2);
    secondViewThresholdRef.current = secondViewThreshold;
    const nextIsSecondViewActive = y >= secondViewThreshold;

    setIsSecondViewActive((current) => (
      current === nextIsSecondViewActive ? current : nextIsSecondViewActive
    ));

  }, [isAndroidLesson, layoutTopInset, stickyHeaderHeight]);

  const handleManualLessonScrollStart = useCallback(() => {
    isManualLessonScrollRef.current = true;
  }, []);

  const handleManualLessonScrollEnd = useCallback(() => {
    if (!isManualLessonScrollRef.current) return;
    isManualLessonScrollRef.current = false;

    const secondViewThreshold = secondViewThresholdRef.current;
    if (!isTypingKeyboardOpen && lastLessonScrollDirectionRef.current === 'down' && lastLessonScrollYRef.current > secondViewThreshold + 1) {
      lastLessonScrollYRef.current = secondViewThreshold;
      scrollViewRef.current?.scrollTo({ y: secondViewThreshold, animated: false });
    }
  }, [isTypingKeyboardOpen]);

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
                refillOnMatch={useRefillMatching}
                availableHeight={matchingViewportMinHeight}
                forceAndroidLayout={useApkPreviewLayout}
                audioMode={isVocabAudioMatchMode}
              />

              {completionModalReady && (
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
                  statsItems={timerMode ? [
                    { emoji: '✨', value: matchingSessionXp, label: 'XP' },
                    { emoji: '⏱', value: fmtMs(gameState.timer), label: 'Time' },
                    { emoji: '🏆', value: bestTimeForActiveCategory != null ? fmtMs(bestTimeForActiveCategory) : '--:--', label: 'Best' },
                  ] : [
                    { emoji: '✨', value: matchingSessionXp, label: 'XP Earned' },
                  ]}
                  reviewWords={matchingReviewWords}
                  onReviewWords={() => reviewFlashcardWords(matchingReviewWords)}
                  onGoToAccount={handleGoToAccount}
                  secondaryActionLabel="Back to Vocabulary"
                  onSecondaryAction={handleBackPress}
                />
              )}
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
                keyboardVisible={false}
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
                onGoToAccount={handleGoToAccount}
                onBack={handleBackPress}
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
      behavior={undefined}
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
        onScrollBeginDrag={handleManualLessonScrollStart}
        onScrollEndDrag={handleManualLessonScrollEnd}
        {...(Platform.OS === 'web' ? ({
          onWheel: handleManualLessonScrollStart,
          onScrollEnd: handleManualLessonScrollEnd,
        } as any) : {})}
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

          {shouldShowMixedImageCarousel ? (
            <View
              style={[
                styles.mixedImageCarouselWrap,
                {
                  width: lessonMediaWidth,
                  maxWidth: webLessonMediaMaxWidth,
                },
              ]}
            >
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                snapToInterval={lessonMediaWidth}
                decelerationRate="fast"
                directionalLockEnabled
                disableIntervalMomentum
                nestedScrollEnabled
                style={[
                  styles.mixedImageScroll,
                  {
                    width: lessonMediaWidth,
                    height: lessonImageHeight,
                  },
                ]}
                contentContainerStyle={styles.mixedImageScrollContent}
              >
                {mixedLessonImageCards.map((imageCard: MixedVocabularyImageCard, imageIndex: number) => {
                  const slideSource = { uri: imageCard.imageUrl };

                  return (
                    <View
                      key={`${imageCard.id}-${imageIndex}`}
                      style={[
                        styles.mixedImageSlide,
                        {
                          width: lessonMediaWidth,
                          height: lessonImageHeight,
                        },
                      ]}
                    >
                      <ImageWithCredit
                        source={slideSource}
                        imageScale={lessonImageContentScale}
                        style={[
                          styles.mixedCarouselImage,
                          {
                            width: lessonMediaWidth,
                            height: lessonImageHeight,
                          },
                        ] as any}
                        accessibilityLabel={imageCard.title ? `${imageCard.title} lesson image` : 'Lesson image'}
                      />
                    </View>
                  );
                })}
              </ScrollView>

            </View>
          ) : (
            <ImageWithCredit
              source={preferredImageSource as any}
              imageScale={lessonImageContentScale}
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
          )}
        </View>

        {useReservedModeShell ? (
          <VocabularySecondViewShell
            backgroundColor={colors.background}
            bodyTopGuard={isSecondViewActive ? 0 : FIRST_VIEW_SECOND_VIEW_GUARD}
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
              {
                backgroundColor: colors.background,
                paddingTop: stickyHeaderPinnedTopPadding,
              },
            ]}
            onLayout={(event) => {
              secondViewYRef.current = event.nativeEvent.layout.y;
              setStickyHeaderHeight(event.nativeEvent.layout.height);
            }}
          >
            {renderModeButtons()}
          </View>
        )}

        {!useReservedModeShell && (
          <View
            pointerEvents="none"
            style={[
              styles.firstViewSecondViewGuard,
              {
                backgroundColor: colors.background,
                height: isSecondViewActive ? 0 : FIRST_VIEW_SECOND_VIEW_GUARD,
              },
            ]}
          />
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


        {isAndroidLesson ? (
          <View style={[styles.gameToolbarAndroid, { height: ANDROID_GAME_TOOLBAR_HEIGHT }]}>
            {mode === 'typing' ? null : renderCategoryControls()}
          </View>
        ) : (
          renderCategoryControls()
        )}

        {/* CONTENT */}
        {filteredWords.length === 0 && (
          <View style={[styles.emptyLessonState, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <MaterialIcons name="book" size={32} color={colors.secondaryText} />
            <Text style={[styles.emptyLessonStateTitle, { color: colors.text }]}>No words yet</Text>
            <Text style={[styles.emptyLessonStateSubtitle, { color: colors.secondaryText }]}>
              This lesson doesn't have any words in the current selection.
            </Text>
          </View>
        )}
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
              refillOnMatch={useRefillMatching}
              availableHeight={matchingViewportMinHeight}
              forceAndroidLayout={useApkPreviewLayout}
              audioMode={isVocabAudioMatchMode}
            />

            {completionModalReady && (
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
                statsItems={timerMode ? [
                  { emoji: '✨', value: matchingSessionXp, label: 'XP' },
                  { emoji: '⏱', value: fmtMs(gameState.timer), label: 'Time' },
                  { emoji: '🏆', value: bestTimeForActiveCategory != null ? fmtMs(bestTimeForActiveCategory) : '--:--', label: 'Best' },
                ] : [
                  { emoji: '✨', value: matchingSessionXp, label: 'XP Earned' },
                ]}
                reviewWords={matchingReviewWords}
                onReviewWords={() => reviewFlashcardWords(matchingReviewWords)}
                secondaryActionLabel="Back to Vocabulary"
                onSecondaryAction={handleBackPress}
              />
            )}
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
              keyboardVisible={false}
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
              onGoToAccount={handleGoToAccount}
              onBack={handleBackPress}
            />
            </View>
          )}
        </View>
        </View>
        )}
      </ScrollView>
      <Modal visible={categoryPickerOpen} transparent animationType="fade">
        <TouchableOpacity
          activeOpacity={1}
          style={styles.categoryPopoverBackdrop}
          onPress={() => setCategoryPickerOpen(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={[
              styles.categoryPopover,
              getSoftShadow(isDarkMode, 'strong'),
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                shadowColor: '#000',
                top: categoryPickerAnchor.y + categoryPickerAnchor.height + 8,
                left: Math.max(16, categoryPickerAnchor.x),
              },
            ]}
            onPress={() => {}}
          >
            <ScrollView style={styles.categoryPopoverScroll} bounces={false}>
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
                        backgroundColor: active ? (isDarkMode ? colors.primarySoft : '#d2f0ff') : 'transparent',
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
                    <Text
                      style={[
                        styles.categorySheetOptionText,
                        { color: colors.text, fontWeight: active ? '700' : '600' },
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
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
  firstViewSecondViewGuard: {
    height: 44,
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
  mixedImageCarouselWrap: {
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 8,
    position: 'relative',
  },
  mixedImageScroll: {
    borderRadius: 18,
    overflow: 'hidden',
  },
  mixedImageScrollContent: {
    alignItems: 'center',
  },
  mixedImageSlide: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  mixedCarouselImage: {
    alignSelf: 'center',
    borderRadius: 18,
  },
  mixedImageCarouselOverlay: {
    alignItems: 'center',
    bottom: 12,
    flexDirection: 'row',
    gap: 8,
    left: 12,
    pointerEvents: 'box-none',
    position: 'absolute',
    right: 12,
  },
  mixedImageNavButton: {
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  mixedImageNavButtonDisabled: {
    opacity: 0.42,
  },
  mixedImageStatusPill: {
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    minHeight: 36,
    minWidth: 0,
    paddingHorizontal: 12,
  },
  mixedImageStatusTitle: {
    flexShrink: 1,
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 15,
  },
  mixedImageStatusCount: {
    fontSize: 11,
    fontWeight: '900',
    lineHeight: 14,
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
    position: 'relative',
  },
  modeHeaderRowFloatingActions: {
    minHeight: 44,
  },
  modeButtons: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 380,
    alignSelf: 'center',
    marginBottom: 0,
    borderRadius: 999,
    padding: 3,
    gap: 2,
  },
  modeButtonsCompact: {
    maxWidth: '100%',
  },
  imageShortcutButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 0,
  },
  headerFloatingActionButton: {
    elevation: 4,
    position: 'absolute',
    top: 2,
    zIndex: 5,
  },
  headerFloatingBackButton: {
    left: 0,
  },
  headerFloatingImageButton: {
    right: 0,
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
    backgroundColor: '#0D7DD4',
    borderColor: '#005EB3',
  },
  modeButtonLocked: {
    opacity: 0.45,
  },
  modeText: {
    flexShrink: 1,
    fontWeight: '400',
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
    fontWeight: '400',
  },
  modeTextCompactAndroid: {
    fontSize: 14,
    lineHeight: 17,
  },
  modeTextDesktopWeb: {
    fontWeight: '600',
  },
  modeTextActive: {
    color: '#ffffffff',
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
    height: 32,
    minHeight: 32,
    borderRadius: 999,
    borderWidth: 1.5,
    paddingHorizontal: 12,
    paddingVertical: 3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    maxWidth: '100%',
  },
  audioMatchToggle: {
    flexShrink: 0,
    height: 32,
    minHeight: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    borderRadius: 999,
    paddingHorizontal: 12,
  },
  audioMatchToggleText: {
    fontSize: 13,
    fontWeight: '700',
  },
  audioMatchSwitchTrack: {
    width: 30,
    height: 17,
    borderRadius: 999,
    position: 'relative',
  },
  audioMatchSwitchKnob: {
    position: 'absolute',
    top: 2.5,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
  },
  categoryPickerButtonAndroid: {
    flexShrink: 1,
    minWidth: 0,
  },
  categoryPickerText: {
    fontSize: 13,
    fontWeight: '700',
    flexShrink: 1,
  },
  progressModeButton: {
    height: 32,
    minHeight: 32,
    borderRadius: 999,
    borderWidth: 1.5,
    paddingHorizontal: 10,
    paddingVertical: 3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  progressModeButtonAndroid: {
    flexShrink: 0,
  },
  progressModeText: {
    maxWidth: 140,
    fontSize: 13,
    fontWeight: '700',
  },
  progressModeCheckbox: {
    width: 16,
    height: 16,
    borderRadius: 5,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
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
  emptyLessonState: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 32,
    paddingVertical: 36,
    paddingHorizontal: 24,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  emptyLessonStateTitle: {
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyLessonStateSubtitle: {
    fontSize: 14,
    textAlign: 'center',
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
    backgroundColor: '#0D7DD4',
    borderColor: '#005EB3',
  },
  categoryText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#666',
  },
  categoryTextActive: {
    color: '#ffffff',
  },
  categoryPopoverBackdrop: {
    flex: 1,
  },
  categoryPopover: {
    position: 'absolute',
    width: 240,
    maxHeight: 320,
    borderRadius: 14,
    borderWidth: 1,
    padding: 8,
  },
  categoryPopoverScroll: {
    maxHeight: 304,
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
});
