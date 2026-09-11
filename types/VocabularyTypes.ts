export type Word = {
  english: string;
  french: string;
  alternatives?: string[];
  sourceLesson?: {
    id?: string | number;
    title?: string;
  };
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

  bestTimeByCategory: Record<string, number>;
  hasCompletedOnce: boolean;
  consecutiveCorrect: number;
  incorrectPair: string[] | null;
  hasAdvancedSet: boolean;

  isInputLocked?: boolean;
  lastCompletionWasPersonalBest?: boolean;


  lastCompletionPreviousBest?: number | null;
};
