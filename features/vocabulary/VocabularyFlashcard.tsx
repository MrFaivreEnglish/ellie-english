import React from 'react';
import { View, Text, StyleSheet, Dimensions, Platform, Pressable, useWindowDimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Word } from '../../types/VocabularyTypes';
import { clampNumber, getWebLessonScale, scaleValue } from '../shared/responsiveLayout';

import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';

import { Gesture, GestureDetector } from 'react-native-gesture-handler';

interface FlashcardProps {
  words: Word[];
  currentIndex: number;
  isShuffled?: boolean;
  isFlipped?: boolean;
  reverseDirection: boolean;
  onFlip?: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onShuffle: () => void;
  onToggleDirection: () => void;
  lessonModeEnabled?: boolean;
  onToggleLessonMode?: () => void;
  onMarkKnown?: () => void;
  onMarkReview?: () => void;
  onToggleLearned?: () => void;
  isCurrentWordLearned?: boolean;
  learnedCount?: number;
  isCurrentWordKnown?: boolean;
  knownCount?: number;
  currentWordReadyToMarkKnown?: boolean;
  layoutHeight?: number;
  colors: any;
  isDarkMode: boolean;
}

const { width } = Dimensions.get('window');

export default function VocabularyFlashcard({
  words,
  currentIndex,
  isShuffled = false,
  isFlipped = false,
  reverseDirection,
  onFlip,
  onNext,
  onPrevious,
  onShuffle,
  onToggleDirection,
  lessonModeEnabled = false,
  onToggleLessonMode,
  onMarkKnown,
  onMarkReview,
  onToggleLearned,
  isCurrentWordLearned = false,
  learnedCount = 0,
  isCurrentWordKnown = false,
  knownCount = 0,
  currentWordReadyToMarkKnown = false,
  layoutHeight,
  colors,
  isDarkMode,
}: FlashcardProps) {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const responsiveHeight = layoutHeight ?? windowHeight;
  const webScale = getWebLessonScale(windowWidth, responsiveHeight);
  const controlScale = Platform.OS === 'web' ? webScale : 1;
  const isCompact = responsiveHeight < 680 || windowWidth < 380;
  const isLarge = responsiveHeight > 900 && windowWidth >= 400;
  const cardHeight = isCompact
    ? 238
    : Platform.OS === 'web'
      ? scaleValue(isLarge ? 286 : 262, webScale)
      : isLarge ? 286 : 262;
  const cardTextSize = isCompact
    ? 31
    : Platform.OS === 'web'
      ? scaleValue(isLarge ? 38 : 36, webScale)
      : isLarge ? 38 : 36;
  const contentPadding = isCompact ? 16 : scaleValue(20, controlScale);
  const flashcardMaxWidth = Platform.OS === 'web'
    ? Math.round(clampNumber(windowWidth * 0.36, 396, 720))
    : 396;
  const hasWords = words?.length > 0;
  const safeIndex = hasWords
    ? Math.min(Math.max(currentIndex, 0), words.length - 1)
    : 0;
  const currentWord = hasWords ? words[safeIndex] : null;
  const canGoPrevious = hasWords && safeIndex > 0;
  const canGoNext = hasWords && safeIndex < words.length - 1;
  const deckProgressWidth = hasWords
    ? `${Math.round(((safeIndex + 1) / words.length) * 100)}%` as const
    : '0%' as const;

  // =========================
  // SWIPE STATE
  // =========================
  const translateX = useSharedValue(0);
  const textOpacity = useSharedValue(1);

  const swipeGesture = Gesture.Pan()
    .minDistance(10)
    .onUpdate((e) => {
      translateX.value = e.translationX * 0.35;
    })
    .onEnd((e) => {
      const shouldSwipe =
        Math.abs(e.translationX) > 80 ||
        Math.abs(e.velocityX) > 800;

      if (!shouldSwipe) {
        translateX.value = withSpring(0);
        return;
      }

      const isLeft = e.translationX < 0;
      const isRight = e.translationX > 0;

      if (isLeft && hasWords && safeIndex < words.length - 1) {
        translateX.value = withTiming(-width * 1.2, { duration: 160 }, () => {
          translateX.value = 0;
          runOnJS(onNext)();
        });
        return;
      }

      if (isRight && hasWords && safeIndex > 0) {
        translateX.value = withTiming(width * 1.2, { duration: 160 }, () => {
          translateX.value = 0;
          runOnJS(onPrevious)();
        });
        return;
      }

      translateX.value = withSpring(0);
    });

  const swipeStyle = useAnimatedStyle(() => {
    const progress = Math.min(Math.abs(translateX.value) / width, 1);
    const rotate = (translateX.value / width) * 10;
    const swipeScale = 1 - progress * 0.04;

    return {
      transform: [
        { translateX: translateX.value },
        { perspective: 1000 },
        { rotateZ: `${rotate}deg` },
        { scale: swipeScale },
      ],
      opacity: 1 - progress * 0.18,
    };
  });

  const textEnterStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
  }));

  // =========================
  // FLIP (CENTER FIXED)
  // =========================
  const flip = useSharedValue(0);

  const frontStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 1000 },
      { rotateY: `${flip.value}deg` },
      { translateY: 0 }, // 🔥 prevents bottom-axis illusion
    ],
    backfaceVisibility: 'hidden',
    position: 'absolute',
    width: '100%',
    height: '100%',
  }));

  const backStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 1000 },
      { rotateY: `${flip.value + 180}deg` },
      { translateY: 0 }, // 🔥 same fix
    ],
    backfaceVisibility: 'hidden',
    position: 'absolute',
    width: '100%',
    height: '100%',
  }));

  // reset flip on card change (safe)
  React.useEffect(() => {
    flip.value = 0;
    translateX.value = 0;
    textOpacity.value = 0.82;
    textOpacity.value = withTiming(1, { duration: 220 });
  }, [currentIndex]);

  React.useEffect(() => {
    flip.value = withTiming(isFlipped ? 180 : 0, { duration: 220 });
  }, [isFlipped, reverseDirection]);

  // =========================
  // GESTURES (FIXED - NO CONFLICT)
  // =========================
  const tapGesture = Gesture.Tap()
    .maxDistance(8)
    .onEnd(() => {
      translateX.value = withSpring(0);
      flip.value = withTiming(flip.value === 0 ? 180 : 0, {
        duration: 300,
      });

      if (onFlip) {
        runOnJS(onFlip)();
      }
    });

  const gesture = Gesture.Exclusive(tapGesture, swipeGesture);

  React.useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    const handleKeyDown = (event: any) => {
      const target = event.target as any;
      const tagName = typeof target?.tagName === 'string' ? target.tagName.toLowerCase() : '';

      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
      if (tagName === 'input' || tagName === 'textarea' || target?.isContentEditable) return;

      if (event.key === 'ArrowLeft' && canGoPrevious) {
        event.preventDefault();
        onPrevious();
        return;
      }

      if (event.key === 'ArrowRight' && canGoNext) {
        event.preventDefault();
        onNext();
        return;
      }

      if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault();
        flip.value = withTiming(isFlipped ? 0 : 180, { duration: 220 });
        onFlip?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canGoNext, canGoPrevious, flip, isFlipped, onFlip, onNext, onPrevious]);

  // =========================
  // RENDER
  // =========================
  if (!currentWord) return null;

  const frontIsEnglish = !reverseDirection;
  const englishSideBackground = isDarkMode ? '#112c48' : (colors.card ?? '#FFFFFF');
  const englishSideBorder = isDarkMode ? (colors.border ?? '#415A77') : '#D6DDE6';
  const frenchSideBackground = colors.primary ?? '#1671B6';
  const frenchSideBorder = colors.borderStrong ?? colors.primary ?? '#2b6babff';

  const getSideAppearance = (isEnglishSide: boolean) => ({
    backgroundColor: isEnglishSide ? englishSideBackground : frenchSideBackground,
    borderColor: isEnglishSide ? englishSideBorder : frenchSideBorder,
    textColor: isEnglishSide ? colors.text : (colors.buttonText ?? '#fff'),
    badgeBackgroundColor: isEnglishSide
      ? (colors.surfaceAlt ?? (isDarkMode ? '#223853' : 'rgba(63,63,63,0.08)'))
      : 'rgba(255,255,255,0.9)',
    tapHintColor: isEnglishSide
      ? (colors.secondaryText ?? (isDarkMode ? '#B5C2CE' : 'rgba(120,120,120,1)'))
      : 'rgba(255,255,255,0.68)',
  });

  const frontAppearance = getSideAppearance(frontIsEnglish);
  const backAppearance = getSideAppearance(!frontIsEnglish);
  const languageBadgeStyle = { backgroundColor: 'rgba(255,255,255,0.9)' };
  const showLearnedBadge = isCurrentWordLearned;
  const showKnownBadge = lessonModeEnabled && isCurrentWordKnown;
  const learnedProgress = words.length > 0 ? learnedCount / words.length : 0;
  const learnedProgressWidth = `${Math.round(learnedProgress * 100)}%` as const;
  const canToggleLearned = isCurrentWordLearned || currentWordReadyToMarkKnown;
  const learnedAccent = isCurrentWordLearned
    ? (colors.success ?? '#58CC02')
    : currentWordReadyToMarkKnown
      ? (colors.primary ?? '#1671B6')
      : colors.secondaryText;
  const learnedTrackerSurface = isDarkMode
    ? 'rgba(255,255,255,0.05)'
    : '#FFFFFF';

  const renderStatusBadges = () => {
    if (!showLearnedBadge && !showKnownBadge) return null;

    return (
      <View style={styles.statusBadgeStack}>
        {showLearnedBadge && (
          <View style={[styles.statusBadge, { backgroundColor: colors.successSoft ?? 'rgba(233,248,239,0.95)' }]}>
            <MaterialIcons name="check-circle" size={18} color={colors.success ?? '#58CC02'} />
            <Text style={[styles.statusBadgeText, { color: colors.successText ?? '#2F8F2F' }]}>Learnt</Text>
          </View>
        )}
        {showKnownBadge && (
          <View style={[styles.statusBadge, { backgroundColor: 'rgba(255,255,255,0.92)' }]}>
            <MaterialIcons name="school" size={18} color={colors.success ?? '#58CC02'} />
            <Text style={[styles.statusBadgeText, { color: colors.successText ?? '#2F8F2F' }]}>Known</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={[styles.flashcardWrapper, { height: cardHeight, maxWidth: flashcardMaxWidth }]}>

        <GestureDetector gesture={gesture}>

          <Animated.View
            style={[
              swipeStyle,
              {
                flex: 1,
                width: '100%',
                justifyContent: 'center',
                alignItems: 'center',
              },
            ]}
          >

            {/* CARD STACK CONTAINER */}
            <View style={{ width: '100%', height: '100%' }}>

              {/* FRONT */}
              <Animated.View style={[
                styles.card,
                frontStyle,
                {
                  backgroundColor: frontAppearance.backgroundColor,
                  borderColor: frontAppearance.borderColor,
                }
              ]}>
                <View style={[styles.cardContent, { padding: contentPadding }]}>
                  {renderStatusBadges()}

                  <View style={[
                    styles.badge,
                    languageBadgeStyle,
                  ]}>
                    <Text style={styles.badgeText}>
                      {frontIsEnglish ? 'ENGLISH' : 'FRENCH'}
                    </Text>
                  </View>

                  <View style={styles.textArea}>
                    <Animated.Text style={[
                      styles.cardText,
                      { fontSize: cardTextSize },
                      { color: frontAppearance.textColor },
                      textEnterStyle,
                    ]}>
                      {frontIsEnglish ? currentWord.english : currentWord.french}
                    </Animated.Text>
                  </View>

                  <Text style={[styles.tapHintText, { color: frontAppearance.tapHintColor }]}>
                    Tap to flip
                  </Text>

                </View>
              </Animated.View>

              {/* BACK */}
              <Animated.View style={[
                styles.card,
                backStyle,
                {
                  backgroundColor: backAppearance.backgroundColor,
                  borderColor: backAppearance.borderColor,
                }
              ]}>
                <View style={[styles.cardContent, { padding: contentPadding }]}>
                  {renderStatusBadges()}

                  <View style={[
                    styles.badge,
                    languageBadgeStyle,
                  ]}>
                    <Text style={styles.badgeText}>
                      {frontIsEnglish ? 'FRENCH' : 'ENGLISH'}
                    </Text>
                  </View>

                  <View style={styles.textArea}>
                    <Animated.Text style={[styles.cardText, { fontSize: cardTextSize, color: backAppearance.textColor }, textEnterStyle]}>
                      {frontIsEnglish ? currentWord.french : currentWord.english}
                    </Animated.Text>
                  </View>

                  <Text style={[styles.tapHintText, { color: backAppearance.tapHintColor }]}>
                    Tap to flip
                  </Text>

                </View>
              </Animated.View>

            </View>

          </Animated.View>

        </GestureDetector>

      </View>

      <View
        style={[
          styles.deckProgressPanel,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            marginTop: isCompact ? 14 : scaleValue(18, controlScale),
          },
        ]}
      >
        <View style={styles.deckProgressHeader}>
          <Text style={[styles.deckProgressTitle, { color: colors.text }]}>
            Card {safeIndex + 1} / {words.length}
          </Text>
          <Text style={[styles.deckProgressMeta, { color: colors.secondaryText }]}>
            {reverseDirection ? 'French first' : 'English first'}
          </Text>
        </View>
        <View style={[styles.deckProgressTrack, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.12)' : '#E3E8EF' }]}>
          <View
            style={[
              styles.deckProgressFill,
              {
                width: deckProgressWidth,
                backgroundColor: colors.primary,
              },
            ]}
          />
        </View>
      </View>

      {/* NAV */}
      <View style={[styles.navigationContainer, { marginTop: isCompact ? 12 : scaleValue(14, controlScale), gap: scaleValue(20, controlScale) }]}>
        <Pressable
          onPress={onPrevious}
          disabled={!canGoPrevious}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Previous flashcard"
          accessibilityState={{ disabled: !canGoPrevious }}
          style={[
            styles.navButton,
            !canGoPrevious && styles.navButtonDisabled,
            { backgroundColor: colors.card, borderColor: colors.border, padding: scaleValue(12, controlScale) },
          ]}
        >
          <MaterialIcons name="chevron-left" size={scaleValue(28, controlScale)} color={canGoPrevious ? colors.text : colors.secondaryText} />
        </Pressable>

        <Pressable
          onPress={onNext}
          disabled={!canGoNext}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Next flashcard"
          accessibilityState={{ disabled: !canGoNext }}
          style={[
            styles.navButton,
            !canGoNext && styles.navButtonDisabled,
            { backgroundColor: colors.card, borderColor: colors.border, padding: scaleValue(12, controlScale) },
          ]}
        >
          <MaterialIcons name="chevron-right" size={scaleValue(28, controlScale)} color={canGoNext ? colors.text : colors.secondaryText} />
        </Pressable>
      </View>

      {!!onToggleLearned && (
        <View
          style={[
            styles.learnedTracker,
            {
              backgroundColor: colors.surface,
              borderColor: isCurrentWordLearned ? learnedAccent : colors.border,
            },
          ]}
        >
          <View style={styles.learnedTrackerCopy}>
            <View style={styles.learnedTrackerHeader}>
              <View style={styles.learnedTrackerLabelRow}>
                <MaterialIcons
                  name={isCurrentWordLearned ? 'check-circle' : 'radio-button-unchecked'}
                  size={18}
                  color={learnedAccent}
                />
                <Text style={[styles.learnedTrackerTitle, { color: colors.text }]} numberOfLines={1}>
                  Learnt
                </Text>
              </View>
              <View
                style={[
                  styles.learnedCounterPill,
                  {
                    backgroundColor: learnedTrackerSurface,
                    borderColor: isCurrentWordLearned ? learnedAccent : colors.border,
                  },
                ]}
              >
                <Text style={[styles.learnedCounterText, { color: learnedAccent }]}>
                  {learnedCount}/{words.length}
                </Text>
              </View>
            </View>

            <View style={[styles.learnedProgressTrack, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.12)' : '#E3E8EF' }]}>
              <View
                style={[
                  styles.learnedProgressFill,
                  {
                    width: learnedProgressWidth,
                    backgroundColor: colors.success ?? '#58CC02',
                  },
                ]}
              />
            </View>
          </View>

          <Pressable
            onPress={onToggleLearned}
            disabled={!canToggleLearned}
            style={[
              styles.learnedActionButton,
              !canToggleLearned && styles.learnedActionButtonDisabled,
              {
                backgroundColor: isCurrentWordLearned
                  ? learnedTrackerSurface
                  : canToggleLearned
                    ? learnedAccent
                    : (isDarkMode ? 'rgba(255,255,255,0.08)' : '#EEF2F6'),
                borderColor: isCurrentWordLearned ? learnedAccent : learnedAccent,
              },
            ]}
          >
            <MaterialIcons
              name={isCurrentWordLearned ? 'undo' : 'check'}
              size={18}
              color={isCurrentWordLearned ? learnedAccent : canToggleLearned ? '#fff' : colors.secondaryText}
            />
            <Text
              style={[
                styles.learnedActionText,
                { color: isCurrentWordLearned ? learnedAccent : canToggleLearned ? '#fff' : colors.secondaryText },
              ]}
              numberOfLines={1}
            >
              {isCurrentWordLearned ? 'Undo' : currentWordReadyToMarkKnown ? 'I know this' : 'Flip first'}
            </Text>
          </Pressable>
        </View>
      )}

      {/* CONTROLS */}
      <View style={[styles.controlRow, { marginTop: isCompact ? 12 : scaleValue(16, controlScale), gap: scaleValue(12, controlScale) }]}>
        <Pressable
          onPress={onShuffle}
          style={[
            styles.shuffleButton,
            isShuffled && styles.shuffleButtonActive,
            {
              backgroundColor: isShuffled ? (colors.surfaceAlt ?? '#0f5b94') : (colors.primary ?? '#1671B6'),
              borderColor: isShuffled ? (colors.primary ?? '#7fd3ff') : (colors.primary ?? '#1671B6'),
              paddingHorizontal: scaleValue(16, controlScale),
              paddingVertical: scaleValue(8, controlScale),
            },
          ]}
        >
          <MaterialIcons name="shuffle" size={scaleValue(20, controlScale)} color="#fff" />
          <Text style={[styles.shuffleButtonText, { fontSize: scaleValue(16, controlScale) }]}>Shuffle</Text>
          {isShuffled && (
            <Text style={styles.shuffleIndicatorInline}>On</Text>
          )}
        </Pressable>

        <Pressable
          onPress={onToggleDirection}
          style={[styles.switchButton, { backgroundColor: colors.card, borderColor: colors.primary, paddingHorizontal: scaleValue(16, controlScale), paddingVertical: scaleValue(8, controlScale) }]}
        >
          <Text style={[styles.switchButtonText, { color: colors.primary, fontSize: scaleValue(14, controlScale) }]}>
            {reverseDirection ? 'FR -> EN' : 'EN -> FR'}
          </Text>
        </Pressable>

        {!!onToggleLessonMode && (
          <Pressable
            onPress={onToggleLessonMode}
            style={[
              styles.lessonModeToggle,
              {
                backgroundColor: lessonModeEnabled ? colors.primarySoft : colors.card,
                borderColor: lessonModeEnabled ? colors.primary : colors.border,
              },
            ]}
          >
            <MaterialIcons
              name={lessonModeEnabled ? 'school' : 'school'}
              size={18}
              color={lessonModeEnabled ? colors.primary : colors.text}
            />
            <Text
              style={[
                styles.lessonModeToggleText,
                { color: lessonModeEnabled ? colors.primary : colors.text },
              ]}
            >
              {lessonModeEnabled ? 'Free Practice' : 'Lesson Mode'}
            </Text>
          </Pressable>
        )}

      </View>

      {lessonModeEnabled && (
        <View style={styles.lessonModeFooter}>
          <Text style={[styles.lessonProgressText, { color: colors.secondaryText }]}>
            {currentWordReadyToMarkKnown ? `Known ${knownCount} / ${words.length}` : 'Flip the card before marking it known'}
          </Text>
          <View style={styles.lessonButtonsRow}>
            <Pressable
              onPress={onMarkReview}
              style={[styles.reviewButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <Text style={[styles.reviewButtonText, { color: colors.text }]}>Review Later</Text>
            </Pressable>
            <Pressable
              onPress={onMarkKnown}
              disabled={isCurrentWordKnown || !currentWordReadyToMarkKnown}
              style={[
                styles.knownButton,
                (isCurrentWordKnown || !currentWordReadyToMarkKnown) && styles.knownButtonDone,
                { backgroundColor: isCurrentWordKnown || !currentWordReadyToMarkKnown ? colors.borderStrong : colors.success },
              ]}
            >
              <Text style={styles.knownButtonText}>
                {isCurrentWordKnown ? 'Known' : 'Mark Known'}
              </Text>
            </Pressable>
          </View>
        </View>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 8,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  flashcardWrapper: {
    width: '96%',
    maxWidth: 396,
    height: 280,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flashcardTouchable: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: '100%',
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
    borderWidth: 2.5,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  cardBack: {
    backgroundColor: '#1671B6',
  },
  cardContent: {
    width: '100%',
    height: '100%',
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  cardText: {
    fontSize: 36,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
    marginVertical: 24,
  },
  cardTextFlipped: {
    color: '#fff',
  },
  cardTag: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#f0f0f0',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 12,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
  },
  frenchTag: {
    backgroundColor: '#E8F7FA',
    color: '#1671B6',
  },
  tapHintText: {
    position: 'absolute',
    bottom: 16,
    color: 'rgba(151, 151, 151, 1)',
    fontSize: 12,
    fontStyle: 'italic',
  },
  tapHintTextFlipped: {
    color: '#fff',
  },
  cardFace: {
  backfaceVisibility: 'hidden',
},
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    marginTop: 32,
    gap: 24,
  },

badge: {
  position: 'absolute',
  top: 12,
  right: 12,

  paddingHorizontal: 10,
  paddingVertical: 4,
  borderRadius: 12,
  zIndex: 999,
}, 
statusBadgeStack: {
  position: 'absolute',
  top: 12,
  left: 12,
  gap: 6,
  zIndex: 999,
},
statusBadge: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 4,
  paddingHorizontal: 10,
  paddingVertical: 5,
  borderRadius: 12,
},
statusBadgeText: {
  fontSize: 12,
  fontWeight: '800',
  color: '#2F8F2F',
},

badgeText: {
  fontSize: 12,
  fontWeight: '700',
  color: '#333',
},

center: {
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
},

shuffleIndicator: {
  marginTop: 8,
  fontSize: 13,
  fontWeight: '600',
  color: '#00ff37ff',
},

navButton: {
  padding: 12,
  borderRadius: 10,
  backgroundColor: '#fff',
  borderWidth: 1.5,            
  borderColor: 'rgba(0,0,0,0.15)',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
  elevation: 3,
},
navButtonDisabled: {
  opacity: 0.42,
  shadowOpacity: 0,
  elevation: 0,
},

  disabledButton: {
    backgroundColor: '#f5f5f5',
    shadowOpacity: 0,
    elevation: 0,
  },
  progressIndicator: {
    fontSize: 18,
    color: '#666',
    fontWeight: '600',
    marginHorizontal: 16,
    marginTop: 16,
  },
  deckProgressPanel: {
    width: '100%',
    maxWidth: 440,
    borderRadius: 16,
    borderWidth: 1.5,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  deckProgressHeader: {
    minHeight: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 8,
  },
  deckProgressTitle: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '900',
  },
  deckProgressMeta: {
    flexShrink: 1,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '800',
    textAlign: 'right',
  },
  deckProgressTrack: {
    height: 7,
    borderRadius: 999,
    overflow: 'hidden',
  },
  deckProgressFill: {
    height: '100%',
    borderRadius: 999,
  },
  controlRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 16,
  },
  cardContentFixed: {
  flex: 1,
  width: '100%',
  padding: 20,
  justifyContent: 'center',
  alignItems: 'center',
},

textArea: {
  flex: 1,
  width: '100%',
  justifyContent: 'center',
  alignItems: 'center',
},
  shuffleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1671B6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    justifyContent: 'center',
  },
  shuffleButtonActive: {
    backgroundColor: '#0f5b94',
    borderWidth: 2,
    borderColor: '#7fd3ff',
  },
  shuffleButtonText: {
    color: '#fff',
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
  },
  switchButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#1671B6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shuffleIndicatorInline: {
    marginLeft: 8,
    fontSize: 12,
    fontWeight: '700',
    color: '#dff7ff',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
cardContentCenteredFix: {
  flex: 1,
  padding: 20,
  alignItems: 'center',
  justifyContent: 'center'
},

  switchButtonText: {
    color: '#1671B6',
    fontSize: 14,
    fontWeight: 'bold',
  },
  lessonModeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderWidth: 2,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    justifyContent: 'center',
  },
  lessonModeToggleText: {
    fontSize: 14,
    fontWeight: '800',
  },
  learnedTracker: {
    width: '100%',
    maxWidth: 440,
    minHeight: 58,
    alignItems: 'stretch',
    borderWidth: 1.5,
    borderRadius: 16,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  learnedTrackerCopy: {
    flex: 1,
    minWidth: 0,
  },
  learnedTrackerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 7,
  },
  learnedTrackerLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  learnedCounterPill: {
    minHeight: 24,
    borderRadius: 999,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  learnedCounterText: {
    fontSize: 12,
    fontWeight: '900',
  },
  learnedTrackerTitle: {
    fontSize: 13,
    fontWeight: '900',
  },
  learnedProgressTrack: {
    height: 6,
    borderRadius: 999,
    overflow: 'hidden',
  },
  learnedProgressFill: {
    height: '100%',
    borderRadius: 999,
  },
  learnedActionButton: {
    alignSelf: 'center',
    minWidth: 112,
    minHeight: 42,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  learnedActionButtonDisabled: {
    opacity: 0.75,
  },
  learnedActionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '900',
  },
  lessonModeFooter: {
    width: '100%',
    alignItems: 'center',
    marginTop: 14,
    gap: 10,
  },
  lessonButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  lessonProgressText: {
    fontSize: 15,
    fontWeight: '700',
  },
  reviewButton: {
    minWidth: 140,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 20,
    backgroundColor: '#EEF3F8',
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewButtonText: {
    color: '#44505C',
    fontSize: 15,
    fontWeight: '800',
  },
  knownButton: {
    minWidth: 148,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 20,
    backgroundColor: '#58CC02',
    alignItems: 'center',
    justifyContent: 'center',
  },
  knownButtonDone: {
    backgroundColor: '#9AA5B1',
  },
  knownButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
});
