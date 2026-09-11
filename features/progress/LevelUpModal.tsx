import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAudioPlayer } from 'expo-audio';
import Text from '../shared/ThemedText';
import Assets from '../../assets/index';
import { SOUND_EFFECT_OPTIONS, replaySoundEffect } from '../shared/soundEffects';
import { getAccountAvatarColorUnlocksBetweenLevels, getAccountAvatarUnlocksBetweenLevels } from '../account/accountAvatarStorage';
import type { ThemeColors } from '../settings/ThemeContext';
import { getLevelDisplayLabel, getMasterTierLabel, getXPLevel, getXPLevelStats, isMasterLevel } from './xpLevels';
import { freshFontFamily } from '../shared/freshDirection';
import useReducedMotion from '../shared/useReducedMotion';
import { getDesktopTypographyScale, getSheetDensity } from '../shared/responsiveLayout';
import RewardRevealModal from './RewardRevealModal';
import { useAccount } from '../account/AccountContext';

type LevelUpModalProps = {
  visible: boolean;
  totalXP: number;
  sessionXP: number;
  colors: ThemeColors;
  isDarkMode: boolean;
  onDismiss: () => void;
  dismissLabel?: string;
  onGoToAccount?: () => void;
  hasBackdropUnderlay?: boolean;
};

const CONFETTI = [
  { emoji: '✨', x: -118, y: -92, size: 22 },
  { emoji: '🎉', x: 118, y: -86, size: 25 },
  { emoji: '⭐', x: -138, y: 26, size: 21 },
  { emoji: '🎊', x: 136, y: 34, size: 25 },
  { emoji: '✨', x: -54, y: -132, size: 18 },
  { emoji: '⭐', x: 56, y: -130, size: 19 },
] as const;

const normalizeXP = (value: number) => (Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0);

export default function LevelUpModal({
  visible,
  totalXP,
  sessionXP,
  colors,
  isDarkMode,
  onDismiss,
  dismissLabel = 'Continue',
  onGoToAccount,
  hasBackdropUnderlay = false,
}: LevelUpModalProps) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const desktopScale = getDesktopTypographyScale(width, height, 'fit');
  const { compact, dense, veryShort } = getSheetDensity(width, height, desktopScale);
  const availableHeight = Math.max(320, height - Math.round((dense ? 32 : 48) * desktopScale));
  const portraitSheetMinHeight = compact && height > width
    ? Math.min(availableHeight, Math.max(480, Math.round((width - 32) * 1.32)))
    : 0;
  const reducedMotion = useReducedMotion();
  const levelUpPlayer = useAudioPlayer(Assets.bestsuccess, SOUND_EFFECT_OPTIONS);
  const { updateAccountAvatar, updateAccountAvatarColor } = useAccount();
  const hasPlayedSoundRef = useRef(false);
  const levelActionHandledRef = useRef(false);
  const rewardActionHandledRef = useRef(false);
  const entrance = useRef(new Animated.Value(0)).current;
  const trophyScale = useRef(new Animated.Value(0.96)).current;
  // Short left/right shake of the whole card as the trophy lands, for celebratory punch.
  const sheetShake = useRef(new Animated.Value(0)).current;
  const barFillAnim = useRef(new Animated.Value(0)).current;
  // JS-thread twin of barFillAnim, animated in lockstep, purely to drive the XP number.
  const barCountAnim = useRef(new Animated.Value(0)).current;
  const [showRewardReveal, setShowRewardReveal] = useState(false);
  const [settingPicture, setSettingPicture] = useState(false);

  const earnedXP = normalizeXP(sessionXP);
  const safeTotalXP = normalizeXP(totalXP);
  const previousXP = Math.max(0, safeTotalXP - earnedXP);
  const stats = useMemo(() => getXPLevelStats(safeTotalXP), [safeTotalXP]);
  const previousLevel = useMemo(() => getXPLevel(previousXP), [previousXP]);
  const [displayedProgressXP, setDisplayedProgressXP] = useState(0);
  const isMaster = isMasterLevel(stats.level);
  const levelDisplayLabel = getLevelDisplayLabel(stats.level);
  const masterTierLabel = getMasterTierLabel(stats.level);
  const newRewardUnlocks = useMemo(() => {
    const avatarUnlocks = getAccountAvatarUnlocksBetweenLevels(previousLevel, stats.level);
    const colorUnlocks = getAccountAvatarColorUnlocksBetweenLevels(previousLevel, stats.level);
    return [...avatarUnlocks, ...colorUnlocks].sort(
      (a, b) => (a.unlockLevel ?? 0) - (b.unlockLevel ?? 0)
    );
  }, [previousLevel, stats.level]);
  const avatarUnlock = newRewardUnlocks[0] ?? null;
  const isAvatarUnlockImage = !!avatarUnlock && 'image' in avatarUnlock;
  const extraUnlockCount = Math.max(0, newRewardUnlocks.length - 1);

  useEffect(() => {
    setDisplayedProgressXP(0);
    // Listens on barCountAnim, not barFillAnim: the bar itself runs on the native driver
    // so it stays smooth, while this JS-thread twin only ticks the number.
    const listenerId = barCountAnim.addListener(({ value }) => {
      const progress = Math.max(0, Math.min(1, value));
      const nextXP = Math.round(stats.progressXP * progress);
      setDisplayedProgressXP((current) => current === nextXP ? current : nextXP);
    });

    return () => barCountAnim.removeListener(listenerId);
  }, [barCountAnim, stats.progressXP, visible]);

  useEffect(() => {
    if (!visible) {
      hasPlayedSoundRef.current = false;
      levelActionHandledRef.current = false;
      rewardActionHandledRef.current = false;
      setShowRewardReveal(false);
      setSettingPicture(false);
      return;
    }
    if (!hasPlayedSoundRef.current) {
      hasPlayedSoundRef.current = true;
      replaySoundEffect(levelUpPlayer);
    }
  }, [levelUpPlayer, visible]);

  useEffect(() => {
    if (!visible || showRewardReveal) return;

    if (reducedMotion) {
      entrance.setValue(1);
      trophyScale.setValue(1);
      // Reset too: a shake interrupted part-way (modal closed mid-animation) would
      // otherwise leave the card sitting off-centre the next time it opens.
      sheetShake.setValue(0);
      barFillAnim.setValue(1);
      barCountAnim.setValue(1);
      return;
    }

    entrance.setValue(0);
    trophyScale.setValue(0.96);
    sheetShake.setValue(0);
    barFillAnim.setValue(0);
    barCountAnim.setValue(0);
    const celebration = Animated.parallel([
      // Fires as the card appears (alongside the confetti), so the level-up lands with a
      // jolt rather than wobbling later. The short delay just lets the first frame paint
      // so the shake isn't half-missed during mount. Decaying amplitude, ~360ms total.
      Animated.sequence([
        Animated.delay(40),
        Animated.timing(sheetShake, { toValue: 1, duration: 60, useNativeDriver: Platform.OS !== 'web' }),
        Animated.timing(sheetShake, { toValue: -1, duration: 80, useNativeDriver: Platform.OS !== 'web' }),
        Animated.timing(sheetShake, { toValue: 0.6, duration: 70, useNativeDriver: Platform.OS !== 'web' }),
        Animated.timing(sheetShake, { toValue: -0.35, duration: 70, useNativeDriver: Platform.OS !== 'web' }),
        Animated.timing(sheetShake, { toValue: 0, duration: 80, useNativeDriver: Platform.OS !== 'web' }),
      ]),
      Animated.timing(entrance, { toValue: 1, duration: 920, useNativeDriver: Platform.OS !== 'web' }),
      Animated.timing(trophyScale, {
        toValue: 1,
        duration: 620,
        delay: 160,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: Platform.OS !== 'web',
      }),
      // Same timing on both so the bar and its number stay in step.
      Animated.timing(barFillAnim, {
        toValue: 1,
        duration: 1320,
        delay: 500,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(barCountAnim, { toValue: 1, duration: 1320, delay: 500, useNativeDriver: false }),
    ]);
    celebration.start();
    return () => celebration.stop();
  }, [barCountAnim, barFillAnim, entrance, reducedMotion, showRewardReveal, trophyScale, sheetShake, visible]);

  const sessionsToNextLevel = earnedXP > 0 ? Math.max(1, Math.ceil(stats.remainingXP / earnedXP)) : 1;
  const levelTitle = isMaster
    ? `${masterTierLabel || levelDisplayLabel} reached!`
    : `You reached ${levelDisplayLabel}!`;
  const combinedLevelTitle = isMaster
    ? `${masterTierLabel || levelDisplayLabel} reached`
    : `You reached ${levelDisplayLabel}`;
  const levelSubtitle = isMaster
    ? 'A new Master tier is yours.'
    : `${sessionsToNextLevel === 1 ? 'One more session' : `${sessionsToNextLevel} more sessions`} like that and you'll hit Level ${stats.level + 1}.`;
  const topPad = dense
    ? Platform.OS === 'web' ? 8 * desktopScale : Math.max(insets.top, 8)
    : Platform.OS === 'web' ? 20 * desktopScale : Math.max(insets.top, 16) + 6;
  const botPad = dense
    ? Platform.OS === 'web' ? 8 * desktopScale : Math.max(insets.bottom, 6)
    : Platform.OS === 'web' ? 20 * desktopScale : Math.max(insets.bottom, 12) + 4;
  const levelPalette = isDarkMode
    ? {
        sheet: '#0B2119',
        panel: '#123126',
        accent: '#65E39A',
        button: '#218D55',
        accentSoft: '#173E2D',
        border: '#2D7652',
        totalTile: '#162F43',
        earnedTile: '#153D2D',
        track: '#29483B',
        nextLevel: '#274238',
        shadow: '#07120E',
      }
    : {
        sheet: '#EFFBF4',
        panel: '#FFFFFF',
        accent: '#1A9A5B',
        button: '#167A48',
        accentSoft: '#DDF8E8',
        border: '#9CDEB8',
        totalTile: '#E5F0FF',
        earnedTile: '#DDF8E8',
        track: '#D5E9DD',
        nextLevel: '#E1EEE6',
        shadow: '#12663E',
      };
  const sheetBackground = levelPalette.sheet;
  const surface = levelPalette.panel;

  const continueFromLevel = () => {
    if (levelActionHandledRef.current) return;
    levelActionHandledRef.current = true;
    if (avatarUnlock) {
      setShowRewardReveal(true);
      return;
    }
    onDismiss();
  };



  const levelActionLabel = avatarUnlock ? 'Continue' : dismissLabel;

  // Enter activates the same primary action the button does — a leftover-focused
  // exercise input underneath this overlay could otherwise react to the same
  // keypress and exit the screen entirely instead.
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined' || typeof document === 'undefined') return undefined;
    if (!visible || showRewardReveal) return undefined;

    (document.activeElement as HTMLElement | null)?.blur?.();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Enter') return;
      event.preventDefault();
      continueFromLevel();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, showRewardReveal]);

  const setRewardAsPicture = () => {
    if (!avatarUnlock || settingPicture || rewardActionHandledRef.current) return;
    rewardActionHandledRef.current = true;
    if (onGoToAccount) {
      onGoToAccount();
      onDismiss();
      return;
    }
    setSettingPicture(true);
    const applyReward = isAvatarUnlockImage
      ? updateAccountAvatar(avatarUnlock.id as Parameters<typeof updateAccountAvatar>[0])
      : updateAccountAvatarColor(avatarUnlock.id as Parameters<typeof updateAccountAvatarColor>[0]);
    void applyReward
      .then(onDismiss)
      .catch(() => {
        setSettingPicture(false);
        rewardActionHandledRef.current = false;
      });
  };

  const continueFromReward = () => {
    if (rewardActionHandledRef.current) return;
    rewardActionHandledRef.current = true;
    onDismiss();
  };

  if (reducedMotion && !showRewardReveal) {
    return (
      <Modal
        visible={visible}
        transparent
        animationType="none"
        statusBarTranslucent
        presentationStyle="overFullScreen"
        hardwareAccelerated
        onRequestClose={continueFromLevel}
      >
        <View style={[
          styles.backdrop,
          { backgroundColor: hasBackdropUnderlay ? 'transparent' : isDarkMode ? 'rgba(7,15,28,0.54)' : 'rgba(20,20,25,0.55)' },
        ]}>
          <View style={[styles.viewport, { paddingTop: topPad, paddingBottom: botPad }]}>
            <View
              style={[
                styles.combinedSheet,
                dense && styles.combinedSheetCompact,
                veryShort && styles.combinedSheetVeryCompact,
                desktopScale > 1 && {
                  maxWidth: Math.round(570 * desktopScale),
                  borderRadius: Math.round(24 * desktopScale),
                  paddingHorizontal: Math.round((veryShort ? 16 : dense ? 20 : 40) * desktopScale),
                  paddingVertical: Math.round((veryShort ? 14 : dense ? 20 : 40) * desktopScale),
                },
                {
                  backgroundColor: sheetBackground,
                  borderColor: levelPalette.border,
                  borderWidth: 1,
                  minHeight: portraitSheetMinHeight,
                  maxHeight: availableHeight,
                  justifyContent: 'space-between',
                  boxShadow: isDarkMode
                    ? '0px 8px 24px rgba(0,0,0,0.34)'
                    : '0px 8px 24px rgba(40,60,110,0.12)',
                } as ViewStyle,
                {
                  transform: [{
                    translateX: sheetShake.interpolate({
                      inputRange: [-1, 1],
                      outputRange: [-9, 9],
                    }),
                  }],
                },
              ]}
              accessibilityViewIsModal
            >
              <View style={[styles.combinedBanner, dense && styles.combinedBannerCompact, { backgroundColor: levelPalette.button }]}>
                <Text style={styles.combinedBannerEmoji}>🌟</Text>
                <Text style={styles.combinedBannerTitle}>Great job!</Text>
              </View>

              <View style={[styles.combinedLevelCard, dense && styles.combinedLevelCardCompact, { backgroundColor: surface }]}>
                <View style={[styles.combinedTrophy, { borderColor: levelPalette.accent, backgroundColor: levelPalette.accentSoft }]}>
                  <Image source={Assets.levelUp} style={styles.combinedLevelUpImage} resizeMode="contain" />
                </View>
                <Text style={[styles.combinedTitle, dense && styles.combinedTitleCompact, { color: colors.text }]}>
                  {combinedLevelTitle}
                </Text>
                <View style={[styles.combinedStats, dense && styles.combinedStatsCompact]}>
                  <View style={[styles.combinedStat, dense && styles.combinedStatCompact, { backgroundColor: levelPalette.earnedTile }]}>
                    <Text style={[styles.combinedStatLabel, { color: levelPalette.accent }]}>XP earned</Text>
                    <Text style={[styles.combinedStatValue, { color: levelPalette.accent }]}>+{earnedXP}</Text>
                  </View>
                  <View style={[styles.combinedStat, dense && styles.combinedStatCompact, { backgroundColor: levelPalette.totalTile }]}>
                    <Text style={[styles.combinedStatLabel, { color: colors.secondaryText }]}>Total XP</Text>
                    <Text style={[styles.combinedStatValue, { color: colors.text }]}>{safeTotalXP}</Text>
                  </View>
                </View>
                <Text style={[styles.combinedProgressLabel, dense && styles.combinedProgressLabelCompact, { color: colors.secondaryText }]}>
                  {stats.progressXP} / {stats.neededXP} XP
                </Text>
                <View style={[styles.combinedProgressTrack, dense && styles.combinedProgressTrackCompact, { backgroundColor: levelPalette.track }]}>
                  <View style={[styles.combinedProgressFill, { width: `${stats.progressPercent}%`, backgroundColor: levelPalette.accent }]} />
                </View>
              </View>

              <Pressable
                onPress={continueFromLevel}
                accessibilityRole="button"
                accessibilityLabel={levelActionLabel}
                style={({ pressed }) => [
                  styles.combinedPrimaryAction,
                  dense && styles.combinedPrimaryActionCompact,
                  {
                    backgroundColor: levelPalette.button,
                    opacity: pressed ? 0.85 : 1,
                    transform: [{ translateY: pressed ? 2 : 0 }],
                  },
                  Platform.OS === 'web' && ({ cursor: 'pointer' } as ViewStyle),
                ]}
              >
                <Text style={[styles.combinedPrimaryActionText, { color: colors.buttonText }]}>{levelActionLabel}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <>
      <Modal
        visible={visible && !showRewardReveal}
        transparent
        animationType="none"
        statusBarTranslucent
        presentationStyle="overFullScreen"
        hardwareAccelerated
        onRequestClose={continueFromLevel}
      >
        <View style={[
          styles.backdrop,
          { backgroundColor: hasBackdropUnderlay ? 'transparent' : isDarkMode ? 'rgba(7,15,28,0.54)' : 'rgba(20,20,25,0.55)' },
        ]}>
          <View style={[styles.viewport, { paddingTop: topPad, paddingBottom: botPad }]}>
            <Animated.View
              style={[
                styles.sheet,
                dense && styles.sheetCompact,
                veryShort && styles.sheetVeryCompact,
                desktopScale > 1 && {
                  maxWidth: Math.round(570 * desktopScale),
                  borderRadius: Math.round(24 * desktopScale),
                  paddingHorizontal: Math.round((veryShort ? 16 : dense ? 20 : 36) * desktopScale),
                  paddingTop: Math.round((veryShort ? 16 : dense ? 22 : 42) * desktopScale),
                  paddingBottom: Math.round((veryShort ? 14 : dense ? 18 : 32) * desktopScale),
                },
                {
                  backgroundColor: sheetBackground,
                  borderColor: levelPalette.border,
                  borderWidth: 1,
                  minHeight: portraitSheetMinHeight,
                  maxHeight: availableHeight,
                  justifyContent: 'space-between',
                  boxShadow: isDarkMode
                    ? '0px 8px 24px rgba(0,0,0,0.34)'
                    : '0px 8px 24px rgba(40,60,110,0.12)',
                } as ViewStyle,
                {
                  transform: [{
                    translateX: sheetShake.interpolate({
                      inputRange: [-1, 1],
                      outputRange: [-9, 9],
                    }),
                  }],
                },
              ]}
              accessibilityViewIsModal
            >
              <View style={[styles.levelContent, veryShort && styles.levelContentVeryCompact]}>
                <View style={styles.confettiOrigin} pointerEvents="none">
                  {CONFETTI.map((piece, index) => (
                    <Animated.Text
                      key={`${piece.emoji}-${index}`}
                      style={[
                        styles.confetti,
                        {
                          fontSize: piece.size,
                          opacity: entrance.interpolate({
                            inputRange: [0, 0.22, 1],
                            outputRange: [0, 1, 0],
                          }),
                          transform: [
                            { translateX: entrance.interpolate({ inputRange: [0, 1], outputRange: [0, piece.x] }) },
                            { translateY: entrance.interpolate({ inputRange: [0, 1], outputRange: [0, piece.y] }) },
                            { rotate: entrance.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] }) },
                          ],
                        },
                      ]}
                    >
                      {piece.emoji}
                    </Animated.Text>
                  ))}
                </View>

                <Animated.View
                  style={[
                    styles.trophyWrap,
                    dense && styles.trophyWrapCompact,
                    veryShort && styles.trophyWrapVeryCompact,
                    desktopScale > 1 && {
                      width: Math.round((veryShort ? 88 : dense ? 112 : 152) * desktopScale),
                      height: Math.round((veryShort ? 88 : dense ? 112 : 152) * desktopScale),
                      borderRadius: Math.round((veryShort ? 44 : dense ? 56 : 76) * desktopScale),
                      marginTop: Math.round((veryShort ? 6 : dense ? 12 : 16) * desktopScale),
                    },
                    {
                      backgroundColor: levelPalette.accentSoft,
                      borderColor: levelPalette.accent,
                      boxShadow: `0px 10px 28px ${isDarkMode ? 'rgba(40,210,120,0.20)' : 'rgba(26,154,91,0.24)'}`,
                    } as ViewStyle,
                    { transform: [{ scale: trophyScale }] },
                  ]}
                >
                  <Image
                    source={Assets.levelUp}
                    style={[
                      styles.levelUpImage,
                      dense && styles.levelUpImageCompact,
                      veryShort && styles.levelUpImageVeryCompact,
                      desktopScale > 1 && {
                        width: Math.round((veryShort ? 62 : dense ? 78 : 106) * desktopScale),
                        height: Math.round((veryShort ? 62 : dense ? 78 : 106) * desktopScale),
                      },
                    ]}
                    resizeMode="contain"
                  />
                </Animated.View>

                <View style={[
                  styles.levelCopy,
                  veryShort && styles.levelCopyVeryCompact,
                  desktopScale > 1 && { marginTop: Math.round(28 * desktopScale), gap: Math.round(8 * desktopScale) },
                ]}>
                  <Text style={[styles.levelTitle, dense && styles.levelTitleCompact, veryShort && styles.levelTitleVeryCompact, { color: colors.text }]}>{levelTitle}</Text>
                  <Text style={[styles.levelSubtitle, veryShort && styles.levelSubtitleVeryCompact, { color: colors.secondaryText }]}>{levelSubtitle}</Text>
                </View>

                <View style={[
                  styles.statsRow,
                  dense && styles.statsRowCompact,
                  veryShort && styles.statsRowVeryCompact,
                  desktopScale > 1 && {
                    gap: Math.round((veryShort ? 8 : dense ? 10 : 14) * desktopScale),
                    marginTop: Math.round((veryShort ? 10 : dense ? 18 : 28) * desktopScale),
                  },
                ]}>
                  <View style={[
                    styles.statTile,
                    dense && styles.statTileCompact,
                    veryShort && styles.statTileVeryCompact,
                    desktopScale > 1 && {
                      minHeight: Math.round((veryShort ? 56 : dense ? 66 : 86) * desktopScale),
                      borderRadius: Math.round((dense ? 14 : 18) * desktopScale),
                    },
                    { backgroundColor: levelPalette.totalTile },
                  ]}>
                    <Text style={[styles.statLabel, { color: colors.secondaryText }]}>Total XP</Text>
                    <Text style={[styles.statValue, { color: colors.text }]}>{safeTotalXP}</Text>
                  </View>
                  <View style={[
                    styles.statTile,
                    dense && styles.statTileCompact,
                    veryShort && styles.statTileVeryCompact,
                    desktopScale > 1 && {
                      minHeight: Math.round((veryShort ? 56 : dense ? 66 : 86) * desktopScale),
                      borderRadius: Math.round((dense ? 14 : 18) * desktopScale),
                    },
                    { backgroundColor: levelPalette.earnedTile },
                  ]}>
                    <Text style={[styles.statLabel, { color: colors.secondaryText }]}>XP earned</Text>
                    <Text style={[styles.statValue, { color: colors.text }]}>+{earnedXP}</Text>
                  </View>
                </View>

                <View style={[
                  styles.progressPanel,
                  dense && styles.progressPanelCompact,
                  veryShort && styles.progressPanelVeryCompact,
                  desktopScale > 1 && {
                    minHeight: Math.round((veryShort ? 60 : dense ? 68 : 92) * desktopScale),
                    borderRadius: Math.round((dense ? 14 : 20) * desktopScale),
                    marginTop: Math.round((veryShort ? 8 : dense ? 10 : 14) * desktopScale),
                    paddingHorizontal: Math.round((veryShort ? 10 : dense ? 14 : 26) * desktopScale),
                    gap: Math.round((veryShort ? 8 : dense ? 10 : 14) * desktopScale),
                  },
                  { backgroundColor: surface, borderColor: levelPalette.border, borderWidth: 1 },
                ]}>
                  <View style={[
                    styles.levelCircle,
                    veryShort && styles.levelCircleVeryCompact,
                    desktopScale > 1 && {
                      width: Math.round(44 * desktopScale),
                      height: Math.round(44 * desktopScale),
                      borderRadius: Math.round(22 * desktopScale),
                    },
                    { backgroundColor: levelPalette.button },
                  ]}>
                    <Text style={[styles.levelCircleText, veryShort && styles.levelCircleTextVeryCompact, { color: colors.buttonText }]}>{stats.level}</Text>
                  </View>
                  <View style={styles.progressCenter}>
                    <View style={[
                      styles.progressTrack,
                      veryShort && styles.progressTrackVeryCompact,
                      desktopScale > 1 && { height: Math.round(18 * desktopScale), borderRadius: Math.round(9 * desktopScale) },
                      { backgroundColor: levelPalette.track },
                    ]}>
                      <Animated.View
                        style={[
                          styles.progressFill,
                          {
                            // A true low percentage (e.g. 6%) reads as an empty/broken bar right
                            // after a celebratory level-up — floor it so there's always a
                            // visible sliver of progress to build from.
                            // Scaled from the left rather than an animated width, so this can
                            // run on the native driver.
                            width: '100%',
                            transformOrigin: 'left',
                            transform: [{
                              scaleX: barFillAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [0.02, Math.max(stats.progressPercent, 5) / 100],
                              }),
                            }],
                            backgroundColor: levelPalette.accent,
                          },
                        ]}
                      />
                    </View>
                    <Text style={[styles.progressLabel, veryShort && styles.progressLabelVeryCompact, { color: colors.secondaryText }]}>
                      {displayedProgressXP} / {stats.neededXP} XP
                    </Text>
                  </View>
                  <View style={[
                    styles.levelCircle,
                    veryShort && styles.levelCircleVeryCompact,
                    desktopScale > 1 && {
                      width: Math.round(44 * desktopScale),
                      height: Math.round(44 * desktopScale),
                      borderRadius: Math.round(22 * desktopScale),
                    },
                    { backgroundColor: levelPalette.nextLevel },
                  ]}>
                    <Text style={[styles.levelCircleText, veryShort && styles.levelCircleTextVeryCompact, { color: colors.secondaryText }]}>{stats.level + 1}</Text>
                  </View>
                </View>
              </View>

              <Pressable
                onPress={continueFromLevel}
                accessibilityRole="button"
                accessibilityLabel={levelActionLabel}
                style={({ pressed }) => [
                  styles.primaryAction,
                  dense && styles.primaryActionCompact,
                  veryShort && styles.primaryActionVeryCompact,
                  desktopScale > 1 && {
                    minHeight: Math.round((veryShort ? 48 : dense ? 52 : 62) * desktopScale),
                    paddingHorizontal: Math.round(20 * desktopScale),
                    marginTop: Math.round((veryShort ? 10 : dense ? 16 : 22) * desktopScale),
                  },
                  {
                    backgroundColor: levelPalette.button,
                    boxShadow: `0px ${pressed ? 1 : 6}px 0 ${levelPalette.shadow}`,
                    opacity: pressed ? 0.86 : 1,
                    transform: [{ translateY: pressed ? 3 : 0 }],
                  } as ViewStyle,
                  Platform.OS === 'web' && ({ cursor: 'pointer' } as ViewStyle),
                ]}
              >
                <Text style={[styles.primaryActionText, { color: colors.buttonText }]}>{levelActionLabel}</Text>
              </Pressable>
            </Animated.View>
          </View>
        </View>
      </Modal>

      <RewardRevealModal
        visible={visible && showRewardReveal}
        reward={avatarUnlock}
        extraRewardCount={extraUnlockCount}
        colors={colors}
        isDarkMode={isDarkMode}
        onContinue={continueFromReward}
        onSetAsPicture={setRewardAsPicture}
        continueLabel={dismissLabel}
        busy={settingPicture}
        hasBackdropUnderlay={hasBackdropUnderlay}
      />
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    // No zIndex/elevation needed: this View lives inside RN's own <Modal>, which already
    // renders in its own top-level native window/Android Activity above everything else.
    // The old elevation:99999 here was pure leftover and, since this backdrop's own
    // background is intentionally transparent/translucent, Android rendered that huge
    // elevation as an opaque white plate with a thick grey shadow ring instead of the
    // intended see-through scrim.
  },
  viewport: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  sheet: {
    width: '100%',
    maxWidth: 570,
    minHeight: 0,
    borderRadius: 24,
    paddingHorizontal: 36,
    paddingTop: 42,
    paddingBottom: 32,
    overflow: 'hidden',
  },
  sheetCompact: {
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 18,
  },
  sheetVeryCompact: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
  },
  levelContent: {
    width: '100%',
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  levelContentVeryCompact: {
    justifyContent: 'flex-start',
  },
  confettiOrigin: {
    position: 'absolute',
    top: '30%',
    left: '50%',
    width: 1,
    height: 1,
    zIndex: 3,
  },
  confetti: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
  trophyWrap: {
    width: 152,
    height: 152,
    borderRadius: 76,
    borderWidth: 3,
    borderColor: '#FFA900',
    backgroundColor: '#FFF3D6',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    boxShadow: '0px 10px 28px rgba(255,169,0,0.30)',
  },
  trophyWrapCompact: {
    width: 112,
    height: 112,
    borderRadius: 56,
    marginTop: 12,
  },
  trophyWrapVeryCompact: {
    width: 88,
    height: 88,
    borderRadius: 44,
    marginTop: 6,
  },
  levelUpImage: {
    width: 106,
    height: 106,
  },
  levelUpImageCompact: {
    width: 78,
    height: 78,
  },
  levelUpImageVeryCompact: {
    width: 62,
    height: 62,
  },
  levelCopy: {
    alignItems: 'center',
    marginTop: 28,
    gap: 8,
    paddingHorizontal: 10,
  },
  levelCopyVeryCompact: {
    marginTop: 12,
    gap: 4,
  },
  levelTitle: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: freshFontFamily.extrabold,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  levelTitleCompact: {
    fontSize: 24,
    lineHeight: 29,
  },
  levelTitleVeryCompact: {
    fontSize: 21,
    lineHeight: 25,
  },
  levelSubtitle: {
    maxWidth: 340,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: freshFontFamily.medium,
    textAlign: 'center',
  },
  levelSubtitleVeryCompact: {
    fontSize: 13,
    lineHeight: 17,
  },
  statsRow: {
    width: '100%',
    flexDirection: 'row',
    gap: 14,
    marginTop: 28,
  },
  statsRowCompact: {
    gap: 10,
    marginTop: 18,
  },
  statsRowVeryCompact: {
    gap: 8,
    marginTop: 10,
  },
  statTile: {
    flex: 1,
    minHeight: 86,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 12,
    boxShadow: '0px 6px 16px rgba(40,60,110,0.07)',
  },
  statTileCompact: {
    minHeight: 66,
    borderRadius: 14,
  },
  statTileVeryCompact: {
    minHeight: 56,
  },
  statLabel: {
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    fontWeight: freshFontFamily.bold,
  },
  statValue: {
    fontSize: 26,
    lineHeight: 31,
    fontWeight: freshFontFamily.extrabold,
    letterSpacing: -0.5,
  },
  progressPanel: {
    width: '100%',
    minHeight: 92,
    borderRadius: 20,
    marginTop: 14,
    paddingHorizontal: 26,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    boxShadow: '0px 8px 20px rgba(40,60,110,0.08)',
  },
  progressPanelCompact: {
    minHeight: 68,
    borderRadius: 14,
    marginTop: 10,
    paddingHorizontal: 14,
    gap: 10,
  },
  progressPanelVeryCompact: {
    minHeight: 60,
    marginTop: 8,
    paddingHorizontal: 10,
    gap: 8,
  },
  progressCenter: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
  },
  progressTrack: {
    width: '100%',
    height: 18,
    borderRadius: 9,
    overflow: 'hidden',
  },
  progressTrackVeryCompact: {
    height: 12,
    borderRadius: 6,
  },
  progressFill: {
    height: '100%',
    borderRadius: 9,
  },
  progressLabel: {
    marginTop: 9,
    fontSize: 14,
    lineHeight: 17,
    fontWeight: freshFontFamily.bold,
    textAlign: 'center',
  },
  progressLabelVeryCompact: {
    marginTop: 5,
    fontSize: 11,
    lineHeight: 14,
  },
  levelCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  levelCircleVeryCompact: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  levelCircleText: {
    width: '100%',
    fontSize: 17,
    lineHeight: 44,
    fontWeight: freshFontFamily.extrabold,
    textAlign: 'center',
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
  levelCircleTextVeryCompact: {
    lineHeight: 36,
  },
  primaryAction: {
    width: '100%',
    minHeight: 62,
    // Full pill, matching the app's other celebratory primary actions (Check buttons,
    // dock tabs) rather than the more buttoned-down rounded-rect this used before.
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    marginTop: 22,
    flexShrink: 0,
  },
  primaryActionCompact: {
    minHeight: 52,
    marginTop: 16,
  },
  primaryActionVeryCompact: {
    minHeight: 48,
    marginTop: 10,
  },
  primaryActionText: {
    fontSize: 18,
    fontWeight: freshFontFamily.bold,
  },
  combinedSheet: {
    width: '100%',
    maxWidth: 570,
    minHeight: 0,
    borderRadius: 24,
    padding: 40,
    overflow: 'hidden',
  },
  combinedSheetCompact: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  combinedSheetVeryCompact: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  combinedBanner: {
    width: '82%',
    alignSelf: 'center',
    minHeight: 66,
    borderRadius: 16,
    paddingHorizontal: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    backgroundColor: '#2CA07B',
    boxShadow: '0px 4px 12px rgba(0,0,0,0.12)',
    zIndex: 2,
  },
  combinedBannerCompact: {
    minHeight: 52,
    paddingHorizontal: 16,
  },
  combinedBannerEmoji: {
    fontSize: 32,
  },
  combinedBannerTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: freshFontFamily.extrabold,
  },
  combinedLevelCard: {
    position: 'relative',
    borderRadius: 16,
    paddingHorizontal: 32,
    paddingTop: 56,
    paddingBottom: 32,
    marginTop: 40,
    boxShadow: '0px 8px 24px rgba(40,60,110,0.12)',
  },
  combinedLevelCardCompact: {
    paddingHorizontal: 18,
    paddingTop: 44,
    paddingBottom: 18,
    marginTop: 34,
  },
  combinedTrophy: {
    position: 'absolute',
    top: -48,
    left: '50%',
    marginLeft: -48,
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 6,
    backgroundColor: '#FFF3D6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  combinedLevelUpImage: {
    width: 68,
    height: 68,
  },
  combinedTitle: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: freshFontFamily.extrabold,
    textAlign: 'center',
    letterSpacing: -0.4,
  },
  combinedTitleCompact: {
    fontSize: 25,
    lineHeight: 31,
  },
  combinedStats: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 24,
  },
  combinedStatsCompact: {
    gap: 10,
    marginTop: 14,
  },
  combinedStat: {
    flex: 1,
    borderRadius: 12,
    minHeight: 82,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  combinedStatCompact: {
    minHeight: 62,
    paddingHorizontal: 8,
  },
  combinedStatLabel: {
    fontSize: 12,
    lineHeight: 15,
    fontWeight: freshFontFamily.extrabold,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  combinedStatValue: {
    fontSize: 26,
    lineHeight: 31,
    fontWeight: freshFontFamily.extrabold,
    marginTop: 4,
  },
  combinedProgressLabel: {
    marginTop: 24,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: freshFontFamily.semibold,
    textAlign: 'center',
  },
  combinedProgressLabelCompact: {
    marginTop: 12,
    fontSize: 12,
    lineHeight: 15,
  },
  combinedProgressTrack: {
    height: 14,
    borderRadius: 7,
    marginTop: 8,
    overflow: 'hidden',
  },
  combinedProgressTrackCompact: {
    height: 10,
    marginTop: 5,
  },
  combinedProgressFill: {
    height: '100%',
    borderRadius: 7,
  },
  combinedRewardCard: {
    position: 'relative',
    width: '64%',
    alignSelf: 'center',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 24,
    marginTop: 16,
    boxShadow: '0px 6px 18px rgba(40,60,110,0.10)',
  },
  combinedRewardCardCompact: {
    width: '72%',
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginTop: 10,
  },
  combinedNewBadge: {
    position: 'absolute',
    top: 12,
    right: 14,
    borderRadius: 10,
    backgroundColor: '#E23B3B',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  combinedNewBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: freshFontFamily.extrabold,
    letterSpacing: 0.5,
  },
  combinedRewardVisual: {
    width: 104,
    height: 104,
    borderRadius: 52,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  combinedRewardVisualCompact: {
    width: 74,
    height: 74,
    borderRadius: 37,
  },
  combinedRewardImage: {
    width: 88,
    height: 88,
  },
  combinedRewardImageCompact: {
    width: 62,
    height: 62,
  },
  combinedRewardTitle: {
    fontSize: 19,
    lineHeight: 24,
    fontWeight: freshFontFamily.extrabold,
    textAlign: 'center',
    marginTop: 16,
  },
  combinedRewardTitleCompact: {
    fontSize: 16,
    lineHeight: 20,
    marginTop: 8,
  },
  combinedRewardLabel: {
    fontSize: 15,
    lineHeight: 19,
    fontWeight: freshFontFamily.medium,
    textAlign: 'center',
    marginTop: 2,
  },
  combinedRewardLabelCompact: {
    fontSize: 12,
    lineHeight: 15,
  },
  combinedRewardAction: {
    width: '100%',
    minHeight: 52,
    borderRadius: 26,
    backgroundColor: '#2E2410',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    marginTop: 18,
  },
  combinedRewardActionCompact: {
    minHeight: 42,
    marginTop: 10,
  },
  combinedRewardActionText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: freshFontFamily.extrabold,
  },
  combinedPrimaryAction: {
    width: '88%',
    alignSelf: 'center',
    minHeight: 62,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    marginTop: 16,
    boxShadow: '0px 4px 12px rgba(40,60,110,0.20)',
  },
  combinedPrimaryActionCompact: {
    minHeight: 52,
    marginTop: 10,
  },
  combinedPrimaryActionText: {
    fontSize: 20,
    fontWeight: freshFontFamily.extrabold,
    textAlign: 'center',
  },
});
