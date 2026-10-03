import React, { useCallback, useEffect, useRef } from 'react';
import { Animated, Easing, Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import Text from '../../shared/ThemedText';
import { Exercise } from './GrammarExerciseUtils';
import { scaleValue } from '../../shared/responsiveLayout';
import { getGrammarGameColors, getSoftShadow } from '../../shared/uiPrimitives';
import { QUIZ_OPTIONS_MAX_WIDTH } from '../../shared/exerciseLayoutTokens';
import { freshFontFamily } from '../../shared/freshDirection';
import useReducedMotion from '../../shared/useReducedMotion';
import type { ThemeColors } from '../../settings/ThemeContext';

interface GrammarQuizExerciseProps {
  exercise?: Exercise;
  colors: ThemeColors;
  isDarkMode: boolean;
  isGameMode: boolean;
  isDesktopWeb: boolean;





  isScaledLayout?: boolean;
  webLessonScale: number;
  optionHeight: number;
  optionGap: number;
  userAnswer: string;
  incorrectAnswer: string;
  optionsContainerRef: React.RefObject<View | null>;
  firstOptionRef: React.RefObject<View | null>;
  onOptionsLayout: (y: number) => void;
  onFirstOptionLayout: (y: number) => void;
  onCardHeightChange?: (height: number) => void;
  onAnswerPress: (option: string) => void;
}

const GrammarQuizExercise: React.FC<GrammarQuizExerciseProps> = ({
  exercise,
  colors,
  isDarkMode,
  isGameMode,
  isDesktopWeb,
  isScaledLayout = isDesktopWeb,
  webLessonScale,
  optionHeight,
  optionGap,
  userAnswer,
  incorrectAnswer,
  optionsContainerRef,
  firstOptionRef,
  onOptionsLayout,
  onFirstOptionLayout,
  onCardHeightChange,
  onAnswerPress,
}) => {
  const grammarGame = getGrammarGameColors(colors, isDarkMode);
  // The red option and feedback already mark the answer; the shake and pulse are extra.
  const reducedMotion = useReducedMotion();

  const optionShakeAnimsRef = useRef<Map<string, Animated.Value>>(new Map());
  const getOptionShakeAnim = useCallback((option: string) => {
    const existing = optionShakeAnimsRef.current.get(option);
    if (existing) return existing;
    const shakeAnim = new Animated.Value(0);
    optionShakeAnimsRef.current.set(option, shakeAnim);
    return shakeAnim;
  }, []);

  useEffect(() => {
    if (!incorrectAnswer || reducedMotion) return;
    const shakeAnim = getOptionShakeAnim(incorrectAnswer);
    shakeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: -8, duration: 45, useNativeDriver: Platform.OS !== 'web' }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 90, useNativeDriver: Platform.OS !== 'web' }),
      Animated.timing(shakeAnim, { toValue: -6, duration: 80, useNativeDriver: Platform.OS !== 'web' }),
      Animated.timing(shakeAnim, { toValue: 6, duration: 70, useNativeDriver: Platform.OS !== 'web' }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: Platform.OS !== 'web' }),
    ]).start();
  }, [incorrectAnswer, getOptionShakeAnim, reducedMotion]);

  const optionPulseAnimsRef = useRef<Map<string, Animated.Value>>(new Map());
  const getOptionPulseAnim = useCallback((option: string) => {
    const existing = optionPulseAnimsRef.current.get(option);
    if (existing) return existing;
    const pulseAnim = new Animated.Value(1);
    optionPulseAnimsRef.current.set(option, pulseAnim);
    return pulseAnim;
  }, []);

  useEffect(() => {
    if (!userAnswer) return;
    if (userAnswer !== exercise?.answer || reducedMotion) return;
    const pulseAnim = getOptionPulseAnim(userAnswer);
    pulseAnim.setValue(1);
    Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1.06, duration: 110, easing: Easing.out(Easing.cubic), useNativeDriver: Platform.OS !== 'web' }),
      Animated.timing(pulseAnim, { toValue: 1, duration: 140, easing: Easing.out(Easing.cubic), useNativeDriver: Platform.OS !== 'web' }),
    ]).start();
  }, [userAnswer, exercise, getOptionPulseAnim, reducedMotion]);

  const options = exercise?.options ?? (typeof exercise?.answer === 'boolean' ? ['True', 'False'] : []);

  return (
    <View
      ref={optionsContainerRef}
      onLayout={(e) => {
        onOptionsLayout(e.nativeEvent.layout.y);
        onCardHeightChange?.(e.nativeEvent.layout.height);
      }}
      style={[
        styles.optionsContainer,
        isDesktopWeb && styles.optionsContainerDesktopWeb,
        isDesktopWeb && { maxWidth: scaleValue(QUIZ_OPTIONS_MAX_WIDTH, webLessonScale) },
        {




          minHeight: options.length * optionHeight + Math.max(0, options.length - 1) * optionGap,
          gap: optionGap,
        },
      ]}
    >
      {options.map((option, index) => {
        const isFirst = index === 0;
        const isSelected = userAnswer === option;
        const isIncorrect = incorrectAnswer === option;
        const isCorrect = !isGameMode && userAnswer === exercise?.answer && option === exercise?.answer;
        return (
          <Animated.View
            key={option}
            style={{
              transform: [
                { translateX: getOptionShakeAnim(option) },
                { scale: getOptionPulseAnim(option) },
              ],
            }}
          >
            <TouchableOpacity
              onPress={() => onAnswerPress(option)}
              ref={isFirst ? firstOptionRef : undefined}
              onLayout={isFirst ? (e) => onFirstOptionLayout(e.nativeEvent.layout.y) : undefined}
              accessibilityRole="button"
              accessibilityLabel={option}
              accessibilityState={{ selected: isSelected, disabled: !!userAnswer && !isSelected }}
              style={[
                styles.optionButton,
                {
                  minHeight: optionHeight,
                  paddingVertical: scaleValue(12, webLessonScale),
                  paddingHorizontal: scaleValue(16, webLessonScale),
                },
                {
                  backgroundColor: grammarGame.answerSurface,
                  borderColor: grammarGame.answerBorder,
                  borderBottomColor: grammarGame.answerBottom,
                  ...getSoftShadow(isDarkMode, 'soft', colors.shadow, colors.visualStyle === 'pixel'),
                },
                isSelected && [
                  styles.selectedOption,
                  {
                    backgroundColor: grammarGame.answerSelectedSurface,
                    borderColor: grammarGame.answerSelectedBorder,
                    borderBottomColor: grammarGame.answerSelectedBottom,
                    borderWidth: 1.5,
                  },
                ],
                isIncorrect && [
                  styles.incorrectOption,
                  {
                    backgroundColor: grammarGame.incorrectSurface,
                    borderColor: grammarGame.incorrectBorder,
                    borderBottomColor: grammarGame.incorrectBottom,
                    borderWidth: 1.5,
                  },
                ],
                isCorrect && [
                  styles.correctAnswer,
                  {
                    backgroundColor: grammarGame.correctSurface,
                    borderColor: grammarGame.correctBorder,
                    borderBottomColor: grammarGame.correctBottom,
                    borderWidth: 1.5,
                  },
                ],
              ]}
            >
              <View
                style={[
                  styles.optionLetterBadge,


                  isScaledLayout && {
                    width: scaleValue(34, webLessonScale),
                    height: scaleValue(34, webLessonScale),
                  },
                  { backgroundColor: grammarGame.answerSelectedSurface },
                ]}
              >
                <Text
                  style={[
                    styles.optionLetterBadgeText,
                    isScaledLayout && { fontSize: scaleValue(14, webLessonScale) },
                    { color: grammarGame.answerSelectedBottom },
                  ]}
                >
                  {String.fromCharCode(65 + index)}
                </Text>
              </View>
              <Text style={[
                styles.optionText,
                { flexShrink: 1 },
                isScaledLayout && {
                  fontSize: scaleValue(19, webLessonScale),
                  lineHeight: scaleValue(25, webLessonScale),
                  fontWeight: freshFontFamily.semibold,
                },
                { color: grammarGame.answerText },
                isIncorrect && [styles.incorrectOptionText, { color: grammarGame.incorrectText }],
                isCorrect && [styles.correctAnswerText, { color: grammarGame.correctText }],
              ]}>{option}</Text>
            </TouchableOpacity>
          </Animated.View>
        );
      })}
    </View>
  );
};

export default GrammarQuizExercise;

const styles = StyleSheet.create({




  optionsContainer: {
    backgroundColor: 'transparent',
    flexDirection: 'column',
    width: '90%',
  },



  optionsContainerDesktopWeb: {
    alignSelf: 'center',
  },



  optionButton: {
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 0,
    borderColor: '#E5E5E5',
    borderBottomColor: '#E5E5E5',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    boxShadow: '0px 3px 8px rgba(0,0,0,0.05)',
  },



  optionLetterBadge: {
    width: 38,
    height: 38,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  optionLetterBadgeText: {
    fontSize: 15,
    fontWeight: freshFontFamily.extrabold,
  },
  selectedOption: { borderColor: '#78CBFF', borderBottomColor: '#1396D8', backgroundColor: '#D7F0FF' },
  incorrectOption: { backgroundColor: '#FFE8EC', borderColor: '#F06A7F', borderBottomColor: '#D94E64' },
  optionText: { flexShrink: 1, flexWrap: 'wrap', fontWeight: freshFontFamily.semibold, fontSize: 18, color: '#24313D' },
  incorrectOptionText: { color: '#8F2234' },
  correctAnswer: { backgroundColor: '#E9F8EF', borderColor: '#42C67A', borderBottomColor: '#28A360' },
  correctAnswerText: { color: '#12663D' },
});
