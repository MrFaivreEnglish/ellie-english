import React, { useState, useEffect, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Modal, Platform, BackHandler, Dimensions } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Audio } from 'expo-av';
import BackButton from '../components/BackButton';
import PinchZoomImage from '../components/PinchZoomImage';
import VocabularyFlashcard from '../components/VocabularyFlashcard';
import VocabularyMatching from '../components/VocabularyMatching';
import VocabularyCompletionModal from '../components/VocabularyCompletionModal';
import { useTheme } from '../contexts/ThemeContext';
import { useVocabularyGame } from '../hooks/useVocabularyGame';
import { getLocalLessonImage, getLessonImage, PAIRS_PER_SET } from '../utils/vocabularyUtils';
import { Word } from '../types/VocabularyTypes';
import { MaterialIcons } from '@expo/vector-icons';

// Get screen dimensions for centering
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function VocabularyLessonScreen({ route, navigation }): any {
  const { isDarkMode, colors, isVocabTimerMode } = useTheme();
  const { lesson } = route.params;
  
  // Determine preferred hero image: prefer the lesson's own image/imageUrl when present (click behavior),
  // otherwise fall back to a local bundled thumbnail, then to the remote mapping.
  const localImageSource = useMemo(() => getLocalLessonImage(lesson.title), [lesson?.title]);
  const preferredImageSource = useMemo(() => {
    if (lesson?.imageUrl || lesson?.image) {
      const raw = (lesson.imageUrl ?? lesson.image) as any;
      return typeof raw === 'string' ? { uri: raw } : raw;
    }
    const local = getLocalLessonImage(lesson.title);
    if (local) return local;
    const mapped = getLessonImage(lesson.title);
    return { uri: mapped };
  }, [lesson?.imageUrl, lesson?.image, lesson?.title]);

  // A URI string representation of the preferred image (used by Image.getSize which expects a URI)
  const preferredImageUri = useMemo(() => {
    // If lesson.image/imageUrl is provided directly
    if (lesson?.imageUrl || lesson?.image) {
      const raw = (lesson.imageUrl ?? lesson.image) as any;
      if (typeof raw === 'string') return raw;
      try {
        // @ts-ignore - resolveAssetSource available on Image
        const resolved = Image.resolveAssetSource(raw);
        if (resolved && resolved.uri) return resolved.uri;
      } catch (_) {
        // ignore
      }
    }
    // If local image is a require(...) resource, resolve to a URI
    if (localImageSource) {
      try {
        // @ts-ignore - resolveAssetSource available on Image
        const resolved = Image.resolveAssetSource(localImageSource);
        if (resolved && resolved.uri) return resolved.uri;
      } catch (_) {
        // ignore
      }
    }
    // Fallback to getLessonImage mapping
    return getLessonImage(lesson.title);
  }, [lesson?.imageUrl, lesson?.image, lesson?.title, localImageSource]);

  // Zoom modal visibility and scaled image height for Android
  const [showFullImage, setShowFullImage] = useState(false);
  const [fullImageHeight, setFullImageHeight] = useState<number>(screenHeight);
  
  // calculate scaled height when opening modal on Android, cap to screen height
  useEffect(() => {
    if (showFullImage && Platform.OS === 'android') {
      // Image.getSize requires a URI string; use the resolved preferredImageUri
      Image.getSize(
        preferredImageUri,
        (w, h) => setFullImageHeight(Math.min(screenWidth * h / w, screenHeight)),
        () => setFullImageHeight(screenHeight)
      );
    }
  }, [showFullImage, preferredImageUri]);

  // Flashcard state
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [reverseDirection, setReverseDirection] = useState(false);
  const [shuffledFlashcards, setShuffledFlashcards] = useState<Word[]>([]);
  const [showExercises, setShowExercises] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [timerMode, setTimerMode] = useState(isVocabTimerMode);
  const [isFirstCompletion, setIsFirstCompletion] = useState(false);
  const [isPersonalBest, setIsPersonalBest] = useState(false);
  const [completionVisible, setCompletionVisible] = useState(false);
  // Track if timer mode has been explicitly started to control completion messaging
  const [startedTimerMode, setStartedTimerMode] = useState(isVocabTimerMode);

  // All words flattened (full lesson)
  const allWords = useMemo(() => {
    if (!lesson?.flashcards) return [];
    return Array.isArray(lesson.flashcards[0]?.words)
      ? lesson.flashcards.flatMap((category) => category.words)
      : lesson.flashcards;
  }, [lesson?.flashcards]);

  // If the lesson has categories (flashcards with a 'words' array), collect them
  const categories = useMemo(() => {
    if (!lesson?.flashcards) return [];
    return Array.isArray(lesson.flashcards[0]?.words)
      ? lesson.flashcards.map((c) => c.category)
      : [];
  }, [lesson?.flashcards]);

  // Selected categories for exercises (empty or ['All'] => use all)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) => {
      // 'All' clears any selection and shows the full lesson
      if (cat === 'All') return [];
      // Single-select behavior: if the same category is tapped again, clear selection (show All)
      if (prev.length === 1 && prev[0] === cat) return [];
      // Otherwise select only the tapped category
      return [cat];
    });
  };

  // Compute filtered words depending on category selection
  const filteredWords = useMemo(() => {
    if (!categories.length) return allWords;
    if (!selectedCategories || selectedCategories.length === 0) return allWords;
    // filter lesson.flashcards by selected categories
    const chosen = lesson.flashcards
      .filter((c) => selectedCategories.includes(c.category))
      .flatMap((c) => c.words);
    return chosen.length ? chosen : allWords;
  }, [lesson?.flashcards, allWords, categories.length, selectedCategories]);

  // Game hook (uses filteredWords so exercises operate on selected subset)
  const {
    gameState,
    setGameState,
    matchingGamePairs,
    initializeGameSet,
    handleCardPress,
    advanceToNextSet,
    resetGameState
  } = useVocabularyGame(filteredWords, timerMode);

  // Calculate completion
  const allSetsCompleted = useMemo(() => {
    return gameState.currentSet >= Math.ceil(filteredWords.length / PAIRS_PER_SET) - 1
      && gameState.matchedPairs.length === (matchingGamePairs?.english?.length || 0) * 2
      && matchingGamePairs?.english?.length > 0;
  }, [gameState.currentSet, gameState.matchedPairs.length, matchingGamePairs?.english?.length, filteredWords.length]);

  // Sync with settings
  useEffect(() => {
    setTimerMode(isVocabTimerMode);
    // When the global setting enables timer mode, mark it as started
    if (isVocabTimerMode) {
      setStartedTimerMode(true);
    }
  }, [isVocabTimerMode]);

  // Initialize flashcards (run once when words change)
  useEffect(() => {
    if (filteredWords.length > 0) {
      const shuffledWords = [...filteredWords].sort(() => Math.random() - 0.5);
      setShuffledFlashcards(shuffledWords);
      initializeGameSet();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredWords]);

  // Reset game state when switching to Exercise tab
  useEffect(() => {
    if (showExercises && filteredWords.length > 0) {
      // Reset and initialize the game state when switching to Exercise tab
      resetGameState();
      initializeGameSet();
      // Hide completion modal when entering exercises
      setCompletionVisible(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showExercises, filteredWords.length]);

  // Handle set completion and advancement
  useEffect(() => {
    if (!filteredWords.length || !matchingGamePairs?.english) return;

    const currentSetSize = matchingGamePairs.english.length;
    // Prevent triggering on initial load when there are no cards
    if (currentSetSize === 0) return;
    const isCurrentSetComplete = gameState.matchedPairs.length === currentSetSize * 2;
    const isLastSet = gameState.currentSet === Math.ceil(filteredWords.length / PAIRS_PER_SET) - 1;

    if (isCurrentSetComplete && !gameState.hasAdvancedSet) {
      setGameState(prev => ({ ...prev, hasAdvancedSet: true }));
      // Play success sound for set completion (only standard success here)
      if (!isLastSet) {
        (async () => {
          try {
            const soundAsset = require('../assets/success.mp3');
            await Audio.Sound.createAsync(soundAsset, { shouldPlay: true });
          } catch (_) {}
        })();
      }

      if (isLastSet) {
        // Game completed
        // detect new personal best (only if previous best exists)
        const oldBest = gameState.bestTime;
        const newPB = timerMode && oldBest != null && gameState.timer < oldBest;
        setIsPersonalBest(newPB);
        if (timerMode && (!oldBest || gameState.timer < oldBest)) {
          setGameState(prev => ({ ...prev, bestTime: gameState.timer }));
        }
        // Handle first completion and timer mode unlock (but don't modify settings)
        if (!gameState.hasCompletedOnce) {
          setGameState(prev => ({ ...prev, hasCompletedOnce: true }));
          setIsFirstCompletion(true);
          
          // Timer mode is now unlocked for this lesson, but don't change settings
          console.log('🎉 Timer mode unlocked! ⏱️');
        }
        // Show completion modal
        setCompletionVisible(true);
      } else {
        // Advance to next set
        setTimeout(() => {
          advanceToNextSet();
        }, 800);
      }
    }
  }, [gameState.matchedPairs.length, gameState.currentSet, filteredWords, matchingGamePairs?.english, timerMode, gameState.bestTime, gameState.timer, gameState.hasAdvancedSet, gameState.hasCompletedOnce, advanceToNextSet, setGameState]);

  // Back handler
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      navigation.goBack();
      return true;
    });
    return () => backHandler.remove();
  }, [navigation]);

  const scrollViewRef = useRef<ScrollView>(null);
  const [matchingLayout, setMatchingLayout] = useState<{ y: number; height: number } | null>(null);
  // When true, the next matching layout pass will auto-center the exercise in view
  const shouldCenterOnMatchingRef = useRef<boolean>(false);

  const scrollToBottom = () => {
    if (scrollViewRef.current) {
      setTimeout(() => {
        // Always scroll to the very end (bottom) of the ScrollView
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  const flipCard = () => {
    if (Platform.OS !== 'web') {
      try {
        const Haptics = require('expo-haptics');
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (_) {
        // Haptics not available
      }
    }
    setIsFlipped(!isFlipped);
  };

  const shuffleWords = () => {
    setCurrentWordIndex(0);
    setIsFlipped(false);
    setShuffledFlashcards(prev => [...prev].sort(() => Math.random() - 0.5));
    console.log('Words shuffled! 🔄');
  };

  const goToNextWord = () => {
    if (currentWordIndex < shuffledFlashcards.length - 1) {
      setCurrentWordIndex(prev => prev + 1);
      setIsFlipped(false);
    }
  };

  const goToPrevWord = () => {
    if (currentWordIndex > 0) {
      setCurrentWordIndex(prev => prev - 1);
      setIsFlipped(false);
    }
  };

  const handleReplay = (activateTimerMode = false) => {
    // Activate timer mode for this replay if requested
    setTimerMode(!!activateTimerMode);
    // If we are switching into timer mode, mark it as started so we don't show unlock messaging later
    if (activateTimerMode) {
      setStartedTimerMode(true);
    }

    // Reset and re-initialize the game state
    resetGameState();
    setIsFirstCompletion(false);
    setIsPersonalBest(false);
    initializeGameSet();

    // Ensure we switch to Exercises (matching) tab and hide the modal
    // Mark that we should center on the matching exercise once layout is available
    shouldCenterOnMatchingRef.current = true;
    setShowExercises(true);
    setCompletionVisible(false);

    // Scroll to the matching area after a tick so the content has rendered
    setTimeout(() => {
      scrollToBottom();
    }, 120);
  };

  return (
    <ScrollView 
      ref={scrollViewRef}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: isDarkMode ? '#415a77' : '#eee' }]}>
        <BackButton onPress={() => navigation.goBack()} />
        <Text style={[styles.title, { color: colors.text }]}>{lesson.title}</Text>
      </View>

      {/* Lesson Image */}
      <TouchableOpacity onPress={() => setShowFullImage(true)}>
        <Image
          // When opened from the lesson list, prefer the lesson's image/imageUrl if present.
          // Fall back to local thumbnail or remote mapping via preferredImageSource.
          source={preferredImageSource}
          style={styles.lessonImage}
          resizeMode="contain"
          onLoadStart={() => setImageLoaded(false)}
          onLoadEnd={() => setImageLoaded(true)}
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
                // Provide the full preferred image (lesson image/imageUrl preferred) to the pinch zoom component.
                source={preferredImageSource}
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
                // Provide the full preferred image (lesson image/imageUrl preferred) to the pinch zoom component.
                source={preferredImageSource}
                onClose={() => setShowFullImage(false)}
                speedPreset="fast"
                doubleTapZoom={2.5}
                maxScale={5}
              />
            </View>
          </GestureHandlerRootView>
        )}
      </Modal>

      {/* Mode Switching */}
      <View style={styles.modeButtons}>
        <TouchableOpacity
          style={[
            styles.modeButton, 
            !showExercises && styles.activeMode,
            { 
              backgroundColor: isDarkMode ? (!showExercises ? '#1671B6' : colors.card) : (!showExercises ? '#1671B6' : '#fff'), 
              borderColor: !showExercises ? '#45B7D1' : (isDarkMode ? '#415a77' : '#ddd') 
            }
          ]}
          onPress={() => {
            setShowExercises(false);
            scrollToBottom();
          }}
        >
          <Text style={{
            fontSize: 16,
            fontWeight: '600',
            color: !showExercises ? '#ffffff' : isDarkMode ? colors.text : '#666'
          }}>Flashcards</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.modeButton, 
            showExercises && styles.activeMode,
            { 
              backgroundColor: isDarkMode ? (showExercises ? '#1671B6' : colors.card) : (showExercises ? '#1671B6' : '#fff'), 
              borderColor: showExercises ? '#45B7D1' : (isDarkMode ? '#415a77' : '#ddd') 
            }
          ]}
          onPress={() => {
            setShowExercises(true);
            // Hide completion modal when entering exercises
            setCompletionVisible(false);
            scrollToBottom();
          }}
        >
          <Text style={{
            fontSize: 16,
            fontWeight: '600',
            color: showExercises ? '#ffffff' : isDarkMode ? colors.text : '#666'
          }}>Exercise</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {!showExercises ? (
        <VocabularyFlashcard
          words={shuffledFlashcards}
          currentIndex={currentWordIndex}
          isFlipped={isFlipped}
          reverseDirection={reverseDirection}
          onFlip={flipCard}
          onNext={goToNextWord}
          onPrevious={goToPrevWord}
          onShuffle={shuffleWords}
          onToggleDirection={() => {
            setReverseDirection(prev => !prev);
            setIsFlipped(false);
          }}
          colors={colors}
          isDarkMode={isDarkMode}
        />
      ) : (
        <>
          {/* Category selector (if lesson has categories) */}
          {categories.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingHorizontal: 12, marginBottom: 12 }}>
              <TouchableOpacity
                onPress={() => toggleCategory('All')}
                style={[styles.categoryChip, selectedCategories.length === 0 && styles.categoryChipActive]}
              >
                <Text style={[styles.categoryText, selectedCategories.length === 0 && styles.categoryTextActive]}>All</Text>
              </TouchableOpacity>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  onPress={() => toggleCategory(cat)}
                  style={[styles.categoryChip, selectedCategories.includes(cat) && styles.categoryChipActive]}
                >
                  <Text style={[styles.categoryText, selectedCategories.includes(cat) && styles.categoryTextActive]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          <View
            onLayout={(e) => {
              const { y, height } = e.nativeEvent.layout;
              setMatchingLayout({ y, height });
              // If we were requested to center on matching (e.g., Try Timer Mode), do it now
              if (shouldCenterOnMatchingRef.current) {
                setTimeout(() => {
                  scrollToBottom();
                  shouldCenterOnMatchingRef.current = false;
                }, 50);
              }
            }}
            style={{ width: '100%' }}
          >
            <VocabularyMatching
              gameState={gameState}
              matchingGamePairs={matchingGamePairs}
              onCardPress={handleCardPress}
              colors={colors}
              isDarkMode={isDarkMode}
              words={filteredWords}
              timerMode={timerMode}
            />
          </View>
          
          <VocabularyCompletionModal
            visible={completionVisible}
            gameState={gameState}
            timerMode={timerMode}
            wordsLength={filteredWords.length}
            isDarkMode={isDarkMode}
            onReplay={handleReplay}
            isFirstCompletion={isFirstCompletion}
            isPersonalBest={isPersonalBest}
            colors={colors}
            startedTimerMode={startedTimerMode}
          />
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
    marginLeft: 8,
  },
  lessonImage: {
    width: '100%',
    height: Platform.OS === 'web' ? 480 : 560,
    marginBottom: 20,
    resizeMode: 'contain',
  },
  modeButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 12,
    marginHorizontal: 8,
    borderRadius: 8,
    backgroundColor: '#fff',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ddd',
  },
  activeMode: {
    backgroundColor: '#1671B6',
    borderColor: '#45B7D1',
  },
  closeButton: {
    position: 'absolute',
    zIndex: 100,
  },
  categoryChip: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#ddd',
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: '#1671B6',
    borderColor: '#45B7D1',
  },
  categoryText: {
    fontSize: 14,
    color: '#666',
  },
  categoryTextActive: {
    color: '#ffffff',
  }
});