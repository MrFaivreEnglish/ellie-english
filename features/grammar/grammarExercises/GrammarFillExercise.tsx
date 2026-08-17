import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { CARD_HEIGHT, Exercise, normalizeAnswer } from './GrammarExerciseUtils';
import { clampNumber, getWebLessonScale, scaleValue } from '../../shared/responsiveLayout';
import { getGrammarGameColors } from '../../shared/uiPrimitives';
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
  // Sized to just fit the input + Check button plus a little breathing room —
  // not a generous fraction of screen height — since fillCard hugs its
  // content from the top now instead of centering it in a tall box (that
  // combo was what left a huge void above and below the input on desktop).
  const desktopFillCardHeight = Math.round(clampNumber(responsiveHeight * 0.22, 190, 260));
  const androidFillCardHeight = keyboardMode
    ? Math.round(clampNumber(responsiveHeight * 0.29, 224, 264))
    : Math.round(clampNumber(responsiveHeight * 0.22, 200, 250));
  const fillCardHeight = isDesktopWeb
    ? desktopFillCardHeight
    : isAndroid
      ? androidFillCardHeight
      : keyboardMode
        ? 158
        : Math.round(clampNumber(responsiveHeight * 0.22, 180, 230));
  const fillCardPadding = isDesktopWeb ? scaleValue(30, webScale) : isAndroid ? (keyboardMode ? 13 : 16) : keyboardMode ? 9 : 18;
  const inputShellMinHeight = isDesktopWeb ? scaleValue(52, webScale) : isAndroid ? (keyboardMode ? 78 : 104) : keyboardMode ? 54 : 86;
  const inputShellVerticalPadding = isDesktopWeb ? 0 : isAndroid ? (keyboardMode ? 8 : 12) : keyboardMode ? 5 : 13;
  const inputShellMarginBottom = isDesktopWeb ? scaleValue(28, webScale) : isAndroid ? (keyboardMode ? 11 : 15) : keyboardMode ? 7 : 15;
  const fillInputMinHeight = isDesktopWeb ? scaleValue(46, webScale) : isAndroid ? (keyboardMode ? 46 : 60) : keyboardMode ? 36 : 56;
  const fillInputFontSize = isDesktopWeb ? scaleValue(22, webScale) : isAndroid ? (keyboardMode ? 21 : 27) : keyboardMode ? 18 : 24;
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
          {
            height: fillCardHeight,
            padding: fillCardPadding,
            backgroundColor: 'transparent',
            borderWidth: 0,
            borderRadius: 0,
            shadowOpacity: 0,
            elevation: 0,
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
          {!fillAnswer && (
            <View style={styles.fillPlaceholderOverlay} pointerEvents="none">
              <Text
                style={[
                  styles.fillPlaceholderText,
                  useTightKeyboardStyles && styles.fillInputTight,
                  isDesktopWeb && styles.fillInputDesktopWeb,
                  { fontSize: fillInputFontSize, color: grammarGame.metaText },
                ]}
              >
                Type your answer...
              </Text>
            </View>
          )}
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
            { backgroundColor: grammarGame.checkButtonBg, borderColor: grammarGame.checkButtonBg, borderBottomColor: grammarGame.checkButtonBg, borderRadius: 999 },
            disabled && styles.disabledCheckAnswerButton,
          ]}
        >
          <View style={styles.checkAnswerButtonInner}>
            <MaterialIcons name="check" size={isDesktopWeb ? scaleValue(17, webScale) : 22} color="#fff" />
            <Text style={[styles.checkAnswerButtonText, { color: '#fff' }, isDesktopWeb && { fontSize: scaleValue(15, webScale) }]}>Check</Text>
          </View>
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
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 0,
    justifyContent: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  inputShell: {
    minHeight: 104,
    borderRadius: 12,
    borderWidth: 1.5,
    borderBottomWidth: 1.5,
    borderColor: '#D6E2EE',
    borderBottomColor: '#D6E2EE',
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
    borderColor: '#4AA3D2',
    borderBottomColor: '#2584B2',
  },
  fillInput: {
    minHeight: 56,
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    borderWidth: 0,
    paddingLeft: 16,
    paddingRight: 44,
  },
  fillInputTight: {
    paddingLeft: 12,
    paddingRight: 36,
  },
  fillPlaceholderOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  fillPlaceholderText: {
    fontWeight: '500',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  fillInputDesktopWeb: {
    paddingLeft: 16,
    paddingRight: 44,
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
    borderRadius: 999,
    backgroundColor: '#1F7AD1',
    borderWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledCheckAnswerButton: {
    opacity: 0.45,
  },
  checkAnswerButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkAnswerButtonText: {
    color: '#fff',
    fontSize: 18,
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
  },
  checkAnswerButtonDesktopWeb: {
    minHeight: 44,
  },
  incorrectOption: {
    backgroundColor: '#FFE8EC',
    borderColor: '#F06A7F',
  },
});
