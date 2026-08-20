import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAudioPlayer } from 'expo-audio';
import { useFonts } from 'expo-font';
import {
  LibreFranklin_600SemiBold,
  LibreFranklin_700Bold,
  LibreFranklin_800ExtraBold,
} from '@expo-google-fonts/libre-franklin';

import { useTypingGame } from './useTypingGame';
import type { Word } from '../../types/VocabularyTypes';
import { SOUND_EFFECT_OPTIONS, SUCCESS_SOUND, replaySoundEffect } from '../shared/soundEffects';
import { clampNumber, getWebLessonScale, scaleValue } from '../shared/responsiveLayout';
import VocabularyCompletionModal from './VocabularyCompletionModal';
import Assets from '../../assets/index';
import { fontFamilyForWeight } from './vocabRush/vocabRushFonts';
import { triggerSelectionHaptic, triggerSuccessHaptic, triggerWarningHaptic } from '../shared/haptics';
import { usePersistentExerciseKeyboard } from '../shared/usePersistentExerciseKeyboard';
import { FRESH_COLORS, freshGlowShadow } from '../shared/freshDirection';

type ThemeColors = {
  isDark?: boolean;
  background?: string;
  card?: string;
  surface?: string;
  surfaceAlt?: string;
  text?: string;
  border?: string;
  borderStrong?: string;
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
    requestHint: () => void;
    currentHintCount: number;
    currentHintText: string;
    sessionXp: number;
    setTypedAnswer: (value: string) => void;
    strictMode: boolean;
    streak: number;
    typedAnswer: string;
    typingFeedback?: 'correct' | 'close' | 'wrong' | null;
    typingIndex: number;
    firstTryCount?: number;
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
    background: colors?.background ?? (isDark ? '#071A2D' : '#F8FAFC'),
    card: colors?.card ?? (isDark ? '#0D2742' : '#FFFFFF'),
    text: colors?.text ?? (isDark ? '#F7FAFF' : '#0F172A'),
    subText: colors?.secondaryText ?? (isDark ? '#C9DDF0' : '#64748B'),
    border: colors?.border ?? (isDark ? '#2A5C84' : '#E2E8F0'),
    primary: colors?.primary ?? colors?.buttonBackground ?? '#0D7DD4',
    success: colors?.success ?? (isDark ? '#4FD9C4' : '#17B8A6'),
    successSoft: colors?.successSoft ?? (isDark ? '#0F332F' : '#CCFBF1'),
    warning: colors?.warning ?? (isDark ? '#FFD36D' : '#FFBF51'),
    warningSoft: colors?.warningSoft ?? (isDark ? '#493912' : '#FFF4D8'),
    error: colors?.danger ?? (isDark ? '#FF9478' : '#FF7A59'),
    errorSoft: colors?.dangerSoft ?? (isDark ? '#3D1E14' : '#FFE4DA'),
    progressBg: colors?.border ?? (isDark ? '#2A5C84' : '#E2E8F0'),
    inputBackground: colors?.surfaceAlt ?? (isDark ? '#1B527F' : '#FFFFFF'),
    statsBackground: colors?.surface ?? (isDark ? '#123B61' : '#EEF2F7'),
    statsBorder: colors?.border ?? (isDark ? '#2A5C84' : '#E5E7EB'),
  };
};

// Feedback card palette — converted from the design spec's OKLCH values to
// sRGB hex (RN has no oklch() support), L/C/H preserved exactly:
//   correct card:  oklch(0.60 0.15 150)
//   almost avatar: oklch(0.92 0.07  90)   almost bubble: oklch(0.95 0.04  90)   almost text: oklch(0.48 0.11  90)
//   wrong avatar:  oklch(0.92 0.06  25)   wrong bubble:  oklch(0.95 0.03  25)   wrong text:  oklch(0.48 0.13  25)
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
  const isAndroid = Platform.OS === 'android' || forceAndroidLayout;
  const isDesktopWeb = Platform.OS === 'web' && !forceAndroidLayout && width >= 768;
  const webScale = getWebLessonScale(width, responsiveHeight);
  const typingWebScale = isDesktopWeb ? Math.min(webScale * 1.06, 1.16) : webScale;
  // Width-only version of the same scale, used just for the card's own
  // max-width — Match derives its progress-bar cap the same width-only way,
  // so the two modes never disagree on this one measurement just because
  // they get a different available height from the layout hook.
  const widthOnlyWebScale = clampNumber(width / 1180, 1, 1.1);
  const cardWidthWebScale = isDesktopWeb ? Math.min(widthOnlyWebScale * 1.06, 1.16) : widthOnlyWebScale;
  const isCompact = false;
  // Only the real keyboard-visible signal shrinks the layout — a merely
  // short/narrow viewport (very common on phones even with the keyboard
  // closed) must NOT trigger this, or Write's card renders noticeably
  // shorter than Cards/Match at the exact same screen size.
  const keyboardMode = keyboardVisible;
  const inputRef = useRef<TextInput | null>(null);
  const successPlayer = useAudioPlayer(SUCCESS_SOUND, SOUND_EFFECT_OPTIONS);
  const hasNotifiedCompletionRef = useRef(false);

  const [showFeedbackCard, setShowFeedbackCard] = useState(false);
  const [feedbackType, setFeedbackType] = useState<FeedbackType>(null);
  const [feedbackStreak, setFeedbackStreak] = useState(0);
  const [feedbackAnswer, setFeedbackAnswer] = useState('');
  const [feedbackFontsLoaded] = useFonts({
    LibreFranklin_600SemiBold,
    LibreFranklin_700Bold,
    LibreFranklin_800ExtraBold,
  });
  const feedbackFont = (weight: '600' | '700' | '800') =>
    feedbackFontsLoaded ? fontFamilyForWeight(weight) : undefined;

  const feedbackOpacity = useRef(new Animated.Value(0)).current;
  const feedbackTranslateY = useRef(new Animated.Value(16)).current;
  const feedbackAvatarFloat = useRef(new Animated.Value(0)).current;
  const comboFireScale = useRef(new Animated.Value(1)).current;
  const comboShakeAnim = useRef(new Animated.Value(0)).current;
  const progressBarAnim = useRef(new Animated.Value(0)).current;
  const wordFadeAnim = useRef(new Animated.Value(1)).current;
  const xpPulseAnim = useRef(new Animated.Value(1)).current;
  const prevXpRef = useRef(0);

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
      // Vocabulary lesson modes (Cards/Match/Write) share one accent — the
      // "exercise blue" family, distinct from the app-wide primary blue.
      primary: isDark ? '#3FA0DB' : FRESH_COLORS.exerciseBlue,
      buttonText: colors?.buttonText ?? '#FFFFFF',
      inputBackground: colors?.surfaceAlt ?? baseTheme.inputBackground,
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
    setTypedAnswer,
    strictMode,
    streak,
    typedAnswer,
    typingFeedback = null,
    typingIndex,
    firstTryCount = 0,
    correctAnswers,
    difficultyByWord = {},
    totalAttempts,
    currentWord,
  } = typingGame ?? internalTypingGame;

  const prevStreakRef = useRef(streak);

  const isFinished = safeWords.length > 0 && isSessionComplete;
  const currentSourceLessonTitle =
    typeof currentWord?.sourceLesson?.title === 'string'
      ? currentWord.sourceLesson.title.trim()
      : '';
  const shouldReserveKeyboardSpace = forceAndroidLayout || Platform.OS !== 'web' || width < 768;
  const androidInteractiveCardMinHeight = Math.round(clampNumber(
    responsiveHeight * (keyboardMode ? 0.50 : isCompact ? 0.66 : 0.58),
    keyboardMode ? (isCompact ? 370 : 400) : isCompact ? 490 : 460,
    keyboardMode ? (isCompact ? 460 : 510) : isCompact ? 630 : 620
  ));
  // Web (non-Android) card height: fit the actual available height like
  // Android already does above, instead of demanding a flat 420/490/550px
  // regardless of the real budget — a fixed floor here is what made Write's
  // card overflow its section and sit taller than Cards/Match at the same
  // screen size, since Cards adapts its card size to the space it's given.
  const interactiveCardMinHeight = isAndroid
    ? androidInteractiveCardMinHeight
    : keyboardMode
      ? Math.round(clampNumber(responsiveHeight * 0.5, 260, 306))
      : isDesktopWeb
        ? Math.round(clampNumber(responsiveHeight * 0.80, scaleValue(420, typingWebScale), scaleValue(550, typingWebScale)))
        : Math.round(clampNumber(
            responsiveHeight * (isCompact ? 0.62 : 0.56),
            isCompact ? 300 : 300,
            isCompact ? 420 : 420
          ));
  // Reserves just enough room for the word (1-2 lines) plus the optional
  // source badge below it — not a generous multi-line buffer — since this
  // box doesn't vertically center its own content, any extra minHeight here
  // shows up as dead space directly under the word rather than around it.
  const androidPromptMinHeight = Math.round(clampNumber(
    responsiveHeight * (keyboardMode ? 0.20 : 0.16),
    keyboardMode ? 136 : 110,
    keyboardMode ? 172 : 150
  ));
  const promptMinHeight = isAndroid
    ? androidPromptMinHeight
    : keyboardMode
      ? 96
      : isDesktopWeb
        ? scaleValue(146, typingWebScale)
        : 94;
  const promptFontSize = isAndroid
    ? keyboardMode
      ? 34
      : 40
    : keyboardMode
      ? 30
      : isDesktopWeb
        ? scaleValue(54, typingWebScale)
        : 40;
  const promptLineHeight = isAndroid
    ? keyboardMode
      ? 41
      : 48
    : keyboardMode
      ? 36
      : isDesktopWeb
        ? scaleValue(63, typingWebScale)
        : 48;
  const contentHorizontalPadding = isAndroid
    ? isCompact ? 8 : 10
    : isCompact ? 12 : 18;
  const contentBottomPadding = isAndroid
    ? keyboardMode ? 34 : shouldReserveKeyboardSpace ? (isCompact ? 18 : 26) : 16
    : keyboardMode ? 44 : shouldReserveKeyboardSpace ? (isCompact ? 16 : 24) : 16;
  const androidAnswerMarginTop = keyboardMode ? 8 : isCompact ? 12 : 18;
  const inputVerticalPadding = isAndroid
    ? keyboardMode ? 12 : 15
    : keyboardMode ? 9 : isDesktopWeb ? scaleValue(16, typingWebScale) : 13;
  const inputFontSize = isAndroid
    ? keyboardMode ? 18 : 22
    : keyboardMode ? 16 : isDesktopWeb ? scaleValue(23, typingWebScale) : 20;
  const checkButtonAndroidStyle = isAndroid
    ? {
        minHeight: keyboardMode ? 44 : 52,
        paddingVertical: keyboardMode ? 9 : 12,
        paddingHorizontal: 24,
      }
    : undefined;


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
    replaySoundEffect(successPlayer);
  }, [successPlayer]);

  const triggerFeedbackCard = useCallback(
    (type: FeedbackType, streak: number, answer: string) => {
      setFeedbackType(type);
      setFeedbackStreak(streak);
      setFeedbackAnswer(answer);
      setShowFeedbackCard(true);

      const canUseNativeDriver = Platform.OS !== 'web';
      const easeCurve = Easing.bezier(0.25, 0.1, 0.25, 1); // CSS "ease"
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
      ]).start(() => setShowFeedbackCard(false));
    },
    [feedbackOpacity, feedbackTranslateY]
  );

  // Almost/Wrong mascot avatar bob loop — Correct never uses this.
  useEffect(() => {
    if (!showFeedbackCard || feedbackType === 'correct' || feedbackType === null) {
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
      feedbackAvatarFloat.setValue(0);
    };
  }, [showFeedbackCard, feedbackType, feedbackAvatarFloat]);

  const {
    isScreenFocused,
    shouldKeepKeyboardOpen,
    focusInputSequence,
    focusOnExerciseChange,
  } = usePersistentExerciseKeyboard({
    inputRef,
    enabled: !isFinished,
    androidFocusRetries: Platform.OS === 'android' || forceAndroidLayout,
  });
  const shouldAutoFocusInput = isScreenFocused;

  const handleInputBlur = useCallback(() => {
    if (!shouldKeepKeyboardOpen || isDesktopWeb) {
      return;
    }

    focusInputSequence([80, 260]);
  }, [focusInputSequence, isDesktopWeb, shouldKeepKeyboardOpen]);

  const onSubmit = useCallback(() => {
    if (isAdvancing || !typedAnswer.trim()) {
      return;
    }

    void Promise.resolve(handleSubmit()).finally(() => {
      if (isFinished) return;
      focusInputSequence([90, 760]);
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

  useEffect(() => {
    if (!shouldKeepKeyboardOpen) {
      return;
    }

    focusOnExerciseChange();
  }, [focusOnExerciseChange, shouldKeepKeyboardOpen, typingIndex]);

  useEffect(() => {
    if (!shouldKeepKeyboardOpen || keyboardVisible) {
      return;
    }

    focusInputSequence([120, 360]);
  }, [focusInputSequence, keyboardVisible, shouldKeepKeyboardOpen]);

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
    if (streak < 3) {
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
  }, [comboFireScale, streak]);

  useEffect(() => {
    const wasCombo = prevStreakRef.current >= 3;
    prevStreakRef.current = streak;
    if (wasCombo && streak === 0) {
      Animated.sequence([
        Animated.timing(comboShakeAnim, { toValue: -7, duration: 55, useNativeDriver: Platform.OS !== 'web' }),
        Animated.timing(comboShakeAnim, { toValue: 7, duration: 55, useNativeDriver: Platform.OS !== 'web' }),
        Animated.timing(comboShakeAnim, { toValue: -4, duration: 45, useNativeDriver: Platform.OS !== 'web' }),
        Animated.timing(comboShakeAnim, { toValue: 0, duration: 45, useNativeDriver: Platform.OS !== 'web' }),
      ]).start();
    }
  }, [comboShakeAnim, streak]);

  useEffect(() => {
    const target = safeWords.length > 0
      ? Math.min(100, Math.round(((typingIndex + 1) / safeWords.length) * 100))
      : 0;
    if (typingIndex === 0) {
      progressBarAnim.setValue(target);
    } else {
      Animated.timing(progressBarAnim, { toValue: target, duration: 300, useNativeDriver: false }).start();
    }
  }, [typingIndex, safeWords.length, progressBarAnim]);

  useEffect(() => {
    wordFadeAnim.setValue(0.45);
    Animated.timing(wordFadeAnim, { toValue: 1, duration: 180, useNativeDriver: Platform.OS !== 'web' }).start();
  }, [typingIndex, wordFadeAnim]);

  useEffect(() => {
    if (sessionXp > prevXpRef.current) {
      Animated.sequence([
        Animated.spring(xpPulseAnim, { toValue: 1.11, friction: 4, tension: 260, useNativeDriver: Platform.OS !== 'web' }),
        Animated.spring(xpPulseAnim, { toValue: 1, friction: 5, tension: 180, useNativeDriver: Platform.OS !== 'web' }),
      ]).start();
    }
    prevXpRef.current = sessionXp;
  }, [sessionXp, xpPulseAnim]);

  if (!safeWords.length) {
    return null;
  }

  if (isFinished && suppressCompletionScreen) {
    return null;
  }

  const translateTargetLabel = promptLabel === 'English' ? 'French' : 'English';

  return (
    <View style={styles.interactiveShell}>
      <View
        style={[
          styles.contentContainer,
          {
            backgroundColor: theme.card,
            paddingTop: isAndroid ? 6 : 0,
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
            isDesktopWeb && styles.interactiveCardDesktopWeb,
            isDesktopWeb && { maxWidth: scaleValue(1237, cardWidthWebScale) },
            {
              backgroundColor: theme.card,
              borderColor: 'transparent',
              borderWidth: 0,
              padding: 0,
              minHeight: interactiveCardMinHeight,
            },
          ]}
        >
          <View style={styles.writeMetaBlock}>
            <View
              style={[
                styles.writeProgressTrack,
                { backgroundColor: theme.isDark ? '#2a2e38' : '#e0dacc' },
                isDesktopWeb && styles.writeProgressTrackDesktopWeb,
              ]}
            >
              <Animated.View
                style={[
                  styles.writeProgressFill,
                  {
                    backgroundColor: theme.primary,
                    width: progressBarAnim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }),
                  },
                ]}
              />
            </View>

            <View style={styles.writeMetricsRow}>
              <Text style={[styles.writeTaskLabel, { color: theme.primary }]} numberOfLines={1}>
                Translate to {translateTargetLabel}
              </Text>

              <View style={styles.writeMetricsGroup}>
                <View style={styles.writeMetricCol}>
                  <Text style={[styles.writeMetricLabel, { color: theme.isDark ? '#8A8F98' : '#918c7f' }]}>Word</Text>
                  <Text style={[styles.writeMetricValue, { color: theme.primary }]}>
                    {typingIndex + 1} / {safeWords.length}
                  </Text>
                </View>
                <View style={[styles.writeMetricDivider, { backgroundColor: theme.isDark ? '#3A3E48' : '#e3decf' }]} />
                <Animated.View style={[styles.writeMetricCol, { transform: [{ translateX: comboShakeAnim }] }]}>
                  <Text style={[styles.writeMetricLabel, { color: theme.isDark ? '#8A8F98' : '#918c7f' }]}>Combo</Text>
                  <View style={styles.comboValueRow}>
                    <Text style={[styles.writeMetricValue, { color: theme.isDark ? '#E4E1D8' : '#3e3a2f' }]}>
                      {streak}
                    </Text>
                    {streak >= 3 && (
                      <Animated.Text style={[styles.comboFireEmoji, { transform: [{ scale: comboFireScale }] }]}>
                        {COMBO_EMOJI}
                      </Animated.Text>
                    )}
                  </View>
                </Animated.View>
                <View style={[styles.writeMetricDivider, { backgroundColor: theme.isDark ? '#3A3E48' : '#e3decf' }]} />
                <View style={styles.writeMetricCol}>
                  <Text style={[styles.writeMetricLabel, { color: theme.isDark ? '#8A8F98' : '#918c7f' }]}>XP</Text>
                  <Animated.Text
                    style={[
                      styles.writeMetricValue,
                      { color: theme.isDark ? '#E4E1D8' : '#3e3a2f', transform: [{ scale: xpPulseAnim }] },
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

          <View
            style={[
              styles.gameAreaWrap,
              isDesktopWeb && { maxWidth: scaleValue(700, typingWebScale) },
              { flex: 1 },
            ]}
          >
          {showFeedbackCard && feedbackType === 'correct' && (
            <Animated.View
              style={[
                styles.correctFeedbackCard,
                isDesktopWeb && { maxWidth: scaleValue(700, typingWebScale) },
                { pointerEvents: 'none' },
                {
                  backgroundColor: theme.isDark
                    ? 'rgba(34, 197, 94, 0.90)'
                    : 'rgba(34, 197, 94, 0.92)',
                  borderColor: theme.isDark ? '#4ADE80' : '#16A34A',
                  boxShadow: '0px 8px 14px rgba(34, 197, 94, 0.18)',
                  opacity: feedbackOpacity,
                  transform: [{ translateY: feedbackTranslateY }],
                },
              ]}
            >
              <Text style={styles.correctFeedbackEmoji}>🎉</Text>
              <Text style={[styles.correctFeedbackTitle, { fontFamily: feedbackFont('800') }]}>
                Great job!
              </Text>
              <View style={styles.correctFeedbackComboPill}>
                <Text style={[styles.correctFeedbackComboText, { fontFamily: feedbackFont('800') }]}>
                  Combo ×{feedbackStreak}
                </Text>
              </View>
            </Animated.View>
          )}
          {showFeedbackCard && (feedbackType === 'close' || feedbackType === 'wrong') && (
            <Animated.View
              style={[
                styles.mascotFeedbackRow,
                isDesktopWeb && { maxWidth: scaleValue(700, typingWebScale) },
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
                  {
                    backgroundColor: feedbackType === 'wrong' ? FEEDBACK_WRONG_AVATAR_BG : FEEDBACK_ALMOST_AVATAR_BG,
                    transform: [{ translateY: feedbackAvatarFloat }],
                  },
                ]}
              >
                {feedbackType === 'wrong' ? (
                  <MaterialIcons name="sentiment-dissatisfied" size={30} color={FEEDBACK_WRONG_TEXT} />
                ) : (
                  <Text style={styles.mascotAvatarEmoji}>🤏</Text>
                )}
              </Animated.View>
              <View
                style={[
                  styles.mascotBubble,
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
                    <Text style={[styles.mascotHeadline, { color: FEEDBACK_WRONG_TEXT, fontFamily: feedbackFont('700') }]}>
                      Not this time.
                    </Text>
                    <Text style={[styles.mascotSubtext, { color: FEEDBACK_WRONG_TEXT, fontFamily: feedbackFont('600') }]}>
                      Correct answer: <Text style={{ fontFamily: feedbackFont('800') }}>{feedbackAnswer}</Text>
                    </Text>
                  </>
                ) : (
                  <Text style={[styles.mascotHeadline, { color: FEEDBACK_ALMOST_TEXT, fontFamily: feedbackFont('700') }]}>
                    So close — one more try before you lose your combo!
                  </Text>
                )}
              </View>
            </Animated.View>
          )}
          <View style={[styles.promptCenterWrap, showFeedbackCard && styles.promptCenterWrapAfterFeedback]}>
          <View
            style={[
              styles.promptOverlayWrap,
              isDesktopWeb && {
                maxWidth: scaleValue(700, typingWebScale),
              },
              {
                minHeight: promptMinHeight,
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

          <View
            style={[
              styles.answerPanel,
              isDesktopWeb && styles.answerPanelDesktopWeb,
              isDesktopWeb && {
                maxWidth: scaleValue(700, typingWebScale),
              },
              {
                marginTop: isAndroid ? androidAnswerMarginTop : keyboardMode ? 4 : isDesktopWeb ? 0 : isCompact ? 6 : 12,
              },
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
                onBlur={handleInputBlur}
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
                            : (theme.isDark ? '#153f55' : '#bcd1df'),
                    paddingVertical: inputVerticalPadding,
                    fontSize: inputFontSize,
                  },
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
                  style={[
                    styles.hintIconButton,
                    {
                      backgroundColor: theme.isDark ? '#162436' : theme.warningSoft,
                      borderColor: theme.isDark ? '#5AA8F5' : theme.warning,
                      opacity: isAdvancing ? 0.5 : 1,
                    },
                  ]}
                >
                  <MaterialIcons
                    name="lightbulb-outline"
                    size={keyboardMode || isCompact ? 16 : 18}
                    color={theme.isDark ? '#7BAAFB' : '#8a5a00'}
                  />
                  {currentHintCount > 0 && (
                    <Text style={[styles.hintIconCount, { color: theme.isDark ? '#7BAAFB' : '#8a5a00' }]}>{currentHintCount}</Text>
                  )}
                </TouchableOpacity>
              )}
            </View>

            <View style={[styles.checkButtonRow, { marginTop: isAndroid ? (keyboardMode ? 10 : 15) : keyboardMode ? 8 : 10 }]}>
              <TouchableOpacity
                onPress={handlePreviousWordPress}
                disabled={!canGoPrevious || isAdvancing}
                style={[
                  styles.navArrowInline,
                  keyboardMode && styles.navArrowInlineTight,
                  {
                    backgroundColor: theme.card,
                    borderColor: theme.isDark ? '#3A3E48' : '#e3decf',
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
                  isCompact && styles.primaryCheckButtonCompact,
                  keyboardMode && styles.primaryCheckButtonTight,
                  checkButtonAndroidStyle,
                  isDesktopWeb && {
                    minHeight: scaleValue(47, typingWebScale),
                    paddingVertical: scaleValue(11, typingWebScale),
                    paddingHorizontal: scaleValue(27, typingWebScale),
                  },
                  {
                    flex: 1,
                    marginTop: 0,
                    backgroundColor: theme.primary,
                    opacity: isAdvancing || !typedAnswer.trim() ? 0.55 : 1,
                  },
                  freshGlowShadow(theme.primary),
                ]}
              >
                <MaterialIcons name="check" size={isDesktopWeb ? scaleValue(17, typingWebScale) : 17} color={theme.buttonText} />
                <Text style={[styles.buttonText, isDesktopWeb && { fontSize: scaleValue(15, typingWebScale) }, { color: theme.buttonText }]}>Check</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleNextWordPress}
                disabled={!canGoNext || isAdvancing}
                style={[
                  styles.navArrowInline,
                  keyboardMode && styles.navArrowInlineTight,
                  {
                    backgroundColor: theme.card,
                    borderColor: '#71add0',
                    opacity: !canGoNext || isAdvancing ? 0.4 : 1,
                  },
                ]}
              >
                <MaterialIcons name="chevron-right" size={20} color={theme.text} />
              </TouchableOpacity>
            </View>
          </View>
          </View>
        </View>
      </View>

      <VocabularyCompletionModal
        visible={isFinished}
        timerMode={false}
        startedTimerMode={false}
        isFirstCompletion={false}
        isPersonalBest={false}
        wordsLength={safeWords.length}
        matchingSessionXp={sessionXp}
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
          { emoji: XP_EMOJI, value: sessionXp, label: 'XP' },
          { emoji: STAR_EMOJI, value: firstTryCount, label: '1st Try' },
          { emoji: ACCURACY_EMOJI, value: `${accuracy}%`, label: 'Accuracy' },
          { emoji: COMBO_EMOJI, value: maxStreak, label: 'Max Combo' },
        ]}
        reviewWords={weakWords}
        colors={colors as any}
        isDarkMode={isDarkMode ?? false}
        onGoToAccount={onGoToAccount}
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
  correctFeedbackCard: {
    width: '100%',
    alignSelf: 'center',
    marginTop: 12,
    borderRadius: 8,
    borderWidth: 1.5,
    paddingVertical: 16,
    paddingHorizontal: 22,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  correctFeedbackEmoji: {
    fontSize: 26,
  },
  correctFeedbackTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  correctFeedbackComboPill: {
    marginLeft: 'auto',
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 100,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  correctFeedbackComboText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  mascotFeedbackRow: {
    width: '100%',
    alignSelf: 'center',
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  mascotAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mascotAvatarEmoji: {
    fontSize: 30,
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
    fontSize: 16,
    fontWeight: '700',
  },
  mascotSubtext: {
    marginTop: 2,
    fontSize: 14,
    fontWeight: '600',
    opacity: 0.8,
  },
  writeMetaBlock: {
    gap: 4,
    marginBottom: 0,
  },
  writeProgressTrack: {
    width: '100%',
    height: 6,
    borderRadius: 999,
    overflow: 'hidden',
  },
  writeProgressTrackDesktopWeb: {
    width: '100%',
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
  writeTaskLabel: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    flexShrink: 1,
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
  // Sits right under the stats block instead of centering across the full
  // leftover card height — any true excess space now falls below the answer
  // panel instead of stretching the gap between stats/word/input apart.
  promptCenterWrap: {
    width: '100%',
    marginTop: 26,
  },
  promptCenterWrapAfterFeedback: {
    marginTop: 12,
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
    elevation: 2,
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
    right: 50,
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
  primaryCheckButtonCompact: {
    minHeight: 42,
    marginTop: 14,
    paddingVertical: 9,
    paddingHorizontal: 22,
  },
  primaryCheckButtonTight: {
    minHeight: 38,
    marginTop: 8,
    paddingVertical: 7,
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
    width: 36,
    height: 36,
  },
});
