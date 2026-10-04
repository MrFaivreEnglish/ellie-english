import React from 'react';
import { View, StyleSheet, Platform, Pressable, useWindowDimensions } from 'react-native';
import Text from '../shared/ThemedText';
import MaterialIcons from '../shared/ThemedMaterialIcon';
import { Word } from '../../types/VocabularyTypes';
import {
  clampNumber,
  getWebLessonScale,
  isCompactViewport,
  isDesktopWebWidth,
  LARGE_PHONE_HEIGHT,
  LARGE_PHONE_WIDTH,
  scaleValue,
} from '../shared/responsiveLayout';
import type { ThemeColors } from '../settings/ThemeContext';
import { FRESH_COLORS } from '../shared/freshDirection';

import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';

import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useEnglishSpeech } from '../shared/useEnglishSpeech';

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
  onNotYet?: () => void;
  isCurrentWordLearned?: boolean;
  learnedCount?: number;
  totalWordCount?: number;
  isCurrentWordKnown?: boolean;
  knownCount?: number;
  currentWordReadyToMarkKnown?: boolean;
  layoutHeight?: number;
  forceAndroidLayout?: boolean;
  isDesktopWeb?: boolean;
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
  onNotYet,
  isCurrentWordLearned = false,
  learnedCount = 0,
  totalWordCount,
  isCurrentWordKnown = false,
  knownCount = 0,
  currentWordReadyToMarkKnown = false,
  layoutHeight,
  forceAndroidLayout = false,
  isDesktopWeb: isDesktopWebProp,
  colors,
  isDarkMode,
}: FlashcardProps) {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const responsiveHeight = Math.max(layoutHeight ?? windowHeight, 0);
  const isDesktopWeb = isDesktopWebProp ?? (!forceAndroidLayout && isDesktopWebWidth(windowWidth));
  const webScale = getWebLessonScale(windowWidth, responsiveHeight);
  const controlScale = webScale;






  const isScaledLayout = isDesktopWeb || webScale > 1;
  // Heavier than the 2 / 1.6 it used to be: the border is what gives the card its presence,
  // since it carries no shadow.
  const flashcardBorderWidth = isScaledLayout ? scaleValue(2, webScale) : 1.8;



  const isCompact = !isDesktopWeb && isCompactViewport(windowWidth, responsiveHeight, {
    widthThreshold: 380,
    heightThreshold: 680,
  });
  const isLarge = responsiveHeight > LARGE_PHONE_HEIGHT && windowWidth >= LARGE_PHONE_WIDTH;
  const progressTotal = Math.max(totalWordCount ?? words?.length ?? 0, 0);
  const allCardsLearnt = progressTotal > 0 && learnedCount >= progressTotal;
  const hasKnowledgeActions = !!onToggleLearned && progressModeEnabled;
  const desiredCardHeight = isCompact
    ? 266
    : isDesktopWeb
      ? scaleValue(isLarge ? 372 : 348, webScale)
      // A fixed height left a tall phone (and native, with no browser chrome) with a big
      // dead gap under the card. Keep the old size as the floor and let it grow into
      // whatever room there actually is — cardHeight below still clamps to what fits, and
      // Cards has no keyboard that could later cover it.
      : Math.round(clampNumber(
          responsiveHeight * 0.46,
          scaleValue(isLarge ? 328 : 308, webScale),
          460
        ));




  const desktopCardTextScale = Math.min(webScale * 1.25, 2.3);
  const baseCardTextSize = isCompact
    ? 34
    : isDesktopWeb
      ? scaleValue(isLarge ? 54 : 48, desktopCardTextScale)
      : scaleValue(isLarge ? 46 : 42, webScale);




  const navControlScale = isScaledLayout ? Math.min(controlScale * 1.2, 2.2) : controlScale;
  const navButtonSize = scaleValue(isCompact ? 48 : 52, navControlScale);
  const knowledgeActionWidth = navButtonSize;
  const knowledgeActionHeight = navButtonSize;
  const isAndroid = Platform.OS === 'android' || forceAndroidLayout;
  // The whole stack (card → nav row → control row) is vertically centred, so widening this
  // gap both separates the card from its nav buttons and lifts the card up the screen.
  const navigationTopGap = isAndroid
    ? scaleValue(isCompact ? 64 : 76, controlScale)
    : isCompact ? 38 : scaleValue(44, controlScale);
  const navigationGap = hasKnowledgeActions
    ? scaleValue(isCompact ? 8 : 10, controlScale)
    : scaleValue(14, controlScale);
  const controlRowTopGap = isAndroid
    ? scaleValue(isCompact ? 48 : 56, controlScale)
    : isCompact ? 30 : scaleValue(26, controlScale);
  const controlRowGap = scaleValue(10, controlScale);
  const controlButtonHeight = scaleValue(isDesktopWeb ? 54 : isCompact ? 48 : 50, controlScale);
  const controlRowHeight = controlButtonHeight;
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
  const knowledgeButtonRadius = scaleValue(14, navControlScale);
  const navButtonRadius = scaleValue(15, navControlScale);


  const gameAccentColor = isDarkMode ? '#3FA0DB' : FRESH_COLORS.exerciseBlue;
  const gameAccentSoft = isDarkMode ? '#12345A' : FRESH_COLORS.exerciseBlueTint;
  const gameAccentSofter = colors.surface;
  const gameAccentBorder = isDarkMode ? '#2584B2' : '#a8d5f0';

  const confirmKnownBg = '#5cb572';
  const confirmKnownBorder = '#007834';
  const controlSurfaceBackground = isDarkMode ? colors.surface : '#FFFFFF';
  const controlSurfaceAltBackground = gameAccentSofter;
  const controlSurfaceBorder = gameAccentBorder;
  const flashcardMaxWidth = isDesktopWeb
    ? Math.round(clampNumber(windowWidth * 0.44, 460, 1040))
    : Math.round(clampNumber(windowWidth * 0.36, 396, 720));
  const hasWords = words?.length > 0;
  const safeIndex = hasWords
    ? Math.min(Math.max(currentIndex, 0), words.length - 1)
    : 0;
  const currentWord = hasWords ? words[safeIndex] : null;
  const currentSourceLessonTitle =
    typeof currentWord?.sourceLesson?.title === 'string'
      ? currentWord.sourceLesson.title.trim()
      : '';
  const canGoPrevious = hasWords && safeIndex > 0;
  const canGoNext = hasWords && safeIndex < words.length - 1;
  const swipeExitDistance = windowWidth * 1.15;
  const frontIsEnglish = !reverseDirection;
  const englishSideBackground = isDarkMode ? colors.surface : (colors.card ?? '#FFFFFF');


  const matchTileBorderNeutral = isDarkMode ? '#3A3E48' : colors.border;
  // White in dark mode, same as the French side and the same rule the lesson cards use
  // (mixedLessonBorder) — a neutral border disappears against a dark surface.
  const englishSideBorder = isDarkMode ? '#FFFFFF' : matchTileBorderNeutral;
  const frenchSideBackground = isDarkMode ? (colors.buttonBackground ?? gameAccentColor) : gameAccentColor;
  // Was gameAccentColor — the same colour as this side's own background, so the border was
  // effectively invisible. White is how the rest of the app edges a coloured surface (the
  // grammar category cards, the mix-stack cards, the lesson tiles), and it echoes the white
  // inner highlight already on this side.
  const frenchSideBorder = '#FFFFFF';
  const englishCardInnerBorderColor = isDarkMode ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.82)';
  const colorCardInnerBorderColor = 'rgba(255,255,255,0.24)';

  const getSideAppearance = (isEnglishSide: boolean) => ({
    backgroundColor: isEnglishSide ? englishSideBackground : frenchSideBackground,
    borderColor: isEnglishSide ? englishSideBorder : frenchSideBorder,
    textColor: isEnglishSide ? colors.text : (colors.buttonText ?? '#fff'),
    badgeBackgroundColor: isEnglishSide
      ? gameAccentSoft
      : 'rgba(255,255,255,0.92)',
    badgeBorderColor: isEnglishSide
      ? gameAccentBorder
      : 'rgba(255,255,255,0.36)',
    badgeTextColor: gameAccentColor,
    tapHintColor: isEnglishSide
      ? (colors.secondaryText ?? (isDarkMode ? '#C7DBEE' : 'rgba(120,120,120,1)'))
      : 'rgba(255,255,255,0.68)',
  });

  const frontAppearance = getSideAppearance(frontIsEnglish);
  const backAppearance = getSideAppearance(!frontIsEnglish);




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

  const { speak: speakEnglish, stop: stopEnglishSpeech, isSpeaking: isSpeakingEnglish } = useEnglishSpeech();

  React.useEffect(() => {
    stopEnglishSpeech();
  }, [currentWord?.english, stopEnglishSpeech]);

  const speakEnglishWord = React.useCallback(() => {
    speakEnglish(currentWord?.english);
  }, [currentWord?.english, speakEnglish]);




  if (!currentWord) return null;

  const englishSideLabel = sideLabels?.english ?? 'English';
  const frenchSideLabel = sideLabels?.french ?? 'French';
  const formatSideBadgeLabel = (label: string) => label.toUpperCase();
  const directionLabel = reverseDirection
    ? `${frenchSideLabel} → ${englishSideLabel}`
    : `${englishSideLabel} → ${frenchSideLabel}`;
  // Mobile's tool button has less room than the desktop rail — abbreviate to initials
  // instead of shrinking the font to fit, which was making the label hard to read.
  const abbreviate = (label: string) => label.slice(0, 2).toUpperCase();
  const directionLabelMobile = reverseDirection
    ? `${abbreviate(frenchSideLabel)} → ${abbreviate(englishSideLabel)}`
    : `${abbreviate(englishSideLabel)} → ${abbreviate(frenchSideLabel)}`;
  const visibleTerm = isFlipped
    ? (frontIsEnglish ? currentWord.french : currentWord.english)
    : (frontIsEnglish ? currentWord.english : currentWord.french);
  const englishSideVisible = isFlipped ? !frontIsEnglish : frontIsEnglish;
  const tapHint = 'Tap to flip';
  const statusKnown = hasKnowledgeActions
    ? isCurrentWordLearned
    : lessonModeEnabled
      ? isCurrentWordKnown
      : isCurrentWordLearned;
  const showStatusBadge = hasKnowledgeActions;
  const canChooseKnowledge = isCurrentWordLearned || currentWordReadyToMarkKnown;


  const notYetColor = isDarkMode ? '#E8998F' : '#c96b64';
  const notYetSoftBg = isDarkMode ? '#3A1512' : '#f4b8b2';
  const iKnowColor = isDarkMode ? '#7DD9A0' : '#3a8f5c';
  const iKnowSoftBg = isDarkMode ? '#0E2E1E' : '#9bd4ae';
  const disabledChoiceColor = colors.secondaryText;
  const knowledgeActionDisabled = !canChooseKnowledge;
  const notYetSelected = canChooseKnowledge && !isCurrentWordLearned;
  const iKnowSelected = isCurrentWordLearned;
  const waitingToChoose = hasKnowledgeActions && !canChooseKnowledge;
  const chooseNotYet = () => {
    if (!canChooseKnowledge) return;
    if (isCurrentWordLearned) onToggleLearned?.();
    onNotYet?.();
    if (canGoNext) onNext();
  };
  const chooseIKnow = () => {
    if (!canChooseKnowledge) return;
    if (!isCurrentWordLearned) onToggleLearned?.();
    if (canGoNext) onNext();
  };

  const renderStatusBadges = (appearance: ReturnType<typeof getSideAppearance>) => {

    if (!showStatusBadge || statusKnown) return null;

    const badgeColor = appearance.tapHintColor;
    const badgeIcon = (
      waitingToChoose ? 'visibility' : 'hourglass-empty'
    ) as React.ComponentProps<typeof MaterialIcons>['name'];
    const badgeLabel = waitingToChoose ? 'Flip first' : 'Not yet';

    return (
      <View style={styles.statusBadgeStack}>
        <MaterialIcons name={badgeIcon} size={scaleValue(14, controlScale)} color={badgeColor} />
        <Text style={[styles.statusBadgeText, { color: badgeColor }]}>
          {badgeLabel}
        </Text>
      </View>
    );
  };

  const renderSourceLessonBadge = (appearance: ReturnType<typeof getSideAppearance>) => {
    if (!currentSourceLessonTitle) return null;

    return (
      <View
        style={[
          styles.sourceLessonBadge,
          {
            backgroundColor: appearance.badgeBackgroundColor,
            borderColor: appearance.badgeBorderColor,
          },
        ]}
      >
        <MaterialIcons name="auto-stories" size={scaleValue(12, controlScale)} color={appearance.badgeTextColor} />
        <Text
          style={[styles.sourceLessonBadgeText, { color: appearance.badgeTextColor }]}
          numberOfLines={1}
        >
          {currentSourceLessonTitle}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={[styles.flashcardWrapper, { height: cardHeight, maxWidth: flashcardMaxWidth }]}>

        <Animated.View
          style={[
            styles.swipeCardLayer,
            swipeStyle,
          ]}
        >
          <GestureDetector gesture={gesture}>
            <View
              style={styles.cardGestureTarget}
              accessible
              accessibilityRole="button"
              accessibilityLabel={`${visibleTerm}. Tap to flip.`}
              accessibilityHint="Swipe left or right to move between flashcards."
            >

            <View
              style={styles.cardShadowFrame}
            >
              <View style={styles.cardShadowShell}>
                <View style={styles.flipCard}>
                <Animated.View style={[
                  styles.card,
                  frontStyle,
                  {
                    backgroundColor: frontAppearance.backgroundColor,
                    borderColor: frontAppearance.borderColor,
                    borderWidth: flashcardBorderWidth,
                  },
                ] as any}>
                  <View style={[styles.cardContent, { padding: contentPadding }]}>
                    <View
                      style={[
                        styles.cardInnerHighlight,
                        { borderColor: frontIsEnglish ? englishCardInnerBorderColor : colorCardInnerBorderColor },
                        { pointerEvents: 'none' },
                      ]}
                    />
                    {renderStatusBadges(frontAppearance)}
                    {renderSourceLessonBadge(frontAppearance)}

                    <View style={[
                      styles.badge,
                      {
                        top: scaleValue(16, controlScale),
                        right: scaleValue(16, controlScale),
                        paddingHorizontal: scaleValue(12, controlScale),
                        paddingVertical: scaleValue(5, controlScale),
                      },
                      {
                        backgroundColor: frontAppearance.badgeBackgroundColor,
                        borderColor: frontAppearance.badgeBorderColor,
                      },
                    ]}>
                      <Text style={[styles.badgeText, { fontSize: scaleValue(11, controlScale), lineHeight: scaleValue(14, controlScale) }, { color: frontAppearance.badgeTextColor }]}>
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

                    {!currentSourceLessonTitle ? (
                      <Text
                        style={[
                          styles.tapHintText,
                          { fontSize: scaleValue(11, navControlScale), bottom: scaleValue(18, navControlScale) },
                          { color: frontAppearance.tapHintColor },
                        ]}
                      >
                        {tapHint}
                      </Text>
                    ) : null}

                  </View>
                </Animated.View>

                <Animated.View style={[
                  styles.card,
                  backStyle,
                  {
                    backgroundColor: backAppearance.backgroundColor,
                    borderColor: backAppearance.borderColor,
                    borderWidth: flashcardBorderWidth,
                  },
                ] as any}>
                  <View style={[styles.cardContent, { padding: contentPadding }]}>
                    <View
                      style={[
                        styles.cardInnerHighlight,
                        { borderColor: frontIsEnglish ? colorCardInnerBorderColor : englishCardInnerBorderColor },
                        { pointerEvents: 'none' },
                      ]}
                    />
                    {renderStatusBadges(backAppearance)}
                    {renderSourceLessonBadge(backAppearance)}

                    <View style={[
                      styles.badge,
                      {
                        top: scaleValue(16, controlScale),
                        right: scaleValue(16, controlScale),
                        paddingHorizontal: scaleValue(12, controlScale),
                        paddingVertical: scaleValue(5, controlScale),
                      },
                      {
                        backgroundColor: backAppearance.badgeBackgroundColor,
                        borderColor: backAppearance.badgeBorderColor,
                      },
                    ]}>
                      <Text style={[styles.badgeText, { fontSize: scaleValue(11, controlScale), lineHeight: scaleValue(14, controlScale) }, { color: backAppearance.badgeTextColor }]}>
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

                    {!currentSourceLessonTitle ? (
                      <Text
                        style={[
                          styles.tapHintText,
                          { fontSize: scaleValue(11, navControlScale), bottom: scaleValue(18, navControlScale) },
                          { color: backAppearance.tapHintColor },
                        ]}
                      >
                        {tapHint}
                      </Text>
                    ) : null}

                  </View>
                </Animated.View>
                </View>
              </View>
            </View>

            </View>
          </GestureDetector>

          {englishSideVisible ? (
            <Pressable
              onPress={speakEnglishWord}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel={`Hear ${currentWord.english}`}
              style={({ pressed }) => [
                styles.speechButton,
                pressed && styles.speechButtonPressed,
                {
                  bottom: scaleValue(16, controlScale),
                  right: scaleValue(20, controlScale),
                  width: scaleValue(36, controlScale),
                  height: scaleValue(36, controlScale),
                },
                {
                  backgroundColor: isSpeakingEnglish ? gameAccentColor : controlSurfaceBackground,
                  borderColor: isSpeakingEnglish ? gameAccentColor : controlSurfaceBorder,
                },
              ]}
            >
              <MaterialIcons
                name="volume-up"
                size={scaleValue(18, controlScale)}
              color={isSpeakingEnglish ? colors.buttonText : gameAccentColor}
              />
            </Pressable>
          ) : null}
        </Animated.View>

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
                styles.controlSurfaceShadow,
                notYetSelected && styles.knowledgeNavButtonSelected,
                knowledgeActionDisabled && styles.navButtonDisabled,
                pressed && !knowledgeActionDisabled && styles.navButtonPressed,
                {
                  width: knowledgeActionWidth,
                  height: knowledgeActionHeight,
                  borderRadius: knowledgeButtonRadius,
                  backgroundColor: controlSurfaceBackground,
                  borderColor: notYetColor,
                },
              ]}
            >
              <View
                style={[
                  styles.knowledgeIconDisc,
                  {
                    backgroundColor: notYetSoftBg,
                    borderColor: notYetColor,
                  },
                ]}
              >
                <MaterialIcons
                  name="close"
                  size={scaleValue(20, navControlScale)}
                  color={knowledgeActionDisabled ? disabledChoiceColor : notYetColor}
                />
              </View>
            </Pressable>

            <View
              style={[
                styles.deckCounterPill,
                styles.controlSurfaceShadow,
                {
                  minWidth: scaleValue(104, navControlScale),
                  minHeight: scaleValue(34, navControlScale),
                  paddingHorizontal: scaleValue(12, navControlScale),
                },
                { backgroundColor: controlSurfaceAltBackground, borderColor: matchTileBorderNeutral },
              ]}
            >
              <Text style={[styles.deckCounterText, { fontSize: scaleValue(12, navControlScale), lineHeight: scaleValue(16, navControlScale) }, { color: isDarkMode ? colors.text : '#4c473c' }]}>
                {safeIndex + 1} / {words.length}
              </Text>
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
                styles.controlSurfaceShadow,
                iKnowSelected && styles.knowledgeNavButtonSelected,
                knowledgeActionDisabled && styles.navButtonDisabled,
                pressed && !knowledgeActionDisabled && styles.navButtonPressed,
                {
                  width: knowledgeActionWidth,
                  height: knowledgeActionHeight,
                  borderRadius: knowledgeButtonRadius,
                  backgroundColor: controlSurfaceBackground,
                  borderColor: iKnowColor,
                },
              ]}
            >
              <View
                style={[
                  styles.knowledgeIconDisc,
                  {
                    backgroundColor: iKnowSelected ? iKnowColor : iKnowSoftBg,
                    borderColor: knowledgeActionDisabled ? colors.border : iKnowColor,
                  },
                ]}
              >
                <MaterialIcons
                  name="check"
                  size={scaleValue(20, navControlScale)}
                  color={knowledgeActionDisabled ? disabledChoiceColor : iKnowSelected ? colors.buttonText : iKnowColor}
                />
              </View>
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
                  borderRadius: navButtonRadius,
                  backgroundColor: controlSurfaceBackground,
                  borderColor: matchTileBorderNeutral,
                },
              ]}
            >
              <MaterialIcons name="chevron-left" size={scaleValue(29, navControlScale)} color={canGoPrevious ? '#a39e91' : colors.secondaryText} />
            </Pressable>

            <View
              style={[
                styles.deckCounterPill,
                styles.controlSurfaceShadow,
                {
                  minWidth: scaleValue(104, navControlScale),
                  minHeight: scaleValue(34, navControlScale),
                  paddingHorizontal: scaleValue(12, navControlScale),
                },
                { backgroundColor: controlSurfaceAltBackground, borderColor: matchTileBorderNeutral },
              ]}
            >
              <Text style={[styles.deckCounterText, { fontSize: scaleValue(12, navControlScale), lineHeight: scaleValue(16, navControlScale) }, { color: isDarkMode ? colors.text : '#4c473c' }]}>
                {safeIndex + 1} / {words.length}
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
                  borderRadius: navButtonRadius,
                  backgroundColor: controlSurfaceBackground,
                  borderColor: '#71add0',
                },
              ]}
            >
              <MaterialIcons name="chevron-right" size={scaleValue(29, navControlScale)} color={canGoNext ? gameAccentColor : colors.secondaryText} />
            </Pressable>
          </>
        )}
      </View>

      {!!onStartLearnedReviewGame && progressModeEnabled && allCardsLearnt && (
        <View
          style={[
            styles.reviewGameCard,
            styles.controlSurfaceShadow,
            {
              backgroundColor: isDarkMode ? colors.successSoft : '#F4FBF5',
              borderColor: colors.success,
            },
          ]}
        >
          <View style={styles.reviewGameCopy}>
            <MaterialIcons name="emoji-events" size={scaleValue(17, controlScale)} color={colors.success ?? '#58CC02'} />
            <Text style={[styles.reviewGameText, { color: colors.successText }]}>
              All done!
            </Text>
          </View>

          <Pressable
            onPress={onStartLearnedReviewGame}
            accessibilityRole="button"
            accessibilityLabel="Go to Matching review"
            style={({ pressed }) => [
              styles.reviewGameButton,
              pressed && styles.toolButtonPressed,
              { backgroundColor: colors.success },
            ]}
          >
            <MaterialIcons name="play-arrow" size={scaleValue(19, controlScale)} color="#FFFFFF" />
            <Text style={styles.reviewGameButtonText}>Play Match</Text>
          </Pressable>
        </View>
      )}

      {(!isDesktopWeb || !!onToggleLessonMode) && (
      <View style={[styles.controlRow, { marginTop: controlRowTopGap, gap: controlRowGap }]}>
        {!isDesktopWeb && (
        <Pressable
          onPress={onShuffle}
          accessibilityRole="button"
          accessibilityLabel="Shuffle flashcards"
          accessibilityState={{ selected: isShuffled }}
          style={({ pressed }) => [
            styles.toolButton,
            !isDesktopWeb && styles.toolButtonMobile,
            pressed && styles.toolButtonPressed,
            {
              backgroundColor: isShuffled ? gameAccentSoft : controlSurfaceBackground,
              borderColor: isShuffled ? gameAccentColor : matchTileBorderNeutral,
              minHeight: controlButtonHeight,
              paddingHorizontal: scaleValue(12, controlScale),
            },
          ]}
        >
          <View
            style={[
              styles.toolIconDisc,
              {
                width: scaleValue(30, controlScale),
                height: scaleValue(30, controlScale),
                backgroundColor: isShuffled ? gameAccentColor : gameAccentSoft,
                borderColor: isShuffled ? gameAccentColor : matchTileBorderNeutral,
              },
            ]}
          >
            <MaterialIcons name="shuffle" size={scaleValue(19, controlScale)} color={isShuffled ? colors.buttonText : gameAccentColor} />
          </View>
          <Text
            style={[styles.toolButtonText, { color: isShuffled ? gameAccentColor : (isDarkMode ? colors.text : '#3e3a2f'), fontSize: scaleValue(14, controlScale) }]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.82}
          >
            Shuffle
          </Text>
          {isShuffled && (
            <View style={[styles.toolButtonMetaPill, { backgroundColor: gameAccentColor, borderColor: gameAccentColor }]}>
              <Text style={[styles.toolButtonMeta, { color: colors.buttonText }]}>On</Text>
            </View>
          )}
        </Pressable>
        )}

        {!isDesktopWeb && (
        <Pressable
          onPress={onToggleDirection}
          accessibilityRole="button"
          accessibilityLabel={`Change flashcard direction, currently ${directionLabel}`}
          style={({ pressed }) => [
            styles.toolButton,
            !isDesktopWeb && styles.toolButtonMobile,
            pressed && styles.toolButtonPressed,
            {
              backgroundColor: controlSurfaceBackground,
              borderColor: matchTileBorderNeutral,
              minHeight: controlButtonHeight,
              paddingHorizontal: scaleValue(12, controlScale),
            },
          ]}
        >
          <View
            style={[
              styles.toolIconDisc,
              {
                width: scaleValue(30, controlScale),
                height: scaleValue(30, controlScale),
                backgroundColor: gameAccentSoft,
                borderColor: matchTileBorderNeutral,
              },
            ]}
          >
            <MaterialIcons name="swap-horiz" size={scaleValue(19, controlScale)} color={gameAccentColor} />
          </View>
          <Text
            style={[styles.toolButtonText, { color: isDarkMode ? colors.text : '#3e3a2f', fontSize: scaleValue(14, controlScale) }]}
            numberOfLines={1}
          >
            {directionLabelMobile}
          </Text>
        </Pressable>
        )}

        {!!onToggleLessonMode && (
          <Pressable
            onPress={onToggleLessonMode}
            accessibilityRole="button"
            accessibilityLabel="Toggle lesson mode"
            accessibilityState={{ selected: lessonModeEnabled }}
            style={({ pressed }) => [
              styles.toolButton,
              !isDesktopWeb && styles.toolButtonMobile,
              pressed && styles.toolButtonPressed,
              {
                backgroundColor: lessonModeEnabled ? gameAccentSoft : controlSurfaceBackground,
                borderColor: lessonModeEnabled ? gameAccentColor : controlSurfaceBorder,
                minHeight: isDesktopWeb ? 46 : scaleValue(40, controlScale),
                paddingHorizontal: scaleValue(16, controlScale),
              },
            ]}
          >
            <View
              style={[
                styles.toolIconDisc,
                {
                  width: scaleValue(30, controlScale),
                  height: scaleValue(30, controlScale),
                  backgroundColor: lessonModeEnabled ? gameAccentColor : gameAccentSoft,
                  borderColor: lessonModeEnabled ? gameAccentColor : controlSurfaceBorder,
                },
              ]}
            >
              <MaterialIcons
                name="school"
                size={scaleValue(19, controlScale)}
                color={lessonModeEnabled ? colors.buttonText : gameAccentColor}
              />
            </View>
            <Text
              style={[
                styles.toolButtonText,
                { color: lessonModeEnabled ? gameAccentColor : colors.text, fontSize: scaleValue(15, controlScale) },
              ]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.82}
            >
              {lessonModeEnabled ? 'Free Practice' : 'Lesson Mode'}
            </Text>
          </Pressable>
        )}

      </View>
      )}

      {lessonModeEnabled && (
        <View
          style={[
            styles.lessonModeFooter,
            styles.controlSurfaceShadow,
            {
              backgroundColor: controlSurfaceBackground,
              borderColor: controlSurfaceBorder,
            },
          ]}
        >
          <Text
            style={[
              styles.lessonProgressText,
              { fontSize: scaleValue(13, controlScale), lineHeight: scaleValue(17, controlScale) },
              { color: colors.secondaryText },
            ]}
          >
            {currentWordReadyToMarkKnown ? `Known ${knownCount} / ${words.length}` : 'Flip the card before marking it known'}
          </Text>
          <View style={styles.lessonButtonsRow}>
            <Pressable
              onPress={onMarkReview}
              style={({ pressed }) => [
                styles.reviewButton,


                {
                  minWidth: scaleValue(132, controlScale),
                  minHeight: scaleValue(42, controlScale),
                  paddingHorizontal: scaleValue(15, controlScale),
                  borderRadius: scaleValue(13, controlScale),
                  gap: scaleValue(7, controlScale),
                },
                pressed && styles.toolButtonPressed,
                { backgroundColor: controlSurfaceAltBackground, borderColor: matchTileBorderNeutral },
              ]}
            >
              <MaterialIcons name="bookmark-border" size={scaleValue(17, controlScale)} color={colors.text} />
              <Text style={[styles.reviewButtonText, { fontSize: scaleValue(13, controlScale) }, { color: colors.text }]}>Review Later</Text>
            </Pressable>
            <Pressable
              onPress={onMarkKnown}
              disabled={isCurrentWordKnown || !currentWordReadyToMarkKnown}
              style={[
                styles.knownButton,
                {
                  minWidth: scaleValue(136, controlScale),
                  minHeight: scaleValue(42, controlScale),
                  paddingHorizontal: scaleValue(15, controlScale),
                  borderRadius: scaleValue(13, controlScale),
                  gap: scaleValue(7, controlScale),
                },
                (isCurrentWordKnown || !currentWordReadyToMarkKnown) && styles.knownButtonDone,
                {
                  backgroundColor: isCurrentWordKnown || !currentWordReadyToMarkKnown ? colors.borderStrong : confirmKnownBg,
                  borderColor: isCurrentWordKnown || !currentWordReadyToMarkKnown ? colors.borderStrong : confirmKnownBorder,
                },
              ]}
            >
              <MaterialIcons
                name={isCurrentWordKnown ? 'check-circle' : 'check'}
                size={scaleValue(17, controlScale)}
                color="#FFFFFF"
              />
              <Text style={[styles.knownButtonText, { fontSize: scaleValue(13, controlScale) }]}>
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
    justifyContent: 'center',
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
    overflow: 'visible',
  },
  swipeCardLayer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    overflow: 'visible',
    width: '100%',
  },
  cardGestureTarget: {
    width: '100%',
    height: '100%',
    overflow: 'visible',
  },
  cardShadowFrame: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    position: 'relative',
    overflow: 'visible',
  },
  cardShadowShell: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    position: 'relative',
    overflow: 'visible',
  },
  flipCard: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    overflow: 'visible',
    position: 'relative',
  },
  card: {
    width: '100%',
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.6,
  },
  cardContent: {
    width: '100%',
    height: '100%',
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  cardInnerHighlight: {
    ...StyleSheet.absoluteFill,
    borderRadius: 20,
    borderWidth: 1,
  },
  cardText: {
    width: '100%',
    fontSize: 36,
    fontWeight: '700',
    textAlign: 'center',
    color: '#333',
    marginVertical: 0,
    includeFontPadding: true,
  },
  tapHintText: {
    position: 'absolute',
    bottom: 18,
    color: '#999288',
    fontSize: 11,
    fontStyle: 'italic',
    fontWeight: '500',
  },
  speechButton: {
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1.5,
    bottom: 16,
    height: 36,
    justifyContent: 'center',
    position: 'absolute',
    right: 20,
    boxShadow: '0px 2px 4px rgba(0,0,0,0.08)',
    width: 36,
    zIndex: 8,
  },
  speechButtonPressed: {
    opacity: 0.86,
    transform: [{ scale: 0.96 }],
  },
  badge: {
    position: 'absolute',
    top: 16,
    right: 16,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1.5,
    zIndex: 999,
  },
  statusBadgeStack: {
    position: 'absolute',
    top: 16,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    zIndex: 999,
  },
  statusBadgeText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  sourceLessonBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    maxWidth: '58%',
    minHeight: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    zIndex: 999,
  },
  sourceLessonBadgeText: {
    flexShrink: 1,
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '800',
  },
  badgeText: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700',
    letterSpacing: 0.4,
    color: '#333',
  },
  navigationContainer: {
    width: '100%',
    maxWidth: 440,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlSurfaceShadow: {
    boxShadow: '0px 1px 3px rgba(0,0,0,0.06)',
  },
  navButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.4,
    boxShadow: '0px 1px 3px rgba(0,0,0,0.06)',
  },
  navButtonPressed: {
    opacity: 0.86,
    transform: [{ scale: 0.98 }],
  },
  navButtonDisabled: {
    opacity: 0.42,
    boxShadow: 'none',
  },
  knowledgeNavButton: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    borderWidth: 1.5,
    gap: 6,
    paddingHorizontal: 7,
  },
  knowledgeIconDisc: {
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1.4,
    height: 30,
    justifyContent: 'center',
    width: 30,
  },
  knowledgeNavLabel: {
    flexShrink: 1,
    fontSize: 11,
    lineHeight: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  knowledgeNavButtonSelected: {
    boxShadow: '0px 1px 5px rgba(0,0,0,0.11)',
  },
  deckCounterPill: {
    minWidth: 104,
    minHeight: 34,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deckCounterPillProgress: {
    minWidth: 112,
    minHeight: 46,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  deckCounterText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  controlRow: {
    width: '86%',
    maxWidth: 440,
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 16,
  },
  toolButton: {
    minWidth: 104,
    borderRadius: 999,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },




  toolButtonMobile: {
    flex: 1,
    minWidth: 0,
  },
  toolButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  toolButtonText: {
    fontSize: 13.5,
    fontWeight: '700',
    // RN defaults flexShrink to 0 (unlike web CSS), so without this a long label like
    // "English → French" overflows the pill on native instead of ellipsizing.
    flexShrink: 1,
    minWidth: 0,
  },
  toolIconDisc: {
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1.4,
    height: 25,
    justifyContent: 'center',
    width: 25,
  },
  toolButtonMetaPill: {
    alignItems: 'center',
    borderRadius: 7,
    borderWidth: 1.4,
    justifyContent: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  toolButtonMeta: {
    fontSize: 9,
    lineHeight: 11,
    fontWeight: '700',
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
    minHeight: 46,
    borderRadius: 18,
    borderWidth: 1.4,
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
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
    fontWeight: '700',
  },
  reviewGameButton: {
    minHeight: 34,
    paddingHorizontal: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  reviewGameButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  lessonModeFooter: {
    width: '100%',
    maxWidth: 440,
    alignItems: 'center',
    marginTop: 14,
    gap: 10,
    borderRadius: 18,
    borderWidth: 1.4,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  lessonButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    justifyContent: 'center',
  },
  lessonProgressText: {
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '700',
    textAlign: 'center',
  },
  reviewButton: {
    minWidth: 132,
    minHeight: 42,
    paddingHorizontal: 15,
    borderRadius: 13,
    backgroundColor: '#EEF3F8',
    borderWidth: 1.4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  reviewButtonText: {
    color: '#44505C',
    fontSize: 13,
    fontWeight: '700',
  },
  knownButton: {
    minWidth: 136,
    minHeight: 42,
    paddingHorizontal: 15,
    borderRadius: 13,
    backgroundColor: '#58CC02',
    borderWidth: 1.4,
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
    fontSize: 13,
    fontWeight: '700',
  },
});
