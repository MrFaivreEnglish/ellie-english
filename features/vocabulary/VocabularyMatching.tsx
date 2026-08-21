import React from 'react';
import { View, Text, Pressable, StyleSheet, useWindowDimensions, Platform, LayoutAnimation, UIManager, Animated, Easing } from 'react-native';
import { GameCard, MatchingGamePairs, GameState } from '../../types/VocabularyTypes';
import type { Word } from '../../types/VocabularyTypes';
import { clampNumber, getWebLessonScale } from '../shared/responsiveLayout';
import { getMatchingSetCount } from './vocabularyUtils';
import type { ThemeColors } from '../settings/ThemeContext';
import { DESIGN_ACCENTS } from '../shared/uiPrimitives';
import { FRESH_COLORS } from '../shared/freshDirection';
import { useEnglishSpeech } from '../shared/useEnglishSpeech';
import SoundWaveIcon from '../shared/SoundWaveIcon';

const MATCHING_LAYOUT_ANIMATION_MS = 150;
const REFILL_CARD_ENTER_MS = 170;
const REFILL_CARD_EXIT_MS = 130;
const REFILL_CARD_ENTER_OFFSET = 8;

type CardAnimation = {
  opacity: Animated.Value;
  scale: Animated.Value;
  translateY: Animated.Value;
  shakeX: Animated.Value;
};

interface MatchingProps {
  gameState: GameState;
  matchingGamePairs: MatchingGamePairs;
  onCardPress: (card: GameCard) => void;
  colors: ThemeColors;
  isDarkMode: boolean;
  words: Word[];
  timerMode: boolean;
  bestTimeForActiveCategory?: number | null;
  matchingSessionXp?: number;
  lastMatchingXpGain?: number;
  refillOnMatch?: boolean;
  belowTitleContent?: React.ReactNode;
  availableHeight?: number;
  forceAndroidLayout?: boolean;
  audioMode?: boolean;
}

export default function VocabularyMatching({
  gameState,
  matchingGamePairs,
  onCardPress,
  colors,
  isDarkMode,
  words,
  timerMode,
  bestTimeForActiveCategory,
  matchingSessionXp = 0,
  refillOnMatch = false,
  belowTitleContent,
  availableHeight,
  forceAndroidLayout = false,
  audioMode = false,
}: MatchingProps) {
  const { width, height } = useWindowDimensions();
  const { speak: speakEnglishCard } = useEnglishSpeech();
  // Vocabulary lesson modes (Cards/Match/Write) share one accent — the
  // "exercise blue" family, distinct from the app-wide primary blue.
  const accentColor = isDarkMode ? '#3FA0DB' : FRESH_COLORS.exerciseBlue;
  // "Wrong" tile state — oklch(0.95 0.06 25) bg / oklch(0.72 0.15 25) border / oklch(0.5 0.16 25) text
  const wrongBg = isDarkMode ? '#3A1512' : '#ffe0da';
  const wrongBorder = isDarkMode ? '#f47b74' : '#f47b74';
  const wrongText = isDarkMode ? '#FFB4AE' : '#ac3031';
  // "Correct/matched" tile state — oklch(0.94 0.06 150) bg / oklch(0.7 0.13 150) border / oklch(0.35 0.13 150) text
  const correctBg = isDarkMode ? '#0E2E1E' : '#d0f7d6';
  const correctBorder = isDarkMode ? '#5cb572' : '#5cb572';
  const correctText = isDarkMode ? '#8FE3A3' : '#004b0c';
  // "Selected" tile state — oklch(0.94 0.04 235) bg / blueAccent border / oklch(0.35 0.12 235) text
  const selectedBg = isDarkMode ? '#12345A' : '#d2f0ff';
  const selectedText = isDarkMode ? '#9AD4F5' : '#00416f';
  const tileBorderNeutral = isDarkMode ? '#3A3E48' : '#e3decf';
  const nowValueColor = isDarkMode ? '#6FC4EE' : '#007cb7';
  const metricNeutralValueColor = isDarkMode ? '#E4E1D8' : '#3e3a2f';
  const metricLabelColor = isDarkMode ? '#8A8F98' : '#918c7f';
  const [shellWidth, setShellWidth] = React.useState(0);
  const cardAnimationsRef = React.useRef<Map<string, CardAnimation>>(new Map());
  const previousVisibleCardIdsRef = React.useRef<Set<string>>(new Set());
  const previousMatchedPairIdsRef = React.useRef<Set<string>>(new Set());
  const previousIncorrectPairIdsRef = React.useRef<Set<string>>(new Set());
  const layoutWidth = Math.max(shellWidth || width, 320);
  const isAndroid = Platform.OS === 'android' || forceAndroidLayout;
  const isDesktop = Platform.OS === 'web' && !forceAndroidLayout && width >= 640;
  // Narrow mobile web (a real phone browser, not the APK-preview flag and not
  // desktop width) used to fall into its own smaller, percentage-based tile
  // sizing — sized noticeably smaller than the same layout on the APK. It now
  // shares Android's pixel-based tile sizing so the two read as the same size.
  const androidLikeLayout = isAndroid || (Platform.OS === 'web' && !forceAndroidLayout && !isDesktop);
  const layoutHeight = Math.max(availableHeight ?? height, 320);
  const webScale = getWebLessonScale(width, layoutHeight);
  // Matches TypingView's own card-width math, but width-only (not height-
  // dependent like getWebLessonScale) so it can never drift from Typing's
  // value just because the two modes get a different available height —
  // the progress bar / stats row above the board must read as the exact
  // same length in both, with no visible jump when switching modes.
  const widthOnlyWebScale = clampNumber(width / 1180, 1, 1.1);
  const typingCardWebScale = isDesktop ? Math.min(widthOnlyWebScale * 1.06, 1.16) : widthOnlyWebScale;
  const progressRowMaxWidth = isDesktop ? Math.round(730 * typingCardWebScale) : 520;
  const isPortrait = layoutHeight >= layoutWidth;
  const isHorizontalDesktop = isDesktop && !isPortrait;
  const isCompact = !isDesktop && (layoutHeight < 760 || width < 390);
  const isVeryCompact = !isDesktop && width < 360;
  const isLarge = (!isDesktop && layoutHeight > 900 && width >= 400) || (isDesktop && webScale > 1.04);
  const desktopBoardScale = isDesktop
    ? clampNumber(Math.min(layoutWidth / 1040, layoutHeight / 560), 0.94, 1.55)
    : 1;
  const shellHeight = layoutHeight;
  const titleHeight = 0;
  const footerBaseHeight = isVeryCompact ? 60 : isCompact ? 62 : 70;
  const footerHeight = isDesktop ? Math.round(footerBaseHeight * desktopBoardScale) : footerBaseHeight;
  const boardTopSpacing = androidLikeLayout ? 6 : isCompact ? 10 : isDesktop ? Math.round(12 * desktopBoardScale) : 12;
  const fullSetSize = matchingGamePairs?.english?.length || 0;
  // APK specifically gets a touch more row gap (on top of the shared Android-style
  // sizing that mobile web now also uses) so rows breathe a little more.
  const cardGap = androidLikeLayout
    ? (isAndroid ? (isVeryCompact ? 8 : 9) : (isVeryCompact ? 6 : 7))
    : isDesktop ? Math.round(14 * desktopBoardScale) : isCompact ? 8 : isLarge ? 12 : 10;
  const mobileFooterTopGap = Math.round(clampNumber(cardGap * 1.35, isVeryCompact ? 10 : 12, isCompact ? 18 : 24));
  const footerTopGapBase = fullSetSize >= 6
    ? isDesktop
      ? Math.round(cardGap * 1.15)
      : mobileFooterTopGap
    : Math.max(6, Math.round(cardGap * 0.9));
  const footerTopGap = Math.max(0, footerTopGapBase - (isDesktop ? 20 : 10));
  const rowCount = Math.max(1, fullSetSize || 6);
  const sizingRowCount = Math.max(6, rowCount);
  // Set-progress segments (one segment per set in the lesson, filled as each
  // set is completed) + a "Match the pairs" / Now-Best-XP metrics row, both
  // rendered above the board (in place of the old floating bottom pill).
  // Reserve their height in the board budget.
  const totalSets = getMatchingSetCount(words.length);
  const showSetProgress = !refillOnMatch && totalSets > 1;
  const SEGMENT_ROW_HEIGHT = 6;
  const SEGMENT_ROW_MARGIN_BOTTOM = 4;
  const SUMMARY_ROW_MARGIN_BOTTOM = 4;
  const MATCH_METRICS_ROW_HEIGHT = timerMode ? 34 : 26;
  const LINEAR_PROGRESS_HEIGHT = 4;
  const topMetaHeight =
    (showSetProgress ? SEGMENT_ROW_HEIGHT + SEGMENT_ROW_MARGIN_BOTTOM : 0) +
    MATCH_METRICS_ROW_HEIGHT + SUMMARY_ROW_MARGIN_BOTTOM +
    (!showSetProgress ? LINEAR_PROGRESS_HEIGHT + SUMMARY_ROW_MARGIN_BOTTOM : 0);
  const availableBoardHeight = Math.max(
    0,
    shellHeight - titleHeight - boardTopSpacing - footerTopGap - topMetaHeight
  );
  const rawCardHeight = Math.max(
    1,
    Math.floor((availableBoardHeight - cardGap * (sizingRowCount - 1)) / sizingRowCount)
  );
  const desiredDesktopCardHeight = Math.round(
    clampNumber(rawCardHeight * 0.98, 66 * desktopBoardScale, 190 * desktopBoardScale)
  );
  const androidCardWidth = Math.round(clampNumber((layoutWidth - 40) / 2, isVeryCompact ? 128 : 138, isLarge ? 210 : 184));
  const androidAspectMaxHeight = Math.round(androidCardWidth * (isAndroid ? (isCompact ? 0.44 : 0.46) : (isCompact ? 0.48 : 0.5)));
  // Short sets (<6 pairs) have fewer rows, so they can stretch further than the
  // shared 6-row rawCardHeight budget without spilling off-screen — size them
  // against their own row count, capped so a 1-2 word category doesn't look absurd.
  const shortSetRawCardHeight = fullSetSize > 0
    ? Math.floor((availableBoardHeight - cardGap * (fullSetSize - 1)) / fullSetSize)
    : rawCardHeight;
  const shortSetMobileMaxHeight = isVeryCompact ? 120 : isCompact ? 132 : isLarge ? 168 : 150;
  const cardHeight = isDesktop && !isPortrait
    ? Math.min(rawCardHeight, desiredDesktopCardHeight)
    : androidLikeLayout
      ? Math.max(
          isVeryCompact ? 43 : 47,
          Math.min(rawCardHeight, androidAspectMaxHeight)
        )
      : fullSetSize > 0 && fullSetSize < 6
        ? Math.min(shortSetRawCardHeight, shortSetMobileMaxHeight)
        : rawCardHeight;
  const boardHeight = cardHeight * rowCount + cardGap * (rowCount - 1);
  const centeredBoardTopSpacing = androidLikeLayout
    ? (isVeryCompact ? 10 : 12)
    : boardTopSpacing;
  const mobileCardTextSize = Math.round(clampNumber(cardHeight * 0.48, isVeryCompact ? 11 : 12, isCompact ? 16 : 20));
  const cardTextSize = isDesktop ? Math.round(clampNumber(22 * desktopBoardScale, 19, 32)) : mobileCardTextSize;
  const desktopColumnGap = isDesktop
    ? isHorizontalDesktop
      ? Math.round(clampNumber(140 * desktopBoardScale, 120, 170))
      : Math.round(clampNumber(150 * desktopBoardScale, 120, Math.max(120, layoutWidth * 0.22)))
    : Math.round(clampNumber(width * 0.002, 0, 5 * desktopBoardScale));
  const desktopFittingColumnWidth = Math.max(180, Math.floor((layoutWidth - desktopColumnGap) / 2));
  const desktopColumnWidth = isHorizontalDesktop
    ? Math.max(210, Math.min(288, desktopFittingColumnWidth))
    : Math.round(clampNumber(desktopFittingColumnWidth, 210, 340));
  const desktopRowWidth = desktopColumnWidth * 2 + desktopColumnGap;
  const cardWidth = isDesktop
    ? '100%'
    : androidLikeLayout
      ? androidCardWidth
    : isPortrait
      ? (isCompact ? '82%' : '84%')
      : '88%';
  const desktopCardMaxWidth = androidLikeLayout ? androidCardWidth : desktopColumnWidth;
  const handleShellLayout = React.useCallback((event: any) => {
    const nextWidth = Math.round(event.nativeEvent.layout.width);
    if (nextWidth <= 0) return;

    setShellWidth((currentWidth) => (
      Math.abs(currentWidth - nextWidth) > 1 ? nextWidth : currentWidth
    ));
  }, []);

  const getCardAnimation = React.useCallback((cardId: string) => {
    const existingAnimation = cardAnimationsRef.current.get(cardId);
    if (existingAnimation) return existingAnimation;

    const wasVisible = previousVisibleCardIdsRef.current.has(cardId);
    const animation = {
      opacity: new Animated.Value(refillOnMatch && !wasVisible ? 0 : 1),
      scale: new Animated.Value(refillOnMatch && !wasVisible ? 0.94 : 1),
      translateY: new Animated.Value(refillOnMatch && !wasVisible ? REFILL_CARD_ENTER_OFFSET : 0),
      shakeX: new Animated.Value(0),
    };

    cardAnimationsRef.current.set(cardId, animation);
    return animation;
  }, [refillOnMatch]);

  React.useEffect(() => {
    const visibleCardIds = new Set([
      ...(matchingGamePairs.english ?? []).map((card) => card.id),
      ...(matchingGamePairs.french ?? []).map((card) => card.id),
    ]);

    if (!refillOnMatch) {
      previousVisibleCardIdsRef.current = visibleCardIds;
      cardAnimationsRef.current.clear();
      return;
    }

    visibleCardIds.forEach((cardId) => {
      const animation = getCardAnimation(cardId);

      Animated.parallel([
        Animated.timing(animation.opacity, {
          toValue: 1,
          duration: REFILL_CARD_ENTER_MS,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(animation.scale, {
          toValue: 1,
          duration: REFILL_CARD_ENTER_MS,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(animation.translateY, {
          toValue: 0,
          duration: REFILL_CARD_ENTER_MS,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]).start();
    });

    Array.from(cardAnimationsRef.current.keys()).forEach((cardId) => {
      if (!visibleCardIds.has(cardId)) {
        cardAnimationsRef.current.delete(cardId);
      }
    });

    previousVisibleCardIdsRef.current = visibleCardIds;
  }, [getCardAnimation, matchingGamePairs.english, matchingGamePairs.french, refillOnMatch]);

  React.useEffect(() => {
    if (!refillOnMatch || !gameState.matchedPairs.length) return;

    gameState.matchedPairs.forEach((cardId) => {
      const animation = getCardAnimation(cardId);

      Animated.parallel([
        Animated.timing(animation.opacity, {
          toValue: 0,
          duration: REFILL_CARD_EXIT_MS,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(animation.scale, {
          toValue: 0.86,
          duration: REFILL_CARD_EXIT_MS,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(animation.translateY, {
          toValue: -REFILL_CARD_ENTER_OFFSET,
          duration: REFILL_CARD_EXIT_MS,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]).start();
    });
  }, [gameState.matchedPairs, getCardAnimation, refillOnMatch]);

  React.useEffect(() => {
    const incorrectIds = new Set(gameState.incorrectPair ?? []);
    const newlyIncorrectIds = Array.from(incorrectIds).filter(
      (cardId) => !previousIncorrectPairIdsRef.current.has(cardId)
    );

    newlyIncorrectIds.forEach((cardId) => {
      const animation = getCardAnimation(cardId);
      animation.shakeX.setValue(0);
      Animated.sequence([
        Animated.timing(animation.shakeX, { toValue: -8, duration: 45, useNativeDriver: Platform.OS !== 'web' }),
        Animated.timing(animation.shakeX, { toValue: 8, duration: 90, useNativeDriver: Platform.OS !== 'web' }),
        Animated.timing(animation.shakeX, { toValue: -6, duration: 80, useNativeDriver: Platform.OS !== 'web' }),
        Animated.timing(animation.shakeX, { toValue: 6, duration: 70, useNativeDriver: Platform.OS !== 'web' }),
        Animated.timing(animation.shakeX, { toValue: 0, duration: 60, useNativeDriver: Platform.OS !== 'web' }),
      ]).start();
    });

    previousIncorrectPairIdsRef.current = incorrectIds;
  }, [gameState.incorrectPair, getCardAnimation]);

  React.useEffect(() => {
    if (refillOnMatch) {
      // Refill mode already reads as a "success" beat via the fade+shrink exit above.
      previousMatchedPairIdsRef.current = new Set(gameState.matchedPairs);
      return;
    }

    const newlyMatchedIds = gameState.matchedPairs.filter(
      (cardId) => !previousMatchedPairIdsRef.current.has(cardId)
    );

    newlyMatchedIds.forEach((cardId) => {
      const animation = getCardAnimation(cardId);
      Animated.sequence([
        Animated.timing(animation.scale, {
          toValue: 1.08,
          duration: 110,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(animation.scale, {
          toValue: 1,
          duration: 140,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]).start();
    });

    previousMatchedPairIdsRef.current = new Set(gameState.matchedPairs);
  }, [gameState.matchedPairs, getCardAnimation, refillOnMatch]);

  React.useEffect(() => {
    if (Platform.OS === 'android') {
      UIManager.setLayoutAnimationEnabledExperimental?.(true);
    }

    if (refillOnMatch) {
      LayoutAnimation.configureNext({
        duration: MATCHING_LAYOUT_ANIMATION_MS,
        create: {
          type: LayoutAnimation.Types.easeInEaseOut,
          property: LayoutAnimation.Properties.opacity,
        },
        update: {
          type: LayoutAnimation.Types.easeInEaseOut,
        },
        delete: {
          type: LayoutAnimation.Types.easeInEaseOut,
          property: LayoutAnimation.Properties.opacity,
        },
      });
      return;
    }

    LayoutAnimation.configureNext(
      LayoutAnimation.create(
        MATCHING_LAYOUT_ANIMATION_MS,
        LayoutAnimation.Types.easeInEaseOut,
        LayoutAnimation.Properties.scaleXY
      )
    );
  }, [cardHeight, centeredBoardTopSpacing, footerHeight, footerTopGap, isCompact, matchingGamePairs.english, matchingGamePairs.french, refillOnMatch]);

  const formatTime = (totalMs: number) => {
    const safeMs = Math.max(0, Math.floor(totalMs));
    const minutes = Math.floor(safeMs / 60000);
    const seconds = Math.floor((safeMs % 60000) / 1000);
    const ss = seconds < 10 ? `0${seconds}` : `${seconds}`;

    return `${minutes}:${ss}`;
  };

  // Render one card (used for both English/French columns)
  const renderCard = (card: GameCard, index: number, list: GameCard[]) => {
    const isMatched = gameState.matchedPairs.includes(card.id);
    const isSelected = gameState.selectedCard?.id === card.id;
    const isIncorrect = !!gameState.incorrectPair?.includes(card.id);
    const isLocked = !!gameState.isInputLocked;
    const isSelectedState = isSelected && !isMatched;
    const cardAnimation = getCardAnimation(card.id);
    const isAudioCard = audioMode && card.type === 'english';

    return (
      <Animated.View
        key={card.id}
        style={[
          {
            opacity: cardAnimation.opacity,
            transform: [
              { translateY: cardAnimation.translateY },
              { scale: cardAnimation.scale },
              { translateX: cardAnimation.shakeX },
            ],
          },
          {
            marginBottom: index === list.length - 1 ? 0 : cardGap,
            maxWidth: isDesktop ? desktopCardMaxWidth : 360,
            width: cardWidth,
          },
        ]}
      >
      <Pressable
        onPress={() => {
          if (isAudioCard) speakEnglishCard(card.text);
          onCardPress(card);
        }}
        disabled={isMatched || isLocked}
        android_ripple={{ color: 'rgba(0,0,0,0.06)' }}
        accessibilityRole="button"
        accessibilityLabel={isAudioCard
          ? (isMatched ? 'Matched audio card' : 'Play audio for this card')
          : (isMatched ? `Matched: ${card.text}` : `Card: ${card.text}`)}
        accessibilityState={{ disabled: isMatched || isLocked, selected: isSelected }}
        style={({ pressed }) => [
          styles.matchingCard,
          isDesktop && styles.matchingCardDesktop,
          pressed && !isMatched && !isLocked && styles.pressedMatchingCard,
          isLocked && !isMatched && { opacity: 0.6 },
          {
            backgroundColor: isIncorrect
              ? wrongBg
              : isMatched
                ? correctBg
                : isSelectedState
                  ? selectedBg
                : colors.card,
            borderColor: isIncorrect
              ? wrongBorder
              : isMatched
                ? correctBorder
                : (isSelectedState ? accentColor : tileBorderNeutral),
            borderWidth: isMatched ? 1.5 : isIncorrect ? 1.5 : (isSelectedState ? 2 : (isDesktop ? 2 : 1.5)),
            opacity: isMatched ? 0.4 : 1,
            height: cardHeight,
            maxWidth: '100%',
            boxShadow: isSelectedState
              ? '0px 2px 6px rgba(0,0,0,0.10)'
              : '0px 1px 2px rgba(0,0,0,0.03)',
            elevation: isSelectedState ? 3 : 1,
            width: '100%',
          },
        ]}
      >
        {isAudioCard ? (
          <SoundWaveIcon
            size={20}
            color={isIncorrect ? wrongText : isMatched ? correctText : isSelectedState ? selectedText : accentColor}
          />
        ) : (
          <Text
            style={[
              styles.matchingCardText,
              {
                color: isIncorrect ? wrongText : isMatched ? correctText : isSelectedState ? selectedText : colors.text,
                fontSize: cardTextSize,
                lineHeight: isDesktop ? Math.round(cardTextSize * 1.22) : isCompact ? 20 : isLarge ? 24 : 22,
              },
            ]}
            numberOfLines={2}
            adjustsFontSizeToFit
            minimumFontScale={androidLikeLayout ? 0.74 : 0.82}
          >
            {card.text}
          </Text>
        )}
      </Pressable>
      </Animated.View>
    );
  };

  const totalCards = (matchingGamePairs?.english?.length || 0) * 2;
  const progress = refillOnMatch
    ? (Math.min(gameState.totalScore, words.length) / Math.max(words.length, 1)) * 100
    : totalCards > 0
      ? (gameState.matchedPairs.length / totalCards) * 100
      : 0;

  return (
    <View
      onLayout={handleShellLayout}
      style={[styles.matchingShell, { height: shellHeight, minHeight: shellHeight }]}
    >
      {belowTitleContent}

      {showSetProgress && (
        <View
          style={[
            styles.matchSetProgressRow,
            { height: SEGMENT_ROW_HEIGHT, marginBottom: SEGMENT_ROW_MARGIN_BOTTOM, width: '100%', maxWidth: progressRowMaxWidth, alignSelf: 'center' },
          ]}
        >
          {Array.from({ length: totalSets }).map((_, index) => {
            const isCompleteSet = index < gameState.currentSet;
            const isCurrentSet = index === gameState.currentSet;
            return (
              <View
                key={index}
                style={[
                  styles.matchSetSegment,
                  {
                    backgroundColor: isCompleteSet
                      ? '#4aa3d2'
                      : isCurrentSet
                        ? '#9fcbdf'
                        : (isDarkMode ? '#2A2E38' : tileBorderNeutral),
                  },
                ]}
              />
            );
          })}
        </View>
      )}

      {!showSetProgress && (
        <View
          style={[
            styles.progressContainer,
            isCompact && styles.progressContainerCompact,
            { marginTop: 0, marginBottom: SUMMARY_ROW_MARGIN_BOTTOM, width: '100%', maxWidth: progressRowMaxWidth, alignSelf: 'center' },
          ]}
        >
          <View style={[styles.progressBar, isCompact && styles.progressBarCompact, { backgroundColor: colors.border }]}>
            <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: accentColor }]} />
          </View>
        </View>
      )}

      <View style={[styles.matchMetricsRow, { marginBottom: SUMMARY_ROW_MARGIN_BOTTOM, width: '100%', maxWidth: progressRowMaxWidth, alignSelf: 'center' }]}>
        <Text style={[styles.matchTaskLabel, { color: nowValueColor }]} numberOfLines={1}>
          Match the pairs
        </Text>

        <View style={styles.matchMetricsGroup}>
          {timerMode && (
            <>
              <View style={styles.matchMetricCol}>
                <Text style={[styles.matchMetricLabel, { color: metricLabelColor }]}>Now</Text>
                <Text style={[styles.matchMetricValue, { color: nowValueColor }]}>{formatTime(gameState.timer)}</Text>
              </View>
              <View style={[styles.matchMetricDivider, { backgroundColor: tileBorderNeutral }]} />
              <View style={styles.matchMetricCol}>
                <Text style={[styles.matchMetricLabel, { color: metricLabelColor }]}>Best</Text>
                <Text style={[styles.matchMetricValue, { color: metricNeutralValueColor }]}>
                  {bestTimeForActiveCategory != null ? formatTime(bestTimeForActiveCategory) : '--'}
                </Text>
              </View>
              <View style={[styles.matchMetricDivider, { backgroundColor: tileBorderNeutral }]} />
            </>
          )}
          <View style={styles.matchMetricCol}>
            <Text style={[styles.matchMetricLabel, { color: metricLabelColor }]}>XP</Text>
            <Text style={[styles.matchMetricValue, { color: metricNeutralValueColor }]}>{matchingSessionXp}</Text>
          </View>
        </View>
      </View>

      <View
        style={[
          styles.matchingContainer,
          isDesktop && styles.matchingContainerDesktop,
          isDesktop && !isHorizontalDesktop && { width: desktopRowWidth },
          androidLikeLayout && styles.matchingContainerAndroid,
          { height: boardHeight, marginTop: centeredBoardTopSpacing, marginBottom: footerTopGap },
        ]}
      >
        <View style={[
          styles.matchingColumn,
          isDesktop && styles.matchingColumnDesktop,
          isDesktop && { width: desktopColumnWidth },
        ]}>
          {matchingGamePairs.english?.map(renderCard)}
        </View>
        <View style={{ width: isDesktop ? desktopColumnGap : Math.round(clampNumber(layoutWidth * 0.09, 22, 44)), flexShrink: 0 }} />
        <View style={[
          styles.matchingColumn,
          isDesktop && styles.matchingColumnDesktop,
          isDesktop && { width: desktopColumnWidth },
        ]}>
          {matchingGamePairs.french?.map(renderCard)}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  matchingShell: {
    width: '100%',
    position: 'relative',
    justifyContent: 'flex-start',
  },
  matchingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  matchingContainerAndroid: {
    paddingHorizontal: 0,
  },
  matchingContainerDesktop: {
    alignSelf: 'stretch',
    justifyContent: 'center',
    paddingHorizontal: 0,
  },
  matchingColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  matchingColumnDesktop: {
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: 'auto',
    width: 272,
    alignItems: 'center',
    marginHorizontal: 0,
  },
  matchingCard: {
    width: '92%',
    maxWidth: 360,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: '0px 1px 2px rgba(0,0,0,0.03)',
    elevation: 1,
    borderWidth: 1.5,
    borderColor: '#E7E3D8',
    paddingHorizontal: 10,
  },
  matchingCardDesktop: {
    width: 300,
  },
  pressedMatchingCard: {
    opacity: 0.9,
  },
  matchingCardText: {
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  matchSetProgressRow: {
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 8,
  },
  matchSetSegment: {
    flex: 1,
    height: '100%',
    borderRadius: 100,
  },
  matchMetricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
    paddingHorizontal: 8,
  },
  matchTaskLabel: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    flexShrink: 1,
  },
  matchMetricsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  matchMetricCol: {
    alignItems: 'flex-end',
  },
  matchMetricLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  matchMetricValue: {
    fontSize: 19,
    fontWeight: '800',
    lineHeight: 22,
    marginTop: 1,
    fontVariant: ['tabular-nums'],
  },
  matchMetricDivider: {
    width: 1,
    height: 26,
  },
  progressContainer: {
    paddingHorizontal: 2,
    marginHorizontal: 14,
    marginTop: 0,
    paddingBottom: 0,
  },
  progressContainerCompact: {
    marginHorizontal: 10,
    marginTop: 0,
    paddingBottom: 0,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarCompact: {
    height: 4,
    borderRadius: 999,
  },
  progressFill: {
    height: '100%',
    backgroundColor: DESIGN_ACCENTS.blue.solid,
    borderRadius: 999,
  },
});
