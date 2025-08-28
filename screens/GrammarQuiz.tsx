import React, { useState, useEffect, useRef } from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity, Image, Modal, Dimensions, Animated, Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useTheme } from '../contexts/ThemeContext';
import { Audio } from 'expo-av';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PinchZoomImage from '../components/PinchZoomImage';
import assets from '../assets';
import BackButton from '../components/BackButton';
import * as Haptics from 'expo-haptics';

// Add module-level constant for feedback card height
const CARD_HEIGHT = 220; // reduced by 36px to shave off bottom
const FEEDBACK_LIFT = 80; // additional lift to cover top answer

interface Exercise {
  question: string;
  answer: string | boolean;
  options?: string[];
}

interface GrammarQuizProps {
  lesson: {
    title: string;
    imageUrl: string;
    exercises: Exercise[];
  };
  onBack: () => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const GrammarQuiz: React.FC<GrammarQuizProps> = ({ lesson, onBack }) => {
  const { colors, isDarkMode, isGrammarGameMode } = useTheme();
  const insets = useSafeAreaInsets();

  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [selectedQuestions, setSelectedQuestions] = useState<Exercise[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [incorrectAnswer, setIncorrectAnswer] = useState<string>('');
  const [feedback, setFeedback] = useState<string>('');
  const [isComplete, setIsComplete] = useState(false);
  const [showFullImage, setShowFullImage] = useState(false);
  const [isGameMode, setIsGameMode] = useState(false);
  const [startedGameMode, setStartedGameMode] = useState(isGrammarGameMode);
  const [lives, setLives] = useState(3);
  const [isGameOver, setIsGameOver] = useState(false);
  const [perfectRun, setPerfectRun] = useState(false);
  const feedbackAnim = useRef(new Animated.Value(-CARD_HEIGHT)).current;
  const exerciseContainerRef = useRef<View>(null);
  const firstOptionRef = useRef<View>(null);
  const questionRef = useRef<View>(null);
  const [exerciseBottomY, setExerciseBottomY] = useState<number>(0);
  const [firstOptionYWindow, setFirstOptionYWindow] = useState<number>(0);
  const [fullImageHeight, setFullImageHeight] = useState<number>(screenHeight);

  // Helpers
  const shuffle = <T,>(arr: T[]): T[] => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  const getRandomizedQuestions = (exs: Exercise[], count = 10): Exercise[] => {
    return shuffle(exs)
      .slice(0, count)
      .map(ex =>
        ex.options && typeof ex.answer === 'string'
          ? { ...ex, options: shuffle(ex.options) }
          : ex
      );
  };

  // Sound cleanup
  useEffect(() => {
    return () => { sound && sound.unloadAsync(); };
  }, [sound]);

  useEffect(() => {
    if (showFullImage && Platform.OS === 'android') {
      const uri = typeof lesson.imageUrl === 'string' ? lesson.imageUrl : lesson.imageUrl.uri;
      Image.getSize(
        uri,
        (w, h) => setFullImageHeight(Math.min(screenWidth * h / w, screenHeight)),
        () => setFullImageHeight(screenHeight)
      );
    }
  }, [showFullImage, lesson.imageUrl]);

  const playSuccess = async () => {
    try {
      const { sound: s } = await Audio.Sound.createAsync(
        require('../assets/success.mp3'),
        { shouldPlay: true }
      );
      setSound(s);
    } catch {}
  };

  // play big success sound on completion
  const playBigSuccess = async () => {
    try {
      const { sound: s } = await Audio.Sound.createAsync(
        require('../assets/bigsuccess.mp3'),
        { shouldPlay: true }
      );
      setSound(s);
    } catch {}
  };

  // play best success sound for perfect runs
  const playBestSuccess = async () => {
    try {
      const { sound: s } = await Audio.Sound.createAsync(
        require('../assets/bestsuccess.mp3'),
        { shouldPlay: true }
      );
      setSound(s);
    } catch {}
  };

  // trigger big success when quiz completes
  useEffect(() => {
    if (isComplete) {
      // perfectRun indicates no mistakes in game mode
      if (perfectRun) {
        playBestSuccess();
      } else {
        playBigSuccess();
      }
    }
  }, [isComplete, perfectRun]);

  // Initialize questions on lesson change
  useEffect(() => {
    if (lesson.exercises.length) {
      setSelectedQuestions(getRandomizedQuestions(lesson.exercises));
      setCurrentQuestionIndex(0);
    }
  }, [lesson]);

  // Reset when grammar game mode toggles or lesson changes
  useEffect(() => {
    setIsGameMode(isGrammarGameMode);
    setStartedGameMode(isGrammarGameMode);
    setLives(3);
    setIsGameOver(false);
    setIsComplete(false);
    setUserAnswer('');
    setIncorrectAnswer('');
    setSelectedQuestions(getRandomizedQuestions(lesson.exercises));
    setCurrentQuestionIndex(0);
  }, [lesson, isGrammarGameMode]);

  const handleAnswer = (option: string) => {
    // prevent rapid multiple taps when an answer is already selected
    if (userAnswer !== '') return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setUserAnswer(option);
    const current = selectedQuestions[currentQuestionIndex];
    const isTrueFalse = typeof current.answer === 'boolean';
    const correct = isTrueFalse
      ? (option === 'True') === current.answer
      : option === current.answer;

    if (correct) {
      // only play short success for non-final questions
      if (currentQuestionIndex < selectedQuestions.length - 1) {
        playSuccess();
      }
      setFeedback('Well done! 🎉');
      feedbackAnim.setValue(-CARD_HEIGHT);
      // measure container and first option to animate from bottom, 5px lower above first answer
      exerciseContainerRef.current?.measureInWindow((xC, yC, wC, hC) => {
        firstOptionRef.current?.measureInWindow((xO, yO, wO, hO) => {
          const translateTo = (yC + hC) - yO - CARD_HEIGHT + 5; // adjust to appear a few pixels higher
          Animated.spring(feedbackAnim, {
            toValue: translateTo,
            friction: 8,
            tension: 40,
            useNativeDriver: false
          }).start();
        });
      });
      setTimeout(() => {
        Animated.timing(feedbackAnim, { toValue: -CARD_HEIGHT, duration: 300, useNativeDriver: false }).start(() => {
          setFeedback('');
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
      }, 1200);
    } else {
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
      }, 800);
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingTop: insets.top || 0 }}
    >
      <BackButton label="Back to Grammar" onPress={onBack} />
      <TouchableOpacity onPress={() => setShowFullImage(true)}>
        <Image
          source={
            typeof lesson.imageUrl === 'string'
              ? { uri: lesson.imageUrl }
              : lesson.imageUrl
          }
          style={[
            styles.lessonImage,
            // native platforms keep the 300px height and top margin
            Platform.OS !== 'web' && { marginTop: 8, height: 305 },
            // on desktop web in game mode, cap height to 270px
            Platform.OS === 'web' && isGameMode && { height: 270 },
          ]}
        />
      </TouchableOpacity>
      <Modal
        visible={showFullImage}
        animationType="fade"
        transparent={false}
        presentationStyle="overFullScreen"
        statusBarTranslucent={true}
        hardwareAccelerated={true}
        onRequestClose={() => setShowFullImage(false)}
      >
        {Platform.OS === 'web' ? (
          <View style={{ flex: 1 }}>
            <View style={{ flex: 1, backgroundColor: '#000' }}>
              <PinchZoomImage
                uri={typeof lesson.imageUrl === 'string' ? lesson.imageUrl : lesson.imageUrl.uri}
                onClose={() => setShowFullImage(false)}
                speedPreset="fast"
                doubleTapZoom={2.5}
                maxScale={5}
              />
            </View>
          </View>
        ) : (
          <GestureHandlerRootView style={{ flex: 1 }}>
            <View style={{ flex: 1, backgroundColor: '#000' }}>
              <PinchZoomImage
                uri={typeof lesson.imageUrl === 'string' ? lesson.imageUrl : lesson.imageUrl.uri}
                onClose={() => setShowFullImage(false)}
                speedPreset="fast"
                doubleTapZoom={2.5}
                maxScale={5}
              />
            </View>
          </GestureHandlerRootView>
        )}
      </Modal>
      <View
        ref={exerciseContainerRef}
        style={styles.exerciseContainer}
        onLayout={() => {
          exerciseContainerRef.current?.measureInWindow((x, y, w, h) => setExerciseBottomY(y + h));
        }}
      >
        {!isComplete ? (
          <>
            {isGameMode && !isComplete && !isGameOver && (
              <View style={[
                styles.livesContainer,
                Platform.OS !== 'web' && { marginTop: 8, marginBottom: 4 }
              ]}>
                {Array.from({ length: lives }).map((_, i) => (
                  <MaterialIcons key={i} name="favorite" size={24} color="#C62828" style={styles.lifeIcon} />
                ))}
              </View>
            )}

            {isGameMode && !isComplete && !isGameOver && (
              <View style={styles.progressContainer}>
                <View style={[styles.progressBar, isDarkMode && { backgroundColor: '#e0e0e0' }]}>
                  <View style={[styles.progressFill, { width: `${(currentQuestionIndex / selectedQuestions.length) * 100}%` }]} />
                </View>
                <Text style={[styles.progressText, { color: colors.text }]}>Question {currentQuestionIndex + 1} of {selectedQuestions.length}</Text>
              </View>
            )}

            {isGameOver ? (
              <View style={[styles.gameOverContainer, isDarkMode && { backgroundColor: colors.card }]}>  
                <Image
                  source={require('../assets/embarrassed.png')}
                  style={[
                    styles.gameOverImage,
                    // desktop: set static 80px size
                    Platform.OS === 'web' && { width: 80, height: 80 }
                  ]}
                  resizeMode="contain"
                />
                <Text style={[styles.gameOverText, { color: colors.text }]}>Oops! Too bad!</Text>
                <Text style={[styles.gameOverSubText, { color: colors.text }]}>👍 It's ok, you can do it! 👍</Text>
                <TouchableOpacity style={styles.gameModeButton} onPress={() => {
                  setIsGameOver(false);
                  setLives(3);
                  setUserAnswer('');
                  setIncorrectAnswer('');
                  setSelectedQuestions(getRandomizedQuestions(lesson.exercises, 10));
                  setCurrentQuestionIndex(0);
                }}>
                  <Text style={styles.gameModeButtonText}>Start Again</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                {!isGameMode && (
                  <View style={styles.progressContainer}>
                    <View style={[styles.progressBar, isDarkMode && { backgroundColor: '#e0e0e0' }]}>
                      <View style={[styles.progressFill, { width: `${(currentQuestionIndex / selectedQuestions.length) * 100}%` }]} />
                    </View>
                    <Text style={[styles.progressText, { color: colors.text }]}>Question {currentQuestionIndex + 1} of {selectedQuestions.length}</Text>
                  </View>
                )}
                <View style={styles.exercise}>
                  <View ref={questionRef}>
                    <Text style={[styles.question, { color: colors.text }]}>{selectedQuestions[currentQuestionIndex]?.question}</Text>
                  </View>
                  <View
                    style={styles.optionsContainer}
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
                          onLayout={() => {
                            if (isFirst) firstOptionRef.current?.measureInWindow((x, y, w, h) => setFirstOptionYWindow(y));
                          }}
                          style={[
                            styles.optionButton,
                            isDarkMode && { backgroundColor: '#2c3e50', borderColor: '#34495e' },
                            isSelected && styles.selectedOption,
                            isIncorrect && styles.incorrectOption,
                            isCorrect && styles.correctAnswer
                          ]}>
                          <Text style={[
                            styles.optionText,
                            isDarkMode && { color: '#e0e1dd' },
                            isIncorrect && styles.incorrectOptionText,
                            isCorrect && styles.correctAnswerText
                          ]}>{option}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              </>
            )}

            {feedback !== '' && (
              <Animated.View style={[
                styles.feedbackCard,
                { bottom: feedbackAnim, backgroundColor: 'rgba(69,187,120,0.9)' }
              ]}>
                <Text style={styles.feedbackText}>{feedback}</Text>
              </Animated.View>
            )}

          </>
        ) : (
          perfectRun ? (
            <View style={[styles.congratsBox, styles.perfectCongratsBox]}>  
              <Image
                source={assets.comic}
                style={[
                  styles.perfectImage,
                  // desktop: set static 80px size
                  Platform.OS === 'web' && { width: 80, height: 80 }
                ]}
                resizeMode="contain"
              />
              <Text style={styles.perfectCompletionText}>🎉 Amazing! Perfect Game! 🎉</Text>
               <TouchableOpacity style={styles.gameModeButton} onPress={() => {
                 setPerfectRun(false);
                 setIsComplete(false);
                 setIsGameMode(true);
                 // Mark that we started Game Mode in this session so completion message is correct
                 setStartedGameMode(true);
                 setLives(3);
                 setIncorrectAnswer('');
                 setUserAnswer('');
                 setSelectedQuestions(getRandomizedQuestions(lesson.exercises, 10));
                 setCurrentQuestionIndex(0);
               }}>
                 <Text style={styles.gameModeButtonText}>Play Again</Text>
               </TouchableOpacity>
            </View>
          ) : (
            startedGameMode ? (
              <View style={[styles.congratsBox, { backgroundColor: colors.card }]}>  
                <Image
                  source={assets.good}
                  style={[
                    styles.gameOverImage,
                    // desktop: set static 80px size
                    Platform.OS === 'web' && { width: 80, height: 80 }
                  ]}
                  resizeMode="contain"
                />
                <Text style={[styles.completionText, { color: colors.text }]}>🎉 Congratulations! You've completed Game Mode! 🎉</Text>
                <TouchableOpacity style={styles.gameModeButton} onPress={() => {
                  setPerfectRun(false);
                  setIsComplete(false);
                  setIsGameMode(true);
                  // Ensure Game Mode completion shows the correct message (not unlock)
                  setStartedGameMode(true);
                  setLives(3);
                  setIncorrectAnswer('');
                  setUserAnswer('');
                  setSelectedQuestions(getRandomizedQuestions(lesson.exercises, 10));
                  setCurrentQuestionIndex(0);
                }}>
                  <Text style={styles.gameModeButtonText}>Try to have a perfect score, play again!</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={[styles.congratsBox, { backgroundColor: colors.card }]}>  
                <Text style={[styles.completionText, { color: colors.text }]}>🎉 Congratulations! You've completed the quiz! 🎉</Text>
                <View style={styles.unlockBox}>
                  <Text style={styles.unlockText}>🎮 You've unlocked game mode! Answer 10 more questions with only 3 lives 🎮</Text>
                </View>
                <TouchableOpacity style={styles.gameModeButton} onPress={() => {
                  setPerfectRun(false);
                  setIsComplete(false);
                  setIsGameMode(true);
                  // When user tries Game Mode from normal completion, mark it as started
                  setStartedGameMode(true);
                  setLives(3);
                  setIncorrectAnswer('');
                  setUserAnswer('');
                  setSelectedQuestions(getRandomizedQuestions(lesson.exercises, 10));
                  setCurrentQuestionIndex(0);
                }}>
                  <Text style={styles.gameModeButtonText}>🎮 Try Game Mode 🎮</Text>
                </TouchableOpacity>
              </View>
            )
          )
        )}
      </View>
    </ScrollView>
  );
};

export default GrammarQuiz;

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 8 },
  lessonImage: { width: '100%', height: 300, resizeMode: 'contain', marginVertical: 0 },
  exerciseContainer: { paddingHorizontal: 16, paddingBottom: 24, position: 'relative',
    marginTop: 12 },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Platform.OS !== 'web' ? 12 : 0,
    marginBottom: 16,
  },
  livesContainer: { flexDirection: 'row', justifyContent: 'center', marginBottom: 8 },
  lifeIcon: { marginHorizontal: 4 },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
    marginRight: 8,
  },
  progressFill: { height: '100%', backgroundColor: '#1671B6' },
  progressText: { fontSize: 16 },
  exercise: { marginBottom: 8 },
  question: { fontSize: 18, fontWeight: '600', marginBottom: 16 },
  optionsContainer: { flexDirection: 'column', gap: 4 },
  optionButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 4,
  },
  selectedOption: { borderColor: '#1671B6' },
  incorrectOption: { backgroundColor: '#FFEBEE', borderColor: '#EF5350' },
  optionText: { fontSize: 16, color: '#333' },
  incorrectOptionText: { color: '#C62828' },
  correctAnswer: { backgroundColor: '#4ECDC4', borderColor: '#4ECDC4' },
  correctAnswerText: { color: 'white' },
  gameOverText: { fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
  gameOverSubText: { fontSize: 16 },
  completionText: { fontSize: 24, fontWeight: 'bold', marginBottom: 8, textAlign: 'center' },
  gameOverContainer: { alignItems: 'center', padding: 24, borderRadius: 16, marginVertical: 16 },
  completionContainer: { alignItems: 'center', padding: 24, borderRadius: 16, marginVertical: 16 },
  feedbackCard: { position: 'absolute', left: 16, right: 16, bottom: 0, height: CARD_HEIGHT, padding: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center', zIndex: 10 },
  feedbackText: { color: '#fff', fontSize: 32, fontWeight: 'bold', textAlign: 'center' },
  congratsBox: { alignItems: 'center', padding: 24, borderRadius: 16, marginVertical: 16 },
  unlockBox: { backgroundColor: '#FFD700', padding: 16, borderRadius: 12, marginTop: 16 },
  unlockText: { color: '#333', fontSize: 16, fontWeight: '600', textAlign: 'center' },
  gameModeButton: { backgroundColor: '#2196F3', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8, marginTop: 16, alignItems: 'center', justifyContent: 'center' },
  gameModeButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold', textAlign: 'center' },
  perfectCongratsBox: {
    backgroundColor: '#FFD700',
    borderWidth: 2,
    borderColor: '#FFC107',
    shadowColor: '#FFC107',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
  },
  perfectCompletionText: {
    color: '#8B4513',
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 8,
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