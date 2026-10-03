import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Platform, View, StyleSheet, TouchableOpacity, ScrollView, Modal, Keyboard } from 'react-native';
import ImageWithCredit from '../shared/ImageWithCredit';
import LessonHeaderRow from '../shared/LessonHeaderRow';
import VocabularyFlashcard from './VocabularyFlashcard';
import VocabularyMatching from './VocabularyMatching';
import VocabularyCompletionModal, { type SessionResultBanner } from './VocabularyCompletionModal';
import PracticeSheet from '../shared/PracticeSheet';
import { useTheme } from '../settings/ThemeContext';
import { useVocabularyGame } from './useVocabularyGame';
import { difficultyMap } from './VocabularyScreen';
import { getMatchingSetCount, getPairsPerSetForLayout, shuffleArray } from './vocabularyUtils';
import { Word } from '../../types/VocabularyTypes';
import { useTypingGame } from './useTypingGame';
import VocabularyTyping from './TypingView';
import { useFocusEffect } from '@react-navigation/native';
import Text from '../shared/ThemedText';
import MaterialIcons from '../shared/ThemedMaterialIcon';
import { useLessonSheetLayout, VocabularyMode } from './useLessonSheetLayout';
import { useVocabularyLessonContent, type MixedVocabularyImageCard } from './useVocabularyLessonContent';
import { useVocabularyFlashcards } from './useVocabularyFlashcards';
import { isModeUnlocked, unlockMode } from '../progress/modeUnlockStorage';
import { saveLastLesson } from '../progress/lastLessonStorage';
import { triggerSelectionHaptic } from '../shared/haptics';
import { getSoftShadow } from '../shared/uiPrimitives';
import { commitMeasuredSize, getWebLessonScale, isTabletWebViewport, scaleValue } from '../shared/responsiveLayout';
import { reservesSoftKeyboardSpace } from '../shared/softKeyboardLayout';
import PracticeDock from '../shared/PracticeDock';
import { markLessonHighlightSeen } from '../shared/lessonHighlights';
import VocabularyCategoryControls from './VocabularyCategoryControls';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { VocabularyStackParamList, RootStackParamList } from '../../types/navigationTypes';

const shuffleWordList = (words: Word[]) => shuffleArray(words);
const MAIN_TAB_TARGETS = ['Grammar', 'Vocabulary', 'Lessons', 'Settings'];
const ROOT_BACK_TARGETS = ['Home', 'MyWords'];
const vocabularyWordKey = (word: Word) => `${word.english.trim().toLowerCase()}|${word.french.trim().toLowerCase()}`;
const resolveVocabularyMode = (value: any): VocabularyMode =>
  value === 'matching' || value === 'typing' || value === 'flashcards' ? value : 'flashcards';

type Props = CompositeScreenProps<
  NativeStackScreenProps<VocabularyStackParamList, 'VocabularyLesson'>,
  NativeStackScreenProps<RootStackParamList>
>;

const fmtMs = (ms: number) => {
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
};


const fmtDelta = (ms: number) => {
  const seconds = Math.max(0, ms) / 1000;
  return seconds >= 10 ? `${Math.round(seconds)}s` : `${seconds.toFixed(1)}s`;
};

export default function VocabularyLessonScreen({ route, navigation }: Props) {
  const { isDarkMode, colors, isVocabTimerMode, isVocabTimerRecordSavingEnabled, isAndroidStatusBarEnabled, isVocabAudioMatchMode, toggleVocabAudioMatchMode } = useTheme();
  const initialRouteMode = route?.params?.initialMode == null
    ? null
    : resolveVocabularyMode(route.params.initialMode);
  const [sheetMode, setSheetMode] = useState<VocabularyMode | null>(null);



  // Keyboard modes wait for this before focusing their input.
  const [sheetEntered, setSheetEntered] = useState(false);
  const mode = sheetMode ?? 'flashcards';
  const MODE_TITLE_LABELS: Record<VocabularyMode, string> = {
    flashcards: 'Flashcards',
    matching: 'Matching',
    typing: 'Writing',
  };
  const activeModeLabel = sheetMode ? MODE_TITLE_LABELS[sheetMode] : null;

  const { lesson, backLabel = 'Back to Vocabulary', backTarget } = route.params;

  useEffect(() => {
    markLessonHighlightSeen('vocabulary', lesson);
  }, [lesson]);
  const useRefillMatching = !!lesson?.useRefillMatching;
  // Harder lessons keep more of their XP value on replay — see getReplayXpFraction.
  const lessonDifficulty = (lesson?.title && difficultyMap[lesson.title]) || null;

  const {
    useApkPreviewLayout,
    isAndroidLesson,
    isDesktopWebLesson,
    layoutTopInset,
    screenWidth,
    screenHeight,
  } = useLessonSheetLayout(isAndroidStatusBarEnabled);
  const webLessonScale = getWebLessonScale(screenWidth, screenHeight);







  // gameViewportOuter already reserves the side rail's own footprint via paddingRight
  // when the rail is shown, so this only needs a small general margin, not a second
  // rail-sized subtraction — the parent's own (rail-aware) width is the real limit.
  const desktopGameViewportMaxWidth = Math.min(
    Math.max(720, screenWidth - 80),
    1800
  );

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

    // Word reviews open from root screens. Popping back closes MainTabs, so the review
    // lesson doesn't linger in the Vocabulary tab for the next visit.
    if (ROOT_BACK_TARGETS.includes(backTarget) && typeof (navigation as any).popTo === 'function') {
      (navigation as any).popTo(backTarget);
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

  const initializedLessonKeyRef = useRef<string | null>(null);

  useEffect(() => {
    // A review session is rebuilt from whatever is due, so reopening it from "Continue"
    // would show a stale list.
    if (lesson?.isLearnedMix || lesson?.isWordReview) return;

    const lastLessonType = backTarget === 'Grammar' || lesson?.practiceType === 'vocabulary'
      ? 'grammar'
      : 'vocabulary';

    void saveLastLesson({
      type: lastLessonType,
      lessonId: lesson?.id != null ? String(lesson.id) : undefined,
      title: lesson.title,
    });
  }, [backTarget, lesson?.id, lesson?.isLearnedMix, lesson?.isWordReview, lesson?.practiceType, lesson.title]);


  const [timerMode, setTimerMode] = useState(isVocabTimerMode);
  const [isFirstCompletion, setIsFirstCompletion] = useState(false);



  const [timerModeJustUnlocked, setTimerModeJustUnlocked] = useState(false);
  const [timerModeAvailable, setTimerModeAvailable] = useState(false);
  const [isPersonalBest, setIsPersonalBest] = useState(false);
  const [completionVisible, setCompletionVisible] = useState(false);
  const [completionModalReady, setCompletionModalReady] = useState(false);
  // The auto-show effect below re-opens completionVisible whenever the set is complete and
  // it's currently false — which fights a manual dismissal (e.g. "Go to Account") unless we
  // separately remember the user already acknowledged this completion.
  const completionAcknowledgedRef = useRef(false);
  const [startedTimerMode, setStartedTimerMode] = useState(isVocabTimerMode);
  const [categoryPickerOpen, setCategoryPickerOpen] = useState(false);
  const [categoryPickerAnchor, setCategoryPickerAnchor] = useState({ x: 16, y: 0, width: 200, height: 40 });
  const categoryPickerButtonRef = useRef<View>(null);

  const forceTimerResetOnNextInitRef = useRef<boolean>(false);

  const {
    categories,
    selectedCategories,
    setSelectedCategories,
    allowMultiCategorySelection,
    categoryPickerLabel,
    categoryPickerAllLabel,
    mixedLessonImageCards,
    shouldShowMixedImageCarousel,
    preferredImageSource,
    preferredImageUri,
    setStageSize,
    imageStageInsets,
    imageStageContentSize,
    handleImageNaturalSize,
    fittedImageSize,
    filteredWords,
    activeCategoryKey,
    activeCategoryLabel,
    flashcardProgressLessonKey,
  } = useVocabularyLessonContent(
    lesson,
    lessonIdentity,
    isDesktopWebLesson,
    useCallback(() => setCategoryPickerOpen(false), [])
  );










  // Native runs full-screen with no browser chrome eating into the viewport, so even a
  // phone-sized APK has more usable space than the same phone's mobile web browser.
  const isRoomyForMatching = isDesktopWebLesson
    || isTabletWebViewport(screenWidth, screenHeight)
    || Platform.OS !== 'web';
  // Game state and board rendering must use the same set size.
  const matchingPairsPerSet = getPairsPerSetForLayout(isRoomyForMatching);


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
    commitPendingMatchingXp,
    previewPendingMatchingXp,
    matchingBonusXp,
  } = useVocabularyGame(
    filteredWords,
    timerMode,
    mode === 'matching',
    activeCategoryKey,
    isVocabTimerRecordSavingEnabled,
    useRefillMatching,
    matchingPairsPerSet,
    lessonDifficulty
  );

  // Stable cleanup refs prevent volatile game callbacks from resetting a live session.
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
      gameState.currentSet >= getMatchingSetCount(filteredWords.length, matchingPairsPerSet) - 1 &&
      gameState.matchedPairs.length === (matchingGamePairs?.english?.length || 0) * 2 &&
      matchingGamePairs?.english?.length > 0
    );
  }, [
    gameState.currentSet,
    gameState.matchedPairs.length,
    gameState.totalScore,
    matchingGamePairs?.english?.length,
    filteredWords.length,
    matchingPairsPerSet,
    useRefillMatching,
  ]);
  const onReviewAllLearned = useCallback(() => {
    completionAcknowledgedRef.current = false;
    setCompletionVisible(false);
    resetGameState();
    initializeGameSet();
    setSheetMode('matching');
  }, [initializeGameSet, resetGameState]);

  const {
    currentWordIndex,
    isFlipped,
    setIsFlipped,
    reverseDirection,
    setReverseDirection,
    shuffledFlashcards,
    isFlashcardDeckShuffled,
    learnedFlashcardKeysLoaded,
    knownFlashcardKeys,
    flashcardProgressModeEnabled,
    setFlashcardProgressModeEnabled,
    currentFlashcardLearned,
    learnedFlashcardCount,
    currentWordReadyToMarkKnown,
    handleFlashcardFlip,
    shuffleFlashcards,
    goToNextWord,
    goToPrevWord,
    reviewFlashcardWords,
    startLearnedReviewGame,
    handleToggleCurrentFlashcardLearned,
    handleMarkFlashcardKnown,
    handleMarkFlashcardForReview,
  } = useVocabularyFlashcards(
    filteredWords,
    lesson,
    flashcardProgressLessonKey,
    setSheetMode,
    setCompletionVisible,
    onReviewAllLearned
  );




  useEffect(() => {
    if (filteredWords.length > 0) {
      const preserve = !!timerMode && !forceTimerResetOnNextInitRef.current;
      initializeGameSet({ preserveTimer: preserve });
      forceTimerResetOnNextInitRef.current = false;
    }
  }, [filteredWords, lesson]);

  const hasCompletedBeforeRef = useRef(false);
  useEffect(() => {
    let active = true;
    setTimerModeAvailable(false);
    void isModeUnlocked('vocabTimer', lessonIdentity)
      .then((unlocked) => {
        if (active) setTimerModeAvailable(unlocked);
      })
      .catch(() => {});

    return () => { active = false; };
  }, [lessonIdentity]);

  useEffect(() => {
    if (mode !== 'matching' || !allSetsCompleted) return;
    if (!gameState.hasCompletedOnce) return;
    if (completionVisible) return;
    if (completionAcknowledgedRef.current) return;
    let active = true;

    // XP is banked when the student claims it on the end screen (onClaimXP below),
    // not here — closing the screen without claiming forfeits the session's XP. This only
    // resolves what that claim will be worth, so "You've earned N XP" shows the real figure
    // instead of the optimistic running total (which ignores the already-practised-today
    // discount, and so overstated it until the moment you claimed).
    setIsPersonalBest(!!gameState.lastCompletionWasPersonalBest);

    if (!hasCompletedBeforeRef.current) {
      setIsFirstCompletion(true);
      hasCompletedBeforeRef.current = true;
    } else {
      setIsFirstCompletion(false);
    }



    const wasPlayingAgainstTheClock = timerMode || startedTimerMode;
    const xpPreview = previewPendingMatchingXp();
    const modeUnlock = unlockMode('vocabTimer', lessonIdentity)
      .then((isNewUnlock) => {
        if (active) setTimerModeAvailable(true);
        // Always honor a genuine new-unlock signal, even from a run a later effect
        // invocation superseded (e.g. StrictMode's double-invoke) — otherwise the run that
        // actually saw isNewUnlock===true gets skipped by `active`, while the surviving run
        // sees isNewUnlock===false because the first run's storage write already landed.
        if (isNewUnlock && !wasPlayingAgainstTheClock) setTimerModeJustUnlocked(true);
      })
      .catch(() => {});

    void Promise.allSettled([xpPreview, modeUnlock]).then(() => {
        if (!active) return;
        setCompletionVisible(true);
        setCompletionModalReady(true);
      });
    return () => { active = false; };
  }, [
    allSetsCompleted,
    commitPendingMatchingXp,
    previewPendingMatchingXp,
    completionVisible,
    gameState.hasCompletedOnce,
    gameState.lastCompletionWasPersonalBest,
    lessonIdentity,
    mode,
    startedTimerMode,
    timerMode,
  ]);

  const matchingResultBanner: SessionResultBanner | null = useMemo(() => {
    if (timerMode && isPersonalBest) {
      const previousBest = gameState.lastCompletionPreviousBest ?? null;
      const beatenBy = previousBest != null && previousBest > gameState.timer
        ? previousBest - gameState.timer
        : null;

      return {
        kind: 'record',
        kicker: 'New record',
        emoji: '⏱️',
        label: 'New Best Time!',
        message: beatenBy != null
          ? `You beat your old best of ${fmtMs(previousBest as number)} by ${fmtDelta(beatenBy)}.`
          : 'First time on the board for this set.',
      };
    }

    if (timerModeJustUnlocked) {
      return {
        kind: 'unlock',
        emoji: '🏅',
        label: 'Timer Mode',
        message: 'Race the clock on this lesson for bonus XP.',
      };
    }

    return null;
  }, [
    gameState.lastCompletionPreviousBest,
    gameState.timer,
    isPersonalBest,
    timerMode,
    timerModeJustUnlocked,
  ]);



  useFocusEffect(
    React.useCallback(() => {
      if (mode === 'matching' && filteredWords.length > 0) {
        completionAcknowledgedRef.current = false;
        focusCleanupRef.current.resetGameState({ preserveTimer: false });
        initializeGameSet({ preserveTimer: false });
        setCompletionVisible(false);
        setTimerModeJustUnlocked(false);
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

  const prevIsVocabTimerModeRef = useRef(isVocabTimerMode);


  useEffect(() => {
    const wasTimerMode = prevIsVocabTimerModeRef.current;
    prevIsVocabTimerModeRef.current = isVocabTimerMode;

    setTimerMode(isVocabTimerMode);

    if (wasTimerMode === isVocabTimerMode) return;

    // Either direction is a new run. Switching the clock on used to keep the board as it
    // stood, so a set already solved in practice could be walked straight into a timed run
    // for a free personal best — reshuffle and drop the matched pairs and their pending XP.
    stopTimer();
    completionAcknowledgedRef.current = false;
    setCompletionVisible(false);
    setIsFirstCompletion(false);
    setIsPersonalBest(false);
    forceTimerResetOnNextInitRef.current = true;

    if (wasTimerMode && !isVocabTimerMode) setStartedTimerMode(false);

    if (mode === 'matching' && filteredWords.length > 0) {
      initializeGameSet({ preserveTimer: false });
    } else {
      resetGameState({ preserveTimer: false });
    }
  }, [isVocabTimerMode]);


  useEffect(() => {
    if (mode === 'matching' && filteredWords.length > 0) {
      completionAcknowledgedRef.current = false;
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
  const typingGame = useTypingGame(typingWords, {
    allowSlashAlternatives: allowTypingSlashAlternatives,
    lessonDifficulty,
    // A review session's own title isn't where the word came from; its words carry that.
    lessonTitle: lesson?.isWordReview ? undefined : lesson?.title,
  });
  useEffect(() => {
    if (mode === 'typing') {
      typingGame.reset?.();
    }
  }, [mode, typingShuffleSeed]);



  useEffect(() => {
    const lessonKey = `${lessonIdentity}::${initialRouteMode ?? 'overview'}`;
    if (initializedLessonKeyRef.current === lessonKey) return;
    initializedLessonKeyRef.current = lessonKey;

    setSheetMode(initialRouteMode);
  }, [initialRouteMode, lessonIdentity]);

  const handleShuffleTypingWords = () => {
    if (!filteredWords.length) return;

    setTypingShuffleSeed((prev) => prev + 1);
  };

  const openOrSwitchSheet = useCallback((nextMode: VocabularyMode) => {
    setSheetMode((current) => {
      triggerSelectionHaptic();




      // Mode switches keep the mounted sheet; only a fresh entrance resets readiness.
      if (current === null) setSheetEntered(false);
      return nextMode === current ? null : nextMode;
    });
    Keyboard.dismiss();
  }, []);




  const closeActiveMode = useCallback(() => {
    triggerSelectionHaptic();
    setSheetMode(null);
    setSheetEntered(false);
    Keyboard.dismiss();
  }, []);

  const handleLessonTypingComplete = () => {};

  const handleGoToAccount = useCallback(() => {
    completionAcknowledgedRef.current = true;
    setCompletionVisible(false);
    // Close the practice sheet too. Leaving it open meant coming back from Account landed
    // on a screen still mid-exercise: the sheet scales and dims the lesson behind it, so
    // the lesson appeared shrunken inside itself, and back went to the sheet rather than out.
    setSheetMode(null);
    setSheetEntered(false);
    Keyboard.dismiss();
    const rootNav = navigation.getParent?.()?.getParent?.();
    (rootNav?.navigate as any)?.('Account', { openAvatarPicker: true });
  }, [navigation]);

  const handleReplay = (activateTimerMode = false) => {
    triggerSelectionHaptic();
    Keyboard.dismiss();
    // Session-only: tapping "Try Timer Mode!" starts this round in timer mode without
    // touching the persistent Settings default, which should only change from Settings itself.
    setTimerMode(!!activateTimerMode);
    hasCompletedBeforeRef.current = true;

    if (activateTimerMode) setStartedTimerMode(true);

    completionAcknowledgedRef.current = false;
    resetGameState();
    setIsFirstCompletion(false);
    setIsPersonalBest(false);
    setTimerModeJustUnlocked(false);
    initializeGameSet();

    setSheetMode('matching');
    setCompletionVisible(false);
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




  const showControlsSideRail = isDesktopWebLesson;



  const handleToggleFlashcardDirection = () => {
    triggerSelectionHaptic();
    setReverseDirection((p) => !p);
    setIsFlipped(false);
  };
  const flashcardEnglishLabel = lesson?.flashcardLabels?.english ?? 'English';
  const flashcardFrenchLabel = lesson?.flashcardLabels?.french ?? 'French';
  const flashcardDirectionLabel = reverseDirection
    ? `${flashcardFrenchLabel} → ${flashcardEnglishLabel}`
    : `${flashcardEnglishLabel} → ${flashcardFrenchLabel}`;

  const renderCategoryControls = (railMode: boolean = false) => (
    <VocabularyCategoryControls
      railMode={railMode}
      railScale={webLessonScale}
      mode={mode}
      sheetMode={sheetMode}
      categories={categories}
      selectedCategories={selectedCategories}
      activeCategoryLabel={activeCategoryLabel}
      categoryPickerLabel={categoryPickerLabel}
      categoryPickerOpen={categoryPickerOpen}
      setCategoryPickerOpen={setCategoryPickerOpen}
      setCategoryPickerAnchor={setCategoryPickerAnchor}
      categoryPickerButtonRef={categoryPickerButtonRef}
      flashcardProgressModeEnabled={flashcardProgressModeEnabled}
      setFlashcardProgressModeEnabled={setFlashcardProgressModeEnabled}
      learnedFlashcardKeysLoaded={learnedFlashcardKeysLoaded}
      learnedFlashcardCount={learnedFlashcardCount}
      filteredWordsCount={filteredWords.length}
      isVocabAudioMatchMode={isVocabAudioMatchMode}
      toggleVocabAudioMatchMode={toggleVocabAudioMatchMode}
      stopTimer={stopTimer}
      resetGameState={resetGameState}
      initializeGameSet={initializeGameSet}
      isAndroidLesson={isAndroidLesson}
      isDesktopWebLesson={isDesktopWebLesson}
      isDarkMode={isDarkMode}
      colors={colors}
      isFlashcardShuffled={isFlashcardDeckShuffled}
      onShuffleFlashcards={shuffleFlashcards}
      flashcardDirectionLabel={flashcardDirectionLabel}
      onToggleFlashcardDirection={handleToggleFlashcardDirection}
    />
  );



  const [exerciseStageHeight, setExerciseStageHeight] = useState(0);
  const [categoryControlsHeight, setCategoryControlsHeight] = useState(0);
  const EXERCISE_CONTENT_BOTTOM_GAP = 14;
  const practiceViewportHeight = Math.max(160, exerciseStageHeight - categoryControlsHeight - EXERCISE_CONTENT_BOTTOM_GAP);







  const reservesKeyboardSpace = reservesSoftKeyboardSpace(screenWidth);

  const renderExerciseContent = () => {
    if (!sheetMode) return null;

    return (
      <View
        style={styles.sheetBody}
        onLayout={(event) => setExerciseStageHeight(commitMeasuredSize(event.nativeEvent.layout.height))}
      >
        <View onLayout={(event) => setCategoryControlsHeight(commitMeasuredSize(event.nativeEvent.layout.height))}>
          {!showControlsSideRail && renderCategoryControls()}
        </View>

        <View
          style={[
            styles.gameViewportOuter,
            showControlsSideRail && styles.gameViewportOuterWithRail,
            // Reserve the rail's own footprint so centering the card accounts for it —
            // otherwise the card centers on the full width and the rail's visual weight
            // on the right leaves the whole composition looking lopsided.
            showControlsSideRail && { paddingRight: Math.round(204 * webLessonScale) },
          ]}
        >
        <View
          style={[
            styles.gameViewport,
            isDesktopWebLesson && styles.gameViewportDesktopWeb,
            isDesktopWebLesson && {
              maxWidth: desktopGameViewportMaxWidth,
              paddingHorizontal: scaleValue(16, webLessonScale),
              paddingBottom: scaleValue(14, webLessonScale),
            },




            sheetMode === 'typing' && styles.gameViewportTypingCenter,
            sheetMode === 'flashcards' && styles.gameViewportFlashcardsCenter,






          ]}
        >
          {filteredWords.length === 0 && (
            <View style={[styles.emptyLessonState, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <MaterialIcons name="book" size={Math.round(32 * webLessonScale)} color={colors.secondaryText} />
              <Text style={[styles.emptyLessonStateTitle, { color: colors.text }]}>No words yet</Text>
              <Text style={[styles.emptyLessonStateSubtitle, { color: colors.secondaryText }]}>
                This lesson doesn't have any words in the current selection.
              </Text>
            </View>
          )}

          {sheetMode === 'flashcards' && (
            <View style={[styles.gameSection, styles.flashcardsSection, isDesktopWebLesson && styles.flashcardsSectionDesktopTopGap]}>
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
                onToggleDirection={handleToggleFlashcardDirection}
                onMarkKnown={handleMarkFlashcardKnown}
                onMarkReview={handleMarkFlashcardForReview}
                onToggleLearned={handleToggleCurrentFlashcardLearned}
                isCurrentWordLearned={currentFlashcardLearned}
                learnedCount={learnedFlashcardCount}
                totalWordCount={filteredWords.length}
                isCurrentWordKnown={!!shuffledFlashcards[currentWordIndex] && knownFlashcardKeys.has(vocabularyWordKey(shuffledFlashcards[currentWordIndex]))}
                knownCount={knownFlashcardKeys.size}
                currentWordReadyToMarkKnown={currentWordReadyToMarkKnown}
                layoutHeight={practiceViewportHeight}
                forceAndroidLayout={useApkPreviewLayout}
                isDesktopWeb={isDesktopWebLesson}
                colors={colors}
                isDarkMode={isDarkMode}
              />
            </View>
          )}

          {sheetMode === 'matching' && (
            <View style={[styles.gameSection, styles.matchingGameSection, !isDesktopWebLesson && styles.matchingGameSectionMobile]}>
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
                availableHeight={practiceViewportHeight}
                forceAndroidLayout={useApkPreviewLayout}
                isDesktopWeb={isDesktopWebLesson}
                audioMode={isVocabAudioMatchMode}
                pairsPerSet={matchingPairsPerSet}
                reverseColumns={!!lesson?.initialReverseDirection}
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



                  timerModeUnlocked={
                    timerModeJustUnlocked
                  }
                  timerModeAvailable={timerModeAvailable}
                  banner={matchingResultBanner}
                  isPersonalBest={isPersonalBest}
                  colors={colors}
                  startedTimerMode={startedTimerMode}
                  bestTimeForActiveCategory={bestTimeForActiveCategory}
                  matchingSessionXp={matchingSessionXp}
                  bonusXp={matchingBonusXp}
                  onClaimXP={commitPendingMatchingXp}
                  statsItems={timerMode ? [
                    { emoji: '⏱', value: fmtMs(gameState.timer), label: 'Time' },
                    { emoji: '🏆', value: bestTimeForActiveCategory != null ? fmtMs(bestTimeForActiveCategory) : '--:--', label: 'Best' },
                    { emoji: '🧩', value: `${gameState.totalScore}/${filteredWords.length}`, label: 'Matched' },
                    { emoji: '✨', value: matchingSessionXp, label: 'XP' },
                    ...(matchingBonusXp > 0 ? [{ emoji: '⭐', value: `+${matchingBonusXp}`, label: 'Perfect bonus' }] : []),
                  ] : [
                    { emoji: '🧩', value: `${gameState.totalScore}/${filteredWords.length}`, label: 'Matched' },
                    { emoji: '✨', value: matchingSessionXp, label: 'XP Earned' },
                    ...(matchingBonusXp > 0 ? [{ emoji: '⭐', value: `+${matchingBonusXp}`, label: 'Perfect bonus' }] : []),
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

          {sheetMode === 'typing' && (
            <View style={[styles.gameSection, styles.typingGameSection, !isDesktopWebLesson && styles.typingGameSectionMobile]}>
              <VocabularyTyping
                words={typingWords}
                typingGame={typingGame}
                colors={colors}
                isDarkMode={isDarkMode}
                allowSlashAlternatives={allowTypingSlashAlternatives}
                promptLabel={lesson?.typingPromptLabel}
                answerPlaceholder={lesson?.typingAnswerPlaceholder}
                keyboardVisible={reservesKeyboardSpace}
                practiceSheetReady={sheetEntered}
                layoutHeight={practiceViewportHeight}
                forceAndroidLayout={useApkPreviewLayout}
                isDesktopWeb={isDesktopWebLesson}
                onShuffle={handleShuffleTypingWords}
                onSessionComplete={handleLessonTypingComplete}
                onGoToAccount={handleGoToAccount}
                onBack={handleBackPress}
              />
            </View>
          )}

        </View>

        {showControlsSideRail && (
          <View
            style={[
              styles.controlsSideRail,




              {
                right: Math.round(40 * webLessonScale),
                width: Math.round(164 * webLessonScale),
                transform: [{ translateY: '-50%' }],
              },
            ]}
          >
            {renderCategoryControls(true)}
          </View>
        )}
        </View>
      </View>
    );
  };

  const renderPracticeDock = () => {
    const actions: { key: VocabularyMode; label: string; icon: React.ComponentProps<typeof MaterialIcons>['name'] }[] = [
      { key: 'flashcards', label: 'Cards', icon: 'style' },
      { key: 'matching', label: 'Match', icon: 'compare-arrows' },
      { key: 'typing', label: 'Write', icon: 'edit' },
    ];

    return (
      <PracticeDock
        modes={actions}
        activeKey={sheetMode}
        onSelect={openOrSwitchSheet}
        isDesktopWeb={isDesktopWebLesson}
        isDarkMode={isDarkMode}
        colors={colors}





        // Matches Grammar's dock (which uses the default full width and a 460 cap) so the
        // mode buttons are the same size in both, spanning the phone's width.
        desktopMaxWidth={460}
        showActiveCollapseIcon={false}
      />
    );
  };

  return (
    <>
    <View style={[styles.screen, { backgroundColor: colors.background, paddingTop: layoutTopInset }]}>
      <View style={styles.lessonSheetHost}>
      <PracticeSheet
        open={sheetMode !== null}
        onClose={closeActiveMode}
        onEntered={() => setSheetEntered(true)}
        isDarkMode={isDarkMode}
        isDesktopWeb={isDesktopWebLesson}
        colors={colors}
        baseLayer={
          <>
          <LessonHeaderRow
            isDesktopWeb={isDesktopWebLesson}
            isDarkMode={isDarkMode}
            colors={colors}
            onBack={handleBackPress}
            backLabel={backLabel}
            title={lesson.title}
            activeModeLabel={activeModeLabel}
          />
          <View
            style={styles.contentArea}
            onLayout={(event) => setStageSize({ width: event.nativeEvent.layout.width, height: event.nativeEvent.layout.height })}
          >
              <View
                style={[
                  styles.contentLayer,
                  styles.imageStageContent,
                  {
                    paddingHorizontal: imageStageInsets.horizontal,
                    paddingTop: imageStageInsets.top,
                    paddingBottom: imageStageInsets.bottom,
                  },
                ]}
              >
                {shouldShowMixedImageCarousel ? (
                  <ScrollView
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    snapToInterval={imageStageContentSize.width}
                    decelerationRate="fast"
                    directionalLockEnabled
                    disableIntervalMomentum
                    nestedScrollEnabled
                    style={{ width: imageStageContentSize.width, height: imageStageContentSize.height }}
                  >
                    {mixedLessonImageCards.map((imageCard: MixedVocabularyImageCard, imageIndex: number) => (
                      <View
                        key={`${imageCard.id}-${imageIndex}`}
                        style={{ width: imageStageContentSize.width, height: imageStageContentSize.height, alignItems: 'center', justifyContent: 'center' }}
                      >
                        <ImageWithCredit
                          source={{ uri: imageCard.imageUrl }}
                          style={[{ width: imageStageContentSize.width, height: imageStageContentSize.height, borderRadius: isDesktopWebLesson ? 12 : 10 }]}
                          accessibilityLabel={imageCard.title ? `${imageCard.title} lesson image` : 'Lesson image'}
                          onPress={() =>
                            navigation.navigate('FullImageModal', {
                              source: { uri: imageCard.imageUrl },
                              uri: imageCard.imageUrl,
                            })
                          }
                        />
                      </View>
                    ))}
                  </ScrollView>
                ) : (
                  <ImageWithCredit
                    key={`${lessonIdentity}:${preferredImageUri}`}
                    source={preferredImageSource as any}
                    onNaturalSize={handleImageNaturalSize}
                    style={[
                      {
                        width: fittedImageSize.width,
                        height: fittedImageSize.height,
                        borderRadius: isDesktopWebLesson ? 12 : 10,
                      },
                    ]}
                    onPress={() =>
                      navigation.navigate('FullImageModal', {
                        source: preferredImageSource,
                        uri: preferredImageUri,
                      })
                    }
                  />
                )}
              </View>
          </View>
          </>
        }
      >
        {renderExerciseContent()}
      </PracticeSheet>
      </View>

      {renderPracticeDock()}
    </View>

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
              getSoftShadow(isDarkMode, 'strong', colors.shadow, colors.visualStyle === 'pixel'),
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                top: categoryPickerAnchor.y + categoryPickerAnchor.height + 8,





                left: Math.min(Math.max(16, categoryPickerAnchor.x), screenWidth - 240 - 16),
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
                      size={Math.round(20 * webLessonScale)}
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
    </>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  lessonSheetHost: {
    flex: 1,
    minHeight: 0,
    position: 'relative',



    overflow: 'hidden',
  },
  contentArea: {
    flex: 1,
    minHeight: 0,
    position: 'relative',
  },
  contentLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  imageStageContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetBody: {
    flex: 1,
    minHeight: 0,
  },
  gameViewport: {
    flex: 1,
    minHeight: 0,
    paddingHorizontal: 16,
    paddingBottom: 14,
    justifyContent: 'flex-start',
  },
  gameViewportDesktopWeb: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: 720,
  },







  gameViewportOuter: {
    flex: 1,
    minHeight: 0,
  },
  gameViewportOuterWithRail: {
    position: 'relative',
  },
  gameViewportTypingCenter: {
    justifyContent: 'flex-start',
    paddingTop: 2,
  },
  gameViewportFlashcardsCenter: {
    justifyContent: 'center',
  },



  controlsSideRail: {
    position: 'absolute',
    // Centered alongside the card instead of pinned near the top — it used to float in
    // isolation above/beside the (vertically centered) card, unbalancing the whole layout.
    top: '50%',
    right: 40,
    width: 164,
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
  gameSection: {
    marginTop: 2,
  },
  flashcardsSection: {
    justifyContent: 'flex-start',
    paddingTop: 0,
  },
  flashcardsSectionDesktopTopGap: {
    paddingTop: 64,
  },
  matchingGameSection: {
    justifyContent: 'flex-start',
    paddingTop: -3,
  },
  matchingGameSectionMobile: {
    marginTop: 10,
  },
  typingGameSection: {
    justifyContent: 'flex-start',
    paddingTop: 0,
    // Fills the viewport so Write's tap-to-dismiss area reaches all the way down to the
    // keyboard. Without this the section only sized to its content and the gap below it
    // belonged to the parent, where taps hit nothing.
    flex: 1,
  },



  typingGameSectionMobile: {
    marginTop: 0,
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
