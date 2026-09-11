import { useEffect, useState } from 'react';
import { getXP } from '../../progress/xpStorage';
import { clearLocalStudentProgress } from '../../progress/studentProgressStorage';
import { getGrammarProgressSummary } from '../../grammar/grammarProgressStorage';
import { getLearnedFlashcardSummary } from '../../vocabulary/flashcardProgressStorage';
import { getVocabularyTimerBests } from '../../vocabulary/vocabularyTimerStorage';
import { type QaSnapshot, emptyQaSnapshot } from './adminSharedTypes';
import { confirmDestructive } from './adminDialogs';

export function useQaSnapshot(chapterLinkOverridesCount: number, lessonsCount: number) {
  const [qaSnapshot, setQaSnapshot] = useState<QaSnapshot>(emptyQaSnapshot);
  const [qaMessage, setQaMessage] = useState('');

  const loadQaSnapshot = async () => {
    const [xp, learnedSummary, grammarSummary, timerBests] = await Promise.all([
      getXP(),
      getLearnedFlashcardSummary(),
      getGrammarProgressSummary(),
      getVocabularyTimerBests(),
    ]);

    setQaSnapshot({
      xp,
      learnedWords: learnedSummary.totalLearned,
      learnedLessons: learnedSummary.lessonCount,
      grammarAnswers: grammarSummary.totalCorrectAnswers,
      grammarLessons: grammarSummary.lessonCount,
      timerBestCount: Object.keys(timerBests).length,
    });
  };

  useEffect(() => {
    void loadQaSnapshot();
  }, []);

  const handleClearLocalProgress = () => {
    confirmDestructive(
      'Clear local progress',
      'Clear XP, learnt words, grammar answers, timer records, and Shiny Ellie progress on this device?',
      async () => {
        await clearLocalStudentProgress();
        await loadQaSnapshot();
        setQaMessage('Local student progress cleared.');
      }
    );
  };

  return {
    qaSnapshot,
    qaMessage,
    chapterLinkOverridesCount,
    lessonsCount,
    loadQaSnapshot,
    handleClearLocalProgress,
  };
}
