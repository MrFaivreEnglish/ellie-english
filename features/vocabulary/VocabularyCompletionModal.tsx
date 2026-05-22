import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, Modal, ScrollView, StyleSheet, Platform, Image, Animated, ImageStyle } from 'react-native';
import { GameState } from '../../types/VocabularyTypes';
import { useAudioPlayer } from 'expo-audio';
import { LinearGradient } from 'expo-linear-gradient';

import TimerfireImg from '../../assets/timerfire.png';
import ShootingStarImg from '../../assets/shooting-star.png';
// Prefer importing compiled asset entries from the centralized assets registry.
import Assets from '../../assets/index';
import { SOUND_EFFECT_OPTIONS, replaySoundEffect } from '../shared/soundEffects';

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
  colors?: any;
  primaryActionLabel?: string;
  onPrimaryAction?: () => void;
}

export default function VocabularyCompletionModal({
  visible,
  gameState,
  timerMode,
  wordsLength,
  isDarkMode,
  onReplay,
  isFirstCompletion,
  isPersonalBest,
  colors,
  startedTimerMode,
  bestTimeForActiveCategory,
  matchingSessionXp = 0,
  primaryActionLabel,
  onPrimaryAction,
}: CompletionModalProps) {
  const bigSuccessPlayer = useAudioPlayer(Assets.bigsuccess, SOUND_EFFECT_OPTIONS);
  const bestSuccessPlayer = useAudioPlayer(Assets.bestsuccess, SOUND_EFFECT_OPTIONS);

  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentScale = useRef(new Animated.Value(0.98)).current;
  const hasPlayedOpenSoundRef = useRef(false);
  const [displayedPersonalBest, setDisplayedPersonalBest] = useState(isPersonalBest);

  useEffect(() => {
    if (visible) {
      setDisplayedPersonalBest(isPersonalBest);
    }
  }, [isPersonalBest, visible]);

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
              padding: displayedPersonalBest ? 28 : 20,
            }, displayedPersonalBest && styles.personalBestCard]}>
              <Image
                source={timerMode ? TimerfireImg : ShootingStarImg}
                style={[
                  styles.congratsImage,
                  (displayedPersonalBest
                    ? { width: Platform.OS === 'web' ? 112 : 132, height: Platform.OS === 'web' ? 112 : 132 }
                    : (Platform.OS === 'web' ? { width: 80, height: 80 } : { width: 120, height: 120 })) as ImageStyle
                ]}
              />
              <Text style={[styles.congratsTitle, { color: '#fff', fontSize: 28, marginVertical: 10 }]}>
                {displayedPersonalBest ? 'New Best Time!' : 'Great job!'}
              </Text>
              <Text style={[styles.congratsDescription, { color: '#fff', fontSize: 16, marginBottom: 16 }]}>
                {displayedPersonalBest ? 'That is your fastest match yet.' : `You've successfully matched all ${wordsLength} words!`}
              </Text>
            </View>

            {matchingSessionXp > 0 && (
              <View style={[
                styles.xpSummaryPill,
                {
                  backgroundColor: isDarkMode ? (colors?.successSoft ?? '#1D3A2A') : '#E9F8EF',
                  borderColor: isDarkMode ? (colors?.success ?? '#6FD08C') : '#42C67A',
                },
              ]}>
                <Text style={[styles.xpSummaryText, { color: isDarkMode ? (colors?.successText ?? '#C4F4D1') : '#12663D' }]}>
                  +{matchingSessionXp} XP
                </Text>
              </View>
            )}

            {/* Unlock card (first completion) */}
            {isFirstCompletion && !timerMode && !startedTimerMode && (
              <View style={[styles.unlockCard, styles.goldenCard]}> 
                <Text style={styles.unlockEmoji}>🏅</Text>
                <Text style={[styles.unlockTitle, styles.goldenTitle]}>Timed matching unlocked</Text>
                <Text style={styles.unlockDescription}>Optional challenge for extra retrieval practice.</Text>
              </View>
            )}

            {/* Metrics display (timer mode) */}
            {timerMode && (
              <View style={[styles.metricsContainer, {
                backgroundColor: isDarkMode ? colors.card : '#fff',
                borderColor: isDarkMode ? '#415a77' : 'rgba(0,0,0,0.1)'
              }]}>
                <View style={styles.metricBox}>
                  <Text style={[styles.metricLabel, { color: isDarkMode ? '#a5d6a7' : '#666' }]}>Score</Text>
                  <Text style={[styles.metricValue, { color: isDarkMode ? '#fff' : '#333' }]}>{gameState.totalScore}</Text>
                </View>
                <View style={styles.metricBox}>
                  <Text style={[styles.metricLabel, { color: isDarkMode ? '#a5d6a7' : '#666' }]}>Time</Text>
                  <Text style={[styles.metricValue, { color: isDarkMode ? '#fff' : '#333' }]}>{formatTime(gameState.timer)}</Text>
                </View>
                <View style={styles.metricBox}>
                  <Text style={[styles.metricLabel, { color: isDarkMode ? '#a5d6a7' : '#666' }]}>Best</Text>
                  <Text style={[styles.metricValue, { color: isDarkMode ? '#fff' : '#333' }]}>
                    {bestTimeForActiveCategory != null ? formatTime(bestTimeForActiveCategory) : '--:--'}
                  </Text>
                </View>
              </View>
            )}

            {/* Spacer between the congrats/metrics and the replay button when user didn't beat time in timer mode */}
            {timerMode && !displayedPersonalBest && (
              <View style={styles.tryAgainSpacer} />
            )}

            {/* Replay / timed matching button */}
            <Pressable
              style={({ pressed }) => [
                styles.replayButton,
                { backgroundColor: colors?.primary ?? '#1671B6' },
                pressed && { opacity: 0.8 }
              ]}
              onPress={() => {
                if (onPrimaryAction) {
                  onPrimaryAction();
                  return;
                }

                const activateTimer = (isFirstCompletion && !timerMode) || timerMode;
                onReplay(activateTimer);
              }}
            >
              <Text style={styles.replayButtonText}>
                {primaryActionLabel ?? (
                  isFirstCompletion && !timerMode
                    ? 'Try\nTimed Matching'
                    : timerMode
                      ? 'Improve Your Time'
                      : 'Practise Again'
                )}
              </Text>
            </Pressable>
          </ScrollView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  completionScrollView: {
    width: '100%',
    // On web, constrain to viewport height so centering works and long content can still scroll
    maxHeight: Platform.OS === 'web' ? ('90vh' as any) : '100%',
  },
  completionScrollViewContent: {
    paddingVertical: 20,
    paddingHorizontal: Platform.OS === 'web' ? 18 : 8,
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: Platform.OS === 'web' ? 680 : '100%',
    minHeight: Platform.OS === 'web' ? 'auto' : '100%',
    // Ensure the content doesn't try to stretch vertically on web
    alignSelf: 'center',
  },
  congratsCard: {
    backgroundColor: '#E8F5E9',
    borderRadius: 16,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  personalBestCard: {
    minHeight: Platform.OS === 'web' ? 250 : 300,
    borderWidth: 3,
    shadowColor: '#f4b942',
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 9,
    justifyContent: 'center',
  },
  congratsImage: {
    width: 110,
    height: 110,
    marginBottom: 16,
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
    lineHeight: 26,
  },
  metricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginVertical: 16,
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 16,
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  xpSummaryText: {
    fontSize: 14,
    fontWeight: '800',
  },
  unlockCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    alignItems: 'center',
    marginVertical: 16,
    borderWidth: 4,
    borderColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
    elevation: 10,
  },
  goldenCard: {
    backgroundColor: '#FFD700',
    borderWidth: 3,
    borderColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 0,
  },
  unlockEmoji: {
    fontSize: 36,
    marginBottom: 12,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  unlockTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 12,
    textAlign: 'center',
  },
  goldenTitle: {
    color: '#000000',
    textShadowColor: 'rgba(0, 0, 0, 0.25)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 0,
  },
  unlockDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 24,
    paddingHorizontal: 8,
  },
  replayButton: {
    backgroundColor: '#1671B6',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tryAgainSpacer: {
    // Add extra breathing room specifically for the try-again flow on timer mode
    height: Platform.OS === 'web' ? 40 : 24,
    width: '100%',
  },
  replayButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
