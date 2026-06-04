import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { CARD_HEIGHT, Exercise, normalizeAnswer, shuffle } from './GrammarExerciseUtils';
import { clampNumber, getWebLessonScale, scaleValue } from '../../shared/responsiveLayout';
import { darkGameAccents, getPrimaryButtonStyle } from '../../shared/uiPrimitives';
import { triggerSelectionHaptic } from '../../shared/haptics';
import type { ThemeColors } from '../../settings/ThemeContext';

const DARK_WORD_ACCENT = darkGameAccents.wordCardBorder;
const DARK_WORD_BANK_BACKGROUND = darkGameAccents.wordArea;
const DARK_WORD_CARD_BACKGROUND = darkGameAccents.wordCard;
const DARK_WORD_CARD_TEXT = darkGameAccents.wordText;
const DARK_SELECTED_WORD_BACKGROUND = darkGameAccents.wordCardPressed;
const DARK_SELECTED_WORD_BORDER = darkGameAccents.wordAreaBorder;

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
  const applyCompactStyles = compact && !isAndroid;
  const webScale = getWebLessonScale(width, height);
  const [selectedWordIds, setSelectedWordIds] = useState<string[]>([]);
  const [isSubmitLocked, setIsSubmitLocked] = useState(false);
  const unlockTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const words = exercise?.words ?? [];
  const wordsKey = words.join('\u0001');
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
  }, [exercise]);

  useEffect(() => {
    return () => {
      if (unlockTimeoutRef.current) {
        clearTimeout(unlockTimeoutRef.current);
      }
    };
  }, []);

  const handleWordPress = (id: string) => {
    if (userAnswer !== '' || isSubmitLocked || selectedWordIds.includes(id)) return;
    triggerSelectionHaptic();
    setSelectedWordIds(current => [...current, id]);
  };

  const handleSelectedWordPress = (position: number) => {
    if (userAnswer !== '' || isSubmitLocked) return;
    triggerSelectionHaptic();
    setSelectedWordIds(current => current.filter((_, index) => index !== position));
  };

  const handleClear = () => {
    if (userAnswer !== '' || isSubmitLocked || selectedWordIds.length === 0) return;
    triggerSelectionHaptic();
    setSelectedWordIds([]);
  };

  const handleSubmit = async () => {
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
  };

  const disabled = userAnswer !== '' || isSubmitLocked || selectedWordIds.length === 0;
  const desktopCardMinHeight = Math.min(scaleValue(430, webScale), Math.max(scaleValue(360, webScale), Math.round(height * 0.48)));
  const androidCardMinHeight = Math.round(clampNumber(
    height * (compact ? 0.39 : 0.43),
    compact ? 286 : 320,
    compact ? 348 : 420
  ));
  const cardMinHeight = isDesktopWeb ? desktopCardMinHeight : isAndroid ? androidCardMinHeight : compact ? 236 : CARD_HEIGHT;
  const answerTrayMinHeight = isAndroid ? (compact ? 88 : 104) : compact ? 68 : isDesktopWeb ? scaleValue(126, webScale) : 92;
  const selectedWordsMinHeight = isAndroid ? (compact ? 50 : 62) : compact ? 38 : isDesktopWeb ? scaleValue(76, webScale) : 54;
  const wordBankPanelPadding = isAndroid ? (compact ? 14 : 18) : compact ? 10 : isDesktopWeb ? scaleValue(22, webScale) : 18;
  const chipVerticalPadding = isAndroid ? (compact ? 9 : 11) : compact ? 7 : isDesktopWeb ? scaleValue(12, webScale) : 10;
  const chipHorizontalPadding = isAndroid ? (compact ? 12 : 16) : compact ? 10 : isDesktopWeb ? scaleValue(16, webScale) : 14;
  const darkShadowColor = '#020B13';

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
            backgroundColor: isDarkMode ? colors.card : colors.card,
            borderColor: isDarkMode ? colors.border : colors.border,
            borderBottomColor: isDarkMode ? colors.borderStrong : colors.borderStrong,
            shadowColor: isDarkMode ? darkShadowColor : '#000',
          },
          incorrectAnswer === 'reorder' && [
            styles.incorrectOption,
            { backgroundColor: colors.dangerSoft, borderColor: colors.danger, borderBottomColor: colors.danger },
          ],
        ]}
      >
        <View
          style={[
            styles.answerTray,
            applyCompactStyles && styles.answerTrayCompact,
            isDesktopWeb && styles.answerTrayDesktopWeb,
            {
              minHeight: answerTrayMinHeight,
              backgroundColor: isDarkMode ? colors.surfaceAlt : colors.surfaceAlt,
              borderColor: isDarkMode ? colors.borderStrong : colors.border,
              borderBottomColor: isDarkMode ? DARK_WORD_ACCENT : colors.borderStrong,
            },
            incorrectAnswer === 'reorder' && [
              styles.answerTrayIncorrect,
              { backgroundColor: colors.dangerSoft, borderColor: colors.danger, borderBottomColor: colors.danger },
            ],
          ]}
        >
          <View style={styles.trayHeader}>
            <Text style={[styles.trayHint, { color: colors.secondaryText }, isDesktopWeb && { fontSize: scaleValue(13, webScale) }]}>
              {selectedWordIds.length === 0 ? 'Tap the words below' : 'Tap a word to remove it'}
            </Text>
            <View style={styles.trayUtilities}>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Clear answer"
                accessibilityState={{ disabled }}
                onPress={handleClear}
                disabled={disabled}
                style={[
                  styles.trayUtilityButton,
                  styles.clearButton,
                  {
                    backgroundColor: disabled ? colors.dangerSoft : colors.danger,
                    borderColor: colors.danger,
                  },
                  disabled && styles.disabledUtilityButton,
                ]}
              >
                <MaterialIcons name="close" size={21} color={disabled ? colors.dangerText : '#FFFFFF'} />
              </TouchableOpacity>
            </View>
          </View>
          <View style={[styles.selectedWordsRow, applyCompactStyles && styles.selectedWordsRowCompact, { minHeight: selectedWordsMinHeight }]}>
            {selectedWordIds.length === 0 ? (
              <View style={styles.answerPlaceholder} />
            ) : (
              selectedWordIds.map((wordId, position) => {
                const selectedWord = shuffledWordOptions.find(option => option.id === wordId)?.word;
                if (!selectedWord) return null;

                return (
                  <TouchableOpacity
                    key={`${wordId}-${position}`}
                    accessibilityRole="button"
                    accessibilityLabel={`Remove word ${selectedWord}`}
                    onPress={() => handleSelectedWordPress(position)}
                    style={[
                      styles.selectedWordChip,
                      applyCompactStyles && styles.selectedWordChipCompact,
                      isDesktopWeb && styles.selectedWordChipDesktopWeb,
                      {
                        backgroundColor: isDarkMode ? DARK_SELECTED_WORD_BACKGROUND : colors.primary,
                        borderColor: isDarkMode ? DARK_SELECTED_WORD_BORDER : colors.borderStrong,
                        borderBottomColor: isDarkMode ? DARK_WORD_ACCENT : colors.primary,
                      },
                    ]}
                  >
                    <Text style={[
                      styles.selectedWordChipText,
                      applyCompactStyles && styles.selectedWordChipTextCompact,
                      isDesktopWeb && styles.selectedWordChipTextDesktopWeb,
                      isDesktopWeb && { fontSize: scaleValue(16, webScale) },
                      { color: colors.buttonText },
                    ]}>
                      {selectedWord}
                    </Text>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
          <View style={[styles.answerLine, { backgroundColor: isDarkMode ? DARK_WORD_ACCENT : colors.borderStrong }]} />
        </View>
        <View style={[styles.wordBankPanel, applyCompactStyles && styles.wordBankPanelCompact, {
          padding: wordBankPanelPadding,
          backgroundColor: isDarkMode ? DARK_WORD_BANK_BACKGROUND : colors.surface,
          borderColor: isDarkMode ? DARK_WORD_ACCENT : colors.border,
        }]}>
          <View style={styles.wordBank}>
            {shuffledWordOptions.map(({ word, id }) => {
              const isSelected = selectedWordIds.includes(id);
              return (
                <TouchableOpacity
                  key={id}
                  accessibilityRole="button"
                  accessibilityLabel={`${isSelected ? 'Selected word' : 'Add word'} ${word}`}
                  accessibilityState={{ disabled: isSelected || userAnswer !== '', selected: isSelected }}
                  onPress={() => handleWordPress(id)}
                  disabled={isSelected || userAnswer !== ''}
                  style={[
                    styles.wordChip,
                    applyCompactStyles && styles.wordChipCompact,
                    isDesktopWeb && styles.wordChipDesktopWeb,
                    { paddingVertical: chipVerticalPadding, paddingHorizontal: chipHorizontalPadding },
                    {
                      backgroundColor: isDarkMode ? DARK_WORD_CARD_BACKGROUND : colors.card,
                      borderColor: isDarkMode ? DARK_WORD_ACCENT : colors.border,
                      borderBottomColor: isDarkMode ? DARK_WORD_ACCENT : colors.borderStrong,
                      shadowColor: isDarkMode ? darkShadowColor : '#000',
                    },
                    isSelected && styles.disabledWordChip,
                  ]}
                >
                  <Text style={[
                    styles.wordChipText,
                    applyCompactStyles && styles.wordChipTextCompact,
                    isDesktopWeb && styles.wordChipTextDesktopWeb,
                    isDesktopWeb && { fontSize: scaleValue(16, webScale) },
                    { color: isDarkMode ? DARK_WORD_CARD_TEXT : colors.text },
                    isSelected && [styles.disabledWordChipText, { color: colors.secondaryText }],
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
            applyCompactStyles && styles.checkAnswerButtonCompact,
            isDesktopWeb && styles.checkAnswerButtonDesktopWeb,
            isDesktopWeb && { minHeight: scaleValue(54, webScale) },
            getPrimaryButtonStyle(colors, isDarkMode),
            disabled && styles.disabledCheckAnswerButton,
          ]}
        >
          <Text style={[styles.checkAnswerButtonText, { color: colors.buttonText }, isDesktopWeb && { fontSize: scaleValue(16, webScale) }]}>Check</Text>
        </TouchableOpacity>
        {incorrectAnswer === 'reorder' && (
          <Text style={[styles.fillErrorText, { color: colors.dangerText }]}>Try again.</Text>
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
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderBottomWidth: 4,
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
  answerTrayIncorrect: {
    backgroundColor: '#FFF1F3',
    borderColor: '#F06A7F',
    borderBottomColor: '#D94E64',
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
  trayUtilityButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearButton: {
    borderColor: '#f4c7c7',
    backgroundColor: '#fff',
  },
  disabledUtilityButton: {
    opacity: 0.28,
  },
  trayHint: {
    color: '#777',
    fontSize: 13,
    fontWeight: '800',
    flex: 1,
  },
  answerPlaceholder: {
    minHeight: 32,
    width: '100%',
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
  answerLine: {
    height: 2,
    backgroundColor: '#D8E1EA',
    borderRadius: 999,
    marginTop: 6,
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
  fillErrorText: {
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
