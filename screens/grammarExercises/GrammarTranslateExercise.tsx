import React, { useMemo, useState } from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import {
  CARD_HEIGHT,
  Exercise,
  normalizeAnswer,
  tokenizeTranslateAnswer,
} from './GrammarExerciseUtils';
import { getWebLessonScale, scaleValue } from '../../utils/responsiveLayout';
import { triggerSelectionHaptic, triggerSuccessHaptic, triggerWarningHaptic } from '../../utils/haptics';

interface GrammarTranslateExerciseProps {
  exercise?: Exercise;
  colors: any;
  isDarkMode: boolean;
  compact?: boolean;
  userAnswer: string;
  incorrectAnswer: string;
  optionsContainerRef: React.RefObject<View | null>;
  firstOptionRef: React.RefObject<View | null>;
  onOptionsLayout: (y: number) => void;
  onFirstOptionLayout: (y: number) => void;
  onCardHeightChange?: (height: number) => void;
  onCorrect: (answer: string) => Promise<void>;
  onIncorrect: (marker: string) => void;
}

const GrammarTranslateExercise: React.FC<GrammarTranslateExerciseProps> = ({
  exercise,
  colors,
  isDarkMode,
  compact = false,
  userAnswer,
  incorrectAnswer,
  optionsContainerRef,
  firstOptionRef,
  onOptionsLayout,
  onFirstOptionLayout,
  onCardHeightChange,
  onCorrect,
  onIncorrect,
}) => {
  const { width, height } = useWindowDimensions();
  const isDesktopWeb = Platform.OS === 'web' && width >= 768;
  const webScale = getWebLessonScale(width, height);
  const [selectedWordIndexes, setSelectedWordIndexes] = useState<number[]>([]);
  const wordBank = useMemo(() => {
    const words = exercise?.wordBank ?? (typeof exercise?.answer === 'string' ? tokenizeTranslateAnswer(exercise.answer) : []);
    return words.map((word, index) => ({ word, index }));
  }, [exercise?.answer, exercise?.wordBank]);
  const desktopTranslateCardMinHeight = Math.min(scaleValue(430, webScale), Math.max(scaleValue(360, webScale), Math.round(height * 0.48)));
  const translateCardMinHeight = compact ? 236 : isDesktopWeb ? desktopTranslateCardMinHeight : CARD_HEIGHT;
  const answerTrayMinHeight = compact ? 68 : isDesktopWeb ? scaleValue(126, webScale) : 92;
  const selectedWordsMinHeight = compact ? 38 : isDesktopWeb ? scaleValue(76, webScale) : 54;
  const wordBankPanelPadding = compact ? 10 : isDesktopWeb ? scaleValue(22, webScale) : 18;
  const chipVerticalPadding = compact ? 7 : isDesktopWeb ? scaleValue(12, webScale) : 10;
  const chipHorizontalPadding = compact ? 10 : isDesktopWeb ? scaleValue(16, webScale) : 14;

  const handleWordPress = (index: number) => {
    if (userAnswer !== '' || selectedWordIndexes.includes(index)) return;
    setSelectedWordIndexes(current => [...current, index]);
    triggerSelectionHaptic();
  };

  const handleSelectedWordPress = (position: number) => {
    if (userAnswer !== '') return;
    setSelectedWordIndexes(current => current.filter((_, index) => index !== position));
    triggerSelectionHaptic();
  };

  const handleClear = () => {
    if (userAnswer !== '' || selectedWordIndexes.length === 0) return;
    setSelectedWordIndexes([]);
    triggerSelectionHaptic();
  };

  const handleSubmit = async () => {
    if (!exercise || userAnswer !== '' || typeof exercise.answer !== 'string') return;

    const answer = selectedWordIndexes
      .map(index => wordBank.find(option => option.index === index)?.word)
      .filter(Boolean)
      .join(' ');
    const isCorrect = normalizeAnswer(answer) === normalizeAnswer(exercise.answer);

    if (isCorrect) {
      triggerSuccessHaptic();
      await onCorrect(exercise.answer);
    } else {
      triggerWarningHaptic();
      onIncorrect('translate');
    }
  };

  const hasSelectedWords = selectedWordIndexes.length > 0;
  const disabled = userAnswer !== '' || selectedWordIndexes.length === 0;

  return (
    <View
      ref={optionsContainerRef}
      onLayout={(e) => onOptionsLayout(e.nativeEvent.layout.y)}
      style={[styles.translateContainer, { minHeight: translateCardMinHeight }]}
    >
      <View
        ref={firstOptionRef}
        onLayout={(e) => {
          onFirstOptionLayout(e.nativeEvent.layout.y);
          onCardHeightChange?.(e.nativeEvent.layout.height);
        }}
        style={[
          styles.translateCard,
          compact && styles.translateCardCompact,
          isDesktopWeb && styles.translateCardDesktopWeb,
          { minHeight: translateCardMinHeight },
          isDarkMode && { backgroundColor: '#112c48', borderColor: colors.border, borderBottomColor: colors.borderStrong },
          incorrectAnswer === 'translate' && styles.incorrectOption,
        ]}
      >
        <View
          style={[
            styles.answerTray,
            compact && styles.answerTrayCompact,
            isDesktopWeb && styles.answerTrayDesktopWeb,
            { minHeight: answerTrayMinHeight },
            isDarkMode && {
              backgroundColor: '#112c48',
              borderColor: colors.border,
              borderBottomColor: colors.borderStrong,
            },
            incorrectAnswer === 'translate' && styles.answerTrayIncorrect,
          ]}
        >
          <View style={styles.trayHeader}>
            <Text style={[styles.trayHint, isDesktopWeb && { fontSize: scaleValue(13, webScale) }, isDarkMode && { color: '#B7C8D8' }]}>
              {selectedWordIndexes.length === 0 ? 'Tap the words below' : 'Tap a word to remove it'}
            </Text>
            <View style={styles.trayUtilities}>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Clear answer"
                accessibilityState={{ disabled: !hasSelectedWords || userAnswer !== '' }}
                onPress={handleClear}
                disabled={!hasSelectedWords || userAnswer !== ''}
                style={[styles.trayUtilityButton, styles.clearButton, isDarkMode && styles.trayUtilityButtonDark, (!hasSelectedWords || userAnswer !== '') && styles.disabledSmallActionButton]}
              >
                <Text style={[styles.clearButtonText, isDarkMode && styles.clearButtonTextDark]}>{'\u00d7'}</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={[styles.selectedWordsRow, compact && styles.selectedWordsRowCompact, { minHeight: selectedWordsMinHeight }]}>
            {selectedWordIndexes.length === 0 ? (
              <View style={styles.answerPlaceholder} />
            ) : (
              selectedWordIndexes.map((wordIndex, position) => {
                const selectedWord = wordBank.find(option => option.index === wordIndex)?.word;
                if (!selectedWord) return null;

                return (
                  <TouchableOpacity
                    key={`${wordIndex}-${position}`}
                    accessibilityRole="button"
                    accessibilityLabel={`Remove word ${selectedWord}`}
                    onPress={() => handleSelectedWordPress(position)}
                    style={[styles.selectedWordChip, compact && styles.selectedWordChipCompact, isDesktopWeb && styles.selectedWordChipDesktopWeb]}
                  >
                    <Text style={[styles.selectedWordChipText, compact && styles.selectedWordChipTextCompact, isDesktopWeb && styles.selectedWordChipTextDesktopWeb, isDesktopWeb && { fontSize: scaleValue(16, webScale) }]}>{selectedWord}</Text>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
          <View style={styles.answerLine} />
        </View>

        <View style={[styles.wordBankPanel, compact && styles.wordBankPanelCompact, { padding: wordBankPanelPadding }, isDarkMode && {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        }]}>
          <View style={styles.wordBank}>
            {wordBank.map(({ word, index }) => {
              const isSelected = selectedWordIndexes.includes(index);

              return (
                <TouchableOpacity
                  key={`${word}-${index}`}
                  accessibilityRole="button"
                  accessibilityLabel={`${isSelected ? 'Selected word' : 'Add word'} ${word}`}
                  accessibilityState={{ disabled: isSelected || userAnswer !== '', selected: isSelected }}
                  onPress={() => handleWordPress(index)}
                  disabled={isSelected || userAnswer !== ''}
                  style={[
            styles.wordChip,
            compact && styles.wordChipCompact,
            isDesktopWeb && styles.wordChipDesktopWeb,
                    { paddingVertical: chipVerticalPadding, paddingHorizontal: chipHorizontalPadding },
                    isDarkMode && {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      borderBottomColor: colors.borderStrong,
                    },
                    isSelected && styles.disabledWordChip,
                  ]}
                >
                  <Text style={[
                    styles.wordChipText,
                    compact && styles.wordChipTextCompact,
                    isDesktopWeb && styles.wordChipTextDesktopWeb,
                    isDesktopWeb && { fontSize: scaleValue(16, webScale) },
                    isDarkMode && { color: colors.text },
                    isSelected && styles.disabledWordChipText,
                  ]}>{word}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Check answer"
          accessibilityState={{ disabled }}
          onPress={handleSubmit}
          disabled={disabled}
          style={[
            styles.checkAnswerButton,
            compact && styles.checkAnswerButtonCompact,
            isDesktopWeb && styles.checkAnswerButtonDesktopWeb,
            isDesktopWeb && { minHeight: scaleValue(54, webScale) },
            disabled && styles.disabledCheckAnswerButton,
          ]}
        >
          <Text style={[styles.checkAnswerButtonText, isDesktopWeb && { fontSize: scaleValue(16, webScale) }]}>Check</Text>
        </TouchableOpacity>
        {incorrectAnswer === 'translate' && (
          <Text style={styles.translateErrorText}>Not quite. Tap a word to remove it.</Text>
        )}
      </View>
    </View>
  );
};

export default GrammarTranslateExercise;

const styles = StyleSheet.create({
  translateContainer: {
    minHeight: CARD_HEIGHT,
  },
  translateCard: {
    minHeight: CARD_HEIGHT,
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderBottomWidth: 4,
    borderColor: '#E5E5E5',
    borderBottomColor: '#D1D5DB',
    justifyContent: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  translateCardCompact: {
    padding: 10,
    borderBottomWidth: 3,
  },
  translateCardDesktopWeb: {
    padding: 20,
  },
  answerTray: {
    minHeight: 92,
    borderRadius: 8,
    borderWidth: 2,
    borderBottomWidth: 4,
    borderColor: '#E5E5E5',
    borderBottomColor: '#D1D5DB',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
    marginBottom: 12,
  },
  answerTrayCompact: {
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 8,
    marginBottom: 8,
    borderBottomWidth: 3,
  },
  answerTrayDesktopWeb: {
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 16,
    marginBottom: 16,
  },
  answerTrayDark: {
    backgroundColor: '#203246',
    borderColor: '#6F90B3',
    borderBottomColor: '#8EAFD1',
  },
  answerTrayIncorrect: {
    backgroundColor: '#FFF1F3',
    borderColor: '#F06A7F',
    borderBottomColor: '#D94E64',
  },
  selectedWordsRow: {
    minHeight: 54,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    justifyContent: 'center',
    gap: 8,
    paddingTop: 4,
    paddingBottom: 6,
  },
  selectedWordsRowCompact: {
    gap: 6,
    paddingTop: 2,
    paddingBottom: 3,
  },
  answerPlaceholder: {
    minHeight: 32,
    width: '100%',
  },
  answerLine: {
    height: 2,
    backgroundColor: '#D8E1EA',
    borderRadius: 999,
    marginTop: 6,
  },
  trayUtilities: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    width: 42,
  },
  trayHeader: {
    minHeight: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 8,
  },
  trayHint: {
    color: '#777',
    fontSize: 13,
    fontWeight: '800',
    flex: 1,
  },
  trayUtilityButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearButton: {
    backgroundColor: '#fff',
    borderColor: '#f4c7c7',
  },
  disabledSmallActionButton: {
    opacity: 0.28,
  },
  trayUtilityButtonDark: {
    backgroundColor: '#2A4159',
    borderColor: '#7396BA',
  },
  trayActionText: {
    color: '#1CB0F6',
    fontSize: 12,
    fontWeight: '800',
  },
  trayActionTextDark: {
    color: '#CBEAFF',
  },
  clearButtonText: {
    color: '#C62828',
    fontSize: 28,
    lineHeight: 30,
    fontWeight: '700',
    textAlign: 'center',
  },
  clearButtonTextDark: {
    color: '#FFD1D8',
  },
  wordBankPanel: {
    borderRadius: 8,
    backgroundColor: '#F7F7F7',
    borderWidth: 2,
    borderColor: '#E5E5E5',
    padding: 18,
    marginBottom: 12,
  },
  wordBankPanelCompact: {
    marginBottom: 8,
  },
  wordBankPanelDark: {
    backgroundColor: '#21354B',
    borderColor: '#6F90B3',
  },
  wordBank: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
  },
  wordChip: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderBottomWidth: 4,
    borderColor: '#E5E5E5',
    borderBottomColor: '#D1D5DB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  wordChipCompact: {
    borderBottomWidth: 3,
  },
  wordChipDesktopWeb: {
    borderBottomWidth: 4,
  },
  wordChipDark: {
    backgroundColor: '#2C435C',
    borderColor: '#7396BA',
    borderBottomColor: '#93B5D8',
  },
  wordChipText: {
    color: '#4B4B4B',
    fontSize: 14,
    fontWeight: '700',
  },
  wordChipTextCompact: {
    fontSize: 13,
  },
  wordChipTextDesktopWeb: {
    fontSize: 16,
  },
  wordChipTextDark: {
    color: '#E7F2FB',
  },
  selectedWordChip: {
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#1A8FD8',
    borderWidth: 2,
    borderBottomWidth: 4,
    borderColor: '#78CBFF',
    borderBottomColor: '#1277B3',
    alignSelf: 'flex-start',
  },
  selectedWordChipCompact: {
    paddingVertical: 6,
    paddingHorizontal: 9,
    borderBottomWidth: 3,
  },
  selectedWordChipDesktopWeb: {
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  selectedWordChipText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  selectedWordChipTextCompact: {
    fontSize: 13,
  },
  selectedWordChipTextDesktopWeb: {
    fontSize: 16,
  },
  disabledWordChip: {
    opacity: 0.3,
  },
  disabledWordChipText: {
    color: '#6f8798',
  },
  checkAnswerButton: {
    minHeight: 48,
    borderRadius: 8,
    backgroundColor: '#1671B6',
    borderWidth: 2,
    borderBottomWidth: 4,
    borderColor: '#1671B6',
    borderBottomColor: '#0F5E98',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkAnswerButtonCompact: {
    minHeight: 40,
    borderBottomWidth: 3,
  },
  checkAnswerButtonDesktopWeb: {
    minHeight: 54,
  },
  disabledCheckAnswerButton: {
    opacity: 0.45,
  },
  checkAnswerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  translateErrorText: {
    color: '#A12A3D',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 6,
    textAlign: 'center',
  },
  incorrectOption: {
    backgroundColor: '#FFE8EC',
    borderColor: '#F06A7F',
    borderBottomColor: '#D94E64',
  },
});
