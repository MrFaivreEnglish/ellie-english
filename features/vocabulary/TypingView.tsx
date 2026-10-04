import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import Text, { ThemedTextInput as TextInput } from '../shared/ThemedText';
import MaterialIcons from '../shared/ThemedMaterialIcon';
import useReducedMotion from '../shared/useReducedMotion';
import { useAudioPlayer } from 'expo-audio';

import { useTypingGame } from './useTypingGame';
import type { Word } from '../../types/VocabularyTypes';
import { SOUND_EFFECT_OPTIONS, SUCCESS_SOUND, replayPooledSoundEffect } from '../shared/soundEffects';
import { clampNumber, getMatchWriteCardScale, getWebLessonScale, isDesktopWebWidth, scaleValue } from '../shared/responsiveLayout';
import { EXERCISE_MOBILE_HORIZONTAL_PADDING, EXERCISE_PANEL_RADIUS, getExercisePanelShadow } from '../shared/exerciseLayoutTokens';
import VocabularyCompletionModal from './VocabularyCompletionModal';
import Assets from '../../assets/index';
import { triggerSelectionHaptic, triggerSuccessHaptic, triggerWarningHaptic } from '../shared/haptics';
import { usePersistentExerciseKeyboard } from '../shared/usePersistentExerciseKeyboard';
import { reservesSoftKeyboardSpace, useStableViewportHeight } from '../shared/softKeyboardLayout';
import { FRESH_COLORS } from '../shared/freshDirection';
import { PERFECT_RUN_XP_MULTIPLIER } from '../progress/xpRewards';

type ThemeColors = {
  isDark?: boolean;
  background?: string;
  card?: string;
  surface?: string;
  surfaceAlt?: string;
  text?: string;
  border?: string;
  borderStrong?: string;
  progressTrack?: string;
  secondaryText?: string;
  primary?: string;
  success?: string;
  successSoft?: string;
  danger?: string;
  dangerSoft?: string;
  warning?: string;
  warningSoft?: string;
  buttonBackground?: string;
  buttonText?: string;
};

type FeedbackType = 'correct' | 'close' | 'wrong' | 'levelup' | null;
type DifficultyStats = {
  correct?: number;
  misses?: number;
  seen?: number;
};

interface TypingViewProps {
  words?: Word[];
  colors?: ThemeColors;
  isDarkMode?: boolean;
  allowSlashAlternatives?: boolean;
  promptLabel?: string;
  answerPlaceholder?: string;
  keyboardVisible?: boolean;
  isDesktopWeb?: boolean;





  practiceSheetReady?: boolean;
  layoutHeight?: number;
  forceAndroidLayout?: boolean;
  onShuffle?: () => void;
  onSessionComplete?: () => void;
  suppressCompletionScreen?: boolean;
  onGoToAccount?: () => void;
  onBack?: () => void;
  typingGame?: {
    attempts: Record<string, number>;
    correctAnswers: number;
    currentWord: Word | null;
    difficultyByWord?: Record<string, DifficultyStats>;
    feedbackEvent: { type: 'correct' | 'close' | 'wrong'; text: string; streak?: number; answer?: string } | null;
    goToNextWord: () => void;
    goToPreviousWord: () => void;
    handleSubmit: () => void | Promise<void>;
    canGoNext: boolean;
    canGoPrevious: boolean;
    isAdvancing: boolean;
    isReviewMode: boolean;
    isSessionComplete: boolean;
    inlineMessage: string;
    level: number;
    maxStreak: number;
    reset: () => void;
    reshuffleRemaining: () => void;
    comboBonus: number;
    commitPendingTypingXp?: () => Promise<number>;
    requestHint: () => void;
    currentHintCount: number;
    currentHintText: string;
    sessionXp: number;
    resolvedSessionXp?: number | null;
    setTypedAnswer: (value: string) => void;
    strictMode: boolean;
    streak: number;
    typedAnswer: string;
    typingFeedback?: 'correct' | 'close' | 'wrong' | null;
    typingIndex: number;
    firstTryCount?: number;
    wasPerfectRun?: boolean;
    totalAttempts: number;
    totalWords: number;
    xp: number;
  };
}

const ACCURACY_EMOJI = '\uD83C\uDFAF';
const COMBO_EMOJI = '\uD83D\uDD25';
const XP_EMOJI = '\u2728';
const STAR_EMOJI = '\u2B50';

const getTypingWordKey = (word: Word) => `${word.english.trim().toLowerCase()}|${word.french.trim().toLowerCase()}`;

const buildTheme = (colors?: ThemeColors) => {
  const isDark = colors?.isDark ?? false;

  return {
    isDark,
    background: colors?.background ?? (isDark ? '#071A2D' : FRESH_COLORS.pageBackground),
    card: colors?.card ?? (isDark ? '#0D2742' : FRESH_COLORS.cardSurface),
    text: colors?.text ?? (isDark ? '#F7FAFF' : FRESH_COLORS.inkPrimary),
    subText: colors?.secondaryText ?? (isDark ? '#C9DDF0' : FRESH_COLORS.inkSecondary),
    border: colors?.border ?? (isDark ? '#2A5C84' : FRESH_COLORS.hairline),
    primary: colors?.primary ?? colors?.buttonBackground ?? '#0D7DD4',
    success: colors?.success ?? (isDark ? '#4FD9C4' : '#17B8A6'),
    successSoft: colors?.successSoft ?? (isDark ? '#0F332F' : '#CCFBF1'),
    warning: colors?.warning ?? (isDark ? '#FFD36D' : '#FFBF51'),
    warningSoft: colors?.warningSoft ?? (isDark ? '#493912' : '#FFF4D8'),
    error: colors?.danger ?? (isDark ? '#FF9478' : '#FF7A59'),
    errorSoft: colors?.dangerSoft ?? (isDark ? '#3D1E14' : '#FFE4DA'),
    progressBg: colors?.progressTrack ?? colors?.border ?? (isDark ? '#2A5C84' : FRESH_COLORS.progressTodo),
    inputBackground: isDark
      ? (colors?.surface ?? '#162436')
      : (colors?.surfaceAlt ?? '#FFFFFF'),
    statsBackground: colors?.surface ?? (isDark ? '#123B61' : '#EEF2F7'),
    statsBorder: colors?.border ?? (isDark ? '#2A5C84' : '#E5E7EB'),
  };
};






const FEEDBACK_ALMOST_AVATAR_BG = '#F7E3B0';
const FEEDBACK_ALMOST_BUBBLE_BG = '#F9EED1';
const FEEDBACK_ALMOST_TEXT = '#765900';
const FEEDBACK_WRONG_AVATAR_BG = '#FFD6D1';
const FEEDBACK_WRONG_BUBBLE_BG = '#FFE7E4';
const FEEDBACK_WRONG_TEXT = '#9A3936';

export default function TypingView({
  words,
  colors,
  isDarkMode,
  allowSlashAlternatives = true,
  promptLabel = 'French',
  answerPlaceholder = 'Type the English translation',
  keyboardVisible = false,
  isDesktopWeb: isDesktopWebProp,
  practiceSheetReady = true,
  layoutHeight,
  forceAndroidLayout = false,
  onSessionComplete,
  suppressCompletionScreen = false,
  onGoToAccount,
  onBack,
  typingGame,
}: TypingViewProps) {
  const safeWords = words ?? [];
  const { width, height } = useWindowDimensions();
  const responsiveHeight = layoutHeight ?? height;
  const isDesktopWeb = isDesktopWebProp ?? (!forceAndroidLayout && isDesktopWebWidth(width));





  // Design scaling must not react to the keyboard-shrunk viewport.
  const stableViewportHeight = useStableViewportHeight();
  const webScale = getWebLessonScale(width, stableViewportHeight);




  const typingWebScale = isDesktopWeb ? Math.min(webScale * 1.06, 1.7) : webScale;




  const cardWidthWebScale = getMatchWriteCardScale(width, isDesktopWeb);






  const keyboardMode = keyboardVisible && !isDesktopWeb;
  const inputRef = useRef<React.ElementRef<typeof TextInput> | null>(null);
  // Two voices, alternated, so a correct answer never waits on the previous one rewinding.
  const successPlayer = useAudioPlayer(SUCCESS_SOUND, SOUND_EFFECT_OPTIONS);
  const successPlayerAlt = useAudioPlayer(SUCCESS_SOUND, SOUND_EFFECT_OPTIONS);
  const successVoiceCursor = useRef(0);
  const hasNotifiedCompletionRef = useRef(false);

  const [showFeedbackCard, setShowFeedbackCard] = useState(false);
  const [feedbackType, setFeedbackType] = useState<FeedbackType>(null);
  const [feedbackStreak, setFeedbackStreak] = useState(0);
  const [feedbackAnswer, setFeedbackAnswer] = useState('');

  const feedbackOpacity = useRef(new Animated.Value(0)).current;
  const feedbackTranslateY = useRef(new Animated.Value(16)).current;
  const feedbackAvatarFloat = useRef(new Animated.Value(0)).current;
  const comboFireScale = useRef(new Animated.Value(1)).current;
  const comboShakeAnim = useRef(new Animated.Value(0)).current;
  const progressBarAnim = useRef(new Animated.Value(0)).current;
  const wordFadeAnim = useRef(new Animated.Value(1)).current;
  const xpPulseAnim = useRef(new Animated.Value(1)).current;
  const prevXpRef = useRef(0);
  // Decorative motion only (floating Ellie, combo flame, shakes, pulses); progress and
  // feedback still update, just without the movement.
  const reducedMotion = useReducedMotion();

  const theme = useMemo(() => {
    const resolvedColors = {
      ...colors,
      isDark: isDarkMode ?? colors?.isDark,
    };

    const baseTheme = buildTheme(resolvedColors);
    const isDark = resolvedColors.isDark ?? false;

    return {
      ...baseTheme,
      subText: colors?.secondaryText ?? baseTheme.subText,


      primary: isDark ? '#3FA0DB' : FRESH_COLORS.exerciseBlue,
      buttonText: colors?.buttonText ?? '#FFFFFF',
      statsBackground: colors?.surface ?? baseTheme.statsBackground,
      statsBorder: colors?.border ?? baseTheme.statsBorder,
    };
  }, [colors, isDarkMode]);
  const internalTypingGame = useTypingGame(safeWords, { allowSlashAlternatives });

  const {
    feedbackEvent,
    goToNextWord,
    goToPreviousWord,
    handleSubmit,
    canGoNext,
    canGoPrevious,
    isAdvancing,
    isReviewMode,
    isSessionComplete,
    maxStreak,
    reset,
    requestHint,
    currentHintCount = 0,
    sessionXp,
    resolvedSessionXp,
    setTypedAnswer,
    strictMode,
    streak,
    typedAnswer,
    typingFeedback = null,
    typingIndex,
    firstTryCount = 0,
    wasPerfectRun = false,
    correctAnswers,
    difficultyByWord = {},
    totalAttempts,
    currentWord,
  } = typingGame ?? internalTypingGame;

  const prevStreakRef = useRef(streak);

  // "Go to account" dismisses the completion modal without resetting the session, so
  // isSessionComplete stays true underneath — track that dismissal separately so the
  // modal doesn't pop back up when the user returns from Account to this still-open screen.
  const [completionDismissedForAccount, setCompletionDismissedForAccount] = useState(false);
  useEffect(() => {
    if (!isSessionComplete) setCompletionDismissedForAccount(false);
  }, [isSessionComplete]);
  const handleGoToAccountFromCompletion = useCallback(() => {
    setCompletionDismissedForAccount(true);
    onGoToAccount?.();
  }, [onGoToAccount]);

  const isFinished = safeWords.length > 0 && isSessionComplete && !completionDismissedForAccount;
  const currentSourceLessonTitle =
    typeof currentWord?.sourceLesson?.title === 'string'
      ? currentWord.sourceLesson.title.trim()
      : '';





  const shouldReserveKeyboardSpace = reservesSoftKeyboardSpace(width);

  const accuracy = useMemo(() => {
    if (totalAttempts === 0) {
      return 100;
    }

    return Math.round((correctAnswers / totalAttempts) * 100);
  }, [correctAnswers, totalAttempts]);


  const weakWords = useMemo(
    () => safeWords.filter((word) => {
      const key = getTypingWordKey(word);
      const stats = difficultyByWord[key];
      const misses = stats?.misses ?? 0;
      const correct = stats?.correct ?? 0;

      return misses > 0 && correct < Math.max(2, misses + 1);
    }),
    [difficultyByWord, safeWords]
  );
  const completionTitleText = accuracy === 100
    ? 'Perfect typing!'
    : accuracy >= 90
      ? 'Great typing!'
      : 'Nice work!';
  const completionSubtitleText = accuracy === 100
    ? 'Clean round. You got every word.'
    : 'You finished the round. Nice work!';
  const playSuccessSound = useCallback(() => {
    replayPooledSoundEffect([successPlayer, successPlayerAlt], successVoiceCursor);
  }, [successPlayer, successPlayerAlt]);

  const triggerFeedbackCard = useCallback(
    (type: FeedbackType, streak: number, answer: string) => {
      setFeedbackType(type);
      setFeedbackStreak(streak);
      setFeedbackAnswer(answer);
      setShowFeedbackCard(true);

      const canUseNativeDriver = Platform.OS !== 'web';
      const easeCurve = Easing.bezier(0.25, 0.1, 0.25, 1);
      feedbackOpacity.setValue(0);
      feedbackTranslateY.setValue(16);

      const displayDuration = type === 'correct' ? 900 : type === 'wrong' ? 1700 : 1200;

      Animated.sequence([
        Animated.parallel([
          Animated.timing(feedbackOpacity, {
            toValue: 1,
            duration: 300,
            easing: easeCurve,
            useNativeDriver: canUseNativeDriver,
          }),
          Animated.timing(feedbackTranslateY, {
            toValue: 0,
            duration: 300,
            easing: easeCurve,
            useNativeDriver: canUseNativeDriver,
          }),
        ]),
        Animated.delay(displayDuration),
        Animated.parallel([
          Animated.timing(feedbackOpacity, {
            toValue: 0,
            duration: 160,
            useNativeDriver: canUseNativeDriver,
          }),
          Animated.timing(feedbackTranslateY, {
            toValue: 16,
            duration: 160,
            useNativeDriver: canUseNativeDriver,
          }),
        ]),
      ]).start(({ finished }) => {
        // Only a card that ran its full course hides itself. When the next answer comes in
        // first, this sequence is interrupted, and hiding then removed the new card at once.
        if (finished) setShowFeedbackCard(false);
      });
    },
    [feedbackOpacity, feedbackTranslateY]
  );


  useEffect(() => {
    if (!showFeedbackCard || feedbackType === 'correct' || feedbackType === null || reducedMotion) {
      feedbackAvatarFloat.setValue(0);
      return;
    }

    const canUseNativeDriver = Platform.OS !== 'web';
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(feedbackAvatarFloat, {
          toValue: -6,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: canUseNativeDriver,
        }),
        Animated.timing(feedbackAvatarFloat, {
          toValue: 0,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: canUseNativeDriver,
        }),
      ])
    );
    loop.start();

    return () => {
      loop.stop();
      // Resetting a native-driven value while the screen is closing could hit a view that
      // is already gone, which crashed the app when leaving right after a wrong answer.
      // stopAnimation is safe in both cases; the card remounts at 0 anyway.
      feedbackAvatarFloat.stopAnimation();
    };
  }, [showFeedbackCard, feedbackType, feedbackAvatarFloat, reducedMotion]);

  // Leaving mid-feedback: stop the card's own animation instead of letting it finish
  // against a closed screen.
  useEffect(() => {
    return () => {
      feedbackOpacity.stopAnimation();
      feedbackTranslateY.stopAnimation();
    };
  }, [feedbackOpacity, feedbackTranslateY]);

  // Set when the student taps empty space to put the keyboard away; cleared when they tap
  // back into the input or move to the next word.
  const [keyboardDismissed, setKeyboardDismissed] = useState(false);

  const {
    isScreenFocused,
    shouldKeepKeyboardOpen,
    focusInputSequence,
    focusOnExerciseChange,
    clearFocusTimeouts,
  } = usePersistentExerciseKeyboard({
    inputRef,
    // Tapping empty space dismisses the keyboard (same as Fill). That has to switch this
    // hook off, not just call Keyboard.dismiss() — its Android focus retries would
    // otherwise refocus the input a few hundred ms later and reopen the keyboard.
    enabled: !isFinished && !keyboardDismissed,
    androidFocusRetries: Platform.OS === 'android' || forceAndroidLayout,
  });
  const shouldAutoFocusInput = isScreenFocused;





  const isSubmitRefocusPendingRef = useRef(false);







  const handleInputFocus = useCallback(() => {
    // Tapping back into the field opts back into the keyboard staying open.
    setKeyboardDismissed(false);
  }, []);

  // Web only fires onPress from the DOM click, which bubbles out of the input up to the
  // tap-to-dismiss Pressable wrapping the exercise, so a tap focused the field and was then
  // blurred again in the same tick, and mobile browsers never showed the keyboard at all.
  // Giving the field its own Pressable consumes that click (react-native-web stops
  // propagation at the first PressResponder ancestor), the same shape Fill already uses.
  // Native is unaffected: there the touch never reached the outer Pressable to begin with.
  const handleInputAreaPress = useCallback(() => {
    setKeyboardDismissed(false);
    // Focus straight from the tap handler: iOS Safari only opens the keyboard for a focus()
    // call made inside the user gesture, so the hook's requestAnimationFrame path is too late.
    inputRef.current?.focus();
  }, []);

  const onSubmit = useCallback(() => {
    if (isAdvancing || !typedAnswer.trim()) {
      return;
    }

    isSubmitRefocusPendingRef.current = true;
    void Promise.resolve(handleSubmit()).finally(() => {
      if (isFinished) {
        isSubmitRefocusPendingRef.current = false;
        return;
      }
      focusInputSequence([90, 760]);
      setTimeout(() => {
        isSubmitRefocusPendingRef.current = false;
      }, 800);
    });
  }, [focusInputSequence, handleSubmit, isAdvancing, isFinished, typedAnswer]);

  const handlePlayAgain = useCallback(() => {
    triggerSelectionHaptic();
    reset();

    requestAnimationFrame(() => {
      setTimeout(() => {
        if (!shouldAutoFocusInput) {
          return;
        }

        inputRef.current?.focus();
      }, 150);
    });
  }, [reset, shouldAutoFocusInput]);

  const handlePreviousWordPress = useCallback(() => {
    if (!canGoPrevious || isAdvancing) return;
    triggerSelectionHaptic();
    goToPreviousWord();
  }, [canGoPrevious, goToPreviousWord, isAdvancing]);

  const handleNextWordPress = useCallback(() => {
    if (!canGoNext || isAdvancing) return;
    triggerSelectionHaptic();
    goToNextWord();
  }, [canGoNext, goToNextWord, isAdvancing]);

  useEffect(() => {
    if (!feedbackEvent?.type) {
      return;
    }

    if (feedbackEvent.type === 'correct') {
      triggerSuccessHaptic();
      void playSuccessSound();
    } else {
      triggerWarningHaptic();
    }

    triggerFeedbackCard(feedbackEvent.type, feedbackEvent.streak ?? 0, feedbackEvent.answer ?? '');
  }, [feedbackEvent, playSuccessSound, triggerFeedbackCard]);

  // Early focus can resize Android's stage during the sheet entrance animation.
  useEffect(() => {
    if (!shouldKeepKeyboardOpen || !practiceSheetReady) {
      return;
    }



    focusOnExerciseChange();
  }, [focusOnExerciseChange, practiceSheetReady, shouldKeepKeyboardOpen, typingIndex]);

  // Moving to the next word starts fresh: the effect above can't do this, since it bails
  // out while the keyboard is dismissed (shouldKeepKeyboardOpen is false by then).
  useEffect(() => {
    setKeyboardDismissed(false);
  }, [typingIndex]);

  // Mirrors Fill: disabling the hook should already stop it refocusing, but Fill also kills
  // any in-flight focus timer and blurs the field outright, and that's the version that
  // actually holds on Android — a retry queued a moment before the tap would otherwise
  // still land and pull the keyboard straight back up.
  useEffect(() => {
    if (!keyboardDismissed) return;
    clearFocusTimeouts();
    inputRef.current?.blur();
  }, [clearFocusTimeouts, keyboardDismissed]);






  useEffect(() => {
    if (!shouldKeepKeyboardOpen || !practiceSheetReady) {
      return;
    }

    focusInputSequence([120, 360]);
  }, [focusInputSequence, practiceSheetReady, shouldKeepKeyboardOpen]);

  useEffect(() => {
    if (!isFinished) {
      hasNotifiedCompletionRef.current = false;
      return;
    }

    if (hasNotifiedCompletionRef.current) {
      return;
    }

    hasNotifiedCompletionRef.current = true;
    onSessionComplete?.();
  }, [isFinished, onSessionComplete]);

  useEffect(() => {
    if (streak < 3 || reducedMotion) {
      comboFireScale.setValue(1);
      return;
    }

    const peakScale = Math.min(1.42, 1.1 + streak * 0.025);

    comboFireScale.setValue(1);
    Animated.sequence([
      Animated.spring(comboFireScale, {
        toValue: peakScale,
        friction: 4,
        tension: 160,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.spring(comboFireScale, {
        toValue: 1,
        friction: 5,
        tension: 120,
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]).start();
  }, [comboFireScale, streak, reducedMotion]);

  useEffect(() => {
    const wasCombo = prevStreakRef.current >= 3;
    prevStreakRef.current = streak;
    if (wasCombo && streak === 0 && !reducedMotion) {
      Animated.sequence([
        Animated.timing(comboShakeAnim, { toValue: -7, duration: 55, useNativeDriver: Platform.OS !== 'web' }),
        Animated.timing(comboShakeAnim, { toValue: 7, duration: 55, useNativeDriver: Platform.OS !== 'web' }),
        Animated.timing(comboShakeAnim, { toValue: -4, duration: 45, useNativeDriver: Platform.OS !== 'web' }),
        Animated.timing(comboShakeAnim, { toValue: 0, duration: 45, useNativeDriver: Platform.OS !== 'web' }),
      ]).start();
    }
  }, [comboShakeAnim, streak, reducedMotion]);

  useEffect(() => {
    const target = safeWords.length > 0
      ? Math.min(100, Math.round(((typingIndex + 1) / safeWords.length) * 100))
      : 0;
    if (typingIndex === 0) {
      progressBarAnim.setValue(target);
    } else {
      // Native-drivable because the fill scales rather than animating its width — a width
      // percentage would force a JS-thread layout pass on every frame.
      Animated.timing(progressBarAnim, { toValue: target, duration: 300, useNativeDriver: true }).start();
    }
  }, [typingIndex, safeWords.length, progressBarAnim]);

  useEffect(() => {
    wordFadeAnim.setValue(0.45);
    Animated.timing(wordFadeAnim, { toValue: 1, duration: 180, useNativeDriver: Platform.OS !== 'web' }).start();
  }, [typingIndex, wordFadeAnim]);

  useEffect(() => {
    if (sessionXp > prevXpRef.current && !reducedMotion) {
      Animated.sequence([
        Animated.spring(xpPulseAnim, { toValue: 1.11, friction: 4, tension: 260, useNativeDriver: Platform.OS !== 'web' }),
        Animated.spring(xpPulseAnim, { toValue: 1, friction: 5, tension: 180, useNativeDriver: Platform.OS !== 'web' }),
      ]).start();
    }
    prevXpRef.current = sessionXp;
  }, [sessionXp, xpPulseAnim, reducedMotion]);

  if (!safeWords.length) {
    return null;
  }

  if (isFinished && suppressCompletionScreen) {
    return null;
  }

  const translateTargetLabel = promptLabel === 'English' ? 'French' : 'English';




  const renderMobileContent = () => {
    // responsiveHeight is the real *measured* stage height (via layoutHeight), so it already
    // reflects however much browser chrome or a category button actually ate into the
    // viewport on this device — mobile web doesn't need a lower ceiling than native here, and
    // capping it low was leaving real headroom (e.g. on a phone browser with a shrunk-but-tall
    // viewport) unused. The floor must also stay low enough to shrink when a category button
    // eats space above, or the card renders at the floor regardless of how much room is left.
    const interactiveCardMinHeight = Math.round(clampNumber(
      responsiveHeight * (keyboardMode ? 0.50 : 0.58),
      keyboardMode ? 260 : 300,
      keyboardMode ? 510 : 620
    ));

    const promptMinHeight = Math.round(clampNumber(
      responsiveHeight * (keyboardMode ? 0.20 : 0.16),
      keyboardMode ? 100 : 94,
      keyboardMode ? 172 : 150
    ));
    // Native and mobile-web differ only by how much room is actually measured
    // (responsiveHeight/keyboardMode), not by a separate per-OS number — the phone-size
    // curve (webScale) covers "this device has more room" instead of an isAndroid fork.
    const promptFontSize = scaleValue(keyboardMode ? 28 : 38, webScale);
    const promptLineHeight = scaleValue(keyboardMode ? 34 : 46, webScale);
    const contentHorizontalPadding = scaleValue(EXERCISE_MOBILE_HORIZONTAL_PADDING, webScale);
    const contentBottomPadding = scaleValue(keyboardMode ? 44 : shouldReserveKeyboardSpace ? 24 : 16, webScale);
    const answerMarginTop = scaleValue(keyboardMode ? 4 : 12, webScale);
    const inputVerticalPadding = scaleValue(keyboardMode ? 12 : 13, webScale);
    const inputFontSize = scaleValue(keyboardMode ? 17 : 20, webScale);
    const checkButtonMobileStyle = {
      minHeight: scaleValue(keyboardMode ? 44 : 52, webScale),
      paddingVertical: scaleValue(keyboardMode ? 9 : 12, webScale),
      paddingHorizontal: scaleValue(24, webScale),
    };
    const checkButtonRowMarginTop = scaleValue(keyboardMode ? 8 : 10, webScale);

    return (
      <Pressable
        onPress={() => {
          // Same as Fill: flip the flag first so the persistent-keyboard hook's Android
          // focus retries are cleared, then dismiss on the next tick — a same-tick dismiss
          // races those timers and gets silently reopened.
          setKeyboardDismissed(true);
          inputRef.current?.blur();
          setTimeout(() => Keyboard.dismiss(), 0);
        }}
        style={[
          styles.contentContainer,
          {
            // Matches the practice sheet's own surface (theme.background) — this is a
            // passive wrapper, not a card, so it should blend into the sheet rather than
            // stand out as a distinctly-colored block. The actual interactive pieces inside
            // (input, buttons) keep theme.card so they still read as tappable surfaces.
            backgroundColor: theme.background,
            // Stretches into the space between the exercise and the keyboard so tapping
            // there dismisses too. Content still sits at the top (justifyContent above).
            flex: 1,
            paddingTop: 0,
            paddingBottom: contentBottomPadding,
            paddingHorizontal: contentHorizontalPadding,
            minHeight: keyboardMode ? undefined : interactiveCardMinHeight + (shouldReserveKeyboardSpace ? 20 : 32),
          },
        ]}
      >
        <View
          style={[
            styles.card,
            styles.interactiveCard,
            {
              backgroundColor: theme.background,
              borderColor: 'transparent',
              borderWidth: 0,
              padding: 0,
              minHeight: interactiveCardMinHeight,
            },
          ]}
        >
          {/* Was 20: that padding existed to push the exercise down, but the prompt/answer
              group is bottom-anchored now, so it only added dead space above the bar. */}
          <View
            style={[
              styles.writeMetaBlock,
              {
                paddingTop: scaleValue(8, webScale),
                // Opens up the gap under the progress bar (and above the metrics row).
                gap: scaleValue(12, webScale),
              },
            ]}
          >
            <View
              style={[
                styles.writeProgressTrack,



                { height: Math.round(6 * typingWebScale) },
                { backgroundColor: theme.progressBg },
              ]}
            >
              <Animated.View
                style={[
                  styles.writeProgressFill,
                  {
                    backgroundColor: theme.primary,
                    // Full width scaled from the left edge, rather than an animated width
                    // percentage — this form can run on the native driver.
                    width: '100%',
                    transformOrigin: 'left',
                    transform: [{
                      scaleX: progressBarAnim.interpolate({ inputRange: [0, 100], outputRange: [0, 1] }),
                    }],
                  },
                ]}
              />
            </View>

            <View style={[styles.writeMetricsRow, styles.writeMetricsRowMobile]}>
              <View style={styles.writeMetricsGroup}>
                <View style={styles.writeMetricCol}>
                  <Text style={[styles.writeMetricLabel, { color: theme.subText }]}>Word</Text>
                  <Text style={[styles.writeMetricValue, { color: theme.primary }]}>
                    {typingIndex + 1} / {safeWords.length}
                  </Text>
                </View>
                <View style={[styles.writeMetricDivider, { backgroundColor: theme.border }]} />
                <Animated.View style={[styles.writeMetricCol, { transform: [{ translateX: comboShakeAnim }] }]}>
                  <Text style={[styles.writeMetricLabel, { color: theme.subText }]}>Combo</Text>
                  <View style={styles.comboValueRow}>
                    <Text style={[styles.writeMetricValue, { color: theme.text }]}>
                      {streak}
                    </Text>
                    {streak >= 3 && (
                      <Animated.Text style={[styles.comboFireEmoji, { transform: [{ scale: comboFireScale }] }]}>
                        {COMBO_EMOJI}
                      </Animated.Text>
                    )}
                  </View>
                </Animated.View>
                <View style={[styles.writeMetricDivider, { backgroundColor: theme.border }]} />
                <View style={styles.writeMetricCol}>
                  <Text style={[styles.writeMetricLabel, { color: theme.subText }]}>XP</Text>
                  <Animated.Text
                    style={[
                      styles.writeMetricValue,
                      { color: theme.text, transform: [{ scale: xpPulseAnim }] },
                    ]}
                  >
                    {sessionXp}
                  </Animated.Text>
                </View>
              </View>
            </View>

            <Text style={[styles.writeTaskLabel, styles.writeTaskLabelMobile, { color: theme.primary }]}>
              Translate to {translateTargetLabel}
            </Text>
          </View>

          {(isReviewMode || strictMode) && (
            <View style={styles.modeStatusRow}>
              {isReviewMode && (
                <View
                  style={[
                    styles.modeStatusBadge,
                    styles.reviewModeBadge,
                    {
                      backgroundColor: theme.warningSoft,
                      borderColor: theme.warning,
                    },
                  ]}
                >
                  <MaterialIcons name="workspace-premium" size={14} color={theme.warning} />
                  <Text style={[styles.modeStatusText, { color: theme.text }]}>Final Review</Text>
                </View>
              )}

              {strictMode && (
                <View
                  style={[
                    styles.modeStatusBadge,
                    {
                      backgroundColor: theme.statsBackground,
                      borderColor: theme.statsBorder,
                    },
                  ]}
                >
                  <MaterialIcons name="rule" size={14} color={theme.subText} />
                  <Text style={[styles.modeStatusText, { color: theme.subText }]}>Strict</Text>
                </View>
              )}
            </View>
          )}

          <View style={[styles.gameAreaWrap, { flex: 1 }]}>
          {/* Bottom-anchored at rest so the prompt/answer block sits lower rather than
              floating mid-card with dead space above and below; centered once a real
              keyboard is up, since that's the state the keyboard-safety fixes were tuned for. */}
          <View style={[styles.promptAnswerGroup, { justifyContent: keyboardMode ? 'center' : 'flex-end' }]}>
          <View style={styles.promptCenterWrap}>
          <View
            style={[
              styles.promptOverlayWrap,
              {
                minHeight: promptMinHeight,
                justifyContent: 'center',
                // Sits the word lower in its box, opening up space above it.
                paddingTop: scaleValue(18, webScale),
              },
            ]}
          >
            <View style={styles.writeWordRow}>
              <Animated.Text
                style={[
                  styles.writeWordText,
                  {
                    color: theme.isDark ? theme.text : '#1e1a10',
                    fontSize: promptFontSize,
                    lineHeight: promptLineHeight,
                    opacity: wordFadeAnim,
                  },
                ]}
              >
                {currentWord?.french}
              </Animated.Text>
            </View>
            {currentSourceLessonTitle ? (
              <View
                style={[
                  styles.promptSourceBadge,
                  styles.promptSourceBadgeInline,
                  {
                    backgroundColor: theme.statsBackground,
                    borderColor: theme.statsBorder,
                  },
                ]}
              >
                <MaterialIcons name="auto-stories" size={13} color={theme.primary} />
                <Text
                  style={[styles.promptSourceBadgeText, { color: theme.subText }]}
                  numberOfLines={1}
                >
                  {currentSourceLessonTitle}
                </Text>
              </View>
            ) : null}
          </View>
          </View>

          <View style={{ position: 'relative' }}>
          <View style={[styles.answerPanel, { marginTop: answerMarginTop }]}>
            <Pressable style={styles.inputWrap} onPress={handleInputAreaPress}>
              <TextInput
                ref={inputRef}
                value={typedAnswer}
                onChangeText={setTypedAnswer}
                onSubmitEditing={onSubmit}
                submitBehavior="submit"
                autoCapitalize="none"
                autoCorrect={false}
                showSoftInputOnFocus
                returnKeyType="send"
                onFocus={handleInputFocus}
                style={[
                  styles.input,
                  keyboardMode && styles.inputTight,
                  !strictMode && styles.inputWithHint,
                  {
                    color: theme.text,
                    backgroundColor: theme.card,
                    borderColor: typingFeedback === 'correct'
                      ? theme.success
                      : typingFeedback === 'close'
                        ? theme.warning
                        : typingFeedback === 'wrong'
                          ? theme.error
                          : typedAnswer.trim()
                            ? theme.primary
                            : theme.border,
                    paddingVertical: inputVerticalPadding,
                    fontSize: inputFontSize,
                  },
                  Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : null,
                ]}
              />
              {!typedAnswer && (
                <View
                  style={[
                    styles.inputPlaceholderOverlay,
                    !strictMode && styles.inputPlaceholderOverlayWithHint,
                    { pointerEvents: 'none' },
                  ]}
                >
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.inputPlaceholderText,
                      { color: theme.subText, fontSize: keyboardMode ? 16 : inputFontSize },
                    ]}
                  >
                    {answerPlaceholder}
                  </Text>
                </View>
              )}
              {!strictMode && (
              <TouchableOpacity
                onPress={requestHint}
                disabled={isAdvancing}
                accessibilityRole="button"
                accessibilityLabel="Show hint"
                  style={[
                    styles.hintIconButton,
                    {
                      backgroundColor: theme.warningSoft,
                      borderColor: theme.warning,
                      opacity: isAdvancing ? 0.5 : 1,
                    },
                  ]}
                >
                  <MaterialIcons
                    name="lightbulb-outline"
                    size={keyboardMode ? 16 : 18}
                    color={theme.isDark ? theme.warning : '#8a5a00'}
                  />
                  {currentHintCount > 0 && (
                    <Text style={[styles.hintIconCount, { color: theme.isDark ? theme.warning : '#8a5a00' }]}>{currentHintCount}</Text>
                  )}
                </TouchableOpacity>
              )}
            </Pressable>

            <View style={[styles.checkButtonRow, { marginTop: checkButtonRowMarginTop }]}>
              <TouchableOpacity
                onPress={handlePreviousWordPress}
                disabled={!canGoPrevious || isAdvancing}
                accessibilityRole="button"
                accessibilityLabel="Previous word"
                style={[
                  styles.navArrowInline,
                  keyboardMode && styles.navArrowInlineTight,
                  {
                    backgroundColor: theme.card,
                    borderColor: theme.border,
                    opacity: !canGoPrevious || isAdvancing ? 0.4 : 1,
                  },
                ]}
              >
                <MaterialIcons name="chevron-left" size={20} color={theme.text} />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={onSubmit}
                disabled={isAdvancing || !typedAnswer.trim()}
                style={[
                  styles.button,
                  styles.primaryCheckButton,
                  keyboardMode && styles.primaryCheckButtonTight,
                  checkButtonMobileStyle,
                  {
                    flex: 1,
                    marginTop: 0,




                    backgroundColor: typingFeedback === 'correct'
                      ? theme.success
                      : typingFeedback === 'close'
                        ? theme.warning
                        : typingFeedback === 'wrong'
                          ? theme.error
                          : theme.primary,
                    opacity: isAdvancing || !typedAnswer.trim() ? 0.55 : 1,
                  },
                ]}
              >
                <MaterialIcons name="check" size={17} color={theme.buttonText} />
                <Text style={[styles.buttonText, { color: theme.buttonText }]}>Check</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleNextWordPress}
                disabled={!canGoNext || isAdvancing}
                accessibilityRole="button"
                accessibilityLabel="Next word"
                style={[
                  styles.navArrowInline,
                  keyboardMode && styles.navArrowInlineTight,
                  {
                    backgroundColor: theme.card,
                    borderColor: theme.border,
                    opacity: !canGoNext || isAdvancing ? 0.4 : 1,
                  },
                ]}
              >
                <MaterialIcons name="chevron-right" size={20} color={theme.text} />
              </TouchableOpacity>
            </View>
          </View>
          {showFeedbackCard && feedbackType === 'correct' && (
            <Animated.View
              style={[
                styles.correctFeedbackCard,
                styles.feedbackOverlay,
                { pointerEvents: 'none' },
                {
                  backgroundColor: theme.isDark
                    ? 'rgba(34, 197, 94, 0.98)'
                    : 'rgba(34, 197, 94, 0.99)',
                  borderColor: theme.isDark ? '#4ADE80' : '#16A34A',
                  boxShadow: '0px 8px 14px rgba(34, 197, 94, 0.18)',
                  opacity: feedbackOpacity,
                  transform: [{ translateY: feedbackTranslateY }],
                },
              ]}
            >
              <Text style={styles.correctFeedbackEmoji}>🎉</Text>
              <Text style={styles.correctFeedbackTitle}>
                Great job!
              </Text>
              {feedbackStreak >= 2 && (
                <View style={styles.correctFeedbackComboPill}>
                  <Text style={styles.correctFeedbackComboText}>
                    Combo ×{feedbackStreak}
                  </Text>
                </View>
              )}
            </Animated.View>
          )}
          {showFeedbackCard && (feedbackType === 'close' || feedbackType === 'wrong') && (
            <Animated.View
              style={[
                styles.mascotFeedbackRow,
                styles.feedbackOverlay,
                {
                  alignItems: 'stretch',
                  backgroundColor: feedbackType === 'wrong' ? FEEDBACK_WRONG_BUBBLE_BG : FEEDBACK_ALMOST_BUBBLE_BG,
                  borderRadius: EXERCISE_PANEL_RADIUS,
                },
                { pointerEvents: 'none' },
                {
                  opacity: feedbackOpacity,
                  transform: [{ translateY: feedbackTranslateY }],
                },
              ]}
            >
              <Animated.View
                style={[
                  styles.mascotAvatar,
                  { alignSelf: 'center' },
                  // These were fixed px while everything around them scales with the phone
                  // size curve, so the avatar crowded the message on a small screen and
                  // looked undersized on a large one.
                  {
                    width: scaleValue(76, webScale),
                    height: scaleValue(76, webScale),
                    borderRadius: scaleValue(38, webScale),
                  },
                  {
                    backgroundColor: feedbackType === 'wrong' ? FEEDBACK_WRONG_AVATAR_BG : FEEDBACK_ALMOST_AVATAR_BG,
                    transform: [{ translateY: feedbackAvatarFloat }],
                  },
                ]}
              >
                {feedbackType === 'wrong' ? (
                  <MaterialIcons name="sentiment-dissatisfied" size={scaleValue(38, webScale)} color={FEEDBACK_WRONG_TEXT} />
                ) : (
                  <Text style={[styles.mascotAvatarEmoji, { fontSize: scaleValue(40, webScale) }]}>🤏</Text>
                )}
              </Animated.View>
              <View
                style={[
                  styles.mascotBubble,
                  { justifyContent: 'center' },
                  {
                    paddingVertical: scaleValue(18, webScale),
                    paddingHorizontal: scaleValue(20, webScale),
                  },
                  { backgroundColor: feedbackType === 'wrong' ? FEEDBACK_WRONG_BUBBLE_BG : FEEDBACK_ALMOST_BUBBLE_BG },
                ]}
              >
                <View
                  style={[
                    styles.mascotBubbleTail,
                    { backgroundColor: feedbackType === 'wrong' ? FEEDBACK_WRONG_BUBBLE_BG : FEEDBACK_ALMOST_BUBBLE_BG },
                  ]}
                />
                {feedbackType === 'wrong' ? (
                  <>
                    <Text style={[styles.mascotHeadline, { fontSize: scaleValue(24, webScale), color: FEEDBACK_WRONG_TEXT }]}>
                      Not this time.
                    </Text>
                    <Text style={[styles.mascotSubtext, { fontSize: scaleValue(18, webScale), color: FEEDBACK_WRONG_TEXT }]}>
                      Correct answer: <Text style={{ fontWeight: '800' }}>{feedbackAnswer}</Text>
                    </Text>
                  </>
                ) : (
                  <Text style={[styles.mascotHeadline, { fontSize: scaleValue(24, webScale), color: FEEDBACK_ALMOST_TEXT }]}>
                    {feedbackStreak > 0 ? 'So close — one more try before you lose your combo!' : 'So close — one more try!'}
                  </Text>
                )}
              </View>
            </Animated.View>
          )}
          </View>
          </View>
          </View>
        </View>
      </Pressable>
    );
  };




  const renderDesktopContent = () => {
    const interactiveCardMinHeight = Math.round(clampNumber(
      responsiveHeight * 0.80,
      scaleValue(420, typingWebScale),
      scaleValue(550, typingWebScale)
    ));
    const promptMinHeight = scaleValue(146, typingWebScale);
    const promptFontSize = scaleValue(52, typingWebScale);
    const promptLineHeight = scaleValue(61, typingWebScale);
    const contentBottomPadding = shouldReserveKeyboardSpace ? 24 : 16;
    const inputVerticalPadding = scaleValue(18, typingWebScale);
    const inputFontSize = scaleValue(23, typingWebScale);

    return (
      <View
        style={[
          styles.contentContainer,
          {
            // Matches the practice sheet's own surface (theme.background) — see the same
            // fix in renderMobileContent; this passive wrapper should blend into the sheet.
            backgroundColor: theme.background,
            paddingTop: 0,
            paddingBottom: contentBottomPadding,
            paddingHorizontal: 18,
            minHeight: interactiveCardMinHeight + (shouldReserveKeyboardSpace ? 20 : 32),
          },
        ]}
      >
        <View
          style={[
            styles.card,
            styles.interactiveCard,
            styles.interactiveCardDesktopWeb,
            { maxWidth: scaleValue(1237, cardWidthWebScale) },
            {
              backgroundColor: theme.background,
              borderColor: 'transparent',
              borderWidth: 0,
              padding: 0,
              minHeight: interactiveCardMinHeight,
            },
          ]}
        >
          <View style={[styles.writeMetaBlock, styles.writeMetaBlockDesktopTopGap]}>
            <View
              style={[
                styles.writeProgressTrack,
                { backgroundColor: theme.progressBg },
                styles.writeProgressTrackDesktopWeb,
              ]}
            >
              <Animated.View
                style={[
                  styles.writeProgressFill,
                  {
                    backgroundColor: theme.primary,
                    // Full width scaled from the left edge, rather than an animated width
                    // percentage — this form can run on the native driver.
                    width: '100%',
                    transformOrigin: 'left',
                    transform: [{
                      scaleX: progressBarAnim.interpolate({ inputRange: [0, 100], outputRange: [0, 1] }),
                    }],
                  },
                ]}
              />
            </View>

            <View style={styles.writeMetricsRow}>
              <Text
                style={[
                  styles.writeTaskLabel,
                  { fontSize: Math.round(10 * cardWidthWebScale) },
                  { color: theme.primary },
                ]}
                numberOfLines={1}
              >
                Translate to {translateTargetLabel}
              </Text>

              <View style={styles.writeMetricsGroup}>
                <View style={styles.writeMetricCol}>
                  <Text style={[styles.writeMetricLabel, { fontSize: Math.round(9 * cardWidthWebScale) }, { color: theme.subText }]}>Word</Text>
                  <Text style={[styles.writeMetricValue, { fontSize: Math.round(18 * cardWidthWebScale), lineHeight: Math.round(20 * cardWidthWebScale) }, { color: theme.primary }]}>
                    {typingIndex + 1} / {safeWords.length}
                  </Text>
                </View>
                <View style={[styles.writeMetricDivider, { backgroundColor: theme.border }]} />
                <Animated.View style={[styles.writeMetricCol, { transform: [{ translateX: comboShakeAnim }] }]}>
                  <Text style={[styles.writeMetricLabel, { fontSize: Math.round(9 * cardWidthWebScale) }, { color: theme.subText }]}>Combo</Text>
                  <View style={styles.comboValueRow}>
                    <Text style={[styles.writeMetricValue, { fontSize: Math.round(18 * cardWidthWebScale), lineHeight: Math.round(20 * cardWidthWebScale) }, { color: theme.text }]}>
                      {streak}
                    </Text>
                    {streak >= 3 && (
                      <Animated.Text style={[styles.comboFireEmoji, { transform: [{ scale: comboFireScale }] }]}>
                        {COMBO_EMOJI}
                      </Animated.Text>
                    )}
                  </View>
                </Animated.View>
                <View style={[styles.writeMetricDivider, { backgroundColor: theme.border }]} />
                <View style={styles.writeMetricCol}>
                  <Text style={[styles.writeMetricLabel, { fontSize: Math.round(9 * cardWidthWebScale) }, { color: theme.subText }]}>XP</Text>
                  <Animated.Text
                    style={[
                      styles.writeMetricValue,
                      { fontSize: Math.round(18 * cardWidthWebScale), lineHeight: Math.round(20 * cardWidthWebScale) },
                      { color: theme.text, transform: [{ scale: xpPulseAnim }] },
                    ]}
                  >
                    {sessionXp}
                  </Animated.Text>
                </View>
              </View>
            </View>
          </View>

          {(isReviewMode || strictMode) && (
            <View style={styles.modeStatusRow}>
              {isReviewMode && (
                <View
                  style={[
                    styles.modeStatusBadge,
                    styles.reviewModeBadge,
                    {
                      backgroundColor: theme.warningSoft,
                      borderColor: theme.warning,
                    },
                  ]}
                >
                  <MaterialIcons name="workspace-premium" size={scaleValue(14, typingWebScale)} color={theme.warning} />
                  <Text style={[styles.modeStatusText, { color: theme.text }]}>Final Review</Text>
                </View>
              )}

              {strictMode && (
                <View
                  style={[
                    styles.modeStatusBadge,
                    {
                      backgroundColor: theme.statsBackground,
                      borderColor: theme.statsBorder,
                    },
                  ]}
                >
                  <MaterialIcons name="rule" size={scaleValue(14, typingWebScale)} color={theme.subText} />
                  <Text style={[styles.modeStatusText, { color: theme.subText }]}>Strict</Text>
                </View>
              )}
            </View>
          )}

          <View style={[styles.gameAreaWrap, { maxWidth: scaleValue(700, typingWebScale) }, { flex: 1 }]}>
          <View style={styles.promptAnswerGroup}>
          <View style={styles.promptCenterWrap}>
          <View
            style={[
              styles.promptOverlayWrap,
              { maxWidth: scaleValue(700, typingWebScale) },
              { minHeight: promptMinHeight, justifyContent: 'center' },
            ]}
          >
            <View style={styles.writeWordRow}>
              <Animated.Text
                style={[
                  styles.writeWordText,
                  {
                    color: theme.isDark ? theme.text : '#1e1a10',
                    fontSize: promptFontSize,
                    lineHeight: promptLineHeight,
                    opacity: wordFadeAnim,
                  },
                ]}
              >
                {currentWord?.french}
              </Animated.Text>
            </View>
            {currentSourceLessonTitle ? (
              <View
                style={[
                  styles.promptSourceBadge,
                  styles.promptSourceBadgeInline,
                  {
                    backgroundColor: theme.statsBackground,
                    borderColor: theme.statsBorder,
                  },
                ]}
              >
                <MaterialIcons name="auto-stories" size={scaleValue(13, typingWebScale)} color={theme.primary} />
                <Text
                  style={[styles.promptSourceBadgeText, { color: theme.subText }]}
                  numberOfLines={1}
                >
                  {currentSourceLessonTitle}
                </Text>
              </View>
            ) : null}
          </View>
          </View>

          <View style={{ position: 'relative', width: '100%', maxWidth: scaleValue(700, typingWebScale), alignSelf: 'center' }}>
          <View
            style={[
              styles.answerPanel,
              styles.answerPanelDesktopWeb,
              { maxWidth: scaleValue(700, typingWebScale) },
              {
                marginTop: scaleValue(18, typingWebScale),
                backgroundColor: theme.card,
                borderRadius: scaleValue(EXERCISE_PANEL_RADIUS, typingWebScale),
                paddingHorizontal: scaleValue(28, typingWebScale),
                paddingVertical: scaleValue(24, typingWebScale),
              },
              getExercisePanelShadow(theme.isDark, 'soft'),
            ]}
          >
            <View style={styles.inputWrap}>
              <TextInput
                ref={inputRef}
                value={typedAnswer}
                onChangeText={setTypedAnswer}
                onSubmitEditing={onSubmit}
                submitBehavior="submit"
                autoCapitalize="none"
                autoCorrect={false}
                showSoftInputOnFocus
                returnKeyType="send"
                onFocus={handleInputFocus}
                style={[
                  styles.input,
                  !strictMode && styles.inputWithHint,
                  {
                    color: theme.text,
                    // Matches the surrounding card (theme.card), same as the mobile input —
                    // theme.inputBackground (colors.surfaceAlt) painted a mismatched tint here.
                    backgroundColor: theme.card,
                    borderColor: typingFeedback === 'correct'
                      ? theme.success
                      : typingFeedback === 'close'
                        ? theme.warning
                        : typingFeedback === 'wrong'
                          ? theme.error
                          : typedAnswer.trim()
                            ? theme.primary
                            : theme.border,
                    paddingVertical: inputVerticalPadding,
                    fontSize: inputFontSize,
                  },
                  Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : null,
                ]}
              />
              {!typedAnswer && (
                <View
                  style={[
                    styles.inputPlaceholderOverlay,
                    !strictMode && styles.inputPlaceholderOverlayWithHint,
                    { pointerEvents: 'none' },
                  ]}
                >
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.inputPlaceholderText,
                      { color: theme.subText, fontSize: inputFontSize },
                    ]}
                  >
                    {answerPlaceholder}
                  </Text>
                </View>
              )}
              {!strictMode && (
              <TouchableOpacity
                onPress={requestHint}
                disabled={isAdvancing}
                accessibilityRole="button"
                accessibilityLabel="Show hint"
                  style={[
                    styles.hintIconButton,
                    {
                      backgroundColor: theme.warningSoft,
                      borderColor: theme.warning,
                      opacity: isAdvancing ? 0.5 : 1,
                    },
                  ]}
                >
                  <MaterialIcons
                    name="lightbulb-outline"
                    size={scaleValue(18, typingWebScale)}
                    color={theme.isDark ? theme.warning : '#8a5a00'}
                  />
                  {currentHintCount > 0 && (
                    <Text style={[styles.hintIconCount, { color: theme.isDark ? theme.warning : '#8a5a00' }]}>{currentHintCount}</Text>
                  )}
                </TouchableOpacity>
              )}
            </View>

            <View style={[styles.checkButtonRow, { marginTop: scaleValue(18, typingWebScale), justifyContent: 'space-between' }]}>
              <TouchableOpacity
                onPress={handlePreviousWordPress}
                disabled={!canGoPrevious || isAdvancing}
                accessibilityRole="button"
                accessibilityLabel="Previous word"
                style={[
                  styles.navArrowInline,
                  {
                    width: scaleValue(40, typingWebScale),
                    height: scaleValue(40, typingWebScale),
                    borderRadius: scaleValue(12, typingWebScale),
                    backgroundColor: theme.card,
                    borderColor: theme.border,
                    opacity: !canGoPrevious || isAdvancing ? 0.4 : 1,
                  },
                ]}
              >
                <MaterialIcons name="chevron-left" size={scaleValue(20, typingWebScale)} color={theme.text} />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={onSubmit}
                disabled={isAdvancing || !typedAnswer.trim()}
                style={[
                  styles.button,
                  styles.primaryCheckButton,
                  {
                    minHeight: scaleValue(47, typingWebScale),
                    paddingVertical: scaleValue(11, typingWebScale),
                    paddingHorizontal: scaleValue(27, typingWebScale),
                  },
                  {
                    flex: 0,
                    minWidth: scaleValue(170, typingWebScale),
                    marginTop: 0,




                    backgroundColor: typingFeedback === 'correct'
                      ? theme.success
                      : typingFeedback === 'close'
                        ? theme.warning
                        : typingFeedback === 'wrong'
                          ? theme.error
                          : theme.primary,
                    opacity: isAdvancing || !typedAnswer.trim() ? 0.55 : 1,
                  },
                ]}
              >
                <MaterialIcons name="check" size={scaleValue(17, typingWebScale)} color={theme.buttonText} />
                <Text style={[styles.buttonText, { fontSize: scaleValue(15, typingWebScale) }, { color: theme.buttonText }]}>Check</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleNextWordPress}
                disabled={!canGoNext || isAdvancing}
                accessibilityRole="button"
                accessibilityLabel="Next word"
                style={[
                  styles.navArrowInline,
                  {
                    width: scaleValue(40, typingWebScale),
                    height: scaleValue(40, typingWebScale),
                    borderRadius: scaleValue(12, typingWebScale),
                    backgroundColor: theme.card,
                    borderColor: theme.border,
                    opacity: !canGoNext || isAdvancing ? 0.4 : 1,
                  },
                ]}
              >
                <MaterialIcons name="chevron-right" size={scaleValue(20, typingWebScale)} color={theme.text} />
              </TouchableOpacity>
            </View>
          </View>
          {showFeedbackCard && feedbackType === 'correct' && (
            <Animated.View
              style={[
                styles.correctFeedbackCard,
                styles.feedbackOverlay,
                { pointerEvents: 'none' },
                {
                  backgroundColor: theme.isDark
                    ? 'rgba(34, 197, 94, 0.98)'
                    : 'rgba(34, 197, 94, 0.99)',
                  borderColor: theme.isDark ? '#4ADE80' : '#16A34A',
                  boxShadow: '0px 8px 14px rgba(34, 197, 94, 0.18)',
                  opacity: feedbackOpacity,
                  transform: [{ translateY: feedbackTranslateY }],
                },
              ]}
            >
              <Text style={styles.correctFeedbackEmoji}>🎉</Text>
              <Text style={styles.correctFeedbackTitle}>
                Great job!
              </Text>
              {feedbackStreak >= 2 && (
                <View style={styles.correctFeedbackComboPill}>
                  <Text style={styles.correctFeedbackComboText}>
                    Combo ×{feedbackStreak}
                  </Text>
                </View>
              )}
            </Animated.View>
          )}
          {showFeedbackCard && (feedbackType === 'close' || feedbackType === 'wrong') && (
            <Animated.View
              style={[
                styles.mascotFeedbackRow,
                styles.feedbackOverlay,
                {
                  alignItems: 'stretch',
                  backgroundColor: feedbackType === 'wrong' ? FEEDBACK_WRONG_BUBBLE_BG : FEEDBACK_ALMOST_BUBBLE_BG,
                  borderRadius: scaleValue(EXERCISE_PANEL_RADIUS, typingWebScale),
                },
                { pointerEvents: 'none' },
                {
                  opacity: feedbackOpacity,
                  transform: [{ translateY: feedbackTranslateY }],
                },
              ]}
            >
              <Animated.View
                style={[
                  styles.mascotAvatar,
                  { alignSelf: 'center' },
                  {
                    backgroundColor: feedbackType === 'wrong' ? FEEDBACK_WRONG_AVATAR_BG : FEEDBACK_ALMOST_AVATAR_BG,
                    transform: [{ translateY: feedbackAvatarFloat }],
                  },
                ]}
              >
                {feedbackType === 'wrong' ? (
                  <MaterialIcons name="sentiment-dissatisfied" size={scaleValue(30, typingWebScale)} color={FEEDBACK_WRONG_TEXT} />
                ) : (
                  <Text style={styles.mascotAvatarEmoji}>🤏</Text>
                )}
              </Animated.View>
              <View
                style={[
                  styles.mascotBubble,
                  { justifyContent: 'center' },
                  { backgroundColor: feedbackType === 'wrong' ? FEEDBACK_WRONG_BUBBLE_BG : FEEDBACK_ALMOST_BUBBLE_BG },
                ]}
              >
                <View
                  style={[
                    styles.mascotBubbleTail,
                    { backgroundColor: feedbackType === 'wrong' ? FEEDBACK_WRONG_BUBBLE_BG : FEEDBACK_ALMOST_BUBBLE_BG },
                  ]}
                />
                {feedbackType === 'wrong' ? (
                  <>
                    <Text style={[styles.mascotHeadline, { color: FEEDBACK_WRONG_TEXT }]}>
                      Not this time.
                    </Text>
                    <Text style={[styles.mascotSubtext, { color: FEEDBACK_WRONG_TEXT }]}>
                      Correct answer: <Text style={{ fontWeight: '800' }}>{feedbackAnswer}</Text>
                    </Text>
                  </>
                ) : (
                  <Text style={[styles.mascotHeadline, { color: FEEDBACK_ALMOST_TEXT }]}>
                    {feedbackStreak > 0 ? 'So close — one more try before you lose your combo!' : 'So close — one more try!'}
                  </Text>
                )}
              </View>
            </Animated.View>
          )}
          </View>
          </View>
          </View>
        </View>
      </View>
    );
  };

  // Prefer the figure resolved at session end — it applies the bonus and the replay
  // discount exactly as the claim will, where this fallback only approximates the bonus by
  // rounding the sum rather than each word.
  const displayedTypingSessionXp = resolvedSessionXp
    ?? (wasPerfectRun ? Math.round(sessionXp * PERFECT_RUN_XP_MULTIPLIER) : sessionXp);
  const typingBonusXp = displayedTypingSessionXp - sessionXp;

  return (
    // flex on mobile so the tap-to-dismiss area reaches the keyboard: this shell otherwise
    // sizes to its content, and the Pressable inside can only ever fill the shell.
    <View style={[styles.interactiveShell, !isDesktopWeb && { flex: 1 }]}>
      {isDesktopWeb ? renderDesktopContent() : renderMobileContent()}

      <VocabularyCompletionModal
        visible={isFinished && resolvedSessionXp !== null}
        timerMode={false}
        startedTimerMode={false}
        isFirstCompletion={false}
        isPersonalBest={false}
        wordsLength={safeWords.length}
        matchingSessionXp={displayedTypingSessionXp}
        onClaimXP={typingGame?.commitPendingTypingXp}
        bonusXp={typingBonusXp}
        onReplay={handlePlayAgain}
        onPrimaryAction={handlePlayAgain}
        primaryActionLabel="Play Again"
        secondaryActionLabel={onBack ? 'Back to Vocabulary' : undefined}
        onSecondaryAction={onBack}
        title={completionTitleText}
        subtitle={completionSubtitleText}
        isPerfect={accuracy === 100}
        image={accuracy === 100 ? Assets.comic : Assets.shootingStar}
        statsItems={[
          { emoji: COMBO_EMOJI, value: maxStreak, label: 'Best Combo' },
          { emoji: ACCURACY_EMOJI, value: `${accuracy}%`, label: 'Accuracy' },
          { emoji: STAR_EMOJI, value: firstTryCount, label: '1st Try' },
          { emoji: XP_EMOJI, value: displayedTypingSessionXp, label: 'XP' },
          ...(typingBonusXp > 0 ? [{ emoji: '⭐', value: `+${typingBonusXp}`, label: 'Perfect bonus' }] : []),
        ]}
        reviewWords={weakWords}
        colors={colors as any}
        isDarkMode={isDarkMode ?? false}
        onGoToAccount={onGoToAccount ? handleGoToAccountFromCompletion : undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  interactiveShell: {
    width: '100%',
  },
  screen: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  completionScreen: {
    padding: 10,
    justifyContent: 'center',
  },
  contentContainer: {
    justifyContent: 'flex-start',
    padding: 20,
    paddingTop: 8,
    paddingBottom: 24,
    width: '100%',
  },
  card: {
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    justifyContent: 'flex-start',
  },
  completionCard: {
    width: '100%',
    maxWidth: 620,
    alignSelf: 'center',
    alignItems: 'center',
    marginBottom: 7,
  },
  completionStatsCard: {
    minHeight: 82,
    paddingVertical: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  interactiveCard: {
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
  },
  interactiveCardDesktopWeb: {
    maxWidth: 640,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 20,
  },
  completionTitle: {
    fontSize: 17,
    lineHeight: 21,
    fontWeight: '800',
    marginBottom: 2,
    textAlign: 'center',
  },
  completionSubtitle: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  sectionTitle: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
  },
  xpText: {
    fontSize: 24,
    fontWeight: '900',
    textAlign: 'center',
    color: '#24B75A',
  },
  subText: {
    textAlign: 'center',
    fontSize: 14,
  },
  row: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'stretch',
    marginTop: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  xpStatItem: {
    gap: 0,
  },
  statEmoji: {
    fontSize: 15,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
  },
  statText: {
    fontSize: 17,
    fontWeight: '700',
  },
  divider: {
    width: 1,
    alignSelf: 'stretch',
  },
  completionHeroCard: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  completionHeroRow: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 4,
  },
  completionTitleBlock: {
    alignItems: 'center',
  },
  completionHeroIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  completionWeakWordsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    paddingTop: 8,
    marginTop: 8,
    borderTopWidth: 1,
  },
  completionWeakWordChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
    maxWidth: 110,
  },
  completionWeakWordText: {
    fontSize: 12,
    fontWeight: '700',
  },
  completionStatsGrid: {
    width: '100%',
    minHeight: 50,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  completionStatPill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    paddingHorizontal: 6,
  },
  completionStatValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  levelText: {
    fontSize: 29,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: 14,
    marginBottom: 14,
  },
  levelSummaryCard: {
    alignItems: 'stretch',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  levelUpSummaryPill: {
    alignSelf: 'center',
    minHeight: 38,
    marginBottom: 10,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#FFE8A3',
    borderWidth: 1.5,
    borderColor: '#F4B942',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  levelUpSummaryText: {
    color: '#7A4B00',
    fontSize: 14,
    lineHeight: 17,
    fontWeight: '900',
    textAlign: 'center',
  },
  reviewWordsCard: {
    alignItems: 'stretch',
    paddingVertical: 10,
  },
  reviewWordsHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 7,
    marginBottom: 6,
  },
  reviewWordsTitle: {
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center',
  },
  reviewWordsList: {
    gap: 4,
  },
  reviewWordRow: {
    minHeight: 21,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 7,
  },
  reviewWordText: {
    flexShrink: 1,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  reviewWordDivider: {
    fontSize: 13,
    fontWeight: '800',
  },
  reviewMoreText: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  reviewEmptyText: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  levelSummaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  levelSummaryTitle: {
    textAlign: 'left',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  levelSummaryValue: {
    textAlign: 'left',
    fontSize: 21,
    lineHeight: 24,
    marginTop: 2,
    marginBottom: 0,
  },
  levelSummaryStats: {
    minWidth: 88,
    borderRadius: 12,
    paddingVertical: 5,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(127,127,127,0.10)',
    alignItems: 'center',
  },
  levelSummaryStatText: {
    fontSize: 17,
    fontWeight: '800',
  },
  levelSummaryStatLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  levelSummaryHint: {
    marginTop: 5,
    fontSize: 12,
  },
  levelProgressValue: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '800',
    marginTop: 14,
    marginBottom: 14,
  },
  button: {
    marginTop: 18,
    backgroundColor: '#0D7DD4',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  playAgainButton: {
    width: '100%',
    maxWidth: 360,
    alignSelf: 'center',
    minHeight: 40,
    marginTop: 0,
    paddingVertical: 9,
    borderRadius: 999,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 7,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  progressTrack: {
    width: '100%',
    height: 6,
    borderRadius: 999,
    overflow: 'hidden',
    marginTop: 7,
  },
  progressFill: {
    height: '100%',
  },
  feedbackOverlay: {
    // Fills whatever it's nested in exactly — the answer-panel wrapper, not the prompt —
    // so feedback covers the input/Check button while the prompt stays visible above it.
    // The card itself stretches to fill this (flex: 1 below) rather than sitting centered
    // at its own intrinsic size, so it actually covers the panel instead of leaving gaps
    // that show the input/nav arrows peeking out underneath.
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 5,
  },
  correctFeedbackCard: {
    flex: 1,
    width: '100%',
    borderRadius: 8,
    borderWidth: 1.5,
    paddingVertical: 12,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  correctFeedbackEmoji: {
    fontSize: 44,
  },
  correctFeedbackTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  correctFeedbackComboPill: {
    marginLeft: 'auto',
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 100,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  correctFeedbackComboText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  mascotFeedbackRow: {
    flex: 1,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  mascotAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mascotAvatarEmoji: {
    fontSize: 36,
  },
  mascotBubble: {
    flex: 1,
    position: 'relative',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 18,
  },
  mascotBubbleTail: {
    position: 'absolute',
    left: -8,
    top: 18,
    width: 16,
    height: 16,
    borderRadius: 3,
    transform: [{ rotate: '45deg' }],
  },
  mascotHeadline: {
    fontSize: 22,
    fontWeight: '700',
  },
  mascotSubtext: {
    marginTop: 2,
    fontSize: 16,
    fontWeight: '600',
    opacity: 0.8,
  },
  writeMetaBlock: {
    gap: 4,
    marginBottom: 0,
  },



  writeMetaBlockDesktopTopGap: {
    paddingTop: 36,
  },
  writeProgressTrack: {
    width: '100%',
    height: 6,
    borderRadius: 999,
    overflow: 'hidden',
  },
  writeProgressTrackDesktopWeb: {
    width: '100%',
    height: 5,
    alignSelf: 'center',
  },
  writeProgressFill: {
    height: '100%',
    borderRadius: 999,
  },
  writeMetricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
  },



  writeMetricsRowMobile: {
    justifyContent: 'flex-end',
  },
  writeTaskLabel: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    flexShrink: 1,
  },


  writeTaskLabelMobile: {
    fontSize: 12.5,
    // On top of the block's own gap, so "Translate to ..." sits clear of the metrics row.
    marginTop: 12,
  },
  writeMetricsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  writeMetricCol: {
    alignItems: 'flex-end',
  },
  writeMetricLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  writeMetricValue: {
    fontSize: 19,
    fontWeight: '800',
    lineHeight: 22,
    marginTop: 1,
  },
  writeMetricDivider: {
    width: 1,
    height: 26,
  },
  typingProgressPanel: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 10,
    marginBottom: 0,
  },
  typingProgressPanelTight: {
    padding: 8,
    borderRadius: 14,
  },
  levelHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  levelHeaderRowTight: {
    alignItems: 'center',
    gap: 8,
  },
  levelTitleTight: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 5,
  },
  levelLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  levelLabelTight: {
    fontSize: 11,
  },
  levelValue: {
    fontSize: 23,
    fontWeight: '800',
    lineHeight: 27,
  },
  levelValueTight: {
    fontSize: 18,
    lineHeight: 22,
  },
  levelXpGroup: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  levelXpGroupTight: {
    flexShrink: 1,
  },
  levelXpValue: {
    fontSize: 16,
    fontWeight: '800',
  },
  levelXpValueTight: {
    fontSize: 14,
  },
  levelXpHint: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  levelXpHintTight: {
    fontSize: 10,
    marginTop: 0,
  },
  levelProgressTrack: {
    height: 7,
    borderRadius: 999,
    overflow: 'hidden',
    marginTop: 8,
  },
  levelProgressTrackTight: {
    height: 5,
    marginTop: 6,
  },
  levelProgressFill: {
    height: '100%',
    borderRadius: 999,
  },
  comboBonusBadge: {
    marginLeft: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: 1,
  },
  comboBonusBadgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  typingStatusRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 0,
  },
  typingStatusRowAndroid: {
    gap: 7,
  },
  typingStatusRowTight: {
    marginTop: 0,
    gap: 6,
  },
  typingStatusPill: {
    flex: 1,
    minHeight: 32,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  typingStatusPillTight: {
    minHeight: 28,
    paddingHorizontal: 8,
  },
  typingStatusLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  typingStatusValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  comboValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  comboFireEmoji: {
    width: 18,
    fontSize: 14,
    lineHeight: 18,
    textAlign: 'center',
  },
  modeStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
    marginBottom: 0,
  },
  modeStatusBadge: {
    minHeight: 26,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  reviewModeBadge: {
    paddingHorizontal: 12,
  },
  modeStatusText: {
    fontSize: 12,
    lineHeight: 15,
    fontWeight: '800',
  },
  promptText: {
    textAlign: 'center',
    fontSize: 34,
    fontWeight: '800',
    textAlignVertical: 'center',
  },
  writeWordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
    width: '100%',
  },
  writeWordText: {
    flexGrow: 1,
    flexShrink: 1,
    fontWeight: '800',
    minWidth: 0,
    textAlign: 'center',
  },
  gameAreaWrap: {
    position: 'relative',
    width: '100%',
    maxWidth: 460,
    alignSelf: 'center',
  },





  promptAnswerGroup: {
    flex: 1,
    minHeight: 0,
    width: '100%',





    justifyContent: 'flex-start',
  },
  promptCenterWrap: {
    width: '100%',
  },
  promptOverlayWrap: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: 460,
    position: 'relative',



  },
  promptPanel: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: 460,
    borderWidth: 2,
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    boxShadow: '0px 2px 5px rgba(0,0,0,0.08)',
  },
  promptPanelDesktopWeb: {
    maxWidth: 600,
    paddingVertical: 20,
    paddingHorizontal: 22,
  },
  promptBadge: {
    position: 'absolute',
    top: -12,
    alignSelf: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
  },
  promptBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  promptSourceBadge: {
    maxWidth: '100%',
    minHeight: 26,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 9,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  promptSourceBadgeInline: {
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  promptSourceBadgeText: {
    flexShrink: 1,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '800',
  },
  answerPanel: {
    width: '100%',
    maxWidth: 460,
    alignSelf: 'center',
  },
  answerPanelDesktopWeb: {
    maxWidth: 600,
  },
  input: {
    width: '100%',
    alignSelf: 'center',
    borderWidth: 2,
    borderRadius: 14,
    paddingHorizontal: 18,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '600',
  },
  inputTight: {
    fontSize: 16,
  },
  inputWithHint: {
    paddingLeft: 50,
    paddingRight: 50,
  },
  inputWrap: {
    width: '100%',
    position: 'relative',
    justifyContent: 'center',
  },
  inputPlaceholderOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 18,
    right: 18,
    justifyContent: 'center',
  },


  inputPlaceholderOverlayWithHint: {


    left: 52,
    right: 52,
  },
  inputPlaceholderText: {
    fontWeight: '500',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  checkButtonRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 8,
  },
  hintIconButton: {
    position: 'absolute',
    top: 8,
    bottom: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    flexShrink: 0,
  },
  hintIconCount: {
    fontSize: 12,
    fontWeight: '800',
  },
  primaryCheckButton: {
    minHeight: 44,
    alignSelf: 'center',
    marginTop: 10,
    paddingVertical: 11,
    paddingHorizontal: 26,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryCheckButtonTight: {
    minHeight: 44,
    marginTop: 8,
    paddingVertical: 9,
    paddingHorizontal: 18,
  },
  navArrowInline: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navArrowInlineTight: {
    width: 44,
    height: 44,
    borderRadius: 14,
  },
});
