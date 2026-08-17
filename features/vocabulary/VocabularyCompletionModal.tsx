import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, Modal, StyleSheet, Platform, Animated } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { GameState, Word } from '../../types/VocabularyTypes';
import { useAudioPlayer } from 'expo-audio';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Assets from '../../assets/index';
import { SOUND_EFFECT_OPTIONS, replaySoundEffect } from '../shared/soundEffects';
import { getXP } from '../progress/xpStorage';
import { getStreak } from '../progress/streakStorage';
import { getXPLevel, getXPLevelStats } from '../progress/xpLevels';
import LevelUpModal from '../progress/LevelUpModal';
import type { ThemeColors } from '../settings/ThemeContext';

interface CompletionModalProps {
  visible: boolean;
  gameState?: GameState;
  timerMode: boolean;
  wordsLength: number;
  isDarkMode: boolean;
  onReplay: (activateTimerMode?: boolean) => void;
  isFirstCompletion: boolean;
  isPersonalBest: boolean;
  startedTimerMode: boolean;
  bestTimeForActiveCategory?: number | null;
  matchingSessionXp?: number;
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
  unlockMessage?: string;
  statsItems?: Array<{ emoji: string; value: string | number; label: string }>;
}

// Cycled per stat tile — teal (XP-like), coral (accuracy-like), blue, amber.
const STAT_TILE_PALETTE_LIGHT = [
  { bg: '#d0fdf0', label: '#007560', value: '#006b51' },
  { bg: '#ffedea', label: '#a04034', value: '#97271b' },
  { bg: '#e5f0fc', label: '#32669a', value: '#00579a' },
  { bg: '#fff0cc', label: '#825c00', value: '#784b00' },
];
const STAT_TILE_PALETTE_DARK = [
  { bg: '#0E2E28', label: '#6FE3C4', value: '#6FE3C4' },
  { bg: '#491513', label: '#febab4', value: '#febab4' },
  { bg: '#132A42', label: '#7FC4EE', value: '#7FC4EE' },
  { bg: '#2D284F', label: '#D5C7FF', value: '#D5C7FF' },
];

const Sparkle = ({ style, delay = 0, size = 12 }: { style: any; delay?: number; size?: number }) => {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 900, delay, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [anim, delay]);

  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] });
  const scale = anim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1.1] });

  return (
    <Animated.Text style={[styles.sparkle, style, { fontSize: size, opacity, transform: [{ scale }] }]}>
      ✨
    </Animated.Text>
  );
};

const normalizeXP = (value: number) => (Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0);

export default function VocabularyCompletionModal({
  visible,
  gameState,
  timerMode,
  wordsLength,
  isDarkMode,
  onReplay,
  isPersonalBest,
  colors,
  startedTimerMode,
  matchingSessionXp = 0,
  primaryActionLabel,
  onPrimaryAction,
  secondaryActionLabel,
  onSecondaryAction,
  reviewWords = [],
  onGoToAccount,
  title,
  subtitle,
  isPerfect,
  unlockMessage,
  statsItems,
}: CompletionModalProps) {
  const bigSuccessPlayer = useAudioPlayer(Assets.bigsuccess, SOUND_EFFECT_OPTIONS);
  const bestSuccessPlayer = useAudioPlayer(Assets.bestsuccess, SOUND_EFFECT_OPTIONS);
  const insets = useSafeAreaInsets();

  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const contentScale = useRef(new Animated.Value(0.85)).current;
  const checkScale = useRef(new Animated.Value(0)).current;
  const barFillAnim = useRef(new Animated.Value(0)).current;
  const xpCountAnim = useRef(new Animated.Value(0)).current;
  const statsCardAnim = useRef(new Animated.Value(0)).current;
  const unlockRowAnim = useRef(new Animated.Value(0)).current;
  const reviewRowAnim = useRef(new Animated.Value(0)).current;
  const buttonsAnim = useRef(new Animated.Value(0)).current;

  const riseIn = (anim: Animated.Value) => ({
    opacity: anim,
    transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }],
  });
  const hasPlayedOpenSoundRef = useRef(false);
  const [displayedPersonalBest, setDisplayedPersonalBest] = useState(isPersonalBest);
  const [currentXP, setCurrentXP] = useState(0);
  const [displayedXP, setDisplayedXP] = useState(0);
  const [streakDays, setStreakDays] = useState(0);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [xpReady, setXpReady] = useState(false);
  const hasShownLevelUpRef = useRef(false);
  const pendingActionRef = useRef<(() => void) | null>(null);
  const timerModeUnlocked = !timerMode && !startedTimerMode && (gameState?.hasCompletedOnce ?? false);
  const continueButtonLabel = primaryActionLabel ?? (
    timerModeUnlocked ? 'Try Timer Mode!' : timerMode ? 'Beat Your Time!' : 'Play Again'
  );
  const earnedThisSessionXP = normalizeXP(matchingSessionXp);
  const previousXPBeforeSession = Math.max(0, currentXP - earnedThisSessionXP);
  const didLevelUpThisSession = earnedThisSessionXP > 0 && getXPLevel(previousXPBeforeSession) < getXPLevel(currentXP);
  const previousStats = React.useMemo(() => getXPLevelStats(previousXPBeforeSession), [previousXPBeforeSession]);
  const currentStats = React.useMemo(() => getXPLevelStats(currentXP), [currentXP]);
  // If a level-up happened, the "before" bar reads as this level's own start (0%) —
  // the previous level's percentage isn't on the same scale as the new level's bar.
  const barFromPercent = didLevelUpThisSession ? 0 : previousStats.progressPercent;
  const barToPercent = currentStats.progressPercent;

  useEffect(() => {
    if (!visible) {
      hasShownLevelUpRef.current = false;
      pendingActionRef.current = null;
      setXpReady(false);
      setShowLevelUp(false);
    }
  }, [visible]);

  const defaultContinueAction = () => {
    if (onPrimaryAction) { onPrimaryAction(); return; }
    onReplay(timerModeUnlocked || timerMode);
  };

  const runAfterLevelUpCheck = (action: () => void) => {
    if (didLevelUpThisSession && !hasShownLevelUpRef.current) {
      hasShownLevelUpRef.current = true;
      pendingActionRef.current = action;
      setShowLevelUp(true);
      return;
    }
    action();
  };

  const handleLevelUpDismiss = () => {
    setShowLevelUp(false);
    const action = pendingActionRef.current;
    pendingActionRef.current = null;
    action?.();
  };

  useEffect(() => {
    if (visible) setDisplayedPersonalBest(isPersonalBest);
  }, [isPersonalBest, visible]);

  useEffect(() => {
    if (!visible) return;
    let active = true;
    getXP().then((xp) => {
      if (!active) return;
      // Decide level-up vs. normal completion atomically with the XP read —
      // a level-up should be the ONLY screen shown, never a flash of
      // Exercise Complete before switching over.
      const earned = normalizeXP(matchingSessionXp);
      const before = Math.max(0, xp - earned);
      const leveledUp = earned > 0 && getXPLevel(before) < getXPLevel(xp);
      setCurrentXP(xp);
      if (leveledUp && !hasShownLevelUpRef.current) {
        hasShownLevelUpRef.current = true;
        pendingActionRef.current = defaultContinueAction;
        setShowLevelUp(true);
      }
      setXpReady(true);
    }).catch(() => { if (active) setXpReady(true); });
    getStreak().then((streak) => { if (active) setStreakDays(streak.currentStreak); }).catch(() => {});
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchingSessionXp, visible]);

  useEffect(() => {
    if (!visible) { hasPlayedOpenSoundRef.current = false; return; }
    // Wait until we know whether this completion is actually a level-up —
    // that plays its own music in LevelUpModal instead of this one.
    if (!xpReady || showLevelUp || didLevelUpThisSession) return;
    if (hasPlayedOpenSoundRef.current) return;
    hasPlayedOpenSoundRef.current = true;
    const player = (timerMode && isPersonalBest) || isPerfect ? bestSuccessPlayer : bigSuccessPlayer;
    replaySoundEffect(player);
  }, [bigSuccessPlayer, bestSuccessPlayer, isPersonalBest, visible, timerMode, isPerfect, xpReady, showLevelUp, didLevelUpThisSession]);

  useEffect(() => {
    if (!visible) return;

    backdropOpacity.setValue(0);
    contentScale.setValue(0.85);
    checkScale.setValue(0);
    barFillAnim.setValue(0);
    xpCountAnim.setValue(0);
    statsCardAnim.setValue(0);
    unlockRowAnim.setValue(0);
    reviewRowAnim.setValue(0);
    buttonsAnim.setValue(0);
    setDisplayedXP(0);

    Animated.parallel([
      Animated.timing(backdropOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.timing(contentScale, { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.spring(checkScale, { toValue: 1, friction: 6, tension: 200, delay: 100, useNativeDriver: true }),
      Animated.timing(statsCardAnim, { toValue: 1, duration: 350, delay: 250, useNativeDriver: true }),
      Animated.timing(unlockRowAnim, { toValue: 1, duration: 350, delay: 400, useNativeDriver: true }),
      Animated.timing(reviewRowAnim, { toValue: 1, duration: 350, delay: 500, useNativeDriver: true }),
      Animated.timing(buttonsAnim, { toValue: 1, duration: 350, delay: 600, useNativeDriver: true }),
    ]).start();

    const xpListener = xpCountAnim.addListener(({ value }) => {
      setDisplayedXP(Math.round(value * earnedThisSessionXP));
    });
    Animated.timing(xpCountAnim, { toValue: 1, duration: 700, delay: 400, useNativeDriver: false }).start();
    Animated.timing(barFillAnim, { toValue: 1, duration: 1000, delay: 600, useNativeDriver: false }).start();

    return () => { xpCountAnim.removeListener(xpListener); };
  }, [
    visible, backdropOpacity, contentScale, checkScale, barFillAnim, xpCountAnim, earnedThisSessionXP,
    statsCardAnim, unlockRowAnim, reviewRowAnim, buttonsAnim,
  ]);

  const isGolden = isPerfect || displayedPersonalBest;
  const defaultTitle = displayedPersonalBest ? 'New Best Time!' : 'Nice work!';
  const defaultSubtitle = displayedPersonalBest
    ? 'Your fastest match yet.'
    : `Matched all ${wordsLength} words`;

  const topPad = Platform.OS === 'web' ? 18 : Math.max(insets.top, 20) + 8;
  const botPad = Platform.OS === 'web' ? 18 : Math.max(insets.bottom, 12) + 4;

  return (
    <>
    <Modal
      visible={visible && xpReady && !showLevelUp}
      transparent={true}
      animationType="fade"
      statusBarTranslucent={true}
      presentationStyle="overFullScreen"
      hardwareAccelerated
    >
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          styles.backdrop,
          { backgroundColor: isDarkMode ? 'rgba(7,15,28,0.44)' : 'rgba(20,20,25,0.55)', opacity: backdropOpacity },
        ]}
        pointerEvents={visible ? 'auto' : 'none'}
      >
        <Animated.View
          style={[
            styles.shell,
            {
              transform: [{ scale: contentScale }],
              paddingTop: topPad,
              paddingBottom: botPad,
            },
            Platform.OS === 'web' && styles.shellWeb,
          ]}
        >
          {/* Banner */}
          <View style={[styles.banner, { backgroundColor: isGolden ? (isDarkMode ? '#44346B' : '#dca331') : (isDarkMode ? '#075A49' : '#1f9b82') }]}>
            <Sparkle style={{ top: 10, left: 80 }} size={12} delay={0} />
            <Sparkle style={{ bottom: 12, right: 24 }} size={10} delay={500} />
            <Sparkle style={{ top: 16, right: 70 }} size={9} delay={1000} />

            <Animated.View style={[styles.checkCircle, { transform: [{ scale: checkScale }] }]}>
              <MaterialIcons name="check" size={26} color="#FFFFFF" />
            </Animated.View>
            <View style={styles.bannerText}>
              <Text style={styles.bannerTitle} numberOfLines={1}>
                {title ?? defaultTitle}
              </Text>
              <Text style={styles.bannerSub} numberOfLines={2}>
                {subtitle ?? defaultSubtitle}
              </Text>
            </View>
          </View>

          {/* Stats card */}
          <Animated.View
            style={[
              styles.statsCard,
              riseIn(statsCardAnim),
              {
                backgroundColor: isDarkMode ? colors.surface : colors.card,
                boxShadow: `2px 4px 0 ${isDarkMode ? '#08131F' : '#d5cdb8'}, 0px 8px 20px rgba(0,0,0,${isDarkMode ? 0.3 : 0.08})`,
              } as any,
            ]}
          >
            {statsItems && statsItems.length > 0 && (
              <View style={styles.statsRow}>
                {statsItems.map((item, i) => {
                  const tilePalette = isDarkMode ? STAT_TILE_PALETTE_DARK : STAT_TILE_PALETTE_LIGHT;
                  const palette = tilePalette[i % tilePalette.length];
                  const isXpTile = i === 0;
                  return (
                    <View key={item.label} style={[styles.statTile, { backgroundColor: palette.bg }]}>
                      <Text style={[styles.statLabel, { color: palette.label }]} numberOfLines={1}>
                        {item.label}
                      </Text>
                      <Text style={[styles.statValue, { color: palette.value }]} numberOfLines={1}>
                        {isXpTile && typeof item.value === 'number' ? `+${displayedXP}` : item.value}
                      </Text>
                    </View>
                  );
                })}
              </View>
            )}

            {earnedThisSessionXP > 0 && (
              <View style={styles.xpBarBlock}>
                <View style={styles.xpBarRow}>
                  <Text style={[styles.xpBarLabel, { color: colors.secondaryText }]}>
                    Level {currentStats.level}
                  </Text>
                  <Text style={[styles.xpBarLabel, { color: colors.secondaryText }]}>
                    {currentStats.remainingXP} XP to level {currentStats.level + 1}
                  </Text>
                </View>
                <View style={[styles.xpBarTrack, { backgroundColor: colors.border }]}>
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
              </View>
            )}

            {streakDays > 0 && (
              <View style={[styles.streakFooter, { borderTopColor: colors.border }]}>
                <Sparkle style={styles.streakSparkleAnchor} size={18} delay={1000} />
                <Text style={[styles.streakText, { color: colors.text }]}>
                  {streakDays}-day streak — keep it going!
                </Text>
              </View>
            )}
          </Animated.View>

          {/* Unlock hint */}
          {(timerModeUnlocked || unlockMessage) && (
            <Animated.View
              style={[
                styles.unlockRow,
                riseIn(unlockRowAnim),
                { borderColor: '#E8B923', backgroundColor: isDarkMode ? 'rgba(232,185,35,0.12)' : '#FFF7DD' },
              ]}
            >
              <Text style={styles.unlockEmoji}>
                {timerModeUnlocked ? '🏅' : '🎮'}
              </Text>
              <Text style={[styles.unlockText, { color: colors.text }]} numberOfLines={2}>
                <Text style={[styles.unlockBold, styles.unlockBoldGold]}>
                  {timerModeUnlocked ? 'Timer Mode Unlocked! ' : 'Game Mode Unlocked! '}
                </Text>
                {unlockMessage ?? 'Try it for an extra challenge.'}
              </Text>
            </Animated.View>
          )}

          {/* Review words */}
          {reviewWords.length > 0 && (
            <Animated.View style={[styles.reviewRow, riseIn(reviewRowAnim), { backgroundColor: isDarkMode ? colors.surface : colors.card, borderColor: colors.border }]}>
              <MaterialIcons name="rate-review" size={14} color={colors?.primary ?? '#0D7DD4'} />
              <View style={styles.reviewChips}>
                {reviewWords.slice(0, 4).map((word) => (
                  <View
                    key={`${word.english}-${word.french}`}
                    style={[styles.chip, { borderColor: colors.border }]}
                  >
                    <Text style={[styles.chipText, { color: colors.text }]} numberOfLines={1}>
                      {word.english}
                    </Text>
                  </View>
                ))}
                {reviewWords.length > 4 && (
                  <Text style={[styles.chipMore, { color: colors.secondaryText }]}>
                    +{reviewWords.length - 4}
                  </Text>
                )}
              </View>
            </Animated.View>
          )}

          {/* Buttons */}
          <Animated.View style={[onSecondaryAction ? styles.buttonRow : styles.buttonSingle, riseIn(buttonsAnim)]}>
            {onSecondaryAction && (
              <Pressable
                style={({ pressed }) => [
                  styles.btn,
                  styles.btnSecondary,
                  styles.btnFlex,
                  { borderColor: isDarkMode ? colors.border : '#d3cdbf', backgroundColor: isDarkMode ? colors.surface : colors.card },
                  pressed && { opacity: 0.8 },
                ]}
                onPress={() => runAfterLevelUpCheck(onSecondaryAction)}
              >
                <Text style={[styles.btnText, { color: isDarkMode ? colors.text : '#3e3a2f' }]}>
                  {secondaryActionLabel ?? 'Back'}
                </Text>
              </Pressable>
            )}
            <Pressable
              style={({ pressed }) => [
                styles.btn,
                onSecondaryAction ? styles.btnFlex : styles.btnFull,
                {
                  backgroundColor: colors.buttonBackground ?? colors.primary,
                  boxShadow: `1px 2px 0 ${isDarkMode ? '#08131F' : '#0055A9'}`,
                } as any,
                pressed && { opacity: 0.85 },
              ]}
              onPress={() => runAfterLevelUpCheck(defaultContinueAction)}
            >
              <Text style={[styles.btnText, { color: colors.buttonText }]}>
                {continueButtonLabel}
              </Text>
            </Pressable>
          </Animated.View>
        </Animated.View>
      </Animated.View>
    </Modal>

      <LevelUpModal
        visible={showLevelUp}
        totalXP={currentXP}
        sessionXP={matchingSessionXp}
        colors={colors}
        isDarkMode={isDarkMode}
        onDismiss={handleLevelUpDismiss}
        dismissLabel={continueButtonLabel}
        onGoToAccount={onGoToAccount}
      />
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: 'rgba(20,20,25,0.55)',
    zIndex: 99999,
    elevation: 99999,
  },
  shell: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
    gap: 14,
    maxWidth: Platform.OS === 'web' ? 480 : undefined,
    width: '100%',
    alignSelf: 'center',
  },
  shellWeb: {
    maxWidth: 400,
  },

  sparkle: {
    position: 'absolute',
  },

  /* Banner */
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderRadius: 20,
    padding: 22,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 6,
  },
  checkCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  bannerText: {
    flex: 1,
    gap: 2,
    zIndex: 1,
  },
  bannerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
  },
  bannerSub: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.85)',
  },

  /* Stats card */
  statsCard: {
    borderRadius: 20,
    padding: 22,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statTile: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: 19,
    fontWeight: '800',
    marginTop: 2,
  },
  xpBarBlock: {
    marginTop: 18,
  },
  xpBarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  xpBarLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  xpBarTrack: {
    height: 8,
    borderRadius: 999,
    marginTop: 6,
    overflow: 'hidden',
  },
  xpBarFill: {
    height: '100%',
    borderRadius: 999,
  },
  streakFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  streakSparkleAnchor: {
    position: 'relative',
    top: 0,
    left: 0,
  },
  streakText: {
    fontSize: 13,
    fontWeight: '700',
  },

  /* Unlock hint */
  unlockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 14,
    borderWidth: 1.5,
    paddingVertical: 9,
    paddingHorizontal: 12,
  },
  unlockEmoji: {
    fontSize: 20,
    flexShrink: 0,
  },
  unlockText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  unlockBold: {
    fontWeight: '800',
  },
  unlockBoldGold: {
    color: '#B8860B',
  },

  /* Review words */
  reviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 9,
    paddingHorizontal: 12,
  },
  reviewChips: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    alignItems: 'center',
  },
  chip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    backgroundColor: 'rgba(127,127,127,0.08)',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  chipMore: {
    fontSize: 12,
    fontWeight: '700',
  },

  /* Buttons */
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  buttonSingle: {},
  btn: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSecondary: {
    borderWidth: 1.5,
  },
  btnFlex: {
    flex: 1,
  },
  btnFull: {
    width: '100%',
  },
  btnText: {
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center',
  },
});
