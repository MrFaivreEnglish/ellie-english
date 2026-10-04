import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  getXP,
  grantXP,
  previewGrantXP,
  hasWordXpAwardedToday,
  markWordXpAwardedToday,
} from '../progress/xpStorage';
import { recordPracticeToday } from '../progress/streakStorage';
import { recordReviewMistake, recordReviewSuccess } from './reviewWordsStorage';

import type { Word } from '../../types/VocabularyTypes';
import { useTheme } from '../settings/ThemeContext';
import { getTypingAnswerXP, getTypingComboReward, PERFECT_RUN_XP_MULTIPLIER, getReplayXpFraction } from '../progress/xpRewards';
import { getLevelDisplayLabel, xpForLevel } from '../progress/xpLevels';

type FeedbackType = 'correct' | 'wrong' | 'close';

type DifficultyStats = {
  correct: number;
  misses: number;
  seen: number;
};

type TypingGameOptions = {
  allowSlashAlternatives?: boolean;
  lessonDifficulty?: number | null;
  // Shown next to a missed word in Words to review. Mixed practice words carry their own.
  lessonTitle?: string;
};

// A second near-miss on the same word shows the answer and moves on, combo or not.
const CLOSE_TRIES_BEFORE_REVEAL = 2;

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

// Lessons write a free choice between synonyms two ways — "A cab / A taxi" and
// "Trendy, Stylish" — so both separators have to open up the options. Only the slash used
// to, which meant a comma prompt demanded every synonym at once ("trendy stylish").
const LISTED_ALTERNATIVE_SEPARATOR = /\s*[\/,]\s*/;

// A parenthetical is a gloss on the answer, not part of it: "Physical Education (PE)",
// "A (cotton) plantation", "Prison (UK) / Jail (US)". Normalising only dropped the brackets
// and kept their contents, so the gloss stayed compulsory.
const PARENTHETICAL = /\([^)]*\)/;

const buildCorrectAnswers = (
  answer: string,
  normalizeAnswer: (text: string) => string,
  allowListedAlternatives: boolean,
  wordAlternatives: string[] = []
) => {
  const variantsOf = (text: string) => {
    const forms = [normalizeAnswer(text)];

    if (/[\/-]/.test(text)) forms.push(normalizeAnswer(text.replace(/[\/-]+/g, ' ')));
    if (/^(a|an|the)\s+/i.test(text)) forms.push(normalizeAnswer(text.replace(/^(a|an|the)\s+/i, '')));

    if (allowListedAlternatives && /[\/,]/.test(text)) {
      for (const part of text.split(LISTED_ALTERNATIVE_SEPARATOR)) {
        const option = part.trim();
        if (!option) continue;
        forms.push(normalizeAnswer(option));
        // Each option carries its own article ("A cab / A taxi"), so strip it per option too.
        if (/^(a|an|the)\s+/i.test(option)) {
          forms.push(normalizeAnswer(option.replace(/^(a|an|the)\s+/i, '')));
        }
      }
    }

    return forms;
  };

  const withoutGloss = PARENTHETICAL.test(answer)
    ? answer.replace(/\([^)]*\)/g, ' ').replace(/\s+/g, ' ').trim()
    : '';

  const baseAnswers = [answer, withoutGloss].filter(Boolean).flatMap(variantsOf);

  const altAnswers = wordAlternatives.flatMap((alt) => {
    const altFull = normalizeAnswer(alt);
    const altSep = /[\/-]/.test(alt) ? normalizeAnswer(alt.replace(/[\/-]+/g, ' ')) : '';
    return [altFull, altSep].filter(Boolean);
  });

  return Array.from(new Set([...baseAnswers, ...altAnswers].filter(Boolean)));
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
  const replayXpFraction = getReplayXpFraction(options.lessonDifficulty);
  const lessonTitle = options.lessonTitle;
  // Typing is the one mode where a mistake clearly belongs to one word, so it's the only
  // one that fills Words to review. A hint counts as a mistake: the word wasn't known.
  const recordMistakeForReview = useCallback((word: Word) => {
    void recordReviewMistake(word, word.sourceLesson?.title ?? lessonTitle);
  }, [lessonTitle]);
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
  // The exact figure a claim is worth, once resolved at session end. Null while playing,
  // when only the optimistic running total above is known.
  const [resolvedSessionXp, setResolvedSessionXp] = useState<number | null>(null);
  const [wasPerfectRun, setWasPerfectRun] = useState(false);
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
  const pendingXpAwardsRef = useRef<{ wordKey: string; xpGain: number }[]>([]);
  const sessionXpAwardedRef = useRef(false);
  const perfectRunRef = useRef(false);
  // Bridges to previewPendingTypingXp, which is declared after the effect that needs it.
  const previewPendingTypingXpRef = useRef<(() => Promise<number>) | null>(null);
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
    if (current === 0) recordMistakeForReview(currentWord);
  }, [currentWord, currentWordKey, hintsUsed, recordMistakeForReview]);

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
    pendingXpAwardsRef.current = [];
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

      // Practice counts toward the streak as soon as it happens, independently of the
      // end-screen XP claim — the student did the work either way.
      void recordPracticeToday();
      void recordReviewSuccess(currentWord);

      if (!alreadyAnswered) {
        awardedWordKeysRef.current.add(currentWordKey);
        const alreadyAwardedToday = await hasWordXpAwardedToday(currentWordKey);

        if (!alreadyAwardedToday) {
          // XP is only persisted to the account once, at session completion (see the
          // isSessionComplete effect below) — not per word, so quitting mid-session doesn't
          // bank partial XP or consume the word's daily-award slot for nothing.
          pendingXpAwardsRef.current.push({ wordKey: currentWordKey, xpGain });
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
      // This used to need a running combo: without one, "So close" repeated for as long as
      // the student kept misspelling, they never saw the answer, and the word never reached
      // Words to review.
      const shouldRevealAnswer = closeCount >= CLOSE_TRIES_BEFORE_REVEAL;

      setCloseAttempts((prev) => ({ ...prev, [currentWordKey]: closeCount }));

      if (shouldRevealAnswer) {
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
        recordMistakeForReview(currentWord);
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
        text: streak > 0 ? 'So close — one more try before you lose your combo!' : 'So close — one more try!',
        streak,
      });
      setInlineMessage('');
      return;
    }




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
    recordMistakeForReview(currentWord);
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
    recordMistakeForReview,
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

  // Persist the session's accumulated XP once the round is actually finished — see the
  // pendingXpAwardsRef push above for why this isn't done per word.
  useEffect(() => {
    if (!isSessionComplete) {
      sessionXpAwardedRef.current = false;
      setWasPerfectRun(false);
      perfectRunRef.current = false;
      setResolvedSessionXp(null);
      return;
    }

    const isPerfectRun = answeredWords.size > 0 && firstTryCount === answeredWords.size;
    setWasPerfectRun(isPerfectRun);
    perfectRunRef.current = isPerfectRun;
    // Resolve the real figure now (read-only) so the end screen shows what claiming will
    // actually award, rather than the optimistic running total.
    void previewPendingTypingXpRef.current?.();
  }, [isSessionComplete, answeredWords, firstTryCount]);

  // Banked when the student claims it on the end screen — leaving without claiming
  // forfeits the session's XP (and leaves the per-word "awarded today" marks unset).
  // Resolves what this session is actually worth. The running sessionXp is optimistic — it
  // ignores the perfect-run bonus and the already-earned-today discount, and it rounds the
  // sum where awarding rounds each word, so the two can disagree. With `persist` false this
  // only reads, letting the end screen show the true figure before anything is banked.
  const resolvePendingTypingXp = useCallback(async (persist: boolean) => {
    const pending = pendingXpAwardsRef.current;
    if (pending.length === 0) {
      setResolvedSessionXp(0);
      return 0;
    }

    const isPerfectRun = perfectRunRef.current;
    let total = 0;
    for (const award of pending) {
      const fullAmount = isPerfectRun ? Math.round(award.xpGain * PERFECT_RUN_XP_MULTIPLIER) : award.xpGain;
      // Already earned full XP for this word today — still give a reduced replay reward
      // instead of nothing, so redoing a word list stays worthwhile.
      if (await hasWordXpAwardedToday(award.wordKey)) {
        total += Math.round(fullAmount * replayXpFraction);
        continue;
      }
      if (persist) await markWordXpAwardedToday(award.wordKey);
      total += fullAmount;
    }

    // The session banks as a single award, so the day's soft cap applies to the whole
    // total at once — resolve it here so the end screen shows what claiming really gives.
    const granted = persist ? await grantXP(total) : await previewGrantXP(total);

    setResolvedSessionXp(granted);
    return granted;
  }, [replayXpFraction]);

  // Read-only: what claiming will give, without awarding or consuming the pending list.
  const previewPendingTypingXp = useCallback(
    () => resolvePendingTypingXp(false),
    [resolvePendingTypingXp]
  );
  previewPendingTypingXpRef.current = previewPendingTypingXp;

  const commitPendingTypingXp = useCallback(async () => {
    if (sessionXpAwardedRef.current) return resolvedSessionXp ?? 0;
    sessionXpAwardedRef.current = true;

    if (pendingXpAwardsRef.current.length === 0) {
      setResolvedSessionXp(0);
      return 0;
    }
    // resolvePendingTypingXp banks the total itself when persisting, so this only has to
    // refresh the displayed lifetime figure (which drives the level-up message below).
    const total = await resolvePendingTypingXp(true);
    pendingXpAwardsRef.current = [];

    if (total > 0) setXp(await getXP());

    return total;
  }, [resolvePendingTypingXp, resolvedSessionXp]);

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
    wasPerfectRun,
    commitPendingTypingXp,
    previewPendingTypingXp,
    resolvedSessionXp,
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
