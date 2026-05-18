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

import { useTypingGame } from '../hooks/useTypingGame';
import type { Word } from '../types/VocabularyTypes';
import { SOUND_EFFECT_OPTIONS, SUCCESS_SOUND, replaySoundEffect } from '../utils/soundEffects';
import { getWebLessonScale, scaleValue } from '../utils/responsiveLayout';
import { triggerSelectionHaptic, triggerSuccessHaptic, triggerWarningHaptic } from '../utils/haptics';

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
  danger?: string;
  warning?: string;
  buttonBackground?: string;
  buttonText?: string;
};

type FeedbackType = 'correct' | 'close' | 'wrong' | 'levelup' | null;

interface TypingViewProps {
  words?: Word[];
  colors?: ThemeColors;
  isDarkMode?: boolean;
  allowSlashAlternatives?: boolean;
  keyboardVisible?: boolean;
  layoutHeight?: number;
  onShuffle?: () => void;
  onSessionComplete?: () => void;
  suppressCompletionScreen?: boolean;
  typingGame?: {
    attempts: Record<string, number>;
    correctAnswers: number;
    currentWord: Word | null;
    difficultyByWord?: Record<string, unknown>;
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
    levelUpMessage?: string;
    masteredCount: number;
    maxStreak: number;
    mistakes: number;
    reset: () => void;
    rewardPreview: string;
    sessionHighlight: string;
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

const xpNeededForLevel = (level: number) => Math.min(50 + (level - 1) * 10, 200);

const xpForLevel = (level: number) => {
  let total = 0;

  for (let currentLevel = 1; currentLevel < level; currentLevel += 1) {
    total += xpNeededForLevel(currentLevel);
  }

  return total;
};

const buildTheme = (colors?: ThemeColors) => {
  const isDark = colors?.isDark ?? false;

  return {
    isDark,
    background: colors?.background ?? (isDark ? '#0B0B0F' : '#F8FAFC'),
    card: colors?.card ?? (isDark ? '#16161A' : '#FFFFFF'),
    text: colors?.text ?? (isDark ? '#FFFFFF' : '#0F172A'),
    subText: colors?.secondaryText ?? (isDark ? '#9CA3AF' : '#64748B'),
    border: colors?.border ?? (isDark ? '#2A2A2A' : '#E2E8F0'),
    primary: colors?.primary ?? colors?.buttonBackground ?? '#3B82F6',
    success: colors?.success ?? '#63E894',
    warning: colors?.warning ?? '#FFBF51',
    error: colors?.danger ?? '#FF7878',
    progressBg: colors?.border ?? (isDark ? '#1F1F23' : '#E5E7EB'),
    inputBackground: colors?.surfaceAlt ?? (isDark ? '#0F0F14' : '#FFFFFF'),
    statsBackground: colors?.surface ?? (isDark ? '#1F2937' : '#EEF2F7'),
    statsBorder: colors?.border ?? (isDark ? '#374151' : '#E5E7EB'),
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

const getAchievement = (accuracy: number, streak: number) => {
  const successGreen = '#4ADE80';
  const perfectYellow = '#FACC15';

  if (accuracy === 100) {
    if (streak >= 5) {
      return { label: 'PERFECT STREAK!', color: perfectYellow };
    }

    return { label: 'PERFECT!', color: perfectYellow };
  }

  if (accuracy >= 90) {
    return { label: 'GREAT JOB!', color: successGreen };
  }

  if (streak >= 10) {
    return { label: 'UNSTOPPABLE!', color: successGreen };
  }

  if (streak >= 7) {
    return { label: 'ON FIRE!', color: successGreen };
  }

  if (streak >= 5) {
    return { label: 'GREAT STREAK!', color: successGreen };
  }

  if (streak >= 3) {
    return { label: 'NICE COMBO!', color: successGreen };
  }

  return { label: 'KEEP GOING', color: successGreen };
};

export default function TypingView({
  words,
  colors,
  isDarkMode,
  allowSlashAlternatives = true,
  keyboardVisible = false,
  layoutHeight,
  onShuffle,
  onSessionComplete,
  suppressCompletionScreen = false,
  typingGame,
}: TypingViewProps) {
  const safeWords = words ?? [];
  const { width, height } = useWindowDimensions();
  const responsiveHeight = layoutHeight ?? height;
  const isDesktopWeb = Platform.OS === 'web' && width >= 768;
  const webScale = getWebLessonScale(width, responsiveHeight);
  const isCompact = !isDesktopWeb && (responsiveHeight < 760 || width < 390);
  const isKeyboardTight = !isDesktopWeb && (responsiveHeight < 700 || width < 380);
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
  const progressAnim = useRef(new Animated.Value(0)).current;
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
    level,
    levelUpMessage,
    masteredCount,
    maxStreak,
    mistakes,
    reset,
    rewardPreview,
    sessionHighlight,
    sessionXp,
    setTypedAnswer,
    strictMode,
    streak,
    typedAnswer,
    typingIndex,
    correctAnswers,
    totalAttempts,
    totalWords,
    currentWord,
    xp,
  } = typingGame ?? internalTypingGame;

  const isFinished = safeWords.length > 0 && isSessionComplete;
  const currentWordNumber = Math.min(typingIndex + 1, totalWords || safeWords.length);
  const shouldReserveKeyboardSpace = Platform.OS !== 'web' || width < 768;
  const interactiveCardMinHeight = keyboardMode
    ? 276
    : isDesktopWeb
      ? Math.max(scaleValue(480, webScale), Math.round(responsiveHeight * 0.76))
      : isCompact
        ? 380
        : 440;
  const completionMinHeight = keyboardMode
    ? 420
    : isDesktopWeb
      ? Math.max(scaleValue(540, webScale), Math.round(responsiveHeight * 0.80))
      : isCompact
        ? 460
        : 520;

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

  const xpForCurrentLevel = useMemo(() => xpForLevel(level), [level]);
  const xpForNextLevel = useMemo(() => xpForLevel(level + 1), [level]);
  const xpBeforeSession = Math.max(xp - sessionXp, 0);
  const xpIntoCurrentLevel = Math.max(xp - xpForCurrentLevel, 0);
  const xpIntoCurrentLevelBeforeSession = Math.max(xpBeforeSession - xpForCurrentLevel, 0);
  const xpNeededThisLevel = Math.max(xpForNextLevel - xpForCurrentLevel, 1);
  const progressPercent = useMemo(() => {
    const progress = xpIntoCurrentLevel / xpNeededThisLevel;
    return Math.min(Math.max(progress * 100, 0), 100);
  }, [xpIntoCurrentLevel, xpNeededThisLevel]);
  const startingProgressPercent = useMemo(() => {
    const progress = xpIntoCurrentLevelBeforeSession / xpNeededThisLevel;
    return Math.min(Math.max(progress * 100, 0), 100);
  }, [xpIntoCurrentLevelBeforeSession, xpNeededThisLevel]);
  const xpRemaining = Math.max(xpForNextLevel - xp, 0);
  const answerPanelMessage = inlineMessage || rewardPreview;
  const shouldShowAnswerSignal = !!inlineMessage || (!keyboardMode && !!rewardPreview);
  const answerPanelIcon = inlineMessage
    ? feedbackEvent?.type === 'wrong'
      ? 'error-outline'
      : feedbackEvent?.type === 'close'
        ? 'tips-and-updates'
        : 'bolt'
    : 'bolt';
  const answerPanelTone = inlineMessage
    ? feedbackEvent?.type === 'wrong'
      ? theme.error
      : feedbackEvent?.type === 'close'
        ? theme.warning
        : theme.success
    : theme.primary;
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

  const focusInput = useCallback(() => {
    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  }, []);

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
        inputRef.current?.focus();
      }, 150);
    });
  }, [reset]);

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
    if (!levelUpMessage) {
      return;
    }

    const timeoutId = setTimeout(() => {
      triggerFeedbackCard('levelup', `Level Up!\nYou are now level ${level}`);
    }, 1150);

    return () => clearTimeout(timeoutId);
  }, [level, levelUpMessage, triggerFeedbackCard]);

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

    const feedbackText =
      feedbackEvent.type === 'correct' && feedbackEvent.streak
        ? `${feedbackEvent.text}\nCombo ${feedbackEvent.streak}`
        : feedbackEvent.text;

    triggerFeedbackCard(feedbackEvent.type, feedbackText);
  }, [feedbackEvent, playSuccessSound, triggerFeedbackCard]);

  useEffect(() => {
    if (isFinished) {
      inputRef.current?.blur();
      return;
    }

    const timeoutId = setTimeout(() => {
      inputRef.current?.focus();
    }, 150);

    return () => clearTimeout(timeoutId);
  }, [isFinished]);

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

  useEffect(() => {
    if (!isFinished) {
      progressAnim.setValue(0);
      return;
    }

    progressAnim.setValue(startingProgressPercent);
    Animated.timing(progressAnim, {
      toValue: progressPercent,
      duration: 700,
      useNativeDriver: false,
    }).start();
  }, [isFinished, progressAnim, progressPercent, startingProgressPercent]);

  if (!safeWords.length) {
    return null;
  }

  if (isFinished && suppressCompletionScreen) {
    return null;
  }

  if (isFinished) {
    return (
      <View style={[styles.screen, styles.completionScreen, { backgroundColor: theme.background, minHeight: completionMinHeight }]}>
        <Text style={[styles.title, styles.completionTitle, isDesktopWeb && { fontSize: scaleValue(22, webScale) }, { color: theme.text }]}>Session Complete!</Text>

        <View
          style={[
            styles.card,
            styles.completionCard,
            styles.completionStatsCard,
            isDesktopWeb && { maxWidth: scaleValue(520, webScale) },
            {
              backgroundColor: theme.card,
              borderColor: theme.border,
            },
          ]}
        >
          <View style={[styles.statItem, styles.xpStatItem]}>
            <Animated.Text style={styles.xpText}>{sessionXp}</Animated.Text>
            <Text style={[styles.statLabel, { color: theme.subText }]}>XP</Text>
          </View>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          <View style={styles.statItem}>
              <Text style={styles.statEmoji}>{ACCURACY_EMOJI}</Text>
              <Text style={[styles.statLabel, { color: theme.subText }]}>Accuracy</Text>
              <Text style={[styles.statText, { color: theme.text }]}>{accuracy}%</Text>
          </View>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          <View style={styles.statItem}>
              <Text style={styles.statEmoji}>{COMBO_EMOJI}</Text>
              <Text style={[styles.statLabel, { color: theme.subText }]}>Max Combo</Text>
              <Text style={[styles.statText, { color: theme.text }]}>{maxStreak}</Text>
          </View>
        </View>

        <Animated.View
          style={[
            styles.badge,
            isDesktopWeb && {
              minWidth: scaleValue(230, webScale),
              paddingVertical: scaleValue(10, webScale),
              paddingHorizontal: scaleValue(18, webScale),
            },
            {
              backgroundColor: achievement.color,
              transform: [{ scale: feedbackScale }],
            },
          ]}
        >
         <Text style={[styles.badgeText, isDesktopWeb && { fontSize: scaleValue(20, webScale) }]}>{achievement.label}</Text>
        </Animated.View>

        <View
          style={[
            styles.sessionHighlight,
            isDesktopWeb && {
              maxWidth: scaleValue(520, webScale),
              minHeight: scaleValue(38, webScale),
            },
            {
              backgroundColor: theme.statsBackground,
              borderColor: theme.statsBorder,
            },
          ]}
        >
          <MaterialIcons name="auto-awesome" size={16} color={theme.primary} />
          <Text
            style={[styles.sessionHighlightText, { color: theme.text }]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.84}
          >
            {sessionHighlight}
          </Text>
        </View>

        <View
          style={[
            styles.card,
            styles.completionCard,
            styles.levelSummaryCard,
            isDesktopWeb && { maxWidth: scaleValue(520, webScale) },
            {
              backgroundColor: theme.card,
              borderColor: theme.border,
            },
          ]}
        >
          <View style={styles.levelSummaryHeader}>
            <View>
              <Text style={[styles.sectionTitle, styles.levelSummaryTitle, { color: theme.subText }]}>Total Level</Text>
              <Text style={[styles.levelText, styles.levelSummaryValue, { color: theme.text }]}>Level {level}</Text>
            </View>
            <View style={styles.levelSummaryStats}>
              <Text style={[styles.levelSummaryStatText, { color: theme.text }]}>
                {masteredCount}/{safeWords.length}
              </Text>
              <Text style={[styles.levelSummaryStatLabel, { color: theme.subText }]}>mastered</Text>
            </View>
          </View>

          <View style={[styles.progressTrack, { backgroundColor: theme.progressBg }]}>
            <Animated.View
              style={[
                styles.progressFill,
                {
                  width: progressAnim.interpolate({
                    inputRange: [0, 100],
                    outputRange: ['0%', '100%'],
                  }),
                  backgroundColor: theme.primary,
                },
              ]}
            />
          </View>

          <Text style={[styles.subText, styles.levelSummaryHint, { color: theme.subText }]}>
            {xpRemaining} XP to Level {level + 1} - {mistakes} mistakes
          </Text>
        </View>

        <TouchableOpacity
          onPress={handlePlayAgain}
          style={[styles.button, styles.playAgainButton, isDesktopWeb && { maxWidth: scaleValue(360, webScale), minHeight: scaleValue(44, webScale) }, { backgroundColor: theme.primary }]}
        >
          <Text style={[styles.buttonText, isDesktopWeb && { fontSize: scaleValue(14, webScale) }]}>Play Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.interactiveShell}>
      {showFeedbackCard && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.feedbackContainer,
            keyboardMode ? styles.feedbackContainerTight : isCompact && styles.feedbackContainerCompact,
            {
              opacity: feedbackOpacity,
              transform: [
                {
                  translateY: feedbackOpacity.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-20, 0],
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
              {
                backgroundColor: getFeedbackBackgroundColor(feedbackType, theme),
              },
            ]}
          >
            <Text style={styles.feedbackText}>{feedbackText}</Text>
          </View>
        </Animated.View>
      )}

      <View
        style={[
          styles.contentContainer,
          {
            backgroundColor: theme.background,
            paddingTop: 0,
            paddingBottom: keyboardMode ? 44 : shouldReserveKeyboardSpace ? (isCompact ? 16 : 24) : 16,
            paddingHorizontal: isCompact ? 12 : 18,
            minHeight: keyboardMode ? undefined : interactiveCardMinHeight + (shouldReserveKeyboardSpace ? 20 : 32),
          },
        ]}
      >
        <View
          style={[
            styles.card,
            styles.interactiveCard,
            isDesktopWeb && styles.interactiveCardDesktopWeb,
            isDesktopWeb && { maxWidth: scaleValue(640, webScale) },
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
                padding: scaleValue(10, webScale),
                borderRadius: scaleValue(16, webScale),
              },
              {
                backgroundColor: theme.statsBackground,
                borderColor: theme.statsBorder,
              },
            ]}
          >
            <View style={[styles.levelHeaderRow, keyboardMode && styles.levelHeaderRowTight]}>
              <View style={keyboardMode && styles.levelTitleTight}>
                <Text style={[styles.levelLabel, keyboardMode && styles.levelLabelTight, isDesktopWeb && { fontSize: scaleValue(11, webScale) }, { color: theme.subText }]}>Level</Text>
                <Text style={[styles.levelValue, keyboardMode && styles.levelValueTight, isDesktopWeb && { fontSize: scaleValue(23, webScale), lineHeight: scaleValue(27, webScale) }, { color: theme.text }]}>{level}</Text>
              </View>

              <View style={[styles.levelXpGroup, keyboardMode && styles.levelXpGroupTight]}>
                <Text style={[styles.levelXpValue, keyboardMode && styles.levelXpValueTight, isDesktopWeb && { fontSize: scaleValue(16, webScale) }, { color: theme.success }]}>+{sessionXp} XP</Text>
                {!keyboardMode && (
                  <Text style={[styles.levelXpHint, { color: theme.subText }]}>
                    {xpRemaining} XP to level {level + 1}
                  </Text>
                )}
              </View>
            </View>

            <View style={[styles.levelProgressTrack, keyboardMode && styles.levelProgressTrackTight, { backgroundColor: theme.progressBg }]}>
              <View
                style={[
                  styles.levelProgressFill,
                  {
                    width: `${progressPercent}%`,
                    backgroundColor: theme.primary,
                  },
                ]}
              />
            </View>

            <View style={[styles.typingStatusRow, keyboardMode && styles.typingStatusRowTight]}>
              <View style={[styles.typingStatusPill, keyboardMode && styles.typingStatusPillTight, { backgroundColor: theme.card, borderColor: theme.statsBorder }]}>
                <Text style={[styles.typingStatusLabel, { color: theme.subText }]}>Word</Text>
                <Text style={[styles.typingStatusValue, { color: theme.text }]}>
                  {currentWordNumber} / {totalWords || safeWords.length}
                </Text>
              </View>

              <View style={[styles.typingStatusPill, keyboardMode && styles.typingStatusPillTight, { backgroundColor: theme.card, borderColor: theme.statsBorder }]}>
                <Text style={[styles.typingStatusLabel, { color: theme.subText }]}>Combo</Text>
                <View style={styles.comboValueRow}>
                  <Text style={[styles.typingStatusValue, { color: theme.warning }]}>{streak}</Text>
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
                      backgroundColor: theme.isDark ? 'rgba(255,191,81,0.16)' : '#FFF4D8',
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
              styles.promptPanel,
              isDesktopWeb && styles.promptPanelDesktopWeb,
              isDesktopWeb && {
                maxWidth: scaleValue(600, webScale),
                paddingVertical: scaleValue(20, webScale),
                paddingHorizontal: scaleValue(22, webScale),
              },
              {
                backgroundColor: theme.card,
                borderColor: typedAnswer.trim() ? theme.primary : theme.border,
                marginTop: keyboardMode ? 8 : isDesktopWeb ? scaleValue(20, webScale) : isCompact ? 14 : 20,
                minHeight: keyboardMode ? 78 : isDesktopWeb ? scaleValue(136, webScale) : isCompact ? 104 : 124,
              },
            ]}
          >
            <View style={[styles.promptBadge, { backgroundColor: theme.primary }]}>
              <Text style={[styles.promptBadgeText, { color: theme.buttonText }]}>French</Text>
            </View>
            <Text
              style={[
                styles.promptText,
                {
                  color: theme.text,
                  fontSize: keyboardMode ? 23 : isDesktopWeb ? scaleValue(38, webScale) : isCompact ? 28 : 34,
                  lineHeight: keyboardMode ? 27 : isDesktopWeb ? scaleValue(44, webScale) : isCompact ? 32 : 38,
                },
              ]}
            >
              {currentWord?.french}
            </Text>
          </View>

          <View
            style={[
              styles.answerPanel,
              isDesktopWeb && styles.answerPanelDesktopWeb,
              isDesktopWeb && {
                maxWidth: scaleValue(600, webScale),
                padding: scaleValue(12, webScale),
              },
              {
                backgroundColor: theme.card,
                borderColor: theme.border,
                marginTop: keyboardMode ? 8 : isDesktopWeb ? scaleValue(18, webScale) : isCompact ? 12 : 16,
              },
            ]}
          >
            {shouldShowAnswerSignal && (
              <View
                style={[
                  styles.answerSignalRow,
                  keyboardMode && styles.answerSignalRowTight,
                ]}
              >
                <MaterialIcons name={answerPanelIcon} size={14} color={answerPanelTone} />
                <Text
                  style={[
                    styles.answerSignalText,
                    keyboardMode && styles.answerSignalTextTight,
                    { color: inlineMessage ? answerPanelTone : theme.subText },
                  ]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.86}
                >
                  {answerPanelMessage}
                </Text>
              </View>
            )}

            <TextInput
              ref={inputRef}
              value={typedAnswer}
              onChangeText={setTypedAnswer}
              onSubmitEditing={onSubmit}
              blurOnSubmit={false}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="done"
              placeholder="Type the English translation"
              placeholderTextColor={theme.subText}
              style={[
                styles.input,
                keyboardMode && styles.inputTight,
                {
                  color: theme.text,
                  backgroundColor: theme.inputBackground,
                  borderColor: typedAnswer.trim() ? theme.primary : theme.border,
                  paddingVertical: keyboardMode ? 9 : isDesktopWeb ? scaleValue(15, webScale) : 13,
                  fontSize: keyboardMode ? 16 : isDesktopWeb ? scaleValue(17, webScale) : 17,
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
                isDesktopWeb && {
                  minHeight: scaleValue(44, webScale),
                  paddingVertical: scaleValue(11, webScale),
                  paddingHorizontal: scaleValue(26, webScale),
                },
                {
                  backgroundColor: theme.primary,
                  opacity: isAdvancing || !typedAnswer.trim() ? 0.55 : 1,
                },
              ]}
            >
              <Text style={[styles.buttonText, isDesktopWeb && { fontSize: scaleValue(14, webScale) }, { color: theme.buttonText }]}>Check</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.secondaryControlsRow, keyboardMode && styles.secondaryControlsRowTight, { marginTop: keyboardMode ? 8 : isCompact ? 12 : 14 }]}>
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
    padding: 16,
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
    maxWidth: 520,
    alignSelf: 'center',
    alignItems: 'center',
    marginBottom: 10,
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
    fontSize: 22,
    marginBottom: 12,
  },
  sectionTitle: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
  },
  xpText: {
    fontSize: 28,
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
    fontSize: 18,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 2,
  },
  statText: {
    fontSize: 18,
    fontWeight: '700',
  },
  divider: {
    width: 1,
    alignSelf: 'stretch',
  },
  badge: {
    alignSelf: 'center',
    minWidth: 230,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 16,
    marginBottom: 10,
    alignItems: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 20,
    textAlign: 'center',
  },
  sessionHighlight: {
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    minHeight: 38,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  sessionHighlightText: {
    flexShrink: 1,
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '800',
    textAlign: 'center',
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
    paddingVertical: 12,
    paddingHorizontal: 14,
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
    fontSize: 23,
    lineHeight: 27,
    marginTop: 2,
    marginBottom: 0,
  },
  levelSummaryStats: {
    minWidth: 88,
    borderRadius: 12,
    paddingVertical: 7,
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
    marginTop: 8,
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
    minHeight: 44,
    marginTop: 4,
    paddingVertical: 11,
    borderRadius: 999,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  progressTrack: {
    width: '100%',
    height: 7,
    borderRadius: 999,
    overflow: 'hidden',
    marginTop: 10,
  },
  progressFill: {
    height: '100%',
  },
  feedbackContainer: {
    position: 'absolute',
    top: 176,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 999,
  },
  feedbackContainerCompact: {
    top: 158,
  },
  feedbackContainerTight: {
    top: 132,
  },
  feedbackCard: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 18,
    elevation: 8,
    width: '80%',
    minHeight: 88,
    justifyContent: 'center',
    alignItems: 'center',
  },
  feedbackText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 28,
    lineHeight: 32,
    textAlign: 'center',
    letterSpacing: 0.3,
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
    marginTop: 8,
  },
  typingStatusRowTight: {
    marginTop: 6,
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
  answerSignalRow: {
    minHeight: 20,
    paddingHorizontal: 2,
    marginBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 5,
  },
  answerSignalRowTight: {
    minHeight: 18,
    marginBottom: 5,
    paddingHorizontal: 1,
  },
  answerSignalText: {
    flexShrink: 1,
    fontSize: 12,
    lineHeight: 15,
    fontWeight: '700',
    textAlign: 'left',
  },
  answerSignalTextTight: {
    fontSize: 11,
    lineHeight: 14,
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
