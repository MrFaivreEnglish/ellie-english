import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, Pressable, Image, Animated, Platform, Easing, ScrollView, Keyboard } from 'react-native';
import { useGrammarQuizLayout } from './useGrammarQuizLayout';
import { useAudioPlayer } from 'expo-audio';
import MaterialIcons from '../shared/ThemedMaterialIcon';
import Text from '../shared/ThemedText';
import { useNavigation, type NavigationProp } from '@react-navigation/native';
import ImageWithCredit from '../shared/ImageWithCredit';
import GrammarFillExercise from './grammarExercises/GrammarFillExercise';
import GrammarLessonTextContent from './GrammarLessonTextContent';
import GrammarQuizExercise from './grammarExercises/GrammarQuizExercise';
import GrammarReorderExercise from './grammarExercises/GrammarReorderExercise';
import GrammarTranslateExercise from './grammarExercises/GrammarTranslateExercise';
import { commitMeasuredSize, fitSlots, getDesktopContentMaxWidth, scaleValue } from '../shared/responsiveLayout';
import {
  CARD_HEIGHT,
  Exercise,
  ExerciseMode,
  getQuestionsForMode,
  isFillExercise,
  isReorderExercise,
  isTranslateExercise,
} from './grammarExercises/GrammarExerciseUtils';
import {
  SOUND_EFFECT_OPTIONS,
  SUCCESS_SOUND,
  preloadSoundEffects,
  replayPooledSoundEffect,
  warmUpSoundEffect,
} from '../shared/soundEffects';
import { getGrammarLessonProgressKey } from './grammarProgressStorage';
import { getXP, grantXP, previewGrantXP } from '../progress/xpStorage';
import { PERFECT_RUN_XP_MULTIPLIER } from '../progress/xpRewards';
import { saveLastLesson } from '../progress/lastLessonStorage';
import { unlockMode } from '../progress/modeUnlockStorage';
import PracticeSheet from '../shared/PracticeSheet';
import { triggerSelectionHaptic } from '../shared/haptics';
import { getButtonStyle, getButtonTextColor, getGrammarGameColors, getSoftShadow, withColorAlpha } from '../shared/uiPrimitives';
import PracticeDock from '../shared/PracticeDock';
import LessonHeaderRow from '../shared/LessonHeaderRow';
import { FRESH_COLORS, freshFontFamily } from '../shared/freshDirection';
import type { GrammarLesson } from '../../types/lessonTypes';
import type { RootStackParamList } from '../../types/navigationTypes';
import { useEnglishSpeech } from '../shared/useEnglishSpeech';
import { useGrammarSession } from './grammarSessionReducer';
import { useGrammarFeedback } from './useGrammarFeedback';
import { useGrammarQuizTimers } from './useGrammarQuizTimers';
import { useGrammarAnswerController } from './useGrammarAnswerController';
import { useGrammarLessonMedia } from './useGrammarLessonMedia';
import GrammarQuizCompletion from './GrammarQuizCompletion';

interface GrammarQuizProps {
  lesson: GrammarLesson;
  onBack: () => void;
  backLabel?: string;
}

const PRACTICE_LABEL_COLOR = FRESH_COLORS.exerciseBlueLabel;

// Keep in sync with the answer-area styles; sizing subtracts this padding from measured height.
const ANSWER_AREA_PADDING = {
  desktop: { top: 20, bottom: 18 },
  mobile: { top: 4, bottom: 20 },
};

// Shared by prompt styles and Translate's reserved prompt height.
const PROMPT_TYPE = {
  desktop: { fontSize: 34, lineHeight: 39 },
  mobile: { fontSize: 29, lineHeight: 34.8 },
};

const PRACTICE_MODE_LABELS: Record<ExerciseMode, string> = {
  quiz: 'Quiz',
  fill: 'Fill',
  reorder: 'Reorder',
  translate: 'Translate',
};

const renderPromptText = (prompt?: string) => {
  if (!prompt) return null;

  return prompt.split(/(\([^)]*\))/g).map((part, index) => {
    const isParenthetical = part.startsWith('(') && part.endsWith(')');

    return (
      <Text key={`${part}-${index}`} style={isParenthetical && styles.parentheticalPromptText}>
        {part}
      </Text>
    );
  });
};

const GrammarQuiz: React.FC<GrammarQuizProps> = ({ lesson, onBack, backLabel = 'Back to Grammar' }) => {
  const {
    colors, isDarkMode, isGrammarGameMode, isGrammarSpeechEnabled,
    insets, windowWidth, stableViewportHeight,
    exerciseMode, setExerciseMode,
    hasSoftKeyboard, reservesFillKeyboardSpace,
    isDesktopWebLayout, isTabletLayout, isCompactScreen,
    webLessonScale,
    lessonImageContentScale,
    quizOptionGap,
    layoutTopInset,
  } = useGrammarQuizLayout();
  const desktopContentMaxWidth = getDesktopContentMaxWidth(windowWidth, 'fit', stableViewportHeight);
  const desktopPromptFontSize = scaleValue(PROMPT_TYPE.desktop.fontSize, webLessonScale);
  const desktopPromptLineHeight = scaleValue(PROMPT_TYPE.desktop.lineHeight, webLessonScale);
  const isScaledLayout = isDesktopWebLayout || isTabletLayout;
  // The progress dots/counter and the "Correct N/Total" badge read slightly oversized on
  // desktop specifically, so they scale a touch gentler than the rest of the quiz chrome.
  const STATUS_BADGE_DESKTOP_SCALE_ADJUSTMENT = 0.9;
  const statusBadgeScale = isDesktopWebLayout
    ? webLessonScale * STATUS_BADGE_DESKTOP_SCALE_ADJUSTMENT
    : webLessonScale;
  const desktopProgressDotHeight = scaleValue(6, statusBadgeScale);
  const desktopProgressTextFontSize = scaleValue(13, statusBadgeScale);
  const desktopHeartIconSize = scaleValue(32, webLessonScale);
  const desktopLifeSlotWidth = scaleValue(38, webLessonScale);
  const desktopLifeSlotHeight = scaleValue(36, webLessonScale);
  const desktopLivesPillMinHeight = scaleValue(36, webLessonScale);
  const initializedLessonKeyRef = useRef<string | null>(null);
  const [lessonContentMode, setLessonContentMode] = useState<'image' | 'text'>('image');
  const [practiceSheetOpen, setPracticeSheetOpen] = useState(false);
  // Fill waits for sheet entrance to finish before requesting the keyboard.
  const [sheetEntered, setSheetEntered] = useState(false);
  // Prevents Fill's blur handler from reopening a deliberately dismissed keyboard.
  const [fillKeyboardDismissed, setFillKeyboardDismissed] = useState(false);

  const [imageStageSize, setImageStageSize] = useState({ width: 0, height: 0 });
  // Every exercise must fit this measured, non-scrolling viewport.
  const [practiceStageHeight, setPracticeStageHeight] = useState(0);
  const practiceExerciseViewportHeight = Math.max(160, practiceStageHeight);
  const [answerAreaHeight, setAnswerAreaHeight] = useState(0);
  const hasLessonTextContent = !!lesson.textContent?.cards?.length;
  const nav = useNavigation<NavigationProp<RootStackParamList>>();
  const {
    imageUri,
    imageSource,
    mixedImageCards: mixedLessonImageCards,
    showMixedImageCarousel: shouldShowMixedImageCarousel,
    stageInsets: imageStageInsets,
    availableSize: imageStageAvailableSize,
    fittedSize: fittedLessonImageSize,
    handleNaturalSize: handleLessonImageNaturalSize,
  } = useGrammarLessonMedia({
    lesson,
    isDesktopWebLayout,
    stageSize: imageStageSize,
  });

  const handleImagePress = useCallback(() => {
    nav.navigate('FullImageModal', { source: imageSource, uri: imageUri });
  }, [nav, imageSource, imageUri]);

  // Two voices, alternated, so a correct answer never waits on the previous one rewinding.
  const successPlayer = useAudioPlayer(SUCCESS_SOUND, SOUND_EFFECT_OPTIONS);
  const successPlayerAlt = useAudioPlayer(SUCCESS_SOUND, SOUND_EFFECT_OPTIONS);
  const successVoiceCursor = useRef(0);

  useEffect(() => {
    // Silent play now so the first correct answer does not pay for decode and output setup.
    warmUpSoundEffect(successPlayer);
    warmUpSoundEffect(successPlayerAlt);
    // The players above claim the preloaded instance as they are constructed; refill it so
    // the next lesson opened in this session starts warm too.
    preloadSoundEffects();
  }, [successPlayer, successPlayerAlt]);
  const [session, dispatchSession] = useGrammarSession(isGrammarGameMode);
  const {
    selectedQuestions,
    currentQuestionIndex,
    userAnswer,
    incorrectAnswer,
    answerSaveMessage,
    grammarSessionXp,
    lastGrammarXpGain,
    isComplete,
    isGameMode,
    startedGameMode,
    gameModeJustUnlocked,
    completionUnlockResolved,
    lives,
    isGameOver,
    sessionMistakeCount,
  } = session;
  const currentExercise = selectedQuestions[currentQuestionIndex];
  // Option height is owned here because every mode shares the measured answer-area budget.
  // Budget four slots so option size does not vary with the number of answers.
  const QUIZ_MAX_OPTION_SLOTS = 4;
  const baseAnswerAreaPadding = isDesktopWebLayout
    ? {
        top: scaleValue(ANSWER_AREA_PADDING.desktop.top, webLessonScale),
        bottom: scaleValue(ANSWER_AREA_PADDING.desktop.bottom, webLessonScale),
      }
    : ANSWER_AREA_PADDING.mobile;
  const promptGapBumpBase = exerciseMode === 'translate'
    ? 12
    : exerciseMode === 'quiz'
      ? (isDesktopWebLayout ? 6 : 12)
      : exerciseMode === 'fill'
        ? (isDesktopWebLayout ? 28 : 16)
        : 0;
  const promptGapBump = isDesktopWebLayout || isTabletLayout
    ? scaleValue(promptGapBumpBase, webLessonScale)
    : promptGapBumpBase;
  const answerAreaPadding = {
    top: baseAnswerAreaPadding.top + promptGapBump,
    bottom: baseAnswerAreaPadding.bottom,
  };
  const answerAreaVerticalPadding = answerAreaPadding.top + answerAreaPadding.bottom;
  // Reorder and Translate also use this budget to keep their controls inside the viewport.
  const fitQuizCardHeight = answerAreaHeight > 0
    ? Math.max(160, answerAreaHeight - answerAreaVerticalPadding)
    : 280;
  const fitQuizOptionHeightFloor = isDesktopWebLayout || isTabletLayout ? scaleValue(52, webLessonScale) : 44;
  const fitQuizOptionHeightCap = isDesktopWebLayout || isTabletLayout ? scaleValue(80, webLessonScale) : 68;
  const fitQuizOptionHeight = fitSlots(
    fitQuizCardHeight,
    QUIZ_MAX_OPTION_SLOTS,
    quizOptionGap,
    { floor: fitQuizOptionHeightFloor, cap: fitQuizOptionHeightCap }
  );
  const previousLivesRef = useRef(3);
  const [lostLifeIndex, setLostLifeIndex] = useState<number | null>(null);
  const lostLifeAnim = useRef(new Animated.Value(0)).current;
  const [activeCardHeight, setActiveCardHeight] = useState(CARD_HEIGHT);
  const exerciseContainerRef = useRef<View>(null);
  const firstOptionRef = useRef<View>(null);
  const questionRef = useRef<View>(null);
  const { speak: speakGrammarAnswer, stop: stopGrammarSpeech } = useEnglishSpeech();
  const { scheduleTimer, clearAllTimers } = useGrammarQuizTimers(stopGrammarSpeech);
  const {
    feedback,
    feedbackFrame,
    feedbackAnim,
    resetFeedback,
    showSuccess: showSuccessFeedback,
  } = useGrammarFeedback(insets.top + 8, CARD_HEIGHT);
  const optionsContainerRef = useRef<View>(null);
  // Fallback Y when native measurement is unavailable.
  const [optionsContainerY, setOptionsContainerY] = useState(0);
  // Preserves the shared exercise callback contract without layout-triggered rerenders.
  const setFirstOptionLocalY = useCallback(() => {}, []);
  const hasFillExercises = (lesson.availableModes?.fill ?? true) && lesson.exercises.some(isFillExercise);
  const hasReorderExercises = (lesson.availableModes?.reorder ?? true) && lesson.exercises.some(isReorderExercise);
  const hasTranslateExercises = (lesson.availableModes?.translate ?? true) && lesson.exercises.some(isTranslateExercise);
  // Reserve only as many prompt lines as this lesson's longest sentence needs.
  const translateMaxPromptLines = useMemo(() => {
    if (!hasTranslateExercises) return 1;
    const charsPerLine = isDesktopWebLayout ? 46 : 30;
    const longestPromptLength = (lesson.exercises as Exercise[])
      .filter(isTranslateExercise)
      .reduce((longest, ex) => {
        const text = (typeof ex.prompt === 'string' ? ex.prompt : ex.question) ?? '';
        return Math.max(longest, text.length);
      }, 0);
    // Sized to the longest prompt in the lesson rather than a flat 2, so a long sentence
    // gets the lines it needs instead of being cut off mid-word. Capped so a single long
    // question can't reserve half the screen for every other question in the set; anything
    // past the cap is handled by shrinking the text (adjustsFontSizeToFit at the Text).
    const needed = Math.ceil(longestPromptLength / charsPerLine);
    return Math.min(Math.max(1, needed), isDesktopWebLayout ? 2 : 3);
  }, [lesson.exercises, hasTranslateExercises, isDesktopWebLayout]);
  const promptMobileFontSize = isTabletLayout
    ? scaleValue(PROMPT_TYPE.mobile.fontSize, webLessonScale)
    : windowWidth > 0 && windowWidth < 380 ? 26 : PROMPT_TYPE.mobile.fontSize;
  const promptMobileLineHeight = Math.round(promptMobileFontSize * 1.2 * 10) / 10;
  const exerciseModeOptions: Array<{
    key: ExerciseMode;
    label: string;
    icon: React.ComponentProps<typeof MaterialIcons>['name'];
  }> = [
    { key: 'quiz', label: 'Quiz', icon: 'quiz' },
    ...(hasFillExercises ? [{ key: 'fill' as const, label: 'Fill', icon: 'edit' as const }] : []),
    ...(hasReorderExercises ? [{ key: 'reorder' as const, label: 'Reorder', icon: 'reorder' as const }] : []),
    ...(hasTranslateExercises ? [{ key: 'translate' as const, label: 'Translate', icon: 'translate' as const }] : []),
  ];
  const resolveSafeMode = useCallback(
    (requestedMode: ExerciseMode): ExerciseMode => {
      if (requestedMode === 'fill' && hasFillExercises) return 'fill';
      if (requestedMode === 'reorder' && hasReorderExercises) return 'reorder';
      if (requestedMode === 'translate' && hasTranslateExercises) return 'translate';
      return 'quiz';
    },
    [hasFillExercises, hasReorderExercises, hasTranslateExercises]
  );
  useEffect(() => {
    let active = true;

    getXP().then((xp) => {
      if (active) dispatchSession({ type: 'SET_TOTAL_XP', totalXp: xp });
    });

    return () => {
      active = false;
    };
  }, []);

  const playSuccess = useCallback(() => {
    replayPooledSoundEffect([successPlayer, successPlayerAlt], successVoiceCursor);
  }, [successPlayer, successPlayerAlt]);

  useEffect(() => {
    if (lesson.exercises.length) {
      const nextMode = resolveSafeMode('quiz');
      clearAllTimers();
      stopGrammarSpeech();
      resetFeedback();
      setExerciseMode(nextMode);
      dispatchSession({
        type: 'RESET_SESSION',
        questions: getQuestionsForMode(lesson.exercises, nextMode),
        gameMode: isGrammarGameMode,
      });
    }
  }, [lesson, resolveSafeMode]);

  // Toggling Game Mode in Settings mid-lesson must start a fresh run, not re-label the one
  // already in progress: keeping the same questions (and the answers practice mode already
  // revealed) let a player walk a solved set into Game Mode for a free perfect clear.
  const syncedGrammarGameModeRef = useRef(isGrammarGameMode);
  useEffect(() => {
    if (syncedGrammarGameModeRef.current === isGrammarGameMode) return;
    syncedGrammarGameModeRef.current = isGrammarGameMode;

    if (!lesson.exercises.length) {
      dispatchSession({ type: 'SYNC_GAME_MODE', enabled: isGrammarGameMode });
      return;
    }

    clearAllTimers();
    stopGrammarSpeech();
    resetFeedback();
    Keyboard.dismiss();
    dispatchSession({
      type: 'RESET_SESSION',
      questions: getQuestionsForMode(lesson.exercises, exerciseMode),
      gameMode: isGrammarGameMode,
    });
  }, [isGrammarGameMode, exerciseMode, lesson.exercises, clearAllTimers, resetFeedback]);

  useEffect(() => {
    void saveLastLesson({
      type: 'grammar',
      lessonId: lesson?.id != null ? String(lesson.id) : undefined,
      title: lesson.title,
    });
  }, [lesson?.id, lesson.title]);

  // Stable lesson identity prevents recreated prop objects from retriggering unlocks.
  const gameModeUnlockKey = useMemo(
    () => getGrammarLessonProgressKey({ id: lesson?.id, title: lesson?.title }),
    [lesson?.id, lesson?.title]
  );

  // Only announce a newly earned unlock outside Game Mode.
  useEffect(() => {
    if (!isComplete) {
      dispatchSession({ type: 'SET_COMPLETION_UNLOCK_RESOLVED', resolved: false });
      return;
    }

    const wasPlayingGameMode = startedGameMode;
    let active = true;
    unlockMode('grammarGame', gameModeUnlockKey)
      .then((isNewUnlock) => {
        // Always honor a genuine new-unlock signal, even from a run a later effect
        // invocation superseded (e.g. StrictMode's double-invoke) — otherwise the run that
        // actually saw isNewUnlock===true gets skipped by `active`, while the surviving run
        // sees isNewUnlock===false because the first run's storage write already landed.
        if (isNewUnlock && !wasPlayingGameMode) dispatchSession({ type: 'MARK_GAME_MODE_UNLOCKED' });
      })
      .catch((error) => {
        console.warn('Failed to unlock Grammar Game Mode', error);
      })
      .finally(() => {
        if (active) dispatchSession({ type: 'SET_COMPLETION_UNLOCK_RESOLVED', resolved: true });
      });
    return () => { active = false; };
  }, [gameModeUnlockKey, isComplete, startedGameMode]);

  // Same formula the award effect below uses, computed here too so the completion screen
  // can show the actual post-bonus amount instead of the raw pre-bonus session total.
  const isGrammarSessionPerfect = grammarSessionXp > 0 && sessionMistakeCount === 0;
  const earnedGrammarSessionXp = isGrammarSessionPerfect
    ? Math.round(grammarSessionXp * PERFECT_RUN_XP_MULTIPLIER)
    : grammarSessionXp;

  // The day's soft cap can reduce what this session is actually worth, and that isn't
  // knowable from the session alone — resolve it (read-only) before the completion screen
  // promises a figure. Falls back to the earned amount until the preview lands.
  const [resolvedGrammarSessionXp, setResolvedGrammarSessionXp] = useState<number | null>(null);
  useEffect(() => {
    if (!isComplete || earnedGrammarSessionXp <= 0) {
      setResolvedGrammarSessionXp(null);
      return;
    }

    let active = true;
    previewGrantXP(earnedGrammarSessionXp)
      .then((granted) => { if (active) setResolvedGrammarSessionXp(granted); })
      .catch(() => {});

    return () => { active = false; };
  }, [isComplete, earnedGrammarSessionXp]);

  const displayedGrammarSessionXp = resolvedGrammarSessionXp ?? earnedGrammarSessionXp;
  const grammarBonusXp = Math.max(0, displayedGrammarSessionXp - grammarSessionXp);

  // XP is persisted to the account once, here, when the lesson is actually completed —
  // handleAnswer only accumulates grammarSessionXp locally so quitting mid-lesson doesn't
  // bank partial XP.
  const sessionXpAwardedRef = useRef(false);
  useEffect(() => {
    if (!isComplete) sessionXpAwardedRef.current = false;
  }, [isComplete]);

  // Banked only when the student claims it on the end screen — leaving without
  // claiming forfeits the session's XP.
  const claimGrammarSessionXp = useCallback(async () => {
    if (sessionXpAwardedRef.current || grammarSessionXp <= 0) return 0;
    sessionXpAwardedRef.current = true;

    const granted = await grantXP(earnedGrammarSessionXp);
    setResolvedGrammarSessionXp(granted);
    dispatchSession({ type: 'SET_TOTAL_XP', totalXp: await getXP() });
    return granted;
  }, [grammarSessionXp, earnedGrammarSessionXp, dispatchSession]);

  useEffect(() => {
    setActiveCardHeight(fitQuizCardHeight);
  }, [exerciseMode, currentQuestionIndex, fitQuizCardHeight]);

  useEffect(() => {
    const lessonKey = String(lesson?.title || 'grammar-lesson');
    if (initializedLessonKeyRef.current === lessonKey) return;
    initializedLessonKeyRef.current = lessonKey;

    setExerciseMode('quiz');
  }, [lesson?.title]);

  useEffect(() => {
    const previousLives = previousLivesRef.current;

    if (lives < previousLives) {
      setLostLifeIndex(previousLives - 1);
      lostLifeAnim.setValue(0);

      Animated.sequence([
        Animated.timing(lostLifeAnim, {
          toValue: 1,
          duration: 520,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(lostLifeAnim, {
          toValue: 0,
          duration: 1,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]).start(() => setLostLifeIndex(null));
    }

    previousLivesRef.current = lives;
  }, [lives, lostLifeAnim]);

  const switchExerciseMode = (mode: ExerciseMode) => {
    const safeMode = resolveSafeMode(mode);
    if (safeMode !== exerciseMode) {
      triggerSelectionHaptic();
    }

    clearAllTimers();
    stopGrammarSpeech();
    resetFeedback();

    Keyboard.dismiss();
    setExerciseMode(safeMode);
    dispatchSession({
      type: 'RESET_SESSION',
      questions: getQuestionsForMode(lesson.exercises, safeMode),
      gameMode: isGrammarGameMode,
    });
  };

  const openPracticeMode = (mode: ExerciseMode) => {
    // Mode switches keep the sheet mounted; reset entrance state only when opening it.
    if (!practiceSheetOpen) {
      setSheetEntered(false);
    }
    setFillKeyboardDismissed(false);
    setPracticeSheetOpen(true);
    switchExerciseMode(mode);
  };

  const closePracticeSheet = () => {
    Keyboard.dismiss();
    setFillKeyboardDismissed(true);
    setPracticeSheetOpen(false);
    setSheetEntered(false);
  };

  const handlePracticeModePress = (mode: ExerciseMode) => {
    if (practiceSheetOpen && exerciseMode === mode) {
      closePracticeSheet();
      return;
    }

    openPracticeMode(mode);
  };

  const { handleAnswer, handleExerciseIncorrect } = useGrammarAnswerController({
    lesson,
    exerciseMode,
    selectedQuestions,
    currentQuestionIndex,
    userAnswer,
    isGameMode,
    lives,
    isGrammarSpeechEnabled,
    activeContentRef: optionsContainerRef,
    containerRef: exerciseContainerRef,
    fallbackTop: optionsContainerY,
    fallbackHeight: activeCardHeight,
    dispatchSession,
    playSuccess,
    speakAnswer: speakGrammarAnswer,
    scheduleTimer,
    showSuccessFeedback,
  });

  const startChallenge = useCallback(() => {
    triggerSelectionHaptic();
    clearAllTimers();
    stopGrammarSpeech();
    resetFeedback();
    dispatchSession({
      type: 'START_CHALLENGE',
      questions: getQuestionsForMode(lesson.exercises, exerciseMode, 10),
    });
  }, [clearAllTimers, exerciseMode, lesson.exercises, resetFeedback, stopGrammarSpeech]);

  const currentPrompt =
    exerciseMode === 'translate'
      ? currentExercise?.prompt ?? currentExercise?.question
      : exerciseMode === 'reorder'
        ? ''
        : currentExercise?.question;
  const isMultiLessonPractice = lesson.isMixedGrammarLesson === true;
  const currentSourceLessonTitle =
    isMultiLessonPractice && typeof currentExercise?.sourceLesson?.title === 'string'
      ? currentExercise.sourceLesson.title
      : '';
  const hasCurrentExercise = !!currentExercise;
  const exerciseContainerTopOffset = isDesktopWebLayout
    ? (isGameMode ? 14 : 18)
    : 8;

  const modeInstructionLabel = exerciseMode === 'quiz'
    ? 'Choose the right word'
    : exerciseMode === 'fill'
      ? 'Fill in the blank'
      : exerciseMode === 'reorder'
        ? 'Reorder the words'
        : 'Translate the sentence';
  const grammarGame = getGrammarGameColors(colors, isDarkMode);
  const feedbackCardBackground = withColorAlpha(grammarGame.feedbackSurface, isDarkMode ? 0.9 : 0.92);
  const hasFreshCorrectAnswer = !!answerSaveMessage;
  const correctSavedCount = Math.min(
    selectedQuestions.length,
    currentQuestionIndex + (hasFreshCorrectAnswer ? 1 : 0)
  );
  const answerBadgeLabel = hasFreshCorrectAnswer
    ? answerSaveMessage === 'unsaved'
      ? 'Progress not saved'
      : lastGrammarXpGain > 0 ? `+${lastGrammarXpGain} XP` : 'Reviewed'
    : `Correct ${correctSavedCount}/${selectedQuestions.length}`;
  const answerBadgeAccentColor = answerSaveMessage === 'unsaved'
    ? grammarGame.heartLost
    : hasFreshCorrectAnswer ? grammarGame.feedbackBorder : grammarGame.progressFill;
  const answerBadgeTextColor = answerSaveMessage === 'unsaved'
    ? grammarGame.heartLost
    : hasFreshCorrectAnswer ? grammarGame.feedbackBorder : grammarGame.progressLabelText;
  const answerSavedBadgeNode = selectedQuestions.length > 0 ? (
    <View
      style={[
        styles.answerSavedBadge,
        {
          minHeight: scaleValue(isDesktopWebLayout ? 38 : 29, statusBadgeScale),
          maxWidth: scaleValue(isDesktopWebLayout ? 220 : 180, statusBadgeScale),
          paddingHorizontal: scaleValue(isDesktopWebLayout ? 18 : 13, statusBadgeScale),
          gap: scaleValue(isDesktopWebLayout ? 6 : 5, statusBadgeScale),
        },
        {
          backgroundColor: withColorAlpha(answerBadgeAccentColor, isDarkMode ? 0.26 : 0.14),
          borderColor: answerBadgeAccentColor,
          borderWidth: 1,
        },
      ]}
    >
      <MaterialIcons
        name={answerSaveMessage === 'unsaved' ? 'cloud-off' : 'check-circle'}
        size={scaleValue(isDesktopWebLayout ? 18 : 15, statusBadgeScale)}
        color={answerBadgeAccentColor}
      />
      <Text
        style={[
          styles.answerSavedText,
          { fontSize: scaleValue(isDesktopWebLayout ? 15 : 12, statusBadgeScale) },
          { color: answerBadgeTextColor },
        ]}
        numberOfLines={1}
      >
        {answerBadgeLabel}
      </Text>
    </View>
  ) : null;
  // Desktop shows this in place of the "Correct N/Total" badge (same slot, same row) so
  // toggling game mode doesn't grow the header by an extra row — only mobile still gets a
  // dedicated lives row (see statusBlock below).
  const livesNode = (
    <View style={[styles.livesContainer, { minHeight: desktopLivesPillMinHeight }]}>
      <View style={[styles.livesPill, { minHeight: desktopLivesPillMinHeight }]}>
        {Array.from({ length: 3 }).map((_, i) => {
          const isFilled = i < lives;
          const isLost = i === lostLifeIndex;

          return (
            <View key={i} style={[styles.lifeSlot, { width: desktopLifeSlotWidth, height: desktopLifeSlotHeight }]}>
              <MaterialIcons
                name={isFilled ? 'favorite' : 'favorite-border'}
                size={desktopHeartIconSize}
                color={isFilled ? grammarGame.heartFilled : grammarGame.heartEmpty}
                style={styles.lifeIcon}
              />
              {isLost && (
                <Animated.View
                  style={[
                    styles.lostLifeOverlay,
                    {
                      pointerEvents: 'none',
                      opacity: lostLifeAnim.interpolate({
                        inputRange: [0, 0.55, 1],
                        outputRange: [1, 1, 0],
                      }),
                      transform: [
                        {
                          translateY: lostLifeAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, -22],
                          }),
                        },
                        {
                          scale: lostLifeAnim.interpolate({
                            inputRange: [0, 0.35, 1],
                            outputRange: [1, 1.35, 0.65],
                          }),
                        },
                        {
                          rotate: lostLifeAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: ['0deg', '-18deg'],
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  <MaterialIcons name="favorite" size={desktopHeartIconSize} color={grammarGame.heartLost} />
                </Animated.View>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
  const handleGoToAccount = useCallback(() => {
    dispatchSession({ type: 'CLOSE_COMPLETION' });
    // Close the practice sheet too — same reason as the vocabulary screen: returning from
    // Account with it still open shows the lesson scaled and dimmed behind the sheet, and
    // back then collapses the sheet instead of leaving the lesson.
    setPracticeSheetOpen(false);
    setSheetEntered(false);
    Keyboard.dismiss();
    nav.getParent<NavigationProp<RootStackParamList>>()?.navigate('Account', { openAvatarPicker: true });
  }, [nav]);

  const gameModeButtonStyle = getButtonStyle(colors, isDarkMode, 'primary');
  const gameModeButtonTextColor = getButtonTextColor(colors, isDarkMode, 'primary');


  const renderPracticeDock = () => {
    return (
      <PracticeDock
        modes={exerciseModeOptions}
        activeKey={practiceSheetOpen ? exerciseMode : null}
        onSelect={handlePracticeModePress}
        isDesktopWeb={isDesktopWebLayout}
        isDarkMode={isDarkMode}
        colors={colors}
        desktopMaxWidth={460}
        showActiveCollapseIcon={false}
        // Keep mounted while the keyboard is open to avoid sheet reflow.
      />
    );
  };

  const replayGrammarCompletion = () => {
    if (startedGameMode || gameModeJustUnlocked) {
      startChallenge();
      return;
    }
    switchExerciseMode(exerciseMode);
  };
  const activePracticeLabel = practiceSheetOpen
    ? PRACTICE_MODE_LABELS[exerciseMode as keyof typeof PRACTICE_MODE_LABELS] ?? null
    : null;
  const practiceContextTitle = isMultiLessonPractice
    ? (isDesktopWebLayout ? 'Mixed practice: Selected lessons' : 'Mixed practice')
    : lesson.title;
  const headerHorizontalPadding = isDesktopWebLayout ? 32 : 16;
  const headerBackSize = isDesktopWebLayout ? 38 : 34;
  const headerLayoutWidth = Math.min(windowWidth, 800);
  const breadcrumbCharacterCount = practiceSheetOpen
    ? practiceContextTitle.length + (activePracticeLabel?.length ?? 0)
    : lesson.title.length;
  const breadcrumbSeparatorCount = practiceSheetOpen ? 1 : 0;
  const estimatedBreadcrumbWidth = breadcrumbCharacterCount * (isDesktopWebLayout ? 8 : 7.2)
    + breadcrumbSeparatorCount * (isDesktopWebLayout ? 26 : 22);
  const labeledContentToggleWidth = 142;
  const headerBreadcrumbRoom = headerLayoutWidth - headerHorizontalPadding * 2 - headerBackSize - 14;
  const showContentToggleLabels = headerBreadcrumbRoom - estimatedBreadcrumbWidth >= labeledContentToggleWidth;

  return (
    <>
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          paddingTop: layoutTopInset,
        },
      ]}
    >
      {/* KeyboardAvoidingView races PracticeSheet's entrance animation; Fill reserves keyboard space internally. */}
      <View style={styles.lessonSheetHost}>
        <PracticeSheet
          open={practiceSheetOpen}
          onClose={closePracticeSheet}
          onEntered={() => setSheetEntered(true)}
          isDarkMode={isDarkMode}
          isDesktopWeb={isDesktopWebLayout}
          colors={colors}
          baseLayer={
            <>
            <LessonHeaderRow
              isDesktopWeb={isDesktopWebLayout}
              isDarkMode={isDarkMode}
              colors={colors}
              onBack={onBack}
              backLabel={backLabel}
              title={activePracticeLabel ? practiceContextTitle : lesson.title}
              activeModeLabel={activePracticeLabel}
              idleTrailingSlot={hasLessonTextContent && (
                <View
                  style={[
                    styles.lessonContentModeToggle,
                    {
                      height: scaleValue(isDesktopWebLayout ? 44 : 38, webLessonScale),
                      gap: scaleValue(4, webLessonScale),
                      padding: scaleValue(4, webLessonScale),
                      borderRadius: scaleValue(100, webLessonScale),
                      marginBottom: isDesktopWebLayout ? scaleValue(8, webLessonScale) : 0,
                      backgroundColor: colors.surface,
                    },
                  ]}
                >
                  {(['image', 'text'] as const).map((contentMode) => {
                    const selected = lessonContentMode === contentMode;
                    const label = contentMode === 'image' ? 'Image' : 'Text';

                    return (
                      <TouchableOpacity
                        key={contentMode}
                        onPress={() => setLessonContentMode(contentMode)}
                        accessibilityRole="button"
                        accessibilityLabel={`Show lesson ${contentMode}`}
                        accessibilityState={{ selected }}
                        style={[
                          styles.lessonContentModeButton,
                          {
                            height: scaleValue(isDesktopWebLayout ? 36 : 30, webLessonScale),
                            minWidth: scaleValue(isDesktopWebLayout ? 36 : 30, webLessonScale),
                            paddingHorizontal: scaleValue(isDesktopWebLayout ? 14 : 10, webLessonScale),
                            gap: scaleValue(5, webLessonScale),
                            borderRadius: scaleValue(100, webLessonScale),
                          },
                          selected && { backgroundColor: colors.primary },
                        ]}
                      >
                        <MaterialIcons
                          name={contentMode === 'image' ? 'image' : 'article'}
                          size={scaleValue(isDesktopWebLayout ? 18 : 16, webLessonScale)}
                          color={selected ? '#FFFFFF' : colors.secondaryText}
                        />
                        {showContentToggleLabels && (
                          <Text
                            style={[
                              styles.lessonContentModeButtonText,
                              { fontSize: scaleValue(13, webLessonScale), color: selected ? '#FFFFFF' : colors.secondaryText },
                            ]}
                          >
                            {label}
                          </Text>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            />
            {/* Plain flex stage, the same as the vocabulary lesson's: pinning this to the
                measured height while the sheet covered it left the stage shorter than the
                space it sat in, so the lesson image centred high with a band of empty space
                under it as the sheet was dragged away. The image's own size is still held
                steady by the measurement guard below. */}
            <View
              style={styles.contentArea}
              onLayout={(event) => {
                // Measuring while the sheet covers the stage would refit the image to a
                // keyboard-shrunk height, so it is left at the size the open stage gave it.
                if (practiceSheetOpen) return;
                const nextWidth = Math.round(event.nativeEvent.layout.width);
                const nextHeight = Math.round(event.nativeEvent.layout.height);
                if (nextWidth <= 0 || nextHeight <= 0) return;
                setImageStageSize((current) => {
                  // Ignore sub-pixel jitter.
                  const widthChanged = Math.abs(current.width - nextWidth) > 1;
                  const heightChanged = Math.abs(current.height - nextHeight) > 1;
                  if (!widthChanged && !heightChanged) return current;
                  // Android reports a transient shorter height while dismissing the keyboard.
                  // Ignore height-only shrink; width-changing resize or rotation remains valid.
                  if (hasSoftKeyboard && !widthChanged && nextHeight < current.height) return current;
                  return { width: nextWidth, height: nextHeight };
                });
              }}
            >
              <View
                style={[
                  styles.contentLayer,
                  styles.lessonLayer,
                  {
                    paddingHorizontal: imageStageInsets.horizontal,
                    paddingTop: imageStageInsets.top,
                    paddingBottom: imageStageInsets.bottom,
                  },
                ]}
              >
                {hasLessonTextContent && lessonContentMode === 'text' ? (
                  <View
                    style={[
                      styles.lessonTextFrame,
                      {
                        // Text mode uses the full stage rather than the image aspect-ratio box.
                        width: isDesktopWebLayout
                          ? Math.min(imageStageAvailableSize.width, scaleValue(880, webLessonScale))
                          : imageStageAvailableSize.width,
                        height: imageStageAvailableSize.height,
                      },
                    ]}
                  >
                    <GrammarLessonTextContent
                      content={lesson.textContent!}
                      colors={colors}
                      isDarkMode={isDarkMode}
                      height={fittedLessonImageSize.height}
                      scale={webLessonScale}
                    />
                  </View>
                ) : shouldShowMixedImageCarousel ? (
                  <View
                    style={[
                      styles.lessonPoster,
                      {
                        width: fittedLessonImageSize.width,
                        height: fittedLessonImageSize.height,
                      },
                    ]}
                  >
                    <ScrollView
                      horizontal
                      pagingEnabled
                      showsHorizontalScrollIndicator={false}
                      snapToInterval={fittedLessonImageSize.width}
                      decelerationRate="fast"
                      directionalLockEnabled
                      disableIntervalMomentum
                      nestedScrollEnabled
                      style={{ width: fittedLessonImageSize.width, height: fittedLessonImageSize.height }}
                    >
                      {mixedLessonImageCards.map((imageCard, imageIndex) => (
                        <View
                          key={`${imageCard.id}-${imageIndex}`}
                          style={{
                            width: fittedLessonImageSize.width,
                            height: fittedLessonImageSize.height,
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <ImageWithCredit
                            source={{ uri: imageCard.imageUrl }}
                            imageScale={lessonImageContentScale}
                            onNaturalSize={imageIndex === 0 ? handleLessonImageNaturalSize : undefined}
                            style={[
                              {
                                width: fittedLessonImageSize.width,
                                height: fittedLessonImageSize.height,
                              },
                            ]}
                            accessibilityLabel={imageCard.title ? `${imageCard.title} lesson image` : 'Lesson image'}
                          />
                        </View>
                      ))}
                    </ScrollView>
                  </View>
                ) : (
                  <ImageWithCredit
                    onPress={handleImagePress}
                    source={imageSource}
                    imageScale={lessonImageContentScale}
                    onNaturalSize={handleLessonImageNaturalSize}
                    style={[
                      styles.lessonPoster,
                      {
                        width: fittedLessonImageSize.width,
                        height: fittedLessonImageSize.height,
                      },
                    ]}
                  />
                )}
              </View>
            </View>
            </>
          }
        >
        <View
          style={styles.practiceLayerBody}
          onLayout={(event) => setPracticeStageHeight(commitMeasuredSize(event.nativeEvent.layout.height))}
        >
        <Pressable
          ref={exerciseContainerRef}
          onPress={() => {
            if (exerciseMode !== 'fill' || isDesktopWebLayout) return;
            setFillKeyboardDismissed(true);
            // A same-tick dismiss can race Android's own focus-retry timers (see
            // usePersistentExerciseKeyboard's androidFocusRetries) and get silently
            // reopened; deferring to the next tick lets the state update above clear
            // those timers first.
            setTimeout(() => Keyboard.dismiss(), 0);
          }}
          style={[
            styles.exerciseContainer,
            isDesktopWebLayout && {
              alignSelf: 'center',
              maxWidth: desktopContentMaxWidth,
              width: '100%',
              paddingHorizontal: scaleValue(22, webLessonScale),
              // Fill's answer card (and any other mode whose content is shorter than the
              // available stage) used to stack at the top, leaving all the slack as a single
              // dead zone below it. Centering the whole prompt+answer group distributes that
              // slack evenly instead — a no-op for modes that already fill the space.
              justifyContent: 'center',
            },
            // Fill's desktop card sits on its own intrinsic height (no minHeight), so
            // centering left equal dead space above and below it. Pin the group to the
            // bottom instead — the card ends up close to the mode row, and the (larger)
            // slack collects above the prompt where it reads as intentional breathing room.
            isDesktopWebLayout && exerciseMode === 'fill' && {
              justifyContent: 'flex-end',
              paddingBottom: 28,
            },
            !isDesktopWebLayout && { paddingHorizontal: 14 },
            {
              paddingTop: exerciseContainerTopOffset,
            },
          ]}
        >
        {!isComplete ? (
          <>
            {!hasCurrentExercise && (
              <View
                style={[
                  styles.emptyStateCard,
                  {
                    padding: scaleValue(24, webLessonScale),
                    borderRadius: scaleValue(16, webLessonScale),
                    marginVertical: scaleValue(16, webLessonScale),
                    backgroundColor: colors.card,
                  },
                ]}
              >
                <Text style={[styles.emptyStateTitle, { fontSize: scaleValue(22, webLessonScale), marginBottom: scaleValue(8, webLessonScale), color: colors.text }]}>No exercises available</Text>
                <Text style={[styles.emptyStateText, { fontSize: scaleValue(15, webLessonScale), color: colors.text }]}>
                  This lesson does not have content for the current mode yet.
                </Text>
              </View>
            )}
            {hasCurrentExercise && (
            <>
            {isGameOver ? (
              <View
                style={[
                  styles.gameOverContainer,
                  {
                    padding: scaleValue(24, webLessonScale),
                    borderRadius: scaleValue(16, webLessonScale),
                    marginVertical: scaleValue(16, webLessonScale),
                    borderWidth: scaleValue(1.5, webLessonScale),
                    backgroundColor: grammarGame.panelSurface,
                    borderColor: grammarGame.panelBorder,
                    ...getSoftShadow(isDarkMode, 'raised', colors.shadow, colors.visualStyle === 'pixel'),
                  },
                ]}
              >
                <Image
                  source={require('../../assets/embarrassed.png')}
                  style={[
                    styles.gameOverImage,
                    Platform.OS === 'web'
                      ? { width: scaleValue(80, webLessonScale), height: scaleValue(80, webLessonScale) }
                      // Live width keeps the native image responsive to rotation.
                      : { width: windowWidth * 0.25, height: windowWidth * 0.25 },
                  ]}
                  resizeMode="contain"
                />
                <Text style={[styles.gameOverText, { color: colors.text }]}>Oops! Too bad!</Text>
                <Text style={[styles.gameOverSubText, { color: colors.text }]}>It's ok, you can do it!</Text>
                <TouchableOpacity
                  style={[
                    styles.gameModeButton,
                    {
                      minWidth: scaleValue(220, webLessonScale),
                      paddingVertical: scaleValue(13, webLessonScale),
                      paddingHorizontal: scaleValue(24, webLessonScale),
                      marginTop: scaleValue(12, webLessonScale),
                    },
                    gameModeButtonStyle,
                  ]}
                  onPress={startChallenge}
                  accessibilityRole="button"
                  accessibilityLabel="Retry Game Mode"
                >
                  <Text style={[styles.gameModeButtonText, { color: gameModeButtonTextColor }]}>Retry Game Mode</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <View
                  style={[
                    styles.statusBlock,
                    // Desktop never renders a lives row here (it's in questionHeaderRow
                    // instead), so it always gets the compact "no lives" sizing.
                    (isDesktopWebLayout || !isGameMode) && styles.statusBlockNoLives,
                    reservesFillKeyboardSpace && styles.statusBlockFillKeyboard,
                  ]}
                >
                  <View
                    style={[
                      styles.progressContainer,
                      !isDesktopWebLayout && styles.progressContainerWithCollapseMobile,
                      isDesktopWebLayout && styles.progressContainerWithCollapseDesktop,
                    ]}
                  >
                    <View style={[styles.progressDotsRow, isDesktopWebLayout && styles.progressDotsRowDesktop]}>
                      {Array.from({ length: 10 }).map((_, i) => {
                        const filledDots = Math.max(1, Math.round(((currentQuestionIndex + 1) / Math.max(1, selectedQuestions.length)) * 10));
                        const isFilled = i < filledDots;
                        return (
                          <View
                            key={i}
                            style={[
                              styles.progressDot,
                              { height: desktopProgressDotHeight, borderRadius: desktopProgressDotHeight / 2 },
                              { backgroundColor: isFilled ? grammarGame.progressFill : grammarGame.progressTrack },
                            ]}
                          />
                        );
                      })}
                    </View>
                    <Text style={[styles.progressText, isDesktopWebLayout && styles.progressTextDesktop, { fontSize: desktopProgressTextFontSize, color: grammarGame.progressLabelText }]}>
                      {isDesktopWebLayout ? 'Question ' : ''}{currentQuestionIndex + 1}/{selectedQuestions.length}
                    </Text>
                  </View>
                  {!isDesktopWebLayout && isGameMode && !isComplete && (
                    <View style={styles.secondaryStatusRow}>
                      <View style={[styles.livesSlot, { minHeight: desktopLivesPillMinHeight }]}>
                        <View style={styles.livesContainer}>
                          <View style={[styles.livesPill, { minHeight: desktopLivesPillMinHeight }]}>
                            {Array.from({ length: 3 }).map((_, i) => {
                              const isFilled = i < lives;
                              const isLost = i === lostLifeIndex;

                              return (
                                <View key={i} style={[styles.lifeSlot, { width: desktopLifeSlotWidth, height: desktopLifeSlotHeight }]}>
                                  <MaterialIcons
                                    name={isFilled ? 'favorite' : 'favorite-border'}
                                    size={desktopHeartIconSize}
                                    color={isFilled ? grammarGame.heartFilled : grammarGame.heartEmpty}
                                    style={styles.lifeIcon}
                                  />
                                  {isLost && (
                                    <Animated.View
                                      style={[
                                        styles.lostLifeOverlay,
                                        {
                                          pointerEvents: 'none',
                                          opacity: lostLifeAnim.interpolate({
                                            inputRange: [0, 0.55, 1],
                                            outputRange: [1, 1, 0],
                                          }),
                                          transform: [
                                            {
                                              translateY: lostLifeAnim.interpolate({
                                                inputRange: [0, 1],
                                                outputRange: [0, -22],
                                              }),
                                            },
                                            {
                                              scale: lostLifeAnim.interpolate({
                                                inputRange: [0, 0.35, 1],
                                                outputRange: [1, 1.35, 0.65],
                                              }),
                                            },
                                            {
                                              rotate: lostLifeAnim.interpolate({
                                                inputRange: [0, 1],
                                                outputRange: ['0deg', '-18deg'],
                                              }),
                                            },
                                          ],
                                        },
                                      ]}
                                    >
                                      <MaterialIcons name="favorite" size={desktopHeartIconSize} color={grammarGame.heartLost} />
                                    </Animated.View>
                                  )}
                                </View>
                              );
                            })}
                          </View>
                        </View>
                      </View>
                    </View>
                  )}
                </View>
                <View
                  style={styles.exercise}
                >
                    <View
                      ref={questionRef}
                      style={[
                        styles.questionCard,
                        isDesktopWebLayout && exerciseMode === 'fill' && styles.questionCardFillDesktop,
                        isDesktopWebLayout && exerciseMode === 'fill' && { maxWidth: scaleValue(760, webLessonScale) },
                        !currentPrompt && styles.questionCardNoPrompt,
                      {
                        backgroundColor: 'transparent',
                        borderWidth: 0,
                        borderBottomWidth: 0,
                        borderRadius: 0,
                        boxShadow: 'none',
                        elevation: 0,
                      },
                    ]}
                  >
                    <View style={styles.questionHeaderRow}>
                      {isDesktopWebLayout && isGameMode && !isComplete && (
                        // Absolutely centered over the row (not squeezed into the flex gap
                        // between the label and the badge) so it doesn't shift with either
                        // one's width, and doesn't disturb the row's own height.
                        <View style={styles.livesCenterOverlay} pointerEvents="none">
                          {livesNode}
                        </View>
                      )}
                      <View style={styles.questionLabelRow}>
                        <Text
                          style={[
                            styles.questionModeText,
                            isDesktopWebLayout ? styles.questionModeTextDesktop : styles.questionModeTextMobile,
                            isScaledLayout && { fontSize: scaleValue(14, webLessonScale) },
                            { color: isDarkMode ? grammarGame.progressFill : PRACTICE_LABEL_COLOR },
                          ]}
                        >
                          {modeInstructionLabel}
                        </Text>
                        {isDesktopWebLayout && currentSourceLessonTitle ? (
                          <View
                            style={[
                              styles.sourceLessonBadge,
                              {
                                minHeight: scaleValue(25, webLessonScale),
                                maxWidth: scaleValue(260, webLessonScale),
                                paddingHorizontal: scaleValue(11, webLessonScale),
                                gap: scaleValue(4, webLessonScale),
                                backgroundColor: grammarGame.badgeSurface,
                                borderColor: grammarGame.badgeBorder,
                                boxShadow: `0px 1px 3px ${withColorAlpha(colors.shadow, 0.72)}`,
                              },
                            ]}
                          >
                            <Text
                              style={[styles.sourceLessonBadgeText, { fontSize: scaleValue(12.5, webLessonScale), color: grammarGame.badgeText }]}
                              numberOfLines={1}
                            >
                              {currentSourceLessonTitle}
                            </Text>
                          </View>
                        ) : null}
                      </View>
                      {answerSavedBadgeNode}
                    </View>
                    {!isDesktopWebLayout && currentSourceLessonTitle ? (
                      <View style={styles.sourceLessonRowMobile}>
                        <View
                          style={[
                            styles.sourceLessonBadge,
                            {
                              minHeight: scaleValue(25, webLessonScale),
                              maxWidth: scaleValue(260, webLessonScale),
                              paddingHorizontal: scaleValue(11, webLessonScale),
                              gap: scaleValue(4, webLessonScale),
                              backgroundColor: grammarGame.badgeSurface,
                              borderColor: grammarGame.badgeBorder,
                              boxShadow: `0px 1px 3px ${withColorAlpha(colors.shadow, 0.72)}`,
                            },
                          ]}
                        >
                          <Text
                            style={[styles.sourceLessonBadgeText, { fontSize: scaleValue(11.5, webLessonScale), color: grammarGame.badgeText }]}
                            numberOfLines={1}
                          >
                            {currentSourceLessonTitle}
                          </Text>
                        </View>
                      </View>
                    ) : null}
                    {!!currentPrompt && (
                      <Text
                        // Clamp Translate prompts so controls stay fixed between questions.
                        numberOfLines={exerciseMode === 'translate' ? translateMaxPromptLines : undefined}
                        // Shrink to fit rather than truncate: a sentence longer than the
                        // reserved lines scales down instead of ending in "…", so the whole
                        // thing stays readable without the layout shifting.
                        adjustsFontSizeToFit={exerciseMode === 'translate'}
                        minimumFontScale={0.7}
                        style={[
                          styles.question,
                          // Keep prompt metrics stable while Fill auto-focuses the keyboard.
                          isDesktopWebLayout
                            ? [
                                styles.questionDesktop,
                                {
                                  fontSize: desktopPromptFontSize,
                                  lineHeight: desktopPromptLineHeight,
                                  marginTop: scaleValue(28, webLessonScale),
                                },
                              ]
                            : [
                                styles.questionMobile,
                                (() => {
                                  // Fill's prompt is a single sentence with no line clamp — a long one
                                  // wraps to two lines and reads oversized next to the compact answer
                                  // card below it, so dial the size back a touch when that happens.
                                  const isFillPromptLong = exerciseMode === 'fill' && currentPrompt.length > 30;
                                  const fillPromptScale = isFillPromptLong ? 0.86 : 1;
                                  return {
                                    fontSize: promptMobileFontSize * fillPromptScale,
                                    lineHeight: promptMobileLineHeight * fillPromptScale,
                                    marginTop: scaleValue(28, webLessonScale),
                                  };
                                })(),
                              ],
                          exerciseMode === 'translate' && {
                            minHeight: (isDesktopWebLayout ? desktopPromptLineHeight : promptMobileLineHeight) * translateMaxPromptLines,
                          },
                          { color: colors.text },
                        ]}
                      >
                        {renderPromptText(currentPrompt)}
                      </Text>
                    )}
                  </View>
                  <View
                    onLayout={(event) => setAnswerAreaHeight(commitMeasuredSize(event.nativeEvent.layout.height))}
                    style={[
                      styles.answerArea,
                      isDesktopWebLayout ? styles.answerAreaDesktop : styles.answerAreaMobile,
                      { paddingTop: answerAreaPadding.top, paddingBottom: answerAreaPadding.bottom },
                      // Fixed-height answer blocks prevent vertical movement between questions.
                      (!isDesktopWebLayout || exerciseMode === 'fill' || exerciseMode === 'quiz')
                        && styles.answerAreaCenter,
                      // Desktop/tablet Fill uses intrinsic height so its card stays attached to the
                      // prompt, instead of centering in the full answer area and leaving a big gap.
                      (isDesktopWebLayout || isTabletLayout) && exerciseMode === 'fill' && styles.answerAreaFillDesktopCompact,
                      // Mobile Fill also stays attached to the prompt instead of centering in the
                      // full answer area — centering was leaving a large unused gap on tall phones.
                      !isDesktopWebLayout && exerciseMode === 'fill' && styles.answerAreaFillMobileKeyboardTop,
                    ]}
                  >
                  {exerciseMode === 'fill' ? (
                    <GrammarFillExercise
                      exercise={selectedQuestions[currentQuestionIndex]}
                      colors={colors}
                      isDarkMode={isDarkMode}
                      practiceSheetReady={sheetEntered}
                      keyboardDismissed={fillKeyboardDismissed}
                      onKeyboardRestore={() => setFillKeyboardDismissed(false)}
                      reservesKeyboardSpace={reservesFillKeyboardSpace}
                      layoutHeight={practiceExerciseViewportHeight}
                      userAnswer={userAnswer}
                      incorrectAnswer={incorrectAnswer}
                      optionsContainerRef={optionsContainerRef}
                      firstOptionRef={firstOptionRef}
                      onOptionsLayout={setOptionsContainerY}
                      onFirstOptionLayout={setFirstOptionLocalY}
                      onCardHeightChange={setActiveCardHeight}
                      onCorrect={handleAnswer}
                      onIncorrect={handleExerciseIncorrect}
                    />
                  ) : exerciseMode === 'reorder' ? (
                    <GrammarReorderExercise
                      key={`reorder-${currentQuestionIndex}`}
                      exercise={selectedQuestions[currentQuestionIndex]}
                      colors={colors}
                      isDarkMode={isDarkMode}
                      compact={isCompactScreen}
                      layoutHeight={practiceExerciseViewportHeight}
                      availableHeight={fitQuizCardHeight}
                      userAnswer={userAnswer}
                      incorrectAnswer={incorrectAnswer}
                      optionsContainerRef={optionsContainerRef}
                      firstOptionRef={firstOptionRef}
                      onOptionsLayout={setOptionsContainerY}
                      onFirstOptionLayout={setFirstOptionLocalY}
                      onCardHeightChange={setActiveCardHeight}
                      onCorrect={handleAnswer}
                      onIncorrect={handleExerciseIncorrect}
                    />
                  ) : exerciseMode === 'translate' ? (
                    <GrammarTranslateExercise
                      key={`translate-${currentQuestionIndex}`}
                      exercise={selectedQuestions[currentQuestionIndex]}
                      colors={colors}
                      isDarkMode={isDarkMode}
                      layoutHeight={practiceExerciseViewportHeight}
                      availableHeight={fitQuizCardHeight}
                      userAnswer={userAnswer}
                      incorrectAnswer={incorrectAnswer}
                      optionsContainerRef={optionsContainerRef}
                      firstOptionRef={firstOptionRef}
                      onOptionsLayout={setOptionsContainerY}
                      onFirstOptionLayout={setFirstOptionLocalY}
                      onCardHeightChange={setActiveCardHeight}
                      onCorrect={handleAnswer}
                      onIncorrect={handleExerciseIncorrect}
                    />
                  ) : (
                    <GrammarQuizExercise
                      exercise={selectedQuestions[currentQuestionIndex]}
                      colors={colors}
                      isDarkMode={isDarkMode}
                      isGameMode={isGameMode}
                      isDesktopWeb={isDesktopWebLayout}
                      isScaledLayout={isScaledLayout}
                      webLessonScale={webLessonScale}
                      optionHeight={fitQuizOptionHeight}
                      optionGap={quizOptionGap}
                      userAnswer={userAnswer}
                      incorrectAnswer={incorrectAnswer}
                      optionsContainerRef={optionsContainerRef}
                      firstOptionRef={firstOptionRef}
                      onOptionsLayout={setOptionsContainerY}
                      onFirstOptionLayout={setFirstOptionLocalY}
                      onCardHeightChange={setActiveCardHeight}
                      onAnswerPress={handleAnswer}
                    />
                  )}
                  </View>
                </View>
              </>
            )}

            {feedback !== '' && (
              <Animated.View style={[
                styles.feedbackCard,
                {
                  padding: scaleValue(16, webLessonScale),
                  borderRadius: scaleValue(8, webLessonScale),
                  left: feedbackFrame.left,
                  right: feedbackFrame.width === undefined ? 16 : undefined,
                  top: feedbackFrame.top,
                  width: feedbackFrame.width,
                  height: feedbackFrame.height,
                  backgroundColor: feedbackCardBackground,
                  borderColor: grammarGame.feedbackBorder,
                  boxShadow: `0px 8px 14px ${withColorAlpha(grammarGame.feedbackSurface, 0.18)}`,
                  transform: [{ translateY: feedbackAnim }]
                }
              ]}>
                <Text style={[styles.feedbackText, { fontSize: scaleValue(32, webLessonScale), color: grammarGame.feedbackText }]}>{feedback}</Text>
              </Animated.View>
            )}
            </>
            )}
          </>
        ) : null}
        </Pressable>
        </View>
        </PracticeSheet>
      </View>

      {renderPracticeDock()}
    </View>

    <GrammarQuizCompletion
      visible={isComplete && completionUnlockResolved}
      selectedQuestionCount={selectedQuestions.length}
      sessionXp={displayedGrammarSessionXp}
      bonusXp={grammarBonusXp}
      onClaimXP={claimGrammarSessionXp}
      mistakeCount={sessionMistakeCount}
      startedGameMode={startedGameMode}
      lives={lives}
      gameModeJustUnlocked={gameModeJustUnlocked}
      backLabel={backLabel ?? 'Back'}
      onReplay={replayGrammarCompletion}
      onBack={onBack}
      onGoToAccount={handleGoToAccount}
      colors={colors}
      isDarkMode={isDarkMode}
    />
    </>
  );
};

export default GrammarQuiz;

const styles = StyleSheet.create({
  container: { flex: 1 },
  lessonSheetHost: {
    flex: 1,
    minHeight: 0,
    position: 'relative',
    // Android elevation can draw outside the animated sheet; clip it above the mode dock.
    overflow: 'hidden',
  },
  contentArea: {
    flex: 1,
    minHeight: 0,
    position: 'relative',
  },
  contentLayer: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  lessonLayer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  lessonPoster: {
    maxWidth: '100%',
  },
  lessonTextFrame: {
    alignSelf: 'center',
    maxWidth: '100%',
  },
  practiceLayerBody: {
    flex: 1,
    minHeight: 0,
    width: '100%',
  },
  lessonContentModeToggle: {
    alignItems: 'center',
    flexDirection: 'row',
    flexShrink: 0,
    marginLeft: 'auto',
  },
  lessonContentModeButton: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  lessonContentModeButtonText: {
    fontWeight: freshFontFamily.bold,
  },
  exerciseContainer: {
    alignSelf: 'center',
    flex: 1,
    minHeight: 0,
    paddingBottom: 0,
    position: 'relative',
    marginTop: 0,
    width: '100%',
  },
  livesContainer: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 30,
  },
  statusBlock: {
    gap: 6,
    marginBottom: 10,
    minHeight: 0,
    justifyContent: 'flex-start',
  },
  statusBlockNoLives: {
    gap: 0,
    minHeight: 0,
  },
  statusBlockFillKeyboard: {
    minHeight: 0,
  },
  secondaryStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  livesSlot: {
    flex: 1,
    minHeight: 36,
    justifyContent: 'center',
  },
  livesPill: {
    minHeight: 36,
    paddingHorizontal: 2,
    borderRadius: 8,
    backgroundColor: 'transparent',
    borderWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
  },
  lifeSlot: {
    width: 38,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  lifeIcon: { marginHorizontal: 3 },
  lostLifeOverlay: {
    position: 'absolute',
    left: 3,
    top: 2,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    marginBottom: 6,
    gap: 9,
    minHeight: 13,
  },
  // The collapse button is contained by the sheet header now, so this row no longer has to
  // reserve height or a left inset to dodge it — the dots get the full width and the row
  // collapses to its natural size.
  progressContainerWithCollapseMobile: {},
  progressContainerWithCollapseDesktop: {
    minHeight: 46,
    paddingLeft: 60,
  },
  progressDotsRow: {
    flex: 1,
    flexDirection: 'row',
    gap: 4,
  },
  progressDotsRowDesktop: { gap: 6 },
  progressDot: {
    flex: 1,
    height: 6,
    borderRadius: 3,
  },
  progressText: { flexShrink: 0, fontWeight: freshFontFamily.extrabold, fontSize: 12.5 },
  progressTextDesktop: { fontSize: 13 },
  exercise: { flex: 1, minHeight: 0 },
  answerArea: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-start',
    minHeight: 0,
    width: '100%',
  },
  // On web, flex: 0 collapses the basis and can overflow children into the prompt.
  answerAreaFillDesktopCompact: {
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: 'auto',
  },
  answerAreaFillMobileKeyboardTop: {
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: 'auto',
    justifyContent: 'flex-start',
  },
  answerAreaDesktop: { paddingTop: ANSWER_AREA_PADDING.desktop.top, paddingBottom: ANSWER_AREA_PADDING.desktop.bottom },
  answerAreaMobile: { paddingTop: ANSWER_AREA_PADDING.mobile.top, paddingBottom: ANSWER_AREA_PADDING.mobile.bottom },
  answerAreaCenter: { justifyContent: 'center' },
  questionCard: {
    padding: 0,
    marginBottom: 0,
    minHeight: 0,
  },
  questionCardFillDesktop: {
    alignSelf: 'center',
    width: '90%',
    maxWidth: 760,
  },
  questionCardNoPrompt: { minHeight: 0 },
  questionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    position: 'relative',
  },
  livesCenterOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  questionLabelRow: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  questionModeText: {
    color: '#777',
    fontWeight: freshFontFamily.extrabold,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: 5,
  },
  questionModeTextDesktop: { fontSize: 14 },
  questionModeTextMobile: { fontSize: 13 },
  sourceLessonBadge: {
    flexShrink: 1,
    borderRadius: 999,
    borderWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    boxShadow: '0px 1px 3px rgba(0,0,0,0.07)',
  },
  sourceLessonRowMobile: {
    alignItems: 'flex-start',
    marginTop: 15,
  },
  sourceLessonBadgeText: {
    flexShrink: 1,
    minWidth: 0,
    fontWeight: freshFontFamily.bold,
  },
  answerSavedBadge: {
    minHeight: 25,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
       marginTop: 5,
  },
  answerSavedText: {
    flexShrink: 1,
    minWidth: 0,
    fontWeight: freshFontFamily.extrabold,
  },
  question: { letterSpacing: -0.27, textAlign: 'center' },
  questionDesktop: {
    fontSize: PROMPT_TYPE.desktop.fontSize,
    fontWeight: freshFontFamily.extrabold,
    lineHeight: PROMPT_TYPE.desktop.lineHeight,
    marginTop: 28,
  },
  questionMobile: {
    fontSize: PROMPT_TYPE.mobile.fontSize,
    fontWeight: '800',
    lineHeight: PROMPT_TYPE.mobile.lineHeight,
  },
  parentheticalPromptText: {
    fontStyle: 'italic',
    opacity: 0.78,
  },
  gameOverText: { fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
  gameOverSubText: { fontSize: 16 },
  gameOverContainer: {
    alignItems: 'center',
    boxShadow: '0px 6px 12px rgba(0,0,0,0.16)',
  },
  emptyStateCard: {
    alignItems: 'center',
  },
  emptyStateTitle: {
    fontWeight: '800',
    textAlign: 'center',
  },
  emptyStateText: {
    fontWeight: '600',
    textAlign: 'center',
  },
  feedbackCard: { position: 'absolute', alignItems: 'center', justifyContent: 'center', zIndex: 10, borderWidth: 1.5, borderColor: 'rgba(223,255,238,0.5)', elevation: 7 },
  feedbackText: { color: '#fff', fontWeight: freshFontFamily.extrabold, textAlign: 'center' },
  gameModeButton: { borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  gameModeButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold', textAlign: 'center' },
  gameOverImage: {
    marginBottom: 16,
  },
});
