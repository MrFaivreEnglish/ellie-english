import React from 'react';
import { View, Text, StyleSheet, Platform, Pressable, useWindowDimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Word } from '../../types/VocabularyTypes';
import { clampNumber, getWebLessonScale, scaleValue } from '../shared/responsiveLayout';
import type { ThemeColors } from '../settings/ThemeContext';

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
  onStartLearnedReviewGame?: () => void;
  progressModeEnabled?: boolean;
  sideLabels?: {
    english?: string;
    french?: string;
  };
  lessonModeEnabled?: boolean;
  onToggleLessonMode?: () => void;
  onMarkKnown?: () => void;
  onMarkReview?: () => void;
  onToggleLearned?: () => void;
  isCurrentWordLearned?: boolean;
  learnedCount?: number;
  totalWordCount?: number;
  isCurrentWordKnown?: boolean;
  knownCount?: number;
  currentWordReadyToMarkKnown?: boolean;
  layoutHeight?: number;
  forceAndroidLayout?: boolean;
  colors: ThemeColors;
  isDarkMode: boolean;
}

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
  onStartLearnedReviewGame,
  progressModeEnabled = false,
  sideLabels,
  lessonModeEnabled = false,
  onToggleLessonMode,
  onMarkKnown,
  onMarkReview,
  onToggleLearned,
  isCurrentWordLearned = false,
  learnedCount = 0,
  totalWordCount,
  isCurrentWordKnown = false,
  knownCount = 0,
  currentWordReadyToMarkKnown = false,
  layoutHeight,
  forceAndroidLayout = false,
  colors,
  isDarkMode,
}: FlashcardProps) {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const responsiveHeight = Math.max(layoutHeight ?? windowHeight, 0);
  const isDesktopWeb = Platform.OS === 'web' && !forceAndroidLayout && windowWidth >= 768;
  const webScale = getWebLessonScale(windowWidth, responsiveHeight);
  const controlScale = Platform.OS === 'web' && !forceAndroidLayout ? webScale : 1;
  const isCompact = !isDesktopWeb && (responsiveHeight < 680 || windowWidth < 380);
  const isLarge = responsiveHeight > 900 && windowWidth >= 400;
  const progressTotal = Math.max(totalWordCount ?? words?.length ?? 0, 0);
  const allCardsLearnt = progressTotal > 0 && learnedCount >= progressTotal;
  const hasKnowledgeActions = !!onToggleLearned && progressModeEnabled;
  const desiredCardHeight = isCompact
    ? 266
    : isDesktopWeb
      ? scaleValue(isLarge ? 372 : 348, webScale)
      : Platform.OS === 'web' && !forceAndroidLayout
      ? scaleValue(isLarge ? 328 : 308, webScale)
      : isLarge ? 328 : 308;
  const baseCardTextSize = isCompact
    ? 34
    : isDesktopWeb
      ? scaleValue(isLarge ? 54 : 48, webScale)
      : Platform.OS === 'web' && !forceAndroidLayout
      ? scaleValue(isLarge ? 46 : 42, webScale)
      : isLarge ? 46 : 42;
  const navButtonSize = scaleValue(isCompact ? 48 : 52, controlScale);
  const knowledgeActionWidth = scaleValue(isCompact ? 62 : 68, controlScale);
  const knowledgeActionHeight = scaleValue(isCompact ? 54 : 58, controlScale);
  const navigationTopGap = isCompact ? 10 : scaleValue(12, controlScale);
  const navigationGap = scaleValue(14, controlScale);
  const controlRowTopGap = isCompact ? 12 : scaleValue(14, controlScale);
  const controlRowGap = scaleValue(10, controlScale);
  const controlRowHeight = scaleValue(42, controlScale);
  const reviewGameCardHeight = !!onStartLearnedReviewGame && progressModeEnabled && allCardsLearnt
    ? (isCompact ? 50 : scaleValue(52, controlScale))
    : 0;
  const lessonModeFooterHeight = lessonModeEnabled
    ? (isCompact ? 92 : scaleValue(102, controlScale))
    : 0;
  const navigationRowHeight = hasKnowledgeActions
    ? Math.max(knowledgeActionHeight, 48)
    : Math.max(navButtonSize, 34);
  const verticalChromeHeight =
    16 +
    navigationTopGap +
    navigationRowHeight +
    reviewGameCardHeight +
    controlRowTopGap +
    controlRowHeight +
    lessonModeFooterHeight;
  const availableCardHeight = Math.max(150, responsiveHeight - verticalChromeHeight);
  const cardHeight = Math.round(Math.min(desiredCardHeight, availableCardHeight));
  const cardFitScale = clampNumber(cardHeight / desiredCardHeight, 0.76, 1);
  const cardTextSize = Math.round(clampNumber(
    baseCardTextSize * cardFitScale,
    isCompact ? 26 : isDesktopWeb ? 36 : 30,
    baseCardTextSize
  ));
  const cardTextLineHeight = Math.ceil(cardTextSize * 1.36);
  const cardTextPaddingVertical = Math.round(scaleValue(isCompact ? 10 : 12, controlScale) * cardFitScale);
  const contentPadding = Math.round((isCompact ? 16 : scaleValue(isDesktopWeb ? 24 : 20, controlScale)) * clampNumber(cardFitScale, 0.82, 1));
  const flashcardMaxWidth = Platform.OS === 'web' && !forceAndroidLayout
    ? isDesktopWeb
      ? Math.round(clampNumber(windowWidth * 0.44, 460, 760))
      : Math.round(clampNumber(windowWidth * 0.36, 396, 720))
    : 396;
  const hasWords = words?.length > 0;
  const safeIndex = hasWords
    ? Math.min(Math.max(currentIndex, 0), words.length - 1)
    : 0;
  const currentWord = hasWords ? words[safeIndex] : null;
  const canGoPrevious = hasWords && safeIndex > 0;
  const canGoNext = hasWords && safeIndex < words.length - 1;
  const swipeExitDistance = windowWidth * 1.15;
  const frontIsEnglish = !reverseDirection;
  const englishSideBackground = isDarkMode ? colors.surface : (colors.card ?? '#FFFFFF');
  const englishSideBorder = colors.borderStrong ?? (isDarkMode ? '#5BA9DD' : '#D6DDE6');
  const frenchSideBackground = isDarkMode ? (colors.buttonBackground ?? colors.primary) : (colors.primary ?? '#1671B6');
  const frenchSideBorder = colors.borderStrong ?? colors.primary ?? '#2b6babff';
  const cardShadowColor = isDarkMode ? '#020B13' : '#173B58';
  const cardShadowOpacity = isDarkMode ? 0.34 : 0.15;

  const getSideAppearance = (isEnglishSide: boolean) => ({
    backgroundColor: isEnglishSide ? englishSideBackground : frenchSideBackground,
    borderColor: isEnglishSide ? englishSideBorder : frenchSideBorder,
    textColor: isEnglishSide ? colors.text : (colors.buttonText ?? '#fff'),
    badgeBackgroundColor: isEnglishSide
      ? (colors.primarySoft ?? (isDarkMode ? '#143A67' : 'rgba(63,63,63,0.08)'))
      : 'rgba(255,255,255,0.92)',
    badgeBorderColor: isEnglishSide
      ? (colors.border ?? 'rgba(0,0,0,0.08)')
      : 'rgba(255,255,255,0.36)',
    badgeTextColor: colors.primary ?? '#1671B6',
    tapHintColor: isEnglishSide
      ? (colors.secondaryText ?? (isDarkMode ? '#C7DBEE' : 'rgba(120,120,120,1)'))
      : 'rgba(255,255,255,0.68)',
  });

  const frontAppearance = getSideAppearance(frontIsEnglish);
  const backAppearance = getSideAppearance(!frontIsEnglish);

  // =========================
  // SWIPE STATE
  // =========================
  const translateX = useSharedValue(0);
  const cardChangeOffset = useSharedValue(0);
  const previousIndexRef = React.useRef(currentIndex);

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
        translateX.value = withTiming(-swipeExitDistance, { duration: 160 }, () => {
          runOnJS(onNext)();
        });
        return;
      }

      if (isRight && hasWords && safeIndex > 0) {
        translateX.value = withTiming(swipeExitDistance, { duration: 160 }, () => {
          runOnJS(onPrevious)();
        });
        return;
      }

      translateX.value = withSpring(0);
    });

  const swipeStyle = useAnimatedStyle(() => {
    const progress = Math.min(Math.abs(translateX.value) / Math.max(windowWidth, 1), 1);
    const rotate = (translateX.value / Math.max(windowWidth, 1)) * 10;
    const swipeScale = 1 - progress * 0.04;

    return {
      transform: [
        { translateX: translateX.value + cardChangeOffset.value },
        { perspective: 1000 },
        { rotateZ: `${rotate}deg` },
        { scale: swipeScale },
      ],
      opacity: 1 - progress * 0.18,
    };
  });

  // =========================
  // FLIP (CENTER FIXED)
  // =========================
  const flip = useSharedValue(0);

  const frontStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 1000 },
      { rotateY: `${flip.value}deg` },
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
    ],
    backfaceVisibility: 'hidden',
    position: 'absolute',
    width: '100%',
    height: '100%',
  }));

  // reset flip on card change (safe)
  React.useLayoutEffect(() => {
    const previousIndex = previousIndexRef.current;
    const direction = currentIndex > previousIndex ? 1 : currentIndex < previousIndex ? -1 : 0;
    previousIndexRef.current = currentIndex;

    flip.value = 0;
    translateX.value = 0;
    cardChangeOffset.value = direction === 0 ? 0 : direction * 18;
    cardChangeOffset.value = withTiming(0, { duration: 140 });
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

    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canGoNext, canGoPrevious, flip, isFlipped, onFlip, onNext, onPrevious]);

  // =========================
  // RENDER
  // =========================
  if (!currentWord) return null;

  const englishSideLabel = sideLabels?.english ?? 'English';
  const frenchSideLabel = sideLabels?.french ?? 'French';
  const formatSideBadgeLabel = (label: string) => label.toUpperCase();
  const directionLabel = reverseDirection
    ? `${frenchSideLabel} -> ${englishSideLabel}`
    : `${englishSideLabel} -> ${frenchSideLabel}`;
  const visibleTerm = isFlipped
    ? (frontIsEnglish ? currentWord.french : currentWord.english)
    : (frontIsEnglish ? currentWord.english : currentWord.french);
  const tapHint = 'Tap to flip';
  const statusKnown = hasKnowledgeActions
    ? isCurrentWordLearned
    : lessonModeEnabled
      ? isCurrentWordKnown
      : isCurrentWordLearned;
  const showStatusBadge = hasKnowledgeActions;
  const canChooseKnowledge = isCurrentWordLearned || currentWordReadyToMarkKnown;
  const trackerMetaLabel = progressTotal > 0 ? `${learnedCount}/${progressTotal}` : '';
  const notYetColor = colors.warning ?? '#F4B740';
  const iKnowColor = colors.success ?? '#58CC02';
  const disabledChoiceColor = colors.secondaryText;
  const knowledgeActionDisabled = !canChooseKnowledge;
  const notYetSelected = canChooseKnowledge && !isCurrentWordLearned;
  const iKnowSelected = isCurrentWordLearned;
  const waitingToChoose = hasKnowledgeActions && !canChooseKnowledge;
  const deckMetaLabel = waitingToChoose
    ? 'Flip first'
    : trackerMetaLabel
      ? `Known ${trackerMetaLabel}`
      : '';
  const chooseNotYet = () => {
    if (!canChooseKnowledge) return;
    if (isCurrentWordLearned) onToggleLearned?.();
    if (canGoNext) onNext();
  };
  const chooseIKnow = () => {
    if (!canChooseKnowledge) return;
    if (!isCurrentWordLearned) onToggleLearned?.();
    if (canGoNext) onNext();
  };

  const renderStatusBadges = () => {
    if (!showStatusBadge) return null;

    const badgeColor = waitingToChoose ? colors.primary : statusKnown ? iKnowColor : notYetColor;
    const badgeBackgroundColor = waitingToChoose
      ? (colors.primarySoft ?? (isDarkMode ? '#143A67' : '#EAF4FF'))
      : statusKnown
      ? (colors.successSoft ?? (isDarkMode ? '#123E36' : '#E7F8E8'))
      : (colors.warningSoft ?? (isDarkMode ? '#493912' : '#FFF4D8'));
    const badgeTextColor = waitingToChoose
      ? colors.primary
      : statusKnown
      ? (colors.successText ?? (isDarkMode ? '#D6FBE4' : '#2F8F2F'))
      : (isDarkMode ? '#FFD36D' : '#7A4F00');
    const badgeIcon = (
      waitingToChoose ? 'visibility' : statusKnown ? 'check-circle' : 'hourglass-empty'
    ) as React.ComponentProps<typeof MaterialIcons>['name'];
    const badgeLabel = waitingToChoose ? 'Flip first' : statusKnown ? 'Known' : 'Not yet';

    return (
      <View style={styles.statusBadgeStack}>
        <View style={[styles.statusBadge, { backgroundColor: badgeBackgroundColor, borderColor: badgeColor }]}>
          <MaterialIcons
            name={badgeIcon}
            size={17}
            color={badgeColor}
          />
          <Text style={[styles.statusBadgeText, { color: badgeTextColor }]}>
            {badgeLabel}
          </Text>
        </View>
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
            accessible
            accessibilityRole="button"
            accessibilityLabel={`${visibleTerm}. Tap to flip.`}
            accessibilityHint="Swipe left or right to move between flashcards."
          >

            {/* CARD STACK CONTAINER */}
            <View
              style={[
                styles.cardShadowShell,
                {
                  shadowColor: cardShadowColor,
                  shadowOpacity: cardShadowOpacity,
                },
              ]}
            >

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
                      {
                        backgroundColor: frontAppearance.badgeBackgroundColor,
                        borderColor: frontAppearance.badgeBorderColor,
                      },
                    ]}>
                      <Text style={[styles.badgeText, { color: frontAppearance.badgeTextColor }]}>
                        {formatSideBadgeLabel(frontIsEnglish ? englishSideLabel : frenchSideLabel)}
                      </Text>
                    </View>

                    <View style={[styles.textArea, { paddingVertical: cardTextPaddingVertical }]}>
                      <Text style={[
                        styles.cardText,
                        { fontSize: cardTextSize, lineHeight: cardTextLineHeight },
                        { color: frontAppearance.textColor },
                      ]} numberOfLines={3} adjustsFontSizeToFit minimumFontScale={0.58}>
                        {frontIsEnglish ? currentWord.english : currentWord.french}
                      </Text>
                    </View>

                    <Text style={[styles.tapHintText, { color: frontAppearance.tapHintColor }]}>
                      {tapHint}
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
                      {
                        backgroundColor: backAppearance.badgeBackgroundColor,
                        borderColor: backAppearance.badgeBorderColor,
                      },
                    ]}>
                      <Text style={[styles.badgeText, { color: backAppearance.badgeTextColor }]}>
                        {formatSideBadgeLabel(frontIsEnglish ? frenchSideLabel : englishSideLabel)}
                      </Text>
                    </View>

                    <View style={[styles.textArea, { paddingVertical: cardTextPaddingVertical }]}>
                      <Text
                        style={[
                          styles.cardText,
                          { fontSize: cardTextSize, lineHeight: cardTextLineHeight, color: backAppearance.textColor },
                        ]}
                        numberOfLines={3}
                        adjustsFontSizeToFit
                        minimumFontScale={0.58}
                      >
                        {frontIsEnglish ? currentWord.french : currentWord.english}
                      </Text>
                    </View>

                    <Text style={[styles.tapHintText, { color: backAppearance.tapHintColor }]}>
                      {tapHint}
                    </Text>

                  </View>
                </Animated.View>
            </View>

          </Animated.View>

        </GestureDetector>

      </View>

      <View style={[styles.navigationContainer, { marginTop: navigationTopGap, gap: navigationGap }]}>
        {hasKnowledgeActions ? (
          <>
            <Pressable
              onPress={chooseNotYet}
              disabled={knowledgeActionDisabled}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Mark this card not known yet"
              accessibilityHint="Moves to the next flashcard when one is available."
              accessibilityState={{ selected: notYetSelected, disabled: knowledgeActionDisabled }}
              style={({ pressed }) => [
                styles.knowledgeNavButton,
                notYetSelected && styles.knowledgeNavButtonSelected,
                knowledgeActionDisabled && styles.navButtonDisabled,
                pressed && !knowledgeActionDisabled && styles.navButtonPressed,
                {
                  width: knowledgeActionWidth,
                  height: knowledgeActionHeight,
                  borderRadius: scaleValue(17, controlScale),
                  backgroundColor: notYetSelected
                    ? (colors.warningSoft ?? (isDarkMode ? '#493912' : '#FFF4D8'))
                    : colors.surface,
                  borderColor: notYetSelected ? notYetColor : colors.border,
                },
              ]}
            >
              <MaterialIcons
                name="close"
                size={scaleValue(24, controlScale)}
                color={knowledgeActionDisabled ? disabledChoiceColor : notYetColor}
              />
              <Text
                style={[
                  styles.knowledgeNavLabel,
                  { color: knowledgeActionDisabled ? disabledChoiceColor : notYetColor },
                ]}
                numberOfLines={1}
              >
                Not yet
              </Text>
            </Pressable>

            <View
              style={[
                styles.deckCounterPill,
                styles.deckCounterPillProgress,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.deckCounterText, { color: colors.secondaryText }]}>
                Card {safeIndex + 1} / {words.length}
              </Text>
              {!!deckMetaLabel && (
                <Text style={[styles.deckCounterMetaText, { color: statusKnown ? iKnowColor : colors.secondaryText }]}>
                  {deckMetaLabel}
                </Text>
              )}
            </View>

            <Pressable
              onPress={chooseIKnow}
              disabled={knowledgeActionDisabled}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Mark this card known"
              accessibilityHint="Moves to the next flashcard when one is available."
              accessibilityState={{ selected: iKnowSelected, disabled: knowledgeActionDisabled }}
              style={({ pressed }) => [
                styles.knowledgeNavButton,
                iKnowSelected && styles.knowledgeNavButtonSelected,
                knowledgeActionDisabled && styles.navButtonDisabled,
                pressed && !knowledgeActionDisabled && styles.navButtonPressed,
                {
                  width: knowledgeActionWidth,
                  height: knowledgeActionHeight,
                  borderRadius: scaleValue(17, controlScale),
                  backgroundColor: iKnowSelected
                    ? (colors.successSoft ?? (isDarkMode ? '#123E36' : '#E7F8E8'))
                    : colors.surface,
                  borderColor: iKnowSelected ? iKnowColor : colors.border,
                },
              ]}
            >
              <MaterialIcons
                name="check"
                size={scaleValue(25, controlScale)}
                color={knowledgeActionDisabled ? disabledChoiceColor : iKnowColor}
              />
              <Text
                style={[
                  styles.knowledgeNavLabel,
                  { color: knowledgeActionDisabled ? disabledChoiceColor : iKnowColor },
                ]}
                numberOfLines={1}
              >
                Known
              </Text>
            </Pressable>
          </>
        ) : (
          <>
            <Pressable
              onPress={onPrevious}
              disabled={!canGoPrevious}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Previous flashcard"
              accessibilityState={{ disabled: !canGoPrevious }}
              style={({ pressed }) => [
                styles.navButton,
                !canGoPrevious && styles.navButtonDisabled,
                pressed && canGoPrevious && styles.navButtonPressed,
                {
                  width: navButtonSize,
                  height: navButtonSize,
                  borderRadius: scaleValue(13, controlScale),
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
              ]}
            >
              <MaterialIcons name="chevron-left" size={scaleValue(30, controlScale)} color={canGoPrevious ? colors.text : colors.secondaryText} />
            </Pressable>

            <View style={[styles.deckCounterPill, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.deckCounterText, { color: colors.secondaryText }]}>
                Card {safeIndex + 1} / {words.length}
              </Text>
            </View>

            <Pressable
              onPress={onNext}
              disabled={!canGoNext}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Next flashcard"
              accessibilityState={{ disabled: !canGoNext }}
              style={({ pressed }) => [
                styles.navButton,
                !canGoNext && styles.navButtonDisabled,
                pressed && canGoNext && styles.navButtonPressed,
                {
                  width: navButtonSize,
                  height: navButtonSize,
                  borderRadius: scaleValue(13, controlScale),
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
              ]}
            >
              <MaterialIcons name="chevron-right" size={scaleValue(30, controlScale)} color={canGoNext ? colors.text : colors.secondaryText} />
            </Pressable>
          </>
        )}
      </View>

      {!!onStartLearnedReviewGame && progressModeEnabled && allCardsLearnt && (
        <View
          style={[
            styles.reviewGameCard,
            {
              backgroundColor: colors.successSoft,
              borderColor: colors.success,
            },
          ]}
        >
          <View style={styles.reviewGameCopy}>
            <MaterialIcons name="emoji-events" size={17} color={colors.success ?? '#58CC02'} />
            <Text style={[styles.reviewGameText, { color: colors.successText }]}>
              All done! 🎉
            </Text>
          </View>

          <Pressable
            onPress={onStartLearnedReviewGame}
            accessibilityRole="button"
            accessibilityLabel="Go to Matching review"
            style={styles.reviewGameButton}
          >
            <MaterialIcons name="play-arrow" size={19} color="#FFFFFF" />
            <Text style={styles.reviewGameButtonText}>Play Match</Text>
          </Pressable>
        </View>
      )}

      {/* CONTROLS */}
      <View style={[styles.controlRow, { marginTop: controlRowTopGap, gap: controlRowGap }]}>
        <Pressable
          onPress={onShuffle}
          accessibilityRole="button"
          accessibilityLabel="Shuffle flashcards"
          accessibilityState={{ selected: isShuffled }}
          style={({ pressed }) => [
            styles.toolButton,
            pressed && styles.toolButtonPressed,
            {
              backgroundColor: isShuffled ? (colors.primarySoft ?? colors.surfaceAlt) : (isDarkMode ? colors.surface : colors.card),
              borderColor: isShuffled ? colors.primary : colors.border,
              minHeight: scaleValue(42, controlScale),
              paddingHorizontal: scaleValue(14, controlScale),
            },
          ]}
        >
          <MaterialIcons name="shuffle" size={scaleValue(20, controlScale)} color={isShuffled ? colors.primary : colors.text} />
          <Text
            style={[styles.toolButtonText, { color: isShuffled ? colors.primary : colors.text, fontSize: scaleValue(14, controlScale) }]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.82}
          >
            Shuffle
          </Text>
          {isShuffled && (
            <Text style={[styles.toolButtonMeta, { color: colors.primary }]}>On</Text>
          )}
        </Pressable>

        <Pressable
          onPress={onToggleDirection}
          accessibilityRole="button"
          accessibilityLabel="Change flashcard direction"
          style={({ pressed }) => [
            styles.toolButton,
            pressed && styles.toolButtonPressed,
            {
              backgroundColor: isDarkMode ? colors.surface : colors.card,
              borderColor: colors.border,
              minHeight: scaleValue(42, controlScale),
              paddingHorizontal: scaleValue(14, controlScale),
            },
          ]}
        >
          <MaterialIcons name="swap-horiz" size={scaleValue(20, controlScale)} color={colors.text} />
          <Text
            style={[styles.toolButtonText, { color: colors.text, fontSize: scaleValue(14, controlScale) }]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.72}
          >
            {directionLabel}
          </Text>
        </Pressable>

        {!!onToggleLessonMode && (
          <Pressable
            onPress={onToggleLessonMode}
            accessibilityRole="button"
            accessibilityLabel="Toggle lesson mode"
            accessibilityState={{ selected: lessonModeEnabled }}
            style={({ pressed }) => [
              styles.toolButton,
              pressed && styles.toolButtonPressed,
              {
                backgroundColor: lessonModeEnabled ? colors.primarySoft : (isDarkMode ? colors.surface : colors.card),
                borderColor: lessonModeEnabled ? colors.primary : colors.border,
                minHeight: scaleValue(42, controlScale),
                paddingHorizontal: scaleValue(14, controlScale),
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
                styles.toolButtonText,
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
              <MaterialIcons name="bookmark-border" size={17} color={colors.text} />
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
              <MaterialIcons
                name={isCurrentWordKnown ? 'check-circle' : 'check'}
                size={17}
                color="#FFFFFF"
              />
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
    paddingTop: 4,
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  flashcardWrapper: {
    width: '96%',
    maxWidth: 396,
    height: 280,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  cardShadowShell: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 7,
  },
  flipCard: {
    width: '100%',
    height: '100%',
  },
  card: {
    width: '100%',
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.05)',
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
    width: '100%',
    fontSize: 36,
    fontWeight: '800',
    textAlign: 'center',
    color: '#333',
    marginVertical: 0,
    includeFontPadding: true,
  },
  tapHintText: {
    position: 'absolute',
    bottom: 14,
    color: 'rgba(151, 151, 151, 1)',
    fontSize: 12,
    fontStyle: 'italic',
    fontWeight: '500',
  },
  badge: {
    position: 'absolute',
    top: 14,
    right: 14,
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
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
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#2F8F2F',
  },
  badgeText: {
    fontSize: 12,
    lineHeight: 15,
    fontWeight: '900',
    color: '#333',
  },
  navigationContainer: {
    width: '100%',
    maxWidth: 440,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  navButtonPressed: {
    opacity: 0.86,
    transform: [{ scale: 0.98 }],
  },
  navButtonDisabled: {
    opacity: 0.42,
    shadowOpacity: 0,
    elevation: 0,
  },
  knowledgeNavButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    paddingVertical: 4,
    gap: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  knowledgeNavLabel: {
    maxWidth: '100%',
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '900',
    textAlign: 'center',
  },
  knowledgeNavButtonSelected: {
    shadowOpacity: 0.14,
    shadowRadius: 6,
    elevation: 4,
  },
  deckCounterPill: {
    minWidth: 104,
    minHeight: 34,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deckCounterPillProgress: {
    minWidth: 132,
    minHeight: 48,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  deckCounterText: {
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '800',
    textAlign: 'center',
  },
  deckCounterMetaText: {
    marginTop: 1,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '900',
    textAlign: 'center',
  },

  controlRow: {
    width: '100%',
    maxWidth: 440,
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 16,
  },
  toolButton: {
    minWidth: 118,
    borderRadius: 12,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  toolButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  toolButtonText: {
    fontSize: 14,
    fontWeight: '900',
  },
  toolButtonMeta: {
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  textArea: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'visible',
    paddingHorizontal: 4,
  },
  reviewGameCard: {
    width: '100%',
    maxWidth: 440,
    minHeight: 42,
    borderRadius: 999,
    borderWidth: 1.5,
    marginTop: 7,
    paddingHorizontal: 8,
    paddingVertical: 5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  reviewGameCopy: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  reviewGameText: {
    fontSize: 13,
    fontWeight: '900',
  },
  reviewGameButton: {
    minHeight: 34,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: '#58CC02',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  reviewGameButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
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
