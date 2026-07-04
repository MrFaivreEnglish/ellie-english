import React, { useCallback, useMemo, useState } from 'react';
import { Animated, Platform, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import {
  CARD_HEIGHT,
  Exercise,
  computeWordDensity,
  normalizeAnswer,
  tokenizeTranslateAnswer,
} from './GrammarExerciseUtils';
import { clampNumber, getWebLessonScale, scaleValue } from '../../shared/responsiveLayout';
import { getGrammarGameColors, getPrimaryButtonStyle } from '../../shared/uiPrimitives';
import { triggerSelectionHaptic } from '../../shared/haptics';
import type { ThemeColors } from '../../settings/ThemeContext';
import { useSelectedWordDrag } from './useSelectedWordDrag';
import { wordBankStyles } from './grammarExerciseStyles';

interface GrammarTranslateExerciseProps {
  exercise?: Exercise;
  colors: ThemeColors;
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
  const isAndroid = Platform.OS === 'android';
  const isWeb = Platform.OS === 'web';
  const applyCompactStyles = compact && !isAndroid;
  const webScale = getWebLessonScale(width, height);
  const [selectedWordIndexes, setSelectedWordIndexes] = useState<number[]>([]);
  const selectedWordDrag = useSelectedWordDrag<number>(selectedWordIndexes.length, setSelectedWordIndexes, userAnswer !== '');
  const { draggingPosition, dropTargetPosition } = selectedWordDrag;
  const wordBank = useMemo(() => {
    const words = exercise?.wordBank ?? (typeof exercise?.answer === 'string' ? tokenizeTranslateAnswer(exercise.answer) : []);
    return words.map((word, index) => ({ word, index }));
  }, [exercise?.answer, exercise?.wordBank]);
  const desktopTranslateCardMinHeight = Math.min(
    scaleValue(390, webScale),
    Math.max(scaleValue(320, webScale), Math.round(height * 0.4))
  );
  const androidTranslateCardMinHeight = Math.round(clampNumber(
    height * (compact ? 0.39 : 0.43),
    compact ? 286 : 320,
    compact ? 348 : 420
  ));
  const translateCardMinHeight = isDesktopWeb ? desktopTranslateCardMinHeight : isAndroid ? androidTranslateCardMinHeight : compact ? 236 : CARD_HEIGHT;
  const answerTrayMinHeight = isAndroid ? (compact ? 88 : 104) : compact ? 68 : isDesktopWeb ? scaleValue(108, webScale) : 92;
  const selectedWordsMinHeight = isAndroid ? (compact ? 70 : 82) : compact ? 56 : isDesktopWeb ? scaleValue(86, webScale) : 72;
  const wordCount = wordBank.length;
  const wordCharacterCount = wordBank.reduce((total, option) => total + option.word.length, 0);
  const isNarrowWordLayout = width < 390 || compact;
  const wordDensity = computeWordDensity(wordCount, wordCharacterCount, isDesktopWeb, isNarrowWordLayout);
  const wordBankPanelPadding = isDesktopWeb
    ? scaleValue(wordDensity === 0 ? 18 : wordDensity === 1 ? 16 : 14, webScale)
    : isAndroid
      ? compact
        ? wordDensity === 0 ? 12 : wordDensity === 1 ? 11 : 10
        : wordDensity === 0 ? 16 : wordDensity === 1 ? 14 : 12
      : compact
        ? wordDensity === 0 ? 9 : wordDensity === 1 ? 8 : 7
        : wordDensity === 0 ? 16 : wordDensity === 1 ? 14 : 12;
  const chipVerticalPadding = isDesktopWeb
    ? scaleValue(wordDensity === 0 ? 14 : wordDensity === 1 ? 13 : 11, webScale)
    : isAndroid
      ? compact
        ? wordDensity === 0 ? 11 : wordDensity === 1 ? 9 : 8
        : wordDensity === 0 ? 16 : wordDensity === 1 ? 14 : 12
      : compact
        ? isWeb
          ? wordDensity === 0 ? 13 : wordDensity === 1 ? 11 : 9
          : wordDensity === 0 ? 10 : wordDensity === 1 ? 8 : 7
        : wordDensity === 0 ? 15 : wordDensity === 1 ? 13 : 11;
  const chipHorizontalPadding = isDesktopWeb
    ? scaleValue(wordDensity === 0 ? 19 : wordDensity === 1 ? 17 : 14, webScale)
    : isAndroid
      ? compact
        ? wordDensity === 0 ? 15 : wordDensity === 1 ? 13 : 11
        : wordDensity === 0 ? 21 : wordDensity === 1 ? 18 : 16
      : compact
        ? isWeb
          ? wordDensity === 0 ? 17 : wordDensity === 1 ? 14 : 12
          : wordDensity === 0 ? 13 : wordDensity === 1 ? 11 : 10
        : wordDensity === 0 ? 20 : wordDensity === 1 ? 17 : 15;
  const wordChipFontSize = isDesktopWeb
    ? scaleValue(wordDensity === 0 ? 19 : wordDensity === 1 ? 17 : 16, webScale)
    : compact
      ? isWeb
        ? wordDensity === 0 ? 17 : wordDensity === 1 ? 15 : 14
        : wordDensity === 0 ? 16 : wordDensity === 1 ? 14 : 13
      : wordDensity === 0 ? 18 : wordDensity === 1 ? 16 : 15;
  const wordBankGap = wordDensity === 0 ? 8 : wordDensity === 1 ? 7 : 6;
  const selectedWordsGap = wordDensity === 0 ? 7 : wordDensity === 1 ? 6 : 5;
  const grammarGame = getGrammarGameColors(colors, isDarkMode);

  const handleWordPress = useCallback((index: number) => {
    if (userAnswer !== '' || selectedWordIndexes.includes(index)) return;
    triggerSelectionHaptic();
    setSelectedWordIndexes(current => [...current, index]);
  }, [userAnswer, selectedWordIndexes]);

  const handleSelectedWordPress = useCallback((position: number) => {
    if (selectedWordDrag.shouldIgnorePress()) return;
    if (userAnswer !== '') return;
    triggerSelectionHaptic();
    setSelectedWordIndexes(current => current.filter((_, index) => index !== position));
  }, [selectedWordDrag, userAnswer]);

  const handleClear = useCallback(() => {
    if (userAnswer !== '' || selectedWordIndexes.length === 0) return;
    triggerSelectionHaptic();
    setSelectedWordIndexes([]);
  }, [userAnswer, selectedWordIndexes.length]);

  const handleSubmit = useCallback(async () => {
    if (!exercise || userAnswer !== '' || typeof exercise.answer !== 'string') return;

    const answer = selectedWordIndexes
      .map(index => wordBank.find(option => option.index === index)?.word)
      .filter(Boolean)
      .join(' ');
    const isCorrect = normalizeAnswer(answer) === normalizeAnswer(exercise.answer);

    if (isCorrect) {
      await onCorrect(exercise.answer);
    } else {
      onIncorrect('translate');
    }
  }, [exercise, userAnswer, selectedWordIndexes, wordBank, onCorrect, onIncorrect]);

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
          applyCompactStyles && styles.translateCardCompact,
          isDesktopWeb && styles.translateCardDesktopWeb,
          {
            minHeight: translateCardMinHeight,
            backgroundColor: grammarGame.panelSurface,
            borderColor: grammarGame.panelBorder,
            borderBottomColor: grammarGame.panelBottom,
            shadowColor: grammarGame.panelShadow,
            shadowOpacity: isDarkMode ? 0.22 : 0.08,
            shadowRadius: isDarkMode ? 9 : 6,
            elevation: isDarkMode ? 4 : 2,
          },
          incorrectAnswer === 'translate' && [
            wordBankStyles.incorrectOption,
            {
              backgroundColor: grammarGame.incorrectSurface,
              borderColor: grammarGame.incorrectBorder,
              borderBottomColor: grammarGame.incorrectBottom,
            },
          ],
        ]}
      >
        <View
          style={[
            wordBankStyles.answerTray,
            applyCompactStyles && wordBankStyles.answerTrayCompact,
            isDesktopWeb && styles.answerTrayDesktopWeb,
            {
              minHeight: answerTrayMinHeight,
              backgroundColor: grammarGame.answerSurface,
              borderColor: grammarGame.answerBorder,
              borderBottomColor: grammarGame.answerBottom,
            },
            incorrectAnswer === 'translate' && [
              wordBankStyles.answerTrayIncorrect,
              {
                backgroundColor: grammarGame.incorrectSurface,
                borderColor: grammarGame.incorrectBorder,
                borderBottomColor: grammarGame.incorrectBottom,
              },
            ],
          ]}
        >
          {hasSelectedWords && userAnswer === '' && (
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Clear answer"
              onPress={handleClear}
              activeOpacity={0.78}
              style={[
                wordBankStyles.clearAnswerButton,
                {
                  backgroundColor: grammarGame.incorrectBorder,
                  borderColor: grammarGame.incorrectBottom,
                },
              ]}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <MaterialIcons name="close" size={18} color="#fff" />
            </TouchableOpacity>
          )}
          <View
            style={[
              wordBankStyles.selectedWordsRow,
              applyCompactStyles && wordBankStyles.selectedWordsRowCompact,
              hasSelectedWords && userAnswer === '' && wordBankStyles.selectedWordsRowWithClear,
              { minHeight: selectedWordsMinHeight, gap: selectedWordsGap },
            ]}
          >
            {selectedWordIndexes.length === 0 ? (
              <Text style={[wordBankStyles.answerPlaceholderText, { color: grammarGame.metaText }]}>
                Tap the words to build your answer
              </Text>
            ) : (
              selectedWordIndexes.map((wordIndex, position) => {
                const selectedWord = wordBank.find(option => option.index === wordIndex)?.word;
                if (!selectedWord) return null;

                const isBeingDragged = draggingPosition === position;
                const isDropTarget = dropTargetPosition === position && !isBeingDragged;
                return (
                  <Animated.View
                    key={`${wordIndex}-${position}`}
                    {...selectedWordDrag.getPanHandlers(position)}
                    onLayout={(event) => selectedWordDrag.handleChipLayout(position, event)}
                    style={[
                      wordBankStyles.selectedWordDragWrap,
                      selectedWordDrag.getDragStyle(position),
                      draggingPosition !== null && !isBeingDragged && wordBankStyles.siblingChipDuringDrag,
                    ]}
                  >
                    <TouchableOpacity
                      accessibilityRole="button"
                      accessibilityLabel={`Move or remove word ${selectedWord}`}
                      onPress={() => handleSelectedWordPress(position)}
                      activeOpacity={0.84}
                      style={[
                        wordBankStyles.selectedWordChip,
                        applyCompactStyles && wordBankStyles.selectedWordChipCompact,
                        isDesktopWeb && wordBankStyles.selectedWordChipDesktopWeb,
                        { paddingVertical: chipVerticalPadding, paddingHorizontal: chipHorizontalPadding },
                        {
                          backgroundColor: grammarGame.selectedWordSurface,
                          borderColor: grammarGame.selectedWordBorder,
                          borderBottomColor: grammarGame.selectedWordBottom,
                        },
                        isDropTarget && wordBankStyles.dropTargetChip,
                      ]}
                    >
                      <Text style={[
                        wordBankStyles.selectedWordChipText,
                        applyCompactStyles && wordBankStyles.selectedWordChipTextCompact,
                        isDesktopWeb && wordBankStyles.selectedWordChipTextDesktopWeb,
                        { fontSize: wordChipFontSize },
                        { color: grammarGame.selectedWordText },
                      ]}>{selectedWord}</Text>
                    </TouchableOpacity>
                  </Animated.View>
                );
              })
            )}
          </View>
        </View>

        <View style={wordBankStyles.dividerRow}>
          <View style={[wordBankStyles.dividerLine, { backgroundColor: grammarGame.wordBankBorder }]} />
          <Text style={[wordBankStyles.dividerLabel, { color: grammarGame.metaText }]}>Word bank</Text>
          <View style={[wordBankStyles.dividerLine, { backgroundColor: grammarGame.wordBankBorder }]} />
        </View>
        <View style={[wordBankStyles.wordBankPanel, applyCompactStyles && wordBankStyles.wordBankPanelCompact, {
          padding: wordBankPanelPadding,
          backgroundColor: grammarGame.wordBankSurface,
          borderColor: grammarGame.wordBankBorder,
        }]}>
          <View style={[wordBankStyles.wordBank, { gap: wordBankGap }]}>
            {wordBank.map(({ word, index }) => {
              const isSelected = selectedWordIndexes.includes(index);

              return (
                <TouchableOpacity
                  key={`${word}-${index}`}
                  accessibilityRole="button"
                  accessibilityLabel={`${isSelected ? 'Selected word' : 'Add word'} ${word}`}
                  accessibilityState={{ disabled: isSelected || userAnswer !== '', selected: isSelected }}
                  onPress={() => handleWordPress(index)}
                  activeOpacity={0.84}
                  disabled={isSelected || userAnswer !== ''}
                  style={[
                    wordBankStyles.wordChip,
                    applyCompactStyles && wordBankStyles.wordChipCompact,
                    isDesktopWeb && wordBankStyles.wordChipDesktopWeb,
                    { paddingVertical: chipVerticalPadding, paddingHorizontal: chipHorizontalPadding },
                    {
                      backgroundColor: grammarGame.wordChipSurface,
                      borderColor: grammarGame.wordChipBorder,
                      borderBottomColor: grammarGame.wordChipBottom,
                      shadowColor: isDarkMode ? grammarGame.wordChipBottom : grammarGame.panelShadow,
                      shadowOpacity: isDarkMode ? 0.1 : 0.08,
                    },
                    isSelected && wordBankStyles.disabledWordChip,
                  ]}
                >
                  <Text style={[
                    wordBankStyles.wordChipText,
                    applyCompactStyles && wordBankStyles.wordChipTextCompact,
                    isDesktopWeb && wordBankStyles.wordChipTextDesktopWeb,
                    { fontSize: wordChipFontSize },
                    { color: grammarGame.wordChipText },
                    isSelected && [wordBankStyles.disabledWordChipText, { color: grammarGame.metaText }],
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
            wordBankStyles.checkAnswerButton,
            applyCompactStyles && wordBankStyles.checkAnswerButtonCompact,
            isDesktopWeb && wordBankStyles.checkAnswerButtonDesktopWeb,
            isDesktopWeb && { minHeight: scaleValue(54, webScale) },
            getPrimaryButtonStyle(colors, isDarkMode),
            disabled && wordBankStyles.disabledCheckAnswerButton,
          ]}
        >
          <View style={wordBankStyles.checkAnswerButtonInner}>
            <MaterialIcons name="check" size={isDesktopWeb ? scaleValue(20, webScale) : 20} color={colors.buttonText} />
            <Text style={[wordBankStyles.checkAnswerButtonText, { color: colors.buttonText }, isDesktopWeb && { fontSize: scaleValue(16, webScale) }]}>Check</Text>
          </View>
        </TouchableOpacity>
        {incorrectAnswer === 'translate' && (
          <Text style={[wordBankStyles.exerciseErrorText, { color: grammarGame.incorrectText }]}>Not quite. Try again.</Text>
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
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderBottomWidth: 3,
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
    padding: 18,
  },
  answerTrayDesktopWeb: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 14,
    marginBottom: 6,
  },
});
