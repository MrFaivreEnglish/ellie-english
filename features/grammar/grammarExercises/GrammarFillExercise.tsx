import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { CARD_HEIGHT, Exercise, normalizeAnswer } from './GrammarExerciseUtils';
import { clampNumber, getWebLessonScale, scaleValue } from '../../shared/responsiveLayout';
import { getPrimaryButtonStyle } from '../../shared/uiPrimitives';
import { triggerSelectionHaptic } from '../../shared/haptics';
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

  const focusInput = useCallback(() => {
    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  }, []);

  const handleFillAnswerChange = useCallback((value: string) => {
    if (userAnswer !== '') return;
    setFillAnswer(value);
  }, [userAnswer]);

  useEffect(() => {
    setFillAnswer('');
  }, [exercise?.question, exercise?.answer]);

  useEffect(() => {
    if (userAnswer !== '') return;

    const timeoutId = setTimeout(() => {
      inputRef.current?.focus();
    }, 60);

    return () => clearTimeout(timeoutId);
  }, [exercise?.question, focusInput, userAnswer]);

  const handleSubmit = async () => {
    if (!exercise || userAnswer !== '' || typeof exercise.answer !== 'string') return;

    const isCorrect = normalizeAnswer(fillAnswer) === normalizeAnswer(exercise.answer);

    if (isCorrect) {
      await onCorrect(exercise.answer);
    } else {
      onIncorrect('fill');
      focusInput();
    }
  };

  const handleClear = () => {
    triggerSelectionHaptic();
    setFillAnswer('');
    focusInput();
  };

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
            backgroundColor: colors.card,
            borderColor: isDarkMode ? colors.borderStrong : colors.border,
            borderBottomColor: isDarkMode ? colors.buttonBackground : colors.borderStrong,
            shadowColor: isDarkMode ? colors.buttonBackground : '#000',
          },
        ]}
      >
        <Pressable
          onPress={focusInput}
          style={[
            styles.inputShell,
            useTightKeyboardStyles && styles.inputShellTight,
            isDesktopWeb && styles.inputShellDesktopWeb,
            {
              minHeight: inputShellMinHeight,
              paddingVertical: inputShellVerticalPadding,
              marginBottom: inputShellMarginBottom,
              backgroundColor: isDarkMode ? colors.surface : colors.surfaceAlt,
              borderColor: isDarkMode ? colors.borderStrong : colors.border,
              borderBottomColor: isDarkMode ? colors.buttonBackground : colors.borderStrong,
            },
            isInputFocused && styles.inputShellFocused,
            isInputFocused && {
              backgroundColor: isDarkMode ? colors.surfaceAlt : colors.primarySoft,
              borderColor: colors.primary,
              borderBottomColor: colors.primary,
            },
            incorrectAnswer === 'fill' && styles.inputShellIncorrect,
            incorrectAnswer === 'fill' && {
              backgroundColor: colors.dangerSoft,
              borderColor: colors.danger,
              borderBottomColor: colors.danger,
            },
          ]}
        >
          <TextInput
            ref={inputRef}
            value={fillAnswer}
            onChangeText={handleFillAnswerChange}
            placeholder="Type your answer..."
            placeholderTextColor={colors.secondaryText}
            autoCapitalize="none"
            autoCorrect={false}
            blurOnSubmit={false}
            submitBehavior="submit"
            editable={!!exercise}
            showSoftInputOnFocus
            returnKeyType="done"
            onFocus={() => setIsInputFocused(true)}
            onBlur={() => setIsInputFocused(false)}
            onSubmitEditing={handleSubmit}
            style={[
              styles.fillInput,
              useTightKeyboardStyles && styles.fillInputTight,
              isDesktopWeb && styles.fillInputDesktopWeb,
              { minHeight: fillInputMinHeight, fontSize: fillInputFontSize },
              { color: colors.text },
              { outlineStyle: 'none' } as any,
            ]}
          />
          {canClear && (
            <TouchableOpacity
              onPress={handleClear}
              style={styles.clearInputButton}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <MaterialIcons name="close" size={22} color={colors.secondaryText} />
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
          <Text style={[styles.fillErrorText, { color: colors.dangerText }]}>Try again.</Text>
        )}
      </View>
    </View>
  );
};

export default GrammarFillExercise;

const styles = StyleSheet.create({
  fillContainer: {
    height: CARD_HEIGHT,
  },
  fillCard: {
    height: CARD_HEIGHT,
    padding: 20,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderBottomWidth: 4,
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
    borderWidth: 2,
    borderBottomWidth: 4,
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
    backgroundColor: '#ECF6FF',
    borderColor: '#1671B6',
    borderBottomColor: '#0F5E98',
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
    backgroundColor: '#1671B6',
    borderWidth: 2,
    borderBottomWidth: 4,
    borderColor: '#1671B6',
    borderBottomColor: '#0F5E98',
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
