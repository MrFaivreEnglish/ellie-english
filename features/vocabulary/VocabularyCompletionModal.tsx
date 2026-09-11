import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Modal,
  Platform,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { useAudioPlayer } from 'expo-audio';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Assets from '../../assets/index';
import type { GameState, Word } from '../../types/VocabularyTypes';
import LevelUpModal from '../progress/LevelUpModal';
import SessionResultCard, {
  SessionResultActions,
  SessionResultStats,
  type SessionResultStat,
} from '../progress/SessionResultCard';
import { getXP } from '../progress/xpStorage';
import { getXPLevel, getXPLevelStats } from '../progress/xpLevels';
import type { ThemeColors } from '../settings/ThemeContext';
import { freshFontFamily } from '../shared/freshDirection';
import { SOUND_EFFECT_OPTIONS, replaySoundEffect } from '../shared/soundEffects';
import Text from '../shared/ThemedText';
import { DesktopTypographyProvider } from '../shared/DesktopTypography';
import { getDesktopTypographyScale, getSheetDensity, isDesktopWebWidth } from '../shared/responsiveLayout';
import useReducedMotion from '../shared/useReducedMotion';

export type SessionResultBanner = {
  kind: 'unlock' | 'record';
  emoji: string;
  label: string;
  message: string;
  kicker?: string;
};

interface CompletionModalProps {
  visible: boolean;
  gameState?: GameState;
  timerMode: boolean;
  wordsLength: number;
  isDarkMode: boolean;
  onReplay: (activateTimerMode?: boolean) => void;
  isFirstCompletion: boolean;
  timerModeUnlocked?: boolean;
  timerModeAvailable?: boolean;
  isPersonalBest: boolean;
  startedTimerMode: boolean;
  bestTimeForActiveCategory?: number | null;
  matchingSessionXp?: number;
  bonusXp?: number;
  // Claiming is what actually banks the session's XP. The screen supplies the
  // persistence call; nothing is written until the student presses Claim.
  onClaimXP?: () => Promise<unknown> | void;
  colors: ThemeColors;
  primaryActionLabel?: string;
  onPrimaryAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  reviewWords?: Word[];
  onReviewWords?: () => void;
  onGoToAccount?: () => void;
  title?: string;
  subtitle?: string;
  image?: any;
  isPerfect?: boolean;
  banner?: SessionResultBanner | null;
  statsItems?: Array<{ emoji: string; value: string | number; label: string }>;
  sectionLabel?: string;
}

const normalizeXP = (value: number) => (Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0);

export default function VocabularyCompletionModal({
  visible,
  timerMode,
  wordsLength,
  isDarkMode,
  onReplay,
  isFirstCompletion,
  timerModeUnlocked: timerModeUnlockedProp,
  timerModeAvailable: timerModeAvailableProp,
  isPersonalBest,
  colors,
  startedTimerMode,
  matchingSessionXp = 0,
  bonusXp = 0,
  onClaimXP,
  primaryActionLabel,
  onPrimaryAction,
  onSecondaryAction,
  onGoToAccount,
  title,
  subtitle,
  image,
  isPerfect,
  banner,
  statsItems,
  sectionLabel = 'Vocabulary',
}: CompletionModalProps) {
  const bigSuccessPlayer = useAudioPlayer(Assets.bigsuccess, SOUND_EFFECT_OPTIONS);
  const bestSuccessPlayer = useAudioPlayer(Assets.bestsuccess, SOUND_EFFECT_OPTIONS);
  const claimPlayer = useAudioPlayer(Assets.success, SOUND_EFFECT_OPTIONS);
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const animationsEnabled = !reducedMotion;
  const { width: viewportWidth, height: viewportHeight } = useWindowDimensions();
  const desktopScale = getDesktopTypographyScale(viewportWidth, viewportHeight, 'fit');
  const { dense: denseLayout, veryShort: veryDenseLayout } = getSheetDensity(viewportWidth, viewportHeight, desktopScale);

  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const firstCardAnim = useRef(new Animated.Value(0)).current;
  const unlockCardAnim = useRef(new Animated.Value(0)).current;
  const xpCardAnim = useRef(new Animated.Value(0)).current;
  const actionAnim = useRef(new Animated.Value(0)).current;
  const barFillAnim = useRef(new Animated.Value(0)).current;
  const revealTimersRef = useRef<Array<ReturnType<typeof setTimeout>>>([]);
  const pendingActionRef = useRef<(() => void) | null>(null);
  const flowActiveRef = useRef(visible);
  const claimStartedRef = useRef(false);
  const hasPlayedOpenSoundRef = useRef(false);

  const [revealStage, setRevealStage] = useState(0);
  const [currentXP, setCurrentXP] = useState(0);
  const [xpReady, setXpReady] = useState(false);
  const [xpClaimed, setXpClaimed] = useState(false);
  const [claimingXP, setClaimingXP] = useState(false);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [flowFinished, setFlowFinished] = useState(false);
  const [displayedPersonalBest, setDisplayedPersonalBest] = useState(isPersonalBest);

  const timerModeUnlocked = timerModeUnlockedProp
    ?? (!timerMode && !startedTimerMode && isFirstCompletion);


  const timerModeAvailable = timerModeAvailableProp ?? timerModeUnlocked;
  const earnedThisSessionXP = normalizeXP(matchingSessionXp);
  // XP is banked on claim, so the stored total read on open is the pre-session one —
  // the post-session total is that plus what's about to be claimed.
  const previousXPBeforeSession = currentXP;
  const totalAfterSessionXP = currentXP + earnedThisSessionXP;
  const previousStats = React.useMemo(() => getXPLevelStats(previousXPBeforeSession), [previousXPBeforeSession]);
  const currentStats = React.useMemo(() => getXPLevelStats(totalAfterSessionXP), [totalAfterSessionXP]);
  const didLevelUpThisSession = earnedThisSessionXP > 0
    && getXPLevel(previousXPBeforeSession) < getXPLevel(totalAfterSessionXP);
  const barFromPercent = previousStats.progressPercent;
  const barToPercent = didLevelUpThisSession ? 100 : currentStats.progressPercent;
  const barFromXP = previousStats.progressXP;
  const barToXP = didLevelUpThisSession ? previousStats.neededXP : currentStats.progressXP;
  const barNeededXP = didLevelUpThisSession ? previousStats.neededXP : currentStats.neededXP;
  const displayedCurrentLevel = didLevelUpThisSession ? previousStats.level : currentStats.level;
  const displayedNextLevel = displayedCurrentLevel + 1;
  const [displayedBarXP, setDisplayedBarXP] = useState(barFromXP);




  useEffect(() => {
    setDisplayedBarXP(barFromXP);
    const listenerId = barFillAnim.addListener(({ value }) => {
      const progress = Math.max(0, Math.min(1, value));
      const nextXP = Math.round(barFromXP + (barToXP - barFromXP) * progress);
      setDisplayedBarXP((current) => current === nextXP ? current : nextXP);
    });

    return () => barFillAnim.removeListener(listenerId);
  }, [barFillAnim, barFromXP, barToXP]);

  const resultBanner: SessionResultBanner | null = banner !== undefined
    ? banner
    : (timerModeUnlocked
      ? {
          kind: 'unlock',
          emoji: '🏅',
          label: 'Timer Mode',
          message: 'Race the clock on this lesson for bonus XP.',
        }
      : null);

  const unlockBanner = resultBanner?.kind === 'unlock' ? resultBanner : null;
  const recordBanner = resultBanner?.kind === 'record' ? resultBanner : null;
  const hasUnlockCard = !!unlockBanner;
  const xpRevealStage = hasUnlockCard ? 3 : 2;
  const actionRevealStage = hasUnlockCard ? 4 : 3;
  const continueButtonLabel = primaryActionLabel
    ?? (timerMode && displayedPersonalBest
      ? 'Beat your time!'
      : !timerMode && timerModeAvailable
        ? 'Try Timer Mode!'
        : 'Try Again');

  const defaultTitle = displayedPersonalBest ? 'New Best Time!' : 'Great job!';
  const defaultSubtitle = displayedPersonalBest
    ? 'Your fastest time yet.'
    : `You completed all ${wordsLength} items. Nice work!`;
  const firstCardTitle = recordBanner?.label ?? title ?? defaultTitle;
  const firstCardSubtitle = recordBanner?.message ?? subtitle ?? defaultSubtitle;
  const firstCardEyebrow = recordBanner?.kicker
    ?? (displayedPersonalBest
      ? 'New record'
      : isPerfect
        ? 'Perfect session'
        : 'You did it!');
  const firstCardTone = recordBanner
    ? (isPerfect ? 'perfect' : 'celebration')
    : isPerfect
      ? 'perfect'
      : 'success';

  // Only the first 2 non-XP stats are shown to keep this row compact — but the perfect-run
  // bonus indicator (when present) always gets one of those 2 slots instead of being pushed
  // out by whichever other stats happen to come first in the caller's array.
  // Memoised so the array keeps a stable identity across the many re-renders this screen
  // does while the XP counter runs — a fresh array each time restarted the stats reveal.
  const supportingStats: SessionResultStat[] = React.useMemo(() => {
    const nonXpStats = (statsItems ?? []).filter((item) => !/xp/i.test(item.label));
    const perfectBonusStat = nonXpStats.find((item) => item.label === 'Perfect bonus');
    return perfectBonusStat
      ? [...nonXpStats.filter((item) => item.label !== 'Perfect bonus').slice(0, 1), perfectBonusStat]
      : nonXpStats.slice(0, 2);
  }, [statsItems]);

  const clearRevealTimers = () => {
    revealTimersRef.current.forEach(clearTimeout);
    revealTimersRef.current = [];
  };

  const resetFlow = () => {
    flowActiveRef.current = false;
    clearRevealTimers();
    barFillAnim.stopAnimation();
    setRevealStage(0);
    setXpReady(false);
    setXpClaimed(false);
    setClaimingXP(false);
    setShowLevelUp(false);
    setFlowFinished(false);
    claimStartedRef.current = false;
    pendingActionRef.current = null;
  };

  useEffect(() => {
    if (visible) {
      flowActiveRef.current = true;
    } else {
      resetFlow();
    }
    return () => {
      clearRevealTimers();
      barFillAnim.stopAnimation();
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  useEffect(() => {
    if (visible) setDisplayedPersonalBest(isPersonalBest);
  }, [isPersonalBest, visible]);

  useEffect(() => {
    if (!visible) return;
    let active = true;
    getXP().then((xp) => {
      if (!active) return;
      setCurrentXP(xp);
      setXpReady(true);
    }).catch(() => {
      if (active) setXpReady(true);
    });
    return () => { active = false; };
  }, [matchingSessionXp, visible]);

  useEffect(() => {
    if (!visible || !xpReady) return;

    clearRevealTimers();
    setRevealStage(1);
    setXpClaimed(false);
    setClaimingXP(false);
    backdropOpacity.setValue(animationsEnabled ? 0 : 1);
    firstCardAnim.setValue(animationsEnabled ? 0 : 1);
    unlockCardAnim.setValue(animationsEnabled ? 0 : 1);
    xpCardAnim.setValue(animationsEnabled ? 0 : 1);
    actionAnim.setValue(animationsEnabled ? 0 : 1);
    barFillAnim.setValue(0);

    if (!animationsEnabled) {
      setRevealStage(actionRevealStage);
      return;
    }

    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: 460,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.spring(firstCardAnim, {
        toValue: 1,
        friction: 10,
        tension: 60,
        delay: 100,
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]).start();

    if (hasUnlockCard) {
      revealTimersRef.current.push(setTimeout(() => {
        setRevealStage(2);
        Animated.spring(unlockCardAnim, {
          toValue: 1,
          friction: 10,
          tension: 60,
          useNativeDriver: Platform.OS !== 'web',
        }).start();
      }, 480));
    }

    revealTimersRef.current.push(setTimeout(() => {
      setRevealStage(xpRevealStage);
      Animated.spring(xpCardAnim, {
        toValue: 1,
        friction: 10,
        tension: 60,
        useNativeDriver: Platform.OS !== 'web',
      }).start();
    }, hasUnlockCard ? 940 : 520));

    revealTimersRef.current.push(setTimeout(() => {
      setRevealStage(actionRevealStage);
      Animated.spring(actionAnim, {
        toValue: 1,
        friction: 10,
        tension: 62,
        useNativeDriver: Platform.OS !== 'web',
      }).start();
    }, hasUnlockCard ? 1420 : 1020));

    return clearRevealTimers;
  }, [
    actionAnim,
    actionRevealStage,
    animationsEnabled,
    backdropOpacity,
    barFillAnim,
    firstCardAnim,
    hasUnlockCard,
    unlockCardAnim,
    visible,
    xpCardAnim,
    xpRevealStage,
    xpReady,
  ]);

  useEffect(() => {
    if (!visible) {
      hasPlayedOpenSoundRef.current = false;
      return;
    }
    if (!xpReady || showLevelUp || hasPlayedOpenSoundRef.current) return;
    hasPlayedOpenSoundRef.current = true;
    replaySoundEffect((timerMode && displayedPersonalBest) || isPerfect ? bestSuccessPlayer : bigSuccessPlayer);
  }, [
    bestSuccessPlayer,
    bigSuccessPlayer,
    displayedPersonalBest,
    isPerfect,
    showLevelUp,
    timerMode,
    visible,
    xpReady,
  ]);

  const revealStyle = (animation: Animated.Value, distance = 12) => ({
    opacity: animation,
    transform: [
      {
        translateY: animation.interpolate({
          inputRange: [0, 1],
          outputRange: [distance, 0],
        }),
      },
      {
        scale: animation.interpolate({
          inputRange: [0, 1],
          outputRange: [0.97, 1],
        }),
      },
    ],
  });

  const defaultContinueAction = () => {
    if (onPrimaryAction) {
      onPrimaryAction();
      return;
    }
    onReplay(timerMode || timerModeAvailable);
  };

  const revealPostClaimAction = () => {
    setClaimingXP(false);
    setXpClaimed(true);
    if (!animationsEnabled) {
      actionAnim.setValue(1);
      return;
    }
    actionAnim.setValue(0);
    Animated.spring(actionAnim, {
      toValue: 1,
      friction: 10,
      tension: 62,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  };

  const finishXPClaim = () => {
    if (!flowActiveRef.current) return;

    if (!didLevelUpThisSession) {
      revealPostClaimAction();
      return;
    }

    setClaimingXP(false);
    setXpClaimed(true);
    pendingActionRef.current = defaultContinueAction;
    setShowLevelUp(true);
  };

  const handleClaimXP = () => {
    if (!flowActiveRef.current || claimStartedRef.current || claimingXP || xpClaimed) return;
    claimStartedRef.current = true;
    setClaimingXP(true);
    replaySoundEffect(claimPlayer);

    // This is the moment the session's XP is actually banked — the bar animation below
    // is just the visual for it, so kick off the write here rather than waiting on it.
    void Promise.resolve(onClaimXP?.()).catch(() => {});

    if (!animationsEnabled) {
      barFillAnim.setValue(1);
      finishXPClaim();
      return;
    }

    // Animating width can't use the native driver, so this single value drives both the
    // bar and the number that counts with it.
    Animated.timing(barFillAnim, {
      toValue: 1,
      duration: earnedThisSessionXP > 0 ? 1650 : 600,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished && flowActiveRef.current) finishXPClaim();
    });
  };

  const handleLevelUpDismiss = () => {
    flowActiveRef.current = false;
    setFlowFinished(true);
    setShowLevelUp(false);
    const action = pendingActionRef.current;
    pendingActionRef.current = null;
    action?.();
  };

  const handlePostClaimAction = () => {
    if (!flowActiveRef.current) return;
    flowActiveRef.current = false;
    setFlowFinished(true);
    defaultContinueAction();
  };

  // Enter activates the same primary action the "Claim XP"/"Continue" button does —
  // without this, a browser's default Enter behavior on a still-focused exercise
  // input (e.g. Fill/Write's) could fire instead and exit the screen entirely. The
  // exercise's hidden input can still be focused underneath this overlay, so blur it
  // first — otherwise its own onSubmitEditing could react to the same keypress before
  // this listener gets a chance to.
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined' || typeof document === 'undefined') return undefined;
    if (!visible || showLevelUp || flowFinished) return undefined;

    (document.activeElement as HTMLElement | null)?.blur?.();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Enter') return;
      // Mirror the button exactly: it only exists once the reveal reaches its stage,
      // and it's disabled mid-claim. Without these guards Enter could fire the action
      // while the card was still animating in, before the button was even on screen.
      if (revealStage < actionRevealStage || claimingXP) return;
      event.preventDefault();
      if (earnedThisSessionXP === 0 || xpClaimed) {
        handlePostClaimAction();
      } else {
        handleClaimXP();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, showLevelUp, flowFinished, revealStage, actionRevealStage, claimingXP, earnedThisSessionXP, xpClaimed]);

  const handleGoToAccountFromReward = () => {
    flowActiveRef.current = false;
    setFlowFinished(true);
    setShowLevelUp(false);
    pendingActionRef.current = null;








    // Let the nested native modal dismiss before navigation presents another screen.
    setTimeout(() => onGoToAccount?.(), 220);
  };

  const closeEndScreen = () => {
    flowActiveRef.current = false;
    barFillAnim.stopAnimation();
    setFlowFinished(true);
    if (onSecondaryAction) {
      onSecondaryAction();
      return;
    }
    defaultContinueAction();
  };

  const topPad = denseLayout
    ? Platform.OS === 'web' ? 8 * desktopScale : Math.max(insets.top, 8)
    : Platform.OS === 'web' ? 18 * desktopScale : Math.max(insets.top, 20) + 8;
  const bottomPad = denseLayout
    ? Platform.OS === 'web' ? 8 * desktopScale : Math.max(insets.bottom, 6)
    : Platform.OS === 'web' ? 18 * desktopScale : Math.max(insets.bottom, 12) + 4;
  const availableEndCardHeight = Math.max(320, viewportHeight - topPad - bottomPad);







  const isTabletDevice = Platform.OS === 'web'
    ? !isDesktopWebWidth(viewportWidth, undefined, viewportHeight) && Math.min(viewportWidth, viewportHeight) >= 600
    : Math.min(viewportWidth, viewportHeight) >= 600;
  const tabletCardBoost = isTabletDevice ? 1.2 : 1;
  const preferredEndCardHeight = (hasUnlockCard
    ? veryDenseLayout ? 550 : denseLayout ? 600 : 720
    : veryDenseLayout ? 470 : denseLayout ? 525 : 600) * desktopScale * tabletCardBoost;
  const endCardHeight = Math.min(availableEndCardHeight, preferredEndCardHeight);

  return (
    <DesktopTypographyProvider mode="fit">
      <>
      <Modal
        visible={visible && xpReady && !flowFinished}
        transparent
        animationType="none"
        statusBarTranslucent
        presentationStyle="overFullScreen"
        hardwareAccelerated
        onRequestClose={closeEndScreen}
      >
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            styles.backdrop,
            {
              backgroundColor: isDarkMode ? 'rgba(7,15,28,0.54)' : 'rgba(20,20,25,0.55)',
              opacity: backdropOpacity,
            },
          ]}
        >
          {!showLevelUp && (
            <View style={[styles.viewport, { paddingTop: topPad, paddingBottom: bottomPad }]}>
            <View style={[styles.shell, { height: endCardHeight, maxWidth: Math.round(570 * desktopScale) }]}>
              <SessionResultCard
                  colors={colors}
                  isDarkMode={isDarkMode}
                  tone={firstCardTone}
                  eyebrow={firstCardEyebrow}
                  title={firstCardTitle}
                  subtitle={firstCardSubtitle}
                  image={recordBanner ? undefined : image}
                  heroEmoji={recordBanner?.emoji ?? (image ? undefined : isPerfect ? '\u{1F31F}' : '\u2728')}
                  heroVisualStyle={[
                    styles.completionHeroVisual,
                    denseLayout && styles.completionHeroVisualCompact,
                    desktopScale > 1 && {
                      width: Math.round((denseLayout ? 62 : 76) * desktopScale),
                      height: Math.round((denseLayout ? 62 : 76) * desktopScale),
                      borderRadius: Math.round((denseLayout ? 19 : 22) * desktopScale),
                    },
                    {
                      transform: [{
                        scale: firstCardAnim.interpolate({ inputRange: [0, 1], outputRange: [0.72, 1] }),
                      }],
                    },
                  ]}
                  heroContainerStyle={[
                    styles.completionHero,
                    denseLayout && styles.completionHeroCompact,
                    veryDenseLayout && styles.completionHeroVeryCompact,
                    desktopScale > 1 && {
                      minHeight: Math.round((veryDenseLayout ? 108 : denseLayout ? 118 : 150) * desktopScale),
                      paddingVertical: Math.round((veryDenseLayout ? 14 : denseLayout ? 17 : 28) * desktopScale),
                    },
                    revealStyle(firstCardAnim, 10),
                  ]}
                  sectionLabel={sectionLabel}
                  onBack={onSecondaryAction ? closeEndScreen : undefined}
                  fillContainer
                  showHero={revealStage >= 1}
                  showBody={revealStage >= 2}
                  forceDense={denseLayout}
                >
                  {unlockBanner && revealStage >= 2 && (
                    <Animated.View
                      style={[
                        styles.unlockCard,
                        denseLayout && styles.unlockCardCompact,
                        desktopScale > 1 && {
                          minHeight: Math.round((denseLayout ? 82 : 94) * desktopScale),
                          gap: Math.round((denseLayout ? 12 : 15) * desktopScale),
                          borderRadius: Math.round((denseLayout ? 16 : 18) * desktopScale),
                          paddingVertical: Math.round((denseLayout ? 11 : 15) * desktopScale),
                          paddingHorizontal: Math.round((denseLayout ? 13 : 18) * desktopScale),
                        },
                        {
                          backgroundColor: isDarkMode ? '#392B0E' : '#FFF4CE',
                          borderColor: isDarkMode ? '#D49A24' : '#E2A51D',
                        },
                        revealStyle(unlockCardAnim, 14),
                      ]}
                    >
                      <View style={[
                        styles.unlockIcon,
                        desktopScale > 1 && {
                          width: Math.round(52 * desktopScale),
                          height: Math.round(52 * desktopScale),
                          borderRadius: Math.round(17 * desktopScale),
                        },
                        { backgroundColor: isDarkMode ? '#584016' : '#FFE38A' },
                      ]}>
                        <Text style={styles.unlockEmoji}>{unlockBanner.emoji}</Text>
                      </View>
                      <View style={styles.unlockCopy}>
                        <Text style={[styles.unlockKicker, { color: isDarkMode ? '#FFD46E' : '#A66500' }]}>New mode</Text>
                        <Text style={[styles.unlockTitle, denseLayout && styles.unlockTitleCompact, { color: isDarkMode ? '#FFE5A2' : '#704600' }]}>
                          {unlockBanner.label} Unlocked!
                        </Text>
                        <Text style={[styles.unlockMessage, { color: isDarkMode ? '#E5C77D' : '#87621B' }]}>
                          {unlockBanner.message}
                        </Text>
                      </View>
                    </Animated.View>
                  )}

                  {revealStage >= xpRevealStage && (
                    <View style={styles.xpRewardWrap}>
                      {bonusXp > 0 && (
                        <Animated.View
                          style={[
                            styles.perfectBonusPill,
                            { backgroundColor: '#D63B55', borderColor: isDarkMode ? '#3A1218' : '#FFE0E5' },
                            revealStyle(xpCardAnim, 8),
                          ]}
                        >
                          <Text style={styles.perfectBonusPillText}>Perfect! Bonus ×1.5</Text>
                        </Animated.View>
                      )}
                      <Animated.View
                        style={[
                          styles.xpRewardCard,
                          denseLayout && styles.xpRewardCardCompact,
                          desktopScale > 1 && {
                            gap: Math.round((denseLayout ? 12 : 18) * desktopScale),
                            borderRadius: Math.round((denseLayout ? 16 : 20) * desktopScale),
                            padding: Math.round((denseLayout ? 14 : 22) * desktopScale),
                          },
                          {
                            backgroundColor: isDarkMode ? colors.surface : colors.card,
                            borderColor: colors.border,
                          },
                          revealStyle(xpCardAnim, 14),
                        ]}
                      >
                        <View style={styles.xpRewardHeading}>
                          <View style={[
                            styles.xpRewardIcon,
                            desktopScale > 1 && {
                              width: Math.round(48 * desktopScale),
                              height: Math.round(48 * desktopScale),
                              borderRadius: Math.round(16 * desktopScale),
                            },
                            { backgroundColor: colors.primarySoft },
                          ]}>
                            <Text style={styles.xpRewardEmoji}>✨</Text>
                          </View>
                          <View style={styles.xpRewardCopy}>
                            <Text style={[styles.xpRewardKicker, { color: colors.secondaryText }]}>XP reward</Text>
                            <Text
                              style={[
                                styles.xpRewardTitle,
                                denseLayout && styles.xpRewardTitleCompact,
                                { color: colors.text },
                              ]}
                            >
                              You&apos;ve earned {earnedThisSessionXP} XP
                            </Text>
                          </View>
                        </View>

                      {supportingStats.length > 0 && !veryDenseLayout && !(hasUnlockCard && denseLayout) && (
                        <SessionResultStats
                          colors={colors}
                          isDarkMode={isDarkMode}
                          items={supportingStats}
                          reveal={revealStage >= xpRevealStage}
                          animationsEnabled={animationsEnabled}
                          revealDelay={80}
                          forceDense={denseLayout}
                        />
                      )}

                      <View style={styles.xpProgressRow}>
                        <View style={[
                          styles.levelCircle,
                          desktopScale > 1 && {
                            width: Math.round(36 * desktopScale),
                            height: Math.round(36 * desktopScale),
                            borderRadius: Math.round(18 * desktopScale),
                          },
                          { backgroundColor: colors.primary },
                        ]}>
                          <Text style={[styles.levelCircleText, { color: colors.buttonText }]}>{displayedCurrentLevel}</Text>
                        </View>
                        <View style={styles.xpBarCenter}>
                          <View style={[
                            styles.xpBarTrack,
                            desktopScale > 1 && { height: Math.round(13 * desktopScale) },
                            { backgroundColor: colors.progressTrack },
                          ]}>
                            <Animated.View
                              style={[
                                styles.xpBarFill,
                                {
                                  width: barFillAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [`${barFromPercent}%`, `${barToPercent}%`],
                                  }),
                                  backgroundColor: colors.primary,
                                },
                              ]}
                            />
                          </View>
                          <Text style={[styles.xpBarLabel, { color: colors.secondaryText }]}>
                            {displayedBarXP} / {barNeededXP} XP
                          </Text>
                        </View>
                        <View style={[
                          styles.levelCircle,
                          styles.nextLevelCircle,
                          desktopScale > 1 && {
                            width: Math.round(36 * desktopScale),
                            height: Math.round(36 * desktopScale),
                            borderRadius: Math.round(18 * desktopScale),
                          },
                          { backgroundColor: colors.progressTrack },
                        ]}>
                          <Text style={[styles.levelCircleText, { color: colors.secondaryText }]}>{displayedNextLevel}</Text>
                        </View>
                      </View>
                      </Animated.View>
                    </View>
                  )}

                  {revealStage >= actionRevealStage && (
                    <Animated.View style={[styles.actionBlock, revealStyle(actionAnim, 10)]}>
                      <SessionResultActions
                        colors={colors}
                        isDarkMode={isDarkMode}
                        primaryLabel={earnedThisSessionXP === 0
                          ? 'Try Again'
                          : xpClaimed
                            ? continueButtonLabel
                            : claimingXP
                              ? 'Claiming XP…'
                              : `Claim ${earnedThisSessionXP} XP`}
                        onPrimary={earnedThisSessionXP === 0 || xpClaimed ? handlePostClaimAction : handleClaimXP}
                        primaryDisabled={claimingXP}
                        forceDense={denseLayout}
                      />
                    </Animated.View>
                  )}
              </SessionResultCard>
            </View>
            </View>
          )}
        </Animated.View>
      </Modal>

      <LevelUpModal
        visible={visible && showLevelUp && !flowFinished}
        totalXP={totalAfterSessionXP}
        sessionXP={earnedThisSessionXP}
        colors={colors}
        isDarkMode={isDarkMode}
        onDismiss={handleLevelUpDismiss}
        dismissLabel={continueButtonLabel}
        onGoToAccount={onGoToAccount ? handleGoToAccountFromReward : undefined}
        hasBackdropUnderlay
      />
      </>
    </DesktopTypographyProvider>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    // No zIndex/elevation needed: this View lives inside RN's own <Modal>, which already
    // renders in its own top-level native window/Android Activity above everything else.
    // The old elevation:99999 here was pure leftover and, since this backdrop's own
    // background is intentionally translucent (and animates through opacity), Android
    // rendered that huge elevation as an opaque white plate with a thick grey shadow ring
    // instead of the intended see-through scrim.
  },
  viewport: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  shell: {
    minHeight: 0,
    width: '100%',
    maxWidth: 570,
    alignSelf: 'center',
    position: 'relative',
  },
  completionHero: {
    minHeight: 150,
    paddingVertical: 28,
  },
  completionHeroCompact: {
    minHeight: 118,
    paddingVertical: 17,
  },
  completionHeroVeryCompact: {
    minHeight: 108,
    paddingVertical: 14,
  },
  completionHeroVisual: {
    width: 76,
    height: 76,
    borderRadius: 22,
  },
  completionHeroVisualCompact: {
    width: 62,
    height: 62,
    borderRadius: 19,
  },
  unlockCard: {
    width: '100%',
    minHeight: 94,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    borderRadius: 18,
    borderWidth: 2,
    paddingVertical: 15,
    paddingHorizontal: 18,
    // boxShadow only — a native elevation shadow composites separately from this card's
    // reveal fade, showing through the half-transparent card as a grey plate with a hard edge.
    boxShadow: '0px 6px 16px rgba(151,105,15,0.16)',
  },
  unlockCardCompact: {
    minHeight: 82,
    gap: 12,
    borderRadius: 16,
    paddingVertical: 11,
    paddingHorizontal: 13,
  },
  unlockIcon: {
    width: 52,
    height: 52,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  unlockEmoji: {
    fontSize: 27,
    lineHeight: 32,
  },
  unlockCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  unlockKicker: {
    fontSize: 10,
    lineHeight: 13,
    fontWeight: freshFontFamily.extrabold,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  unlockTitle: {
    fontSize: 21,
    lineHeight: 25,
    fontWeight: freshFontFamily.extrabold,
    letterSpacing: -0.2,
  },
  unlockTitleCompact: {
    fontSize: 18,
    lineHeight: 22,
  },
  unlockMessage: {
    fontSize: 13,
    lineHeight: 17,
    fontWeight: freshFontFamily.medium,
  },
  xpRewardCard: {
    width: '100%',
    gap: 18,
    borderRadius: 20,
    borderWidth: 1,
    padding: 22,
    boxShadow: '0px 7px 20px rgba(40,60,110,0.10)',
  },
  xpRewardCardCompact: {
    gap: 12,
    borderRadius: 16,
    padding: 14,
  },
  xpRewardHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  xpRewardIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  xpRewardEmoji: {
    fontSize: 25,
    lineHeight: 30,
  },
  xpRewardCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  xpRewardKicker: {
    fontSize: 10,
    lineHeight: 13,
    fontWeight: freshFontFamily.extrabold,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  xpRewardTitle: {
    fontSize: 24,
    lineHeight: 29,
    fontWeight: freshFontFamily.extrabold,
    letterSpacing: -0.2,
  },
  xpRewardTitleCompact: {
    fontSize: 19,
    lineHeight: 24,
  },
  xpRewardWrap: {
    width: '100%',
    alignItems: 'center',
  },
  perfectBonusPill: {
    borderRadius: 999,
    borderWidth: 2,
    paddingVertical: 6,
    paddingHorizontal: 16,
    marginBottom: -12,
    zIndex: 1,
    boxShadow: '0px 2px 6px rgba(0,0,0,0.18)',
  },
  perfectBonusPillText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: freshFontFamily.extrabold,
    letterSpacing: 0.2,
  },
  xpProgressRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  levelCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  nextLevelCircle: {
    opacity: 0.82,
  },
  levelCircleText: {
    width: '100%',
    fontSize: 14,
    lineHeight: 36,
    fontWeight: freshFontFamily.extrabold,
    textAlign: 'center',
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
  xpBarCenter: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
  },
  xpBarTrack: {
    width: '100%',
    height: 13,
    borderRadius: 999,
    overflow: 'hidden',
  },
  xpBarFill: {
    height: '100%',
    borderRadius: 999,
  },
  xpBarLabel: {
    marginTop: 5,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: freshFontFamily.bold,
    textAlign: 'center',
  },
  actionBlock: {
    width: '100%',
    marginTop: 'auto',
  },
});
