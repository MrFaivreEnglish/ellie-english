import React, { useEffect } from 'react';
import { View, Text, Pressable, Modal, ScrollView, StyleSheet, Platform, Image, StatusBar } from 'react-native';
import { GameState } from '../types/VocabularyTypes';
import { Audio } from 'expo-av';

import TimerfireImg from '../assets/Timerfire.png';
import ShootingStarImg from '../assets/shooting-star.png';

interface CompletionModalProps {
  visible: boolean;
  gameState: GameState;
  timerMode: boolean;
  wordsLength: number;
  isDarkMode: boolean;
  onReplay: (activateTimerMode?: boolean) => void;
  isFirstCompletion: boolean;
  colors: {
    buttonBackground: string;
    buttonText: string;
  };
  isPersonalBest: boolean;
  // New: track if timer mode was started so we don't show the unlock card afterwards
  startedTimerMode: boolean;
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
  startedTimerMode
}: CompletionModalProps) {
  useEffect(() => {
    if (visible) {
      (async () => {
        // choose best success for new personal best in timer mode, otherwise big success
        const asset = (timerMode && isPersonalBest)
          ? require('../assets/bestsuccess.mp3')
          : require('../assets/bigsuccess.mp3');
        await Audio.Sound.createAsync(asset, { shouldPlay: true });
      })();
    }
  }, [visible, timerMode, isPersonalBest]);

  // Ensure the overlay goes under the Android status bar so background covers the bar.
  const statusBarHeight = Platform.OS === 'android' && !visible ? StatusBar.currentHeight || 0 : 0;

  // add time formatter
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' + s : s}`;
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      statusBarTranslucent={true}
    >
      <View style={[styles.completionMessage, { paddingTop: statusBarHeight }] }>
        <ScrollView 
          style={styles.completionScrollView}
          contentContainerStyle={styles.completionScrollViewContent}
          showsVerticalScrollIndicator={true}
        >
          <>
            {/* Congratulations message */}
            <View style={[styles.congratsCard, { 
              backgroundColor: '#45BB78',
              borderColor: '#1b6a28', // darker shade for contrast
              padding: 20,
            }]}> 
              <Image
                source={timerMode ? TimerfireImg : ShootingStarImg}
                style={[
                  styles.congratsImage,
                  // desktop: reduce a lot
                  Platform.OS === 'web' && { width: 80, height: 80 },
                  // native: slightly larger
                  Platform.OS !== 'web' && { width: 120, height: 120 }
                ]}
              />
              <Text style={[styles.congratsTitle, { 
                color: '#fff',
                fontSize: 28,
                marginVertical: 10,
              }]}> {isPersonalBest ? 'New Personal Best!' : 'Great job!'} </Text>
              <Text style={[styles.congratsDescription, { 
                color: '#fff',
                fontSize: 16,
                marginBottom: 16,
              }]}> {isPersonalBest ? 'Try again?' : `You've successfully matched all ${wordsLength} words!`} </Text>
            </View>
            
            {/* Unlock card (first completion) */}
            {isFirstCompletion && !timerMode && !startedTimerMode && (
              <View style={[styles.unlockCard, styles.goldenCard]}> 
                <Text style={styles.unlockEmoji}>🏅</Text>
                <Text style={[styles.unlockTitle, styles.goldenTitle]}>Timer Mode Unlocked!</Text>
                <Text style={styles.unlockDescription}>Try timer mode for an extra challenge.</Text>
              </View>
            )}
            
            {/* Metrics display (timer mode) */}
            {timerMode && (
              <View style={[styles.metricsContainer, {
                backgroundColor: isDarkMode ? colors.card : '#fff',
                borderColor: isDarkMode ? '#415a77' : 'rgba(0,0,0,0.1)'
              }]}
              >
                <View style={styles.metricBox}>
                  <Text style={[styles.metricLabel, { color: isDarkMode ? '#a5d6a7' : '#666' }]}>
                    Score
                  </Text>
                  <Text style={[styles.metricValue, { color: isDarkMode ? '#fff' : '#333' }]}>{gameState.totalScore}</Text>
                </View>
                <View style={styles.metricBox}>
                  <Text style={[styles.metricLabel, { color: isDarkMode ? '#a5d6a7' : '#666' }]}>
                    Time
                  </Text>
                  <Text style={[styles.metricValue, { color: isDarkMode ? '#fff' : '#333' }]}>{formatTime(gameState.timer)}</Text>
                </View>
                <View style={styles.metricBox}>
                  <Text style={[styles.metricLabel, { color: isDarkMode ? '#a5d6a7' : '#666' }]}>
                    Best
                  </Text>
                  <Text style={[styles.metricValue, { color: isDarkMode ? '#fff' : '#333' }]}>{gameState.bestTime != null ? formatTime(gameState.bestTime) : '--:--'}</Text>
                </View>
              </View>
            )}
            
            {/* Replay / Timer Mode button */}
            <Pressable
              style={({ pressed }) => [
                styles.replayButton,
                { backgroundColor: '#1671B6' },
                pressed && { opacity: 0.8 }
              ]}
              onPress={() => {
                const activateTimer = (isFirstCompletion && !timerMode) || timerMode;
                onReplay(activateTimer);
              }}
            >
              <Text style={styles.replayButtonText}>
                {isFirstCompletion && !timerMode
                  ? 'Try\nTimer Mode!'
                  : timerMode
                    ? 'Beat Your Time!'
                    : 'Play Again'}
              </Text>
            </Pressable>
          </>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  completionMessage: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    elevation: 1000,
    display: Platform.OS === 'web' ? 'flex' : undefined,
    paddingHorizontal: 20,
  },
  completionScrollView: {
    width: '100%',
    maxHeight: '100%',
  },
  completionScrollViewContent: {
    paddingVertical: 20,
    paddingHorizontal: Platform.OS === 'web' ? 20 : 0,
    alignItems: 'center',
    justifyContent: 'center',
    // make sure the scroll content fills native screens so centering works consistently
    minHeight: Platform.OS === 'web' ? 'auto' : '100%',
  },
  completionCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    // on mobile allow full width, limit only on web
    maxWidth: Platform.OS === 'web' ? 800 : undefined,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
    marginBottom: 40,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
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
  congratsEmoji: {
    fontSize: 40,
    marginBottom: 16,
    textAlign: 'center',
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
    backgroundColor: '#fff', // overridden at runtime
    borderColor: 'rgba(0,0,0,0.1)', // overridden at runtime
  },
  metricBox: {
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
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
  replayButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  celebrationCard: {
    backgroundColor: '#45BB78',
    borderRadius: 16,
    padding: 16,
    marginVertical: 16,
    alignItems: 'center',
  },
  celebrationText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});