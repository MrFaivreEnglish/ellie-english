import React from 'react';
import { View, Text, StyleSheet, Dimensions, Platform, Pressable, useWindowDimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Word } from '../types/VocabularyTypes';
import { clampNumber, getWebLessonScale, scaleValue } from '../utils/responsiveLayout';

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
  learnedControlsEnabled?: boolean;
  onToggleLearnedControls?: () => void;
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
  learnedControlsEnabled = false,
  onToggleLearnedControls,
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
  const showLearnedBadge = learnedControlsEnabled && isCurrentWordLearned;
  const showKnownBadge = lessonModeEnabled && isCurrentWordKnown;

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

      {/* NAV */}
      <View style={[styles.navigationContainer, { marginTop: isCompact ? 22 : scaleValue(32, controlScale), gap: scaleValue(24, controlScale) }]}>
        <Pressable
          onPress={onPrevious}
          style={[styles.navButton, { backgroundColor: colors.card, borderColor: colors.border, padding: scaleValue(12, controlScale) }]}
        >
          <MaterialIcons name="chevron-left" size={scaleValue(28, controlScale)} color={colors.text} />
        </Pressable>

        <Pressable
          onPress={onNext}
          style={[styles.navButton, { backgroundColor: colors.card, borderColor: colors.border, padding: scaleValue(12, controlScale) }]}
        >
          <MaterialIcons name="chevron-right" size={scaleValue(28, controlScale)} color={colors.text} />
        </Pressable>
      </View>

      {/* COUNTER */}
      <Text style={[styles.progressIndicator, { color: colors.secondaryText, marginTop: isCompact ? 12 : scaleValue(16, controlScale), fontSize: scaleValue(18, controlScale) }]}>
        {currentIndex + 1} / {words.length}
      </Text>

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

        {!!onToggleLearnedControls && (
          <Pressable
            onPress={onToggleLearnedControls}
            style={[
              styles.learnedModeToggle,
              learnedControlsEnabled && styles.learnedModeToggleActive,
              {
                backgroundColor: learnedControlsEnabled ? colors.successSoft : colors.card,
                borderColor: learnedControlsEnabled ? colors.success : colors.border,
              },
            ]}
          >
            <MaterialIcons
              name={learnedControlsEnabled ? 'toggle-on' : 'toggle-off'}
              size={24}
              color={learnedControlsEnabled ? colors.success : colors.text}
            />
            <Text
              style={[
                styles.learnedModeToggleText,
                { color: learnedControlsEnabled ? colors.successText : colors.text },
              ]}
            >
              {learnedControlsEnabled ? 'Tracking' : 'Track Learnt'}
            </Text>
          </Pressable>
        )}
      </View>

      {learnedControlsEnabled && (
        <View style={[styles.learnedPanel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.learnedPanelCopy}>
            <View style={styles.learnedPanelTitleRow}>
              <MaterialIcons
                name={isCurrentWordLearned ? 'check-circle' : 'radio-button-unchecked'}
                size={18}
                color={isCurrentWordLearned ? (colors.success ?? '#58CC02') : colors.secondaryText}
              />
              <Text style={[styles.learnedPanelTitle, { color: colors.text }]} numberOfLines={1}>
                {isCurrentWordLearned ? 'This card is learnt' : 'Still practising'}
              </Text>
            </View>
            <Text style={[styles.learnedPanelMeta, { color: colors.secondaryText }]} numberOfLines={1}>
              {learnedCount} of {words.length} cards learnt
            </Text>
          </View>
          <Pressable
            onPress={onToggleLearned}
            style={[
              styles.learnedActionButton,
              {
                backgroundColor: isCurrentWordLearned ? colors.warningSoft : colors.success,
                borderColor: isCurrentWordLearned ? colors.warning ?? '#F4B740' : colors.success,
              },
            ]}
          >
            <MaterialIcons
              name={isCurrentWordLearned ? 'undo' : 'check'}
              size={19}
              color={isCurrentWordLearned ? (colors.text ?? '#333') : '#fff'}
            />
            <Text
              style={[
                styles.learnedActionText,
                { color: isCurrentWordLearned ? (colors.text ?? '#333') : '#fff' },
              ]}
              numberOfLines={1}
            >
              {isCurrentWordLearned ? 'Undo' : 'Learnt'}
            </Text>
          </Pressable>
        </View>
      )}

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
  learnedModeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 2,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    justifyContent: 'center',
  },
  learnedModeToggleActive: {
    shadowColor: '#58CC02',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.14,
    shadowRadius: 5,
    elevation: 2,
  },
  learnedModeToggleText: {
    fontSize: 14,
    fontWeight: '800',
  },
  learnedPanel: {
    width: '100%',
    maxWidth: 430,
    minHeight: 60,
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 16,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  learnedPanelCopy: {
    flex: 1,
    minWidth: 0,
  },
  learnedPanelTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  learnedPanelTitle: {
    flex: 1,
    minWidth: 0,
    fontSize: 14,
    fontWeight: '900',
  },
  learnedPanelMeta: {
    fontSize: 12,
    fontWeight: '800',
    marginTop: 3,
  },
  learnedActionButton: {
    minWidth: 98,
    minHeight: 42,
    paddingHorizontal: 14,
    borderRadius: 22,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
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
