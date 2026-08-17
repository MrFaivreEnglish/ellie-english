import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { CARD_HEIGHT, Exercise, computeWordDensity, normalizeAnswer, shuffle } from './GrammarExerciseUtils';
import { getWebLessonScale, scaleValue } from '../../shared/responsiveLayout';
import { getGrammarGameColors } from '../../shared/uiPrimitives';
import { triggerSelectionHaptic } from '../../shared/haptics';
import type { ThemeColors } from '../../settings/ThemeContext';
import { useSelectedWordDrag } from './useSelectedWordDrag';
import DraggableWordChip from './DraggableWordChip';
import { BLANK_SLOT_WIDTH, wordBankStyles } from './grammarExerciseStyles';

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
  const selectedWordDrag = useSelectedWordDrag<string>(selectedWordIds.length, setSelectedWordIds);
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
  // No forced percentage-of-screen floor here — the tray and word-bank card
  // below both size themselves from their actual content, and stacking a
  // large minHeight on top of that just padded the card with empty space.
  const cardMinHeight = 0;
  const answerTrayMinHeight = 0;
  const wordCount = shuffledWordOptions.length;
  const wordCharacterCount = shuffledWordOptions.reduce((total, option) => total + option.word.length, 0);
  const isNarrowWordLayout = width < 390 || compact;
  const wordDensity = computeWordDensity(wordCount, wordCharacterCount, isDesktopWeb, isNarrowWordLayout);
  const chipVerticalPadding = isDesktopWeb
    ? scaleValue(wordDensity === 0 ? 16 : wordDensity === 1 ? 15 : 13, webScale)
    : isAndroid
      ? compact
        ? wordDensity === 0 ? 13 : wordDensity === 1 ? 11 : 10
        : wordDensity === 0 ? 18 : wordDensity === 1 ? 16 : 14
      : compact
        ? isWeb
          ? wordDensity === 0 ? 15 : wordDensity === 1 ? 13 : 11
          : wordDensity === 0 ? 12 : wordDensity === 1 ? 10 : 9
        : wordDensity === 0 ? 17 : wordDensity === 1 ? 15 : 13;
  const chipHorizontalPadding = isDesktopWeb
    ? scaleValue(wordDensity === 0 ? 22 : wordDensity === 1 ? 20 : 17, webScale)
    : isAndroid
      ? compact
        ? wordDensity === 0 ? 17 : wordDensity === 1 ? 15 : 13
        : wordDensity === 0 ? 24 : wordDensity === 1 ? 21 : 19
      : compact
        ? isWeb
          ? wordDensity === 0 ? 19 : wordDensity === 1 ? 16 : 14
          : wordDensity === 0 ? 15 : wordDensity === 1 ? 13 : 12
        : wordDensity === 0 ? 23 : wordDensity === 1 ? 20 : 18;
  const wordChipFontSize = isDesktopWeb
    ? scaleValue(wordDensity === 0 ? 21 : wordDensity === 1 ? 19 : 18, webScale)
    : compact
      ? isWeb
        ? wordDensity === 0 ? 19 : wordDensity === 1 ? 17 : 16
        : wordDensity === 0 ? 18 : wordDensity === 1 ? 16 : 15
      : wordDensity === 0 ? 20 : wordDensity === 1 ? 18 : 17;
  const wordBankGap = isDesktopWeb ? scaleValue(10, webScale) : wordDensity === 0 ? 8 : wordDensity === 1 ? 7 : 6;
  const selectedWordsGap = isDesktopWeb ? scaleValue(10, webScale) : wordDensity === 0 ? 7 : wordDensity === 1 ? 6 : 5;
  const grammarGame = getGrammarGameColors(colors, isDarkMode);
  const totalSlots = shuffledWordOptions.length;
  const blankSlotCount = Math.max(0, totalSlots - selectedWordIds.length);
  // Both blanks and real chips must reserve the exact same row space so the
  // tray never grows or shrinks as the user selects words — derive the
  // reserved height only from the (fixed) word list, never from the live
  // selection.
  const trayHorizontalPadding = isDesktopWeb ? 26 : applyCompactStyles ? 16 : 24;
  const clearButtonReserve = 44;
  const trayContentWidth = (isDesktopWeb ? Math.min(620, width) : width) - trayHorizontalPadding * 2 - clearButtonReserve;
  const selectedChipRowHeight = isDesktopWeb ? scaleValue(54, webScale) : applyCompactStyles ? 50 : 54;
  // On narrow phones, shrink the blank slots so more fit per row — otherwise
  // the fixed BLANK_SLOT_WIDTH leaves the tray under-filled and wraps into
  // more lines than the screen width actually requires.
  const blankSlotWidth = isNarrowWordLayout
    ? (wordDensity === 2 ? 72 : wordDensity === 1 ? 82 : BLANK_SLOT_WIDTH)
    : BLANK_SLOT_WIDTH;
  // Blanks always render at blankSlotWidth, so that (not each word's real
  // text width) is what determines how many fit per row — matches what's
  // actually on screen at rest instead of over-reserving for wider chips.
  const itemsPerRow = Math.max(1, Math.floor((trayContentWidth + selectedWordsGap) / (blankSlotWidth + selectedWordsGap)));
  const wrappedRows = Math.min(3, Math.max(1, Math.ceil(totalSlots / itemsPerRow)));
  const selectedWordsMinHeight = wrappedRows * selectedChipRowHeight + (wrappedRows - 1) * selectedWordsGap;

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
        style={[wordBankStyles.wordBankOuterWrap, { minHeight: cardMinHeight }]}
      >
        <View
          style={[
            wordBankStyles.answerTray,
            applyCompactStyles && wordBankStyles.answerTrayCompact,
            isDesktopWeb && styles.answerTrayDesktopWeb,
            {
              minHeight: answerTrayMinHeight,
              backgroundColor: 'transparent',
              borderTopWidth: 0,
              borderRadius: 0,
              shadowOpacity: 0,
              elevation: 0,
            },
            incorrectAnswer === 'reorder' && [
              wordBankStyles.answerTrayIncorrect,
              { backgroundColor: grammarGame.incorrectSurface },
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
                  backgroundColor: 'rgba(255,255,255,0.18)',
                  borderColor: 'rgba(255,255,255,0.4)',
                },
              ]}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <MaterialIcons name="close" size={16} color="#fff" />
            </TouchableOpacity>
          )}
          <View
            style={[
              wordBankStyles.selectedWordsRow,
              applyCompactStyles && wordBankStyles.selectedWordsRowCompact,
              wordBankStyles.selectedWordsRowWithClear,
              { minHeight: selectedWordsMinHeight, gap: selectedWordsGap },
            ]}
          >
            {selectedWordIds.map((wordId, position) => {
              const selectedWord = shuffledWordOptions.find(option => option.id === wordId)?.word;
              if (!selectedWord) return null;

              const isBeingDragged = draggingPosition === position;
              const isDropTarget = dropTargetPosition === position && !isBeingDragged;
              return (
                <DraggableWordChip
                  key={wordId}
                  position={position}
                  disabled={userAnswer !== '' || isSubmitLocked}
                  onLayoutMeasured={selectedWordDrag.handleChipLayout}
                  onDragStart={selectedWordDrag.handleDragStart}
                  onDragMove={selectedWordDrag.handleDragMove}
                  onDragEnd={selectedWordDrag.handleDragEnd}
                  style={[
                    wordBankStyles.selectedWordDragWrap,
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
                      {
                        backgroundColor: grammarGame.selectedWordSurface,
                      },
                      isDropTarget && wordBankStyles.dropTargetChip,
                    ]}
                  >
                    <Text style={[
                      wordBankStyles.selectedWordChipText,
                      applyCompactStyles && wordBankStyles.selectedWordChipTextCompact,
                      isDesktopWeb && wordBankStyles.selectedWordChipTextDesktopWeb,
                      { color: grammarGame.selectedWordText },
                    ]}>
                      {selectedWord}
                    </Text>
                  </TouchableOpacity>
                </DraggableWordChip>
              );
            })}
            {Array.from({ length: blankSlotCount }).map((_, index) => (
              <View
                key={`blank-${index}`}
                style={[wordBankStyles.blankSlot, { width: blankSlotWidth, borderColor: grammarGame.blankSlotColor }]}
              />
            ))}
          </View>
        </View>
        <View
          style={[
            wordBankStyles.wordBankCard,
            applyCompactStyles && wordBankStyles.wordBankCardCompact,
            isDesktopWeb && styles.reorderCardDesktopWeb,
            {
              backgroundColor: 'transparent',
              shadowOpacity: 0,
              elevation: 0,
            },
          ]}
        >
          <View
            style={[
              wordBankStyles.wordBankPanel,
              applyCompactStyles && wordBankStyles.wordBankPanelCompact,
              { backgroundColor: grammarGame.wordBankSurface, borderColor: grammarGame.wordBankBorder },
            ]}
          >
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
                        shadowColor: isDarkMode ? '#000' : grammarGame.panelShadow,
                        shadowOpacity: isDarkMode ? 0.2 : 0.08,
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
              isDesktopWeb && { minHeight: scaleValue(50, webScale) },
              { backgroundColor: grammarGame.checkButtonBg, borderColor: grammarGame.checkButtonBg, borderWidth: 0 },
              disabled && wordBankStyles.disabledCheckAnswerButton,
            ]}
          >
            <View style={wordBankStyles.checkAnswerButtonInner}>
              <MaterialIcons name="check" size={isDesktopWeb ? scaleValue(22, webScale) : 22} color="#fff" />
              <Text style={[wordBankStyles.checkAnswerButtonText, { color: '#fff' }, isDesktopWeb && { fontSize: scaleValue(18, webScale) }]}>Check</Text>
            </View>
          </TouchableOpacity>
          {incorrectAnswer === 'reorder' && (
            <Text style={[wordBankStyles.exerciseErrorText, { color: grammarGame.incorrectText }]}>Try again.</Text>
          )}
        </View>
      </View>
    </View>
  );
};

export default GrammarReorderExercise;

const styles = StyleSheet.create({
  reorderContainer: {
    minHeight: CARD_HEIGHT,
  },
  reorderCardDesktopWeb: {
    padding: 26,
  },
  answerTrayDesktopWeb: {
    paddingHorizontal: 24,
    paddingTop: 14,
    paddingBottom: 20,
  },
});
