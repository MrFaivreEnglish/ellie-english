import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Modal, Keyboard } from 'react-native';
import BackButton from '../shared/BackButton';
import ImageWithCredit from '../shared/ImageWithCredit';
import VocabularyFlashcard from './VocabularyFlashcard';
import VocabularyMatching from './VocabularyMatching';
import VocabularyCompletionModal from './VocabularyCompletionModal';
import LessonPracticeSheet from './LessonPracticeSheet';
import { useTheme } from '../settings/ThemeContext';
import { useVocabularyGame } from './useVocabularyGame';
import { getLessonImage, getLessonThumbnailSource, getMatchingSetCount, shuffleArray } from './vocabularyUtils';
import { Word } from '../../types/VocabularyTypes';
import { useTypingGame } from './useTypingGame';
import VocabularyTyping from './TypingView';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { useLessonSheetLayout, VocabularyMode } from './useLessonSheetLayout';
import { markPracticeActivityToday } from '../progress/xpStorage';
import { saveLastLesson } from '../progress/lastLessonStorage';
import { triggerSelectionHaptic, triggerSuccessHaptic } from '../shared/haptics';
import {
  getLearnedFlashcardKeys,
  recordLearnedFlashcardToday,
  saveLearnedFlashcardKeys,
} from './flashcardProgressStorage';
import { getSoftShadow } from '../shared/uiPrimitives';
import { FRESH_COLORS } from '../shared/freshDirection';
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

// Hand-converted from the design spec's oklch() source values (hue 90 near-neutral warm
// grays + the primary blue accent) — see features/shared/freshDirection.ts for the same
// convention applied to the app's shared palette. Kept local to this screen's new chrome.
const LESSON_CHROME_COLORS = {
  ink: '#1E1A10', // oklch(0.22 0.02 90)
  chipIdleText: '#3C382C', // oklch(0.34 0.02 90)
  accent: '#0D7DD4', // oklch(0.58 0.16 250)
};

const IMAGE_STAGE_INSETS = {
  desktop: { horizontal: 32, top: 6, bottom: 10 },
  mobile: { horizontal: 14, top: 4, bottom: 8 },
} as const;

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
  const initialRouteMode = route?.params?.initialMode == null
    ? null
    : resolveVocabularyMode(route.params.initialMode);
  const [sheetMode, setSheetMode] = useState<VocabularyMode | null>(null);
  const mode = sheetMode ?? 'flashcards';
  const [dockHeight, setDockHeight] = useState(0);
  const MODE_TITLE_LABELS: Record<VocabularyMode, string> = {
    flashcards: 'Flashcards',
    matching: 'Matching',
    typing: 'Writing',
  };
  const activeModeLabel = sheetMode ? MODE_TITLE_LABELS[sheetMode] : null;

  const { lesson, backLabel = 'Back to Vocabulary', backTarget } = route.params;
  const useRefillMatching = !!lesson?.useRefillMatching;

  const {
    useApkPreviewLayout,
    isAndroidLesson,
    isDesktopWebLesson,
    layoutTopInset,
  } = useLessonSheetLayout(isAndroidStatusBarEnabled);

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

  const initializedLessonKeyRef = useRef<string | null>(null);

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

  // Image stage sizing — the container is sized to the image's own fitted (contain)
  // box, not the full stage, so the border-radius/shadow hug the image itself
  // rather than an oversized, partly-transparent box.
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });
  const [imageAspectRatio, setImageAspectRatio] = useState<number | null>(null);
  const imageStageInsets = isDesktopWebLesson ? IMAGE_STAGE_INSETS.desktop : IMAGE_STAGE_INSETS.mobile;
  const imageStageContentSize = useMemo(() => ({
    width: Math.max(0, stageSize.width - imageStageInsets.horizontal * 2),
    height: Math.max(0, stageSize.height - imageStageInsets.top - imageStageInsets.bottom),
  }), [imageStageInsets, stageSize.height, stageSize.width]);

  useEffect(() => {
    setImageAspectRatio(null);
  }, [preferredImageUri]);

  const handleImageNaturalSize = useCallback((size: { width: number; height: number }) => {
    if (size.width > 0 && size.height > 0) setImageAspectRatio(size.width / size.height);
  }, []);

  const fittedImageSize = useMemo(() => {
    const { width: stageWidth, height: stageHeightPx } = imageStageContentSize;
    if (stageWidth <= 0 || stageHeightPx <= 0) return { width: undefined as number | undefined, height: undefined as number | undefined };
    if (!imageAspectRatio) return { width: stageWidth, height: stageHeightPx };

    const width = Math.min(stageWidth, stageHeightPx * imageAspectRatio);
    return { width, height: width / imageAspectRatio };
  }, [imageAspectRatio, imageStageContentSize]);

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

  const prevIsVocabTimerModeRef = useRef(isVocabTimerMode);

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

  // Respect an explicit initialMode request (e.g. a shortcut from Grammar) by
  // opening the sheet straight into that mode on first mount for this lesson.
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
    setSheetMode('flashcards');
  };

  const startLearnedReviewGame = () => {
    if (!filteredWords.length || learnedFlashcardCount < filteredWords.length) return;

    triggerSuccessHaptic();
    setCompletionVisible(false);
    resetGameState();
    initializeGameSet();
    setSheetMode('matching');
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

  const openOrSwitchSheet = useCallback((nextMode: VocabularyMode) => {
    setSheetMode((current) => {
      triggerSelectionHaptic();
      return nextMode === current ? null : nextMode;
    });
    Keyboard.dismiss();
  }, []);

  const closeSheet = useCallback(() => {
    setSheetMode(null);
  }, []);

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
        <Text style={[styles.audioMatchToggleText, { color: colors.text }]} numberOfLines={1}>
          Audio Mode
        </Text>
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
          isDesktopWebLesson && styles.categoryControlsRowDesktopWeb,
          isAndroidLesson && styles.categoryControlsRowAndroid,
        ]}
      >
        {categoryButton}
        {progressButton}
        {audioToggle}
      </View>
    );
  };

  // Measured (not formula-derived) height for whichever practice module is
  // active — the sheet's content area minus the category-controls row.
  const [sheetContentHeight, setSheetContentHeight] = useState(0);
  const [categoryControlsHeight, setCategoryControlsHeight] = useState(0);
  const SHEET_CONTENT_BOTTOM_GAP = 14;
  const practiceViewportHeight = Math.max(160, sheetContentHeight - categoryControlsHeight - SHEET_CONTENT_BOTTOM_GAP);

  const renderSheetBody = () => {
    if (!sheetMode) return null;

    return (
      <View
        style={styles.sheetBody}
        onLayout={(event) => setSheetContentHeight(event.nativeEvent.layout.height)}
      >
        <View onLayout={(event) => setCategoryControlsHeight(event.nativeEvent.layout.height)}>
          {renderCategoryControls()}
        </View>

        <View
          style={[
            styles.gameViewport,
            isDesktopWebLesson && styles.gameViewportDesktopWeb,
            sheetMode === 'typing' && isDesktopWebLesson && styles.gameViewportTypingDesktop,
            { minHeight: practiceViewportHeight },
          ]}
        >
          {filteredWords.length === 0 && (
            <View style={[styles.emptyLessonState, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <MaterialIcons name="book" size={32} color={colors.secondaryText} />
              <Text style={[styles.emptyLessonStateTitle, { color: colors.text }]}>No words yet</Text>
              <Text style={[styles.emptyLessonStateSubtitle, { color: colors.secondaryText }]}>
                This lesson doesn't have any words in the current selection.
              </Text>
            </View>
          )}

          {sheetMode === 'flashcards' && (
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
                layoutHeight={practiceViewportHeight}
                forceAndroidLayout={useApkPreviewLayout}
                colors={colors}
                isDarkMode={isDarkMode}
              />
            </View>
          )}

          {sheetMode === 'matching' && (
            <View style={[styles.gameSection, styles.matchingGameSection]}>
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
                keyboardVisible={false}
                layoutHeight={practiceViewportHeight}
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

  const renderPracticeDock = () => {
    const actions: {
      key: VocabularyMode;
      label: string;
      icon: React.ComponentProps<typeof MaterialIcons>['name'];
    }[] = [
      { key: 'flashcards', label: 'Cards', icon: 'view-agenda' },
      { key: 'matching', label: 'Match', icon: 'compare-arrows' },
      { key: 'typing', label: 'Write', icon: 'edit' },
    ];

    const dockAttached = sheetMode !== null;

    return (
      <View
        onLayout={(event) => setDockHeight(event.nativeEvent.layout.height)}
        style={[
          styles.dock,
          isDesktopWebLesson ? styles.dockDesktop : styles.dockMobile,
          dockAttached && styles.dockAttached,
          {
            backgroundColor: dockAttached ? colors.card : colors.background,
            borderTopColor: colors.border,
          },
        ]}
      >
        <View style={[styles.dockChipsRow, isDesktopWebLesson ? styles.dockChipsRowDesktop : styles.dockChipsRowMobile]}>
          {actions.map((action) => {
            const isActive = sheetMode === action.key;

            return (
              <TouchableOpacity
                key={action.key}
                activeOpacity={0.76}
                onPress={() => openOrSwitchSheet(action.key)}
                accessibilityRole="button"
                accessibilityLabel={isActive ? `Close ${action.label}` : `Open ${action.label}`}
                accessibilityState={{ selected: isActive }}
                style={[
                  styles.dockChip,
                  isDesktopWebLesson ? styles.dockChipDesktop : styles.dockChipMobile,
                  {
                    backgroundColor: isActive
                      ? (isDarkMode ? colors.primarySoft : LESSON_CHROME_COLORS.accent)
                      : (isDarkMode ? colors.surface : colors.card),
                    borderColor: isActive ? LESSON_CHROME_COLORS.accent : colors.border,
                  },
                ]}
              >
                <MaterialIcons
                  name={action.icon}
                  size={isDesktopWebLesson ? 18 : 17}
                  color={isActive ? '#FFFFFF' : (isDarkMode ? colors.primary : LESSON_CHROME_COLORS.accent)}
                />
                <Text
                  style={[
                    styles.dockChipText,
                    isDesktopWebLesson ? styles.dockChipTextDesktop : styles.dockChipTextMobile,
                    { color: isActive ? '#FFFFFF' : (isDarkMode ? colors.text : LESSON_CHROME_COLORS.chipIdleText) },
                  ]}
                  numberOfLines={1}
                >
                  {action.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background, paddingTop: layoutTopInset }]}>
      <View style={[styles.header, isDesktopWebLesson ? styles.headerDesktop : styles.headerMobile]}>
        <BackButton
          label={backLabel}
          onPress={handleBackPress}
          style={styles.headerBackButton}
          hideLabel
        />
        <View style={styles.headerTitleRow}>
          <Text
            style={[
              styles.headerTitle,
              isDesktopWebLesson ? styles.headerTitleDesktop : styles.headerTitleMobile,
              { color: isDarkMode ? colors.text : LESSON_CHROME_COLORS.ink },
              activeModeLabel ? styles.headerTitleShrunk : styles.headerTitleFlex,
            ]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {lesson.title}
          </Text>
          {activeModeLabel && (
            <>
              <MaterialIcons
                name="chevron-right"
                size={isDesktopWebLesson ? 20 : 18}
                color={isDarkMode ? colors.secondaryText : LESSON_CHROME_COLORS.chipIdleText}
              />
              <Text
                style={[
                  styles.headerTitle,
                  isDesktopWebLesson ? styles.headerTitleDesktop : styles.headerTitleMobile,
                  styles.headerModeLabel,
                  { color: isDarkMode ? colors.secondaryText : LESSON_CHROME_COLORS.chipIdleText },
                ]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {activeModeLabel}
              </Text>
            </>
          )}
        </View>
      </View>

      <View
        style={[
          styles.imageStage,
          {
            paddingHorizontal: imageStageInsets.horizontal,
            paddingTop: imageStageInsets.top,
            paddingBottom: imageStageInsets.bottom,
          },
        ]}
        onLayout={(event) => setStageSize({ width: event.nativeEvent.layout.width, height: event.nativeEvent.layout.height })}
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
                />
              </View>
            ))}
          </ScrollView>
        ) : (
          <ImageWithCredit
            source={preferredImageSource as any}
            onNaturalSize={handleImageNaturalSize}
            style={[
              {
                width: fittedImageSize.width,
                height: fittedImageSize.height,
                borderRadius: isDesktopWebLesson ? 12 : 10,
                boxShadow: isDesktopWebLesson
                  ? '0px 8px 26px rgba(0,0,0,0.11)'
                  : '0px 6px 20px rgba(0,0,0,0.11)',
                elevation: 6,
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

      {renderPracticeDock()}

      <LessonPracticeSheet
        visible={sheetMode !== null}
        mode={mode}
        isDarkMode={isDarkMode}
        colors={colors}
        onClose={closeSheet}
        onSwitchMode={openOrSwitchSheet}
        edgeToEdge
        bottomInset={dockHeight}
        showModeControl={false}
        lessonTitle={lesson.title}
        showTitleRow={false}
      >
        {renderSheetBody()}
      </LessonPracticeSheet>

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
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  headerDesktop: {
    padding: 16,
    paddingHorizontal: 32,
    paddingBottom: 8,
  },
  headerMobile: {
    padding: 8,
    paddingHorizontal: 16,
    paddingBottom: 6,
  },
  headerBackButton: {
    flexShrink: 0,
    marginTop: 0,
    marginLeft: 0,
    paddingVertical: 0,
    alignSelf: 'center',
  },
  headerTitleRow: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerTitle: {
    fontWeight: '800',
  },
  headerTitleFlex: {
    flex: 1,
    minWidth: 0,
  },
  headerTitleShrunk: {
    flexShrink: 1,
    flexGrow: 0,
  },
  headerModeLabel: {
    flexShrink: 2,
    minWidth: 0,
    fontWeight: '700',
  },
  headerTitleDesktop: {
    fontSize: 24,
  },
  headerTitleMobile: {
    fontSize: 21,
  },
  imageStage: {
    flex: 1,
    minHeight: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dock: {
    flexShrink: 0,
    zIndex: 2,
  },
  dockAttached: {
    borderTopWidth: 1,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    boxShadow: '0px -6px 14px rgba(0,0,0,0.08)',
  },
  dockDesktop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    paddingTop: 6,
    paddingBottom: 10,
    paddingHorizontal: 32,
  },
  dockMobile: {
    paddingHorizontal: 16,
    paddingTop: 5,
    paddingBottom: 8,
  },
  dockChipsRow: {
    flexDirection: 'row',
  },
  dockChipsRowDesktop: {
    gap: 10,
  },
  dockChipsRowMobile: {
    gap: 8,
  },
  dockChip: {
    minHeight: 44,
    borderRadius: 13,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  dockChipDesktop: {
    minWidth: 116,
    paddingHorizontal: 20,
  },
  dockChipMobile: {
    flex: 1,
    paddingHorizontal: 8,
  },
  dockChipText: {
    fontWeight: '700',
  },
  dockChipTextDesktop: {
    fontSize: 15,
  },
  dockChipTextMobile: {
    fontSize: 14,
  },
  sheetBody: {
    flex: 1,
    minHeight: 0,
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
    marginTop: 2,
    marginBottom: 6,
  },
  categoryControlsRowDesktopWeb: {
    paddingHorizontal: 12,
  },
  categoryControlsRowAndroid: {
    minHeight: 42,
    paddingHorizontal: 12,
    flexWrap: 'nowrap',
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
  gameViewportTypingDesktop: {
    justifyContent: 'center',
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
    paddingTop: 6,
  },
  matchingGameSection: {
    justifyContent: 'flex-start',
    paddingTop: 0,
  },
  typingGameSection: {
    justifyContent: 'flex-start',
    paddingTop: 0,
  },
  typingGameSectionMobile: {
    marginTop: 28,
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
