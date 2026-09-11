import { useReducer } from 'react';

import type { Exercise } from './grammarExercises/GrammarExerciseUtils';

export const GRAMMAR_GAME_LIVES = 3;

export type GrammarAnswerSaveMessage = '' | 'saved' | 'reviewed' | 'unsaved';

export interface GrammarSessionState {
  selectedQuestions: Exercise[];
  currentQuestionIndex: number;
  userAnswer: string;
  incorrectAnswer: string;
  answerSaveMessage: GrammarAnswerSaveMessage;
  grammarSessionXp: number;
  grammarTotalXp: number;
  lastGrammarXpGain: number;
  isComplete: boolean;
  isGameMode: boolean;
  startedGameMode: boolean;
  gameModeJustUnlocked: boolean;
  completionUnlockResolved: boolean;
  lives: number;
  isGameOver: boolean;
  sessionMistakeCount: number;
}

export type GrammarSessionAction =
  | { type: 'RESET_SESSION'; questions: Exercise[]; gameMode: boolean }
  | { type: 'SYNC_GAME_MODE'; enabled: boolean }
  | { type: 'SET_TOTAL_XP'; totalXp: number }
  | { type: 'START_ANSWER'; answer: string }
  | {
      type: 'SAVE_CORRECT_ANSWER';
      saveMessage: Exclude<GrammarAnswerSaveMessage, ''>;
      xpGain: number;
      totalXp?: number;
    }
  | { type: 'FINISH_CORRECT_ANSWER' }
  | { type: 'MARK_INCORRECT'; marker: string }
  | { type: 'CLEAR_INCORRECT'; clearUserAnswer: boolean }
  | { type: 'RESET_AFTER_GAME_OVER' }
  | { type: 'START_CHALLENGE'; questions: Exercise[] }
  | { type: 'SET_COMPLETION_UNLOCK_RESOLVED'; resolved: boolean }
  | { type: 'MARK_GAME_MODE_UNLOCKED' }
  | { type: 'CLOSE_COMPLETION' };

export const createGrammarSessionState = (gameMode = false): GrammarSessionState => ({
  selectedQuestions: [],
  currentQuestionIndex: 0,
  userAnswer: '',
  incorrectAnswer: '',
  answerSaveMessage: '',
  grammarSessionXp: 0,
  grammarTotalXp: 0,
  lastGrammarXpGain: 0,
  isComplete: false,
  isGameMode: gameMode,
  startedGameMode: gameMode,
  gameModeJustUnlocked: false,
  completionUnlockResolved: false,
  lives: GRAMMAR_GAME_LIVES,
  isGameOver: false,
  sessionMistakeCount: 0,
});

export const grammarSessionReducer = (
  state: GrammarSessionState,
  action: GrammarSessionAction,
): GrammarSessionState => {
  switch (action.type) {
    case 'RESET_SESSION':
      return {
        ...createGrammarSessionState(action.gameMode),
        selectedQuestions: action.questions,
        grammarTotalXp: state.grammarTotalXp,
      };

    case 'SYNC_GAME_MODE':
      return state.isGameMode === action.enabled
        ? state
        : { ...state, isGameMode: action.enabled };

    case 'SET_TOTAL_XP':
      return { ...state, grammarTotalXp: action.totalXp };

    case 'START_ANSWER':
      return {
        ...state,
        userAnswer: action.answer,
        answerSaveMessage: '',
        lastGrammarXpGain: 0,
      };

    case 'SAVE_CORRECT_ANSWER':
      return {
        ...state,
        answerSaveMessage: action.saveMessage,
        grammarSessionXp: state.grammarSessionXp + action.xpGain,
        grammarTotalXp: action.totalXp ?? state.grammarTotalXp,
        lastGrammarXpGain: action.xpGain,
      };

    case 'FINISH_CORRECT_ANSWER': {
      const hasNextQuestion = state.currentQuestionIndex < state.selectedQuestions.length - 1;
      return {
        ...state,
        answerSaveMessage: '',
        lastGrammarXpGain: 0,
        userAnswer: hasNextQuestion ? '' : state.userAnswer,
        currentQuestionIndex: hasNextQuestion
          ? state.currentQuestionIndex + 1
          : state.currentQuestionIndex,
        isComplete: !hasNextQuestion,
        isGameMode: hasNextQuestion ? state.isGameMode : false,
      };
    }

    case 'MARK_INCORRECT': {
      const nextLives = state.isGameMode
        ? Math.max(0, state.lives - 1)
        : state.lives;
      return {
        ...state,
        answerSaveMessage: '',
        lastGrammarXpGain: 0,
        incorrectAnswer: action.marker,
        sessionMistakeCount: state.sessionMistakeCount + 1,
        lives: nextLives,
        isGameOver: state.isGameMode && nextLives === 0,
      };
    }

    case 'CLEAR_INCORRECT':
      return {
        ...state,
        incorrectAnswer: '',
        userAnswer: action.clearUserAnswer ? '' : state.userAnswer,
      };

    case 'RESET_AFTER_GAME_OVER':
      return {
        ...state,
        currentQuestionIndex: 0,
        lives: GRAMMAR_GAME_LIVES,
        userAnswer: '',
        incorrectAnswer: '',
        isGameOver: false,
      };

    case 'START_CHALLENGE':
      return {
        ...state,
        selectedQuestions: action.questions,
        currentQuestionIndex: 0,
        userAnswer: '',
        incorrectAnswer: '',
        answerSaveMessage: '',
        grammarSessionXp: 0,
        lastGrammarXpGain: 0,
        isComplete: false,
        isGameMode: true,
        startedGameMode: true,
        gameModeJustUnlocked: false,
        lives: GRAMMAR_GAME_LIVES,
        isGameOver: false,
        sessionMistakeCount: 0,
      };

    case 'SET_COMPLETION_UNLOCK_RESOLVED':
      return state.completionUnlockResolved === action.resolved
        ? state
        : { ...state, completionUnlockResolved: action.resolved };

    case 'MARK_GAME_MODE_UNLOCKED':
      return state.gameModeJustUnlocked
        ? state
        : { ...state, gameModeJustUnlocked: true };

    case 'CLOSE_COMPLETION':
      return {
        ...state,
        isComplete: false,
        completionUnlockResolved: false,
      };

    default:
      return state;
  }
};

export const useGrammarSession = (initialGameMode: boolean) =>
  useReducer(grammarSessionReducer, initialGameMode, createGrammarSessionState);
