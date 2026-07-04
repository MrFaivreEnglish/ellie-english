import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Platform, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { CARD_HEIGHT, Exercise, computeWordDensity, normalizeAnswer, shuffle } from './GrammarExerciseUtils';
import { clampNumber, getWebLessonScale, scaleValue } from '../../shared/responsiveLayout';
import { getGrammarGameColors, getPrimaryButtonStyle } from '../../shared/uiPrimitives';
import { triggerSelectionHaptic } from '../../shared/haptics';
import type { ThemeColors } from '../../settings/ThemeContext';
import { useSelectedWordDrag } from './useSelectedWordDrag';
import { wordBankStyles } from './grammarExerciseStyles';

interface GrammarReorderExerciseProps {
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

const GrammarReorderExercise: React.FC<GrammarReorderExerciseProps> = ({
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
  const [selectedWordIds, setSelectedWordIds] = useState<string[]>([]);
  const [isSubmitLocked, setIsSubmitLocked] = useState(false);
  const selectedWordDrag = useSelectedWordDrag<string>(selectedWordIds.length, setSelectedWordIds, userAnswer !== '' || isSubmitLocked);
  const { draggingPosition, dropTargetPosition } = selectedWordDrag;
  const unlockTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const words = exercise?.words ?? [];
  const wordsKey = words.join('');
  const baseWordOptions = useMemo(() => {
    return exercise?.reorderWordBank ?? words.map((word, index) => ({ id: `${index}`, word }));
  }, [exercise?.reorderWordBank, wordsKey]);
  const shuffledWordOptions = useMemo(() => {
    if (baseWordOptions.length < 2) return baseWordOptions;

    const isOriginalOrder = (options: typeof baseWordOptions) =>
      options.every((option, position) => option.id === baseWordOptions[position]?.id);

    for (let attempt = 0; attempt < 12; attempt++) {
      const shuffled = shuffle(baseWordOptions);
      if (!isOriginalOrder(shuffled)) return shuffled;
    }

    return [baseWordOptions[1], baseWordOptions[0], ...baseWordOptions.slice(2)];
  }, [baseWordOptions]);

  useEffect(() => {
    if (unlockTimeoutRef.current) {
      clearTimeout(unlockTimeoutRef.current);
      unlockTimeoutRef.current = null;
    }
    setSelectedWordIds([]);
    setIsSubmitLocked(false);
  }, [exercise?.question, exercise?.answer]);

  useEffect(() => {
    return () => {
      if (unlockTimeoutRef.current) {
        clearTimeout(unlockTimeoutRef.current);
      }
    };
  }, []);

  const handleWordPress = useCallback((id: string) => {
    if (userAnswer !== '' || isSubmitLocked || selectedWordIds.includes(id)) return;
    triggerSelectionHaptic();
    setSelectedWordIds(current => [...current, id]);
  }, [userAnswer, isSubmitLocked, selectedWordIds]);

  const handleSelectedWordPress = useCallback((position: number) => {
    if (selectedWordDrag.shouldIgnorePress()) return;
    if (userAnswer !== '' || isSubmitLocked) return;
    triggerSelectionHaptic();
    setSelectedWordIds(current => current.filter((_, index) => index !== position));
  }, [selectedWordDrag, userAnswer, isSubmitLocked]);

  const handleClear = useCallback(() => {
    if (userAnswer !== '' || isSubmitLocked || selectedWordIds.length === 0) return;
    triggerSelectionHaptic();
    setSelectedWordIds([]);
  }, [userAnswer, isSubmitLocked, selectedWordIds.length]);

  const handleSubmit = useCallback(async () => {
    if (!exercise || userAnswer !== '' || isSubmitLocked || typeof exercise.answer !== 'string' || !exercise.words) return;

    const answer = selectedWordIds
      .map(id => shuffledWordOptions.find(option => option.id === id)?.word)
      .filter(Boolean)
      .join(' ');
    const isCorrect = normalizeAnswer(answer) === normalizeAnswer(exercise.answer);

    if (isCorrect) {
      setIsSubmitLocked(true);
      await onCorrect(exercise.answer);
    } else {
      setIsSubmitLocked(true);
      onIncorrect('reorder');
      unlockTimeoutRef.current = setTimeout(() => {
        setIsSubmitLocked(false);
        unlockTimeoutRef.current = null;
      }, 900);
    }
  }, [exercise, userAnswer, isSubmitLocked, selectedWordIds, shuffledWordOptions, onCorrect, onIncorrect]);

  const disabled = userAnswer !== '' || isSubmitLocked || selectedWordIds.length === 0;
  const desktopCardMinHeight = Math.min(scaleValue(430, webScale), Math.max(scaleValue(360, webScale), Math.round(height * 0.48)));
  const androidCardMinHeight = Math.round(clampNumber(
    height * (compact ? 0.39 : 0.43),
    compact ? 286 : 320,
    compact ? 348 : 420
  ));
  const cardMinHeight = isDesktopWeb ? desktopCardMinHeight : isAndroid ? androidCardMinHeight : compact ? 236 : CARD_HEIGHT;
  const answerTrayMinHeight = isAndroid ? (compact ? 88 : 104) : compact ? 68 : isDesktopWeb ? scaleValue(126, webScale) : 92;
  const selectedWordsMinHeight = isAndroid ? (compact ? 70 : 82) : compact ? 56 : isDesktopWeb ? scaleValue(98, webScale) : 72;
  const wordCount = shuffledWordOptions.length;
  const wordCharacterCount = shuffledWordOptions.reduce((total, option) => total + option.word.length, 0);
  const isNarrowWordLayout = width < 390 || compact;
  const wordDensity = computeWordDensity(wordCount, wordCharacterCount, isDesktopWeb, isNarrowWordLayout);
  const wordBankPanelPadding = isDesktopWeb
    ? scaleValue(wordDensity === 0 ? 22 : wordDensity === 1 ? 20 : 16, webScale)
    : isAndroid
      ? compact
        ? wordDensity === 0 ? 12 : wordDensity === 1 ? 11 : 10
        : wordDensity === 0 ? 16 : wordDensity === 1 ? 14 : 12
      : compact
        ? wordDensity === 0 ? 9 : wordDensity === 1 ? 8 : 7
        : wordDensity === 0 ? 16 : wordDensity === 1 ? 14 : 12;
  const chipVerticalPadding = isDesktopWeb
    ? scaleValue(wordDensity === 0 ? 15 : wordDensity === 1 ? 13 : 11, webScale)
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
    ? scaleValue(wordDensity === 0 ? 20 : wordDensity === 1 ? 17 : 15, webScale)
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

  return (
    <View
      ref={optionsContainerRef}
      onLayout={(e) => onOptionsLayout(e.nativeEvent.layout.y)}
      style={[styles.reorderContainer, { minHeight: cardMinHeight }]}
    >
      <View
        ref={firstOptionRef}
        onLayout={(e) => {
          onFirstOptionLayout(e.nativeEvent.layout.y);
          onCardHeightChange?.(e.nativeEvent.layout.height);
        }}
        style={[
          styles.reorderCard,
          applyCompactStyles && styles.reorderCardCompact,
          isDesktopWeb && styles.reorderCardDesktopWeb,
          {
            minHeight: cardMinHeight,
            backgroundColor: grammarGame.panelSurface,
            borderColor: grammarGame.panelBorder,
            borderBottomColor: grammarGame.panelBottom,
            shadowColor: grammarGame.panelShadow,
            shadowOpacity: isDarkMode ? 0.22 : 0.08,
            shadowRadius: isDarkMode ? 9 : 6,
            elevation: isDarkMode ? 4 : 2,
          },
          incorrectAnswer === 'reorder' && [
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
            incorrectAnswer === 'reorder' && [
              wordBankStyles.answerTrayIncorrect,
              {
                backgroundColor: grammarGame.incorrectSurface,
                borderColor: grammarGame.incorrectBorder,
                borderBottomColor: grammarGame.incorrectBottom,
              },
            ],
          ]}
        >
          {selectedWordIds.length > 0 && userAnswer === '' && !isSubmitLocked && (
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
              selectedWordIds.length > 0 && userAnswer === '' && !isSubmitLocked && wordBankStyles.selectedWordsRowWithClear,
              { minHeight: selectedWordsMinHeight, gap: selectedWordsGap },
            ]}
          >
            {selectedWordIds.length === 0 ? (
              <Text style={[wordBankStyles.answerPlaceholderText, { color: grammarGame.metaText }]}>
                Tap the words to build your answer
              </Text>
            ) : (
              selectedWordIds.map((wordId, position) => {
                const selectedWord = shuffledWordOptions.find(option => option.id === wordId)?.word;
                if (!selectedWord) return null;

                const isBeingDragged = draggingPosition === position;
                const isDropTarget = dropTargetPosition === position && !isBeingDragged;
                return (
                  <Animated.View
                    key={`${wordId}-${position}`}
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
                      ]}>
                        {selectedWord}
                      </Text>
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
            {shuffledWordOptions.map(({ word, id }) => {
              const isSelected = selectedWordIds.includes(id);
              return (
                <TouchableOpacity
                  key={id}
                  accessibilityRole="button"
                  accessibilityLabel={`${isSelected ? 'Selected word' : 'Add word'} ${word}`}
                  accessibilityState={{ disabled: isSelected || userAnswer !== '', selected: isSelected }}
                  onPress={() => handleWordPress(id)}
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
        {incorrectAnswer === 'reorder' && (
          <Text style={[wordBankStyles.exerciseErrorText, { color: grammarGame.incorrectText }]}>Try again.</Text>
        )}
      </View>
    </View>
  );
};

export default GrammarReorderExercise;

const styles = StyleSheet.create({
  reorderContainer: {
    minHeight: CARD_HEIGHT,
  },
  reorderCard: {
    minHeight: CARD_HEIGHT,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderBottomWidth: 3,
    borderColor: '#E5E5E5',
    borderBottomColor: '#D1D5DB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
    justifyContent: 'flex-start',
  },
  reorderCardCompact: {
    padding: 10,
    borderBottomWidth: 3,
  },
  reorderCardDesktopWeb: {
    padding: 20,
  },
  answerTrayDesktopWeb: {
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 16,
    marginBottom: 6,
  },
});
