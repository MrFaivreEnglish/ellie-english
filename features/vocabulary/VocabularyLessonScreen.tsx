import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Platform, useWindowDimensions, Modal, KeyboardAvoidingView, Keyboard, LayoutAnimation, UIManager } from 'react-native';
import BackButton from '../shared/BackButton';
import ImageWithCredit from '../shared/ImageWithCredit';
import VocabularyFlashcard from './VocabularyFlashcard';
import VocabularyMatching from './VocabularyMatching';
import VocabularyCompletionModal from './VocabularyCompletionModal';
import { useTheme } from '../settings/ThemeContext';
import { useVocabularyGame } from './useVocabularyGame';
import { getLessonImage, getLessonThumbnailSource, getMatchingSetCount } from './vocabularyUtils';
import { Word } from '../../types/VocabularyTypes';
import { useTypingGame } from './useTypingGame';
import VocabularyTyping from './TypingView';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { clampNumber, getWebLessonImageScale, getWebLessonScale, scaleValue } from '../shared/responsiveLayout';
import { markPracticeActivityToday } from '../progress/xpStorage';
import {
  getLearnedFlashcardKeys,
  recordLearnedFlashcardToday,
  saveLearnedFlashcardKeys,
} from './flashcardProgressStorage';
import { triggerSelectionHaptic, triggerSuccessHaptic } from '../shared/haptics';

const shuffleWordList = (words: Word[]) => [...words].sort(() => Math.random() - 0.5);
const LESSON_MODE_ENABLED = false;
type VocabularyMode = 'flashcards' | 'matching' | 'typing';
const vocabularyWordKey = (word: Word) => `${word.english.trim().toLowerCase()}|${word.french.trim().toLowerCase()}`;
type FlashcardLessonPhase = 'initial' | 'review';

export default function VocabularyLessonScreen({ route, navigation }: any): any {
  const { isDarkMode, colors, isVocabTimerMode, isVocabTimerRecordSavingEnabled, isAndroidStatusBarEnabled } = useTheme();
  const insets = useSafeAreaInsets();

  const { width: screenWidth, height: rawScreenHeight } = useWindowDimensions();
  const [mode, setMode] = useState<VocabularyMode>('flashcards');
  const [viewportHeight, setViewportHeight] = useState(rawScreenHeight);
  const [isSecondViewActive, setIsSecondViewActive] = useState(false);
  const [stableScreenHeight, setStableScreenHeight] = useState(rawScreenHeight);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const keyboardHeightDrop = stableScreenHeight - rawScreenHeight;
  const isTypingKeyboardOpen = mode === 'typing' && (keyboardHeight > 0 || keyboardHeightDrop > 120);
  const screenHeight = isTypingKeyboardOpen ? stableScreenHeight : rawScreenHeight;
  const lessonViewportHeight = viewportHeight > 0 ? viewportHeight : screenHeight;
  const isCompactScreen = lessonViewportHeight < 760 || screenWidth < 390;
  const isLargeScreen = lessonViewportHeight > 900 && screenWidth >= 400;
  const webLessonScale = getWebLessonScale(screenWidth, lessonViewportHeight);
  const webLessonImageScale = getWebLessonImageScale(screenWidth, lessonViewportHeight);
  const isScaledWebLesson = Platform.OS === 'web' && webLessonScale > 1;
  const webLessonMediaMaxWidth = Platform.OS === 'web'
    ? Math.round(clampNumber(screenWidth * 0.78, 860, 1320))
    : undefined;
  const webLessonGameMaxWidth = Platform.OS === 'web'
    ? scaleValue(760, webLessonScale)
    : undefined;
  const layoutTopInset = Platform.OS === 'ios'
    ? (insets.top > 0 ? insets.top : 0)
    : Platform.OS === 'android' && isAndroidStatusBarEnabled
      ? insets.top
      : 0;
  const layoutBottomInset = Platform.OS === 'android' ? 0 : insets.bottom;
  const stickyHeaderTopPadding = Platform.OS === 'web' ? 6 : 10;
  const STICKY_TOP_SNAP_OFFSET = 0;
  const MATCHING_VIEW_SNAP_EXTRA = 0;
  const FLASHCARDS_VIEW_SNAP_EXTRA = 0;
  const TYPING_VIEW_SNAP_EXTRA = isTypingKeyboardOpen ? (isCompactScreen ? 42 : 28) : 0;
  const CATEGORY_SLOT_HEIGHT = isCompactScreen ? 34 : 38;
  const FLASHCARDS_VIEWPORT_TRIM = isCompactScreen ? 44 : 68;
  const MATCHING_VIEWPORT_TRIM = Platform.OS === 'android'
    ? (isCompactScreen ? 8 : 18)
    : (isCompactScreen ? 34 : 56);
  const TYPING_VIEWPORT_TRIM = Platform.OS === 'web' && screenWidth >= 768
    ? (isCompactScreen ? 8 : 14)
    : FLASHCARDS_VIEWPORT_TRIM;
  const FIRST_VIEW_BOTTOM_SPACE = isCompactScreen ? 20 : 28;
  const FIRST_VIEW_PEEK = 0;
  const typingKeyboardInset = isTypingKeyboardOpen
    ? Math.min(Math.max(keyboardHeight || keyboardHeightDrop, 220) + 72, 460)
    : 0;
  const [titleBlockHeight, setTitleBlockHeight] = useState(72);
  const [stickyHeaderHeight, setStickyHeaderHeight] = useState(Platform.OS === 'web' ? 48 : 68);

  const { lesson, backLabel = 'Back to Vocabulary', backTarget } = route.params;

  const scrollViewRef = useRef<ScrollView>(null);
  const overviewHeightRef = useRef(0);
  const initializedLessonKeyRef = useRef<string | null>(null);
  const pendingKeyboardHideScrollModeRef = useRef<VocabularyMode | null>(null);
  const overviewMinHeight = Math.max(
    isCompactScreen ? 420 : 500,
    lessonViewportHeight - layoutTopInset - layoutBottomInset - stickyHeaderHeight - FIRST_VIEW_PEEK
  );

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
    const imageReservedGap = Platform.OS === 'web'
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
    const maxByWidth = Platform.OS === 'web'
      ? Math.round(clampNumber(screenWidth * 0.95, 680, 1260) * webLessonImageScale)
      : Math.round(clampNumber(screenWidth * 1.8, 500, isLargeScreen ? 940 : 820));
    const maxHeight = Math.max(minHeight, Math.min(maxByViewport, maxByWidth));

    return Math.round(clampNumber(availableHeight, minHeight, maxHeight));
  }, [FIRST_VIEW_BOTTOM_SPACE, isCompactScreen, isLargeScreen, lessonViewportHeight, overviewMinHeight, screenWidth, titleBlockHeight, webLessonImageScale]);

  const secondViewMinHeight = useMemo(() => {
    const availableHeight = lessonViewportHeight - layoutBottomInset - stickyHeaderHeight - (isCompactScreen ? 8 : 12);
    const minHeight = isCompactScreen ? 250 : 280;
    return Math.max(minHeight, availableHeight);
  }, [isCompactScreen, layoutBottomInset, lessonViewportHeight, stickyHeaderHeight]);

  const gameViewportMinHeight = useMemo(() => {
    const baseHeight =
      secondViewMinHeight - CATEGORY_SLOT_HEIGHT - FLASHCARDS_VIEWPORT_TRIM - (isCompactScreen ? 6 : 10);
    return Math.max(isCompactScreen ? 170 : 190, baseHeight);
  }, [CATEGORY_SLOT_HEIGHT, FLASHCARDS_VIEWPORT_TRIM, isCompactScreen, secondViewMinHeight]);

  const matchingViewportMinHeight = useMemo(() => {
    const availableHeight =
      secondViewMinHeight - CATEGORY_SLOT_HEIGHT - MATCHING_VIEWPORT_TRIM - (isCompactScreen ? 2 : 8);
    return Math.max(isCompactScreen ? 286 : 320, availableHeight);
  }, [CATEGORY_SLOT_HEIGHT, MATCHING_VIEWPORT_TRIM, isCompactScreen, secondViewMinHeight]);

  const typingViewportMinHeight = useMemo(() => {
    const availableHeight =
      secondViewMinHeight - CATEGORY_SLOT_HEIGHT - TYPING_VIEWPORT_TRIM - (isCompactScreen ? 2 : 8);
    return Math.max(isCompactScreen ? 320 : 420, availableHeight);
  }, [CATEGORY_SLOT_HEIGHT, TYPING_VIEWPORT_TRIM, isCompactScreen, secondViewMinHeight]);

  // Hero image selection
  const localImageSource = useMemo(() => getLessonThumbnailSource(lesson), [lesson]);

  const preferredImageSource = useMemo(() => {
    if (lesson?.imageUrl || lesson?.image) {
      const raw = (lesson.imageUrl ?? lesson.image) as any;
      return typeof raw === 'string' ? { uri: raw } : raw;
    }

    const local = getLessonThumbnailSource(lesson);
    if (local) return local;

    const mapped = getLessonImage(lesson.title);
    return { uri: mapped };
  }, [lesson?.imageUrl, lesson?.image, lesson?.title]);

  // Image URI helper (for Android sizing)
  const preferredImageUri = useMemo(() => {
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
  }, [lesson?.imageUrl, lesson?.image, lesson?.title, localImageSource]);

  // Flashcards state
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [reverseDirection, setReverseDirection] = useState(false);
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
  const [lessonSummaryVisible, setLessonSummaryVisible] = useState(false);
  const [categoryPickerOpen, setCategoryPickerOpen] = useState(false);

  // Words
  const allWords = useMemo(() => {
    if (!lesson?.flashcards) return [];
    return Array.isArray(lesson.flashcards[0]?.words)
      ? lesson.flashcards.flatMap((c: any) => c.words)
      : lesson.flashcards;
  }, [lesson?.flashcards]);

const categories = useMemo(() => {
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
  const forceTimerResetOnNextInitRef = useRef<boolean>(false);

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
    const lessonKey = String(lesson?.id || lesson?.title || 'lesson');
    if (!categories.length) return `${lessonKey}::All`;
    if (!selectedCategories?.length) return `${lessonKey}::All`;
    return `${lessonKey}::${selectedCategories[0] ?? 'All'}`;
  }, [categories.length, lesson?.id, lesson?.title, selectedCategories]);
  const flashcardProgressLessonKey = useMemo(
    () => String(lesson?.id || lesson?.title || 'lesson'),
    [lesson?.id, lesson?.title]
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
  const activeCategoryLabel = selectedCategories.length ? selectedCategories[0] : 'All';

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
      const shuffledWords = [...filteredWords].sort(() => Math.random() - 0.5);
      setCurrentWordIndex(0);
      setIsFlipped(false);
      setIsFlashcardDeckShuffled(false);
      setShuffledFlashcards(shuffledWords);

      const preserve = !!timerMode && !forceTimerResetOnNextInitRef.current;
      initializeGameSet({ preserveTimer: preserve });
      setKnownFlashcardKeys(new Set());
      setReviewFlashcardKeys(new Set());
      setSeenBackFlashcardKeys(new Set());
      setFlashcardLessonPhase('initial');
      setLessonSummaryVisible(false);

      forceTimerResetOnNextInitRef.current = false;
    }
  }, [filteredWords]);

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

  useEffect(() => {
    const lessonKey = String(lesson?.id || lesson?.title || 'lesson');
    if (initializedLessonKeyRef.current === lessonKey) return;
    initializedLessonKeyRef.current = lessonKey;

    setMode('flashcards');
    requestAnimationFrame(() => {
      scrollViewRef.current?.scrollTo({ y: 0, animated: false });
    });
  }, [lesson?.id, lesson?.title]);

  useEffect(() => {
    if (!lessonModeEnabled || !flashcardsComplete || mode !== 'flashcards') return;

    setMode('matching');
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({
        y: Math.max(0, overviewHeightRef.current + STICKY_TOP_SNAP_OFFSET + MATCHING_VIEW_SNAP_EXTRA),
        animated: true,
      });
    }, 120);
  }, [flashcardsComplete, lessonModeEnabled, mode, MATCHING_VIEW_SNAP_EXTRA, STICKY_TOP_SNAP_OFFSET]);

  const scrollToGame = useCallback((targetMode: VocabularyMode = mode, animated = true) => {
    const snapExtra =
      targetMode === 'typing'
        ? TYPING_VIEW_SNAP_EXTRA
        : targetMode === 'flashcards'
          ? FLASHCARDS_VIEW_SNAP_EXTRA
          : MATCHING_VIEW_SNAP_EXTRA;
    const targetY = Math.max(0, overviewHeightRef.current + STICKY_TOP_SNAP_OFFSET + snapExtra);

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
  }, [FLASHCARDS_VIEW_SNAP_EXTRA, MATCHING_VIEW_SNAP_EXTRA, STICKY_TOP_SNAP_OFFSET, TYPING_VIEW_SNAP_EXTRA, mode]);

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
    setCurrentWordIndex(0);
    setIsFlipped(false);
    setIsFlashcardDeckShuffled(true);
    setShuffledFlashcards((prev) => [...prev].sort(() => Math.random() - 0.5));
  };

const goToNextWord = () => {
  setCurrentWordIndex((p) => {
    if (p >= shuffledFlashcards.length - 1) {
      return p; // STOP at last card
    }
    return p + 1;
  });

  setIsFlipped(false);
};

const goToPrevWord = () => {
  setCurrentWordIndex((p) => {
    if (p <= 0) {
      return p; // STOP at first card
    }
    return p - 1;
  });

  setIsFlipped(false);
};

  const restartFlashcardDeck = (wordsForDeck: Word[], phase: FlashcardLessonPhase) => {
    setShuffledFlashcards(shuffleWordList(wordsForDeck));
    setCurrentWordIndex(0);
    setIsFlipped(false);
    setIsFlashcardDeckShuffled(false);
    setFlashcardLessonPhase(phase);
  };

  const resetLessonModeProgress = (keepLessonMode = lessonModeEnabled) => {
    setKnownFlashcardKeys(new Set());
    setReviewFlashcardKeys(new Set());
    setSeenBackFlashcardKeys(new Set());
    setFlashcardLessonPhase('initial');
    setLessonSummaryVisible(false);
    setCompletionVisible(false);
    setShuffledFlashcards(shuffleWordList(filteredWords));
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
      triggerSuccessHaptic();
      void markPracticeActivityToday(`vocabulary:flashcard-learnt:${lesson.title}:${key}`);
    } else {
      triggerSelectionHaptic();
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

    const shouldScrollAfterKeyboardHides = mode === 'typing' && nextMode !== 'typing' && isTypingKeyboardOpen;
    pendingKeyboardHideScrollModeRef.current = shouldScrollAfterKeyboardHides ? nextMode : null;

    Keyboard.dismiss();
    scheduleSoftLayoutChange();
    setMode(nextMode);
    scrollToGame(nextMode);

    if (shouldScrollAfterKeyboardHides) {
      setTimeout(() => scrollToGame(nextMode, false), 360);
    }
  };

  const handleContinueToTyping = () => {
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
    setSelectedCategories((prev) => {
      if (cat === 'All') return [];
      if (prev.length === 1 && prev[0] === cat) return [];
      return [cat];
    });
    setCategoryPickerOpen(false);

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

  const renderModeButtons = (placement: 'overview' | 'sticky' = 'sticky') => (
    <View
      style={[
        styles.modeButtonsWrap,
        placement === 'overview' && styles.overviewModeButtonsWrap,
        isScaledWebLesson && { paddingHorizontal: scaleValue(16, webLessonScale) },
      ]}
    >
      <View style={[styles.modeHeaderRow, isScaledWebLesson && { maxWidth: scaleValue(520, webLessonScale), gap: scaleValue(8, webLessonScale) }]}>
        <View style={[styles.modeButtons, isScaledWebLesson && { maxWidth: scaleValue(460, webLessonScale) }]}>
          {[
            { key: 'flashcards' as const, label: 'Flashcards' },
            { key: 'matching' as const, label: 'Matching' },
            { key: 'typing' as const, label: 'Write' },
          ].map((item) => {
            const active = mode === item.key;

            return (
              <TouchableOpacity
                key={item.key}
                style={[
                  styles.modeButton,
                  isScaledWebLesson && {
                    marginHorizontal: scaleValue(8, webLessonScale),
                    paddingVertical: scaleValue(10, webLessonScale),
                  },
                  active && [
                    styles.activeMode,
                    { backgroundColor: colors.primary, borderColor: colors.borderStrong },
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
                <Text style={[styles.modeText, isScaledWebLesson && { fontSize: scaleValue(16, webLessonScale) }, active && styles.modeTextActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        {isSecondViewActive && (
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
                backgroundColor: colors.card,
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
    if (Platform.OS !== 'web') return;

    const y = event.nativeEvent.contentOffset?.y ?? 0;
    if (overviewHeightRef.current <= 0) return;

    const secondViewThreshold = Math.max(0, overviewHeightRef.current - stickyHeaderHeight - 2);
    const nextIsSecondViewActive = y >= secondViewThreshold;

    setIsSecondViewActive((current) => (
      current === nextIsSecondViewActive ? current : nextIsSecondViewActive
    ));
  }, [stickyHeaderHeight]);

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      onLayout={handleViewportLayout}
    >
      <ScrollView
        ref={scrollViewRef}
        style={[styles.container, { backgroundColor: colors.background }]}
        stickyHeaderIndices={[1]}
        contentContainerStyle={{
          paddingTop: layoutTopInset,
          paddingBottom: Math.max(insets.bottom, 4) + typingKeyboardInset,
        }}
        onScroll={handleLessonScroll}
        scrollEventThrottle={16}
        keyboardShouldPersistTaps="handled"
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
            style={Platform.OS === 'android' ? styles.androidTopBackButton : undefined}
            onPress={() => {
              if (backTarget) {
                navigation.getParent()?.navigate(backTarget);
                return;
              }

              navigation.goBack();
            }}
          />
          <View
            style={[
              styles.header,
              Platform.OS === 'web' ? styles.webHeader : undefined,
              { backgroundColor: colors.card },
            ]}
            onLayout={(event) => {
              setTitleBlockHeight(event.nativeEvent.layout.height);
            }}
          >
            <Text
              style={[
                styles.title,
                Platform.OS === 'web' ? styles.webTitle : undefined,
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
              Platform.OS === 'web'
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

        <View
          style={[
            styles.stickyHeader,
            Platform.OS === 'web' ? styles.webStickyHeader : undefined,
            { backgroundColor: colors.background, paddingTop: stickyHeaderTopPadding },
          ]}
          onLayout={(event) => {
            setStickyHeaderHeight(event.nativeEvent.layout.height);
          }}
        >
          {renderModeButtons()}
        </View>

        <View
          style={[
            styles.lessonBody,
            { minHeight: secondViewMinHeight, paddingTop: isCompactScreen ? 8 : 12 },
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

        <View style={[styles.categorySlot, { minHeight: CATEGORY_SLOT_HEIGHT, paddingTop: 0 }]}>
          {categories.length > 0 ? (
            <View style={[styles.categoryPickerWrap, { minHeight: CATEGORY_SLOT_HEIGHT }]}>
              <TouchableOpacity
                activeOpacity={0.82}
                onPress={() => {
                  Keyboard.dismiss();
                  setCategoryPickerOpen((current) => !current);
                }}
                accessibilityRole="button"
                accessibilityLabel="Choose vocabulary category"
                accessibilityState={{ expanded: categoryPickerOpen }}
                style={[
                  styles.categoryPickerButton,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Text style={[styles.categoryPickerText, { color: colors.text }]}>
                  Category: {activeCategoryLabel}
                </Text>
                <MaterialIcons
                  name={categoryPickerOpen ? 'expand-less' : 'expand-more'}
                  size={20}
                  color={colors.secondaryText}
                />
              </TouchableOpacity>

            </View>
          ) : (
            <View style={[styles.categorySpacer, { minHeight: CATEGORY_SLOT_HEIGHT }]} />
          )}
        </View>

        {/* CONTENT */}
        <View
          style={[
            styles.gameViewport,
            Platform.OS === 'web' && screenWidth >= 768 && styles.gameViewportDesktopWeb,
            Platform.OS === 'web' && {
              alignSelf: 'center',
              maxWidth: webLessonGameMaxWidth,
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
            <View style={[styles.gameSection, styles.flashcardsSection]}>
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
              onToggleDirection={() => {
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
              isCurrentWordKnown={!!shuffledFlashcards[currentWordIndex] && knownFlashcardKeys.has(vocabularyWordKey(shuffledFlashcards[currentWordIndex]))}
              knownCount={knownFlashcardKeys.size}
              currentWordReadyToMarkKnown={currentWordReadyToMarkKnown}
              layoutHeight={lessonViewportHeight}
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
                {
                  minHeight: matchingViewportMinHeight,
                  height: matchingViewportMinHeight,
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
                Platform.OS === 'web' && screenWidth >= 768 && {
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
              keyboardVisible={isTypingKeyboardOpen}
              layoutHeight={Platform.OS === 'web' && screenWidth >= 768 ? typingViewportMinHeight : lessonViewportHeight}
              onShuffle={handleShuffleTypingWords}
              onSessionComplete={handleLessonTypingComplete}
              suppressCompletionScreen={LESSON_MODE_ENABLED && lessonModeEnabled}
            />
            </View>
          )}
        </View>
        </View>
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
              <Text style={[styles.categorySheetTitle, { color: colors.text }]}>Select category</Text>
              <TouchableOpacity
                onPress={() => setCategoryPickerOpen(false)}
                style={styles.categorySheetDoneButton}
                accessibilityRole="button"
                accessibilityLabel="Close category picker"
              >
                <Text style={[styles.categorySheetDoneText, { color: colors.primary }]}>Done</Text>
              </TouchableOpacity>
            </View>

            {['All', ...categories].map((cat) => {
              const active =
                (cat === 'All' && selectedCategories.length === 0) ||
                selectedCategories.includes(cat);

              return (
                <TouchableOpacity
                  key={cat}
                  onPress={() => toggleCategory(cat)}
                  accessibilityRole="button"
                  accessibilityLabel={`Select ${cat} category`}
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
                    name={active ? 'check-circle' : 'radio-button-unchecked'}
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

            <Text style={[styles.lessonSummaryLevelText, { color: colors.text }]}>Level {typingGame.level}</Text>

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
    paddingBottom: 10,
  },
  webStickyHeader: {
    paddingBottom: 6,
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
  },
  modeButtonsWrap: {
    paddingHorizontal: 16,
  },
  overviewModeButtonsWrap: {
    marginTop: 8,
    marginBottom: 8,
  },
  modeHeaderRow: {
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  modeButtons: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 460,
    alignSelf: 'center',
    marginBottom: Platform.OS === 'web' ? 0 : 10,
  },
  imageShortcutButton: {
    width: 42,
    height: 42,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  modeButton: {
    flex: 1,
    paddingVertical: Platform.OS === 'web' ? 10 : 12,
    marginHorizontal: 8,
    borderRadius: 8,
    backgroundColor: '#fff',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ddd',
  },
  activeMode: {
    backgroundColor: '#1982d2ff',
    borderColor: '#105b94ff',
  },
  modeButtonLocked: {
    opacity: 0.45,
  },
  modeText: {
  color: '#000000ff',
  fontWeight: '600',
  fontSize: 16,
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
  categoryPickerButton: {
    minHeight: 34,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  categoryPickerText: {
    fontSize: 13,
    fontWeight: '600',
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
  gameViewport: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 0,
    justifyContent: 'flex-start',
  },
  gameViewportDesktopWeb: {
    paddingTop: 14,
  },
  gameSection: {
    marginTop: 2,
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
