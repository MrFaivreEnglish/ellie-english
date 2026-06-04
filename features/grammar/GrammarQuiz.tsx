import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions, Animated, Platform, useWindowDimensions, Easing, KeyboardAvoidingView, ScrollView, Keyboard } from 'react-native';
import { useTheme } from '../settings/ThemeContext';
import { useAudioPlayer } from 'expo-audio';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import assets from '../../assets/index';
import BackButton from '../shared/BackButton';
import ImageWithCredit from '../shared/ImageWithCredit';
import GrammarFillExercise from './grammarExercises/GrammarFillExercise';
import GrammarModeTabs from './grammarExercises/GrammarModeTabs';
import GrammarReorderExercise from './grammarExercises/GrammarReorderExercise';
import GrammarTranslateExercise from './grammarExercises/GrammarTranslateExercise';
import { clampNumber, getWebLessonImageScale, getWebLessonScale, scaleValue } from '../shared/responsiveLayout';
import {
  CARD_HEIGHT,
  Exercise,
  ExerciseMode,
  getQuestionsForMode,
  isFillExercise,
  isReorderExercise,
  isTranslateExercise,
} from './grammarExercises/GrammarExerciseUtils';
import {
  BEST_SUCCESS_SOUND,
  BIG_SUCCESS_SOUND,
  SOUND_EFFECT_OPTIONS,
  SUCCESS_SOUND,
  replaySoundEffect,
} from '../shared/soundEffects';
import { getGrammarLessonProgressKey, recordGrammarCorrectAnswer } from './grammarProgressStorage';
import { addXP, getXP, markPracticeActivityToday } from '../progress/xpStorage';
import { XP_REWARDS } from '../progress/xpRewards';
import { saveLastLesson } from '../progress/lastLessonStorage';
import LevelProgressSummary from '../progress/LevelProgressSummary';
import { triggerSelectionHaptic, triggerSuccessHaptic, triggerWarningHaptic } from '../shared/haptics';

interface GrammarQuizProps {
  lesson: {
    title: string;
    id?: string | number;
    imageUrl: string;
    exercises: Exercise[];
    availableModes?: Partial<Record<ExerciseMode, boolean>>;
  };
  onBack: () => void;
  backLabel?: string;
}

const { width: screenWidth } = Dimensions.get('window');
const ANDROID_SECOND_VIEW_LAYOUT = {
  modeRowTopGap: 18,
  modeRowTopGapWithStatusBar: 4,
};

const renderPromptText = (prompt?: string) => {
  if (!prompt) return null;

  return prompt.split(/(\([^)]*\))/g).map((part, index) => {
    const isParenthetical = part.startsWith('(') && part.endsWith(')');

    return (
      <Text key={`${part}-${index}`} style={isParenthetical && styles.parentheticalPromptText}>
        {part}
      </Text>
    );
  });
};

const GrammarQuiz: React.FC<GrammarQuizProps> = ({ lesson, onBack, backLabel = 'Back to Grammar', navigation }: any) => {
  const { colors, isDarkMode, isGrammarGameMode, isAndroidStatusBarEnabled } = useTheme();
  const STICKY_TOP_SNAP_OFFSET = 0;
  const insets = useSafeAreaInsets();
  const { width: windowWidth, height: rawWindowHeight } = useWindowDimensions();
  const [exerciseMode, setExerciseMode] = useState<ExerciseMode>('quiz');
  const [viewportHeight, setViewportHeight] = useState(rawWindowHeight);
  const [isSecondViewActive, setIsSecondViewActive] = useState(false);
  const [stableWindowHeight, setStableWindowHeight] = useState(rawWindowHeight);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const keyboardHeightDrop = stableWindowHeight - rawWindowHeight;
  const isKeyboardOpen = keyboardHeight > 0 || keyboardHeightDrop > 120;
  const isFillKeyboardOpen = exerciseMode === 'fill' && isKeyboardOpen;
  const windowHeight = isKeyboardOpen ? stableWindowHeight : rawWindowHeight;
  const lessonViewportHeight = viewportHeight > 0 ? viewportHeight : windowHeight;
  const isDesktopWebLayout = Platform.OS === 'web' && windowWidth >= 768;
  const isCompactScreen = lessonViewportHeight < 760 || windowWidth < 390;
  const isKeyboardTightScreen = !isDesktopWebLayout && (lessonViewportHeight < 700 || windowWidth < 380);
  const isLargeScreen = lessonViewportHeight > 900 && windowWidth >= 400;
  const webLessonScale = getWebLessonScale(windowWidth, lessonViewportHeight);
  const webLessonImageScale = getWebLessonImageScale(windowWidth, lessonViewportHeight);
  const isScaledWebLesson = isDesktopWebLayout && webLessonScale > 1;
  const webLessonMediaMaxWidth = Platform.OS === 'web'
    ? Math.round(clampNumber(windowWidth * 0.78, 860, 1320))
    : undefined;
  const webExerciseMaxWidth = Platform.OS === 'web'
    ? isDesktopWebLayout
      ? Math.round(clampNumber(windowWidth * 0.66, 860, 1040))
      : scaleValue(760, webLessonScale)
    : undefined;
  const quizCardHeight = Platform.OS === 'web'
    ? scaleValue(isDesktopWebLayout ? 320 : CARD_HEIGHT, webLessonScale)
    : CARD_HEIGHT;
  const quizOptionGap = Platform.OS === 'web' ? scaleValue(6, webLessonScale) : 6;
  const quizOptionHeight = (quizCardHeight - quizOptionGap * 3) / 4;
  const layoutTopInset = Platform.OS === 'ios'
    ? (insets.top > 0 ? insets.top : 0)
    : Platform.OS === 'android' && isAndroidStatusBarEnabled
      ? insets.top
      : 0;
  const layoutBottomInset = Platform.OS === 'android' ? 0 : insets.bottom;
  const stickyHeaderTopPadding = Platform.OS === 'web' ? 4 : 6;
  const androidSecondViewTopInset = Platform.OS === 'android' && isAndroidStatusBarEnabled ? layoutTopInset : 0;
  const androidModeRowTopGap = Platform.OS === 'android' && isAndroidStatusBarEnabled
    ? ANDROID_SECOND_VIEW_LAYOUT.modeRowTopGapWithStatusBar
    : ANDROID_SECOND_VIEW_LAYOUT.modeRowTopGap;
  const stickyHeaderPinnedTopPadding = Platform.OS === 'android'
    ? androidSecondViewTopInset + androidModeRowTopGap
    : stickyHeaderTopPadding;
  const QUIZ_VIEW_SNAP_EXTRA = 0;
  const FILL_VIEW_SNAP_EXTRA = 0;
  const REORDER_VIEW_SNAP_EXTRA = 0;
  const TRANSLATE_VIEW_SNAP_EXTRA = 0;
  const FIRST_VIEW_BOTTOM_SPACE = isCompactScreen ? 20 : 28;
  const FIRST_VIEW_PEEK = 0;
  const scrollViewRef = useRef<ScrollView>(null);
  const overviewHeightRef = useRef(0);
  const secondViewYRef = useRef(0);
  const initializedLessonKeyRef = useRef<string | null>(null);
  const [titleBlockHeight, setTitleBlockHeight] = useState(72);
  const [stickyHeaderHeight, setStickyHeaderHeight] = useState(112);
  const overviewMinHeight = Math.max(
    isCompactScreen ? 420 : 500,
    lessonViewportHeight - layoutTopInset - layoutBottomInset - stickyHeaderHeight - FIRST_VIEW_PEEK
  );
  // Ensure we always have a navigation object (works when component is rendered without prop)
  const navHook = useNavigation<any>();
  const nav = navigation ?? navHook;
  // Normalize image source and uri so we pass the same payload to the root FullImageModal
  const imageSource = useMemo(() => {
  return typeof lesson.imageUrl === 'string'
    ? { uri: lesson.imageUrl }
    : lesson.imageUrl;
}, [lesson.imageUrl]);
  const imageUri = typeof lesson.imageUrl === 'string' ? lesson.imageUrl : (lesson.imageUrl as any)?.uri;
  const handleImagePress = useCallback(() => {
  nav.navigate('FullImageModal', { source: imageSource, uri: imageUri });
}, [nav, imageSource, imageUri]);

  const lessonImageHeight = useMemo(() => {
    const imageReservedGap = Platform.OS === 'web'
      ? (isCompactScreen ? 62 : 70)
      : (isCompactScreen ? 64 : 72);
    const availableHeight =
      overviewMinHeight - titleBlockHeight - FIRST_VIEW_BOTTOM_SPACE - imageReservedGap;

    const minHeight = Math.round(clampNumber(
      lessonViewportHeight * (isCompactScreen ? 0.42 : 0.5),
      isCompactScreen ? 280 : 380,
      isCompactScreen ? 380 : 520
    ));
    const maxByViewport = Math.round(clampNumber(
      lessonViewportHeight * (isCompactScreen ? 0.72 : isLargeScreen ? 0.82 : 0.78),
      isCompactScreen ? 430 : 560,
      isLargeScreen ? 1060 : 900
    ));
    const maxByWidth = Platform.OS === 'web'
      ? Math.round(clampNumber(windowWidth * 0.95, 680, 1260) * webLessonImageScale)
      : Math.round(clampNumber(windowWidth * 1.8, 500, isLargeScreen ? 940 : 820));
    const maxHeight = Math.max(minHeight, Math.min(maxByViewport, maxByWidth));

    return Math.round(clampNumber(availableHeight, minHeight, maxHeight));
  }, [FIRST_VIEW_BOTTOM_SPACE, isCompactScreen, isLargeScreen, lessonViewportHeight, overviewMinHeight, titleBlockHeight, webLessonImageScale, windowWidth]);

  const secondViewMinHeight = useMemo(() => {
    const availableHeight =
      lessonViewportHeight - layoutBottomInset - stickyHeaderHeight - (isCompactScreen ? 8 : 12);
    const minHeight = isCompactScreen ? 250 : 280;
    return Math.max(minHeight, availableHeight);
  }, [isCompactScreen, layoutBottomInset, lessonViewportHeight, stickyHeaderHeight]);

  const successPlayer = useAudioPlayer(SUCCESS_SOUND, SOUND_EFFECT_OPTIONS);
  const bigSuccessPlayer = useAudioPlayer(BIG_SUCCESS_SOUND, SOUND_EFFECT_OPTIONS);
  const bestSuccessPlayer = useAudioPlayer(BEST_SUCCESS_SOUND, SOUND_EFFECT_OPTIONS);
  const [selectedQuestions, setSelectedQuestions] = useState<Exercise[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [incorrectAnswer, setIncorrectAnswer] = useState<string>('');
  const [feedback, setFeedback] = useState<string>('');
  const [answerSaveMessage, setAnswerSaveMessage] = useState('');
  const [grammarSessionXp, setGrammarSessionXp] = useState(0);
  const [lastGrammarXpGain, setLastGrammarXpGain] = useState(0);
  const [grammarTotalXP, setGrammarTotalXP] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [isGameMode, setIsGameMode] = useState(false);
  const [startedGameMode, setStartedGameMode] = useState(isGrammarGameMode);
  const [lives, setLives] = useState(3);
  const [isGameOver, setIsGameOver] = useState(false);
  const [perfectRun, setPerfectRun] = useState(false);
  const previousLivesRef = useRef(3);
  const [lostLifeIndex, setLostLifeIndex] = useState<number | null>(null);
  const lostLifeAnim = useRef(new Animated.Value(0)).current;
  // feedbackAnim now represents a translateY offset (in px). We animate with useNativeDriver for smooth native performance.
  // Positive values move the card down (off-screen below), 0 is its resting position (aligned with target top).
  // Initialize off-screen below so the card will rise up into place.
  const feedbackAnim = useRef(new Animated.Value(CARD_HEIGHT)).current;
  // feedbackTop controls the absolute top position (in px) of the feedback card within the exercise container.
  // We default to a safe inset-based value and compute a more precise value when possible via measureInWindow.
  const [feedbackTop, setFeedbackTop] = useState<number>(insets.top + 8);
  const [activeCardHeight, setActiveCardHeight] = useState(CARD_HEIGHT);
  const exerciseContainerRef = useRef<View>(null);
  const firstOptionRef = useRef<View>(null);
  const questionRef = useRef<View>(null);
  const pendingKeyboardHideScrollModeRef = useRef<ExerciseMode | null>(null);
  const lastModeSwitchAtRef = useRef(0);
  // Fallback layout tracking to ensure exact alignment even if measure APIs fail (esp. on web)
  const optionsContainerRef = useRef<View>(null);
  const [optionsContainerY, setOptionsContainerY] = useState(0); // Y of options container within exercise container
  const [firstOptionLocalY, setFirstOptionLocalY] = useState(0); // Y of first option within options container
  const hasFillExercises = (lesson.availableModes?.fill ?? true) && lesson.exercises.some(isFillExercise);
  const hasReorderExercises = (lesson.availableModes?.reorder ?? true) && lesson.exercises.some(isReorderExercise);
  const hasTranslateExercises = (lesson.availableModes?.translate ?? true) && lesson.exercises.some(isTranslateExercise);
  const exerciseModeOptions = [
    { key: 'quiz' as const, label: 'Quiz' },
    ...(hasFillExercises ? [{ key: 'fill' as const, label: 'Fill' }] : []),
    ...(hasReorderExercises ? [{ key: 'reorder' as const, label: 'Reorder' }] : []),
    ...(hasTranslateExercises ? [{ key: 'translate' as const, label: 'Translate' }] : []),
  ];
  const resolveSafeMode = useCallback(
    (requestedMode: ExerciseMode): ExerciseMode => {
      if (requestedMode === 'fill' && hasFillExercises) return 'fill';
      if (requestedMode === 'reorder' && hasReorderExercises) return 'reorder';
      if (requestedMode === 'translate' && hasTranslateExercises) return 'translate';
      return 'quiz';
    },
    [hasFillExercises, hasReorderExercises, hasTranslateExercises]
  );
  const getSecondViewScrollY = useCallback(
    (snapExtra = 0) => {
      if (Platform.OS === 'android') {
        const secondViewAnchorY = secondViewYRef.current > 0
          ? secondViewYRef.current
          : overviewHeightRef.current + layoutTopInset;

        return Math.max(0, secondViewAnchorY + snapExtra);
      }

      return Math.max(0, overviewHeightRef.current + snapExtra);
    },
    [layoutTopInset]
  );
  // full-image sizing handled by FullImageScreen at the root
  // const [exerciseBottomY, setExerciseBottomY] = useState<number>(0);
  // const [firstOptionYWindow, setFirstOptionYWindow] = useState<number>(0);

  useEffect(() => {
    let active = true;

    getXP().then((xp) => {
      if (active) setGrammarTotalXP(xp);
    });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const heightDrop = stableWindowHeight - rawWindowHeight;

    if (!isKeyboardOpen || rawWindowHeight > stableWindowHeight || heightDrop < 80) {
      setStableWindowHeight(rawWindowHeight);
    }
  }, [isKeyboardOpen, rawWindowHeight, stableWindowHeight]);

  const playSound = useCallback((player: ReturnType<typeof useAudioPlayer>) => {
    replaySoundEffect(player);
  }, []);

  // Image sizing for native is handled in the root FullImageScreen; keep local fallback removed

  const playSuccess = useCallback(() => {
    playSound(successPlayer);
  }, [playSound, successPlayer]);

  // play big success sound on completion
  const playBigSuccess = useCallback(() => {
    playSound(bigSuccessPlayer);
  }, [bigSuccessPlayer, playSound]);

  // play best success sound for perfect runs
  const playBestSuccess = useCallback(() => {
    playSound(bestSuccessPlayer);
  }, [bestSuccessPlayer, playSound]);

  // trigger success sound when revision completes
  useEffect(() => {
    if (isComplete) {
      // perfectRun indicates no mistakes in Game Mode
      if (perfectRun) {
        playBestSuccess();
      } else {
        playBigSuccess();
      }
    }
  }, [isComplete, perfectRun, playBestSuccess, playBigSuccess]);

  // Initialize questions on lesson change
  useEffect(() => {
    if (lesson.exercises.length) {
      const nextMode = resolveSafeMode('quiz');
      setExerciseMode(nextMode);
      setIsGameMode(isGrammarGameMode);
      setStartedGameMode(isGrammarGameMode);
      setLives(3);
      setIsGameOver(false);
      setIsComplete(false);
      setPerfectRun(false);
      setUserAnswer('');
      setIncorrectAnswer('');
      setFeedback('');
      setAnswerSaveMessage('');
      setGrammarSessionXp(0);
      setLastGrammarXpGain(0);
      setSelectedQuestions(getQuestionsForMode(lesson.exercises, nextMode));
      setCurrentQuestionIndex(0);
    }
  }, [lesson, resolveSafeMode]);

  useEffect(() => {
    void saveLastLesson({
      type: 'grammar',
      lessonId: lesson?.id != null ? String(lesson.id) : undefined,
      title: lesson.title,
    });
  }, [lesson?.id, lesson.title]);

  // Reset when Grammar Game Mode toggles
  useEffect(() => {
    const safeMode = resolveSafeMode(exerciseMode);
    setIsGameMode(isGrammarGameMode);
    setStartedGameMode(isGrammarGameMode);
    setLives(3);
    setIsGameOver(false);
    setIsComplete(false);
    setPerfectRun(false);
    setUserAnswer('');
    setIncorrectAnswer('');
    setFeedback('');
    setAnswerSaveMessage('');
    setGrammarSessionXp(0);
    setLastGrammarXpGain(0);
    setSelectedQuestions(getQuestionsForMode(lesson.exercises, safeMode));
    setCurrentQuestionIndex(0);
  }, [isGrammarGameMode]);

  useEffect(() => {
    setActiveCardHeight(quizCardHeight);
  }, [exerciseMode, currentQuestionIndex, quizCardHeight]);

  useEffect(() => {
    const lessonKey = String(lesson?.title || 'grammar-lesson');
    if (initializedLessonKeyRef.current === lessonKey) return;
    initializedLessonKeyRef.current = lessonKey;

    setExerciseMode('quiz');
    setIsSecondViewActive(false);
    requestAnimationFrame(() => {
      scrollViewRef.current?.scrollTo({ y: 0, animated: false });
    });
  }, [lesson?.title]);

  useEffect(() => {
    const previousLives = previousLivesRef.current;

    if (lives < previousLives) {
      setLostLifeIndex(previousLives - 1);
      lostLifeAnim.setValue(0);

      Animated.sequence([
        Animated.timing(lostLifeAnim, {
          toValue: 1,
          duration: 520,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(lostLifeAnim, {
          toValue: 0,
          duration: 1,
          useNativeDriver: true,
        }),
      ]).start(() => setLostLifeIndex(null));
    }

    previousLivesRef.current = lives;
  }, [lives, lostLifeAnim]);

  const scrollToExercise = useCallback((targetMode: ExerciseMode = exerciseMode, animated = true) => {
    const snapExtra =
      targetMode === 'fill'
        ? FILL_VIEW_SNAP_EXTRA
        : targetMode === 'translate'
          ? TRANSLATE_VIEW_SNAP_EXTRA
          : targetMode === 'reorder'
            ? REORDER_VIEW_SNAP_EXTRA
            : QUIZ_VIEW_SNAP_EXTRA;
    const targetY = getSecondViewScrollY(STICKY_TOP_SNAP_OFFSET + snapExtra);

    if (Platform.OS === 'android') {
      setIsSecondViewActive(true);
    }

    requestAnimationFrame(() => {
      scrollViewRef.current?.scrollTo({
        y: targetY,
        animated,
      });
    });

    setTimeout(() => {
      scrollViewRef.current?.scrollTo({
        y: targetY,
        animated,
      });
    }, 140);
  }, [
    QUIZ_VIEW_SNAP_EXTRA,
    FILL_VIEW_SNAP_EXTRA,
    REORDER_VIEW_SNAP_EXTRA,
    TRANSLATE_VIEW_SNAP_EXTRA,
    exerciseMode,
    getSecondViewScrollY,
    STICKY_TOP_SNAP_OFFSET,
  ]);

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', (event) => {
      if (exerciseMode !== 'fill') return;

      setKeyboardHeight(event.endCoordinates?.height ?? Math.max(0, stableWindowHeight - rawWindowHeight));
      if (Date.now() - lastModeSwitchAtRef.current < 650) return;

      setTimeout(() => scrollToExercise('fill', false), 60);
      setTimeout(() => scrollToExercise('fill', false), 240);
    });
    const hideSub = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0);

      const pendingMode = pendingKeyboardHideScrollModeRef.current;
      if (!pendingMode) return;

      pendingKeyboardHideScrollModeRef.current = null;
      setTimeout(() => scrollToExercise(pendingMode, true), 40);
      setTimeout(() => scrollToExercise(pendingMode, false), 220);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [exerciseMode, rawWindowHeight, scrollToExercise, stableWindowHeight]);

  const switchExerciseMode = (mode: ExerciseMode) => {
    const safeMode = resolveSafeMode(mode);
    if (safeMode !== exerciseMode) {
      triggerSelectionHaptic();
    }

    const shouldScrollAfterKeyboardHides = exerciseMode === 'fill' && safeMode !== 'fill' && isKeyboardOpen;
    pendingKeyboardHideScrollModeRef.current = shouldScrollAfterKeyboardHides ? safeMode : null;

    Keyboard.dismiss();
    lastModeSwitchAtRef.current = Date.now();
    setExerciseMode(safeMode);
    setIsGameMode(isGrammarGameMode);
    setStartedGameMode(isGrammarGameMode);
    setLives(3);
    setIsGameOver(false);
    setIsComplete(false);
    setPerfectRun(false);
    setUserAnswer('');
    setIncorrectAnswer('');
    setFeedback('');
    setAnswerSaveMessage('');
    setGrammarSessionXp(0);
    setLastGrammarXpGain(0);
    setSelectedQuestions(getQuestionsForMode(lesson.exercises, safeMode));
    setCurrentQuestionIndex(0);
    scrollToExercise(safeMode);

    if (shouldScrollAfterKeyboardHides) {
      setTimeout(() => scrollToExercise(safeMode, false), 360);
      setTimeout(() => scrollToExercise(safeMode, false), 560);
    }
  };

  const handleAnswer = async (option: string) => {
    // prevent rapid multiple taps when an answer is already selected
    if (userAnswer !== '') return;
    setUserAnswer(option);
    setAnswerSaveMessage('');
    setLastGrammarXpGain(0);
    const current = selectedQuestions[currentQuestionIndex];
    const isTrueFalse = typeof current.answer === 'boolean';
    const correct = isTrueFalse
      ? (option === 'True') === current.answer
      : option === current.answer;

    if (correct) {
      triggerSuccessHaptic();

      const lessonProgressKey = getGrammarLessonProgressKey(lesson);
      const answerProgressKey = `${exerciseMode}:${current.question}:${String(current.answer)}`;

      void markPracticeActivityToday(`grammar:${lessonProgressKey}:${answerProgressKey}`);
      const isNewCorrectAnswer = await recordGrammarCorrectAnswer(lessonProgressKey, answerProgressKey);
      const xpGain = isNewCorrectAnswer
        ? XP_REWARDS.grammarCorrect + (isGameMode ? XP_REWARDS.grammarGameModeBonus : 0)
        : 0;

      if (xpGain > 0) {
        const nextXP = await addXP(xpGain);
        setGrammarTotalXP(nextXP);
        setGrammarSessionXp((currentXp) => currentXp + xpGain);
      }

      setLastGrammarXpGain(xpGain);
      setAnswerSaveMessage(isNewCorrectAnswer ? 'saved' : 'reviewed');

      // only play short success for non-final questions
      if (currentQuestionIndex < selectedQuestions.length - 1) {
        playSuccess();
      }
      setFeedback('Well done! 🎉');

      // Compute a precise top value so the top of the card aligns with the top of the first option.
      // Prefer measureLayout relative to the exercise container to avoid window/scroll offsets.
      // Fallback: use onLayout-derived values (optionsContainerY + firstOptionLocalY).
      const computeFeedbackTop = (): Promise<number> => new Promise(resolve => {
        const fallbackTop = optionsContainerY + firstOptionLocalY;
        try {
          if (firstOptionRef.current && exerciseContainerRef.current) {
            // measureLayout(target, onSuccess, onFail)
            (firstOptionRef.current as any).measureLayout(
              (exerciseContainerRef.current as any),
              (_x: number, y: number) => {
                // Guard against NaN/undefined and negative values
                if (typeof y === 'number' && isFinite(y) && y >= 0) {
                  resolve(y);
                } else {
                  resolve(fallbackTop);
                }
              },
              () => resolve(fallbackTop)
            );
          } else {
            resolve(fallbackTop);
          }
        } catch {
          resolve(fallbackTop);
        }
      });

      const top = await computeFeedbackTop();
      setFeedbackTop(top);

      // Platform-safe native driver usage (RN Web doesn't support native driver)
      const canUseNativeDriver = Platform.OS !== 'web';

      // start from below the final location (so it rises up into place)
      feedbackAnim.setValue(activeCardHeight);
      // entrance: slight delay then a slower, eased timing so it rises up smoothly
      Animated.sequence([
        Animated.delay(30),
        Animated.timing(feedbackAnim, {
          toValue: 0,
          duration: 420,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: canUseNativeDriver,
        }),
      ]).start();
      // keep feedback visible a bit before hiding; exit animation slides back down
      setTimeout(() => {
        Animated.timing(feedbackAnim, { toValue: activeCardHeight, duration: 420, easing: Easing.in(Easing.cubic), useNativeDriver: canUseNativeDriver }).start(() => {
          setFeedback('');
          setAnswerSaveMessage('');
          setLastGrammarXpGain(0);
          if (currentQuestionIndex < selectedQuestions.length - 1) {
            setCurrentQuestionIndex(i => i + 1);
            setUserAnswer('');
          } else {
            if (isGameMode && lives === 3) {
              setPerfectRun(true);
            }
            setIsComplete(true);
            setIsGameMode(false);
          }
        });
      }, 1400);
    } else {
      triggerWarningHaptic();
      setAnswerSaveMessage('');
      setLastGrammarXpGain(0);
      setIncorrectAnswer(option);
      if (isGameMode) {
        const nl = lives - 1;
        setLives(nl);
        if (nl <= 0) {
          setIsGameOver(true);
          setTimeout(() => {
            setCurrentQuestionIndex(0);
            setLives(3);
            setUserAnswer('');
            setIncorrectAnswer('');
            setIsGameOver(false);
          }, 10000);
        }
      }
      setTimeout(() => {
        setIncorrectAnswer('');
        setUserAnswer('');
      }, 1100);
    }
  };

  const handleExerciseIncorrect = (marker: string) => {
    triggerWarningHaptic();
    setIncorrectAnswer(marker);
    setLastGrammarXpGain(0);
    if (isGameMode) {
      const nextLives = lives - 1;
      setLives(nextLives);
      if (nextLives <= 0) {
        setIsGameOver(true);
        setTimeout(() => {
          setCurrentQuestionIndex(0);
          setLives(3);
          setUserAnswer('');
          setIncorrectAnswer('');
          setIsGameOver(false);
        }, 10000);
      }
    }
    setTimeout(() => {
      setIncorrectAnswer('');
    }, 1100);
  };

  const startChallenge = useCallback(() => {
    triggerSelectionHaptic();
    setPerfectRun(false);
    setIsComplete(false);
    setIsGameOver(false);
    setIsGameMode(true);
    setStartedGameMode(true);
    setLives(3);
    setIncorrectAnswer('');
    setUserAnswer('');
    setAnswerSaveMessage('');
    setGrammarSessionXp(0);
    setLastGrammarXpGain(0);
    setSelectedQuestions(getQuestionsForMode(lesson.exercises, exerciseMode, 10));
    setCurrentQuestionIndex(0);
  }, [exerciseMode, lesson.exercises]);

  const currentExercise = selectedQuestions[currentQuestionIndex];
  const currentPrompt =
    exerciseMode === 'translate'
      ? currentExercise?.prompt ?? currentExercise?.question
      : currentExercise?.question;
  const hasCurrentExercise = !!currentExercise;
  const exerciseContainerTopOffset = (isCompactScreen ? 16 : 22)
    + (Platform.OS !== 'web' && isGameMode ? (isCompactScreen ? 18 : 22) : 0);

  const modeLabel = exerciseModeOptions.find(option => option.key === exerciseMode)?.label ?? 'Quiz';
  const isBuildExerciseMode = exerciseMode === 'fill' || exerciseMode === 'reorder' || exerciseMode === 'translate';
  const hasFreshCorrectAnswer = !!answerSaveMessage;
  const correctSavedCount = Math.min(
    selectedQuestions.length,
    currentQuestionIndex + (hasFreshCorrectAnswer ? 1 : 0)
  );
  const answerBadgeLabel = hasFreshCorrectAnswer
    ? lastGrammarXpGain > 0 ? `+${lastGrammarXpGain} XP` : 'Reviewed'
    : `Correct ${correctSavedCount}/${selectedQuestions.length}`;
  const completionCardMinHeight = Math.round(clampNumber(
    lessonViewportHeight * 0.72,
    isCompactScreen ? 410 : 470,
    isCompactScreen ? 540 : 620
  ));
  const renderGrammarCompletionSummary = () => (
    <LevelProgressSummary
      totalXP={grammarTotalXP}
      sessionXP={grammarSessionXp}
      colors={colors}
      isDarkMode={isDarkMode}
    />
  );


  const renderModeTabs = (placement: 'overview' | 'sticky' = 'sticky') => {
    const showSideActions = placement === 'sticky' && isSecondViewActive;

    return (
      <View
        style={[
          styles.modeTabsWrap,
          placement === 'overview' && styles.overviewModeTabsWrap,
          Platform.OS === 'android' && styles.modeTabsWrapAndroid,
          isScaledWebLesson && { paddingHorizontal: scaleValue(16, webLessonScale) },
        ]}
      >
        <View style={[styles.modeTabsRow, isScaledWebLesson && { maxWidth: scaleValue(showSideActions ? 560 : 520, webLessonScale), gap: scaleValue(8, webLessonScale) }]}>
          {showSideActions && (
            <TouchableOpacity
              accessibilityLabel={backLabel}
              accessibilityRole="button"
              onPress={onBack}
              style={[
                styles.imageShortcutButton,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  width: scaleValue(42, webLessonScale),
                  height: scaleValue(42, webLessonScale),
                },
              ]}
            >
              <MaterialIcons name="arrow-back" size={scaleValue(21, webLessonScale)} color={colors.text} />
            </TouchableOpacity>
          )}
          <View style={[styles.modeTabsContainer, isScaledWebLesson && { maxWidth: scaleValue(showSideActions ? 460 : 520, webLessonScale) }]}>
          <GrammarModeTabs
            modes={exerciseModeOptions}
            activeMode={exerciseMode}
            onChangeMode={switchExerciseMode}
            layoutScale={webLessonScale}
          />
        </View>
          {showSideActions && (
            <TouchableOpacity
              accessibilityLabel="Open lesson image"
              accessibilityRole="button"
              onPress={handleImagePress}
              style={[
                styles.imageShortcutButton,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  width: scaleValue(42, webLessonScale),
                  height: scaleValue(42, webLessonScale),
                },
              ]}
            >
              <MaterialIcons name="image" size={scaleValue(21, webLessonScale)} color={colors.text} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const handleViewportLayout = useCallback((event: any) => {
    const nextHeight = Math.round(event.nativeEvent.layout.height);
    if (nextHeight <= 0) return;

    setViewportHeight((currentHeight) => {
      if (isKeyboardOpen && nextHeight < currentHeight) {
        return currentHeight;
      }

      return Math.abs(currentHeight - nextHeight) > 1 ? nextHeight : currentHeight;
    });
  }, [isKeyboardOpen]);

  const handleLessonScroll = useCallback((event: any) => {
    const y = event.nativeEvent.contentOffset?.y ?? 0;
    if (overviewHeightRef.current <= 0) return;

    const secondViewThreshold = Platform.OS === 'android'
      ? Math.max(0, (secondViewYRef.current || overviewHeightRef.current + layoutTopInset) - 2)
      : Math.max(0, overviewHeightRef.current - stickyHeaderHeight - 2);
    const nextIsSecondViewActive = y >= secondViewThreshold;

    setIsSecondViewActive((current) => (
      current === nextIsSecondViewActive ? current : nextIsSecondViewActive
    ));
  }, [layoutTopInset, stickyHeaderHeight]);

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      onLayout={handleViewportLayout}
    >
      <ScrollView
        ref={scrollViewRef}
        style={[styles.container, { backgroundColor: colors.background }]}
        stickyHeaderIndices={[1]}
        contentContainerStyle={{
          paddingTop: layoutTopInset,
          paddingBottom: Math.max(insets.bottom, 8) + (isKeyboardOpen ? Math.min(Math.max(keyboardHeight || keyboardHeightDrop, 220), 420) : 0),
        }}
        onScroll={handleLessonScroll}
        scrollEventThrottle={16}
        keyboardShouldPersistTaps="always"
        bounces={false}
        alwaysBounceVertical={false}
        overScrollMode="never"
      >
        <View
          style={[
            styles.overviewSection,
            { minHeight: overviewMinHeight },
          ]}
          onLayout={(event) => {
            overviewHeightRef.current = event.nativeEvent.layout.height;
          }}
        >
          <BackButton
            label={backLabel}
            onPress={onBack}
            style={Platform.OS === 'android' ? styles.androidTopBackButton : undefined}
          />
          <View
            style={[
              styles.header,
              Platform.OS === 'web' ? styles.webHeader : undefined,
              { backgroundColor: colors.card },
            ]}
            onLayout={(event) => {
              setTitleBlockHeight(event.nativeEvent.layout.height);
            }}
          >
            <Text
              style={[
                styles.title,
                Platform.OS === 'web' ? styles.webTitle : undefined,
                isScaledWebLesson && { fontSize: scaleValue(22, webLessonScale), marginLeft: scaleValue(8, webLessonScale) },
                { color: colors.text },
              ]}
            >
              {lesson.title}
            </Text>
          </View>
          <ImageWithCredit
            onPress={() => {
              nav.navigate('FullImageModal', { source: imageSource, uri: imageUri });
            }}
            source={imageSource}
            style={
              Platform.OS === 'web'
                ? [styles.lessonImage, styles.webLessonImage, { height: lessonImageHeight, maxWidth: webLessonMediaMaxWidth }] as any
                : [styles.lessonImage, { height: lessonImageHeight }] as any
            }
          />
        </View>
        <View
          style={[
            styles.stickyHeader,
            Platform.OS === 'web' ? styles.webStickyHeader : undefined,
            Platform.OS === 'android' && styles.stickyHeaderAndroid,
            !isSecondViewActive && styles.stickyHeaderFirstView,
            Platform.OS === 'web' && !isSecondViewActive ? styles.webStickyHeaderFirstView : undefined,
            { backgroundColor: colors.background, paddingTop: stickyHeaderPinnedTopPadding },
          ]}
          onLayout={(event) => {
            secondViewYRef.current = event.nativeEvent.layout.y;
            setStickyHeaderHeight(event.nativeEvent.layout.height);
          }}
        >
          {renderModeTabs()}
        </View>
        <View
          ref={exerciseContainerRef}
          style={[
            styles.exerciseContainer,
            Platform.OS === 'web' && {
              alignSelf: 'center',
              maxWidth: webExerciseMaxWidth,
              width: '100%',
              paddingHorizontal: scaleValue(16, webLessonScale),
            },
            {
              minHeight: secondViewMinHeight,
              paddingTop: exerciseContainerTopOffset,
            },
          ]}
        >
        {!isComplete ? (
          <>
            {!hasCurrentExercise && (
              <View style={[styles.emptyStateCard, { backgroundColor: colors.card }]}>
                <Text style={[styles.emptyStateTitle, { color: colors.text }]}>No exercises available</Text>
                <Text style={[styles.emptyStateText, { color: colors.text }]}>
                  This lesson does not have content for the current mode yet.
                </Text>
              </View>
            )}
            {hasCurrentExercise && (
            <>
            {isGameOver ? (
              <View style={[styles.gameOverContainer, isDarkMode && { backgroundColor: colors.card }]}>  
                <Image
                  source={require('../../assets/embarrassed.png')}
                  style={[
                    styles.gameOverImage,
                    Platform.OS === 'web' && { width: scaleValue(80, webLessonScale), height: scaleValue(80, webLessonScale) }
                  ]}
                  resizeMode="contain"
                />
                <Text style={[styles.gameOverText, { color: colors.text }]}>Oops! Too bad!</Text>
                <Text style={[styles.gameOverSubText, { color: colors.text }]}>It's ok, you can do it!</Text>
                <TouchableOpacity style={[styles.gameModeButton, { backgroundColor: colors.primary }]} onPress={startChallenge}>
                  <Text style={styles.gameModeButtonText}>Retry Game Mode</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <View style={[styles.statusBlock, exerciseMode === 'fill' && isFillKeyboardOpen && styles.statusBlockFillKeyboard]}>
                  <View style={styles.livesSlot}>
                    {isGameMode && !isComplete && (
                      <View style={styles.livesContainer}>
                        <Text style={[styles.livesLabel, { color: colors.text }]}>Lives</Text>
                        <View style={styles.livesPill}>
                          {Array.from({ length: 3 }).map((_, i) => {
                            const isFilled = i < lives;
                            const isLost = i === lostLifeIndex;

                            return (
                              <View key={i} style={styles.lifeSlot}>
                                <MaterialIcons
                                  name={isFilled ? 'favorite' : 'favorite-border'}
                                  size={28}
                                  color={isFilled ? colors.danger : (isDarkMode ? colors.borderStrong : '#B7C1CC')}
                                  style={styles.lifeIcon}
                                />
                                {isLost && (
                                  <Animated.View
                                    pointerEvents="none"
                                    style={[
                                      styles.lostLifeOverlay,
                                      {
                                        opacity: lostLifeAnim.interpolate({
                                          inputRange: [0, 0.55, 1],
                                          outputRange: [1, 1, 0],
                                        }),
                                        transform: [
                                          {
                                            translateY: lostLifeAnim.interpolate({
                                              inputRange: [0, 1],
                                              outputRange: [0, -22],
                                            }),
                                          },
                                          {
                                            scale: lostLifeAnim.interpolate({
                                              inputRange: [0, 0.35, 1],
                                              outputRange: [1, 1.35, 0.65],
                                            }),
                                          },
                                          {
                                            rotate: lostLifeAnim.interpolate({
                                              inputRange: [0, 1],
                                              outputRange: ['0deg', '-18deg'],
                                            }),
                                          },
                                        ],
                                      },
                                    ]}
                                  >
                                    <MaterialIcons name="favorite" size={28} color="#D63B55" />
                                  </Animated.View>
                                )}
                              </View>
                            );
                          })}
                        </View>
                      </View>
                    )}
                  </View>
                  <View style={styles.progressContainer}>
                  <View style={[styles.progressBar, isDarkMode && { backgroundColor: colors.border }]}>
                    <View style={[styles.progressFill, { width: `${(currentQuestionIndex / selectedQuestions.length) * 100}%`, backgroundColor: colors.primary }]} />
                  </View>
                  <Text style={[styles.progressText, { color: colors.text }]}>
                    Question {currentQuestionIndex + 1} of {selectedQuestions.length}
                  </Text>
                </View>
                </View>
                <View
                  style={[
                    styles.exercise,
                    exerciseMode === 'fill' && isCompactScreen && styles.exerciseFillCompact,
                    exerciseMode === 'translate' && isCompactScreen && styles.exerciseTranslateCompact,
                    Platform.OS === 'web' && { minHeight: quizCardHeight + scaleValue(126, webLessonScale) },
                  ]}
                >
                  <View
                    ref={questionRef}
                    style={[
                      styles.questionCard,
                      exerciseMode === 'fill' && (isFillKeyboardOpen || isKeyboardTightScreen) && (
                        Platform.OS === 'android' ? styles.questionCardFillAndroidRoomy : styles.questionCardFillTight
                      ),
                      {
                        backgroundColor: colors.surface,
                        borderColor: isDarkMode && isBuildExerciseMode ? colors.borderStrong : colors.border,
                        borderBottomColor: isDarkMode && isBuildExerciseMode ? colors.buttonBackground : colors.borderStrong,
                        shadowColor: isDarkMode && isBuildExerciseMode ? colors.buttonBackground : '#000',
                      },
                      isScaledWebLesson && {
                        paddingVertical: scaleValue(16, webLessonScale),
                        paddingHorizontal: scaleValue(18, webLessonScale),
                        marginBottom: scaleValue(14, webLessonScale),
                        minHeight: scaleValue(92, webLessonScale),
                      },
                    ]}
                  >
                    <View style={styles.questionHeaderRow}>
                      <Text style={[styles.questionModeText, { color: colors.secondaryText }, isScaledWebLesson && { fontSize: scaleValue(12, webLessonScale) }]}>{modeLabel}</Text>
                      {selectedQuestions.length > 0 && (
                        <View
                          style={[
                            styles.answerSavedBadge,
                            {
                              backgroundColor: hasFreshCorrectAnswer ? colors.successSoft : colors.surfaceAlt,
                              borderColor: hasFreshCorrectAnswer ? colors.success : colors.border,
                            },
                          ]}
                        >
                          <MaterialIcons
                            name={hasFreshCorrectAnswer ? 'check-circle' : 'check-circle-outline'}
                            size={14}
                            color={hasFreshCorrectAnswer ? colors.success : colors.secondaryText}
                          />
                          <Text
                            style={[
                              styles.answerSavedText,
                              { color: hasFreshCorrectAnswer ? colors.successText : colors.secondaryText },
                            ]}
                            numberOfLines={1}
                          >
                            {answerBadgeLabel}
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text
                      style={[
                        styles.question,
                        exerciseMode === 'fill' && (isFillKeyboardOpen || isKeyboardTightScreen) && (
                          Platform.OS === 'android' ? styles.questionFillAndroidRoomy : styles.questionFillTight
                        ),
                        isDesktopWebLayout && {
                          fontSize: scaleValue(21, webLessonScale),
                          lineHeight: scaleValue(29, webLessonScale),
                        },
                        { color: colors.text },
                      ]}
                    >
                      {renderPromptText(currentPrompt)}
                    </Text>
                  </View>
                  {exerciseMode === 'fill' ? (
                    <GrammarFillExercise
                      exercise={selectedQuestions[currentQuestionIndex]}
                      colors={colors}
                      isDarkMode={isDarkMode}
                      keyboardVisible={isFillKeyboardOpen}
                      layoutHeight={lessonViewportHeight}
                      userAnswer={userAnswer}
                      incorrectAnswer={incorrectAnswer}
                      optionsContainerRef={optionsContainerRef}
                      firstOptionRef={firstOptionRef}
                      onOptionsLayout={setOptionsContainerY}
                      onFirstOptionLayout={setFirstOptionLocalY}
                      onCardHeightChange={setActiveCardHeight}
                      onCorrect={handleAnswer}
                      onIncorrect={handleExerciseIncorrect}
                    />
                  ) : exerciseMode === 'reorder' ? (
                    <GrammarReorderExercise
                      key={`reorder-${currentQuestionIndex}`}
                      exercise={selectedQuestions[currentQuestionIndex]}
                      colors={colors}
                      isDarkMode={isDarkMode}
                      compact={isCompactScreen}
                      userAnswer={userAnswer}
                      incorrectAnswer={incorrectAnswer}
                      optionsContainerRef={optionsContainerRef}
                      firstOptionRef={firstOptionRef}
                      onOptionsLayout={setOptionsContainerY}
                      onFirstOptionLayout={setFirstOptionLocalY}
                      onCardHeightChange={setActiveCardHeight}
                      onCorrect={handleAnswer}
                      onIncorrect={handleExerciseIncorrect}
                    />
                  ) : exerciseMode === 'translate' ? (
                    <View style={[styles.translateExerciseOffset, isCompactScreen && styles.translateExerciseOffsetCompact]}>
                      <GrammarTranslateExercise
                        key={`translate-${currentQuestionIndex}`}
                        exercise={selectedQuestions[currentQuestionIndex]}
                        colors={colors}
                        isDarkMode={isDarkMode}
                        compact={isCompactScreen}
                        userAnswer={userAnswer}
                        incorrectAnswer={incorrectAnswer}
                        optionsContainerRef={optionsContainerRef}
                        firstOptionRef={firstOptionRef}
                        onOptionsLayout={setOptionsContainerY}
                        onFirstOptionLayout={setFirstOptionLocalY}
                        onCardHeightChange={setActiveCardHeight}
                        onCorrect={handleAnswer}
                        onIncorrect={handleExerciseIncorrect}
                      />
                    </View>
                  ) : (
                    <View
                      ref={optionsContainerRef}
                      onLayout={(e) => {
                        // Store options container Y relative to exercise container for fallback
                        setOptionsContainerY(e.nativeEvent.layout.y);
                        setActiveCardHeight(e.nativeEvent.layout.height);
                      }}
                      style={[styles.optionsContainer, Platform.OS === 'web' && { height: quizCardHeight, gap: quizOptionGap }]}
                    >
                      {(selectedQuestions[currentQuestionIndex]?.options ?? (typeof selectedQuestions[currentQuestionIndex]?.answer === 'boolean' ? ['True','False'] : [])).map((option, index) => {
                        const isFirst = index === 0;
                        const isSelected = userAnswer === option;
                        const isIncorrect = incorrectAnswer === option;
                        const isCorrect = !isGameMode && userAnswer === selectedQuestions[currentQuestionIndex]?.answer && option === selectedQuestions[currentQuestionIndex]?.answer;
                        return (
                          <TouchableOpacity
                            key={option}
                            onPress={() => handleAnswer(option)}
                            ref={isFirst ? firstOptionRef : undefined}
                            onLayout={isFirst ? (e) => setFirstOptionLocalY(e.nativeEvent.layout.y) : undefined}
                            style={[
                              styles.optionButton,
                              Platform.OS === 'web' && {
                                height: quizOptionHeight,
                                paddingVertical: scaleValue(12, webLessonScale),
                                paddingHorizontal: scaleValue(16, webLessonScale),
                              },
                              isDarkMode && { backgroundColor: colors.surface, borderColor: colors.border, borderBottomColor: colors.borderStrong },
                              isSelected && [
                                styles.selectedOption,
                                { backgroundColor: colors.primarySoft, borderColor: colors.primary, borderBottomColor: colors.buttonBackground },
                              ],
                              isIncorrect && [
                                styles.incorrectOption,
                                { backgroundColor: colors.dangerSoft, borderColor: colors.danger, borderBottomColor: colors.danger },
                              ],
                              isCorrect && [
                                styles.correctAnswer,
                                { backgroundColor: colors.successSoft, borderColor: colors.success, borderBottomColor: colors.success },
                              ]
                            ]}>
                            <Text style={[
                              styles.optionText,
                              isDesktopWebLayout && {
                                fontSize: scaleValue(19, webLessonScale),
                                lineHeight: scaleValue(25, webLessonScale),
                                fontWeight: '700',
                              },
                              isDarkMode && { color: colors.text },
                              isIncorrect && [styles.incorrectOptionText, { color: colors.dangerText }],
                              isCorrect && [styles.correctAnswerText, { color: colors.successText }]
                            ]}>{option}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}
                </View>
              </>
            )}

            {feedback !== '' && (
              <Animated.View style={[
                styles.feedbackCard,
                {
                  // Position the card using the computed feedbackTop on all platforms (align with first option top)
                  top: feedbackTop,
                  height: activeCardHeight,
                  backgroundColor: colors.success,
                  borderColor: colors.successText,
                  shadowColor: colors.success,
                  // Use translateY for smooth, hardware-accelerated animations where supported
                  transform: [{ translateY: feedbackAnim }]
                }
              ]}>
                <Text style={[styles.feedbackText, { color: colors.buttonText }, isScaledWebLesson && { fontSize: scaleValue(32, webLessonScale) }]}>{feedback}</Text>
              </Animated.View>
            )}
            </>
            )}
          </>
        ) : (
          perfectRun ? (
            <View style={[styles.congratsBox, styles.perfectCongratsBox, { minHeight: completionCardMinHeight }]}>
              <Image
                source={assets.comic}
                style={[
                  styles.perfectImage,
                  Platform.OS === 'web' && { width: scaleValue(80, webLessonScale), height: scaleValue(80, webLessonScale) }
                ]}
                resizeMode="contain"
              />
              <Text style={styles.perfectCompletionText}>Amazing! Perfect Game!</Text>
              {renderGrammarCompletionSummary()}
               <TouchableOpacity style={[styles.gameModeButton, { backgroundColor: colors.primary }]} onPress={startChallenge}>
                 <Text style={styles.gameModeButtonText}>Play Again</Text>
               </TouchableOpacity>
            </View>
          ) : (
            startedGameMode ? (
              <View style={[styles.congratsBox, { backgroundColor: colors.card, minHeight: completionCardMinHeight }]}>
                <Image
                  source={assets.good}
                  style={[
                    styles.gameOverImage,
                    Platform.OS === 'web' && { width: scaleValue(80, webLessonScale), height: scaleValue(80, webLessonScale) }
                  ]}
                  resizeMode="contain"
                />
                <Text style={[styles.completionText, { color: colors.text }]}>
                  {'\uD83C\uDF89 Congratulations! You\'ve completed Game Mode! \uD83C\uDF89'}
                </Text>
                {renderGrammarCompletionSummary()}
                <TouchableOpacity style={[styles.gameModeButton, { backgroundColor: colors.primary }]} onPress={startChallenge}>
                  <Text style={styles.gameModeButtonText}>Play Again</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={[styles.congratsBox, { backgroundColor: colors.card, minHeight: completionCardMinHeight }]}>
                <Text style={[styles.completionText, { color: colors.text }]}>
                  {'\uD83C\uDF89 Congratulations! You\'ve completed the quiz! \uD83C\uDF89'}
                </Text>
                {renderGrammarCompletionSummary()}
                <View style={styles.unlockBox}>
                  <Text style={styles.unlockText}>
                    {'\uD83C\uDFAE You\'ve unlocked game mode! Answer 10 more questions with only 3 lives \uD83C\uDFAE'}
                  </Text>
                </View>
                <TouchableOpacity style={[styles.gameModeButton, { backgroundColor: colors.primary }]} onPress={startChallenge}>
                  <Text style={styles.gameModeButtonText}>{'\uD83C\uDFAE Try Game Mode \uD83C\uDFAE'}</Text>
                </TouchableOpacity>
              </View>
            )
          )
        )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default GrammarQuiz;

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  webHeader: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  androidTopBackButton: {
    marginTop: 0,
  },
  overviewSection: {
    paddingBottom: 18,
  },
  stickyHeader: {
    paddingTop: 10,
    paddingBottom: 46,
  },
  stickyHeaderAndroid: {
    elevation: 0,
    paddingBottom: 14,
  },
  webStickyHeader: {
    paddingTop: 4,
    paddingBottom: 18,
  },
  stickyHeaderFirstView: {
    paddingBottom: 14,
    position: 'relative',
    zIndex: 1,
  },
  webStickyHeaderFirstView: {
    paddingBottom: 18,
  },
  modeTabsWrap: {
    paddingHorizontal: 16,
  },
  modeTabsWrapAndroid: {
    paddingHorizontal: 12,
  },
  overviewModeTabsWrap: {
    marginTop: 8,
    marginBottom: 8,
  },
  modeTabsRow: {
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  modeTabsContainer: {
    flex: 1,
    minWidth: 0,
    width: '100%',
    maxWidth: 460,
    alignSelf: 'center',
    marginBottom: 0,
  },
  imageShortcutButton: {
    width: 42,
    height: 42,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 0,
  },
  stickyActionButtonHidden: {
    opacity: 0,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
    marginLeft: 8,
  },
  webTitle: {
    fontSize: 22,
    marginTop: 0,
  },
  lessonImage: {
    width: '96%',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 8,
    borderRadius: 18,
    resizeMode: 'contain',
  },
  webLessonImage: {
    marginTop: 6,
    marginBottom: 4,
  },
  exerciseContainer: {
    paddingHorizontal: 16,
    paddingBottom: 18,
    position: 'relative',
    marginTop: 0,
  },
  livesContainer: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 34,
  },
  statusBlock: {
    minHeight: 78,
    justifyContent: 'flex-start',
  },
  statusBlockFillKeyboard: {
    minHeight: 58,
  },
  livesSlot: {
    minHeight: 38,
    justifyContent: 'center',
    marginBottom: 8,
  },
  livesLabel: {
    fontSize: 17,
    fontWeight: '800',
  },
  livesPill: {
    minHeight: 34,
    paddingHorizontal: 4,
    borderRadius: 8,
    backgroundColor: 'transparent',
    borderWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
  },
  lifeSlot: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  lifeIcon: { marginHorizontal: 3 },
  lostLifeOverlay: {
    position: 'absolute',
    left: 3,
    top: 3,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 0,
    marginBottom: 12,
    minHeight: 28,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#d5dde6',
    borderRadius: 4,
    overflow: 'hidden',
    marginRight: 8,
  },
  progressFill: { height: '100%' },
  progressText: { fontSize: 14, fontWeight: '600' },
  exercise: { marginBottom: 4, minHeight: CARD_HEIGHT + 126 },
  exerciseFillCompact: {
    minHeight: 244,
  },
  exerciseTranslateCompact: {
    minHeight: 326,
  },
  translateExerciseOffset: {
    marginTop: 10,
  },
  translateExerciseOffsetCompact: {
    marginTop: 4,
  },
  questionCard: {
    borderWidth: 2,
    borderBottomWidth: 4,
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 18,
    marginBottom: 14,
    minHeight: 92,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  questionCardFillTight: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 8,
    minHeight: 64,
    borderBottomWidth: 3,
  },
  questionCardFillAndroidRoomy: {
    paddingVertical: 16,
    paddingHorizontal: 18,
    marginBottom: 12,
    minHeight: 92,
    borderBottomWidth: 3,
  },
  questionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 6,
  },
  questionModeText: {
    color: '#777',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0,
  },
  answerSavedBadge: {
    minHeight: 25,
    maxWidth: 150,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  answerSavedText: {
    flexShrink: 1,
    minWidth: 0,
    fontSize: 12,
    fontWeight: '900',
  },
  question: { fontSize: 18, fontWeight: '700', lineHeight: 25 },
  parentheticalPromptText: {
    fontStyle: 'italic',
  },
  questionFillTight: {
    fontSize: 15,
    lineHeight: 19,
  },
  questionFillAndroidRoomy: {
    fontSize: 18,
    lineHeight: 25,
  },
  optionsContainer: {
    flexDirection: 'column',
    gap: 6,
    height: CARD_HEIGHT,
  },
  optionButton: {
    height: (CARD_HEIGHT - 18) / 4,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderBottomWidth: 4,
    borderColor: '#E5E5E5',
    borderBottomColor: '#D1D5DB',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  selectedOption: { borderColor: '#78CBFF', borderBottomColor: '#1396D8', backgroundColor: '#D7F0FF' },
  incorrectOption: { backgroundColor: '#FFE8EC', borderColor: '#F06A7F', borderBottomColor: '#D94E64' },
  optionText: { fontSize: 17, color: '#24313D', fontWeight: '500' },
  incorrectOptionText: { color: '#8F2234' },
  correctAnswer: { backgroundColor: '#E9F8EF', borderColor: '#42C67A', borderBottomColor: '#28A360' },
  correctAnswerText: { color: '#12663D' },
  gameOverText: { fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
  gameOverSubText: { fontSize: 16 },
  completionText: { fontSize: 22, lineHeight: 27, fontWeight: 'bold', marginBottom: 8, textAlign: 'center' },
  gameOverContainer: { alignItems: 'center', padding: 24, borderRadius: 16, marginVertical: 16 },
  completionContainer: { alignItems: 'center', padding: 24, borderRadius: 16, marginVertical: 16 },
  emptyStateCard: {
    alignItems: 'center',
    padding: 24,
    borderRadius: 16,
    marginVertical: 16,
  },
  emptyStateTitle: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  feedbackCard: { position: 'absolute', left: 16, right: 16, height: CARD_HEIGHT, padding: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center', zIndex: 10, borderWidth: 2, borderColor: 'rgba(223,255,238,0.5)', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.18, shadowRadius: 14, elevation: 7 },
  feedbackText: { color: '#fff', fontSize: 32, fontWeight: 'bold', textAlign: 'center' },
  congratsBox: {
    width: '100%',
    maxWidth: 620,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    borderRadius: 18,
    marginVertical: 16,
  },
  levelUpBanner: {
    minHeight: 40,
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#FFE8A3',
    borderWidth: 1,
    borderColor: '#F4B942',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  levelUpBannerText: {
    color: '#7A4B00',
    fontSize: 14,
    lineHeight: 17,
    fontWeight: '900',
    textAlign: 'center',
  },
  unlockBox: { backgroundColor: '#FFD700', padding: 14, borderRadius: 12, marginTop: 12 },
  unlockText: { color: '#333', fontSize: 16, fontWeight: '600', textAlign: 'center' },
  gameModeButton: { minWidth: 220, paddingVertical: 13, paddingHorizontal: 24, borderRadius: 999, marginTop: 12, alignItems: 'center', justifyContent: 'center' },
  gameModeButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold', textAlign: 'center' },
  perfectCongratsBox: {
    backgroundColor: '#FFF8D6',
    borderWidth: 2,
    borderColor: '#E7C566',
    shadowColor: '#D4A72C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
  },
  perfectCompletionText: {
    color: '#5F4A13',
    fontSize: 24,
    lineHeight: 29,
    fontWeight: 'bold',
    marginBottom: 6,
    textAlign: 'center',
  },
  perfectImage: {
    width: screenWidth * 0.25,
    height: screenWidth * 0.25,
    marginBottom: 20,
    resizeMode: 'contain',
  },
  gameOverImage: {
    width: screenWidth * 0.25,
    height: screenWidth * 0.25,
    marginBottom: 16,
  },
  closeButton: {
    position: 'absolute',
    top: 0,
    right: 0,
    padding: 16,
  },
});
