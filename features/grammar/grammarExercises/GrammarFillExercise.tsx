import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { CARD_HEIGHT, Exercise, normalizeAnswer } from './GrammarExerciseUtils';
import { clampNumber, getWebLessonScale, scaleValue } from '../../shared/responsiveLayout';
import { getGrammarGameColors, getPrimaryButtonStyle } from '../../shared/uiPrimitives';
import { triggerSelectionHaptic } from '../../shared/haptics';
import { usePersistentExerciseKeyboard } from '../../shared/usePersistentExerciseKeyboard';
import type { ThemeColors } from '../../settings/ThemeContext';

interface GrammarFillExerciseProps {
  exercise?: Exercise;
  colors: ThemeColors;
  isDarkMode: boolean;
  keyboardVisible?: boolean;
  layoutHeight?: number;
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

const GrammarFillExercise: React.FC<GrammarFillExerciseProps> = ({
  exercise,
  colors,
  isDarkMode,
  keyboardVisible = false,
  layoutHeight,
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
  const responsiveHeight = layoutHeight ?? height;
  const isCompact = responsiveHeight < 760 || width < 390;
  const isDesktopWeb = Platform.OS === 'web' && width >= 768;
  const isAndroid = Platform.OS === 'android';
  const webScale = getWebLessonScale(width, responsiveHeight);
  const isKeyboardTight = !isDesktopWeb && (responsiveHeight < 700 || width < 380);
  const keyboardMode = keyboardVisible || isKeyboardTight;
  const roomyKeyboardMode = Platform.OS === 'android' && keyboardMode;
  const useTightKeyboardStyles = keyboardMode && !roomyKeyboardMode;
  const inputRef = useRef<TextInput | null>(null);
  const [fillAnswer, setFillAnswer] = useState('');
  const [isInputFocused, setIsInputFocused] = useState(false);
  const desktopFillCardHeight = Math.min(scaleValue(300, webScale), Math.max(scaleValue(260, webScale), Math.round(responsiveHeight * 0.34)));
  const androidFillCardHeight = keyboardMode
    ? Math.round(clampNumber(responsiveHeight * 0.29, isCompact ? 208 : 224, isCompact ? 242 : 264))
    : Math.round(clampNumber(responsiveHeight * (isCompact ? 0.31 : 0.34), isCompact ? 226 : 268, isCompact ? 286 : 336));
  const fillCardHeight = isDesktopWeb ? desktopFillCardHeight : isAndroid ? androidFillCardHeight : keyboardMode ? 158 : isCompact ? 180 : 224;
  const fillCardPadding = isDesktopWeb ? scaleValue(16, webScale) : isAndroid ? (keyboardMode ? 13 : 16) : keyboardMode ? 9 : isCompact ? 12 : 15;
  const inputShellMinHeight = isDesktopWeb ? scaleValue(108, webScale) : isAndroid ? (keyboardMode ? 78 : isCompact ? 84 : 104) : keyboardMode ? 54 : isCompact ? 60 : 78;
  const inputShellVerticalPadding = isDesktopWeb ? scaleValue(12, webScale) : isAndroid ? (keyboardMode ? 8 : 12) : keyboardMode ? 5 : isCompact ? 7 : 11;
  const inputShellMarginBottom = isDesktopWeb ? scaleValue(14, webScale) : isAndroid ? (keyboardMode ? 11 : 15) : keyboardMode ? 7 : isCompact ? 9 : 13;
  const fillInputMinHeight = isDesktopWeb ? scaleValue(64, webScale) : isAndroid ? (keyboardMode ? 46 : isCompact ? 52 : 60) : keyboardMode ? 36 : isCompact ? 40 : 48;
  const fillInputFontSize = isDesktopWeb ? scaleValue(24, webScale) : isAndroid ? (keyboardMode ? 19 : isCompact ? 20 : 22) : keyboardMode ? 16 : isCompact ? 17 : 19;
  const grammarGame = getGrammarGameColors(colors, isDarkMode);
  const {
    shouldKeepKeyboardOpen: shouldAllowKeyboardFocus,
    focusInput,
    focusInputSequence,
    focusOnExerciseChange,
  } = usePersistentExerciseKeyboard({
    inputRef,
    enabled: !isDesktopWeb,
    androidFocusRetries: Platform.OS === 'android',
  });

  const handleFillAnswerChange = useCallback((value: string) => {
    if (userAnswer !== '') return;
    setFillAnswer(value);
  }, [userAnswer]);

  useEffect(() => {
    setFillAnswer('');
  }, [exercise?.question, exercise?.answer]);

  useEffect(() => {
    if (!shouldAllowKeyboardFocus) return;

    focusOnExerciseChange();
  }, [exercise?.question, focusOnExerciseChange, shouldAllowKeyboardFocus]);

  const handleSubmit = useCallback(async () => {
    if (!exercise || userAnswer !== '' || typeof exercise.answer !== 'string') return;

    const isCorrect = normalizeAnswer(fillAnswer) === normalizeAnswer(exercise.answer);

    if (isCorrect) {
      await onCorrect(exercise.answer);
      focusInputSequence([0, 180, 1900]);
    } else {
      onIncorrect('fill');
      focusInput();
    }
  }, [exercise, userAnswer, fillAnswer, onCorrect, onIncorrect, focusInput]);

  const handleClear = useCallback(() => {
    triggerSelectionHaptic();
    setFillAnswer('');
    focusInput();
  }, [focusInput]);

  const handleInputBlur = useCallback(() => {
    setIsInputFocused(false);
    focusInput(120);
  }, [focusInput]);

  const disabled = fillAnswer.trim() === '' || userAnswer !== '';
  const canClear = fillAnswer.length > 0 && userAnswer === '';

  return (
    <View
      ref={optionsContainerRef}
      onLayout={(e) => onOptionsLayout(e.nativeEvent.layout.y)}
      style={[styles.fillContainer, { height: fillCardHeight }]}
    >
      <View
        ref={firstOptionRef}
        onLayout={(e) => {
          onFirstOptionLayout(e.nativeEvent.layout.y);
          onCardHeightChange?.(e.nativeEvent.layout.height);
        }}
        style={[
          styles.fillCard,
          { height: fillCardHeight, padding: fillCardPadding },
          {
            backgroundColor: grammarGame.panelSurface,
            borderColor: grammarGame.panelBorder,
            borderBottomColor: grammarGame.panelBottom,
            shadowColor: grammarGame.panelShadow,
            shadowOpacity: isDarkMode ? 0.22 : 0.08,
            shadowRadius: isDarkMode ? 9 : 6,
            elevation: isDarkMode ? 4 : 2,
          },
        ]}
      >
        <Pressable
          onPress={() => focusInput()}
          style={[
            styles.inputShell,
            useTightKeyboardStyles && styles.inputShellTight,
            isDesktopWeb && styles.inputShellDesktopWeb,
            {
              minHeight: inputShellMinHeight,
              paddingVertical: inputShellVerticalPadding,
              marginBottom: inputShellMarginBottom,
              backgroundColor: grammarGame.inputSurface,
              borderColor: grammarGame.answerBorder,
              borderBottomColor: grammarGame.answerBottom,
            },
            isInputFocused && styles.inputShellFocused,
            isInputFocused && {
              backgroundColor: grammarGame.inputFocusedSurface,
              borderColor: grammarGame.answerSelectedBorder,
              borderBottomColor: grammarGame.answerSelectedBottom,
            },
            incorrectAnswer === 'fill' && styles.inputShellIncorrect,
            incorrectAnswer === 'fill' && {
              backgroundColor: grammarGame.incorrectSurface,
              borderColor: grammarGame.incorrectBorder,
              borderBottomColor: grammarGame.incorrectBottom,
            },
          ]}
        >
          <TextInput
            ref={inputRef}
            value={fillAnswer}
            onChangeText={handleFillAnswerChange}
            placeholder="Type your answer..."
            placeholderTextColor={grammarGame.metaText}
            autoCapitalize="none"
            autoCorrect={false}
            blurOnSubmit={false}
            submitBehavior="submit"
            editable={!!exercise}
            showSoftInputOnFocus
            returnKeyType="send"
            onFocus={() => setIsInputFocused(true)}
            onBlur={handleInputBlur}
            onSubmitEditing={handleSubmit}
            style={[
              styles.fillInput,
              useTightKeyboardStyles && styles.fillInputTight,
              isDesktopWeb && styles.fillInputDesktopWeb,
              { minHeight: fillInputMinHeight, fontSize: fillInputFontSize },
              { color: grammarGame.answerText },
              { outlineStyle: 'none' } as any,
            ]}
          />
          {canClear && (
            <TouchableOpacity
              onPress={handleClear}
              style={styles.clearInputButton}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <MaterialIcons name="close" size={22} color={grammarGame.metaText} />
            </TouchableOpacity>
          )}
        </Pressable>
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={disabled}
          style={[
            styles.checkAnswerButton,
            useTightKeyboardStyles && styles.checkAnswerButtonTight,
            isDesktopWeb && styles.checkAnswerButtonDesktopWeb,
            getPrimaryButtonStyle(colors, isDarkMode),
            disabled && styles.disabledCheckAnswerButton,
          ]}
        >
          <Text style={[styles.checkAnswerButtonText, { color: colors.buttonText }, isDesktopWeb && { fontSize: scaleValue(16, webScale) }]}>Check</Text>
        </TouchableOpacity>
        {incorrectAnswer === 'fill' && (
          <Text style={[styles.fillErrorText, { color: grammarGame.incorrectText }]}>Try again.</Text>
        )}
      </View>
    </View>
  );
};

export default React.memo(GrammarFillExercise);

const styles = StyleSheet.create({
  fillContainer: {
    height: CARD_HEIGHT,
  },
  fillCard: {
    height: CARD_HEIGHT,
    padding: 20,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderBottomWidth: 3,
    borderColor: '#E5E5E5',
    borderBottomColor: '#D1D5DB',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  inputShell: {
    minHeight: 104,
    borderRadius: 8,
    borderWidth: 1.5,
    borderBottomWidth: 3,
    borderColor: '#D6E2EE',
    borderBottomColor: '#B9C8D6',
    backgroundColor: '#F8FBFF',
    paddingHorizontal: 22,
    paddingVertical: 18,
    justifyContent: 'center',
    marginBottom: 22,
    position: 'relative',
  },
  inputShellTight: {
    paddingHorizontal: 12,
    borderBottomWidth: 3,
  },
  inputShellDesktopWeb: {
    paddingHorizontal: 24,
  },
  inputShellIncorrect: {
    backgroundColor: '#FFF4F6',
    borderColor: '#F06A7F',
    borderBottomColor: '#D94E64',
  },
  inputShellFocused: {
    backgroundColor: '#EEF3FF',
    borderColor: '#1F7AD1',
    borderBottomColor: '#155B9F',
  },
  fillInput: {
    minHeight: 56,
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    borderWidth: 0,
    paddingHorizontal: 44,
  },
  fillInputTight: {
    paddingHorizontal: 32,
  },
  fillInputDesktopWeb: {
    paddingHorizontal: 54,
  },
  clearInputButton: {
    position: 'absolute',
    top: '50%',
    right: 12,
    width: 44,
    height: 44,
    marginTop: -22,
    borderRadius: 22,
    backgroundColor: 'transparent',
    borderWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkAnswerButton: {
    minHeight: 48,
    borderRadius: 8,
    backgroundColor: '#1F7AD1',
    borderWidth: 1.5,
    borderBottomWidth: 3,
    borderColor: '#1F7AD1',
    borderBottomColor: '#155B9F',
    alignItems: 'center',
    justifyContent: 'center',
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
    fontSize: 14,
    fontWeight: '700',
    marginTop: 10,
    textAlign: 'center',
  },
  checkAnswerButtonTight: {
    minHeight: 38,
    borderBottomWidth: 3,
  },
  checkAnswerButtonDesktopWeb: {
    minHeight: 52,
  },
  incorrectOption: {
    backgroundColor: '#FFE8EC',
    borderColor: '#F06A7F',
  },
});
