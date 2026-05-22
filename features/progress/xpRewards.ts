export const XP_REWARDS = {
  grammarCorrect: 5,
  grammarGameModeBonus: 2,
  vocabularyTypingCorrect: 5,
  vocabularyTypingFirstTryBonus: 3,
  vocabularyTypingStrictModeBonus: 2,
  vocabularyTypingReviewBonus: 2,
  vocabularyMatchingPair: 1,
  flashcardLearned: 0,
  pronunciationPractice: 0,
} as const;

export type TypingComboReward = {
  streak: number;
  bonus: number;
  label: string;
};

export const TYPING_COMBO_XP_REWARDS: TypingComboReward[] = [
  { streak: 10, bonus: 5, label: 'Unstoppable combo' },
  { streak: 7, bonus: 3, label: 'Huge combo' },
  { streak: 5, bonus: 2, label: 'Great combo' },
  { streak: 3, bonus: 1, label: 'Combo started' },
];

export const getTypingComboReward = (streak: number): TypingComboReward =>
  TYPING_COMBO_XP_REWARDS.find((reward) => streak >= reward.streak) ?? { streak: 0, bonus: 0, label: '' };

export const getTypingAnswerXP = ({
  attempts,
  streak,
  isStrictMode,
  isReviewMode,
}: {
  attempts: number;
  streak: number;
  isStrictMode: boolean;
  isReviewMode: boolean;
}) => {
  const comboReward = getTypingComboReward(streak);
  const firstTryBonus = attempts === 1 ? XP_REWARDS.vocabularyTypingFirstTryBonus : 0;
  const strictBonus = isStrictMode ? XP_REWARDS.vocabularyTypingStrictModeBonus : 0;
  const reviewBonus = isReviewMode ? XP_REWARDS.vocabularyTypingReviewBonus : 0;
  const xpGain =
    XP_REWARDS.vocabularyTypingCorrect +
    firstTryBonus +
    strictBonus +
    reviewBonus +
    comboReward.bonus;

  return {
    xpGain,
    comboReward,
    firstTryBonus,
    strictBonus,
    reviewBonus,
  };
};
