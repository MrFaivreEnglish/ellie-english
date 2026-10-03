import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import Text, { ThemedTextInput as TextInput } from '../../shared/ThemedText';
import MaterialIcons from '../../shared/ThemedMaterialIcon';
import { Exercise, normalizeAnswer } from './GrammarExerciseUtils';
import { getGrammarGameColors, getSoftShadow, withColorAlpha } from '../../shared/uiPrimitives';
import { triggerSelectionHaptic } from '../../shared/haptics';
import { usePersistentExerciseKeyboard } from '../../shared/usePersistentExerciseKeyboard';
import { clampNumber, getWebLessonScale, isDesktopWebWidth, scaleValue } from '../../shared/responsiveLayout';
import type { ThemeColors } from '../../settings/ThemeContext';

interface GrammarFillExerciseProps {
  exercise?: Exercise;
  colors: ThemeColors;
  isDarkMode: boolean;





  practiceSheetReady?: boolean;






  keyboardDismissed?: boolean;
  onKeyboardRestore?: () => void;







  reservesKeyboardSpace?: boolean;
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
  practiceSheetReady = true,
  keyboardDismissed = false,
  onKeyboardRestore,
  reservesKeyboardSpace = false,
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
  const isDesktopWeb = isDesktopWebWidth(width);
  const webLessonScale = getWebLessonScale(width, height);





  const isScaledLayout = isDesktopWeb || webLessonScale > 1;
  const inputRef = useRef<React.ElementRef<typeof TextInput> | null>(null);
  const [fillAnswer, setFillAnswer] = useState('');
  const [isInputFocused, setIsInputFocused] = useState(false);
  const grammarGame = getGrammarGameColors(colors, isDarkMode);
  const {
    shouldKeepKeyboardOpen: shouldAllowKeyboardFocus,
    focusInput,
    focusInputSequence,
    focusOnExerciseChange,
    clearFocusTimeouts,
  } = usePersistentExerciseKeyboard({
    inputRef,


    enabled: !isDesktopWeb && !keyboardDismissed,
    androidFocusRetries: Platform.OS === 'android',
  });




  const isSubmitRefocusPendingRef = useRef(false);

  const handleFillAnswerChange = useCallback((value: string) => {
    if (userAnswer !== '') return;
    setFillAnswer(value);
  }, [userAnswer]);

  useEffect(() => {
    setFillAnswer('');
  }, [exercise?.question, exercise?.answer]);













  // Waiting for sheet readiness avoids an Android keyboard-resize race during entrance.
  useEffect(() => {
    if (!practiceSheetReady || !exercise) return;




    if (isDesktopWeb) {
      inputRef.current?.focus();
      return;
    }

    if (!shouldAllowKeyboardFocus) return;
    focusOnExerciseChange();
  }, [exercise?.question, focusOnExerciseChange, isDesktopWeb, practiceSheetReady, shouldAllowKeyboardFocus]);

  const handleSubmit = useCallback(async () => {
    if (!exercise || userAnswer !== '' || typeof exercise.answer !== 'string') return;

    const isCorrect = normalizeAnswer(fillAnswer) === normalizeAnswer(exercise.answer);

    isSubmitRefocusPendingRef.current = true;
    try {
      if (isCorrect) {
        await onCorrect(exercise.answer);




        // Feedback transitions can consume the first Android focus request.
        focusInputSequence([0, 180, 1900]);
      } else {
        onIncorrect('fill');
        focusInput();
      }
    } finally {
      setTimeout(() => {
        isSubmitRefocusPendingRef.current = false;
      }, isCorrect ? 2000 : 300);
    }
  }, [exercise, userAnswer, fillAnswer, onCorrect, onIncorrect, focusInput, focusInputSequence]);

  const handleClear = useCallback(() => {
    triggerSelectionHaptic();
    setFillAnswer('');
    focusInput();
  }, [focusInput]);

  const handleInputPress = useCallback(() => {
    onKeyboardRestore?.();
    focusInput();
  }, [focusInput, onKeyboardRestore]);

  const handleInputBlur = useCallback(() => {
    setIsInputFocused(false);
    if (keyboardDismissed || isSubmitRefocusPendingRef.current) return;
    focusInput(120);
  }, [focusInput, keyboardDismissed]);



  useEffect(() => {
    if (!keyboardDismissed) return;
    clearFocusTimeouts();
    inputRef.current?.blur();
  }, [clearFocusTimeouts, keyboardDismissed]);

  const disabled = fillAnswer.trim() === '' || userAnswer !== '';
  const canClear = fillAnswer.length > 0 && userAnswer === '';

  const inputProps = {
    ref: inputRef,
    value: fillAnswer,
    onChangeText: handleFillAnswerChange,
    autoCapitalize: 'none' as const,
    autoCorrect: false,
    blurOnSubmit: false,
    submitBehavior: 'submit' as const,
    editable: !!exercise,
    showSoftInputOnFocus: true,
    returnKeyType: 'send' as const,
    onFocus: () => setIsInputFocused(true),
    onBlur: handleInputBlur,
    onSubmitEditing: handleSubmit,
  };
  const inputShellStateStyle = [
    isInputFocused && styles.inputShellFocused,
    isInputFocused && {
      backgroundColor: grammarGame.inputFocusedSurface,
      borderColor: grammarGame.answerSelectedBorder,
    },
    incorrectAnswer === 'fill' && styles.inputShellIncorrect,
    incorrectAnswer === 'fill' && {
      backgroundColor: grammarGame.incorrectSurface,
      borderColor: grammarGame.incorrectBorder,
    },
  ];
  const clearButton = canClear && (
    <TouchableOpacity
      onPress={handleClear}
      accessibilityRole="button"
      accessibilityLabel="Clear answer"
      style={[
        styles.clearInputButton,


        isScaledLayout && {
          width: scaleValue(44, webLessonScale),
          height: scaleValue(44, webLessonScale),
          right: scaleValue(12, webLessonScale),
          marginTop: -scaleValue(22, webLessonScale),
          borderRadius: scaleValue(22, webLessonScale),
        },
      ]}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <MaterialIcons name="close" size={scaleValue(22, webLessonScale)} color={grammarGame.metaText} />
    </TouchableOpacity>
  );
  const errorText = incorrectAnswer === 'fill' && (
    <Text style={[styles.fillErrorText, { color: grammarGame.incorrectText }]}>Try again.</Text>
  );

  if (isDesktopWeb) {
    const availableStageHeight = layoutHeight ?? height;
    const isRoomyDesktop = availableStageHeight >= 520;
    const inputHeight = scaleValue(isRoomyDesktop ? 80 : 74, webLessonScale);
    const buttonHeight = scaleValue(isRoomyDesktop ? 54 : 50, webLessonScale);
    const controlFontSize = scaleValue(isRoomyDesktop ? 20 : 18, webLessonScale);
    // Re-anchored from the old 760 base to ~900 so it starts at the confirmed-good width
    // at reference scale, while still scaling proportionally with the monitor like before.
    const desktopCardMaxWidth = scaleValue(900, webLessonScale);

    return (
      <View
        ref={optionsContainerRef}
        onLayout={(e) => onOptionsLayout(e.nativeEvent.layout.y)}




        style={[styles.fillContainer, { maxWidth: desktopCardMaxWidth }]}
      >
        <View
          ref={firstOptionRef}
          onLayout={(e) => {
            onFirstOptionLayout(e.nativeEvent.layout.y);
            onCardHeightChange?.(e.nativeEvent.layout.height);
          }}
          style={[
            styles.fillCard,
            styles.fillCardDesktop,
            {
              maxWidth: desktopCardMaxWidth,
              borderRadius: scaleValue(20, webLessonScale),
              gap: scaleValue(isRoomyDesktop ? 24 : 22, webLessonScale),
              paddingHorizontal: scaleValue(isRoomyDesktop ? 30 : 26, webLessonScale),
              paddingVertical: scaleValue(isRoomyDesktop ? 20 : 18, webLessonScale),
              backgroundColor: grammarGame.panelSurface,
              borderColor: grammarGame.panelBorder,
              ...getSoftShadow(isDarkMode, 'soft', colors.shadow, colors.visualStyle === 'pixel'),
            },
          ]}
        >
          <Pressable
            onPress={handleInputPress}
            accessible={false}
            style={[
              styles.inputShell,
              styles.inputShellDesktopWeb,
              {
                height: inputHeight,
                borderRadius: scaleValue(14, webLessonScale),
                paddingHorizontal: scaleValue(18, webLessonScale),
              },
              {
                backgroundColor: grammarGame.inputSurface,
                borderColor: grammarGame.answerBorder,
                boxShadow: isDarkMode
                  ? '0px 2px 4px rgba(0,0,0,0.20)'
                  : `0px 2px 6px ${withColorAlpha(colors.shadow, 0.72)}`,
              },
              ...inputShellStateStyle,
            ]}
          >
            <TextInput
              {...inputProps}
              style={[
                styles.fillInput,
                styles.fillInputDesktopWeb,




                { paddingLeft: scaleValue(44, webLessonScale), paddingRight: scaleValue(44, webLessonScale) },
                { fontSize: controlFontSize },
                { color: grammarGame.answerText },
                { outlineStyle: 'none' } as any,
              ]}
            />
            {!fillAnswer && (
              <View style={[styles.fillPlaceholderOverlay, { pointerEvents: 'none' }]}>
                <Text
                  style={[
                    styles.fillPlaceholderText,
                    styles.fillInputDesktopWeb,
                    { fontSize: controlFontSize },
                    { color: grammarGame.metaText },
                  ]}
                >
                  Type your answer...
                </Text>
              </View>
            )}
            {clearButton}
          </Pressable>
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityState={{ disabled }}
            style={[
              styles.checkAnswerButton,
              styles.checkAnswerButtonDesktopWeb,
              { height: buttonHeight, minHeight: buttonHeight, marginTop: 0 },
              {
                backgroundColor: grammarGame.checkButtonBg,
                borderColor: grammarGame.checkButtonBg,
                borderBottomColor: grammarGame.checkButtonBg,
                borderRadius: 999,
                boxShadow: `0px 4px 12px ${withColorAlpha(grammarGame.checkButtonBg, 0.3)}`,
              },
              disabled && styles.disabledCheckAnswerButton,
            ]}
          >
            <View style={styles.checkAnswerButtonInner}>
              <MaterialIcons name="check" size={scaleValue(isRoomyDesktop ? 23 : 21, webLessonScale)} color={grammarGame.buttonText} />
              <Text
                style={[
                  styles.checkAnswerButtonText,
                  { color: grammarGame.buttonText },
                  styles.checkAnswerButtonTextDesktop,



                  { fontSize: scaleValue(isRoomyDesktop ? 19 : 18, webLessonScale) },
                ]}
              >
                Check
              </Text>
            </View>
          </TouchableOpacity>
          {errorText}
        </View>
      </View>
    );
  }








  // Screens with real vertical headroom — a tall phone, or native running full-screen with
  // no browser chrome eating into the viewport — get a noticeably bigger card instead of the
  // same fixed size everywhere; the card used to leave a large unused gap under the prompt.
  const availableStageHeight = layoutHeight ?? height;
  const roomFactor = clampNumber((availableStageHeight - 560) / 220, 0, 1);
  const inputHeight = scaleValue(reservesKeyboardSpace ? 60 + 12 * roomFactor : 72 + 18 * roomFactor, webLessonScale);
  const controlFontSize = scaleValue(reservesKeyboardSpace ? 17 + 2 * roomFactor : 19 + 3 * roomFactor, webLessonScale);
  const buttonHeight = scaleValue(reservesKeyboardSpace ? 44 + 8 * roomFactor : 52 + 10 * roomFactor, webLessonScale);
  const buttonMarginTop = scaleValue(reservesKeyboardSpace ? 14 + 6 * roomFactor : 24 + 10 * roomFactor, webLessonScale);
  const cardGap = Math.round(12 + 8 * roomFactor);
  const checkIconSize = scaleValue(18, webLessonScale);
  const checkButtonTextFontSize = scaleValue(15.5, webLessonScale);
  // The card's intrinsic content (input + button) is short, so anchoring it to the prompt
  // without a height floor left most of the screen empty below it. Claim a real share of the
  // available stage height and center the input/button inside that taller card instead.
  const cardMinHeight = Math.round(clampNumber(
    availableStageHeight * (reservesKeyboardSpace ? 0.3 : 0.4),
    reservesKeyboardSpace ? 180 : 240,
    reservesKeyboardSpace ? 320 : 440
  ));

  return (
    <View style={styles.fillContainer}>
      <View
        ref={firstOptionRef}
        onLayout={(e) => {
          onFirstOptionLayout(e.nativeEvent.layout.y);
          onCardHeightChange?.(e.nativeEvent.layout.height);
        }}
        style={[
          styles.fillCard,
          styles.fillCardMobile,
          { gap: cardGap, minHeight: cardMinHeight, justifyContent: 'center' },
        ]}
      >
        {/* The success card measures this group, not the card above it: the card claims a
            share of the stage height (cardMinHeight) and centres these controls inside it,
            so measuring the card covered a tall band of empty space as well. */}
        <View
          ref={optionsContainerRef}
          onLayout={(e) => onOptionsLayout(e.nativeEvent.layout.y)}
          style={[styles.fillControlGroup, { gap: cardGap }]}
        >
          <Pressable
            onPress={handleInputPress}
            accessible={false}
            style={[
              styles.inputShell,
              { height: inputHeight },
              {
                backgroundColor: grammarGame.inputSurface,
                borderColor: grammarGame.answerBorder,
                boxShadow: isDarkMode
                  ? '0px 2px 4px rgba(0,0,0,0.20)'
                  : `0px 2px 6px ${withColorAlpha(colors.shadow, 0.72)}`,
              },
              ...inputShellStateStyle,
            ]}
          >
            <TextInput
              {...inputProps}
              style={[
                styles.fillInput,
                { fontSize: controlFontSize },
                { color: grammarGame.answerText },
                { outlineStyle: 'none' } as any,
              ]}
            />
            {!fillAnswer && (
              <View style={[styles.fillPlaceholderOverlay, { pointerEvents: 'none' }]}>
                <Text style={[styles.fillPlaceholderText, { fontSize: controlFontSize }, { color: grammarGame.metaText }]}>
                  Type your answer...
                </Text>
              </View>
            )}
            {clearButton}
          </Pressable>
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityState={{ disabled }}
            style={[
              styles.checkAnswerButton,
              { height: buttonHeight, minHeight: buttonHeight, marginTop: buttonMarginTop },
              {
                backgroundColor: grammarGame.checkButtonBg,
                borderColor: grammarGame.checkButtonBg,
                borderBottomColor: grammarGame.checkButtonBg,
                borderRadius: 999,
                boxShadow: `0px 4px 12px ${withColorAlpha(grammarGame.checkButtonBg, 0.3)}`,
              },
              disabled && styles.disabledCheckAnswerButton,
            ]}
          >
            <View style={styles.checkAnswerButtonInner}>
              <MaterialIcons name="check" size={checkIconSize} color={grammarGame.buttonText} />
              <Text style={[styles.checkAnswerButtonText, { fontSize: checkButtonTextFontSize, color: grammarGame.buttonText }]}>Check</Text>
            </View>
          </TouchableOpacity>
        </View>
        {errorText}
      </View>
    </View>
  );
};

export default React.memo(GrammarFillExercise);

const styles = StyleSheet.create({






  fillContainer: {
    width: '90%',
    alignSelf: 'center',
  },
  fillControlGroup: {
    width: '100%',
  },
  fillCard: {
    width: '100%',
    backgroundColor: 'transparent',
    gap: 12,
  },
  fillCardMobile: {
    paddingHorizontal: 14,
  },
  fillCardDesktop: {
    alignSelf: 'center',
    maxWidth: 760,
    borderRadius: 20,
    borderWidth: 1,
  },
  inputShell: {
    height: 72,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#DDD4C9',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    justifyContent: 'center',
    position: 'relative',
    boxShadow: '0px 2px 6px rgba(110,75,69,0.08)',
  },


  inputShellDesktopWeb: {
    paddingHorizontal: 18,
  },
  inputShellIncorrect: {
    backgroundColor: '#FFF4F6',
    borderColor: '#F06A7F',
    borderBottomColor: '#D94E64',
  },
  inputShellFocused: {
    backgroundColor: '#FFFFFF',
    borderColor: '#0891C9',
  },
  fillInput: {
    height: '100%',
    fontSize: 19,
    fontWeight: '500',
    textAlign: 'center',
    borderWidth: 0,




    paddingLeft: 44,
    paddingRight: 44,
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
    width: '100%',
    fontSize: 19,
  },
  fillInputDesktopWeb: {
    paddingLeft: 44,
    paddingRight: 44,
    fontSize: 16,
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
    height: 52,
    minHeight: 52,
    width: '68%',
    marginTop: 24,
    alignSelf: 'center',
    borderRadius: 999,
    backgroundColor: '#1F7AD1',
    borderWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0px 4px 12px rgba(8,145,201,0.30)',
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
    fontSize: 15.5,
    fontWeight: '800',
  },
  fillErrorText: {
    color: '#A12A3D',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 10,
    textAlign: 'center',
  },


  checkAnswerButtonDesktopWeb: {},
  checkAnswerButtonTextDesktop: { fontSize: 16 },
  incorrectOption: {
    backgroundColor: '#FFE8EC',
    borderColor: '#F06A7F',
  },
});
