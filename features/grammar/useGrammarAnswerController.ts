import { useCallback, type Dispatch, type RefObject } from 'react';
import type { View } from 'react-native';

import type { GrammarLesson } from '../../types/lessonTypes';
import { markPracticeActivityToday } from '../progress/xpStorage';
import { XP_REWARDS, REPLAY_XP_FRACTION } from '../progress/xpRewards';
import { triggerSuccessHaptic, triggerWarningHaptic } from '../shared/haptics';
import {
  getGrammarLessonProgressKey,
  recordGrammarCorrectAnswer,
} from './grammarProgressStorage';
import type { Exercise, ExerciseMode } from './grammarExercises/GrammarExerciseUtils';
import type { GrammarSessionAction } from './grammarSessionReducer';
import type { ShowGrammarFeedback } from './useGrammarFeedback';
import type { ScheduleGrammarQuizTimer } from './useGrammarQuizTimers';

interface GrammarAnswerControllerOptions {
  lesson: GrammarLesson;
  exerciseMode: ExerciseMode;
  selectedQuestions: Exercise[];
  currentQuestionIndex: number;
  userAnswer: string;
  isGameMode: boolean;
  lives: number;
  isGrammarSpeechEnabled: boolean;
  activeContentRef: RefObject<View | null>;
  containerRef: RefObject<View | null>;
  fallbackTop: number;
  fallbackHeight: number;
  dispatchSession: Dispatch<GrammarSessionAction>;
  playSuccess: () => void;
  speakAnswer: (text: string, options: { rate: number; pitch: number }) => void;
  scheduleTimer: ScheduleGrammarQuizTimer;
  showSuccessFeedback: ShowGrammarFeedback;
}

/**
 * Coordinates answer-domain behavior without knowing how the quiz is laid
 * out or rendered. The screen supplies the measurement refs and side-effect
 * adapters; this hook owns correctness, persistence, XP, lives, and advance.
 */
export const useGrammarAnswerController = ({
  lesson,
  exerciseMode,
  selectedQuestions,
  currentQuestionIndex,
  userAnswer,
  isGameMode,
  lives,
  isGrammarSpeechEnabled,
  activeContentRef,
  containerRef,
  fallbackTop,
  fallbackHeight,
  dispatchSession,
  playSuccess,
  speakAnswer,
  scheduleTimer,
  showSuccessFeedback,
}: GrammarAnswerControllerOptions) => {
  const handleAnswer = useCallback(async (option: string) => {
    if (userAnswer !== '') return;
    const current = selectedQuestions[currentQuestionIndex];
    if (!current) return;

    dispatchSession({ type: 'START_ANSWER', answer: option });
    const isTrueFalse = typeof current.answer === 'boolean';
    const isCorrect = isTrueFalse
      ? (option === 'True') === current.answer
      : option === current.answer;

    if (!isCorrect) {
      triggerWarningHaptic();
      dispatchSession({ type: 'MARK_INCORRECT', marker: option });
      if (isGameMode && lives <= 1) {
        scheduleTimer('gameOver', () => {
          dispatchSession({ type: 'RESET_AFTER_GAME_OVER' });
        }, 10000);
      }
      scheduleTimer('incorrect', () => {
        dispatchSession({ type: 'CLEAR_INCORRECT', clearUserAnswer: true });
      }, 1100);
      return;
    }

    triggerSuccessHaptic();
    // Fires alongside the haptic, before any persistence: the storage round trips below
    // are slow enough on device that waiting for them made the sound lag the answer.
    if (currentQuestionIndex < selectedQuestions.length - 1) playSuccess();

    const lessonProgressKey = getGrammarLessonProgressKey(current.sourceLesson ?? lesson);
    const answerProgressKey = `${exerciseMode}:${current.question}:${String(current.answer)}`;

    void markPracticeActivityToday(`grammar:${lessonProgressKey}:${answerProgressKey}`);
    const saveMessage = await recordGrammarCorrectAnswer(lessonProgressKey, answerProgressKey);
    const baseXpGain = XP_REWARDS.grammarCorrect + (isGameMode ? XP_REWARDS.grammarGameModeBonus : 0);
    // 'reviewed' means this exact question was already answered correctly before — still
    // give a reduced reward so replaying a lesson stays worthwhile instead of a dead end.
    const xpGain = saveMessage === 'saved'
      ? baseXpGain
      : saveMessage === 'reviewed'
        ? Math.round(baseXpGain * REPLAY_XP_FRACTION)
        : 0;

    // XP is only persisted to the account once the lesson is actually completed
    // (see GrammarQuiz's completion effect) — not per answer, so quitting mid-lesson
    // doesn't bank partial XP. grammarSessionXp still accumulates for the in-session display.
    dispatchSession({
      type: 'SAVE_CORRECT_ANSWER',
      saveMessage,
      xpGain,
    });

    if (isGrammarSpeechEnabled && typeof current.answer === 'string' && current.answer.trim()) {
      const answerText = current.answer.trim();
      scheduleTimer('speech', () => {
        speakAnswer(answerText, { rate: 0.88, pitch: 1.0 });
      }, 700);
    }

    await showSuccessFeedback({
      activeContentRef,
      containerRef,
      fallbackTop,
      fallbackHeight,
      onHidden: () => dispatchSession({ type: 'FINISH_CORRECT_ANSWER' }),
    });
  }, [
    activeContentRef,
    containerRef,
    currentQuestionIndex,
    dispatchSession,
    exerciseMode,
    fallbackHeight,
    fallbackTop,
    isGameMode,
    isGrammarSpeechEnabled,
    lesson,
    lives,
    playSuccess,
    scheduleTimer,
    selectedQuestions,
    showSuccessFeedback,
    speakAnswer,
    userAnswer,
  ]);

  const handleExerciseIncorrect = useCallback((marker: string) => {
    triggerWarningHaptic();
    dispatchSession({ type: 'MARK_INCORRECT', marker });
    if (isGameMode && lives <= 1) {
      scheduleTimer('gameOver', () => {
        dispatchSession({ type: 'RESET_AFTER_GAME_OVER' });
      }, 10000);
    }
    scheduleTimer('incorrect', () => {
      dispatchSession({ type: 'CLEAR_INCORRECT', clearUserAnswer: false });
    }, 1100);
  }, [dispatchSession, isGameMode, lives, scheduleTimer]);

  return { handleAnswer, handleExerciseIncorrect };
};
