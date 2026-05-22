import React from 'react';
import { View, Text, Pressable, StyleSheet, useWindowDimensions, Platform, LayoutAnimation, UIManager } from 'react-native';
import { GameCard, MatchingGamePairs, GameState } from '../../types/VocabularyTypes';
import { getMatchingSetCount } from './vocabularyUtils';
import { clampNumber, getWebLessonScale } from '../shared/responsiveLayout';

interface MatchingProps {
  gameState: GameState;
  matchingGamePairs: MatchingGamePairs;
  onCardPress: (card: GameCard) => void;
  colors: any;
  isDarkMode: boolean;
  words: any[];
  timerMode: boolean;
  bestTimeForActiveCategory?: number | null;
  matchingSessionXp?: number;
  lastMatchingXpGain?: number;
  belowTitleContent?: React.ReactNode;
  availableHeight?: number;
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
  lastMatchingXpGain = 0,
  belowTitleContent,
  availableHeight,
}: MatchingProps) {
  const { width, height } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width >= 640;
  const layoutHeight = Math.max(availableHeight ?? height, 320);
  const webScale = getWebLessonScale(width, layoutHeight);
  const isPortrait = layoutHeight >= width;
  const isCompact = !isDesktop && (layoutHeight < 760 || width < 390);
  const isVeryCompact = !isDesktop && width < 360;
  const isLarge = (!isDesktop && layoutHeight > 900 && width >= 400) || (isDesktop && webScale > 1.04);
  const shellHeight = layoutHeight;
  const titleHeight = 0;
  const footerBaseHeight = timerMode && bestTimeForActiveCategory != null
    ? (isVeryCompact ? 92 : isCompact ? 82 : 90)
    : timerMode
      ? (isVeryCompact ? 78 : isCompact ? 72 : 80)
      : (isVeryCompact ? 70 : 68);
  const footerHeight = isDesktop ? Math.round(footerBaseHeight * webScale) : footerBaseHeight;
  const boardTopSpacing = isCompact ? 4 : isDesktop ? Math.round(6 * webScale) : 6;
  const boardBottomSpacing = isCompact ? 6 : isDesktop ? Math.round(8 * webScale) : 8;
  const boardHeight = Math.max(264, shellHeight - titleHeight - footerHeight - boardTopSpacing - boardBottomSpacing);
  const cardGap = isDesktop ? Math.round(14 * webScale) : isCompact ? 6 : isLarge ? 10 : 8;
  const baseCardHeight = Math.max(36, Math.floor((boardHeight - cardGap * 5) / 6));
  const cardHeight = isDesktop && !isPortrait
    ? Math.min(Math.round(92 * webScale), Math.max(58, Math.floor(baseCardHeight * 0.84)))
    : Math.max(34, Math.floor(baseCardHeight * 0.95));
  const cardTextSize = isDesktop ? Math.round(18 * webScale) : isCompact ? 16 : isLarge ? 20 : 18;
  const desktopColumnWidth = Math.round(clampNumber(width * 0.16, 272, 380));
  const cardWidth = isDesktop ? Math.round(desktopColumnWidth * 0.94) : isPortrait ? (isCompact ? '86%' : '88%') : '90%';
  const desktopColumnGap = Math.round(clampNumber(width * 0.022, 32, 54));
  const summaryPaddingVertical = isCompact ? 5 : isLarge ? Math.round(7 * webScale) : 6;
  const summaryPaddingHorizontal = isVeryCompact ? 8 : isCompact ? 10 : isLarge ? Math.round(14 * webScale) : 12;
  const selectedBorderColor = colors.primary === '#1671B6' || colors.primary === '#45B7D1'
    ? '#45B7D1'
    : colors.primary;
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
  }, [cardHeight, footerHeight, isCompact]);

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
        accessibilityLabel={`Card: ${card.text}`}
        style={[
          styles.matchingCard,
          isDesktop && styles.matchingCardDesktop,
          isSelected && styles.selectedMatchingCard,
          isMatched && styles.matchedCard,
          isIncorrect && styles.incorrectCard,
          isLocked && { opacity: 0.6 },
          {
            backgroundColor: isIncorrect
              ? colors.dangerSoft
              : isMatched
                ? (isDarkMode ? '#173F27' : '#EAF7ED')
                : (isDarkMode ? '#112c48' : '#FFFFFF'),
            borderColor: isIncorrect
              ? colors.danger
              : isMatched
                ? '#58B965'
                : (isSelectedState ? selectedBorderColor : (isDarkMode ? colors.border : '#E1E1E1')),
            borderWidth: isSelectedState || isMatched || isIncorrect ? 3 : 1,
            height: cardHeight,
            marginBottom: index === list.length - 1 ? 0 : cardGap,
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
                  ? (isDarkMode ? '#9BE4A7' : '#2F7D3F')
                  : (isDarkMode ? colors.text : '#2D2F33'),
              fontSize: cardTextSize,
              lineHeight: isDesktop ? Math.round(cardTextSize * 1.14) : isCompact ? 18 : isLarge ? 22 : 20,
            },
          ]}
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

  return (
    <View style={[styles.matchingShell, { height: shellHeight, minHeight: shellHeight }]}>
      {belowTitleContent}

      <View
        style={[
          styles.matchingContainer,
          isDesktop && styles.matchingContainerDesktop,
          { height: boardHeight, marginTop: boardTopSpacing, marginBottom: boardBottomSpacing },
        ]}
      >
        <View style={[
          styles.matchingColumn,
          isDesktop && styles.matchingColumnDesktop,
          isDesktop && { width: desktopColumnWidth, marginHorizontal: desktopColumnGap },
        ]}>
          {matchingGamePairs.english?.map(renderCard)}
        </View>
        <View style={[
          styles.matchingColumn,
          isDesktop && styles.matchingColumnDesktop,
          isDesktop && { width: desktopColumnWidth, marginHorizontal: desktopColumnGap },
        ]}>
          {matchingGamePairs.french?.map(renderCard)}
        </View>
      </View>

      <View
        style={[
          styles.summaryCard,
          isCompact && styles.summaryCardCompact,
          {
            backgroundColor: isDarkMode ? colors.background : colors.card,
          },
          {
            height: footerHeight,
            paddingVertical: summaryPaddingVertical,
            paddingHorizontal: summaryPaddingHorizontal,
          },
        ]}
      >
        <View style={[styles.summaryRow, isVeryCompact && styles.summaryRowVeryCompact]}>
          {timerMode && (
            <View style={[styles.summaryItem, styles.timerSummaryItem, isVeryCompact && styles.timerSummaryItemVeryCompact, { backgroundColor: colors.primarySoft }]}>
              <View style={[styles.timerValuesRow, isVeryCompact && styles.timerValuesRowVeryCompact]}>
                <Text style={[styles.summaryLabel, { color: colors.primary, fontSize: isDesktop ? Math.round(12 * webScale) : 12 }]}>Time</Text>
                <Text style={[styles.summaryValue, styles.timerValue, isCompact && styles.summaryValueCompact, { color: colors.primary, fontSize: cardTextSize }]}>
                  {formatTime(gameState.timer)}
                </Text>
                {bestTimeForActiveCategory != null && (
                  <>
                    <View style={[styles.timerDivider, { backgroundColor: colors.border }]} />
                    <View style={styles.bestValueGroup}>
                      <Text style={[styles.bestLabel, { color: colors.secondaryText, fontSize: isDesktop ? Math.round(11 * webScale) : 11 }]}>Best</Text>
                      <Text style={[styles.bestValue, { color: colors.successText, fontSize: isDesktop ? Math.round(14 * webScale) : 14 }]}>
                        {formatTime(bestTimeForActiveCategory)}
                      </Text>
                    </View>
                  </>
                )}
              </View>
            </View>
          )}

          <View style={[styles.summaryItem, styles.statusSummaryItem, isVeryCompact && styles.summaryItemVeryCompact, { backgroundColor: colors.surface }]}>
            <View style={styles.statusMetric}>
              <Text style={[styles.summaryLabel, { color: colors.secondaryText, fontSize: isDesktop ? Math.round(13 * webScale) : isCompact ? 12 : 13 }]}>
                Words
              </Text>
              <Text style={[styles.summaryValue, isCompact && styles.summaryValueCompact, { color: colors.text, fontSize: isCompact ? 15 : cardTextSize }]}>
                {gameState.totalScore}/{words.length}
              </Text>
            </View>
            <View style={[styles.statusDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statusMetric}>
              <Text style={[styles.summaryLabel, { color: colors.secondaryText, fontSize: isDesktop ? Math.round(13 * webScale) : isCompact ? 12 : 13 }]}>
                Set
              </Text>
              <Text style={[styles.summaryValue, isCompact && styles.summaryValueCompact, { color: colors.text, fontSize: isCompact ? 15 : cardTextSize }]}>
                {gameState.currentSet + 1}/{totalSets}
              </Text>
            </View>
            {matchingSessionXp > 0 && (
              <>
                <View style={[styles.statusDivider, { backgroundColor: colors.border }]} />
                <View style={styles.statusMetric}>
                  <Text style={[styles.summaryLabel, { color: colors.secondaryText, fontSize: isDesktop ? Math.round(13 * webScale) : isCompact ? 12 : 13 }]}>
                    XP
                  </Text>
                  <Text
                    style={[
                      styles.summaryValue,
                      isCompact && styles.summaryValueCompact,
                      {
                        color: lastMatchingXpGain > 0 ? colors.successText : colors.text,
                        fontSize: isCompact ? 15 : cardTextSize,
                      },
                    ]}
                  >
                    +{matchingSessionXp}
                  </Text>
                </View>
              </>
            )}
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
    justifyContent: 'space-between',
  },
  matchingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  matchingContainerDesktop: {
    justifyContent: 'center',
  },
  matchingColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  matchingColumnDesktop: {
    width: 272,
    alignItems: 'center',
    marginHorizontal: 32,
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
  selectedMatchingCard: {
    borderColor: '#45B7D1',
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
  },
  matchedCardText: {
    color: '#2F7D3F',
    fontWeight: '500',
  },
  progressContainer: {
    paddingHorizontal: 2,
    marginTop: 3,
  },
  progressContainerCompact: {
    marginTop: 2,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarCompact: {
    height: 8,
    borderRadius: 999,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#1671B6',
    borderRadius: 999,
  },
  summaryCard: {
    marginHorizontal: 8,
    marginTop: 0,
    marginBottom: 0,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 0,
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
    minHeight: 38,
    borderRadius: 10,
    borderWidth: 0,
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  summaryItemVeryCompact: {
    minHeight: 34,
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
