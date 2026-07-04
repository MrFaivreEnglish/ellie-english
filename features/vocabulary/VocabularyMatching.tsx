import React from 'react';
import { View, Text, Pressable, StyleSheet, useWindowDimensions, Platform, LayoutAnimation, UIManager } from 'react-native';
import { GameCard, MatchingGamePairs, GameState } from '../../types/VocabularyTypes';
import type { Word } from '../../types/VocabularyTypes';
import { getMatchingSetCount } from './vocabularyUtils';
import { clampNumber, getWebLessonScale } from '../shared/responsiveLayout';
import type { ThemeColors } from '../settings/ThemeContext';

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
  belowTitleContent?: React.ReactNode;
  availableHeight?: number;
  forceAndroidLayout?: boolean;
}

export default function VocabularyMatching({
  gameState,
  matchingGamePairs,
  onCardPress,
  colors,
  words,
  timerMode,
  bestTimeForActiveCategory,
  matchingSessionXp = 0,
  lastMatchingXpGain = 0,
  belowTitleContent,
  availableHeight,
  forceAndroidLayout = false,
}: MatchingProps) {
  const { width, height } = useWindowDimensions();
  const [shellWidth, setShellWidth] = React.useState(0);
  const layoutWidth = Math.max(shellWidth || width, 320);
  const isAndroid = Platform.OS === 'android' || forceAndroidLayout;
  const isDesktop = Platform.OS === 'web' && !forceAndroidLayout && width >= 640;
  const layoutHeight = Math.max(availableHeight ?? height, 320);
  const webScale = getWebLessonScale(width, layoutHeight);
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
  const boardTopSpacing = isAndroid ? 0 : isCompact ? 4 : isDesktop ? Math.round(6 * desktopBoardScale) : 6;
  const fullSetSize = matchingGamePairs?.english?.length || 0;
  const cardGap = isAndroid ? (isVeryCompact ? 6 : 7) : isDesktop ? Math.round(14 * desktopBoardScale) : isCompact ? 8 : isLarge ? 12 : 10;
  const footerBottomGapBase = isDesktop ? Math.round(8 * desktopBoardScale) : 7;
  const footerBottomGap = isDesktop ? footerBottomGapBase - 10 : footerBottomGapBase;
  const footerVisualDrop = 30;
  const mobileFooterTopGap = Math.round(clampNumber(cardGap * 1.35, isVeryCompact ? 14 : 16, isCompact ? 24 : 30));
  const footerTopGapBase = fullSetSize >= 6
    ? isDesktop
      ? Math.round(cardGap * 1.15)
      : mobileFooterTopGap
    : Math.max(6, Math.round(cardGap * 0.9));
  const footerTopGap = Math.max(0, footerTopGapBase - (isDesktop ? 20 : 10));
  const rowCount = Math.max(1, fullSetSize || 6);
  const sizingRowCount = Math.max(6, rowCount);
  const availableBoardHeight = Math.max(
    0,
    shellHeight - titleHeight - footerHeight - footerBottomGap - boardTopSpacing - footerTopGap
  );
  const rawCardHeight = Math.max(
    1,
    Math.floor((availableBoardHeight - cardGap * (sizingRowCount - 1)) / sizingRowCount)
  );
  const desiredDesktopCardHeight = Math.round(
    clampNumber(rawCardHeight * 0.98, 66 * desktopBoardScale, 150 * desktopBoardScale)
  );
  const androidCardWidth = Math.round(clampNumber((layoutWidth - 40) / 2, isVeryCompact ? 128 : 138, isLarge ? 210 : 184));
  const androidAspectMaxHeight = Math.round(androidCardWidth * (isCompact ? 0.42 : 0.44));
  const shortSetMobileMaxHeight = isVeryCompact ? 64 : isCompact ? 70 : isLarge ? 92 : 82;
  const cardHeight = isDesktop && !isPortrait
    ? Math.min(rawCardHeight, desiredDesktopCardHeight)
    : isAndroid
      ? Math.max(
          isVeryCompact ? 43 : 47,
          Math.min(rawCardHeight, androidAspectMaxHeight)
        )
      : fullSetSize > 0 && fullSetSize < 6
        ? Math.min(rawCardHeight, shortSetMobileMaxHeight)
        : rawCardHeight;
  const boardHeight = cardHeight * rowCount + cardGap * (rowCount - 1);
  const centeredBoardTopSpacing = isAndroid
    ? (isVeryCompact ? 5 : 6)
    : boardTopSpacing;
  const mobileCardTextSize = Math.round(clampNumber(cardHeight * 0.48, isVeryCompact ? 11 : 12, isCompact ? 16 : 20));
  const cardTextSize = isDesktop ? Math.round(clampNumber(22 * desktopBoardScale, 19, 32)) : mobileCardTextSize;
  const desktopColumnGap = isDesktop
    ? isHorizontalDesktop
      ? Math.round(clampNumber(96 * desktopBoardScale, 86, 114))
      : Math.round(clampNumber(104 * desktopBoardScale, 84, Math.max(84, layoutWidth * 0.18)))
    : Math.round(clampNumber(width * 0.002, 0, 5 * desktopBoardScale));
  const desktopFittingColumnWidth = Math.max(180, Math.floor((layoutWidth - desktopColumnGap) / 2));
  const desktopColumnWidth = isHorizontalDesktop
    ? Math.max(210, Math.min(288, desktopFittingColumnWidth))
    : Math.round(clampNumber(desktopFittingColumnWidth, 210, 340));
  const desktopRowWidth = desktopColumnWidth * 2 + desktopColumnGap;
  const cardWidth = isDesktop
    ? '100%'
    : isAndroid
      ? androidCardWidth
    : isPortrait
      ? (isCompact ? '82%' : '84%')
      : '88%';
  const desktopCardMaxWidth = isAndroid ? androidCardWidth : desktopColumnWidth;
  const summaryPaddingVertical = isCompact ? 4 : isDesktop ? Math.round(6 * desktopBoardScale) : isLarge ? Math.round(6 * webScale) : 5;
  const summaryPaddingHorizontal = isVeryCompact ? 8 : isCompact ? 10 : isDesktop ? Math.round(14 * desktopBoardScale) : isLarge ? Math.round(14 * webScale) : 12;
  const handleShellLayout = React.useCallback((event: any) => {
    const nextWidth = Math.round(event.nativeEvent.layout.width);
    if (nextWidth <= 0) return;

    setShellWidth((currentWidth) => (
      Math.abs(currentWidth - nextWidth) > 1 ? nextWidth : currentWidth
    ));
  }, []);

  React.useEffect(() => {
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
  }, [cardHeight, centeredBoardTopSpacing, footerHeight, footerTopGap, isCompact]);

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

    return (
      <Pressable
        key={card.id}
        onPress={() => onCardPress(card)}
        disabled={isMatched || isLocked}
        android_ripple={{ color: 'rgba(0,0,0,0.06)' }}
        accessibilityRole="button"
        accessibilityLabel={isMatched ? `Matched: ${card.text}` : `Card: ${card.text}`}
        accessibilityState={{ disabled: isMatched || isLocked, selected: isSelected }}
        style={({ pressed }) => [
          styles.matchingCard,
          isDesktop && styles.matchingCardDesktop,
          isSelected && styles.selectedMatchingCard,
          isMatched && styles.matchedCard,
          isIncorrect && styles.incorrectCard,
          pressed && !isMatched && !isLocked && styles.pressedMatchingCard,
          isLocked && { opacity: 0.6 },
          {
            backgroundColor: isIncorrect
              ? colors.dangerSoft
              : isMatched
                ? colors.successSoft
                : isSelectedState
                  ? colors.primarySoft
                : colors.card,
            borderColor: isIncorrect
              ? colors.danger
              : isMatched
                ? colors.success
                : (isSelectedState ? colors.primary : colors.border),
            borderWidth: isSelectedState || isMatched || isIncorrect ? 3 : (isDesktop ? 2 : 1),
            height: cardHeight,
            marginBottom: index === list.length - 1 ? 0 : cardGap,
            maxWidth: isDesktop ? desktopCardMaxWidth : 360,
            shadowColor: isIncorrect
              ? colors.danger
              : isMatched
                ? colors.success
                : isSelectedState
                  ? colors.primary
                  : '#000',
            width: cardWidth,
          },
        ]}
      >
        <Text
          style={[
            styles.matchingCardText,
            isMatched && styles.matchedCardText,
            isIncorrect && styles.incorrectCardText,
            {
              color: isIncorrect
                ? colors.dangerText
                : isMatched
                  ? colors.successText
                  : colors.text,
              fontSize: cardTextSize,
              lineHeight: isDesktop ? Math.round(cardTextSize * 1.22) : isCompact ? 20 : isLarge ? 24 : 22,
            },
          ]}
          numberOfLines={2}
          adjustsFontSizeToFit
          minimumFontScale={isAndroid ? 0.74 : 0.82}
        >
          {card.text}
        </Text>
      </Pressable>
    );
  };

  const totalCards = (matchingGamePairs?.english?.length || 0) * 2;
  const progress = totalCards > 0
    ? (gameState.matchedPairs.length / totalCards) * 100
    : 0;
  const totalSets = getMatchingSetCount(words.length);
  const hasMultipleSets = totalSets > 1;
  const completedWordCount = Math.min(gameState.totalScore, words.length);

  return (
    <View
      onLayout={handleShellLayout}
      style={[styles.matchingShell, { height: shellHeight, minHeight: shellHeight }]}
    >
      {belowTitleContent}

      <View
        style={[
          styles.matchingContainer,
          isDesktop && styles.matchingContainerDesktop,
          isDesktop && !isHorizontalDesktop && { width: desktopRowWidth },
          isAndroid && styles.matchingContainerAndroid,
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
        {isDesktop && <View style={{ width: desktopColumnGap, flexShrink: 0 }} />}
        <View style={[
          styles.matchingColumn,
          isDesktop && styles.matchingColumnDesktop,
          isDesktop && { width: desktopColumnWidth },
        ]}>
          {matchingGamePairs.french?.map(renderCard)}
        </View>
      </View>

      <View
        style={[
          styles.summaryCard,
          isCompact && styles.summaryCardCompact,
          {
            backgroundColor: colors.card,
          },
          {
            height: footerHeight,
            bottom: footerBottomGap - footerVisualDrop,
            paddingVertical: summaryPaddingVertical,
            paddingHorizontal: summaryPaddingHorizontal,
          },
        ]}
      >
        <View style={[styles.summaryRow, isVeryCompact && styles.summaryRowVeryCompact]}>
          {timerMode && (
            <View style={[styles.summaryItem, styles.timerSummaryItem, isVeryCompact && styles.timerSummaryItemVeryCompact, { backgroundColor: colors.primarySoft }]}>
              <View style={[styles.timerValuesRow, isVeryCompact && styles.timerValuesRowVeryCompact]}>
                <Text style={[styles.summaryLabel, { color: colors.primary, fontSize: isDesktop ? Math.round(12 * desktopBoardScale) : 12 }]}>Time</Text>
                <Text style={[styles.summaryValue, styles.timerValue, isCompact && styles.summaryValueCompact, { color: colors.primary, fontSize: cardTextSize }]}>
                  {formatTime(gameState.timer)}
                </Text>
                {bestTimeForActiveCategory != null && (
                  <>
                    <View style={[styles.timerDivider, { backgroundColor: colors.border }]} />
                    <View style={styles.bestValueGroup}>
                      <Text style={[styles.bestLabel, { color: colors.secondaryText, fontSize: isDesktop ? Math.round(11 * desktopBoardScale) : 11 }]}>Best</Text>
                      <Text style={[styles.bestValue, { color: colors.successText, fontSize: isDesktop ? Math.round(14 * desktopBoardScale) : 14 }]}>
                        {formatTime(bestTimeForActiveCategory)}
                      </Text>
                    </View>
                  </>
                )}
              </View>
            </View>
          )}

          <View style={[styles.summaryItem, styles.statusSummaryItem, isVeryCompact && styles.summaryItemVeryCompact, { backgroundColor: colors.surface }]}>
            <View style={[styles.statusMetric, styles.wordsStatusMetric]}>
              <Text style={[styles.summaryLabel, { color: colors.secondaryText, fontSize: isDesktop ? Math.round(13 * desktopBoardScale) : isCompact ? 12 : 13 }]}>
                Words
              </Text>
              <Text
                style={[
                  styles.summaryValue,
                  isCompact && styles.summaryValueCompact,
                  {
                    color: completedWordCount >= words.length && words.length > 0 ? colors.successText : colors.text,
                    fontSize: isCompact ? 15 : cardTextSize,
                  },
                ]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.84}
              >
                {completedWordCount}/{words.length}
              </Text>
            </View>
            {hasMultipleSets && (
              <>
                <View style={[styles.statusDivider, { backgroundColor: colors.border }]} />
                <View style={styles.statusMetric}>
                  <Text style={[styles.summaryLabel, { color: colors.secondaryText, fontSize: isDesktop ? Math.round(13 * desktopBoardScale) : isCompact ? 12 : 13 }]}>
                    Set
                  </Text>
                  <Text
                    style={[
                      styles.summaryValue,
                      isCompact && styles.summaryValueCompact,
                      {
                        color: colors.text,
                        fontSize: isCompact ? 15 : cardTextSize,
                      },
                    ]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.84}
                  >
                    {gameState.currentSet + 1}/{totalSets}
                  </Text>
                </View>
              </>
            )}
            <View style={[styles.statusDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statusMetric}>
              <Text style={[styles.summaryLabel, { color: colors.secondaryText, fontSize: isDesktop ? Math.round(13 * desktopBoardScale) : isCompact ? 12 : 13 }]}>
                XP
              </Text>
              <Text
                style={[
                  styles.summaryValue,
                  isCompact && styles.summaryValueCompact,
                  {
                    color: lastMatchingXpGain > 0 || matchingSessionXp > 0 ? colors.successText : colors.secondaryText,
                    fontSize: isCompact ? 15 : cardTextSize,
                  },
                ]}
              >
                +{matchingSessionXp}
              </Text>
            </View>
          </View>
        </View>

        <View style={[styles.progressContainer, isCompact && styles.progressContainerCompact]}>
          <View style={[styles.progressBar, isCompact && styles.progressBarCompact, { backgroundColor: colors.border }]}>
            <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: colors.primary }]} />
          </View>
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
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.11,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E1E1E1',
    paddingHorizontal: 10,
  },
  matchingCardDesktop: {
    width: 300,
  },
  pressedMatchingCard: {
    opacity: 0.9,
  },
  selectedMatchingCard: {
    borderColor: '#7CB7FF',
    backgroundColor: '#FFFFFF',
  },
  matchedCard: {
    borderColor: '#58B965',
    backgroundColor: '#EAF7ED',
    opacity: 1,
  },
  incorrectCard: {
    borderColor: '#F44336',
    backgroundColor: '#FDECEA',
  },
  incorrectCardText: {
    color: '#B71C1C',
    fontWeight: '600',
  },
  matchingCardText: {
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  matchedCardText: {
    color: '#2F7D3F',
    fontWeight: '500',
  },
  progressContainer: {
    paddingHorizontal: 2,
    marginTop: 2,
    paddingBottom: 3,
  },
  progressContainerCompact: {
    marginTop: 2,
    paddingBottom: 3,
  },
  progressBar: {
    height: 5,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarCompact: {
    height: 6,
    borderRadius: 999,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#1671B6',
    borderRadius: 999,
  },
  summaryCard: {
    position: 'absolute',
    left: 8,
    right: 8,
    marginHorizontal: 0,
    marginTop: 0,
    marginBottom: 0,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 0,
    justifyContent: 'space-between',
  },
  summaryCardCompact: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  summaryRowVeryCompact: {
    gap: 4,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 34,
    borderRadius: 10,
    borderWidth: 0,
    paddingVertical: 3,
    paddingHorizontal: 6,
  },
  summaryItemVeryCompact: {
    minHeight: 30,
    paddingHorizontal: 4,
  },
  inlineSummaryItem: {
    flexDirection: 'row',
    gap: 6,
  },
  statusSummaryItem: {
    flex: 1.1,
    flexDirection: 'row',
    gap: 8,
  },
  statusMetric: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordsStatusMetric: {
    flex: 1.3,
  },
  statusDivider: {
    width: 1,
    height: 26,
    opacity: 0.9,
  },
  timerSummaryItem: {
    flex: 1.35,
  },
  timerSummaryItemVeryCompact: {
    flex: 1.55,
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  summaryValue: {
    fontSize: 17,
    fontWeight: '700',
  },
  summaryValueCompact: {
    fontSize: 14,
  },
  timerValuesRow: {
    minHeight: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerValuesRowVeryCompact: {
    minHeight: 22,
  },
  timerValue: {
    width: 56,
    textAlign: 'right',
  },
  timerDivider: {
    width: 1,
    height: 18,
    marginHorizontal: 6,
    opacity: 0.9,
  },
  bestValueGroup: {
    width: 74,
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: 4,
  },
  bestLabel: {
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 14,
  },
  bestValue: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 16,
  },
});
