import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Image, Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAudioPlayer } from 'expo-audio';
import Assets from '../../assets/index';
import { SOUND_EFFECT_OPTIONS, replaySoundEffect } from '../shared/soundEffects';
import { getAccountAvatarUnlocksBetweenLevels } from '../account/accountAvatarStorage';
import type { ThemeColors } from '../settings/ThemeContext';
import {
  getLevelDisplayLabel,
  getMasterTierLabel,
  getXPLevel,
  getXPLevelStats,
  isMasterLevel,
} from './xpLevels';
import {
  FRESH_COLORS,
  freshFontFamily,
  freshRadii,
  freshTileShadow,
} from '../shared/freshDirection';

type LevelUpModalProps = {
  visible: boolean;
  totalXP: number;
  sessionXP: number;
  colors: ThemeColors;
  isDarkMode: boolean;
  onDismiss: () => void;
  dismissLabel?: string;
  onGoToAccount?: () => void;
};

const normalizeXP = (value: number) => (Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0);

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
    <Animated.Text style={[{ position: 'absolute' }, style, { fontSize: size, opacity, transform: [{ scale }] }]}>
      ✨
    </Animated.Text>
  );
};

/**
 * Full-bleed "Level up!" celebration (Fresh Direction §2.15e). Reuses the
 * same before/after XP comparison LevelProgressSummary already does for its
 * inline banner — this is the bigger, dedicated version of that same event,
 * shown once after a completion modal is dismissed.
 */
export default function LevelUpModal({
  visible,
  totalXP,
  sessionXP,
  colors,
  isDarkMode,
  onDismiss,
  dismissLabel = 'Continue',
  onGoToAccount,
}: LevelUpModalProps) {
  const insets = useSafeAreaInsets();
  const levelUpPlayer = useAudioPlayer(Assets.bestsuccess, SOUND_EFFECT_OPTIONS);
  const hasPlayedSoundRef = useRef(false);
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0.9)).current;
  const trophyScale = useRef(new Animated.Value(0)).current;
  const xpCountAnim = useRef(new Animated.Value(0)).current;
  const barFillAnim = useRef(new Animated.Value(0)).current;
  const titleAnim = useRef(new Animated.Value(0)).current;
  const statsAnim = useRef(new Animated.Value(0)).current;
  const barRowAnim = useRef(new Animated.Value(0)).current;
  const unlockAnim = useRef(new Animated.Value(0)).current;
  const badgeAnim = useRef(new Animated.Value(0)).current;
  const [displayedXP, setDisplayedXP] = React.useState(0);

  const riseIn = (anim: Animated.Value) => ({
    opacity: anim,
    transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }],
  });

  const earnedXP = normalizeXP(sessionXP);
  const safeTotalXP = normalizeXP(totalXP);
  const previousXP = Math.max(0, safeTotalXP - earnedXP);
  const stats = useMemo(() => getXPLevelStats(safeTotalXP), [safeTotalXP]);
  const previousLevel = useMemo(() => getXPLevel(previousXP), [previousXP]);
  const isMaster = isMasterLevel(stats.level);
  const levelDisplayLabel = getLevelDisplayLabel(stats.level);
  const masterTierLabel = getMasterTierLabel(stats.level);
  const newAvatarUnlocks = useMemo(
    () => getAccountAvatarUnlocksBetweenLevels(previousLevel, stats.level),
    [previousLevel, stats.level]
  );
  const avatarUnlock = newAvatarUnlocks[0] ?? null;
  const extraUnlockCount = Math.max(0, newAvatarUnlocks.length - 1);

  useEffect(() => {
    if (!visible) { hasPlayedSoundRef.current = false; return; }
    if (hasPlayedSoundRef.current) return;
    hasPlayedSoundRef.current = true;
    replaySoundEffect(levelUpPlayer);
  }, [visible, levelUpPlayer]);

  useEffect(() => {
    if (!visible) return;

    backdropOpacity.setValue(0);
    cardScale.setValue(0.9);
    trophyScale.setValue(0);
    xpCountAnim.setValue(0);
    barFillAnim.setValue(0);
    titleAnim.setValue(0);
    statsAnim.setValue(0);
    barRowAnim.setValue(0);
    unlockAnim.setValue(0);
    badgeAnim.setValue(0);
    setDisplayedXP(0);

    // Everything starts at t=0 — backdrop fade, container pop, and the
    // trophy pop all run together, then each row rises in on its own delay.
    Animated.parallel([
      Animated.timing(backdropOpacity, { toValue: 1, duration: 260, useNativeDriver: true }),
      Animated.spring(cardScale, { toValue: 1, friction: 8, tension: 140, useNativeDriver: true }),
      Animated.spring(trophyScale, { toValue: 1, friction: 5, tension: 200, delay: 80, useNativeDriver: true }),
      Animated.timing(titleAnim, { toValue: 1, duration: 400, delay: 500, useNativeDriver: true }),
      Animated.timing(statsAnim, { toValue: 1, duration: 400, delay: 700, useNativeDriver: true }),
      Animated.timing(barRowAnim, { toValue: 1, duration: 400, delay: 800, useNativeDriver: true }),
      Animated.timing(unlockAnim, { toValue: 1, duration: 400, delay: 1300, useNativeDriver: true }),
      Animated.timing(badgeAnim, { toValue: 1, duration: 300, delay: 1800, useNativeDriver: true }),
    ]).start();

    const xpListener = xpCountAnim.addListener(({ value }) => {
      setDisplayedXP(Math.round(value * earnedXP));
    });
    Animated.timing(xpCountAnim, {
      toValue: 1,
      duration: 900,
      delay: 500,
      useNativeDriver: false,
    }).start();

    Animated.timing(barFillAnim, {
      toValue: 1,
      duration: 1100,
      delay: 900,
      useNativeDriver: false,
    }).start();

    return () => {
      xpCountAnim.removeListener(xpListener);
    };
  }, [
    visible, backdropOpacity, cardScale, trophyScale, xpCountAnim, barFillAnim, earnedXP,
    titleAnim, statsAnim, barRowAnim, unlockAnim, badgeAnim,
  ]);

  const cardShadow = freshTileShadow(isDarkMode ? '#000000' : FRESH_COLORS.pillWarmShadow, true);
  const topPad = Platform.OS === 'web' ? 24 : Math.max(insets.top, 20) + 12;
  const botPad = Platform.OS === 'web' ? 24 : Math.max(insets.bottom, 16) + 8;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      presentationStyle="overFullScreen"
      hardwareAccelerated
    >
      <Animated.View
        style={[StyleSheet.absoluteFill, styles.backdrop, { opacity: backdropOpacity }]}
        pointerEvents={visible ? 'auto' : 'none'}
      >
        <View style={[styles.shell, { paddingTop: topPad, paddingBottom: botPad }]}>
          <View style={[styles.banner, { backgroundColor: isDarkMode ? '#075A49' : '#1f9b82' }]}>
            <Text style={styles.bannerEmoji}>🌠</Text>
            <View style={styles.bannerText}>
              <Text style={styles.bannerTitle}>Great job!</Text>
            </View>
          </View>

          <Animated.View style={[styles.card, { backgroundColor: isDarkMode ? colors.surface : colors.card }, cardShadow, { transform: [{ scale: cardScale }] }]}>
            <Sparkle style={{ top: 14, left: 24 }} size={14} delay={0} />
            <Sparkle style={{ top: 30, right: 32 }} size={11} delay={400} />
            <Sparkle style={{ top: 8, right: 70 }} size={9} delay={900} />

            <Animated.View style={[styles.trophyRing, { transform: [{ scale: trophyScale }] }]}>
              <View
                style={[
                  styles.trophyCircle,
                  {
                    backgroundColor: '#fbeec9',
                    boxShadow: '0px 0px 0px 6px rgba(251,238,201,0.5), 0px 10px 24px rgba(251,238,201,0.6)',
                  } as any,
                ]}
              >
                <Text style={styles.trophyEmoji}>🏆</Text>
              </View>
            </Animated.View>

            <Animated.Text style={[styles.title, { color: colors.text }, riseIn(titleAnim)]}>
              {isMaster ? masterTierLabel || levelDisplayLabel : `You reached ${levelDisplayLabel}`}
            </Animated.Text>

            <Animated.View style={[styles.statsRow, riseIn(statsAnim)]}>
              <View style={[styles.statTile, { backgroundColor: isDarkMode ? '#0E2E28' : '#d0fdf0' }]}>
                <Text style={[styles.statLabel, { color: isDarkMode ? '#6FE3C4' : '#007560' }]}>XP earned</Text>
                <Text style={[styles.statValue, { color: isDarkMode ? '#6FE3C4' : '#006b51' }]}>+{displayedXP}</Text>
              </View>
              <View style={[styles.statTile, { backgroundColor: isDarkMode ? '#132A42' : '#e5f0fc' }]}>
                <Text style={[styles.statLabel, { color: isDarkMode ? '#7FC4EE' : '#32669a' }]}>Total XP</Text>
                <Text style={[styles.statValue, { color: isDarkMode ? '#7FC4EE' : '#00579a' }]}>{safeTotalXP}</Text>
              </View>
            </Animated.View>

            <Animated.View style={[styles.progressBlock, riseIn(barRowAnim)]}>
              <View style={styles.progressHeader}>
                <Text style={[styles.progressLabel, { color: colors.secondaryText }]}>
                  {stats.remainingXP} XP to next
                </Text>
              </View>
              <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
                <Animated.View
                  style={[
                    styles.progressFill,
                    {
                      width: barFillAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0%', `${stats.progressPercent}%`],
                      }),
                      backgroundColor: colors.primary,
                    },
                  ]}
                />
              </View>
            </Animated.View>

          </Animated.View>

          {avatarUnlock && (
            <Animated.View style={riseIn(unlockAnim)}>
            <Pressable
              style={({ pressed }) => [
                styles.unlockCard,
                { backgroundColor: '#fff6c8' },
                { opacity: pressed && onGoToAccount ? 0.85 : 1 },
              ]}
              onPress={() => {
                onDismiss();
                onGoToAccount?.();
              }}
              disabled={!onGoToAccount}
            >
              <View
                style={[
                  styles.unlockGlowRing,
                  { backgroundColor: 'rgba(251,238,201,0.6)' },
                ]}
                pointerEvents="none"
              />
              <Animated.View style={[styles.newBadge, riseIn(badgeAnim)]}>
                <Text style={styles.newBadgeText}>NEW</Text>
              </Animated.View>
              <View
                style={[
                  styles.unlockPreview,
                  {
                    backgroundColor: avatarUnlock.backgroundColor,
                    borderColor: avatarUnlock.accentColor,
                    borderWidth: avatarUnlock.borderWidth ?? 2,
                  },
                ]}
              >
                <Image source={avatarUnlock.image} style={styles.unlockImage} resizeMode={avatarUnlock.imageFit ?? 'cover'} />
              </View>
              <Text style={[styles.unlockTitle, { color: '#3D2F0E' }]}>Profile picture unlocked</Text>
              <Text style={[styles.unlockText, { color: '#6B5A2E' }]}>
                {avatarUnlock.label}{extraUnlockCount > 0 ? ` and ${extraUnlockCount} more` : ''}
              </Text>
              {onGoToAccount && (
                <View style={[styles.unlockCtaPill, { backgroundColor: '#3D2F0E' }]}>
                  <Text style={[styles.unlockCtaText, { color: '#FFFFFF' }]}>Set as picture</Text>
                </View>
              )}
            </Pressable>
            </Animated.View>
          )}

          <View style={styles.dismissRow}>
            <Pressable
              style={({ pressed }) => [
                styles.dismissButton,
                {
                  backgroundColor: colors.buttonBackground ?? colors.primary,
                  boxShadow: `1px 2px 0 ${isDarkMode ? '#08131F' : FRESH_COLORS.primaryBluePressed}`,
                } as any,
                pressed && { opacity: 0.85 },
              ]}
              onPress={onDismiss}
              accessibilityRole="button"
              accessibilityLabel={dismissLabel}
            >
              <Text style={[styles.dismissButtonText, { color: colors.buttonText }]}>{dismissLabel}</Text>
            </Pressable>
          </View>
        </View>
      </Animated.View>
    </Modal>
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
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  banner: {
    width: '100%',
    maxWidth: 360,
    borderRadius: freshRadii.largeTile + 1,
    padding: 22,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 6,
  },
  bannerEmoji: {
    fontSize: 34,
  },
  bannerText: {
    flex: 1,
    gap: 2,
  },
  bannerTitle: {
    fontSize: 20,
    fontWeight: freshFontFamily.extrabold,
    color: '#fff',
  },
  card: {
    width: '100%',
    maxWidth: 360,
    borderRadius: freshRadii.largeTile + 1,
    paddingHorizontal: 24,
    paddingTop: 44,
    paddingBottom: 24,
    alignItems: 'center',
    position: 'relative',
  },
  trophyRing: {
    position: 'absolute',
    top: -34,
  },
  trophyCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trophyEmoji: {
    fontSize: 36,
  },
  title: {
    fontWeight: freshFontFamily.extrabold,
    fontSize: 24,
    textAlign: 'center',
    marginTop: 6,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    marginTop: 20,
  },
  statTile: {
    flex: 1,
    borderRadius: freshRadii.card,
    paddingVertical: 12,
    alignItems: 'center',
  },
  statLabel: {
    fontWeight: freshFontFamily.bold,
    fontSize: 9.5,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  statValue: {
    fontWeight: freshFontFamily.extrabold,
    fontSize: 19,
    marginTop: 2,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
    marginTop: 18,
  },
  progressBlock: {
    width: '100%',
  },
  progressLabel: {
    fontWeight: freshFontFamily.bold,
    fontSize: 11,
  },
  progressTrack: {
    width: '100%',
    height: 14,
    borderRadius: freshRadii.pill,
    marginTop: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: freshRadii.pill,
  },
  unlockCard: {
    width: '100%',
    maxWidth: 360,
    marginTop: 14,
    borderRadius: freshRadii.largeTile + 1,
    padding: 20,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 4,
  },
  unlockGlowRing: {
    position: 'absolute',
    top: -40,
    left: '50%',
    marginLeft: -65,
    width: 130,
    height: 130,
    borderRadius: 65,
  },
  newBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#d64938',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    zIndex: 1,
  },
  newBadgeText: {
    fontSize: 9,
    fontWeight: freshFontFamily.extrabold,
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },
  unlockPreview: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 3,
  },
  unlockImage: {
    width: 70,
    height: 70,
  },
  unlockTitle: {
    fontWeight: freshFontFamily.extrabold,
    fontSize: 15,
    marginTop: 10,
    textAlign: 'center',
  },
  unlockText: {
    fontWeight: freshFontFamily.semibold,
    fontSize: 12.5,
    marginTop: 1,
    textAlign: 'center',
  },
  unlockCtaPill: {
    marginTop: 12,
    paddingHorizontal: 20,
    paddingVertical: 9,
    borderRadius: 999,
  },
  unlockCtaText: {
    fontWeight: freshFontFamily.extrabold,
    fontSize: 13,
  },
  dismissRow: {
    width: '100%',
    maxWidth: 360,
    marginTop: 14,
  },
  dismissButton: {
    width: '100%',
    borderRadius: freshRadii.pill,
    paddingVertical: 14,
    alignItems: 'center',
  },
  dismissButtonText: {
    fontWeight: freshFontFamily.extrabold,
    fontSize: 15,
  },
});
