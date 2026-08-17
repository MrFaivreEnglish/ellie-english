import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getXP, addXP, hasWordXpAwardedToday, markWordXpAwardedToday } from '../progress/xpStorage';
import type { Word } from '../../types/VocabularyTypes';
import { useTheme } from '../settings/ThemeContext';
import { getTypingAnswerXP, getTypingComboReward } from '../progress/xpRewards';
import { getLevelDisplayLabel, xpForLevel } from '../progress/xpLevels';

type FeedbackType = 'correct' | 'wrong' | 'close';

type DifficultyStats = {
  correct: number;
  misses: number;
  seen: number;
};

type TypingGameOptions = {
  allowSlashAlternatives?: boolean;
};

const CLOSE_TRIES_BEFORE_COMBO_LOSS = 2;

const wordKey = (word: Word) => `${word.english.trim().toLowerCase()}|${word.french.trim().toLowerCase()}`;

const stripDiacritics = (text: string) =>
  text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const normalizeLenientAnswer = (text: string) => {
  return stripDiacritics(text)
    .toLowerCase()
    .trim()
    .replace(/^\(?to\)?\s+/, '')
    .replace(/[’`]/g, "'")
    .replace(/\b(i'm)\b/g, 'im')
    .replace(/^(a|an|the|to)\s+/, '')
    .replace(/[.,!?;:"()[\]{}]/g, '')
    .replace(/^to\s+/, '')
    .replace(/[-'\/]/g, ' ')
    .replace(/\s+/g, ' ');
};

const normalizeStrictAnswer = (text: string) => {
  return text
    .toLowerCase()
    .trim()
    .replace(/^\(?to\)?\s+/, '')
    .replace(/[’`]/g, "'")
    .replace(/\s+/g, ' ');
};

const levenshteinDistance = (a: string, b: string) => {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i += 1) matrix[i] = [i];
  for (let j = 0; j <= a.length; j += 1) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i += 1) {
    for (let j = 1; j <= a.length; j += 1) {
      matrix[i][j] =
        b[i - 1] === a[j - 1]
          ? matrix[i - 1][j - 1]
          : Math.min(
              matrix[i - 1][j - 1] + 1,
              matrix[i][j - 1] + 1,
              matrix[i - 1][j] + 1
            );
    }
  }

  return matrix[b.length][a.length];
};

const isCloseMatch = (user: string, correct: string) => {
  if (!user || !correct) return false;

  const distance = levenshteinDistance(user, correct);
  const allowedDistance = correct.length <= 5 ? 1 : 2;

  return distance <= allowedDistance;
};

const buildCorrectAnswers = (
  answer: string,
  normalizeAnswer: (text: string) => string,
  allowSlashAlternatives: boolean,
  wordAlternatives: string[] = []
) => {
  const fullAnswer = normalizeAnswer(answer);
  const separatorlessAnswer = /[\/-]/.test(answer)
    ? normalizeAnswer(answer.replace(/[\/-]+/g, ' '))
    : '';
  // Accept the answer without a leading article so e.g. "witch" matches "A witch"
  const articleStripped = /^(a|an|the)\s+/i.test(answer)
    ? normalizeAnswer(answer.replace(/^(a|an|the)\s+/i, ''))
    : '';
  const baseAnswers = [fullAnswer, separatorlessAnswer, articleStripped].filter(Boolean);

  const slashAlts = allowSlashAlternatives && answer.includes('/')
    ? answer.split('/').map((part) => normalizeAnswer(part)).filter(Boolean)
    : [];

  const altAnswers = wordAlternatives.flatMap((alt) => {
    const altFull = normalizeAnswer(alt);
    const altSep = /[\/-]/.test(alt) ? normalizeAnswer(alt.replace(/[\/-]+/g, ' ')) : '';
    return [altFull, altSep].filter(Boolean);
  });

  return Array.from(new Set([...baseAnswers, ...slashAlts, ...altAnswers]));
};

const shuffleArray = <T,>(items: T[]) => {
  const copy = [...items];

  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }

  return copy;
};

const buildDifficultyQueue = (
  words: Word[],
  difficultyByWord: Record<string, DifficultyStats>
) => {
  return shuffleArray(words).sort((a, b) => {
    const aStats = difficultyByWord[wordKey(a)];
    const bStats = difficultyByWord[wordKey(b)];
    const aScore = (aStats?.misses ?? 0) * 2 - (aStats?.correct ?? 0);
    const bScore = (bStats?.misses ?? 0) * 2 - (bStats?.correct ?? 0);

    return bScore - aScore;
  });
};

export function useTypingGame(words: Word[], options: TypingGameOptions = {}) {
  const { isTypingStrictMode } = useTheme();
  const allowSlashAlternatives = options.allowSlashAlternatives ?? true;
  const [typedAnswer, setTypedAnswer] = useState('');
  const [typingIndex, setTypingIndex] = useState(0);
  const [gameWords, setGameWords] = useState<Word[]>(() => shuffleArray(words));
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [isSessionComplete, setIsSessionComplete] = useState(false);
  const [typingFeedback, setTypingFeedback] = useState<FeedbackType | null>(null);
  const [inlineMessage, setInlineMessage] = useState('');
  const [feedback, setFeedback] = useState('');
  const [xp, setXp] = useState(0);
  const [sessionXp, setSessionXp] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [answeredWords, setAnsweredWords] = useState<Set<string>>(new Set());
  const [missedWordKeys, setMissedWordKeys] = useState<Set<string>>(new Set());
  const [attempts, setAttempts] = useState<Record<string, number>>({});
  const [closeAttempts, setCloseAttempts] = useState<Record<string, number>>({});
  const [hintsUsed, setHintsUsed] = useState<Record<string, number>>({});
  const [difficultyByWord, setDifficultyByWord] = useState<Record<string, DifficultyStats>>({});
  const [previousLevel, setPreviousLevel] = useState(1);
  const [levelUpMessage, setLevelUpMessage] = useState('');
  const [isAdvancing, setIsAdvancing] = useState(false);
  const [feedbackEvent, setFeedbackEvent] = useState<null | {
    type: FeedbackType;
    text: string;
    streak: number;
    answer?: string;
  }>(null);
  const previousWordsRef = useRef<Word[]>(words);
  const awardedWordKeysRef = useRef<Set<string>>(new Set());
  const answerLockedRef = useRef(false);
  const pendingAdvanceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const level = useMemo(() => {
    let lvl = 1;

    while (xp >= xpForLevel(lvl + 1)) {
      lvl += 1;
    }

    return lvl;
  }, [xp]);

  const comboBonus = useMemo(() => getTypingComboReward(streak).bonus, [streak]);

  const firstTryCount = useMemo(
    () => Array.from(answeredWords).filter(
      (key) => (attempts[key] ?? 0) === 1 && !(hintsUsed[key] > 0)
    ).length,
    [answeredWords, attempts, hintsUsed]
  );

  const currentWord = gameWords[typingIndex] ?? null;
  const currentWordKey = currentWord ? wordKey(currentWord) : null;

  const currentHintCount = currentWordKey ? (hintsUsed[currentWordKey] ?? 0) : 0;

  const currentHintText = useMemo(() => {
    if (!currentWord || currentHintCount === 0) return '';
    const primary = currentWord.english.split('/')[0].trim().replace(/^\(?to\)?\s+/, '');
    return primary
      .split('')
      .map((char, i) => (i < currentHintCount ? char : char === ' ' ? ' ' : '_'))
      .join(' ');
  }, [currentWord, currentHintCount]);
  const totalAttempts = useMemo(
    () => Object.values(attempts).reduce((total, count) => total + count, 0),
    [attempts]
  );

  const clearPendingAdvance = useCallback(() => {
    answerLockedRef.current = false;
    setIsAdvancing(false);

    if (!pendingAdvanceTimeoutRef.current) return;

    clearTimeout(pendingAdvanceTimeoutRef.current);
    pendingAdvanceTimeoutRef.current = null;
  }, []);

  const clearCurrentPrompt = useCallback(() => {
    setTypedAnswer('');
    setTypingFeedback(null);
    setInlineMessage('');
    setFeedback('');
    setFeedbackEvent(null);
  }, []);

  const requestHint = useCallback(() => {
    if (!currentWord || !currentWordKey) return;
    const primary = currentWord.english.split('/')[0].trim().replace(/^\(?to\)?\s+/, '');
    const maxHints = primary.length - 1;
    const current = hintsUsed[currentWordKey] ?? 0;
    if (current >= maxHints) return;
    const next = current + 1;
    setHintsUsed((prev) => ({ ...prev, [currentWordKey]: next }));
    setTypedAnswer(primary.slice(0, next));
    setMissedWordKeys((prev) => new Set(prev).add(currentWordKey));
  }, [currentWord, currentWordKey, hintsUsed]);

  const reset = useCallback(() => {
    clearPendingAdvance();
    clearCurrentPrompt();
    setTypingIndex(0);
    setGameWords(buildDifficultyQueue(words, difficultyByWord));
    setIsReviewMode(false);
    setIsSessionComplete(false);
    setStreak(0);
    setMaxStreak(0);
    setAnsweredWords(new Set());
    awardedWordKeysRef.current = new Set();
    setMissedWordKeys(new Set());
    setAttempts({});
    setCloseAttempts({});
    setHintsUsed({});
    setSessionXp(0);
  }, [clearCurrentPrompt, clearPendingAdvance, words, difficultyByWord]);

  const advanceToNextWord = useCallback(() => {
    clearCurrentPrompt();
    const nextIndex = typingIndex + 1;

    if (nextIndex < gameWords.length) {
      setTypingIndex(nextIndex);
      return;
    }

    if (!isReviewMode && missedWordKeys.size > 0) {
      const reviewWords = words.filter((word) => missedWordKeys.has(wordKey(word)));

      if (reviewWords.length > 0) {
        setGameWords(buildDifficultyQueue(reviewWords, difficultyByWord));
        setMissedWordKeys(new Set());
        setIsReviewMode(true);
        setTypingIndex(0);
        return;
      }

      setMissedWordKeys(new Set());
      setIsSessionComplete(true);
      return;
    }

    setIsSessionComplete(true);
  }, [
    clearCurrentPrompt,
    difficultyByWord,
    gameWords.length,
    isReviewMode,
    missedWordKeys,
    typingIndex,
    words,
  ]);

  const reshuffleRemaining = useCallback(() => {
    clearCurrentPrompt();
    setGameWords((prev) => {
      const nextIndex = typingIndex + 1;
      if (nextIndex >= prev.length) return prev;
      const done = prev.slice(0, nextIndex);
      const remaining = shuffleArray(prev.slice(nextIndex));
      return [...done, ...remaining];
    });
  }, [clearCurrentPrompt, typingIndex]);

  const moveNext = useCallback(() => {
    clearPendingAdvance();
    advanceToNextWord();
  }, [advanceToNextWord, clearPendingAdvance]);

  const goToPreviousWord = useCallback(() => {
    clearPendingAdvance();
    clearCurrentPrompt();
    setTypingIndex((prev) => Math.max(prev - 1, 0));
    setIsSessionComplete(false);
  }, [clearCurrentPrompt, clearPendingAdvance]);

  const goToNextWord = useCallback(() => {
    moveNext();
  }, [moveNext]);

  const handleSubmit = useCallback(async () => {
    if (!typedAnswer.trim() || !currentWord || !currentWordKey) return;
    if (answerLockedRef.current) return;

    const normalizeAnswer = isTypingStrictMode ? normalizeStrictAnswer : normalizeLenientAnswer;
    const correctAnswers = buildCorrectAnswers(currentWord.english, normalizeAnswer, allowSlashAlternatives, currentWord.alternatives);
    const user = isTypingStrictMode
      ? normalizeStrictAnswer(typedAnswer)
      : normalizeLenientAnswer(typedAnswer);
    const closeUser = normalizeLenientAnswer(typedAnswer);
    const closeCorrects = [currentWord.english, ...(currentWord.alternatives ?? [])].map(normalizeLenientAnswer);
    const alreadyAnswered =
      answeredWords.has(currentWordKey) || awardedWordKeysRef.current.has(currentWordKey);
    const newAttempts = (attempts[currentWordKey] || 0) + 1;

    setAttempts((prev) => ({ ...prev, [currentWordKey]: newAttempts }));
    setDifficultyByWord((prev) => ({
      ...prev,
      [currentWordKey]: {
        correct: prev[currentWordKey]?.correct ?? 0,
        misses: prev[currentWordKey]?.misses ?? 0,
        seen: (prev[currentWordKey]?.seen ?? 0) + 1,
      },
    }));

    if (correctAnswers.includes(user)) {
      answerLockedRef.current = true;
      setIsAdvancing(true);
      setTypingFeedback('correct');
      setCloseAttempts((prev) => {
        const { [currentWordKey]: _cleared, ...rest } = prev;
        return rest;
      });
      const newStreak = streak + 1;
      const hintsForWord = hintsUsed[currentWordKey] ?? 0;
      const { xpGain } = getTypingAnswerXP({
        attempts: hintsForWord > 0 ? Math.max(newAttempts, 2) : newAttempts,
        streak: newStreak,
        isStrictMode: isTypingStrictMode,
        isReviewMode,
      });
      setStreak(newStreak);
      setMaxStreak((prev) => Math.max(prev, newStreak));
      setFeedbackEvent({ type: 'correct', text: 'Great job!', streak: newStreak });
      setFeedback(newAttempts === 1 ? 'Perfect answer' : 'Good recovery');

      setInlineMessage(alreadyAnswered ? 'Already cleared' : '');

      setDifficultyByWord((prev) => ({
        ...prev,
        [currentWordKey]: {
          correct: (prev[currentWordKey]?.correct ?? 0) + 1,
          misses: prev[currentWordKey]?.misses ?? 0,
          seen: prev[currentWordKey]?.seen ?? 1,
        },
      }));

      if (!alreadyAnswered) {
        awardedWordKeysRef.current.add(currentWordKey);
        const alreadyAwardedToday = await hasWordXpAwardedToday(currentWordKey);

        if (!alreadyAwardedToday) {
          const newXP = await addXP(xpGain);
          await markWordXpAwardedToday(currentWordKey);
          setXp(newXP);
          setSessionXp((prev) => prev + xpGain);
        } else {
          setInlineMessage('Already saved today');
        }

        setAnsweredWords((prev) => new Set(prev).add(currentWordKey));
      }

      pendingAdvanceTimeoutRef.current = setTimeout(() => {
        pendingAdvanceTimeoutRef.current = null;
        answerLockedRef.current = false;
        setIsAdvancing(false);
        advanceToNextWord();
      }, 650);
      return;
    }

    const close = closeCorrects.some((cc) => isCloseMatch(closeUser, cc));

    if (close) {
      const closeCount = (closeAttempts[currentWordKey] || 0) + 1;
      const shouldBreakCombo = streak > 0 && closeCount >= CLOSE_TRIES_BEFORE_COMBO_LOSS;

      setCloseAttempts((prev) => ({ ...prev, [currentWordKey]: closeCount }));

      if (shouldBreakCombo) {
        // Repeated near-misses ultimately count as a miss — treat it the same
        // way as a wrong answer: reveal the answer and give it the same
        // longer, softer display time.
        setTypingFeedback('wrong');
        setFeedbackEvent({ type: 'wrong', text: 'Not this time.', streak: 0, answer: currentWord.english });
        setInlineMessage('');
        setDifficultyByWord((prev) => ({
          ...prev,
          [currentWordKey]: {
            correct: prev[currentWordKey]?.correct ?? 0,
            misses: (prev[currentWordKey]?.misses ?? 0) + 1,
            seen: prev[currentWordKey]?.seen ?? 1,
          },
        }));
        setMissedWordKeys((prev) => new Set(prev).add(currentWordKey));
        setStreak(0);
        answerLockedRef.current = true;
        setIsAdvancing(true);
        pendingAdvanceTimeoutRef.current = setTimeout(() => {
          pendingAdvanceTimeoutRef.current = null;
          answerLockedRef.current = false;
          setIsAdvancing(false);
          advanceToNextWord();
        }, 2400);
        return;
      }

      setTypingFeedback('close');
      setFeedbackEvent({
        type: 'close',
        text: "So close — one more try before you lose your combo!",
        streak,
      });
      setInlineMessage('');
      return;
    }

    // Wrong — reveal answer gently and auto-advance, with extra time to read
    // it and a heads-up that the word isn't gone for good: it's queued for
    // review at the end of the round (see advanceToNextWord).
    answerLockedRef.current = true;
    setIsAdvancing(true);
    setTypingFeedback('wrong');
    setFeedbackEvent({ type: 'wrong', text: 'Not this time.', streak: 0, answer: currentWord.english });
    setInlineMessage('');
    setDifficultyByWord((prev) => ({
      ...prev,
      [currentWordKey]: {
        correct: prev[currentWordKey]?.correct ?? 0,
        misses: (prev[currentWordKey]?.misses ?? 0) + 1,
        seen: prev[currentWordKey]?.seen ?? 1,
      },
    }));
    setMissedWordKeys((prev) => new Set(prev).add(currentWordKey));
    setStreak(0);
    pendingAdvanceTimeoutRef.current = setTimeout(() => {
      pendingAdvanceTimeoutRef.current = null;
      answerLockedRef.current = false;
      setIsAdvancing(false);
      advanceToNextWord();
    }, 2400);

  }, [
    advanceToNextWord,
    allowSlashAlternatives,
    answeredWords,
    attempts,
    closeAttempts,
    currentWord,
    currentWordKey,
    isReviewMode,
    streak,
    isTypingStrictMode,
    typedAnswer,
  ]);

  useEffect(() => {
    getXP().then((storedXP) => {
      setXp(storedXP);

      let lvl = 1;
      while (storedXP >= xpForLevel(lvl + 1)) {
        lvl += 1;
      }

      setPreviousLevel(lvl);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (previousWordsRef.current === words) return;

    previousWordsRef.current = words;
    reset();
  }, [reset, words]);

  useEffect(() => {
    return () => {
      clearPendingAdvance();
    };
  }, [clearPendingAdvance]);

  useEffect(() => {
    if (level <= previousLevel) return;

    setLevelUpMessage(getLevelDisplayLabel(level));
    setPreviousLevel(level);

    const timeoutId = setTimeout(() => setLevelUpMessage(''), 1500);

    return () => clearTimeout(timeoutId);
  }, [level, previousLevel]);

  return {
    typedAnswer,
    setTypedAnswer,
    typingIndex,
    typingFeedback,
    firstTryCount,
    inlineMessage,
    feedback,
    handleSubmit,
    xp,
    sessionXp,
    streak,
    maxStreak,
    level,
    levelUpMessage,
    attempts,
    totalAttempts,
    correctAnswers: answeredWords.size,
    reset,
    goToNextWord,
    goToPreviousWord,
    canGoPrevious: typingIndex > 0,
    canGoNext: typingIndex < gameWords.length - 1,
    isAdvancing,
    feedbackEvent,
    currentWord,
    totalWords: gameWords.length,
    isReviewMode,
    isSessionComplete,
    strictMode: isTypingStrictMode,
    difficultyByWord,
    reshuffleRemaining,
    comboBonus,
    requestHint,
    currentHintCount,
    currentHintText,
  };
}
