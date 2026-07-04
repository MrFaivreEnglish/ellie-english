import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, Modal, ScrollView, StyleSheet, Platform, Image, Animated, ImageStyle } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { GameState, Word } from '../../types/VocabularyTypes';
import { useAudioPlayer } from 'expo-audio';
import { LinearGradient } from 'expo-linear-gradient';

import TimerfireImg from '../../assets/timerfire.png';
import ShootingStarImg from '../../assets/shooting-star.png';
// Prefer importing compiled asset entries from the centralized assets registry.
import Assets from '../../assets/index';
import { SOUND_EFFECT_OPTIONS, replaySoundEffect } from '../shared/soundEffects';
import { getXP } from '../progress/xpStorage';
import LevelProgressSummary from '../progress/LevelProgressSummary';
import { getButtonStyle, getButtonTextColor } from '../shared/uiPrimitives';
import type { ThemeColors } from '../settings/ThemeContext';

interface CompletionModalProps {
  visible: boolean;
  gameState: GameState;
  timerMode: boolean;
  wordsLength: number;
  isDarkMode: boolean;
  onReplay: (activateTimerMode?: boolean) => void;
  isFirstCompletion: boolean;
  isPersonalBest: boolean;
  startedTimerMode: boolean;
  bestTimeForActiveCategory?: number | null;
  matchingSessionXp?: number;
  colors: ThemeColors;
  primaryActionLabel?: string;
  onPrimaryAction?: () => void;
  reviewWords?: Word[];
  onReviewWords?: () => void;
  onGoToAccount?: () => void;
}

export default function VocabularyCompletionModal({
  visible,
  gameState,
  timerMode,
  wordsLength,
  isDarkMode,
  onReplay,
  isPersonalBest,
  colors,
  startedTimerMode,
  bestTimeForActiveCategory,
  matchingSessionXp = 0,
  primaryActionLabel,
  onPrimaryAction,
  reviewWords = [],
  onReviewWords,
  onGoToAccount,
}: CompletionModalProps) {
  const bigSuccessPlayer = useAudioPlayer(Assets.bigsuccess, SOUND_EFFECT_OPTIONS);
  const bestSuccessPlayer = useAudioPlayer(Assets.bestsuccess, SOUND_EFFECT_OPTIONS);

  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentScale = useRef(new Animated.Value(0.98)).current;
  const hasPlayedOpenSoundRef = useRef(false);
  const [displayedPersonalBest, setDisplayedPersonalBest] = useState(isPersonalBest);
  const [currentXP, setCurrentXP] = useState(0);
  const timerModeUnlocked = !timerMode && !startedTimerMode && gameState.hasCompletedOnce;

  useEffect(() => {
    if (visible) {
      setDisplayedPersonalBest(isPersonalBest);
    }
  }, [isPersonalBest, visible]);

  useEffect(() => {
    if (!visible) return;

    let active = true;

    getXP().then((xp) => {
      if (active) setCurrentXP(xp);
    }).catch(() => {});

    return () => {
      active = false;
    };
  }, [matchingSessionXp, visible]);

  useEffect(() => {
    if (!visible) {
      hasPlayedOpenSoundRef.current = false;
      return;
    }

    if (hasPlayedOpenSoundRef.current) return;
    hasPlayedOpenSoundRef.current = true;

    const player = timerMode && isPersonalBest ? bestSuccessPlayer : bigSuccessPlayer;
    replaySoundEffect(player);
  }, [bigSuccessPlayer, bestSuccessPlayer, isPersonalBest, visible, timerMode]);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(backdropOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(contentOpacity, { toValue: 1, duration: 320, delay: 80, useNativeDriver: true }),
        Animated.spring(contentScale, { toValue: 1, friction: 9, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(contentOpacity, { toValue: 0, duration: 180, useNativeDriver: true }),
        Animated.timing(backdropOpacity, { toValue: 0, duration: 240, useNativeDriver: true }),
        Animated.timing(contentScale, { toValue: 0.98, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible, backdropOpacity, contentOpacity, contentScale]);

  const formatTime = (totalMs: number) => {
    const safeMs = Math.max(0, Math.floor(totalMs));
    const minutes = Math.floor(safeMs / 60000);
    const seconds = Math.floor((safeMs % 60000) / 1000);
    const ss = seconds < 10 ? `0${seconds}` : `${seconds}`;

    return `${minutes}:${ss}`;
  };

  const gradientColors: [string, string, string] = [
    'rgba(0,0,0,0.18)',
    'rgba(0,0,0,0.60)',
    'rgba(0,0,0,0.95)',
  ];
  const primaryButtonStyle = getButtonStyle(colors, isDarkMode, 'primary');
  const primaryButtonTextColor = getButtonTextColor(colors, isDarkMode, 'primary');
  const secondaryButtonStyle = getButtonStyle(colors, isDarkMode, 'secondary');
  const secondaryButtonTextColor = getButtonTextColor(colors, isDarkMode, 'secondary');

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      statusBarTranslucent={true}
      presentationStyle="overFullScreen"
      hardwareAccelerated
    >
      {/* Full-screen gradient backdrop */}
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { zIndex: 99999, elevation: 99999, opacity: backdropOpacity }
        ]}
        pointerEvents={visible ? 'auto' : 'none'}
      >
        <LinearGradient
          style={StyleSheet.absoluteFill}
          colors={gradientColors}
          start={[0.5, 0]}
          end={[0.5, 1]}
        />

        <Animated.View
          // Center content on web while preserving the original flex behavior on native
          style={[
            { opacity: contentOpacity, transform: [{ scale: contentScale }] },
            Platform.OS === 'web'
              ? { flex: 1, justifyContent: 'center', alignItems: 'center' }
              : { flex: 1 },
          ]}
        >
          {/* Full-screen scroll content overlapping notch/status bar */}
          <ScrollView
            style={styles.completionScrollView}
            contentContainerStyle={styles.completionScrollViewContent}
            showsVerticalScrollIndicator={true}
          >
            {/* Congratulations message */}
            <View style={[styles.congratsCard, {
              backgroundColor: displayedPersonalBest ? '#f4b942' : '#45BB78',
              borderColor: displayedPersonalBest ? '#B9770E' : '#1b6a28',
              padding: displayedPersonalBest ? 22 : 16,
            }, displayedPersonalBest && styles.personalBestCard]}>
              <Image
                source={timerMode ? TimerfireImg : ShootingStarImg}
                style={[
                  styles.congratsImage,
                  (displayedPersonalBest
                    ? { width: Platform.OS === 'web' ? 96 : 96, height: Platform.OS === 'web' ? 96 : 96 }
                    : (Platform.OS === 'web' ? { width: 72, height: 72 } : { width: 88, height: 88 })) as ImageStyle
                ]}
              />
              <Text style={[styles.congratsTitle, { color: '#fff', fontSize: 24, marginVertical: 6 }]}>
                {displayedPersonalBest ? 'New Best Time!' : 'Great job!'}
              </Text>
              <Text style={[styles.congratsDescription, { color: '#fff', fontSize: 15, marginBottom: 8 }]}>
                {displayedPersonalBest ? 'That is your fastest match yet.' : `You've successfully matched all ${wordsLength} words!`}
              </Text>
            </View>

            <LevelProgressSummary
              totalXP={currentXP}
              sessionXP={matchingSessionXp}
              colors={colors}
              isDarkMode={isDarkMode}
              onGoToAccount={onGoToAccount}
            />

            {/* Unlock card (first completion) */}
            {timerModeUnlocked && (
              <View style={[styles.unlockCard, styles.goldenCard]}>
                <Text style={styles.unlockEmoji}>{'\uD83C\uDFC5'}</Text>
                <Text style={[styles.unlockTitle, styles.goldenTitle]}>Timer Mode Unlocked!</Text>
                <Text style={styles.unlockDescription}>Try timer mode for an extra challenge.</Text>
              </View>
            )}

            {/* Metrics display (timer mode) */}
            {timerMode && (
              <View style={[styles.metricsContainer, {
                backgroundColor: colors.card,
                borderColor: colors.border
              }]}>
                <View style={styles.metricBox}>
                  <Text style={[styles.metricLabel, { color: colors.secondaryText }]}>Score</Text>
                  <Text style={[styles.metricValue, { color: colors.text }]}>{gameState.totalScore}</Text>
                </View>
                <View style={styles.metricBox}>
                  <Text style={[styles.metricLabel, { color: colors.secondaryText }]}>Time</Text>
                  <Text style={[styles.metricValue, { color: colors.text }]}>{formatTime(gameState.timer)}</Text>
                </View>
                <View style={styles.metricBox}>
                  <Text style={[styles.metricLabel, { color: colors.secondaryText }]}>Best</Text>
                  <Text style={[styles.metricValue, { color: colors.text }]}>
                    {bestTimeForActiveCategory != null ? formatTime(bestTimeForActiveCategory) : '--:--'}
                  </Text>
                </View>
              </View>
            )}

            {/* Spacer between the congrats/metrics and the replay button when user didn't beat time in timer mode */}
            {timerMode && !displayedPersonalBest && (
              <View style={styles.tryAgainSpacer} />
            )}

            {/* Replay / Timer Mode button */}
            <Pressable
              style={({ pressed }) => [
                styles.replayButton,
                primaryButtonStyle,
                pressed && { opacity: 0.8 }
              ]}
              onPress={() => {
                if (onPrimaryAction) {
                  onPrimaryAction();
                  return;
                }

                const activateTimer = timerModeUnlocked || timerMode;
                onReplay(activateTimer);
              }}
            >
              <Text style={[styles.replayButtonText, { color: primaryButtonTextColor }]}>
                {primaryActionLabel ?? (
                  timerModeUnlocked
                    ? 'Try Timer Mode!'
                    : timerMode
                      ? 'Beat Your Time!'
                      : 'Play Again'
                )}
              </Text>
            </Pressable>

            {reviewWords.length > 0 && (
            <View style={[
              styles.reviewCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}>
              <View style={styles.reviewHeader}>
                <MaterialIcons name="rate-review" size={18} color={colors?.primary ?? '#1671B6'} />
                <Text style={[styles.reviewTitle, { color: colors.text }]}>
                  Words to Try Again
                </Text>
              </View>

              <View style={styles.reviewWordsList}>
                {reviewWords.slice(0, 5).map((word) => (
                  <View key={`${word.english}-${word.french}`} style={styles.reviewWordRow}>
                    <Text style={[styles.reviewWordText, { color: colors.text }]} numberOfLines={1}>
                      {word.english}
                    </Text>
                    <Text style={[styles.reviewWordDivider, { color: colors.secondaryText }]}>/</Text>
                    <Text style={[styles.reviewWordText, { color: colors.text }]} numberOfLines={1}>
                      {word.french}
                    </Text>
                  </View>
                ))}
                {reviewWords.length > 5 && (
                  <Text style={[styles.reviewMoreText, { color: colors.secondaryText }]}>
                    +{reviewWords.length - 5} more
                  </Text>
                )}
              </View>

              {!!onReviewWords && (
                <Pressable
                  onPress={onReviewWords}
                  style={({ pressed }) => [
                    styles.reviewActionButton,
                    secondaryButtonStyle,
                    pressed && { opacity: 0.76 },
                  ]}
                >
                  <Text style={[styles.reviewActionText, { color: secondaryButtonTextColor }]}>
                    Review These Words
                  </Text>
                </Pressable>
              )}
            </View>
            )}
          </ScrollView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  completionScrollView: {
    width: '100%',
    maxHeight: Platform.OS === 'web' ? ('100vh' as any) : '100%',
  },
  completionScrollViewContent: {
    paddingVertical: Platform.OS === 'web' ? 18 : 14,
    paddingHorizontal: Platform.OS === 'web' ? 20 : 16,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 680 : 620,
    minHeight: '100%',
    alignSelf: 'center',
  },
  congratsCard: {
    backgroundColor: '#E8F5E9',
    borderRadius: 18,
    width: '100%',
    alignItems: 'center',
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 16,
    elevation: 7,
  },
  personalBestCard: {
    minHeight: Platform.OS === 'web' ? 210 : 220,
    borderWidth: 3,
    shadowColor: '#f4b942',
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 9,
    justifyContent: 'center',
  },
  congratsImage: {
    width: 88,
    height: 88,
    marginBottom: 8,
    resizeMode: 'contain',
  },
  congratsTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  congratsDescription: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  metricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginVertical: 10,
    borderWidth: 1.5,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  // Each metric gets equal horizontal space and centers its content
  metricBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  metricLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  xpSummaryPill: {
    minHeight: 34,
    marginTop: 12,
    borderRadius: 999,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    paddingVertical: 7,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  xpSummaryText: {
    fontSize: 14,
    fontWeight: '800',
  },
  levelUpBanner: {
    minHeight: 42,
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: '#FFE8A3',
    borderWidth: 1.5,
    borderColor: '#F4B942',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  levelUpBannerText: {
    color: '#7A4B00',
    fontSize: 15,
    lineHeight: 18,
    fontWeight: '900',
    textAlign: 'center',
  },
  levelSummaryBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  levelSummaryText: {
    fontSize: 12,
    fontWeight: '800',
  },
  unlockCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    width: '100%',
    alignItems: 'center',
    marginVertical: 8,
    borderWidth: 2,
    borderColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 5,
  },
  goldenCard: {
    backgroundColor: '#FFF6DE',
    borderWidth: 2,
    borderColor: '#F4B942',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
  },
  unlockEmoji: {
    fontSize: 32,
    marginBottom: 8,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  unlockTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 8,
    textAlign: 'center',
  },
  goldenTitle: {
    color: '#000000',
    textShadowColor: 'rgba(0, 0, 0, 0.25)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 0,
  },
  unlockDescription: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 21,
    paddingHorizontal: 8,
  },
  replayButton: {
    backgroundColor: '#1671B6',
    minWidth: 220,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 999,
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tryAgainSpacer: {
    height: Platform.OS === 'web' ? 14 : 10,
    width: '100%',
  },
  reviewCard: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 14,
    marginTop: 14,
    marginBottom: 14,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    marginBottom: 10,
  },
  reviewTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  reviewWordsList: {
    gap: 7,
  },
  reviewWordRow: {
    minHeight: 26,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  reviewWordText: {
    flexShrink: 1,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  reviewWordDivider: {
    fontSize: 13,
    fontWeight: '800',
  },
  reviewMoreText: {
    marginTop: 2,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  reviewEmptyText: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  reviewActionButton: {
    alignSelf: 'center',
    minHeight: 38,
    marginTop: 12,
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewActionText: {
    fontSize: 14,
    fontWeight: '800',
  },
  replayButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
