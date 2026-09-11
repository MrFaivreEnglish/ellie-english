// One answered item — a grammar question, a typed word, a matched pair — is worth roughly
// the same everywhere, so no single mode is the "efficient" one to farm. Bonuses modulate
// that base; they must never dominate it (the typing stack used to be worth 2.4x its own
// base, making typing pay ~3x what a grammar question did for comparable effort).
export const XP_REWARDS = {

  grammarCorrect: 7,
  grammarGameModeBonus: 3,


  // Typing is production rather than recognition, so it sits slightly above grammar.
  vocabularyTypingCorrect: 6,
  vocabularyTypingFirstTryBonus: 2,
  vocabularyTypingStrictModeBonus: 1,
  vocabularyTypingReviewBonus: 1,


  vocabularyMatchingCleanPair: 4,
  vocabularyMatchingRetryPair: 2,
  vocabularyMatchingTimerCleanPair: 6,
  vocabularyMatchingTimerRetryPair: 2,
  vocabularyMatchingTimerBestBonus: 12,

  flashcardLearned: 0,
  pronunciationPractice: 0,
} as const;

// Applied to a session/round's earned XP when it's completed with zero mistakes,
// across Grammar (Quiz/Fill/Reorder/Translate) and Vocabulary (Typing/Matching).
export const PERFECT_RUN_XP_MULTIPLIER = 1.5;

// Applied instead of 0 when an item (question/word/pair) was already awarded its full XP
// before (same lesson replayed, or the same word/pair earned today) — keeps replaying an
// exercise worthwhile instead of a dead end. Used as-is for Grammar, which has no difficulty
// rating; Vocabulary scales it by the lesson's 1-3 star difficulty (see getReplayXpFraction).
export const REPLAY_XP_FRACTION = 0.25;

// Vocab lessons are rated 1-3 stars (VocabularyScreen's difficultyMap) — harder lessons keep
// more of their value on replay, since the content itself stays worth more to redo.
const VOCAB_REPLAY_XP_FRACTION_BY_DIFFICULTY: Record<number, number> = {
  1: 0.15,
  2: 0.25,
  3: 0.35,
};

export const getReplayXpFraction = (difficulty?: number | null) =>
  (difficulty != null && VOCAB_REPLAY_XP_FRACTION_BY_DIFFICULTY[difficulty]) || REPLAY_XP_FRACTION;

// Per-item dedupe alone can't bound a day: a student who keeps starting fresh content (or
// replays an arcade round, where there are no items to dedupe) still earns at full rate for
// as long as they keep going. These bands make the day itself self-limiting — the first
// band covers a genuinely full revision evening (roughly a grammar lesson, a typing lesson
// and a matching round, all perfect ≈ 600 XP), and everything past it is worth steadily
// less, so grinding stops being a faster route to a level than coming back tomorrow.
// Limits are cumulative and expressed in XP actually banked today, not XP attempted.
export const DAILY_XP_BANDS: Array<{ upTo: number; rate: number }> = [
  { upTo: 700, rate: 1 },
  { upTo: 1400, rate: 0.5 },
  { upTo: Number.POSITIVE_INFINITY, rate: 0.25 },
];

/**
 * What `amount` is actually worth given how much has already been banked today. Applied
 * piecewise, so a single award that crosses a band boundary is split across the bands
 * rather than being pushed wholly into one of them.
 */
export const applyDailyXpTaper = (amount: number, grantedToday: number) => {
  let remaining = Number.isFinite(amount) ? Math.max(0, Math.floor(amount)) : 0;
  let banked = Number.isFinite(grantedToday) ? Math.max(0, Math.floor(grantedToday)) : 0;
  let granted = 0;

  for (const band of DAILY_XP_BANDS) {
    if (remaining <= 0) break;

    const roomInBand = band.upTo - banked;
    if (roomInBand <= 0) continue;

    // How much raw XP it takes to fill this band's remaining room at its rate.
    const rawThatFits = roomInBand / band.rate;
    const rawUsed = Math.min(remaining, rawThatFits);
    const grantedHere = rawUsed * band.rate;

    granted += grantedHere;
    banked += grantedHere;
    remaining -= rawUsed;
  }

  return Math.round(granted);
};

export type TypingComboReward = {
  streak: number;
  bonus: number;
  label: string;
};

export const TYPING_COMBO_XP_REWARDS: TypingComboReward[] = [
  { streak: 10, bonus: 4, label: 'Unstoppable combo' },
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
