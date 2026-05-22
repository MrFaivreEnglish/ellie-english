import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAudioPlayer } from 'expo-audio';
import { getXP, addXP, hasWordXpAwardedToday, markWordXpAwardedToday } from '../progress/xpStorage';
import type { Word } from '../../types/VocabularyTypes';
import { useTheme } from '../settings/ThemeContext';
import { BEST_SUCCESS_SOUND, SOUND_EFFECT_OPTIONS, replaySoundEffect } from '../shared/soundEffects';
import { getTypingAnswerXP } from '../progress/xpRewards';
import { xpForLevel } from '../progress/xpLevels';

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
    .replace(/['-]/g, ' ')
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
  allowSlashAlternatives: boolean
) => {
  const fullAnswer = normalizeAnswer(answer);

  if (!allowSlashAlternatives || !answer.includes('/')) {
    return [fullAnswer];
  }

  const alternatives = answer
    .split('/')
    .map((part) => normalizeAnswer(part))
    .filter(Boolean);

  return Array.from(new Set([fullAnswer, ...alternatives]));
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

const buildRewardText = (attempts: number, comboLabel: string) => {
  if (comboLabel) return comboLabel;
  if (attempts === 1) return 'Strong recall';
  return 'Answer saved';
};

export function useTypingGame(words: Word[], options: TypingGameOptions = {}) {
  const { isTypingStrictMode } = useTheme();
  const allowSlashAlternatives = options.allowSlashAlternatives ?? true;
  const levelUpPlayer = useAudioPlayer(BEST_SUCCESS_SOUND, SOUND_EFFECT_OPTIONS);
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
  const [difficultyByWord, setDifficultyByWord] = useState<Record<string, DifficultyStats>>({});
  const [previousLevel, setPreviousLevel] = useState(1);
  const [levelUpMessage, setLevelUpMessage] = useState('');
  const [isAdvancing, setIsAdvancing] = useState(false);
  const [feedbackEvent, setFeedbackEvent] = useState<null | {
    type: FeedbackType;
    text: string;
    streak: number;
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

  const currentWord = gameWords[typingIndex] ?? null;
  const currentWordKey = currentWord ? wordKey(currentWord) : null;
  const totalAttempts = useMemo(
    () => Object.values(attempts).reduce((total, count) => total + count, 0),
    [attempts]
  );
  const mistakes = useMemo(
    () => Object.values(difficultyByWord).reduce((total, stats) => total + stats.misses, 0),
    [difficultyByWord]
  );
  const masteredCount = useMemo(
    () => Object.values(difficultyByWord).filter((stats) => stats.correct > 0 && stats.misses === 0).length,
    [difficultyByWord]
  );
  const rewardPreview = useMemo(() => {
    if (!currentWordKey) return '';

    const alreadyAnswered =
      answeredWords.has(currentWordKey) || awardedWordKeysRef.current.has(currentWordKey);

    if (alreadyAnswered) return 'Practice run';

    const nextAttempt = (attempts[currentWordKey] || 0) + 1;
    return nextAttempt === 1 ? 'Try from memory' : 'Fix this word';
  }, [answeredWords, attempts, currentWordKey]);
  const sessionHighlight = useMemo(() => {
    const answeredKeys = Array.from(answeredWords);

    if (answeredKeys.length === 0) return 'First perfect word is waiting';

    const perfectWords = answeredKeys.filter((key) => (attempts[key] || 0) <= 1).length;
    const recoveredKeys = answeredKeys
      .filter((key) => (attempts[key] || 0) > 1)
      .sort((a, b) => (attempts[b] || 0) - (attempts[a] || 0));

    if (recoveredKeys.length > 0) {
      const hardestWord = words.find((word) => wordKey(word) === recoveredKeys[0]);

      if (hardestWord) {
        return `Hardest word fixed: ${hardestWord.english}`;
      }
    }

    return `Perfect words: ${perfectWords}`;
  }, [answeredWords, attempts, words]);

  const playLevelUpSound = useCallback(() => {
    replaySoundEffect(levelUpPlayer);
  }, [levelUpPlayer]);

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
    const correctAnswers = buildCorrectAnswers(currentWord.english, normalizeAnswer, allowSlashAlternatives);
    const user = isTypingStrictMode
      ? normalizeStrictAnswer(typedAnswer)
      : normalizeLenientAnswer(typedAnswer);
    const closeUser = normalizeLenientAnswer(typedAnswer);
    const closeCorrect = normalizeLenientAnswer(currentWord.english);
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
      const { xpGain, comboReward } = getTypingAnswerXP({
        attempts: newAttempts,
        streak: newStreak,
        isStrictMode: isTypingStrictMode,
        isReviewMode,
      });
      const rewardText = alreadyAnswered
        ? 'Correct!'
        : buildRewardText(newAttempts, comboReward.label);

      setStreak(newStreak);
      setMaxStreak((prev) => Math.max(prev, newStreak));
      setFeedbackEvent({ type: 'correct', text: rewardText, streak: newStreak });
      setFeedback(newAttempts === 1 ? 'Perfect answer' : 'Good recovery');

      if (comboReward.bonus > 0) {
        setInlineMessage(comboReward.label);
      } else if (!alreadyAnswered) {
        setInlineMessage(newAttempts === 1 ? 'Perfect answer' : 'Good recovery');
      } else {
        setInlineMessage('Already cleared');
      }

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

    const close = isCloseMatch(closeUser, closeCorrect);

    if (close) {
      const closeCount = (closeAttempts[currentWordKey] || 0) + 1;
      const shouldBreakCombo = streak > 0 && closeCount >= CLOSE_TRIES_BEFORE_COMBO_LOSS;
      const remainingCloseTries = Math.max(CLOSE_TRIES_BEFORE_COMBO_LOSS - closeCount, 0);

      setCloseAttempts((prev) => ({ ...prev, [currentWordKey]: closeCount }));
      setTypingFeedback('close');
      setFeedbackEvent({
        type: 'close',
        text: shouldBreakCombo
          ? 'Combo lost'
          : isTypingStrictMode
            ? 'Almost. Strict mode checks accents and punctuation.'
            : 'Almost right. Check spelling.',
        streak: shouldBreakCombo ? 0 : streak,
      });

      if (shouldBreakCombo) {
        setInlineMessage('Still close. This word will return in review.');
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
        return;
      }

      if (streak > 0) {
        setInlineMessage(
          `${remainingCloseTries} more close ${remainingCloseTries === 1 ? 'try' : 'tries'} before losing combo.`
        );
      } else {
        setInlineMessage('Almost. Try once more.');
      }
      return;
    } else {
      setTypingFeedback('wrong');
      setFeedbackEvent({ type: 'wrong', text: newAttempts > 2 ? 'Answer revealed' : 'Keep trying', streak: 0 });
      setInlineMessage(newAttempts > 2 ? `Answer: ${currentWord.english}` : 'This word will return in review');
    }

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
    });
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

    void playLevelUpSound();
    setLevelUpMessage(`LEVEL ${level}`);
    setPreviousLevel(level);

    const timeoutId = setTimeout(() => setLevelUpMessage(''), 1500);

    return () => clearTimeout(timeoutId);
  }, [level, playLevelUpSound, previousLevel]);

  return {
    typedAnswer,
    setTypedAnswer,
    typingIndex,
    typingFeedback,
    inlineMessage,
    feedback,
    rewardPreview,
    sessionHighlight,
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
    mistakes,
    masteredCount,
    reset,
    goToNextWord,
    goToPreviousWord,
    canGoPrevious: typingIndex > 0,
    canGoNext: !!currentWord && !isSessionComplete,
    isAdvancing,
    feedbackEvent,
    currentWord,
    totalWords: gameWords.length,
    isReviewMode,
    isSessionComplete,
    strictMode: isTypingStrictMode,
    difficultyByWord,
  };
}
