import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Platform, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import {
  CARD_HEIGHT,
  Exercise,
  computeWordDensity,
  matchAnswerChips,
  normalizeAnswer,
  tokenizeTranslateAnswer,
} from './GrammarExerciseUtils';
import { getWebLessonScale, scaleValue } from '../../shared/responsiveLayout';
import { getGrammarGameColors, getPrimaryButtonStyle } from '../../shared/uiPrimitives';
import { triggerSelectionHaptic } from '../../shared/haptics';
import type { ThemeColors } from '../../settings/ThemeContext';
import { useSelectedWordDrag } from './useSelectedWordDrag';
import DraggableWordChip from './DraggableWordChip';
import { BLANK_SLOT_WIDTH, wordBankStyles } from './grammarExerciseStyles';

interface GrammarTranslateExerciseProps {
  exercise?: Exercise;
  colors: ThemeColors;
  isDarkMode: boolean;
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

// Chips freshly added to the answer tray mount with no transition by default;
// this fades + scales them in so tapping a word feels like it lands, not teleports.
const TrayChipEntrance: React.FC<{ children: React.ReactNode; style?: any }> = ({ children, style }) => {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(progress, {
      toValue: 1,
      useNativeDriver: Platform.OS !== 'web',
      speed: 22,
      bounciness: 6,
    }).start();
  }, [progress]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: progress,
          transform: [{ scale: progress.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] }) }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
};

// Fades a word-bank chip to its "used" state instead of the instant opacity/color
// swap React Native applies to a plain style-array change.
const WordBankChipFade: React.FC<{ used: boolean; children: React.ReactNode; style?: any }> = ({ used, children, style }) => {
  const opacity = useRef(new Animated.Value(used ? 0.3 : 1)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: used ? 0.3 : 1,
      duration: 180,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, [opacity, used]);

  return <Animated.View style={[style, { opacity }]}>{children}</Animated.View>;
};

const GrammarTranslateExercise: React.FC<GrammarTranslateExerciseProps> = ({
  exercise,
  colors,
  isDarkMode,
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
  const selectedWordDrag = useSelectedWordDrag<number>(selectedWordIndexes.length, setSelectedWordIndexes);
  const { draggingPosition, dropTargetPosition } = selectedWordDrag;
  const wordBank = useMemo(() => {
    const words = exercise?.wordBank ?? (typeof exercise?.answer === 'string' ? tokenizeTranslateAnswer(exercise.answer) : []);
    return words.map((word, index) => ({ word, index }));
  }, [exercise?.answer, exercise?.wordBank]);
  // No forced percentage-of-screen floor here — the tray and word-bank card
  // below both size themselves from their actual content, and stacking a
  // large minHeight on top of that just padded the card with empty space.
  const translateCardMinHeight = 0;
  const answerTrayMinHeight = 0;
  const wordCount = wordBank.length;
  const wordCharacterCount = wordBank.reduce((total, option) => total + option.word.length, 0);
  const isNarrowWordLayout = width < 390;
  const wordDensity = computeWordDensity(wordCount, wordCharacterCount, isDesktopWeb, isNarrowWordLayout);
  // Mobile (native + mobile web) chips run a size tier smaller than desktop web
  // so more of them fit per row across the full screen width.
  const chipVerticalPadding = isDesktopWeb
    ? scaleValue(wordDensity === 0 ? 16 : wordDensity === 1 ? 15 : 13, webScale)
    : wordDensity === 0 ? 11 : wordDensity === 1 ? 10 : 9;
  const chipHorizontalPadding = isDesktopWeb
    ? scaleValue(wordDensity === 0 ? 22 : wordDensity === 1 ? 20 : 17, webScale)
    : wordDensity === 0 ? 15 : wordDensity === 1 ? 13 : 12;
  const wordChipFontSize = isDesktopWeb
    ? scaleValue(wordDensity === 0 ? 21 : wordDensity === 1 ? 19 : 18, webScale)
    : wordDensity === 0 ? 17 : wordDensity === 1 ? 15 : 14;
  const wordBankGap = isDesktopWeb ? scaleValue(10, webScale) : wordDensity === 0 ? 8 : wordDensity === 1 ? 7 : 6;
  const selectedWordsGap = isDesktopWeb ? scaleValue(10, webScale) : wordDensity === 0 ? 7 : wordDensity === 1 ? 6 : 5;
  const grammarGame = getGrammarGameColors(colors, isDarkMode);
  // wordBank includes distractor chips, and some chips span multiple words
  // (e.g. "to the left"), so the slot count can't just be the answer's raw
  // word count — match actual bank chips against the answer to find how many
  // taps are really needed.
  const matchedAnswerWords = useMemo(() => {
    if (typeof exercise?.answer !== 'string') return [];
    return matchAnswerChips(exercise.answer, wordBank.map(option => option.word)).matchedWords;
  }, [exercise?.answer, wordBank]);
  const totalSlots = matchedAnswerWords.length > 0 || typeof exercise?.answer === 'string'
    ? matchedAnswerWords.length
    : selectedWordIndexes.length;
  const blankSlotCount = Math.max(0, totalSlots - selectedWordIndexes.length);
  // Both blanks and real chips must reserve the exact same row space so the
  // tray never grows or shrinks as the user selects words — derive the
  // reserved height only from the (fixed) answer/word bank, never from the
  // live selection.
  const trayHorizontalPadding = isDesktopWeb ? 26 : 16;
  const clearButtonReserve = 44;
  // GrammarQuiz's own exerciseContainer wraps this component with its own
  // horizontal padding (8px/side on mobile for translate mode specifically) —
  // that width is gone before this component ever renders, so it must be
  // subtracted here too or the tray's own width estimate runs wider than what
  // actually renders, letting blanks/chips overflow into an extra wrapped row.
  const outerContainerPadding = isDesktopWeb ? 0 : 8;
  const trayContentWidth = (isDesktopWeb ? Math.min(620, width) : width) - outerContainerPadding * 2 - trayHorizontalPadding * 2 - clearButtonReserve;
  const selectedChipRowHeight = isDesktopWeb ? scaleValue(54, webScale) : 54;
  // On mobile, blank/answer slots stretch to fill the tray's full width instead of
  // sitting at a fixed 92px — a fixed width only ever fit 2-3 per row on a phone,
  // leaving the rest of the row empty. Rows target a fixed item count instead, and
  // each slot's width is derived from that, so a full row always reaches both edges.
  const mobileRowTarget = isNarrowWordLayout ? 3 : 4;
  const itemsPerRow = isDesktopWeb
    ? Math.max(1, Math.floor((trayContentWidth + selectedWordsGap) / (BLANK_SLOT_WIDTH + selectedWordsGap)))
    : Math.max(1, Math.min(mobileRowTarget, totalSlots || mobileRowTarget));
  const blankSlotWidth = isDesktopWeb
    ? BLANK_SLOT_WIDTH
    : Math.max(48, Math.floor((trayContentWidth - (itemsPerRow - 1) * selectedWordsGap) / itemsPerRow));
  const wrappedRows = Math.min(3, Math.max(1, Math.ceil(totalSlots / itemsPerRow)));
  const selectedWordsMinHeight = wrappedRows * selectedChipRowHeight + (wrappedRows - 1) * selectedWordsGap;

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

  const trayShakeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (incorrectAnswer !== 'translate') return;
    trayShakeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(trayShakeAnim, { toValue: -8, duration: 45, useNativeDriver: Platform.OS !== 'web' }),
      Animated.timing(trayShakeAnim, { toValue: 8, duration: 90, useNativeDriver: Platform.OS !== 'web' }),
      Animated.timing(trayShakeAnim, { toValue: -6, duration: 80, useNativeDriver: Platform.OS !== 'web' }),
      Animated.timing(trayShakeAnim, { toValue: 6, duration: 70, useNativeDriver: Platform.OS !== 'web' }),
      Animated.timing(trayShakeAnim, { toValue: 0, duration: 60, useNativeDriver: Platform.OS !== 'web' }),
    ]).start();
  }, [incorrectAnswer, trayShakeAnim]);

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
        style={[wordBankStyles.wordBankOuterWrap, { minHeight: translateCardMinHeight }]}
      >
        <Animated.View
          style={[
            wordBankStyles.answerTray,
            isDesktopWeb && styles.answerTrayDesktopWeb,
            !isDesktopWeb && { paddingHorizontal: trayHorizontalPadding },
            {
              minHeight: answerTrayMinHeight,
              backgroundColor: 'transparent',
              borderTopWidth: 0,
              borderRadius: 0,
            },
            incorrectAnswer === 'translate' && [
              wordBankStyles.answerTrayIncorrect,
              { backgroundColor: grammarGame.incorrectSurface },
            ],
            { transform: [{ translateX: trayShakeAnim }] },
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
              wordBankStyles.selectedWordsRowWithClear,
              { minHeight: selectedWordsMinHeight, gap: selectedWordsGap },
            ]}
          >
            {selectedWordIndexes.map((wordIndex, position) => {
              const selectedWord = wordBank.find(option => option.index === wordIndex)?.word;
              if (!selectedWord) return null;

              const isBeingDragged = draggingPosition === position;
              const isDropTarget = dropTargetPosition === position && !isBeingDragged;
              return (
                <DraggableWordChip
                  key={wordIndex}
                  position={position}
                  disabled={userAnswer !== ''}
                  onLayoutMeasured={selectedWordDrag.handleChipLayout}
                  onDragStart={selectedWordDrag.handleDragStart}
                  onDragMove={selectedWordDrag.handleDragMove}
                  onDragEnd={selectedWordDrag.handleDragEnd}
                  style={[
                    wordBankStyles.selectedWordDragWrap,
                    draggingPosition !== null && !isBeingDragged && wordBankStyles.siblingChipDuringDrag,
                  ]}
                >
                  <TrayChipEntrance>
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel={`Move or remove word ${selectedWord}`}
                    onPress={() => handleSelectedWordPress(position)}
                    activeOpacity={0.84}
                    style={[
                      wordBankStyles.selectedWordChip,
                      isDesktopWeb && wordBankStyles.selectedWordChipDesktopWeb,
                      {
                        backgroundColor: grammarGame.selectedWordSurface,
                      },
                      isDropTarget && wordBankStyles.dropTargetChip,
                    ]}
                  >
                    <Text style={[
                      wordBankStyles.selectedWordChipText,
                      isDesktopWeb && wordBankStyles.selectedWordChipTextDesktopWeb,
                      { color: grammarGame.selectedWordText },
                    ]}>{selectedWord}</Text>
                  </TouchableOpacity>
                  </TrayChipEntrance>
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
        </Animated.View>

        <View
          style={[
            wordBankStyles.wordBankCard,
            isDesktopWeb && styles.translateCardDesktopWeb,
            // Mobile/APK: trim the card's own padding so the word bank uses close to
            // the full screen width instead of the roomier desktop-web spacing.
            !isDesktopWeb && { padding: 10 },
            {
              backgroundColor: 'transparent',
              boxShadow: 'none',
              elevation: 0,
            },
          ]}
        >
          <View
            style={[
              wordBankStyles.wordBankPanel,
              !isDesktopWeb && { padding: 10 },
              { backgroundColor: grammarGame.wordBankSurface, borderColor: grammarGame.wordBankBorder },
            ]}
          >
            <View style={[wordBankStyles.wordBank, { gap: wordBankGap }]}>
              {wordBank.map(({ word, index }) => {
                const isSelected = selectedWordIndexes.includes(index);

                return (
                  <WordBankChipFade key={`${word}-${index}`} used={isSelected}>
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel={`${isSelected ? 'Selected word' : 'Add word'} ${word}`}
                    accessibilityState={{ disabled: isSelected || userAnswer !== '', selected: isSelected }}
                    onPress={() => handleWordPress(index)}
                    activeOpacity={0.84}
                    disabled={isSelected || userAnswer !== ''}
                    style={[
                      wordBankStyles.wordChip,
                      isDesktopWeb && wordBankStyles.wordChipDesktopWeb,
                      { paddingVertical: chipVerticalPadding, paddingHorizontal: chipHorizontalPadding },
                      {
                        backgroundColor: grammarGame.wordChipSurface,
                        boxShadow: isDarkMode
                          ? '0px 2px 4px rgba(0,0,0,0.20)'
                          : '0px 2px 4px rgba(0,0,0,0.08)',
                      },
                    ]}
                  >
                    <Text style={[
                      wordBankStyles.wordChipText,
                      isDesktopWeb && wordBankStyles.wordChipTextDesktopWeb,
                      { fontSize: wordChipFontSize },
                      { color: grammarGame.wordChipText },
                      isSelected && [wordBankStyles.disabledWordChipText, { color: grammarGame.metaText }],
                    ]}>{word}</Text>
                  </TouchableOpacity>
                  </WordBankChipFade>
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
              isDesktopWeb && wordBankStyles.checkAnswerButtonDesktopWeb,
              isDesktopWeb && { minHeight: scaleValue(54, webScale) },
              getPrimaryButtonStyle(colors, isDarkMode),
              { backgroundColor: grammarGame.checkButtonBg, borderColor: grammarGame.checkButtonBg, borderWidth: 0 },
              disabled && wordBankStyles.disabledCheckAnswerButton,
            ]}
          >
            <View style={wordBankStyles.checkAnswerButtonInner}>
              <MaterialIcons name="check" size={isDesktopWeb ? scaleValue(22, webScale) : 22} color="#fff" />
              <Text style={[wordBankStyles.checkAnswerButtonText, { color: '#fff' }, isDesktopWeb && { fontSize: scaleValue(18, webScale) }]}>Check</Text>
            </View>
          </TouchableOpacity>
          {incorrectAnswer === 'translate' && (
            <Text style={[wordBankStyles.exerciseErrorText, { color: grammarGame.incorrectText }]}>Not quite. Try again.</Text>
          )}
        </View>
      </View>
    </View>
  );
};

export default GrammarTranslateExercise;

const styles = StyleSheet.create({
  translateContainer: {
    minHeight: CARD_HEIGHT,
  },
  translateCardDesktopWeb: {
    padding: 26,
  },
  answerTrayDesktopWeb: {
    paddingHorizontal: 26,
    paddingTop: 16,
    paddingBottom: 24,
  },
});
