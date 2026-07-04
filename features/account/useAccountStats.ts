import { useEffect, useState } from 'react';
import { getXP } from '../progress/xpStorage';
import { getStreak, type StreakData } from '../progress/streakStorage';
import { getLearnedFlashcardSummary, type LearnedFlashcardSummary } from '../vocabulary/flashcardProgressStorage';
import { getGrammarProgressSummary, type GrammarProgressSummary } from '../grammar/grammarProgressStorage';
import { getVocabularyTimerBests } from '../vocabulary/vocabularyTimerStorage';

const emptyLearnedSummary: LearnedFlashcardSummary = {
  totalLearned: 0,
  lessonCount: 0,
  learnedToday: 0,
};

const emptyGrammarSummary: GrammarProgressSummary = {
  totalCorrectAnswers: 0,
  lessonCount: 0,
  correctToday: 0,
};

const emptyStreak: StreakData = {
  currentStreak: 0,
  longestStreak: 0,
  lastPracticeDate: '',
};

export const useAccountStats = (sessionId: string | null | undefined, isSyncing: boolean) => {
  const [localXP, setLocalXP] = useState(0);
  const [learnedSummary, setLearnedSummary] = useState<LearnedFlashcardSummary>(emptyLearnedSummary);
  const [grammarSummary, setGrammarSummary] = useState<GrammarProgressSummary>(emptyGrammarSummary);
  const [streak, setStreak] = useState<StreakData>(emptyStreak);
  const [timerBestCount, setTimerBestCount] = useState(0);

  useEffect(() => {
    let active = true;

    Promise.all([
      getXP(),
      getStreak(),
      getLearnedFlashcardSummary(),
      getGrammarProgressSummary(),
      getVocabularyTimerBests(),
    ]).then(([xp, nextStreak, nextLearnedSummary, nextGrammarSummary, timerBests]) => {
      if (!active) return;

      setLocalXP(xp);
      setStreak(nextStreak);
      setLearnedSummary(nextLearnedSummary);
      setGrammarSummary(nextGrammarSummary);
      setTimerBestCount(Object.keys(timerBests).length);
    }).catch(() => {});

    return () => {
      active = false;
    };
  }, [sessionId, isSyncing]);

  return { localXP, learnedSummary, grammarSummary, streak, timerBestCount };
};
