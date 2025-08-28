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
  bestTime: number | null;
  hasCompletedOnce: boolean;
  consecutiveCorrect: number;
  incorrectPair: string[] | null;
  hasAdvancedSet: boolean;
};