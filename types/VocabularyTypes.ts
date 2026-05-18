export type Word = {
  english: string;
  french: string;
};

export type GameCard = {
  id: string;
  text: string;
  type: 'english' | 'french';
  pairId: number;
};

export type MatchingGamePairs = {
  english: GameCard[];
  french: GameCard[];
};

export type GameState = {
  currentSet: number;
  matchedPairs: string[];
  selectedCard: GameCard | null;
  totalScore: number;
  timer: number;
  // Per-category best times for the current lesson session; keys are category names (use 'All' when no selection)
  bestTimeByCategory: Record<string, number>;
  hasCompletedOnce: boolean;
  consecutiveCorrect: number;
  incorrectPair: string[] | null;
  hasAdvancedSet: boolean;
  // When true, taps are temporarily disabled (e.g., after an incorrect pair) for a short lockout window
  isInputLocked?: boolean;
  lastCompletionWasPersonalBest?: boolean;
};
