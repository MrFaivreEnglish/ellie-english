import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import type { LayoutChangeEvent } from 'react-native';
import Text from '../../shared/ThemedText';
import MaterialIcons from '../../shared/ThemedMaterialIcon';
import { Exercise, normalizeAnswer, shuffle } from './GrammarExerciseUtils';
import { getGrammarGameColors, withColorAlpha } from '../../shared/uiPrimitives';
import { triggerSelectionHaptic } from '../../shared/haptics';
import { getWebLessonScale, isCompactViewport, isDesktopWebWidth, scaleValue } from '../../shared/responsiveLayout';
import { CHIP_DESKTOP_SCALE_ADJUSTMENT } from '../../shared/exerciseLayoutTokens';
import type { ThemeColors } from '../../settings/ThemeContext';
import { useSelectedWordDrag } from './useSelectedWordDrag';
import DraggableWordChip, { CHIP_DRAG_COMMIT_THRESHOLD_DY } from './DraggableWordChip';
import {
  CHECK_COMPACT_MAX_STAGE_HEIGHT,
  CHECK_COMPACT_MAX_WIDTH,
  getCheckButtonMetrics,
  getChipMetrics,
  getChipPreset,
  REORDER_CHIP_METRICS,
  wordBankStyles,
} from './grammarExerciseStyles';

interface GrammarReorderExerciseProps {
  exercise?: Exercise;
  colors: ThemeColors;
  isDarkMode: boolean;
  compact?: boolean;
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

const GrammarReorderExercise: React.FC<GrammarReorderExerciseProps> = ({
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
  // Translate, which has the same word-bank shape).
  const webLessonScale = rawWebLessonScale > 1 ? rawWebLessonScale * CHIP_DESKTOP_SCALE_ADJUSTMENT : rawWebLessonScale;






  const isScaledLayout = isDesktopWeb || webLessonScale > 1;
  const availableStageHeight = availableHeight ?? layoutHeight ?? height;
  const isCompact = isCompactViewport(width, availableStageHeight, {
    widthThreshold: CHECK_COMPACT_MAX_WIDTH,
    heightThreshold: CHECK_COMPACT_MAX_STAGE_HEIGHT,
  });
  const applyCompactStyles = !isDesktopWeb;
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
  const grammarGame = getGrammarGameColors(colors, isDarkMode);
  const totalSlots = shuffledWordOptions.length;
  const blankSlotCount = Math.max(0, totalSlots - selectedWordIds.length);
  const hasSelectedWords = selectedWordIds.length > 0;




  const [wordBankRowWidth, setWordBankRowWidth] = useState(0);
  const handleWordBankRowLayout = useCallback((event: LayoutChangeEvent) => {
    const nextWidth = event.nativeEvent.layout.width;



    setWordBankRowWidth(current => (Math.abs(current - nextWidth) > 1 ? nextWidth : current));
  }, []);


  const contentGap = isCompact ? 8 : scaleValue(12, webLessonScale);
  const wordBankGap = isCompact ? 6 : scaleValue(10, webLessonScale);
  const selectedWordsGap = isCompact ? 6 : scaleValue(10, webLessonScale);






  const chipPreset = getChipPreset(REORDER_CHIP_METRICS, width, height, webLessonScale);
  const chipWords = useMemo(() => shuffledWordOptions.map(option => option.word), [shuffledWordOptions]);
  const {
    fontSize: chipFontSize,
    paddingHorizontal: chipPaddingHorizontal,
    paddingVertical: chipPaddingVertical,
    minHeight: chipMinHeight,
  } = useMemo(
    () => getChipMetrics(chipPreset, chipWords, wordBankRowWidth),
    [chipPreset, chipWords, wordBankRowWidth],
  );
  const blankSlotWidth = isCompact ? 72 : isScaledLayout ? scaleValue(110, webLessonScale) : 88;
  const {
    height: checkHeight,
    fontSize: checkFontSize,
    iconSize: checkIconSize,
  } = getCheckButtonMetrics(width, availableStageHeight, height, webLessonScale);


  return (
    <View
      ref={optionsContainerRef}
      onLayout={(e) => {
        onOptionsLayout(e.nativeEvent.layout.y);
      }}
      style={styles.reorderContainer}
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
          isDesktopWeb && styles.contentColumnDesktop,
          isDesktopWeb && {
            maxWidth: scaleValue(760, webLessonScale),
            paddingTop: scaleValue(10, webLessonScale),
            paddingHorizontal: scaleValue(24, webLessonScale),
            paddingBottom: scaleValue(4, webLessonScale),
          },
          isCompact && styles.contentColumnCompact,
        ]}
      >
        <View
          style={[
            wordBankStyles.answerTray,
            applyCompactStyles && wordBankStyles.answerTrayCompact,
            isDesktopWeb && styles.answerTrayDesktopWeb,
            wordBankStyles.buildArea,
            isDesktopWeb && wordBankStyles.buildAreaDesktopWeb,
            !hasSelectedWords && wordBankStyles.buildAreaEmpty,
            styles.buildAreaFlex,
            isDesktopWeb && {
              borderRadius: scaleValue(18, webLessonScale),
              padding: scaleValue(14, webLessonScale),
            },
            {
              borderColor: grammarGame.blankSlotColor,
              backgroundColor: 'transparent',
              boxShadow: 'none',
              elevation: 0,
            },
            incorrectAnswer === 'reorder' && wordBankStyles.answerTrayIncorrect,
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
                Build the sentence
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
              applyCompactStyles && wordBankStyles.selectedWordsRowCompact,
              { flex: 1, minHeight: 0, rowGap: selectedWordsGap },
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





                    { marginRight: selectedWordsGap },
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





                        backgroundColor: incorrectAnswer === 'reorder'
                          ? grammarGame.incorrectSurface
                          : grammarGame.answerSelectedSurface,
                        borderColor: incorrectAnswer === 'reorder'
                          ? grammarGame.incorrectBorder
                          : grammarGame.answerSelectedBorder,
                        borderBottomColor: incorrectAnswer === 'reorder'
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
                        color: incorrectAnswer === 'reorder' ? grammarGame.incorrectText : grammarGame.answerText,
                        fontSize: chipFontSize,
                      },
                    ]}
                    >
                      {selectedWord}
                    </Text>
                  </TouchableOpacity>
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
        </View>
        <View
          style={[
            wordBankStyles.wordBankCard,
            applyCompactStyles && wordBankStyles.wordBankCardCompact,
            isDesktopWeb && styles.reorderCardDesktopWeb,
            styles.wordBankSection,
            {
              gap: contentGap,
              marginTop: contentGap,
              padding: isDesktopWeb ? scaleValue(14, webLessonScale) : undefined,
            },
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
              applyCompactStyles && wordBankStyles.wordBankPanelCompact,
              {
                backgroundColor: grammarGame.wordBankSurface,
                borderColor: grammarGame.wordBankBorder,
                flex: 1,
                minHeight: 0,
              },
              isDesktopWeb && { padding: scaleValue(10, webLessonScale) },
            ]}
          >
            <View onLayout={handleWordBankRowLayout} style={[wordBankStyles.wordBank, { gap: wordBankGap }]}>
              {shuffledWordOptions.map(({ word, id }, bankIndex) => {
                const isSelected = selectedWordIds.includes(id);
                return (
                  <DraggableWordChip
                    key={id}
                    position={bankIndex}
                    disabled={isSelected || userAnswer !== ''}
                    onLayoutMeasured={() => {}}
                    onDragStart={() => {}}
                    onDragMove={() => {}}
                    onDragEnd={(_pos, didDrag, gestureState) => {



                      if (didDrag && gestureState.dy < -CHIP_DRAG_COMMIT_THRESHOLD_DY) {
                        handleWordPress(id);
                      }
                    }}
                  >
                    <TouchableOpacity
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
                        isSelected && wordBankStyles.disabledWordChip,
                      ]}
                    >
                      <Text
                        numberOfLines={1}
                        style={[
                        wordBankStyles.wordChipText,
                        isDesktopWeb && wordBankStyles.wordChipTextDesktopWeb,
                        { fontSize: chipFontSize },
                        { color: grammarGame.wordChipText },
                        isSelected && [wordBankStyles.disabledWordChipText, { color: grammarGame.metaText }],
                      ]}>{word}</Text>
                    </TouchableOpacity>
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
              applyCompactStyles && wordBankStyles.checkAnswerButtonCompact,
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

export default GrammarReorderExercise;

const styles = StyleSheet.create({
  reorderContainer: {
    flex: 1,
    minHeight: 0,
    paddingTop: 18,
    paddingBottom: 10,
    width: '100%',
    alignItems: 'center',
  },
  contentColumn: {
    flex: 1,
    minHeight: 0,
    width: '100%',
    paddingTop: 10,
    paddingHorizontal: 20,
    paddingBottom: 4,
  },
  contentColumnDesktop: {
    maxWidth: 760,
    alignSelf: 'center',
    paddingHorizontal: 24,
  },
  contentColumnCompact: {
    paddingTop: 6,
    paddingHorizontal: 12,
    paddingBottom: 2,
  },
  buildAreaFlex: {
    flex: 0.7,
    minHeight: 0,
  },
  wordBankSection: {
    flex: 1,
    minHeight: 0,
    paddingTop: 6,
    paddingBottom: 10,
  },
  reorderCardDesktopWeb: {
    padding: 14,
  },
  answerTrayDesktopWeb: {
    padding: 0,
  },
});
