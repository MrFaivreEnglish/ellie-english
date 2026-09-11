import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Platform, StyleSheet, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import type { LayoutChangeEvent } from 'react-native';
import Text from '../../shared/ThemedText';
import MaterialIcons from '../../shared/ThemedMaterialIcon';
import {
  Exercise,
  matchAnswerChips,
  normalizeAnswer,
  tokenizeTranslateAnswer,
} from './GrammarExerciseUtils';
import { getGrammarGameColors, withColorAlpha } from '../../shared/uiPrimitives';
import { triggerSelectionHaptic } from '../../shared/haptics';
import { getWebLessonScale, isCompactViewport, isDesktopWebWidth, scaleValue } from '../../shared/responsiveLayout';
import { CHIP_DESKTOP_SCALE_ADJUSTMENT } from '../../shared/exerciseLayoutTokens';
import type { ThemeColors } from '../../settings/ThemeContext';
import { useSelectedWordDrag } from './useSelectedWordDrag';
import DraggableWordChip, { CHIP_DRAG_COMMIT_THRESHOLD_DY } from './DraggableWordChip';
import {
  CHIP_COMPACT_MAX_HEIGHT,
  CHIP_COMPACT_MAX_WIDTH,
  getCheckButtonMetrics,
  getChipMetrics,
  getChipPreset,
  TRANSLATE_CHIP_METRICS,
  wordBankStyles,
} from './grammarExerciseStyles';

interface GrammarTranslateExerciseProps {
  exercise?: Exercise;
  colors: ThemeColors;
  isDarkMode: boolean;
  layoutHeight?: number;





  availableHeight?: number;
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




          transform: [{ scale: progress.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] }) }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
};



const WordBankChipFade: React.FC<{ used: boolean; children: React.ReactNode; style?: any }> = ({ used, children, style }) => {
  const opacity = useRef(new Animated.Value(used ? 0.3 : 1)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: used ? 0.3 : 1,
      duration: 180,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, [opacity, used]);

  return (
    <Animated.View
      style={[style, { opacity }]}
    >
      {children}
    </Animated.View>
  );
};

const GrammarTranslateExercise: React.FC<GrammarTranslateExerciseProps> = ({
  exercise,
  colors,
  isDarkMode,
  layoutHeight,
  availableHeight,
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



  const isDesktopWeb = isDesktopWebWidth(width, undefined, height);
  const rawWebLessonScale = getWebLessonScale(width, height);
  // Chips/check button read visually oversized at the shared desktop scale (shared with
  // Reorder, which has the same word-bank shape).
  const webLessonScale = rawWebLessonScale > 1 ? rawWebLessonScale * CHIP_DESKTOP_SCALE_ADJUSTMENT : rawWebLessonScale;





  const isScaledLayout = isDesktopWeb || webLessonScale > 1;


  const availableStageHeight = availableHeight ?? layoutHeight ?? height;
  const isCompact = isCompactViewport(width, height, {
    widthThreshold: CHIP_COMPACT_MAX_WIDTH,
    heightThreshold: CHIP_COMPACT_MAX_HEIGHT,
  });
  const [selectedWordIndexes, setSelectedWordIndexes] = useState<number[]>([]);
  const selectedWordDrag = useSelectedWordDrag<number>(selectedWordIndexes.length, setSelectedWordIndexes);
  const { draggingPosition, dropTargetPosition } = selectedWordDrag;
  const wordBank = useMemo(() => {
    const words = exercise?.wordBank ?? (typeof exercise?.answer === 'string' ? tokenizeTranslateAnswer(exercise.answer) : []);
    return words.map((word, index) => ({ word, index }));
  }, [exercise?.answer, exercise?.wordBank]);

  const grammarGame = getGrammarGameColors(colors, isDarkMode);

  const matchedAnswerWords = useMemo(() => {
    if (typeof exercise?.answer !== 'string') return [];
    return matchAnswerChips(exercise.answer, wordBank.map(option => option.word)).matchedWords;
  }, [exercise?.answer, wordBank]);

  const totalSlots = matchedAnswerWords.length > 0 || typeof exercise?.answer === 'string'
    ? matchedAnswerWords.length
    : selectedWordIndexes.length;
  const blankSlotCount = Math.max(0, totalSlots - selectedWordIndexes.length);




  const [wordBankRowWidth, setWordBankRowWidth] = useState(0);
  const handleWordBankRowLayout = useCallback((event: LayoutChangeEvent) => {
    const nextWidth = event.nativeEvent.layout.width;



    setWordBankRowWidth(current => (Math.abs(current - nextWidth) > 1 ? nextWidth : current));
  }, []);






  const chipPreset = getChipPreset(TRANSLATE_CHIP_METRICS, width, height, webLessonScale);
  const chipWords = useMemo(() => wordBank.map(option => option.word), [wordBank]);
  const {
    fontSize: chipFontSize,
    paddingHorizontal: chipPaddingHorizontal,
    paddingVertical: chipPaddingVertical,
    minHeight: chipMinHeight,
  } = useMemo(
    () => getChipMetrics(chipPreset, chipWords, wordBankRowWidth),
    [chipPreset, chipWords, wordBankRowWidth],
  );
  const blankSlotWidth = isCompact ? 72 : isScaledLayout ? scaleValue(96, webLessonScale) : 84;
  const selectedWordsGap = isCompact ? 8 : scaleValue(10, webLessonScale);
  const wordBankGap = isCompact ? 8 : scaleValue(10, webLessonScale);
  const sectionGap = isCompact ? 8 : scaleValue(12, webLessonScale);
  const {
    height: checkHeight,
    fontSize: checkFontSize,
    iconSize: checkIconSize,
  } = getCheckButtonMetrics(width, availableStageHeight, height, webLessonScale);

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
      Animated.timing(trayShakeAnim, { toValue: -4, duration: 70, useNativeDriver: Platform.OS !== 'web' }),
      Animated.timing(trayShakeAnim, { toValue: 4, duration: 130, useNativeDriver: Platform.OS !== 'web' }),
      Animated.timing(trayShakeAnim, { toValue: -2, duration: 110, useNativeDriver: Platform.OS !== 'web' }),
      Animated.timing(trayShakeAnim, { toValue: 0, duration: 90, useNativeDriver: Platform.OS !== 'web' }),
    ]).start();
  }, [incorrectAnswer, trayShakeAnim]);

  return (
    <View
      ref={optionsContainerRef}
      onLayout={(e) => {
        onOptionsLayout(e.nativeEvent.layout.y);
      }}
      style={styles.translateContainer}
    >
      <View
        ref={firstOptionRef}
        onLayout={(e) => {
          onFirstOptionLayout(e.nativeEvent.layout.y);
          onCardHeightChange?.(e.nativeEvent.layout.height);
        }}
        style={[
          wordBankStyles.wordBankOuterWrap,
          styles.contentColumn,
          isDesktopWeb && {
            maxWidth: scaleValue(760, webLessonScale),
            paddingHorizontal: scaleValue(20, webLessonScale),
          },
        ]}
      >
        <Animated.View
          style={[
            wordBankStyles.answerTray,
            wordBankStyles.buildArea,
            !hasSelectedWords && wordBankStyles.buildAreaEmpty,
            styles.buildArea,
            isDesktopWeb && {
              borderRadius: scaleValue(16, webLessonScale),
              padding: scaleValue(10, webLessonScale),
            },
            {
              borderColor: grammarGame.blankSlotColor,
              backgroundColor: 'transparent',
            },
            incorrectAnswer === 'translate' && wordBankStyles.answerTrayIncorrect,
            { transform: [{ translateX: trayShakeAnim }] },
          ]}
        >
          {!hasSelectedWords ? (
            <>
              <MaterialIcons
                name="touch-app"
                size={isScaledLayout ? scaleValue(20, webLessonScale) : 18}
                color={grammarGame.metaText}
                style={[wordBankStyles.buildAreaEmptyIcon, { opacity: 0.65 }]}
              />
              <Text
                style={[
                  wordBankStyles.buildAreaEmptyTitle,
                  isDesktopWeb && wordBankStyles.buildAreaEmptyTitleDesktopWeb,




                  isScaledLayout && { fontSize: scaleValue(14, webLessonScale) },
                  { color: grammarGame.metaText, opacity: 0.65 },
                ]}
              >
                Build your translation
              </Text>
              <Text
                style={[
                  wordBankStyles.buildAreaEmptySubtitle,
                  isDesktopWeb && wordBankStyles.buildAreaEmptySubtitleDesktopWeb,
                  isScaledLayout && { fontSize: scaleValue(12, webLessonScale) },
                  { color: grammarGame.metaText, opacity: 0.65 },
                ]}
              >
                Tap words below to add them here
              </Text>
            </>
          ) : (
            <>
          <View
            style={[
              wordBankStyles.selectedWordsRow,
              { flex: 1, minHeight: 0, rowGap: selectedWordsGap },
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





                    { marginRight: selectedWordsGap },
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


                        backgroundColor: incorrectAnswer === 'translate'
                          ? grammarGame.incorrectSurface
                          : grammarGame.answerSelectedSurface,
                        borderColor: incorrectAnswer === 'translate'
                          ? grammarGame.incorrectBorder
                          : grammarGame.answerSelectedBorder,
                        borderBottomColor: incorrectAnswer === 'translate'
                          ? grammarGame.incorrectBorder
                          : grammarGame.answerSelectedBottom,




                        paddingVertical: chipPaddingVertical,
                        paddingHorizontal: chipPaddingHorizontal,
                        minHeight: chipMinHeight,
                      },
                      isDropTarget && wordBankStyles.dropTargetChip,
                    ]}
                  >
                    <Text
                      numberOfLines={1}
                      style={[
                      wordBankStyles.selectedWordChipText,
                      isDesktopWeb && wordBankStyles.selectedWordChipTextDesktopWeb,
                      {
                        color: incorrectAnswer === 'translate' ? grammarGame.incorrectText : grammarGame.answerText,
                        fontSize: chipFontSize,
                        textAlign: 'center',
                      },
                    ]}>{selectedWord}</Text>
                  </TouchableOpacity>
                  </TrayChipEntrance>
                </DraggableWordChip>
              );
            })}
            {Array.from({ length: blankSlotCount }).map((_, index) => (
              <View
                key={`blank-${index}`}
                style={[
                  wordBankStyles.blankSlot,
                  isDesktopWeb && wordBankStyles.blankSlotDesktopWeb,
                  {
                    width: blankSlotWidth,
                    minWidth: blankSlotWidth,
                    height: chipMinHeight,
                    borderColor: grammarGame.blankSlotColor,



                    marginRight: isDesktopWeb ? 0 : selectedWordsGap,
                  },
                ]}
              />
            ))}
          </View>
            </>
          )}
        </Animated.View>

        <View
          style={[
            wordBankStyles.wordBankCard,
            styles.wordBankSection,
            {
              gap: sectionGap,
              marginTop: sectionGap,
              backgroundColor: 'transparent',
              boxShadow: 'none',
              elevation: 0,
            },
          ]}
        >
          <View
            style={[
              wordBankStyles.wordBankPanel,
              styles.wordBankPanel,
              {
                backgroundColor: grammarGame.wordBankSurface,
                borderColor: grammarGame.wordBankBorder,
              },
            ]}
          >
            <View
              onLayout={handleWordBankRowLayout}
              style={[wordBankStyles.wordBank, { gap: wordBankGap, justifyContent: 'center', alignContent: 'center' }]}
            >
              {wordBank.map(({ word, index }, bankPosition) => {
                const isSelected = selectedWordIndexes.includes(index);

                return (
                  <DraggableWordChip
                    key={`${word}-${index}`}
                    position={bankPosition}
                    disabled={isSelected || userAnswer !== ''}
                    onLayoutMeasured={() => {}}
                    onDragStart={() => {}}
                    onDragMove={() => {}}
                    onDragEnd={(_pos, didDrag, gestureState) => {



                      if (didDrag && gestureState.dy < -CHIP_DRAG_COMMIT_THRESHOLD_DY) {
                        handleWordPress(index);
                      }
                    }}
                  >
                  <WordBankChipFade used={isSelected}>
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
                      {
                        paddingVertical: chipPaddingVertical,
                        paddingHorizontal: chipPaddingHorizontal,
                        minHeight: chipMinHeight,
                      },
                      {
                        backgroundColor: grammarGame.wordChipSurface,
                        boxShadow: isDarkMode
                          ? '0px 2px 4px rgba(0,0,0,0.20)'
                          : isDesktopWeb
                            ? `0px 2px 5px ${withColorAlpha(colors.shadow, 0.72)}`
                            : `0px 1px 3px ${withColorAlpha(colors.shadow, 0.68)}`,
                      },
                    ]}
                  >
                    <Text
                      numberOfLines={1}
                      style={[
                      wordBankStyles.wordChipText,
                      isDesktopWeb && wordBankStyles.wordChipTextDesktopWeb,
                      { fontSize: chipFontSize, textAlign: 'center' },
                      { color: grammarGame.wordChipText },
                      isSelected && [wordBankStyles.disabledWordChipText, { color: grammarGame.metaText }],
                    ]}>{word}</Text>
                  </TouchableOpacity>
                  </WordBankChipFade>
                  </DraggableWordChip>
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




              { height: checkHeight, minHeight: checkHeight, flexShrink: 0 },
              {
                backgroundColor: grammarGame.checkButtonBg,
                borderColor: grammarGame.checkButtonBg,
                borderWidth: 0,
                boxShadow: `0px 4px 12px ${withColorAlpha(grammarGame.checkButtonBg, 0.3)}`,
              },
              disabled && wordBankStyles.disabledCheckAnswerButton,
            ]}
          >
            <View style={wordBankStyles.checkAnswerButtonInner}>
              <MaterialIcons name="check" size={checkIconSize} color={grammarGame.buttonText} />
              <Text
                style={[
                  wordBankStyles.checkAnswerButtonText,
                  { color: grammarGame.buttonText, fontSize: checkFontSize },
                ]}
              >
                Check
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default GrammarTranslateExercise;

const styles = StyleSheet.create({
  translateContainer: {
    flex: 1,
    minHeight: 0,
    paddingTop: 5,






    paddingBottom: 0,
    width: '100%',
    alignItems: 'center',
  },
  contentColumn: {
    flex: 1,
    minHeight: 0,
    width: '100%',
    maxWidth: 760,
    paddingHorizontal: 20,



    paddingBottom: 0,
  },
  buildArea: {
    flex: 0.7,
    minHeight: 0,
  },
  wordBankSection: {
    flex: 1.6,
    minHeight: 0,
    marginTop: 25,
  },
  wordBankPanel: {
    flex: 1,
    minHeight: 0,
  },
});
