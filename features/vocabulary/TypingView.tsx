import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  LayoutAnimation,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  UIManager,
  useWindowDimensions,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAudioPlayer } from 'expo-audio';

import { useTypingGame } from './useTypingGame';
import type { Word } from '../../types/VocabularyTypes';
import { SOUND_EFFECT_OPTIONS, SUCCESS_SOUND, replaySoundEffect } from '../shared/soundEffects';
import { clampNumber, getWebLessonScale, scaleValue } from '../shared/responsiveLayout';
import LevelProgressSummary from '../progress/LevelProgressSummary';
import { triggerSelectionHaptic, triggerSuccessHaptic, triggerWarningHaptic } from '../shared/haptics';

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
    sessionXp: number;
    setTypedAnswer: (value: string) => void;
    strictMode: boolean;
    streak: number;
    typedAnswer: string;
    typingIndex: number;
    totalAttempts: number;
    totalWords: number;
    xp: number;
  };
}

const ACCURACY_EMOJI = '\uD83C\uDFAF';
const COMBO_EMOJI = '\uD83D\uDD25';
const XP_EMOJI = '\u2728';
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
  onShuffle,
  onSessionComplete,
  suppressCompletionScreen = false,
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
  const hasNotifiedCompletionRef = useRef(false);

  const [showFeedbackCard, setShowFeedbackCard] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackType, setFeedbackType] = useState<FeedbackType>(null);
  const [showShuffleFeedback, setShowShuffleFeedback] = useState(false);

  const feedbackOpacity = useRef(new Animated.Value(0)).current;
  const feedbackScale = useRef(new Animated.Value(0.7)).current;
  const shuffleScale = useRef(new Animated.Value(1)).current;
  const comboFireScale = useRef(new Animated.Value(1)).current;

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
    sessionXp,
    setTypedAnswer,
    strictMode,
    streak,
    typedAnswer,
    typingIndex,
    correctAnswers,
    difficultyByWord = {},
    totalAttempts,
    totalWords,
    currentWord,
    xp,
  } = typingGame ?? internalTypingGame;

  const isFinished = safeWords.length > 0 && isSessionComplete;
  const currentWordNumber = Math.min(typingIndex + 1, totalWords || safeWords.length);
  const shouldReserveKeyboardSpace = forceAndroidLayout || Platform.OS !== 'web' || width < 768;
  const androidInteractiveCardMinHeight = Math.round(clampNumber(
    responsiveHeight * (keyboardMode ? 0.47 : isCompact ? 0.62 : 0.68),
    keyboardMode ? (isCompact ? 350 : 380) : isCompact ? 460 : 540,
    keyboardMode ? (isCompact ? 440 : 480) : isCompact ? 600 : 720
  ));
  const interactiveCardMinHeight = isAndroid
    ? androidInteractiveCardMinHeight
    : keyboardMode
      ? 276
      : isDesktopWeb
        ? Math.max(scaleValue(510, typingWebScale), Math.round(responsiveHeight * 0.76))
        : isCompact
          ? 380
          : 440;
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
  const completionMinHeight = keyboardMode
    ? 360
    : isDesktopWeb
      ? Math.max(scaleValue(470, webScale), Math.round(responsiveHeight * 0.70))
      : isCompact
        ? 400
        : 460;
  const androidPromptMinHeight = Math.round(clampNumber(
    responsiveHeight * (keyboardMode ? 0.18 : 0.23),
    keyboardMode ? 124 : isCompact ? 150 : 164,
    keyboardMode ? 158 : isCompact ? 188 : 212
  ));
  const promptMinHeight = isAndroid
    ? androidPromptMinHeight
    : keyboardMode
      ? 78
      : isDesktopWeb
        ? scaleValue(158, typingWebScale)
        : isCompact
          ? 104
          : 124;
  const promptFontSize = isAndroid
    ? keyboardMode
      ? 30
      : isCompact ? 35 : 38
    : keyboardMode
      ? 23
      : isDesktopWeb
        ? scaleValue(42, typingWebScale)
        : isCompact
          ? 28
          : 34;
  const promptLineHeight = isAndroid
    ? keyboardMode
      ? 36
      : isCompact ? 41 : 45
    : keyboardMode
      ? 27
      : isDesktopWeb
        ? scaleValue(50, typingWebScale)
        : isCompact
          ? 32
          : 38;
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
  const secondaryControlsMarginTop = isAndroid
    ? keyboardMode ? 10 : isCompact ? 14 : 16
    : keyboardMode ? 8 : isCompact ? 12 : 14;

  React.useLayoutEffect(() => {
    if (Platform.OS === 'android') {
      UIManager.setLayoutAnimationEnabledExperimental?.(true);
    }

    LayoutAnimation.configureNext(
      LayoutAnimation.create(
        260,
        LayoutAnimation.Types.easeInEaseOut,
        LayoutAnimation.Properties.scaleXY
      )
    );
  }, [keyboardMode, isCompact, interactiveCardMinHeight, completionMinHeight]);

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
      feedbackScale.setValue(0.7);

      Animated.sequence([
        Animated.parallel([
          Animated.timing(feedbackOpacity, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.spring(feedbackScale, {
            toValue: 1,
            friction: 6,
            tension: 90,
            useNativeDriver: true,
          }),
        ]),
        Animated.delay(1000),
        Animated.parallel([
          Animated.timing(feedbackOpacity, {
            toValue: 0,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(feedbackScale, {
            toValue: 0.9,
            duration: 150,
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => setShowFeedbackCard(false));
    },
    [feedbackOpacity, feedbackScale]
  );

  const shouldAutoFocusInput = Platform.OS !== 'web' && !isDesktopWeb;

  const focusInput = useCallback(() => {
    if (!shouldAutoFocusInput) {
      return;
    }

    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  }, [shouldAutoFocusInput]);

  const onSubmit = useCallback(() => {
    if (isAdvancing || !typedAnswer.trim()) {
      return;
    }

    void handleSubmit();
    focusInput();
  }, [focusInput, handleSubmit, isAdvancing, typedAnswer]);

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

  const handleShufflePress = useCallback(() => {
    if (!onShuffle) {
      return;
    }

    triggerSelectionHaptic();
    onShuffle();
    setShowShuffleFeedback(true);

    shuffleScale.setValue(0.96);
    Animated.spring(shuffleScale, {
      toValue: 1,
      friction: 5,
      tension: 140,
      useNativeDriver: true,
    }).start();
  }, [onShuffle, shuffleScale]);

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
    if (isFinished) {
      inputRef.current?.blur();
      return;
    }

    if (!shouldAutoFocusInput) {
      return;
    }

    const timeoutId = setTimeout(() => {
      inputRef.current?.focus();
    }, 60);

    return () => clearTimeout(timeoutId);
  }, [isFinished, shouldAutoFocusInput, typingIndex]);

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
    if (!showShuffleFeedback) {
      return;
    }
  }, [showShuffleFeedback]);

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
    setShowShuffleFeedback(false);
  }, [safeWords]);

  if (!safeWords.length) {
    return null;
  }

  if (isFinished && suppressCompletionScreen) {
    return null;
  }

  if (isFinished) {
    return (
      <View style={[styles.screen, styles.completionScreen, { backgroundColor: theme.background, minHeight: completionMinHeight }]}>
        <View
          style={[
            styles.card,
            styles.completionCard,
            styles.completionHeroCard,
            isDesktopWeb && { maxWidth: scaleValue(620, webScale) },
            {
              backgroundColor: theme.card,
              borderColor: theme.border,
            },
          ]}
        >
          <View style={[styles.completionHeroIcon, { backgroundColor: achievement.color }]}>
            <MaterialIcons name={accuracy === 100 ? 'workspace-premium' : 'check-circle'} size={28} color="#FFFFFF" />
          </View>

          <Text style={[styles.title, styles.completionTitle, isDesktopWeb && { fontSize: scaleValue(23, webScale) }, { color: theme.text }]}>
            {completionTitleText}
          </Text>
          <Text style={[styles.completionSubtitle, { color: theme.subText }]}>
            {completionSubtitleText}
          </Text>

          <View style={[styles.completionStatsGrid, { borderColor: theme.border }]}>
            <View style={styles.completionStatPill}>
              <View style={styles.completionStatValueRow}>
                <Text style={styles.statEmoji}>{XP_EMOJI}</Text>
                <Animated.Text style={styles.xpText}>{sessionXp}</Animated.Text>
              </View>
              <Text style={[styles.statLabel, { color: theme.subText }]}>XP</Text>
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

        </View>

        <LevelProgressSummary
          totalXP={xp}
          sessionXP={sessionXp}
          colors={theme}
          isDarkMode={theme.isDark}
          style={[styles.completionCard, styles.levelSummaryCard, isDesktopWeb && { maxWidth: scaleValue(620, webScale) }]}
        />

        <View
          style={[
            styles.card,
            styles.completionCard,
            styles.reviewWordsCard,
            isDesktopWeb && { maxWidth: scaleValue(620, webScale) },
            {
              backgroundColor: theme.card,
              borderColor: theme.border,
            },
          ]}
        >
          <View style={styles.reviewWordsHeader}>
            <MaterialIcons name="rate-review" size={18} color={theme.primary} />
            <Text style={[styles.reviewWordsTitle, { color: theme.text }]}>Words to Practise</Text>
          </View>

          {weakWords.length > 0 ? (
            <View style={styles.reviewWordsList}>
              {weakWords.slice(0, 3).map((word) => (
                <View key={`${word.english}-${word.french}`} style={styles.reviewWordRow}>
                  <Text style={[styles.reviewWordText, { color: theme.text }]} numberOfLines={1}>
                    {word.english}
                  </Text>
                  <Text style={[styles.reviewWordDivider, { color: theme.subText }]}>/</Text>
                  <Text style={[styles.reviewWordText, { color: theme.text }]} numberOfLines={1}>
                    {word.french}
                  </Text>
                </View>
              ))}
              {weakWords.length > 3 && (
                <Text style={[styles.reviewMoreText, { color: theme.subText }]}>
                  +{weakWords.length - 3} more
                </Text>
              )}
            </View>
          ) : (
            <Text style={[styles.reviewEmptyText, { color: theme.subText }]}>
              Nice! No tricky words left.
            </Text>
          )}
        </View>

        <TouchableOpacity
          onPress={handlePlayAgain}
          style={[styles.button, styles.playAgainButton, isDesktopWeb && { maxWidth: scaleValue(360, webScale), minHeight: scaleValue(44, webScale) }, { backgroundColor: theme.primary }]}
        >
          <MaterialIcons name="refresh" size={18} color={theme.buttonText} />
          <Text style={[styles.buttonText, isDesktopWeb && { fontSize: scaleValue(14, webScale) }]}>Play Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

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
              <View style={[styles.typingStatusPill, keyboardMode && styles.typingStatusPillTight, androidStatusPillStyle, desktopStatusPillStyle, { backgroundColor: theme.card, borderColor: theme.statsBorder }]}>
                <Text style={[styles.typingStatusLabel, androidStatusLabelStyle, desktopStatusLabelStyle, { color: theme.subText }]}>Word</Text>
                <Text style={[styles.typingStatusValue, androidStatusValueStyle, desktopStatusValueStyle, { color: theme.text }]}>
                  {currentWordNumber} / {totalWords || safeWords.length}
                </Text>
              </View>

              <View style={[styles.typingStatusPill, keyboardMode && styles.typingStatusPillTight, androidStatusPillStyle, desktopStatusPillStyle, { backgroundColor: theme.card, borderColor: theme.statsBorder }]}>
                <Text style={[styles.typingStatusLabel, androidStatusLabelStyle, desktopStatusLabelStyle, { color: theme.subText }]}>Combo</Text>
                <View style={styles.comboValueRow}>
                  <Text style={[styles.typingStatusValue, androidStatusValueStyle, desktopStatusValueStyle, { color: theme.warning }]}>{streak}</Text>
                  {streak >= 3 && (
                    <Animated.Text
                      style={[
                        styles.comboFireEmoji,
                        {
                          transform: [{ scale: comboFireScale }],
                        },
                      ]}
                    >
                      {COMBO_EMOJI}
                    </Animated.Text>
                  )}
                </View>
              </View>

              <View style={[styles.typingStatusPill, keyboardMode && styles.typingStatusPillTight, androidStatusPillStyle, desktopStatusPillStyle, { backgroundColor: theme.card, borderColor: theme.statsBorder }]}>
                <Text style={[styles.typingStatusLabel, androidStatusLabelStyle, desktopStatusLabelStyle, { color: theme.subText }]}>Done</Text>
                <Text style={[styles.typingStatusValue, androidStatusValueStyle, desktopStatusValueStyle, { color: theme.success }]}>
                  {correctAnswers}/{safeWords.length}
                </Text>
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
                  borderColor: typedAnswer.trim() ? theme.primary : theme.border,
                  marginTop: 0,
                  minHeight: promptMinHeight,
                },
              ]}
            >
              <View style={[styles.promptBadge, { backgroundColor: theme.primary }]}>
                <Text style={[styles.promptBadgeText, { color: theme.buttonText }]}>{promptLabel}</Text>
              </View>
              <Text
                style={[
                  styles.promptText,
                  {
                    color: theme.text,
                    fontSize: promptFontSize,
                    lineHeight: promptLineHeight,
                  },
                ]}
              >
                {currentWord?.french}
              </Text>
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
                      <MaterialIcons name={getFeedbackIconName(feedbackType)} size={18} color="#FFFFFF" />
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
            <TextInput
              ref={inputRef}
              value={typedAnswer}
              onChangeText={setTypedAnswer}
              onSubmitEditing={onSubmit}
              blurOnSubmit={false}
              submitBehavior="submit"
              autoCapitalize="none"
              autoCorrect={false}
              showSoftInputOnFocus
              returnKeyType="done"
              placeholder={answerPlaceholder}
              placeholderTextColor={theme.subText}
              style={[
                styles.input,
                keyboardMode && styles.inputTight,
                {
                  color: theme.text,
                  backgroundColor: theme.inputBackground,
                  borderColor: typedAnswer.trim() ? theme.primary : theme.border,
                  paddingVertical: inputVerticalPadding,
                  fontSize: inputFontSize,
                },
              ]}
            />

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
                  backgroundColor: theme.primary,
                  opacity: isAdvancing || !typedAnswer.trim() ? 0.55 : 1,
                },
              ]}
            >
              <Text style={[styles.buttonText, isDesktopWeb && { fontSize: scaleValue(15, typingWebScale) }, { color: theme.buttonText }]}>Check</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.secondaryControlsRow, keyboardMode && styles.secondaryControlsRowTight, { marginTop: secondaryControlsMarginTop }]}>
            <TouchableOpacity
              onPress={handlePreviousWordPress}
              disabled={!canGoPrevious || isAdvancing}
              style={[
                styles.wordNavButton,
                styles.wordNavIconButton,
                keyboardMode && styles.wordNavIconButtonTight,
                {
                  backgroundColor: theme.statsBackground,
                  borderColor: theme.statsBorder,
                  opacity: !canGoPrevious || isAdvancing ? 0.5 : 1,
                },
              ]}
            >
              <MaterialIcons name="chevron-left" size={26} color={theme.text} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleShufflePress}
              disabled={isAdvancing}
              style={[
                styles.shuffleControlButton,
                keyboardMode && styles.shuffleControlButtonTight,
                {
                  backgroundColor: showShuffleFeedback ? theme.primary : theme.statsBackground,
                  borderColor: showShuffleFeedback ? theme.primary : theme.statsBorder,
                  opacity: isAdvancing ? 0.55 : 1,
                },
              ]}
            >
              <Animated.View style={[styles.shuffleControlContent, { transform: [{ scale: shuffleScale }] }]}>
                <MaterialIcons
                  name="shuffle"
                  size={16}
                  color={showShuffleFeedback ? theme.buttonText : theme.subText}
                />
                <Text
                  style={[
                    styles.shuffleControlText,
                    { color: showShuffleFeedback ? theme.buttonText : theme.subText },
                  ]}
                >
                  {showShuffleFeedback ? 'Shuffled' : 'Shuffle'}
                </Text>
              </Animated.View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleNextWordPress}
              disabled={!canGoNext || isAdvancing}
              style={[
                styles.wordNavButton,
                styles.wordNavIconButton,
                keyboardMode && styles.wordNavIconButtonTight,
                {
                  backgroundColor: theme.statsBackground,
                  borderColor: theme.statsBorder,
                  opacity: !canGoNext || isAdvancing ? 0.5 : 1,
                },
              ]}
            >
              <MaterialIcons name="chevron-right" size={26} color={theme.text} />
            </TouchableOpacity>
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
    fontSize: 23,
    lineHeight: 27,
    marginBottom: 2,
  },
  completionSubtitle: {
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 7,
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
  completionHeroIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 7,
  },
  completionStatsGrid: {
    width: '100%',
    minHeight: 58,
    marginTop: 8,
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
    marginTop: 2,
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
    width: 30,
    height: 30,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedbackText: {
    flexShrink: 1,
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 21,
    lineHeight: 24,
    textAlign: 'center',
    letterSpacing: 0,
  },
  feedbackTextAndroid: {
    fontSize: 24,
    lineHeight: 28,
  },
  feedbackTextTight: {
    fontSize: 18,
    lineHeight: 21,
  },
  feedbackTextTightAndroid: {
    fontSize: 22,
    lineHeight: 26,
  },
  feedbackTextDesktopWeb: {
    fontSize: 23,
    lineHeight: 27,
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
  promptOverlayWrap: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: 460,
    position: 'relative',
  },
  promptFeedbackOverlay: {
    ...StyleSheet.absoluteFillObject,
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
  secondaryControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  secondaryControlsRowTight: {
    gap: 8,
  },
  primaryCheckButton: {
    width: '100%',
    minHeight: 44,
    alignSelf: 'center',
    marginTop: 10,
    paddingVertical: 11,
    paddingHorizontal: 26,
    borderRadius: 12,
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
  shuffleControlButton: {
    minWidth: 112,
    height: 42,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shuffleControlButtonTight: {
    minWidth: 92,
    height: 36,
    paddingHorizontal: 10,
  },
  shuffleControlContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  shuffleControlText: {
    fontSize: 13,
    fontWeight: '600',
  },
  wordNavButton: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordNavIconButton: {
    width: 44,
    height: 42,
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  wordNavIconButtonTight: {
    width: 38,
    height: 36,
  },
});
