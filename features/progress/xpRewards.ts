export const XP_REWARDS = {
  // Grammar: once-ever per question (permanent dedup), so each answer is worth more
  grammarCorrect: 7,
  grammarGameModeBonus: 3,         // 3 lives, pressure — deserves a bigger bonus

  // Typing: daily per word — base rates stay, combos already reward skill
  vocabularyTypingCorrect: 5,
  vocabularyTypingFirstTryBonus: 3,
  vocabularyTypingStrictModeBonus: 2,
  vocabularyTypingReviewBonus: 2,

  // Matching: boosted to close the 4× gap with typing (daily per word+category)
  vocabularyMatchingPair: 1,          // unused placeholder
  vocabularyMatchingCleanPair: 4,     // was 2 — clean pair takes real memory effort
  vocabularyMatchingRetryPair: 2,     // was 1 — still rewarded for eventual success
  vocabularyMatchingTimerCleanPair: 6, // was 3 — timer adds meaningful pressure
  vocabularyMatchingTimerRetryPair: 2, // was 1
  vocabularyMatchingTimerBestBonus: 12, // was 5 — beating a PB should feel significant

  flashcardLearned: 0,        // not yet wired up
  pronunciationPractice: 0,   // not yet wired up
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
