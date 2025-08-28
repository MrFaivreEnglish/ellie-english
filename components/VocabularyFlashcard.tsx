import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Word } from '../types/VocabularyTypes';

interface FlashcardProps {
  words: Word[];
  currentIndex: number;
  isFlipped: boolean;
  reverseDirection: boolean;
  onFlip: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onShuffle: () => void;
  onToggleDirection: () => void;
  colors: any;
  isDarkMode: boolean;
}

export default function VocabularyFlashcard({
  words,
  currentIndex,
  isFlipped,
  reverseDirection,
  onFlip,
  onNext,
  onPrevious,
  onShuffle,
  onToggleDirection,
  colors,
  isDarkMode
}: FlashcardProps) {
  const currentWord = words[currentIndex];

  if (!currentWord) return null;

  return (
    <View style={styles.container}>
      <View style={styles.flashcardWrapper}>
        <TouchableOpacity 
          activeOpacity={0.9}
          onPress={onFlip}
          style={styles.flashcardTouchable}
          delayPressIn={0}
        >
          <View style={[
            styles.card, 
            (reverseDirection ? !isFlipped : isFlipped) && styles.cardBack,
            { 
              backgroundColor: (reverseDirection ? !isFlipped : isFlipped) 
                ? '#1671B6' 
                : isDarkMode ? colors.card : '#fff',
              borderColor: isDarkMode ? 
                (reverseDirection ? !isFlipped : isFlipped) ? '#1671B6' : '#415a77' 
                : 'rgba(0,0,0,0.05)'
            }
          ]}>
            <View style={styles.cardContent}>
              <Text style={[
                styles.cardTag, 
                (reverseDirection ? !isFlipped : isFlipped) && styles.frenchTag,
                {
                  backgroundColor: isDarkMode ? 
                    ((reverseDirection ? !isFlipped : isFlipped) ? '#E8F7FA' : '#1671B6') :
                    ((reverseDirection ? !isFlipped : isFlipped) ? '#E8F7FA' : '#f0f0f0'),
                  color: isDarkMode ?
                    ((reverseDirection ? !isFlipped : isFlipped) ? '#1671B6' : '#fff') :
                    ((reverseDirection ? !isFlipped : isFlipped) ? '#1671B6' : '#666')
                }
              ]}>
                {(reverseDirection ? !isFlipped : isFlipped) ? 'FRANÇAIS' : 'ENGLISH'}
              </Text>
              <Text style={[
                styles.cardText, 
                (reverseDirection ? !isFlipped : isFlipped) && styles.cardTextFlipped,
                {
                  color: (reverseDirection ? !isFlipped : isFlipped) ? '#fff' : colors.text
                }
              ]}>
                {(reverseDirection ? isFlipped : !isFlipped)
                  ? currentWord.english
                  : currentWord.french}
              </Text>
              <Text style={[
                styles.tapHintText, 
                (reverseDirection ? !isFlipped : isFlipped) && styles.tapHintTextFlipped,
                {
                  color: (reverseDirection ? !isFlipped : isFlipped) ? 
                    'rgba(255,255,255,0.6)' : 
                    isDarkMode ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'
                }
              ]}>Tap to flip</Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>

      {/* Navigation Buttons */}
      <View style={styles.navigationContainer}>
        <TouchableOpacity 
          onPress={onPrevious} 
          disabled={currentIndex === 0} 
          style={[
            styles.navButton, 
            currentIndex === 0 && styles.disabledButton,
            {
              backgroundColor: isDarkMode ? colors.card : '#fff',
              // Make light-mode border lighter (grey)
              borderColor: isDarkMode ? '#1671B6' : '#ddd'
            }
          ]}
        >
          <MaterialIcons name="chevron-left" size={28} color={currentIndex === 0 ? 
            (isDarkMode ? '#666' : '#ccc') : 
            colors.text
          } />
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={onNext} 
          disabled={currentIndex === words.length - 1} 
          style={[
            styles.navButton, 
            currentIndex === words.length - 1 && styles.disabledButton,
            {
              backgroundColor: isDarkMode ? colors.card : '#fff',
              // Make light-mode border lighter (grey)
              borderColor: isDarkMode ? '#1671B6' : '#ddd'
            }
          ]}
        >
          <MaterialIcons name="chevron-right" size={28} color={currentIndex === words.length - 1 ? 
            (isDarkMode ? '#666' : '#ccc') : 
            colors.text
          } />
        </TouchableOpacity>
      </View>
      <Text style={[styles.progressIndicator, { color: colors.secondaryText }]}>
        {currentIndex + 1} / {words.length}
      </Text>
      
      {/* Controls */}
      <View style={styles.controlRow}>
        <TouchableOpacity onPress={onShuffle} style={styles.shuffleButton}>
          <MaterialIcons name="shuffle" size={20} color="#fff" />
          <Text style={styles.shuffleButtonText}>Shuffle</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onToggleDirection}
          style={[styles.switchButton, { 
            borderColor: '#1671B6', 
            backgroundColor: isDarkMode ? colors.card : '#fff' 
          }]}
        >
          <Text style={styles.switchButtonText}>
            {reverseDirection ? 'FR→EN' : 'EN→FR'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  flashcardWrapper: {
    width: '100%',
    maxWidth: 400,
    height: 280,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flashcardTouchable: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: '100%',
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
    borderWidth: 2.5,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  cardBack: {
    backgroundColor: '#1671B6',
  },
  cardContent: {
    width: '100%',
    height: '100%',
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  cardText: {
    fontSize: 36,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
    marginVertical: 24,
  },
  cardTextFlipped: {
    color: '#fff',
  },
  cardTag: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#f0f0f0',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 12,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
  },
  frenchTag: {
    backgroundColor: '#E8F7FA',
    color: '#1671B6',
  },
  tapHintText: {
    position: 'absolute',
    bottom: 16,
    color: 'rgba(0,0,0,0.4)',
    fontSize: 12,
    fontStyle: 'italic',
  },
  tapHintTextFlipped: {
    color: '#fff',
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    marginTop: 32,
    gap: 24,
  },
  navButton: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1.5,
  },
  disabledButton: {
    backgroundColor: '#f5f5f5',
    shadowOpacity: 0,
    elevation: 0,
  },
  progressIndicator: {
    fontSize: 18,
    color: '#666',
    fontWeight: '600',
    marginHorizontal: 16,
    marginTop: 16,
  },
  controlRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginTop: 16,
  },
  shuffleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1671B6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    justifyContent: 'center',
  },
  shuffleButtonText: {
    color: '#fff',
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
  },
  switchButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#1671B6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  switchButtonText: {
    color: '#1671B6',
    fontSize: 14,
    fontWeight: 'bold',
  },
});