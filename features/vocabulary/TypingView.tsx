import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAudioPlayer } from 'expo-audio';

import { useTypingGame } from './useTypingGame';
import type { Word } from '../../types/VocabularyTypes';
import { BIG_SUCCESS_SOUND, SOUND_EFFECT_OPTIONS, SUCCESS_SOUND, replaySoundEffect } from '../shared/soundEffects';
import { clampNumber, getWebLessonScale, scaleValue } from '../shared/responsiveLayout';
import LevelProgressSummary from '../progress/LevelProgressSummary';
import { triggerSelectionHaptic, triggerSuccessHaptic, triggerWarningHaptic } from '../shared/haptics';
import { usePersistentExerciseKeyboard } from '../shared/usePersistentExerciseKeyboard';

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
  typingGame?: {
    attempts: Record<string, number>;
    correctAnswers: number;
    currentWord: Word | null;
    difficultyByWord?: Record<string, DifficultyStats>;
    feedbackEvent: { type: 'correct' | 'close' | 'wrong'; text: string; streak?: number } | null;
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
    primary: colors?.primary ?? colors?.buttonBackground ?? '#3B82F6',
    success: colors?.success ?? (isDark ? '#7ADB9E' : '#63E894'),
    successSoft: colors?.successSoft ?? (isDark ? '#123E36' : '#E9F8EF'),
    warning: colors?.warning ?? (isDark ? '#FFD36D' : '#FFBF51'),
    warningSoft: colors?.warningSoft ?? (isDark ? '#493912' : '#FFF4D8'),
    error: colors?.danger ?? (isDark ? '#FF8BA1' : '#FF7878'),
    errorSoft: colors?.dangerSoft ?? (isDark ? '#4F2135' : '#FFE8EC'),
    progressBg: colors?.border ?? (isDark ? '#2A5C84' : '#E5E7EB'),
    inputBackground: colors?.surfaceAlt ?? (isDark ? '#1B527F' : '#FFFFFF'),
    statsBackground: colors?.surface ?? (isDark ? '#123B61' : '#EEF2F7'),
    statsBorder: colors?.border ?? (isDark ? '#2A5C84' : '#E5E7EB'),
  };
};

const getFeedbackBackgroundColor = (
  type: FeedbackType,
  theme: ReturnType<typeof buildTheme>
) => {
  switch (type) {
    case 'levelup':
      return '#A855F7';
    case 'correct':
      return theme.success;
    case 'close':
      return theme.warning;
    default:
      return theme.error;
  }
};

const getFeedbackIconName = (type: FeedbackType): React.ComponentProps<typeof MaterialIcons>['name'] => {
  switch (type) {
    case 'levelup':
      return 'workspace-premium';
    case 'correct':
      return 'check-circle';
    case 'close':
      return 'tips-and-updates';
    default:
      return 'refresh';
  }
};

const getAchievement = (accuracy: number, streak: number) => {
  const successGreen = '#4ADE80';
  const perfectYellow = '#FACC15';

  if (accuracy === 100) {
    return { color: perfectYellow };
  }

  if (accuracy >= 90) {
    return { color: successGreen };
  }

  if (streak >= 10) {
    return { color: successGreen };
  }

  if (streak >= 7) {
    return { color: successGreen };
  }

  if (streak >= 5) {
    return { color: successGreen };
  }

  if (streak >= 3) {
    return { color: successGreen };
  }

  return { color: successGreen };
};

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
  typingGame,
}: TypingViewProps) {
  const safeWords = words ?? [];
  const { width, height } = useWindowDimensions();
  const responsiveHeight = layoutHeight ?? height;
  const isAndroid = Platform.OS === 'android' || forceAndroidLayout;
  const isDesktopWeb = Platform.OS === 'web' && !forceAndroidLayout && width >= 768;
  const webScale = getWebLessonScale(width, responsiveHeight);
  const typingWebScale = isDesktopWeb ? Math.min(webScale * 1.06, 1.16) : webScale;
  const isCompact = !isDesktopWeb && (responsiveHeight < 760 || width < 390);
  const isKeyboardTight = isAndroid
    ? responsiveHeight < 640
    : !isDesktopWeb && (responsiveHeight < 700 || width < 380);
  const keyboardMode = keyboardVisible || isKeyboardTight;
  const inputRef = useRef<TextInput | null>(null);
  const successPlayer = useAudioPlayer(SUCCESS_SOUND, SOUND_EFFECT_OPTIONS);
  const bigSuccessPlayer = useAudioPlayer(BIG_SUCCESS_SOUND, SOUND_EFFECT_OPTIONS);
  const hasNotifiedCompletionRef = useRef(false);

  const [showFeedbackCard, setShowFeedbackCard] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackType, setFeedbackType] = useState<FeedbackType>(null);

  const feedbackOpacity = useRef(new Animated.Value(0)).current;
  const feedbackScale = useRef(new Animated.Value(0.86)).current;
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

    return {
      ...baseTheme,
      subText: colors?.secondaryText ?? baseTheme.subText,
      primary: colors?.buttonBackground ?? baseTheme.primary,
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
    inlineMessage,
    maxStreak,
    reset,
    comboBonus = 0,
    requestHint,
    currentHintCount = 0,
    currentHintText = '',
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
    xp,
  } = typingGame ?? internalTypingGame;

  const prevStreakRef = useRef(streak);

  const isFinished = safeWords.length > 0 && isSessionComplete;
  const currentSourceLessonTitle =
    typeof currentWord?.sourceLesson?.title === 'string'
      ? currentWord.sourceLesson.title.trim()
      : '';
  const shouldReserveKeyboardSpace = forceAndroidLayout || Platform.OS !== 'web' || width < 768;
  const androidInteractiveCardMinHeight = Math.round(clampNumber(
    responsiveHeight * (keyboardMode ? 0.50 : isCompact ? 0.66 : 0.72),
    keyboardMode ? (isCompact ? 370 : 400) : isCompact ? 490 : 570,
    keyboardMode ? (isCompact ? 460 : 510) : isCompact ? 630 : 760
  ));
  const interactiveCardMinHeight = isAndroid
    ? androidInteractiveCardMinHeight
    : keyboardMode
      ? 306
      : isDesktopWeb
        ? Math.max(scaleValue(550, typingWebScale), Math.round(responsiveHeight * 0.80))
        : isCompact
          ? 420
          : 490;
  const androidStatusPillStyle = isAndroid
    ? {
        minHeight: keyboardMode ? 32 : 38,
        paddingHorizontal: keyboardMode ? 9 : 11,
        gap: 6,
      }
    : undefined;
  const androidStatusLabelStyle = isAndroid
    ? { fontSize: keyboardMode ? 12 : 13, lineHeight: keyboardMode ? 15 : 16 }
    : undefined;
  const androidStatusValueStyle = isAndroid
    ? { fontSize: keyboardMode ? 15 : 17, lineHeight: keyboardMode ? 18 : 21 }
    : undefined;
  const desktopStatusPillStyle = isDesktopWeb
    ? {
        minHeight: scaleValue(38, typingWebScale),
        paddingHorizontal: scaleValue(12, typingWebScale),
        gap: scaleValue(7, typingWebScale),
      }
    : undefined;
  const desktopStatusLabelStyle = isDesktopWeb
    ? { fontSize: scaleValue(12, typingWebScale), lineHeight: scaleValue(15, typingWebScale) }
    : undefined;
  const desktopStatusValueStyle = isDesktopWeb
    ? { fontSize: scaleValue(16, typingWebScale), lineHeight: scaleValue(20, typingWebScale) }
    : undefined;
  const androidPromptMinHeight = Math.round(clampNumber(
    responsiveHeight * (keyboardMode ? 0.20 : 0.26),
    keyboardMode ? 136 : isCompact ? 170 : 188,
    keyboardMode ? 172 : isCompact ? 214 : 244
  ));
  const promptMinHeight = isAndroid
    ? androidPromptMinHeight
    : keyboardMode
      ? 96
      : isDesktopWeb
        ? scaleValue(186, typingWebScale)
        : isCompact
          ? 130
          : 156;
  const promptFontSize = isAndroid
    ? keyboardMode
      ? 33
      : isCompact ? 39 : 43
    : keyboardMode
      ? 26
      : isDesktopWeb
        ? scaleValue(48, typingWebScale)
        : isCompact
          ? 32
          : 40;
  const promptLineHeight = isAndroid
    ? keyboardMode
      ? 40
      : isCompact ? 46 : 51
    : keyboardMode
      ? 31
      : isDesktopWeb
        ? scaleValue(57, typingWebScale)
        : isCompact
          ? 38
          : 47;
  const contentHorizontalPadding = isAndroid
    ? isCompact ? 8 : 10
    : isCompact ? 12 : 18;
  const contentBottomPadding = isAndroid
    ? keyboardMode ? 34 : shouldReserveKeyboardSpace ? (isCompact ? 18 : 26) : 16
    : keyboardMode ? 44 : shouldReserveKeyboardSpace ? (isCompact ? 16 : 24) : 16;
  const androidPromptMarginTop = keyboardMode ? 10 : isCompact ? 18 : 24;
  const androidAnswerMarginTop = keyboardMode ? 10 : isCompact ? 15 : 18;
  const inputVerticalPadding = isAndroid
    ? keyboardMode ? 12 : 15
    : keyboardMode ? 9 : isDesktopWeb ? scaleValue(16, typingWebScale) : 13;
  const inputFontSize = isAndroid
    ? keyboardMode ? 18 : 19
    : keyboardMode ? 16 : isDesktopWeb ? scaleValue(19, typingWebScale) : 17;
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

  const achievement = useMemo(() => getAchievement(accuracy, maxStreak), [accuracy, maxStreak]);

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
    (type: FeedbackType, text: string) => {
      setFeedbackType(type);
      setFeedbackText(text);
      setShowFeedbackCard(true);

      feedbackOpacity.setValue(0);
      feedbackScale.setValue(0.86);

      const displayDuration = type === 'correct' ? 520 : 950;

      Animated.sequence([
        Animated.parallel([
          Animated.timing(feedbackOpacity, {
            toValue: 1,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.spring(feedbackScale, {
            toValue: 1,
            friction: 5,
            tension: 200,
            useNativeDriver: true,
          }),
        ]),
        Animated.delay(displayDuration),
        Animated.parallel([
          Animated.timing(feedbackOpacity, {
            toValue: 0,
            duration: 110,
            useNativeDriver: true,
          }),
          Animated.timing(feedbackScale, {
            toValue: 0.93,
            duration: 110,
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => setShowFeedbackCard(false));
    },
    [feedbackOpacity, feedbackScale]
  );

  const {
    isScreenFocused,
    shouldKeepKeyboardOpen,
    focusInput,
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
    focusInput();
  }, [focusInput, focusInputSequence, handleSubmit, isAdvancing, isFinished, typedAnswer]);

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
    if (!feedbackEvent?.type || !feedbackEvent.text) {
      return;
    }

    if (feedbackEvent.type === 'correct') {
      triggerSuccessHaptic();
      void playSuccessSound();
    } else {
      triggerWarningHaptic();
    }

    const baseFeedbackText =
      feedbackEvent.type === 'correct' && feedbackEvent.streak
        ? `${feedbackEvent.text}\nCombo ${feedbackEvent.streak}`
        : feedbackEvent.text;
    const helperText = inlineMessage && !baseFeedbackText.includes(inlineMessage)
      ? `\n${inlineMessage}`
      : '';

    triggerFeedbackCard(feedbackEvent.type, `${baseFeedbackText}${helperText}`);
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
    replaySoundEffect(bigSuccessPlayer);
    onSessionComplete?.();
  }, [isFinished, onSessionComplete, bigSuccessPlayer]);

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
        useNativeDriver: true,
      }),
      Animated.spring(comboFireScale, {
        toValue: 1,
        friction: 5,
        tension: 120,
        useNativeDriver: true,
      }),
    ]).start();
  }, [comboFireScale, streak]);

  useEffect(() => {
    const wasCombo = prevStreakRef.current >= 3;
    prevStreakRef.current = streak;
    if (wasCombo && streak === 0) {
      Animated.sequence([
        Animated.timing(comboShakeAnim, { toValue: -7, duration: 55, useNativeDriver: true }),
        Animated.timing(comboShakeAnim, { toValue: 7, duration: 55, useNativeDriver: true }),
        Animated.timing(comboShakeAnim, { toValue: -4, duration: 45, useNativeDriver: true }),
        Animated.timing(comboShakeAnim, { toValue: 0, duration: 45, useNativeDriver: true }),
      ]).start();
    }
  }, [comboShakeAnim, streak]);

  useEffect(() => {
    const target = safeWords.length > 0
      ? Math.min(100, Math.round((correctAnswers / safeWords.length) * 100))
      : 0;
    if (correctAnswers === 0) {
      progressBarAnim.setValue(0);
    } else {
      Animated.timing(progressBarAnim, { toValue: target, duration: 380, useNativeDriver: false }).start();
    }
  }, [correctAnswers, safeWords.length, progressBarAnim]);

  useEffect(() => {
    wordFadeAnim.setValue(0.45);
    Animated.timing(wordFadeAnim, { toValue: 1, duration: 180, useNativeDriver: true }).start();
  }, [typingIndex, wordFadeAnim]);

  useEffect(() => {
    if (sessionXp > prevXpRef.current) {
      Animated.sequence([
        Animated.spring(xpPulseAnim, { toValue: 1.11, friction: 4, tension: 260, useNativeDriver: true }),
        Animated.spring(xpPulseAnim, { toValue: 1, friction: 5, tension: 180, useNativeDriver: true }),
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

  if (isFinished) {
    return (
      <View style={styles.interactiveShell}>
        <ScrollView
          style={{ width: '100%' }}
          contentContainerStyle={[
            styles.contentContainer,
            {
              backgroundColor: theme.background,
              paddingTop: isAndroid ? 6 : 0,
              paddingBottom: contentBottomPadding,
              paddingHorizontal: contentHorizontalPadding,
            },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View
            style={[
              styles.card,
              styles.interactiveCard,
              isDesktopWeb && styles.interactiveCardDesktopWeb,
              isDesktopWeb && { maxWidth: scaleValue(730, typingWebScale) },
              { backgroundColor: theme.card, borderColor: theme.border, padding: 12, marginBottom: 8 },
            ]}
          >
            <View style={styles.completionHeroRow}>
              <View style={[styles.completionHeroIcon, { backgroundColor: achievement.color }]}>
                <MaterialIcons name={accuracy === 100 ? 'workspace-premium' : 'check-circle'} size={22} color="#FFFFFF" />
              </View>
              <View style={styles.completionTitleBlock}>
                <Text style={[styles.completionTitle, { color: theme.text }]} numberOfLines={1}>
                  {completionTitleText}
                </Text>
                <Text style={[styles.completionSubtitle, { color: theme.subText }]} numberOfLines={2}>
                  {completionSubtitleText}
                </Text>
              </View>
            </View>

            <View style={[styles.completionStatsGrid, { borderColor: theme.border, marginTop: 10 }]}>
              <View style={styles.completionStatPill}>
                <View style={styles.completionStatValueRow}>
                  <Text style={styles.statEmoji}>{XP_EMOJI}</Text>
                  <Animated.Text style={styles.xpText}>{sessionXp}</Animated.Text>
                </View>
                <Text style={[styles.statLabel, { color: theme.subText }]}>XP</Text>
              </View>
              <View style={[styles.completionStatPill, { borderLeftColor: theme.border, borderLeftWidth: 1 }]}>
                <View style={styles.completionStatValueRow}>
                  <Text style={styles.statEmoji}>{STAR_EMOJI}</Text>
                  <Text style={[styles.statText, { color: theme.text }]}>{firstTryCount}</Text>
                </View>
                <Text style={[styles.statLabel, { color: theme.subText }]}>1st Try</Text>
              </View>
              <View style={[styles.completionStatPill, { borderLeftColor: theme.border, borderLeftWidth: 1 }]}>
                <View style={styles.completionStatValueRow}>
                  <Text style={styles.statEmoji}>{ACCURACY_EMOJI}</Text>
                  <Text style={[styles.statText, { color: theme.text }]}>{accuracy}%</Text>
                </View>
                <Text style={[styles.statLabel, { color: theme.subText }]}>Accuracy</Text>
              </View>
              <View style={[styles.completionStatPill, { borderLeftColor: theme.border, borderLeftWidth: 1 }]}>
                <View style={styles.completionStatValueRow}>
                  <Text style={styles.statEmoji}>{COMBO_EMOJI}</Text>
                  <Text style={[styles.statText, { color: theme.text }]}>{maxStreak}</Text>
                </View>
                <Text style={[styles.statLabel, { color: theme.subText }]}>Max Combo</Text>
              </View>
            </View>

            {weakWords.length > 0 && (
              <View style={[styles.completionWeakWordsRow, { borderTopColor: theme.border }]}>
                <MaterialIcons name="rate-review" size={13} color={theme.subText} />
                {weakWords.slice(0, 3).map((word) => (
                  <View
                    key={`${word.english}-${word.french}`}
                    style={[styles.completionWeakWordChip, { backgroundColor: theme.statsBackground, borderColor: theme.statsBorder }]}
                  >
                    <Text style={[styles.completionWeakWordText, { color: theme.text }]} numberOfLines={1}>
                      {word.french}
                    </Text>
                  </View>
                ))}
                {weakWords.length > 3 && (
                  <Text style={[styles.reviewMoreText, { color: theme.subText }]}>+{weakWords.length - 3}</Text>
                )}
              </View>
            )}
          </View>

          <LevelProgressSummary
            totalXP={xp}
            sessionXP={sessionXp}
            colors={theme}
            isDarkMode={theme.isDark}
            style={[
              styles.interactiveCard,
              isDesktopWeb && styles.interactiveCardDesktopWeb,
              isDesktopWeb && { maxWidth: scaleValue(730, typingWebScale) },
              { marginTop: 0, marginBottom: 8 },
            ]}
            onGoToAccount={onGoToAccount}
          />

          <TouchableOpacity
            onPress={handlePlayAgain}
            style={[
              styles.button,
              styles.playAgainButton,
              styles.interactiveCard,
              isDesktopWeb && styles.interactiveCardDesktopWeb,
              isDesktopWeb && { maxWidth: scaleValue(360, webScale), minHeight: scaleValue(44, webScale) },
              { backgroundColor: theme.primary },
            ]}
          >
            <MaterialIcons name="refresh" size={18} color={theme.buttonText} />
            <Text style={[styles.buttonText, isDesktopWeb && { fontSize: scaleValue(14, webScale) }]}>Play Again</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  const comboValueColor = streak >= 8 ? '#E8560A' : streak >= 5 ? theme.warning : theme.text;

  return (
    <View style={styles.interactiveShell}>
      <View
        style={[
          styles.contentContainer,
          {
            backgroundColor: theme.background,
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
            isDesktopWeb && { maxWidth: scaleValue(730, typingWebScale) },
            {
              backgroundColor: theme.background,
              borderColor: 'transparent',
              borderWidth: 0,
              padding: 0,
              minHeight: interactiveCardMinHeight,
            },
          ]}
        >
          <View
            style={[
              styles.typingProgressPanel,
              keyboardMode && styles.typingProgressPanelTight,
              isDesktopWeb && {
                padding: scaleValue(12, typingWebScale),
                borderRadius: scaleValue(17, typingWebScale),
              },
              {
                backgroundColor: theme.statsBackground,
                borderColor: theme.statsBorder,
              },
            ]}
          >
            <View style={[styles.typingStatusRow, keyboardMode && styles.typingStatusRowTight, isAndroid && styles.typingStatusRowAndroid]}>
              <Animated.View style={[styles.typingStatusPill, keyboardMode && styles.typingStatusPillTight, androidStatusPillStyle, desktopStatusPillStyle, { backgroundColor: theme.card, borderColor: theme.statsBorder, transform: [{ translateX: comboShakeAnim }] }]}>
                <Text style={[styles.typingStatusLabel, androidStatusLabelStyle, desktopStatusLabelStyle, { color: theme.subText }]}>Combo</Text>
                <View style={styles.comboValueRow}>
                  <Text style={[styles.typingStatusValue, androidStatusValueStyle, desktopStatusValueStyle, { color: comboValueColor }]}>{streak}</Text>
                  {streak >= 3 && (
                    <Animated.Text style={[styles.comboFireEmoji, { transform: [{ scale: comboFireScale }] }]}>
                      {COMBO_EMOJI}
                    </Animated.Text>
                  )}
                  {comboBonus > 0 && (
                    <View style={[styles.comboBonusBadge, { backgroundColor: theme.successSoft, borderColor: theme.success }]}>
                      <Text style={[styles.comboBonusBadgeText, { color: theme.success }]}>+{comboBonus} XP bonus</Text>
                    </View>
                  )}
                </View>
              </Animated.View>

              <View style={[styles.typingStatusPill, keyboardMode && styles.typingStatusPillTight, androidStatusPillStyle, desktopStatusPillStyle, { backgroundColor: theme.card, borderColor: theme.statsBorder }]}>
                <Text style={[styles.typingStatusLabel, androidStatusLabelStyle, desktopStatusLabelStyle, { color: theme.subText }]}>{XP_EMOJI} XP</Text>
                <Animated.Text style={[styles.typingStatusValue, androidStatusValueStyle, desktopStatusValueStyle, { color: theme.success, transform: [{ scale: xpPulseAnim }] }]}>
                  {sessionXp}
                </Animated.Text>
              </View>

            </View>

            <View style={[styles.progressTrack, { backgroundColor: theme.progressBg, marginTop: 7 }]}>
              <Animated.View
                style={[
                  styles.progressFill,
                  {
                    backgroundColor: theme.success,
                    width: progressBarAnim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }),
                    opacity: 0.75,
                  },
                ]}
              />
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
            ]}
          >
          <View
            style={[
              styles.promptOverlayWrap,
              isDesktopWeb && {
                maxWidth: scaleValue(700, typingWebScale),
              },
              {
                marginTop: isAndroid ? androidPromptMarginTop : keyboardMode ? 8 : isDesktopWeb ? scaleValue(21, typingWebScale) : isCompact ? 14 : 20,
                minHeight: promptMinHeight,
              },
            ]}
          >
            <View
              style={[
                styles.promptPanel,
                isDesktopWeb && styles.promptPanelDesktopWeb,
                isDesktopWeb && {
                  maxWidth: scaleValue(700, typingWebScale),
                  minHeight: scaleValue(158, typingWebScale),
                  paddingVertical: scaleValue(23, typingWebScale),
                  paddingHorizontal: scaleValue(27, typingWebScale),
                },
                {
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
                  marginTop: 0,
                  minHeight: promptMinHeight,
                },
              ]}
            >
              <View style={[styles.promptBadge, { backgroundColor: theme.primary }]}>
                <Text style={[styles.promptBadgeText, { color: theme.buttonText }]}>{promptLabel}</Text>
              </View>
              {currentSourceLessonTitle ? (
                <View
                  style={[
                    styles.promptSourceBadge,
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
              {!strictMode && (
                <TouchableOpacity
                  onPress={requestHint}
                  disabled={isAdvancing}
                  style={[
                    styles.hintIconButton,
                    {
                      backgroundColor: currentHintCount > 0 ? theme.warningSoft : theme.statsBackground,
                      borderColor: currentHintCount > 0 ? theme.warning : theme.statsBorder,
                      opacity: isAdvancing ? 0.5 : 1,
                    },
                  ]}
                >
                  <MaterialIcons
                    name="lightbulb-outline"
                    size={keyboardMode || isCompact ? 16 : 18}
                    color={currentHintCount > 0 ? '#7A4F00' : theme.subText}
                  />
                  {keyboardMode || isCompact ? (
                    currentHintCount > 0 ? (
                      <Text style={[styles.hintIconCount, { color: '#7A4F00' }]}>{currentHintCount}</Text>
                    ) : null
                  ) : (
                    <Text style={[styles.hintIconLabel, { color: currentHintCount > 0 ? '#7A4F00' : theme.subText }]}>
                      {currentHintCount > 0 ? `Hint · ${currentHintCount}` : 'Hint'}
                    </Text>
                  )}
                </TouchableOpacity>
              )}
              <Animated.Text
                style={[
                  styles.promptText,
                  {
                    color: theme.text,
                    fontSize: promptFontSize,
                    lineHeight: promptLineHeight,
                    opacity: wordFadeAnim,
                  },
                ]}
              >
                {currentWord?.french}
              </Animated.Text>
            </View>
          </View>

          <View
            style={[
              styles.answerPanel,
              isDesktopWeb && styles.answerPanelDesktopWeb,
              isDesktopWeb && {
                maxWidth: scaleValue(700, typingWebScale),
                padding: scaleValue(13, typingWebScale),
              },
              {
                backgroundColor: theme.card,
                borderColor: theme.border,
                marginTop: isAndroid ? androidAnswerMarginTop : keyboardMode ? 8 : isDesktopWeb ? scaleValue(19, typingWebScale) : isCompact ? 12 : 16,
              },
            ]}
          >
            {currentHintText ? (
              <Text style={[styles.hintStrip, { color: theme.subText }]} numberOfLines={1}>
                {currentHintText}
              </Text>
            ) : null}

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
              placeholder={answerPlaceholder}
              placeholderTextColor={theme.subText}
              style={[
                styles.input,
                keyboardMode && styles.inputTight,
                {
                  color: theme.text,
                  backgroundColor: theme.inputBackground,
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
              ]}
            />

            <View style={[styles.checkButtonRow, { marginTop: isAndroid ? (keyboardMode ? 10 : 15) : keyboardMode ? 8 : 10 }]}>
              <TouchableOpacity
                onPress={handlePreviousWordPress}
                disabled={!canGoPrevious || isAdvancing}
                style={[
                  styles.navArrowInline,
                  keyboardMode && styles.navArrowInlineTight,
                  {
                    backgroundColor: theme.statsBackground,
                    borderColor: theme.statsBorder,
                    opacity: !canGoPrevious || isAdvancing ? 0.4 : 1,
                  },
                ]}
              >
                <MaterialIcons name="chevron-left" size={22} color={theme.text} />
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
                ]}
              >
                <Text style={[styles.buttonText, isDesktopWeb && { fontSize: scaleValue(15, typingWebScale) }, { color: theme.buttonText }]}>Check</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleNextWordPress}
                disabled={!canGoNext || isAdvancing}
                style={[
                  styles.navArrowInline,
                  keyboardMode && styles.navArrowInlineTight,
                  {
                    backgroundColor: theme.statsBackground,
                    borderColor: theme.statsBorder,
                    opacity: !canGoNext || isAdvancing ? 0.4 : 1,
                  },
                ]}
              >
                <MaterialIcons name="chevron-right" size={22} color={theme.text} />
              </TouchableOpacity>
            </View>
          </View>
          {showFeedbackCard && (
            <Animated.View
              pointerEvents="none"
              style={[
                styles.promptFeedbackOverlay,
                {
                  opacity: feedbackOpacity,
                  transform: [
                    {
                      translateY: feedbackOpacity.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-12, 0],
                      }),
                    },
                    { scale: feedbackScale },
                  ],
                },
              ]}
            >
              <View
                style={[
                  styles.feedbackCard,
                  keyboardMode && (isAndroid ? styles.feedbackCardTightAndroid : styles.feedbackCardTight),
                  !keyboardMode && isCompact && (isAndroid ? styles.feedbackCardCompactAndroid : styles.feedbackCardCompact),
                  isDesktopWeb && styles.feedbackCardDesktopWeb,
                  {
                    backgroundColor: getFeedbackBackgroundColor(feedbackType, theme),
                  },
                ]}
              >
                <View style={styles.feedbackContent}>
                  <View style={styles.feedbackIconBubble}>
                    <MaterialIcons name={getFeedbackIconName(feedbackType)} size={24} color="#FFFFFF" />
                  </View>
                  <Text
                    style={[
                      styles.feedbackText,
                      !keyboardMode && isAndroid && styles.feedbackTextAndroid,
                      keyboardMode && (isAndroid ? styles.feedbackTextTightAndroid : styles.feedbackTextTight),
                      isDesktopWeb && styles.feedbackTextDesktopWeb,
                    ]}
                    numberOfLines={isAndroid ? 4 : 3}
                    adjustsFontSizeToFit
                    minimumFontScale={isAndroid ? 0.92 : 0.82}
                  >
                    {feedbackText}
                  </Text>
                </View>
              </View>
            </Animated.View>
          )}
          </View>
        </View>
      </View>
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
  },
  completionSubtitle: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  completionTitleBlock: {
    flex: 1,
    minWidth: 0,
  },
  completionHeroIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
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
    backgroundColor: '#3B82F6',
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
  feedbackContainer: {
    position: 'absolute',
    top: 92,
    left: 16,
    right: 16,
    alignItems: 'center',
    zIndex: 999,
  },
  feedbackContainerCompact: {
    top: 84,
  },
  feedbackContainerTight: {
    top: 60,
  },
  feedbackContainerDesktopWeb: {
    top: 86,
  },
  feedbackCard: {
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderRadius: 16,
    elevation: 7,
    width: '100%',
    height: '100%',
    maxWidth: '100%',
    minHeight: 124,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
  },
  feedbackCardCompact: {
    minHeight: 104,
  },
  feedbackCardCompactAndroid: {
    minHeight: 130,
  },
  feedbackCardTight: {
    maxWidth: '100%',
    minHeight: 78,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  feedbackCardTightAndroid: {
    maxWidth: '100%',
    minHeight: 118,
    paddingVertical: 16,
    paddingHorizontal: 14,
    borderRadius: 16,
  },
  feedbackCardDesktopWeb: {
    maxWidth: '100%',
    minHeight: 136,
    paddingVertical: 20,
    paddingHorizontal: 22,
  },
  feedbackContent: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  feedbackIconBubble: {
    width: 42,
    height: 42,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedbackText: {
    flexShrink: 1,
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 28,
    lineHeight: 33,
    textAlign: 'center',
    letterSpacing: 0,
  },
  feedbackTextAndroid: {
    fontSize: 30,
    lineHeight: 35,
  },
  feedbackTextTight: {
    fontSize: 22,
    lineHeight: 26,
  },
  feedbackTextTightAndroid: {
    fontSize: 26,
    lineHeight: 30,
  },
  feedbackTextDesktopWeb: {
    fontSize: 30,
    lineHeight: 36,
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
  gameAreaWrap: {
    position: 'relative',
    width: '100%',
    maxWidth: 460,
    alignSelf: 'center',
  },
  promptOverlayWrap: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: 460,
    position: 'relative',
  },
  promptFeedbackOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 30,
    elevation: 30,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
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
    position: 'absolute',
    top: 12,
    left: 12,
    maxWidth: '58%',
    minHeight: 26,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 9,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
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
    borderWidth: 1,
    borderRadius: 16,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  answerPanelDesktopWeb: {
    maxWidth: 600,
    padding: 12,
  },
  input: {
    width: '100%',
    alignSelf: 'center',
    borderWidth: 2,
    borderRadius: 12,
    padding: 12,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '600',
  },
  inputTight: {
    fontSize: 16,
  },
  checkButtonRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 6,
  },
  hintStrip: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 6,
  },
  hintIconButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  hintIconCount: {
    fontSize: 13,
    fontWeight: '800',
  },
  hintIconLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  primaryCheckButton: {
    minHeight: 44,
    alignSelf: 'center',
    marginTop: 10,
    paddingVertical: 11,
    paddingHorizontal: 26,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
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
    width: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navArrowInlineTight: {
    width: 38,
  },
});
