import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { createAudioPlayer } from 'expo-audio';
import type { AudioPlayer } from 'expo-audio';
import { Word, GameCard, MatchingGamePairs, GameState } from '../../types/VocabularyTypes';
import { PAIRS_PER_SET, getMatchingSetCount, getMatchingSetWords, shuffleArray, shuffleMatchingPairColumns } from './vocabularyUtils';
import { getVocabularyTimerBests, saveVocabularyTimerBest } from './vocabularyTimerStorage';
import { SOUND_EFFECT_OPTIONS, SUCCESS_SOUND, restartSoundEffect } from '../shared/soundEffects';
import {
  awardActivityXPOnceToday,
  previewActivityXPOnceToday,
  getDailyXPSnapshot,
} from '../progress/xpStorage';
import { recordPracticeToday } from '../progress/streakStorage';
import {
  XP_REWARDS,
  PERFECT_RUN_XP_MULTIPLIER,
  getReplayXpFraction,
  applyDailyXpTaper,
} from '../progress/xpRewards';
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

// Deliberately keyed on the category alone. Including the time meant every personal best
// was a brand new key, so shaving a millisecond off paid the full bonus again, over and
// over — this way beating your record is worth the full bonus once a day.
const buildMatchingTimerBestActivityKey = (categoryKey: string) =>
  `vocabulary:matching-timer-best:${categoryKey}`;

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
// Comfortably longer than the advance delay above, and far shorter than any real gap
// between two sets being finished.
const SET_COMPLETE_SOUND_DEBOUNCE_MS = 1200;
let lastSetCompleteSoundAt = 0;

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

  const shuffledColumns = shuffleMatchingPairColumns(
    englishCards,
    frenchCards,
    (card) => card.pairId
  );

  return {
    english: shuffledColumns.left,
    french: shuffledColumns.right,
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
  refillOnMatch: boolean = false,
  pairsPerSet: number = PAIRS_PER_SET,
  lessonDifficulty: number | null = null
) => {
  const replayXpFraction = getReplayXpFraction(lessonDifficulty);
  const setCompletePlayerRef = useRef<AudioPlayer | null>(null);


  // Built up front rather than on the first match: creating a player costs a native round
  // trip, and paying it at match time is audible as the first sound of a game arriving late.
  useEffect(() => {
    if (!setCompletePlayerRef.current) {
      setCompletePlayerRef.current = createAudioPlayer(SUCCESS_SOUND, SOUND_EFFECT_OPTIONS);
    }

    return () => {
      setCompletePlayerRef.current?.remove();
      setCompletePlayerRef.current = null;
    };
  }, []);


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
    lastCompletionPreviousBest: null,
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
  const [wasMatchingPerfectRun, setWasMatchingPerfectRun] = useState(false);
  const [matchingBonusXp, setMatchingBonusXp] = useState(0);


  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerStartedAtRef = useRef<number | null>(null);
  const timerValueRef = useRef(0);


  const completionLockedRef = useRef(false);
  // Which set index already got its completion sound. A plain "locked" flag could not do
  // this: the advance effect has to re-arm its timer whenever its deps change, and the
  // cleanup that allowed for that also cleared the flag — so a dep change while a set sat
  // completed replayed the sound.
  const setCompleteSoundedSetRef = useRef<number | null>(null);
  const recordedMatchingActivityKeysRef = useRef<Set<string>>(new Set());
  const mistakenMatchingActivityKeysRef = useRef<Set<string>>(new Set());
  // Per-pair XP earned during play is only persisted once the whole session is confirmed
  // complete (see commitPendingMatchingXp) — not per match, so quitting early doesn't bank it.
  const pendingMatchXpRef = useRef<{ activityKey: string; amount: number }[]>([]);
  // What the "XP" metric above the board has shown so far. Kept as a ref as well as state
  // because pricing the next pair depends on the running total, and the day's soft cap is
  // applied against it.
  const displayedMatchingXpRef = useRef(0);
  // Refreshed at the start of each session: pairs already practised today are worth a
  // fraction, and the day's cap may already be partly spent. Without this the metric
  // counted every pair at full price and then disagreed with the completion screen.
  const dailyXpSnapshotRef = useRef<{ awardedActivityKeys: Set<string>; grantedToday: number }>({
    awardedActivityKeys: new Set(),
    grantedToday: 0,
  });
  const matchingXpTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const refillTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nextRefillWordIndexRef = useRef(0);


  const refreshDailyXpSnapshot = useCallback(() => {
    getDailyXPSnapshot()
      .then((snapshot) => { dailyXpSnapshotRef.current = snapshot; })
      .catch(() => {});
  }, []);

  useEffect(() => {
    refreshDailyXpSnapshot();
  }, [refreshDailyXpSnapshot]);

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
    // Module-scoped rather than a ref, deliberately. A stack can hold more than one lesson
    // screen at a time, and each mounted copy of this hook owns its own players — so a
    // per-instance guard would still let two of them chime together. Finishing a set is
    // seconds apart from the next one, so nothing legitimate is ever suppressed here.
    const now = Date.now();
    if (now - lastSetCompleteSoundAt < SET_COMPLETE_SOUND_DEBOUNCE_MS) return;
    lastSetCompleteSoundAt = now;

    if (!setCompletePlayerRef.current) {
      setCompletePlayerRef.current = createAudioPlayer(SUCCESS_SOUND, SOUND_EFFECT_OPTIONS);
    }
    // One voice, restarted from a stop. The pool exists for sounds that retrigger faster
    // than a clip lasts (a run of correct answers), which a set completing never does, and
    // restartSoundEffect is the variant that cannot start the clip twice — see its comment.
    restartSoundEffect(setCompletePlayerRef.current);
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

  // Pends the award and shows it, exactly like a matched pair does. It must not persist
  // here: XP is banked only when the student claims it on the end screen, and writing early
  // would also double-count this bonus (once in the stored total the end screen reads, once
  // again in the session total it adds on top).
  //
  // The figure shown is priced the same way claiming will price it — discounted if this
  // pair already paid out today, then put through the day's soft cap — so the metric above
  // the board agrees with the completion screen. The one thing still unknown mid-session is
  // the perfect-run multiplier, which can only go up and is surfaced separately as
  // matchingBonusXp.
  const awardMatchingXP = useCallback((activityKey: string, amount: number) => {
    const normalizedAmount = Math.max(0, Math.round(amount));
    if (normalizedAmount <= 0 || recordedMatchingActivityKeysRef.current.has(activityKey)) return;

    recordedMatchingActivityKeysRef.current.add(activityKey);
    pendingMatchXpRef.current.push({ activityKey, amount: normalizedAmount });

    const { awardedActivityKeys, grantedToday } = dailyXpSnapshotRef.current;
    const discountedAmount = awardedActivityKeys.has(activityKey)
      ? Math.round(normalizedAmount * replayXpFraction)
      : normalizedAmount;
    const displayedGain = applyDailyXpTaper(
      discountedAmount,
      grantedToday + displayedMatchingXpRef.current
    );

    displayedMatchingXpRef.current += displayedGain;
    setMatchingSessionXp(displayedMatchingXpRef.current);

    if (displayedGain <= 0) return;
    setLastMatchingXpGain(displayedGain);

    if (matchingXpTimeoutRef.current) {
      clearTimeout(matchingXpTimeoutRef.current);
    }

    matchingXpTimeoutRef.current = setTimeout(() => {
      setLastMatchingXpGain(0);
      matchingXpTimeoutRef.current = null;
    }, 1400);
  }, [replayXpFraction]);

  // Called by the screen once it confirms the whole session (all sets) is actually complete.
  // Persists every pair's XP earned during play in one batch, applying the perfect-run
  // bonus if no mistakes were made anywhere this session.
  // Running totals during play are optimistic: each match adds its full value, because
  // whether a pair is discounted (already practised today) or boosted (perfect run) isn't
  // known until the session ends. This resolves the real figure — with `persist` false it
  // only reads, so the end screen can show the true number before anything is banked.
  const resolvePendingMatchingXp = useCallback(async (persist: boolean) => {
    const pending = pendingMatchXpRef.current;
    if (pending.length === 0) return 0;

    const isPerfectRun = mistakenMatchingActivityKeysRef.current.size === 0;
    setWasMatchingPerfectRun(isPerfectRun);
    let totalAwarded = 0;
    // What the running metric showed during play — the difference is the perfect-run
    // bonus, which is the one part that can't be known until the session ends.
    const displayedDuringPlay = displayedMatchingXpRef.current;

    for (const { activityKey, amount } of pending) {
      const finalAmount = isPerfectRun ? Math.round(amount * PERFECT_RUN_XP_MULTIPLIER) : amount;
      // Awarding banks as it goes, so the day's soft cap advances on its own; previewing
      // banks nothing, so it has to carry the running total forward itself to taper the
      // session as one batch rather than restarting from the stored figure each pair.
      totalAwarded += persist
        ? await awardActivityXPOnceToday(activityKey, finalAmount, replayXpFraction)
        : await previewActivityXPOnceToday(activityKey, finalAmount, replayXpFraction, totalAwarded);
    }

    // Set absolutely rather than by delta, so previewing and then committing can't apply the
    // same correction twice — both land on the same figure.
    displayedMatchingXpRef.current = totalAwarded;
    setMatchingSessionXp(totalAwarded);
    setMatchingBonusXp(Math.max(0, totalAwarded - displayedDuringPlay));
    return totalAwarded;
  }, [replayXpFraction]);

  // Read-only: shows what claiming will actually give, without awarding or consuming the
  // pending list.
  const previewPendingMatchingXp = useCallback(
    () => resolvePendingMatchingXp(false),
    [resolvePendingMatchingXp]
  );

  const commitPendingMatchingXp = useCallback(async () => {
    if (pendingMatchXpRef.current.length === 0) return 0;
    const totalAwarded = await resolvePendingMatchingXp(true);
    pendingMatchXpRef.current = [];

    if (totalAwarded > 0) {
      setLastMatchingXpGain(totalAwarded);
      if (matchingXpTimeoutRef.current) clearTimeout(matchingXpTimeoutRef.current);
      matchingXpTimeoutRef.current = setTimeout(() => {
        setLastMatchingXpGain(0);
        matchingXpTimeoutRef.current = null;
      }, 1400);
    }

    return totalAwarded;
  }, [resolvePendingMatchingXp]);

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


  const resetGameState = useCallback((options?: { preserveTimer?: boolean }) => {
    completionLockedRef.current = false;
    setCompleteSoundedSetRef.current = null;
    if (refillTimeoutRef.current) {
      clearTimeout(refillTimeoutRef.current);
      refillTimeoutRef.current = null;
    }
    nextRefillWordIndexRef.current = 0;
    recordedMatchingActivityKeysRef.current = new Set();
    mistakenMatchingActivityKeysRef.current = new Set();
    pendingMatchXpRef.current = [];
    displayedMatchingXpRef.current = 0;
    // Replaying in the same sitting means pairs just claimed are now discounted, and the
    // day's cap has moved — re-read both so the next run prices itself correctly.
    refreshDailyXpSnapshot();
    setWasMatchingPerfectRun(false);
    setMatchingBonusXp(0);
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
      lastCompletionPreviousBest: null,
    }));
  }, []);


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
      ? shuffled.slice(0, Math.min(pairsPerSet, shuffled.length))
      : getMatchingSetWords(shuffled, 0, pairsPerSet);
    nextRefillWordIndexRef.current = currentWords.length;

    setMatchingGamePairs(buildMatchingPairs(currentWords, (index) => index));
  }, [pairsPerSet, refillOnMatch, resetGameState, stopTimer, words]);


  const isSetComplete = useMemo(() => {
    if (refillOnMatch) return false;

    const size = matchingGamePairs?.english?.length || 0;
    return size > 0 && gameState.matchedPairs.length === size * 2;
  }, [refillOnMatch, matchingGamePairs, gameState.matchedPairs.length]);


  const isGameComplete = useMemo(() => {
    const setReady = (matchingGamePairs?.english?.length || 0) > 0;

    if (refillOnMatch) {
      return setReady && words.length > 0 && gameState.totalScore >= words.length;
    }

    const totalSets = getMatchingSetCount(words.length, pairsPerSet);
    const isLastSet = gameState.currentSet >= totalSets - 1;

    return setReady && isLastSet && isSetComplete;
  }, [
    matchingGamePairs,
    gameState.currentSet,
    gameState.matchedPairs.length,
    gameState.totalScore,
    pairsPerSet,
    words.length,
    isSetComplete,
    refillOnMatch
  ]);


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
          lastCompletionPreviousBest: null,
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
          buildMatchingTimerBestActivityKey(key),
          XP_REWARDS.vocabularyMatchingTimerBestBonus
        );
      }

      return {
        ...prev,
        timer: currentTime,
        hasCompletedOnce: true,
        lastCompletionWasPersonalBest: isNewBest,
        lastCompletionPreviousBest: previousBest != null && previousBest > 0 ? previousBest : null,
        bestTimeByCategory: isNewBest
          ? {
              ...prev.bestTimeByCategory,
              [key]: currentTime,
            }
          : prev.bestTimeByCategory,
      };
    });
  }, [awardMatchingXP, isGameComplete, key, saveTimerRecords, timerMode]);


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

      // Routed through awardMatchingXP rather than tracked here: it is what keeps
      // displayedMatchingXpRef in step with the metric above the board. Adding to the
      // metric without it left that ref at zero all session, so the end screen read the
      // whole total as perfect-run bonus and showed the badge after any number of
      // mistakes. It also prices the pair the way claiming will (replay discount, daily
      // taper), which this path used to skip.
      const hadMistake = mistakenMatchingActivityKeysRef.current.has(activityKey);
      awardMatchingXP(activityKey, getMatchingPairXP(timerMode, hadMistake));

      // Practice counts toward the streak as soon as it happens, independently of the
      // end-screen XP claim — the student did the work either way.
      void recordPracticeToday();
    });
  }, [awardMatchingXP, gameState.matchedPairs, key, matchingCardsById, timerMode]);


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
        Math.max(0, getMatchingSetCount(words.length, pairsPerSet) - 1),
        Math.floor(prev.totalScore / pairsPerSet)
      ),
      matchedPairs: [],
      selectedCard: null,
      incorrectPair: null,
      hasAdvancedSet: false,
      isInputLocked: false,
    }));
  }, [pairsPerSet, words]);

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


  const advanceToNextSet = useCallback(() => {
    setGameState(prev => {
      const nextSet = prev.currentSet + 1;

      const base = sessionWords.length ? sessionWords : words;

      const nextWords = getMatchingSetWords(base, nextSet, pairsPerSet);
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
  }, [pairsPerSet, sessionWords, words]);

  useEffect(() => {
    if (!isSetComplete || isGameComplete) {
      setCompleteSoundedSetRef.current = null;
      return undefined;
    }

    // Once per completed set, however often this effect re-runs while the set sits there.
    if (setCompleteSoundedSetRef.current !== gameState.currentSet) {
      setCompleteSoundedSetRef.current = gameState.currentSet;
      void playSetCompleteSound();
    }

    const timeoutId = setTimeout(advanceToNextSet, NEXT_SET_DELAY_MS);
    return () => clearTimeout(timeoutId);
  }, [isSetComplete, isGameComplete, gameState.currentSet, advanceToNextSet, playSetCompleteSound]);


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
    commitPendingMatchingXp,
    previewPendingMatchingXp,
    wasMatchingPerfectRun,
    matchingBonusXp,
  };
};
