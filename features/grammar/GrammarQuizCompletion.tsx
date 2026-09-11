import React, { useMemo } from 'react';

import assets from '../../assets';
import type { ThemeColors } from '../settings/ThemeContext';
import VocabularyCompletionModal, {
  type SessionResultBanner,
} from '../vocabulary/VocabularyCompletionModal';

interface GrammarQuizCompletionProps {
  visible: boolean;
  selectedQuestionCount: number;
  sessionXp: number;
  bonusXp?: number;
  onClaimXP?: () => Promise<unknown> | void;
  mistakeCount: number;
  startedGameMode: boolean;
  lives: number;
  gameModeJustUnlocked: boolean;
  backLabel: string;
  onReplay: () => void;
  onBack: () => void;
  onGoToAccount: () => void;
  colors: ThemeColors;
  isDarkMode: boolean;
}

const GrammarQuizCompletion: React.FC<GrammarQuizCompletionProps> = ({
  visible,
  selectedQuestionCount,
  sessionXp,
  bonusXp = 0,
  onClaimXP,
  mistakeCount,
  startedGameMode,
  lives,
  gameModeJustUnlocked,
  backLabel,
  onReplay,
  onBack,
  onGoToAccount,
  colors,
  isDarkMode,
}) => {
  const result = useMemo(() => {
    const totalAttempts = selectedQuestionCount + mistakeCount;
    const accuracyPercent = totalAttempts > 0
      ? Math.round((selectedQuestionCount / totalAttempts) * 100)
      : 100;
    const completedPerfectly = selectedQuestionCount > 0 && mistakeCount === 0;
    const clearedGameModeFlawlessly = startedGameMode && lives === 3 && mistakeCount === 0;
    const banner: SessionResultBanner | null = clearedGameModeFlawlessly
      ? {
          kind: 'record',
          kicker: 'All lives intact',
          emoji: '❤️',
          label: 'Perfect Round!',
          message: 'Game Mode cleared without a single miss.',
        }
      : gameModeJustUnlocked
        ? {
            kind: 'unlock',
            emoji: '🎮',
            label: 'Game Mode',
            message: 'Three lives, ten questions, bonus XP on every answer.',
          }
        : null;

    return { accuracyPercent, completedPerfectly, clearedGameModeFlawlessly, banner };
  }, [gameModeJustUnlocked, lives, mistakeCount, selectedQuestionCount, startedGameMode]);

  const primaryLabel = startedGameMode
    ? 'Retry Game Mode'
    : gameModeJustUnlocked
      ? 'Try Game Mode!'
      : 'Play Again';

  return (
    <VocabularyCompletionModal
      visible={visible}
      timerMode={false}
      startedTimerMode={false}
      isFirstCompletion={false}
      isPersonalBest={false}
      isPerfect={result.completedPerfectly}
      wordsLength={selectedQuestionCount}
      matchingSessionXp={sessionXp}
      bonusXp={bonusXp}
      onClaimXP={onClaimXP}
      statsItems={
        selectedQuestionCount > 0
          ? [
              {
                emoji: '🎯',
                value: `${Math.max(0, selectedQuestionCount - mistakeCount)}/${selectedQuestionCount}`,
                label: 'Correct',
              },
              startedGameMode
                ? { emoji: '❤️', value: `${lives}/3`, label: 'Lives left' }
                : { emoji: '📊', value: `${result.accuracyPercent}%`, label: 'Accuracy' },
              { emoji: '✨', value: sessionXp, label: 'XP' },
              ...(bonusXp > 0
                ? [{ emoji: '⭐', value: `+${bonusXp}`, label: 'Perfect bonus' }]
                : []),
            ]
          : [{ emoji: '✨', value: sessionXp, label: 'XP' }]
      }
      title={result.clearedGameModeFlawlessly ? 'Perfect Round!' : 'Great job!'}
      subtitle={
        result.clearedGameModeFlawlessly
          ? 'Game Mode beaten with every life still on the board.'
          : result.completedPerfectly
            ? 'No mistakes at all — amazing!'
            : startedGameMode
              ? 'You crushed Game Mode — nicely done!'
              : 'You answered every question — nicely done!'
      }
      image={result.completedPerfectly ? assets.comic : assets.good}
      banner={result.banner}
      primaryActionLabel={primaryLabel}
      onPrimaryAction={onReplay}
      onReplay={onReplay}
      secondaryActionLabel={backLabel}
      onSecondaryAction={onBack}
      colors={colors}
      isDarkMode={isDarkMode}
      onGoToAccount={onGoToAccount}
      sectionLabel="Grammar"
    />
  );
};

export default React.memo(GrammarQuizCompletion);
