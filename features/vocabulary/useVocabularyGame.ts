import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useAudioPlayer } from 'expo-audio';
import { Word, GameCard, MatchingGamePairs, GameState } from '../../types/VocabularyTypes';
import { getMatchingSetCount, getMatchingSetWords, shuffleArray } from './vocabularyUtils';
import { getVocabularyTimerBests, saveVocabularyTimerBest } from './vocabularyTimerStorage';
import { SOUND_EFFECT_OPTIONS, SUCCESS_SOUND, replaySoundEffect } from '../shared/soundEffects';
import { triggerSelectionHaptic, triggerSuccessHaptic, triggerWarningHaptic } from '../shared/haptics';
import { awardActivityXPOnceToday } from '../progress/xpStorage';
import { XP_REWARDS } from '../progress/xpRewards';

const buildMatchingPracticeActivityKey = (categoryKey: string, first: GameCard, second: GameCard) => {
  const englishText = first.type === 'english' ? first.text : second.text;
  const frenchText = first.type === 'french' ? first.text : second.text;

  return `vocabulary:matching:${categoryKey}:${englishText}:${frenchText}`;
};

export const useVocabularyGame = (
  words: Word[],
  timerMode: boolean,
  isActive: boolean,
  categoryKey: string = 'default',
  saveTimerRecords: boolean = false
) => {
  const setCompletePlayer = useAudioPlayer(SUCCESS_SOUND, SOUND_EFFECT_OPTIONS);

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

  const [sessionWords, setSessionWords] = useState<Word[]>([]);
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
  const matchingXpTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    replaySoundEffect(setCompletePlayer);
  }, [setCompletePlayer]);

  const key = categoryKey || "All";

  const matchingCardsById = useMemo(() => {
    const cards = [...matchingGamePairs.english, ...matchingGamePairs.french];
    return new Map(cards.map((card) => [card.id, card]));
  }, [matchingGamePairs]);

  useEffect(() => {
    gameStateRef.current = gameState;
    timerValueRef.current = gameState.timer;
  }, [gameState]);

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
    });

    return () => {
      active = false;
    };
  }, [saveTimerRecords]);

  // ---------------- RESET ----------------
  const resetGameState = useCallback((options?: { preserveTimer?: boolean }) => {
    completionLockedRef.current = false;
    setAdvanceLockedRef.current = false;
    recordedMatchingActivityKeysRef.current = new Set();
    if (matchingXpTimeoutRef.current) {
      clearTimeout(matchingXpTimeoutRef.current);
      matchingXpTimeoutRef.current = null;
    }
    setMatchingSessionXp(0);
    setLastMatchingXpGain(0);
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

    const currentWords = getMatchingSetWords(shuffled, 0);

    const englishCards = currentWords.map((word, index) => ({
      id: `english-${index}`,
      text: word.english,
      type: 'english' as const,
      pairId: index,
    }));

    const frenchCards = currentWords.map((word, index) => ({
      id: `french-${index}`,
      text: word.french,
      type: 'french' as const,
      pairId: index,
    }));

    setMatchingGamePairs({
      english: shuffleArray(englishCards),
      french: shuffleArray(frenchCards),
    });
  }, [words, resetGameState]);

  // ---------------- SET COMPLETE ----------------
  const isSetComplete = useMemo(() => {
    const size = matchingGamePairs?.english?.length || 0;
    return size > 0 && gameState.matchedPairs.length === size * 2;
  }, [matchingGamePairs, gameState.matchedPairs.length]);

  // ---------------- ALL COMPLETE ----------------
  const isGameComplete = useMemo(() => {
    const setReady = (matchingGamePairs?.english?.length || 0) > 0;
    const totalSets = getMatchingSetCount(words.length);
    const isLastSet = gameState.currentSet >= totalSets - 1;

    return setReady && isLastSet && isSetComplete;
  }, [
    matchingGamePairs,
    gameState.currentSet,
    gameState.matchedPairs.length,
    words.length,
    isSetComplete
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

      if (isNewBest && saveTimerRecords) {
        saveVocabularyTimerBest(key, currentTime);
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
  }, [isGameComplete, key, saveTimerRecords, timerMode]);

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

      const activityKey = buildMatchingPracticeActivityKey(key, englishCard, frenchCard);
      if (recordedMatchingActivityKeysRef.current.has(activityKey)) return;

      recordedMatchingActivityKeysRef.current.add(activityKey);
      void awardActivityXPOnceToday(activityKey, XP_REWARDS.vocabularyMatchingPair).then((xpGain) => {
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
    });
  }, [gameState.matchedPairs, key, matchingCardsById]);

  // ---------------- CARD LOGIC ----------------
  const handleCardPress = useCallback((card: GameCard) => {
    const current = gameStateRef.current;

    if (current.isInputLocked) return;
    if (current.matchedPairs.includes(card.id)) return;

    if (!current.selectedCard) {
      triggerSelectionHaptic();
    } else if (current.selectedCard.type === card.type) {
      triggerSelectionHaptic();
    } else if (current.selectedCard.pairId === card.pairId) {
      triggerSuccessHaptic();
    } else {
      triggerWarningHaptic();
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
          matchedPairs: [...prev.matchedPairs, first.id, card.id],
          totalScore: prev.totalScore + 1,
          consecutiveCorrect: prev.consecutiveCorrect + 1,
          selectedCard: null,
          incorrectPair: null,
          isInputLocked: false,
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

  }, []);

  // Clear wrong-answer feedback and unlock input after a short pause.
  useEffect(() => {
    if (!gameState.isInputLocked || !gameState.incorrectPair) return;

    const timeoutId = setTimeout(() => {
      setGameState(prev => ({
        ...prev,
        incorrectPair: null,
        isInputLocked: false,
      }));
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [gameState.isInputLocked, gameState.incorrectPair]);

  // ---------------- NEXT SET ----------------
  const advanceToNextSet = useCallback(() => {
    setGameState(prev => {
      const nextSet = prev.currentSet + 1;

      const base = sessionWords.length ? sessionWords : words;

      const nextWords = getMatchingSetWords(base, nextSet);

      const englishCards = nextWords.map((word, index) => ({
        id: `english-${index}`,
        text: word.english,
        type: 'english' as const,
        pairId: index,
      }));

      const frenchCards = nextWords.map((word, index) => ({
        id: `french-${index}`,
        text: word.french,
        type: 'french' as const,
        pairId: index,
      }));

      setMatchingGamePairs({
        english: shuffleArray(englishCards),
        french: shuffleArray(frenchCards),
      });

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
    }, 650);

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
  };
};
