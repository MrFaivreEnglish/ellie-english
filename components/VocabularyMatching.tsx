import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, useWindowDimensions, Platform } from 'react-native';
import { GameCard, MatchingGamePairs, GameState } from '../types/VocabularyTypes';

interface MatchingProps {
  gameState: GameState;
  matchingGamePairs: MatchingGamePairs;
  onCardPress: (card: GameCard) => void;
  colors: any;
  isDarkMode: boolean;
  words: any[];
  timerMode: boolean;
}

export default function VocabularyMatching({
  gameState,
  matchingGamePairs,
  onCardPress,
  colors,
  isDarkMode,
  words,
  timerMode
}: MatchingProps) {
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width >= 640;

  return (
    <View>
      <Text style={[styles.matchingTitle, { color: colors.text }]}>Match the words!</Text>

      {/* Matching Columns */}
      <View style={[styles.matchingContainer, isDesktop && styles.matchingContainerDesktop]}>
        <View style={[styles.matchingColumn, isDesktop && styles.matchingColumnDesktop]}>
          {matchingGamePairs.english?.map((card) => (
            <TouchableOpacity
              key={card.id}
              style={[
                styles.matchingCard,
                isDesktop && styles.matchingCardDesktop,
                gameState.selectedCard?.id === card.id && styles.selectedMatchingCard,
                gameState.matchedPairs.includes(card.id) && styles.matchedCard,
                { 
                  backgroundColor: isDarkMode ? 
                    (gameState.matchedPairs.includes(card.id) ? '#2a472d' : colors.card) : 
                    (gameState.matchedPairs.includes(card.id) ? '#E8F5E9' : '#fff'),
                  borderColor: isDarkMode ? 
                    (gameState.matchedPairs.includes(card.id) ? '#4CAF50' : 
                      (gameState.selectedCard?.id === card.id ? '#45B7D1' : '#415a77')) : 
                    (gameState.matchedPairs.includes(card.id) ? '#4CAF50' : 
                      (gameState.selectedCard?.id === card.id ? '#45B7D1' : '#ddd')),
                  borderWidth: gameState.matchedPairs.includes(card.id) || gameState.selectedCard?.id === card.id ? 2.5 : 1
                }
              ]}
              onPress={() => onCardPress(card)}
              disabled={gameState.matchedPairs.includes(card.id)}
            >
              <Text style={[
                styles.matchingCardText,
                gameState.matchedPairs.includes(card.id) && styles.matchedCardText,
                { 
                  color: isDarkMode ? 
                    (gameState.matchedPairs.includes(card.id) ? '#81c784' : colors.text) : 
                    (gameState.matchedPairs.includes(card.id) ? '#1B5E20' : '#333') 
                }
              ]}>
                {card.text}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={[styles.matchingColumn, isDesktop && styles.matchingColumnDesktop]}>
          {matchingGamePairs.french?.map((card) => (
            <TouchableOpacity
              key={card.id}
              style={[
                styles.matchingCard,
                isDesktop && styles.matchingCardDesktop,
                gameState.selectedCard?.id === card.id && styles.selectedMatchingCard,
                gameState.matchedPairs.includes(card.id) && styles.matchedCard,
                { 
                  backgroundColor: isDarkMode ? 
                    (gameState.matchedPairs.includes(card.id) ? '#2a472d' : colors.card) : 
                    (gameState.matchedPairs.includes(card.id) ? '#E8F5E9' : '#fff'),
                  borderColor: isDarkMode ? 
                    (gameState.matchedPairs.includes(card.id) ? '#4CAF50' : 
                      (gameState.selectedCard?.id === card.id ? '#45B7D1' : '#415a77')) : 
                    (gameState.matchedPairs.includes(card.id) ? '#4CAF50' : 
                      (gameState.selectedCard?.id === card.id ? '#45B7D1' : '#ddd')),
                  borderWidth: gameState.matchedPairs.includes(card.id) || gameState.selectedCard?.id === card.id ? 2.5 : 1
                }
              ]}
              onPress={() => onCardPress(card)}
              disabled={gameState.matchedPairs.includes(card.id)}
            >
              <Text style={[
                styles.matchingCardText,
                gameState.matchedPairs.includes(card.id) && styles.matchedCardText,
                { 
                  color: isDarkMode ? 
                    (gameState.matchedPairs.includes(card.id) ? '#81c784' : colors.text) : 
                    (gameState.matchedPairs.includes(card.id) ? '#1B5E20' : '#333') 
                }
              ]}>
                {card.text}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { backgroundColor: '#e0e0e0' }]}>
          <View
            style={[
              styles.progressFill,
              { width: `${(gameState.matchedPairs.length / ((matchingGamePairs?.english?.length || 0) * 2)) * 100}%` }
            ]}
          />
        </View>
      </View>

      <Text style={[
        styles.scoreCounter, 
        { 
          color: colors.text,
          backgroundColor: isDarkMode ? '#2d4752' : '#E8F7FA'
        }
      ]}>Good answers: {gameState.totalScore} / {words.length}</Text>
      
      {/* Game Info */}
      <View style={styles.gameInfo}>
        {timerMode && <Text style={[styles.timerText, { color: isDarkMode ? '#45B7D1' : '#1671B6' }]}>Time: {gameState.timer}s</Text>}
        {gameState.bestTime && timerMode && <Text style={[styles.bestTimeText, { color: isDarkMode ? '#81c784' : '#4CAF50' }]}>Best: {gameState.bestTime}s</Text>}
        <Text style={[styles.setIndicator, { color: colors.secondaryText }]}>
          Set {gameState.currentSet + 1} of {Math.ceil(words.length / 6)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  matchingTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  matchingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
    marginTop: 8,
    paddingHorizontal: 16,
  },
  matchingContainerDesktop: {
    justifyContent: 'center',
  },
  matchingColumn: {
    flex: 1,
    gap: 12,
  },
  matchingColumnDesktop: {
    width: 180,
    alignItems: 'center',
    marginHorizontal: 12,
  },
  matchingCard: {
    width: '100%',
    aspectRatio: 3,
    backgroundColor: '#fff',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 4,
  },
  matchingCardDesktop: {
    width: 180,
  },
  selectedMatchingCard: {
    borderColor: '#45B7D1',
    backgroundColor: '#E8F7FA',
    transform: [{ scale: 1.02 }],
  },
  matchedCard: {
    borderColor: '#4CAF50',
    backgroundColor: '#E8F5E9',
    transform: [{ scale: 1 }],
    opacity: 0.9,
  },
  matchingCardText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    padding: 4,
    lineHeight: 16,
  },
  matchedCardText: {
    color: '#1B5E20',
    fontWeight: '600',
  },
  progressContainer: {
    paddingHorizontal: 30,
    marginTop: 25,
    marginBottom: 16,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#1671B6',
    borderRadius: 4,
  },
  scoreCounter: {
    fontSize: 18,
    color: '#333',
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
    backgroundColor: '#E8F7FA',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 16,
  },
  gameInfo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 16,
  },
  timerText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1671B6',
  },
  bestTimeText: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  setIndicator: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
});