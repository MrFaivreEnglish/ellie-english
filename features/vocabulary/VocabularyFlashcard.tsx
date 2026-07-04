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

// Lazy-load so the app doesn't crash if the native module isn't compiled in the build yet.
// Once the development build includes expo-speech, this can become a normal import.
const Speech = (() => {
  try { return require('expo-speech') as typeof import('expo-speech'); } catch { return null; }
})();

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
  const knowledgeActionWidth = scaleValue(isCompact ? 84 : 90, controlScale);
  const knowledgeActionHeight = scaleValue(isCompact ? 48 : 52, controlScale);
  const navigationTopGap = isCompact ? 38 : scaleValue(44, controlScale);
  const navigationGap = hasKnowledgeActions
    ? scaleValue(isCompact ? 8 : 10, controlScale)
    : scaleValue(14, controlScale);
  const controlRowTopGap = isCompact ? 22 : scaleValue(26, controlScale);
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
  const knowledgeButtonRadius = scaleValue(14, controlScale);
  const navButtonRadius = scaleValue(15, controlScale);
  const gameAccentColor = colors.primary ?? '#1671B6';
  const gameAccentSoft = colors.primarySoft;
  const gameAccentSofter = colors.surface;
  const gameAccentBorder = colors.borderStrong;
  const controlSurfaceBackground = isDarkMode ? colors.surface : '#FFFFFF';
  const controlSurfaceAltBackground = gameAccentSofter;
  const controlSurfaceBorder = gameAccentBorder;
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
  const currentSourceLessonTitle =
    typeof currentWord?.sourceLesson?.title === 'string'
      ? currentWord.sourceLesson.title.trim()
      : '';
  const canGoPrevious = hasWords && safeIndex > 0;
  const canGoNext = hasWords && safeIndex < words.length - 1;
  const swipeExitDistance = windowWidth * 1.15;
  const frontIsEnglish = !reverseDirection;
  const englishSideBackground = isDarkMode ? colors.surface : (colors.card ?? '#FFFFFF');
  const englishSideBorder = gameAccentBorder;
  const frenchSideBackground = isDarkMode ? (colors.buttonBackground ?? gameAccentColor) : gameAccentColor;
  const frenchSideBorder = isDarkMode ? colors.borderStrong : gameAccentColor;
  const cardShadowColor = '#000000';
  const cardShadowOpacity = isDarkMode ? 0.34 : 0.18;
  const physicalCardBorderColor = isDarkMode ? 'rgba(255,255,255,0.16)' : '#CDE6F6';
  const englishCardInnerBorderColor = isDarkMode ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.82)';
  const colorCardInnerBorderColor = 'rgba(255,255,255,0.24)';
  const cardFaceShadowStyle = {
    shadowColor: cardShadowColor,
    shadowOpacity: cardShadowOpacity,
    ...(Platform.OS === 'web'
      ? {
          boxShadow: isDarkMode
            ? '0px 16px 24px rgba(0, 0, 0, 0.36), 0px 2px 7px rgba(0, 0, 0, 0.22)'
            : '0px 14px 20px rgba(0, 0, 0, 0.20), 0px 2px 7px rgba(0, 0, 0, 0.13)',
        }
      : null),
  } as const;

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

  const [isSpeakingEnglish, setIsSpeakingEnglish] = React.useState(false);
  const [preferredEnglishVoice, setPreferredEnglishVoice] = React.useState<string | undefined>(undefined);

  React.useEffect(() => {
    let mounted = true;

    const scoreVoice = (voice: import('expo-speech').Voice) => {
      const language = voice.language?.toLowerCase() ?? '';
      if (!language.startsWith('en')) return -1;

      const name = `${voice.name ?? ''} ${voice.identifier ?? ''}`.toLowerCase();
      let score = 20;

      if (language === 'en-gb' || language.startsWith('en-gb-')) score += 90;
      if (language === 'en-ie' || language === 'en-au' || language === 'en-nz') score += 28;
      if (language === 'en-us') score += 4;
      if (language.startsWith('en-')) score += 8;
      if (voice.quality === Speech?.VoiceQuality?.Enhanced) score += 22;
      if (/british|united kingdom|\buk\b|serena|daniel|martha|susan/.test(name)) score += 18;
      if (/natural|neural|premium|enhanced|siri|samantha|karen|moira/.test(name)) score += 12;
      if (/compact|novelty|whisper|bells|boing|cellos|organ|trinoids|zarvox/.test(name)) score -= 16;

      return score;
    };

    Speech?.getAvailableVoicesAsync()
      .then((voices) => {
        if (!mounted) return;

        const bestVoice = voices
          .map((voice) => ({ voice, score: scoreVoice(voice) }))
          .filter(({ score }) => score >= 0)
          .sort((a, b) => b.score - a.score)[0]?.voice;

        setPreferredEnglishVoice(bestVoice?.identifier);
      })
      .catch(() => {
        if (mounted) setPreferredEnglishVoice(undefined);
      });

    return () => {
      mounted = false;
    };
  }, []);

  React.useEffect(() => {
    Speech?.stop();
    setIsSpeakingEnglish(false);
  }, [currentWord?.english]);

  React.useEffect(() => () => {
    Speech?.stop();
  }, []);

  const speakEnglishWord = React.useCallback(() => {
    const text = currentWord?.english?.trim();
    if (!text) return;

    Speech?.stop();
    setIsSpeakingEnglish(true);
    Speech?.speak(text, {
      language: 'en-GB',
      voice: preferredEnglishVoice,
      rate: 0.82,
      pitch: 1.02,
      onDone: () => setIsSpeakingEnglish(false),
      onStopped: () => setIsSpeakingEnglish(false),
      onError: () => setIsSpeakingEnglish(false),
    });
  }, [currentWord?.english, preferredEnglishVoice]);

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
  const englishSideVisible = isFlipped ? !frontIsEnglish : frontIsEnglish;
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

    const badgeColor = waitingToChoose ? gameAccentColor : statusKnown ? iKnowColor : notYetColor;
    const badgeBackgroundColor = waitingToChoose
      ? gameAccentSoft
      : statusKnown
      ? (colors.successSoft ?? (isDarkMode ? '#123E36' : '#E7F8E8'))
      : (colors.warningSoft ?? (isDarkMode ? '#493912' : '#FFF4D8'));
    const badgeTextColor = waitingToChoose
      ? gameAccentColor
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
            size={14}
            color={badgeColor}
          />
          <Text style={[styles.statusBadgeText, { color: badgeTextColor }]}>
            {badgeLabel}
          </Text>
        </View>
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
        <MaterialIcons name="auto-stories" size={12} color={appearance.badgeTextColor} />
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

            {/* CARD STACK CONTAINER */}
            <View
              style={styles.cardShadowFrame}
            >
              <View
                style={styles.cardShadowShell}
              >
                <View style={styles.flipCard}>

              {/* FRONT */}
                <Animated.View style={[
                  styles.card,
                  styles.cardPhysicalShadow,
                  frontStyle,
                  cardFaceShadowStyle,
                  {
                    backgroundColor: frontAppearance.backgroundColor,
                    borderColor: physicalCardBorderColor,
                  },
                ] as any}>
                  <View style={[styles.cardContent, { padding: contentPadding }]}>
                    <View
                      pointerEvents="none"
                      style={[
                        styles.cardInnerHighlight,
                        { borderColor: frontIsEnglish ? englishCardInnerBorderColor : colorCardInnerBorderColor },
                      ]}
                    />
                    {renderStatusBadges()}
                    {renderSourceLessonBadge(frontAppearance)}

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

                    {!currentSourceLessonTitle ? (
                      <Text style={[styles.tapHintText, { color: frontAppearance.tapHintColor }]}>
                        {tapHint}
                      </Text>
                    ) : null}

                  </View>
                </Animated.View>

                {/* BACK */}
                <Animated.View style={[
                  styles.card,
                  styles.cardPhysicalShadow,
                  backStyle,
                  cardFaceShadowStyle,
                  {
                    backgroundColor: backAppearance.backgroundColor,
                    borderColor: physicalCardBorderColor,
                  },
                ] as any}>
                  <View style={[styles.cardContent, { padding: contentPadding }]}>
                    <View
                      pointerEvents="none"
                      style={[
                        styles.cardInnerHighlight,
                        { borderColor: frontIsEnglish ? colorCardInnerBorderColor : englishCardInnerBorderColor },
                      ]}
                    />
                    {renderStatusBadges()}
                    {renderSourceLessonBadge(backAppearance)}

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

                    {!currentSourceLessonTitle ? (
                      <Text style={[styles.tapHintText, { color: backAppearance.tapHintColor }]}>
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
                  backgroundColor: isSpeakingEnglish ? gameAccentColor : controlSurfaceBackground,
                  borderColor: isSpeakingEnglish ? gameAccentColor : controlSurfaceBorder,
                },
              ]}
            >
              <MaterialIcons
                name="volume-up"
                size={18}
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
                  backgroundColor: notYetSelected
                    ? (colors.warningSoft ?? (isDarkMode ? '#493912' : '#FFF4D8'))
                    : controlSurfaceBackground,
                  borderColor: notYetSelected ? notYetColor : controlSurfaceBorder,
                },
              ]}
            >
              <View
                style={[
                  styles.knowledgeIconDisc,
                  {
                    backgroundColor: notYetSelected
                      ? notYetColor
                      : (colors.warningSoft ?? (isDarkMode ? '#493912' : '#FFF4D8')),
                    borderColor: knowledgeActionDisabled ? colors.border : notYetColor,
                  },
                ]}
              >
                <MaterialIcons
                  name="close"
                  size={scaleValue(16, controlScale)}
                  color={knowledgeActionDisabled ? disabledChoiceColor : notYetSelected ? colors.buttonText : notYetColor}
                />
              </View>
              <Text
                style={[
                  styles.knowledgeNavLabel,
                  { color: knowledgeActionDisabled ? disabledChoiceColor : notYetSelected ? '#7A4F00' : notYetColor },
                ]}
                numberOfLines={1}
              >
                Again
              </Text>
            </Pressable>

            <View
              style={[
                styles.deckCounterPill,
                styles.deckCounterPillProgress,
                styles.controlSurfaceShadow,
                { backgroundColor: controlSurfaceAltBackground, borderColor: controlSurfaceBorder },
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
                styles.controlSurfaceShadow,
                iKnowSelected && styles.knowledgeNavButtonSelected,
                knowledgeActionDisabled && styles.navButtonDisabled,
                pressed && !knowledgeActionDisabled && styles.navButtonPressed,
                {
                  width: knowledgeActionWidth,
                  height: knowledgeActionHeight,
                  borderRadius: knowledgeButtonRadius,
                  backgroundColor: iKnowSelected
                    ? (colors.successSoft ?? (isDarkMode ? '#123E36' : '#E7F8E8'))
                    : controlSurfaceBackground,
                  borderColor: iKnowSelected ? iKnowColor : controlSurfaceBorder,
                },
              ]}
            >
              <View
                style={[
                  styles.knowledgeIconDisc,
                  {
                    backgroundColor: iKnowSelected
                      ? iKnowColor
                      : (colors.successSoft ?? (isDarkMode ? '#123E36' : '#E7F8E8')),
                    borderColor: knowledgeActionDisabled ? colors.border : iKnowColor,
                  },
                ]}
              >
                <MaterialIcons
                  name="check"
                  size={scaleValue(17, controlScale)}
                  color={knowledgeActionDisabled ? disabledChoiceColor : iKnowSelected ? colors.buttonText : iKnowColor}
                />
              </View>
              <Text
                style={[
                  styles.knowledgeNavLabel,
                  { color: knowledgeActionDisabled ? disabledChoiceColor : iKnowSelected ? colors.successText : iKnowColor },
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
                  borderRadius: navButtonRadius,
                  backgroundColor: controlSurfaceBackground,
                  borderColor: controlSurfaceBorder,
                },
              ]}
            >
              <MaterialIcons name="chevron-left" size={scaleValue(29, controlScale)} color={canGoPrevious ? gameAccentColor : colors.secondaryText} />
            </Pressable>

            <View style={[styles.deckCounterPill, styles.controlSurfaceShadow, { backgroundColor: controlSurfaceAltBackground, borderColor: controlSurfaceBorder }]}>
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
                  borderRadius: navButtonRadius,
                  backgroundColor: controlSurfaceBackground,
                  borderColor: controlSurfaceBorder,
                },
              ]}
            >
              <MaterialIcons name="chevron-right" size={scaleValue(29, controlScale)} color={canGoNext ? gameAccentColor : colors.secondaryText} />
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
            <MaterialIcons name="emoji-events" size={17} color={colors.success ?? '#58CC02'} />
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
              backgroundColor: isShuffled ? gameAccentSoft : controlSurfaceBackground,
              borderColor: isShuffled ? gameAccentColor : controlSurfaceBorder,
              minHeight: scaleValue(40, controlScale),
              paddingHorizontal: scaleValue(11, controlScale),
            },
          ]}
        >
          <View
            style={[
              styles.toolIconDisc,
              {
                backgroundColor: isShuffled ? gameAccentColor : gameAccentSoft,
                borderColor: isShuffled ? gameAccentColor : controlSurfaceBorder,
              },
            ]}
          >
            <MaterialIcons name="shuffle" size={scaleValue(16, controlScale)} color={isShuffled ? colors.buttonText : gameAccentColor} />
          </View>
          <Text
            style={[styles.toolButtonText, { color: isShuffled ? gameAccentColor : colors.text, fontSize: scaleValue(13, controlScale) }]}
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

        <Pressable
          onPress={onToggleDirection}
          accessibilityRole="button"
          accessibilityLabel="Change flashcard direction"
          style={({ pressed }) => [
            styles.toolButton,
            pressed && styles.toolButtonPressed,
            {
              backgroundColor: controlSurfaceBackground,
              borderColor: controlSurfaceBorder,
              minHeight: scaleValue(40, controlScale),
              paddingHorizontal: scaleValue(11, controlScale),
            },
          ]}
        >
          <View style={[styles.toolIconDisc, { backgroundColor: gameAccentSoft, borderColor: controlSurfaceBorder }]}>
            <MaterialIcons name="swap-horiz" size={scaleValue(16, controlScale)} color={gameAccentColor} />
          </View>
          <Text
            style={[styles.toolButtonText, { color: colors.text, fontSize: scaleValue(13, controlScale) }]}
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
                backgroundColor: lessonModeEnabled ? gameAccentSoft : controlSurfaceBackground,
                borderColor: lessonModeEnabled ? gameAccentColor : controlSurfaceBorder,
                minHeight: scaleValue(40, controlScale),
                paddingHorizontal: scaleValue(11, controlScale),
              },
            ]}
          >
            <View
              style={[
                styles.toolIconDisc,
                {
                  backgroundColor: lessonModeEnabled ? gameAccentColor : gameAccentSoft,
                  borderColor: lessonModeEnabled ? gameAccentColor : controlSurfaceBorder,
                },
              ]}
            >
              <MaterialIcons
                name="school"
                size={16}
                color={lessonModeEnabled ? colors.buttonText : gameAccentColor}
              />
            </View>
            <Text
              style={[
                styles.toolButtonText,
                { color: lessonModeEnabled ? gameAccentColor : colors.text, fontSize: scaleValue(13, controlScale) },
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
          <Text style={[styles.lessonProgressText, { color: colors.secondaryText }]}>
            {currentWordReadyToMarkKnown ? `Known ${knownCount} / ${words.length}` : 'Flip the card before marking it known'}
          </Text>
          <View style={styles.lessonButtonsRow}>
            <Pressable
              onPress={onMarkReview}
              style={({ pressed }) => [
                styles.reviewButton,
                pressed && styles.toolButtonPressed,
                { backgroundColor: controlSurfaceAltBackground, borderColor: controlSurfaceBorder },
              ]}
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
                {
                  backgroundColor: isCurrentWordKnown || !currentWordReadyToMarkKnown ? colors.borderStrong : colors.success,
                  borderColor: isCurrentWordKnown || !currentWordReadyToMarkKnown ? colors.borderStrong : colors.success,
                },
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
  cardPhysicalShadow: {
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 12,
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
    ...StyleSheet.absoluteFillObject,
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
    bottom: 14,
    color: 'rgba(151, 151, 151, 1)',
    fontSize: 12,
    fontStyle: 'italic',
    fontWeight: '500',
  },
  speechButton: {
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1.4,
    bottom: 12,
    height: 34,
    justifyContent: 'center',
    position: 'absolute',
    right: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
    width: 34,
    zIndex: 8,
  },
  speechButtonPressed: {
    opacity: 0.86,
    transform: [{ scale: 0.96 }],
  },
  badge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    zIndex: 999,
  },
  statusBadgeStack: {
    position: 'absolute',
    top: 12,
    left: 12,
    gap: 4,
    zIndex: 999,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2F8F2F',
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
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '700',
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  navButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
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
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  knowledgeNavLabel: {
    flexShrink: 1,
    fontSize: 11,
    lineHeight: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  knowledgeNavButtonSelected: {
    shadowOpacity: 0.11,
    shadowRadius: 5,
    elevation: 3,
  },
  deckCounterPill: {
    minWidth: 104,
    minHeight: 34,
    paddingHorizontal: 12,
    borderRadius: 13,
    borderWidth: 1.4,
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
  deckCounterMetaText: {
    marginTop: 1,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700',
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
    minWidth: 112,
    borderRadius: 12,
    borderWidth: 1.4,
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
    fontSize: 13,
    fontWeight: '700',
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
