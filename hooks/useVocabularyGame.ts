import { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import { Word, GameCard, MatchingGamePairs, GameState } from '../types/VocabularyTypes';
import { shuffleArray, PAIRS_PER_SET } from '../utils/vocabularyUtils';

export const useVocabularyGame = (words: Word[], timerMode: boolean) => {
  const [gameState, setGameState] = useState<GameState>({
    currentSet: 0,
    matchedPairs: [],
    selectedCard: null,
    totalScore: 0,
    timer: 0,
    bestTime: null,
    hasCompletedOnce: false,
    consecutiveCorrect: 0,
    incorrectPair: null,
    hasAdvancedSet: false,
  });

  const [matchingGamePairs, setMatchingGamePairs] = useState<MatchingGamePairs>({
    english: [],
    french: []
  });

  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null);

  const resetGameState = useCallback(() => {
    setGameState({
      currentSet: 0,
      matchedPairs: [],
      selectedCard: null,
      totalScore: 0,
      timer: 0,
      bestTime: gameState.bestTime,
      hasCompletedOnce: gameState.hasCompletedOnce,
      consecutiveCorrect: 0,
      incorrectPair: null,
      hasAdvancedSet: false,
    });
  }, [gameState.bestTime, gameState.hasCompletedOnce]);

  const initializeGameSet = useCallback(() => {
    if (!words.length) return;
    
    resetGameState();
    const currentWords = words.slice(0, PAIRS_PER_SET);
    
    const englishCards = currentWords.map((word, index) => ({
      id: `english-${index}`,
      text: word.english,
      type: 'english' as const,
      pairId: index
    }));
    
    const frenchCards = currentWords.map((word, index) => ({
      id: `french-${index}`,
      text: word.french,
      type: 'french' as const,
      pairId: index
    }));

    setMatchingGamePairs({
      english: shuffleArray(englishCards),
      french: shuffleArray(frenchCards)
    });
  }, [words, resetGameState]);

  // Timer logic
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    const allSetsCompleted = gameState.currentSet >= Math.ceil(words.length / PAIRS_PER_SET) - 1
      && gameState.matchedPairs.length === (matchingGamePairs?.english?.length || 0) * 2
      && matchingGamePairs?.english?.length > 0;

    if (timerMode && !allSetsCompleted) {
      intervalId = setInterval(() => {
        setGameState(prev => ({ ...prev, timer: prev.timer + 1 }));
      }, 1000);
      setTimerInterval(intervalId);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [timerMode, gameState.currentSet, gameState.matchedPairs.length, matchingGamePairs?.english?.length, words.length]);

  const handleCardPress = useCallback((card: GameCard) => {
    // Haptic feedback
    if (Platform.OS !== 'web') {
      try {
        const Haptics = require('expo-haptics');
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (_) {
        // Haptics not available
      }
    }

    if (gameState.matchedPairs.includes(card.id) || gameState.selectedCard?.id === card.id) return;

    if (!gameState.selectedCard) {
      setGameState(prev => ({ ...prev, selectedCard: card }));
      return;
    }

    const isMatch = gameState.selectedCard.pairId === card.pairId;

    if (isMatch) {
      const newMatched = [...gameState.matchedPairs, gameState.selectedCard.id, card.id];
      setGameState(prev => ({
        ...prev,
        matchedPairs: newMatched,
        totalScore: prev.totalScore + 1,
        consecutiveCorrect: prev.consecutiveCorrect + 1,
        selectedCard: null
      }));

      console.log('🎯 Match found!');
    } else {
      setGameState(prev => ({
        ...prev,
        incorrectPair: [gameState.selectedCard!.id, card.id],
        consecutiveCorrect: 0,
        selectedCard: null
      }));
      console.log('❌ Try again!');
      setTimeout(() => {
        setGameState(prev => ({ ...prev, incorrectPair: null }));
      }, 500);
    }
  }, [gameState.matchedPairs, gameState.selectedCard]);

  const advanceToNextSet = useCallback(() => {
    const nextSet = gameState.currentSet + 1;
    const startIndex = nextSet * PAIRS_PER_SET;
    const endIndex = Math.min(startIndex + PAIRS_PER_SET, words.length);
    const nextWords = words.slice(startIndex, endIndex);

    const englishCards = nextWords.map((word, index) => ({
      id: `english-${index}`,
      text: word.english,
      type: 'english' as const,
      pairId: index
    }));
    
    const frenchCards = nextWords.map((word, index) => ({
      id: `french-${index}`,
      text: word.french,
      type: 'french' as const,
      pairId: index
    }));

    setMatchingGamePairs({
      english: shuffleArray(englishCards),
      french: shuffleArray(frenchCards)
    });

    setGameState(prev => ({
      ...prev,
      matchedPairs: [],
      selectedCard: null,
      currentSet: nextSet,
      hasAdvancedSet: false
    }));
  }, [gameState.currentSet, words]);

  return {
    gameState,
    setGameState,
    matchingGamePairs,
    initializeGameSet,
    handleCardPress,
    advanceToNextSet,
    resetGameState,
    timerInterval,
    setTimerInterval
  };
};