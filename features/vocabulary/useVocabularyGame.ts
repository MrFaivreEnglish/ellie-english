import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { createAudioPlayer } from 'expo-audio';
import type { AudioPlayer } from 'expo-audio';
import { Word, GameCard, MatchingGamePairs, GameState } from '../../types/VocabularyTypes';
import { PAIRS_PER_SET, getMatchingSetCount, getMatchingSetWords, shuffleArray } from './vocabularyUtils';
import { getVocabularyTimerBests, saveVocabularyTimerBest } from './vocabularyTimerStorage';
import { SOUND_EFFECT_OPTIONS, SUCCESS_SOUND, replaySoundEffect } from '../shared/soundEffects';
import { awardActivityXPOnceToday } from '../progress/xpStorage';
import { XP_REWARDS } from '../progress/xpRewards';
import { triggerSelectionHaptic, triggerSuccessHaptic, triggerWarningHaptic } from '../shared/haptics';

const buildMatchingPracticeActivityKey = (
  categoryKey: string,
  first: GameCard,
  second: GameCard,
  isTimerMode: boolean
) => {
  const englishText = first.type === 'english' ? first.text : second.text;
  const frenchText = first.type === 'french' ? first.text : second.text;

  return `vocabulary:matching:${isTimerMode ? 'timer' : 'practice'}:${categoryKey}:${englishText}:${frenchText}`;
};

const buildMatchingTimerBestActivityKey = (categoryKey: string, elapsedMs: number) =>
  `vocabulary:matching-timer-best:${categoryKey}:${Math.floor(elapsedMs)}`;

const getMatchingPairXP = (isTimerMode: boolean, hadMistake: boolean) => {
  if (isTimerMode) {
    return hadMistake
      ? XP_REWARDS.vocabularyMatchingTimerRetryPair
      : XP_REWARDS.vocabularyMatchingTimerCleanPair;
  }

  return hadMistake
    ? XP_REWARDS.vocabularyMatchingRetryPair
    : XP_REWARDS.vocabularyMatchingCleanPair;
};

const REFILL_MATCH_DELAY_MS = 150;
const WRONG_MATCH_FEEDBACK_MS = 650;
const NEXT_SET_DELAY_MS = 420;

const buildMatchingCards = (word: Word, pairId: number) => ({
  english: {
    id: `english-${pairId}`,
    text: word.english,
    type: 'english' as const,
    pairId,
  },
  french: {
    id: `french-${pairId}`,
    text: word.french,
    type: 'french' as const,
    pairId,
  },
});

const buildMatchingPairs = (
  words: Word[],
  getPairId: (index: number) => number
): MatchingGamePairs => {
  const englishCards: GameCard[] = [];
  const frenchCards: GameCard[] = [];

  words.forEach((word, index) => {
    const cards = buildMatchingCards(word, getPairId(index));
    englishCards.push(cards.english);
    frenchCards.push(cards.french);
  });

  return {
    english: shuffleArray(englishCards),
    french: shuffleArray(frenchCards),
  };
};

const insertCardAt = (cards: GameCard[], card: GameCard, index: number) => {
  const nextCards = [...cards];
  const insertionIndex = index >= 0 ? Math.min(index, nextCards.length) : nextCards.length;
  nextCards.splice(insertionIndex, 0, card);
  return nextCards;
};

export const useVocabularyGame = (
  words: Word[],
  timerMode: boolean,
  isActive: boolean,
  categoryKey: string = 'default',
  saveTimerRecords: boolean = false,
  refillOnMatch: boolean = false
) => {
  const setCompletePlayerRef = useRef<AudioPlayer | null>(null);

  useEffect(() => {
    return () => {
      setCompletePlayerRef.current?.remove();
      setCompletePlayerRef.current = null;
    };
  }, []);

  // ---------------- STATE ----------------
  const [gameState, setGameState] = useState<GameState>({
    currentSet: 0,
    matchedPairs: [],
    selectedCard: null,
    totalScore: 0,
    timer: 0,
    bestTimeByCategory: {},
    hasCompletedOnce: false,
    consecutiveCorrect: 0,
    incorrectPair: null,
    hasAdvancedSet: false,
    isInputLocked: false,
    lastCompletionWasPersonalBest: false,
  });
  const gameStateRef = useRef(gameState);

  const [matchingGamePairs, setMatchingGamePairs] = useState<MatchingGamePairs>({
    english: [],
    french: [],
  });
  const matchingGamePairsRef = useRef<MatchingGamePairs>({
    english: [],
    french: [],
  });

  const [sessionWords, setSessionWords] = useState<Word[]>([]);
  const sessionWordsRef = useRef<Word[]>([]);
  const [matchingReviewWords, setMatchingReviewWords] = useState<Word[]>([]);
  const [matchingSessionXp, setMatchingSessionXp] = useState(0);
  const [lastMatchingXpGain, setLastMatchingXpGain] = useState(0);

  // ---------------- REFS ----------------
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerStartedAtRef = useRef<number | null>(null);
  const timerValueRef = useRef(0);

  // prevents duplicate completion writes
  const completionLockedRef = useRef(false);
  const setAdvanceLockedRef = useRef(false);
  const recordedMatchingActivityKeysRef = useRef<Set<string>>(new Set());
  const mistakenMatchingActivityKeysRef = useRef<Set<string>>(new Set());
  const matchingXpTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const refillTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nextRefillWordIndexRef = useRef(0);

  // ---------------- TIMER ----------------
  const startTimer = useCallback(() => {
    if (timerRef.current) return;

    timerStartedAtRef.current = Date.now() - timerValueRef.current;
    timerRef.current = setInterval(() => {
      const startedAt = timerStartedAtRef.current ?? Date.now();
      setGameState(prev => ({ ...prev, timer: Math.max(1, Date.now() - startedAt) }));
    }, 50);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current as unknown as number);
      timerRef.current = null;
    }
    timerStartedAtRef.current = null;
  }, []);

  const playSetCompleteSound = useCallback(() => {
    if (!setCompletePlayerRef.current) {
      setCompletePlayerRef.current = createAudioPlayer(SUCCESS_SOUND, SOUND_EFFECT_OPTIONS);
    }
    replaySoundEffect(setCompletePlayerRef.current);
  }, []);

  const key = categoryKey || "All";

  const matchingCardsById = useMemo(() => {
    const cards = [...matchingGamePairs.english, ...matchingGamePairs.french];
    return new Map(cards.map((card) => [card.id, card]));
  }, [matchingGamePairs]);

  const addMatchingReviewWord = useCallback((pairId: number) => {
    const cards = [...matchingGamePairs.english, ...matchingGamePairs.french]
      .filter((card) => card.pairId === pairId);
    const english = cards.find((card) => card.type === 'english')?.text;
    const french = cards.find((card) => card.type === 'french')?.text;

    if (!english || !french) return;

    setMatchingReviewWords((previous) => {
      if (previous.some((word) => word.english === english && word.french === french)) {
        return previous;
      }

      return [...previous, { english, french }];
    });
  }, [matchingGamePairs]);

  const getMatchingActivityKeyForPairId = useCallback((pairId: number) => {
    const cards = [...matchingGamePairs.english, ...matchingGamePairs.french]
      .filter((card) => card.pairId === pairId);
    const englishCard = cards.find((card) => card.type === 'english');
    const frenchCard = cards.find((card) => card.type === 'french');

    if (!englishCard || !frenchCard) return null;

    return buildMatchingPracticeActivityKey(key, englishCard, frenchCard, timerMode);
  }, [key, matchingGamePairs, timerMode]);

  const markMatchingPairMistake = useCallback((pairId: number) => {
    const activityKey = getMatchingActivityKeyForPairId(pairId);
    if (!activityKey) return;

    mistakenMatchingActivityKeysRef.current.add(activityKey);
  }, [getMatchingActivityKeyForPairId]);

  const awardMatchingXP = useCallback((activityKey: string, amount: number) => {
    void awardActivityXPOnceToday(activityKey, amount).then((xpGain) => {
      if (xpGain <= 0) return;

      setMatchingSessionXp(current => current + xpGain);
      setLastMatchingXpGain(xpGain);

      if (matchingXpTimeoutRef.current) {
        clearTimeout(matchingXpTimeoutRef.current);
      }

      matchingXpTimeoutRef.current = setTimeout(() => {
        setLastMatchingXpGain(0);
        matchingXpTimeoutRef.current = null;
      }, 1400);
    });
  }, []);

  useEffect(() => {
    gameStateRef.current = gameState;
    timerValueRef.current = gameState.timer;
  }, [gameState]);

  useEffect(() => {
    matchingGamePairsRef.current = matchingGamePairs;
  }, [matchingGamePairs]);

  useEffect(() => {
    let active = true;

    if (!saveTimerRecords) return;

    getVocabularyTimerBests().then((bests) => {
      if (!active) return;

      setGameState(prev => ({
        ...prev,
        bestTimeByCategory: {
          ...prev.bestTimeByCategory,
          ...bests,
        },
      }));
    }).catch(() => {});

    return () => {
      active = false;
    };
  }, [saveTimerRecords]);

  // ---------------- RESET ----------------
  const resetGameState = useCallback((options?: { preserveTimer?: boolean }) => {
    completionLockedRef.current = false;
    setAdvanceLockedRef.current = false;
    if (refillTimeoutRef.current) {
      clearTimeout(refillTimeoutRef.current);
      refillTimeoutRef.current = null;
    }
    nextRefillWordIndexRef.current = 0;
    recordedMatchingActivityKeysRef.current = new Set();
    mistakenMatchingActivityKeysRef.current = new Set();
    if (matchingXpTimeoutRef.current) {
      clearTimeout(matchingXpTimeoutRef.current);
      matchingXpTimeoutRef.current = null;
    }
    setMatchingSessionXp(0);
    setLastMatchingXpGain(0);
    setMatchingReviewWords([]);
    timerValueRef.current = options?.preserveTimer ? timerValueRef.current : 0;
    if (!options?.preserveTimer) {
      timerStartedAtRef.current = null;
    }

    setGameState(prev => ({
      currentSet: 0,
      matchedPairs: [],
      selectedCard: null,
      totalScore: 0,
      timer: options?.preserveTimer ? prev.timer : 0,
      bestTimeByCategory: { ...prev.bestTimeByCategory },
      hasCompletedOnce: false,
      consecutiveCorrect: 0,
      incorrectPair: null,
      hasAdvancedSet: false,
      isInputLocked: false,
      lastCompletionWasPersonalBest: false,
    }));
  }, []);

  // ---------------- INIT ----------------
  const initializeGameSet = useCallback((options?: { preserveTimer?: boolean }) => {
    if (!words.length) return;

    if (!options?.preserveTimer) {
      stopTimer();
      timerValueRef.current = 0;
      timerStartedAtRef.current = null;
    }

    resetGameState({ preserveTimer: options?.preserveTimer });

    const shuffled = shuffleArray(words);
    setSessionWords(shuffled);
    sessionWordsRef.current = shuffled;

    const currentWords = refillOnMatch
      ? shuffled.slice(0, Math.min(PAIRS_PER_SET, shuffled.length))
      : getMatchingSetWords(shuffled, 0);
    nextRefillWordIndexRef.current = currentWords.length;

    setMatchingGamePairs(buildMatchingPairs(currentWords, (index) => index));
  }, [refillOnMatch, resetGameState, stopTimer, words]);

  // ---------------- SET COMPLETE ----------------
  const isSetComplete = useMemo(() => {
    if (refillOnMatch) return false;

    const size = matchingGamePairs?.english?.length || 0;
    return size > 0 && gameState.matchedPairs.length === size * 2;
  }, [refillOnMatch, matchingGamePairs, gameState.matchedPairs.length]);

  // ---------------- ALL COMPLETE ----------------
  const isGameComplete = useMemo(() => {
    const setReady = (matchingGamePairs?.english?.length || 0) > 0;

    if (refillOnMatch) {
      return setReady && words.length > 0 && gameState.totalScore >= words.length;
    }

    const totalSets = getMatchingSetCount(words.length);
    const isLastSet = gameState.currentSet >= totalSets - 1;

    return setReady && isLastSet && isSetComplete;
  }, [
    matchingGamePairs,
    gameState.currentSet,
    gameState.matchedPairs.length,
    gameState.totalScore,
    words.length,
    isSetComplete,
    refillOnMatch
  ]);

  // ---------------- BEST TIME (FIXED CORE) ----------------
  useEffect(() => {
    if (!isGameComplete) return;
    if (completionLockedRef.current) return;

    completionLockedRef.current = true;

    setGameState(prev => {
      const elapsedFromClock = timerStartedAtRef.current == null
        ? prev.timer
        : Math.max(1, Date.now() - timerStartedAtRef.current);
      const currentTime = Math.max(prev.timer, elapsedFromClock);

      if (!timerMode || currentTime <= 0) {
        return {
          ...prev,
          hasCompletedOnce: true,
          lastCompletionWasPersonalBest: false,
        };
      }

      const previousBest = prev.bestTimeByCategory?.[key];

      const isNewBest =
        previousBest == null || previousBest <= 0 || currentTime < previousBest;
      const beatExistingBest =
        previousBest != null && previousBest > 0 && currentTime < previousBest;

      if (isNewBest && saveTimerRecords) {
        saveVocabularyTimerBest(key, currentTime);
      }

      if (beatExistingBest) {
        awardMatchingXP(
          buildMatchingTimerBestActivityKey(key, currentTime),
          XP_REWARDS.vocabularyMatchingTimerBestBonus
        );
      }

      return {
        ...prev,
        timer: currentTime,
        hasCompletedOnce: true,
        lastCompletionWasPersonalBest: isNewBest,
        bestTimeByCategory: isNewBest
          ? {
              ...prev.bestTimeByCategory,
              [key]: currentTime,
            }
          : prev.bestTimeByCategory,
      };
    });
  }, [awardMatchingXP, isGameComplete, key, saveTimerRecords, timerMode]);

  // ---------------- TIMER CONTROL ----------------
  useEffect(() => {
    const setReady = (matchingGamePairs?.english?.length || 0) > 0;

    const shouldRun =
      !!timerMode &&
      !!isActive &&
      setReady &&
      !isGameComplete;

    if (shouldRun) startTimer();
    else stopTimer();

  }, [
    timerMode,
    isActive,
    matchingGamePairs,
    isGameComplete,
    startTimer,
    stopTimer,
  ]);

  // ---------------- CLEANUP ----------------
  useEffect(() => {
    return () => {
      stopTimer();
      if (matchingXpTimeoutRef.current) {
        clearTimeout(matchingXpTimeoutRef.current);
      }
    };
  }, [stopTimer]);

  useEffect(() => {
    if (!gameState.matchedPairs.length) return;

    const cardsByPairId = new Map<number, GameCard[]>();

    gameState.matchedPairs.forEach((cardId) => {
      const card = matchingCardsById.get(cardId);
      if (!card) return;

      const cards = cardsByPairId.get(card.pairId) ?? [];
      cards.push(card);
      cardsByPairId.set(card.pairId, cards);
    });

    cardsByPairId.forEach((cards) => {
      const englishCard = cards.find((card) => card.type === 'english');
      const frenchCard = cards.find((card) => card.type === 'french');

      if (!englishCard || !frenchCard) return;

      const activityKey = buildMatchingPracticeActivityKey(key, englishCard, frenchCard, timerMode);
      if (recordedMatchingActivityKeysRef.current.has(activityKey)) return;

      recordedMatchingActivityKeysRef.current.add(activityKey);
      const hadMistake = mistakenMatchingActivityKeysRef.current.has(activityKey);
      awardMatchingXP(activityKey, getMatchingPairXP(timerMode, hadMistake));
    });
  }, [awardMatchingXP, gameState.matchedPairs, key, matchingCardsById, timerMode]);

  // ---------------- CARD LOGIC ----------------
  const handleCardPress = useCallback((card: GameCard) => {
    const current = gameStateRef.current;

    if (current.isInputLocked) return;
    if (current.matchedPairs.includes(card.id)) return;

    if (!current.selectedCard || current.selectedCard.type === card.type) {
      triggerSelectionHaptic();
    } else if (current.selectedCard.pairId === card.pairId) {
      triggerSuccessHaptic();
    } else {
      triggerWarningHaptic();
    }

    if (
      current.selectedCard &&
      current.selectedCard.type !== card.type &&
      current.selectedCard.pairId !== card.pairId
    ) {
      addMatchingReviewWord(current.selectedCard.pairId);
      addMatchingReviewWord(card.pairId);
      markMatchingPairMistake(current.selectedCard.pairId);
      markMatchingPairMistake(card.pairId);
    }

    setGameState(prev => {
      if (prev.isInputLocked) return prev;
      if (prev.matchedPairs.includes(card.id)) return prev;

      if (!prev.selectedCard) {
        return { ...prev, selectedCard: card, incorrectPair: null };
      }

      const first = prev.selectedCard;

      if (first.type === card.type) {
        return { ...prev, selectedCard: null };
      }

      const isMatch = first.pairId === card.pairId;

      if (isMatch) {
        return {
          ...prev,
          matchedPairs: refillOnMatch ? [first.id, card.id] : [...prev.matchedPairs, first.id, card.id],
          totalScore: prev.totalScore + 1,
          consecutiveCorrect: prev.consecutiveCorrect + 1,
          selectedCard: null,
          incorrectPair: null,
          isInputLocked: refillOnMatch,
        };
      }

      return {
        ...prev,
        incorrectPair: [first.id, card.id],
        consecutiveCorrect: 0,
        selectedCard: null,
        isInputLocked: true,
      };
    });

  }, [addMatchingReviewWord, markMatchingPairMistake, refillOnMatch]);

  const refillMatchedPair = useCallback((matchedCardIds: string[]) => {
    if (!matchedCardIds.length) return;

    const matchedIds = new Set(matchedCardIds);
    const currentPairs = matchingGamePairsRef.current;
    const englishIndex = currentPairs.english.findIndex((card) => matchedIds.has(card.id));
    const frenchIndex = currentPairs.french.findIndex((card) => matchedIds.has(card.id));
    const baseWords = sessionWordsRef.current.length ? sessionWordsRef.current : words;
    const nextWordIndex = nextRefillWordIndexRef.current;
    const nextWord = baseWords[nextWordIndex];
    const nextCards = nextWord ? buildMatchingCards(nextWord, nextWordIndex) : null;

    const remainingEnglish = currentPairs.english.filter((card) => !matchedIds.has(card.id));
    const remainingFrench = currentPairs.french.filter((card) => !matchedIds.has(card.id));

    if (nextCards) {
      nextRefillWordIndexRef.current = nextWordIndex + 1;
    }

    setMatchingGamePairs({
      english: nextCards ? insertCardAt(remainingEnglish, nextCards.english, englishIndex) : remainingEnglish,
      french: nextCards ? insertCardAt(remainingFrench, nextCards.french, frenchIndex) : remainingFrench,
    });

    setGameState(prev => ({
      ...prev,
      currentSet: Math.min(
        Math.max(0, getMatchingSetCount(words.length) - 1),
        Math.floor(prev.totalScore / PAIRS_PER_SET)
      ),
      matchedPairs: [],
      selectedCard: null,
      incorrectPair: null,
      hasAdvancedSet: false,
      isInputLocked: false,
    }));
  }, [words]);

  useEffect(() => {
    if (!refillOnMatch || !gameState.isInputLocked || gameState.incorrectPair || gameState.matchedPairs.length < 2) {
      return undefined;
    }

    const matchedCardIds = [...gameState.matchedPairs];
    const timeoutId = setTimeout(() => {
      refillMatchedPair(matchedCardIds);
      if (refillTimeoutRef.current === timeoutId) {
        refillTimeoutRef.current = null;
      }
    }, REFILL_MATCH_DELAY_MS);

    refillTimeoutRef.current = timeoutId;

    return () => {
      clearTimeout(timeoutId);
      if (refillTimeoutRef.current === timeoutId) {
        refillTimeoutRef.current = null;
      }
    };
  }, [
    refillMatchedPair,
    refillOnMatch,
    gameState.incorrectPair,
    gameState.isInputLocked,
    gameState.matchedPairs,
  ]);

  // Clear wrong-answer feedback and unlock input after a short pause.
  useEffect(() => {
    if (!gameState.isInputLocked || !gameState.incorrectPair) return;

    const timeoutId = setTimeout(() => {
      setGameState(prev => ({
        ...prev,
        incorrectPair: null,
        isInputLocked: false,
      }));
    }, WRONG_MATCH_FEEDBACK_MS);

    return () => clearTimeout(timeoutId);
  }, [gameState.isInputLocked, gameState.incorrectPair]);

  // ---------------- NEXT SET ----------------
  const advanceToNextSet = useCallback(() => {
    setGameState(prev => {
      const nextSet = prev.currentSet + 1;

      const base = sessionWords.length ? sessionWords : words;

      const nextWords = getMatchingSetWords(base, nextSet);
      setMatchingGamePairs(buildMatchingPairs(nextWords, (index) => index));

      return {
        ...prev,
        matchedPairs: [],
        selectedCard: null,
        currentSet: nextSet,
        hasAdvancedSet: false,
        isInputLocked: false,
      };
    });
  }, [sessionWords, words]);

  useEffect(() => {
    if (!isSetComplete || isGameComplete || setAdvanceLockedRef.current) return;

    setAdvanceLockedRef.current = true;
    void playSetCompleteSound();

    const timeoutId = setTimeout(() => {
      advanceToNextSet();
      setAdvanceLockedRef.current = false;
    }, NEXT_SET_DELAY_MS);

    return () => {
      clearTimeout(timeoutId);
      setAdvanceLockedRef.current = false;
    };
  }, [isSetComplete, isGameComplete, advanceToNextSet, playSetCompleteSound]);

  // ---------------- EXPOSED ----------------
  return {
    gameState,
    setGameState,
    matchingGamePairs,
    initializeGameSet,
    handleCardPress,
    advanceToNextSet,
    resetGameState,
    startTimer,
    stopTimer,
    matchingSessionXp,
    lastMatchingXpGain,
    matchingReviewWords,
  };
};
