import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Image, Platform, Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { getAccountAvatarUnlocksBetweenLevels, type AccountAvatarPreset } from '../account/accountAvatarStorage';
import type { ThemeColors } from '../settings/ThemeContext';
import {
  MASTER_LEVEL_START,
  getLevelBadgeLabel,
  getLevelDisplayLabel,
  getMasterStarCount,
  getMasterTier,
  getMasterTierLabel,
  getXPLevel,
  getXPLevelStats,
  isMasterLevel,
} from './xpLevels';

type LevelProgressSummaryProps = {
  totalXP: number;
  sessionXP: number;
  colors?: Partial<ThemeColors>;
  isDarkMode?: boolean;
  style?: StyleProp<ViewStyle>;
  onGoToAccount?: () => void;
};

const CONFETTI_COLORS = ['#FF6B6B', '#4ECDC4', '#FFD93D', '#6BCB77', '#4D96FF', '#FF922B', '#CC5DE8', '#F7B731'];
const CONFETTI_N = 26;
const CONFETTI_PARTICLES = Array.from({ length: CONFETTI_N }, (_, i) => ({
  color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  width: i % 3 === 0 ? 7 : i % 3 === 1 ? 12 : 9,
  height: i % 3 === 0 ? 14 : i % 3 === 1 ? 7 : 9,
  isCircle: i % 5 === 0,
  angle: (i / CONFETTI_N) * Math.PI * 2,
  distance: 120 + (i % 6) * 28,
  spinDeg: (i % 2 === 0 ? 1 : -1) * (120 + (i % 4) * 45),
}));

const normalizeXP = (value: number) => {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.floor(value));
};

const getAvatarUnlockDisplayPriority = (preset: AccountAvatarPreset) => {
  if (preset.type === 'thumbnail' && preset.id.startsWith('end-')) return 0;
  if (preset.type === 'thumbnail') return 1;
  return 2;
};

const getPrimaryAvatarUnlock = (unlocks: AccountAvatarPreset[]) => {
  if (unlocks.length === 0) return null;

  return unlocks.reduce((best, candidate) => (
    getAvatarUnlockDisplayPriority(candidate) < getAvatarUnlockDisplayPriority(best)
      ? candidate
      : best
  ));
};

export default function LevelProgressSummary({
  totalXP,
  sessionXP,
  colors,
  isDarkMode = false,
  style,
  onGoToAccount,
}: LevelProgressSummaryProps) {
  const earnedXP = normalizeXP(sessionXP);
  const safeTotalXP = normalizeXP(totalXP);
  const previousXP = Math.max(0, safeTotalXP - earnedXP);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const levelBumpScale = useRef(new Animated.Value(1)).current;
  const confettiXArr = useRef(CONFETTI_PARTICLES.map(() => new Animated.Value(0))).current;
  const confettiYArr = useRef(CONFETTI_PARTICLES.map(() => new Animated.Value(0))).current;
  const confettiOpacityArr = useRef(CONFETTI_PARTICLES.map(() => new Animated.Value(0))).current;
  const confettiScaleArr = useRef(CONFETTI_PARTICLES.map(() => new Animated.Value(0))).current;
  const confettiRotArr = useRef(CONFETTI_PARTICLES.map(() => new Animated.Value(0))).current;
  const levelUpBannerScale = useRef(new Animated.Value(0.7)).current;
  const levelUpBannerOpacity = useRef(new Animated.Value(0)).current;
  const [showLevelUpBanner, setShowLevelUpBanner] = useState(false);

  const stats = useMemo(() => getXPLevelStats(safeTotalXP), [safeTotalXP]);
  const previousStats = useMemo(() => getXPLevelStats(previousXP), [previousXP]);
  const previousLevel = useMemo(() => getXPLevel(previousXP), [previousXP]);
  const didLevelUp = stats.level > previousLevel;
  const startProgress = didLevelUp ? 0 : previousStats.progressPercent;
  const [displayedLevel, setDisplayedLevel] = useState(() => didLevelUp ? previousLevel : stats.level);
  const isMaster = isMasterLevel(stats.level);
  const levelDisplayLabel = getLevelDisplayLabel(stats.level);
  const levelBadgeLabel = getLevelBadgeLabel(stats.level);
  const displayedLevelLabel = getLevelDisplayLabel(displayedLevel);
  const displayedNextLevelLabel = getLevelDisplayLabel(displayedLevel + 1);
  const masterTierLabel = getMasterTierLabel(stats.level);
  const masterStarCount = getMasterStarCount(stats.level);
  const didReachMaster = stats.level >= MASTER_LEVEL_START && previousLevel < MASTER_LEVEL_START;
  const didMasterTierUp = isMaster && getMasterTier(stats.level) > getMasterTier(previousLevel);
  const newAvatarUnlocks = useMemo(
    () => getAccountAvatarUnlocksBetweenLevels(previousLevel, stats.level),
    [previousLevel, stats.level]
  );
  const primaryAvatarUnlock = useMemo(
    () => getPrimaryAvatarUnlock(newAvatarUnlocks),
    [newAvatarUnlocks]
  );
  const extraAvatarUnlockCount = Math.max(0, newAvatarUnlocks.length - 1);
  const levelsGained = stats.level - previousLevel;
  const levelUpTitle = didReachMaster
    ? 'Ellie Master!'
    : didMasterTierUp
      ? 'Master Tier Up!'
      : levelsGained > 1
        ? `+${levelsGained} Levels!`
        : 'Level Up!';
  const levelUpSubtext = levelsGained > 1
    ? `Level ${previousLevel} → ${stats.level}`
    : `You reached ${levelDisplayLabel}`;

  useEffect(() => {
    if (!didLevelUp) {
      progressAnim.setValue(startProgress);
      Animated.timing(progressAnim, { toValue: stats.progressPercent, duration: 760, useNativeDriver: false }).start();
      return;
    }

    setDisplayedLevel(previousLevel);
    progressAnim.setValue(previousStats.progressPercent);

    const fireConfetti = () => {
      CONFETTI_PARTICLES.forEach((p, i) => {
        confettiXArr[i].setValue(0);
        confettiYArr[i].setValue(0);
        confettiOpacityArr[i].setValue(1);
        confettiScaleArr[i].setValue(0);
        confettiRotArr[i].setValue(0);
        Animated.parallel([
          Animated.spring(confettiScaleArr[i], { toValue: 1, friction: 3.5, tension: 400, useNativeDriver: Platform.OS !== 'web' }),
          Animated.timing(confettiXArr[i], { toValue: Math.cos(p.angle) * p.distance, duration: 600, useNativeDriver: Platform.OS !== 'web' }),
          Animated.timing(confettiYArr[i], { toValue: Math.sin(p.angle) * p.distance, duration: 600, useNativeDriver: Platform.OS !== 'web' }),
          Animated.timing(confettiRotArr[i], { toValue: p.spinDeg, duration: 600, useNativeDriver: Platform.OS !== 'web' }),
          Animated.sequence([
            Animated.delay(200),
            Animated.timing(confettiOpacityArr[i], { toValue: 0, duration: 400, useNativeDriver: Platform.OS !== 'web' }),
          ]),
        ]).start();
      });
    };

    const animateStep = (currentLevel: number) => {
      const isLast = currentLevel === stats.level - 1;
      Animated.sequence([
        Animated.timing(progressAnim, { toValue: 100, duration: isLast ? 680 : 320, useNativeDriver: false }),
        Animated.delay(isLast ? 380 : 80),
      ]).start(() => {
        setDisplayedLevel(currentLevel + 1);
        progressAnim.setValue(0);
        if (!isLast) {
          Animated.sequence([
            Animated.spring(levelBumpScale, { toValue: 1.25, friction: 4, tension: 350, useNativeDriver: Platform.OS !== 'web' }),
            Animated.spring(levelBumpScale, { toValue: 1, friction: 5, tension: 200, useNativeDriver: Platform.OS !== 'web' }),
          ]).start();
          animateStep(currentLevel + 1);
        } else {
          setShowLevelUpBanner(true);
          levelUpBannerScale.setValue(0.72);
          levelUpBannerOpacity.setValue(0);
          Animated.parallel([
            Animated.spring(levelUpBannerScale, { toValue: 1, friction: 4, tension: 320, useNativeDriver: Platform.OS !== 'web' }),
            Animated.timing(levelUpBannerOpacity, { toValue: 1, duration: 120, useNativeDriver: Platform.OS !== 'web' }),
          ]).start();
          fireConfetti();
          Animated.parallel([
            Animated.sequence([
              Animated.spring(levelBumpScale, { toValue: 1.55, friction: 3, tension: 300, useNativeDriver: Platform.OS !== 'web' }),
              Animated.spring(levelBumpScale, { toValue: 1, friction: 4, tension: 180, useNativeDriver: Platform.OS !== 'web' }),
            ]),
            Animated.timing(progressAnim, { toValue: stats.progressPercent, duration: 520, useNativeDriver: false }),
          ]).start();
        }
      });
    };

    animateStep(previousLevel);
  }, [didLevelUp, levelBumpScale, previousLevel, previousStats.progressPercent, progressAnim, startProgress, stats.level, stats.progressPercent]);

  if (earnedXP <= 0) return null;

  const backgroundColor = colors?.card ?? (isDarkMode ? '#0D2742' : '#FFFFFF');
  const borderColor = colors?.borderStrong ?? colors?.border ?? (isDarkMode ? '#2A5C84' : '#D7E3EE');
  const textColor = colors?.text ?? (isDarkMode ? '#F7FAFF' : '#0F172A');
  const subTextColor = colors?.secondaryText ?? (isDarkMode ? '#C9DDF0' : '#64748B');
  const primaryColor = colors?.primary ?? colors?.buttonBackground ?? '#0D7DD4';
  const successColor = colors?.success ?? '#17B8A6';
  const warningColor = colors?.warning ?? (isDarkMode ? '#FFD166' : '#F4B740');
  const warningSoftColor = colors?.warningSoft ?? (isDarkMode ? '#6B4D00' : '#FFF6DE');
  const warningTextColor = isDarkMode ? '#FFF7D6' : '#7A4B00';
  const surfaceColor = colors?.surface ?? (isDarkMode ? '#123B61' : '#F4F1EA');
  const surfaceAltColor = colors?.surfaceAlt ?? (isDarkMode ? '#1B527F' : '#EFF6FF');
  const trackColor = colors?.border ?? (isDarkMode ? '#1B527F' : '#E2E8F0');
  const progressColor = isMaster ? warningColor : primaryColor;
  const progressPercentLabel = `${stats.progressXP}/${stats.neededXP} XP`;

  return (
    <View style={[styles.card, { backgroundColor, borderColor }, style]}>
      {didLevelUp && CONFETTI_PARTICLES.map((p, i) => (
        <Animated.View
          key={i}
          style={{
            pointerEvents: 'none',
            position: 'absolute',
            top: '50%',
            left: '50%',
            marginTop: -(p.height / 2),
            marginLeft: -(p.width / 2),
            width: p.width,
            height: p.height,
            borderRadius: p.isCircle ? p.width / 2 : 2,
            backgroundColor: p.color,
            zIndex: 10,
            opacity: confettiOpacityArr[i],
            transform: [
              { translateX: confettiXArr[i] },
              { translateY: confettiYArr[i] },
              { scale: confettiScaleArr[i] },
              { rotate: confettiRotArr[i].interpolate({ inputRange: [-360, 360], outputRange: ['-360deg', '360deg'] }) },
            ],
          }}
        />
      ))}

      {showLevelUpBanner && (
        <Animated.View
          style={[
            styles.levelUpBanner,
            { backgroundColor: warningSoftColor, borderColor: warningColor },
            { opacity: levelUpBannerOpacity, transform: [{ scale: levelUpBannerScale }] },
          ]}
        >
          <Text style={styles.levelUpEmoji}>🏆</Text>
          <View style={styles.levelUpTextBlock}>
            <Text style={[styles.levelUpTitle, { color: warningTextColor }]}>{levelUpTitle}</Text>
            <Text style={[styles.levelUpText, { color: warningTextColor }]}>{levelUpSubtext}</Text>
          </View>
        </Animated.View>
      )}

      <View style={styles.heroRow}>
        <View style={[styles.xpIconBox, { backgroundColor: surfaceAltColor, borderColor }]}>
          <MaterialIcons name="bolt" size={27} color={successColor} />
        </View>

        <View style={styles.heroCopy}>
          <Text style={[styles.headerLabel, { color: subTextColor }]}>XP earned</Text>
          <Text style={[styles.xpValue, { color: successColor }]}>+{earnedXP}</Text>
        </View>

        <Animated.View style={[styles.levelPill, { backgroundColor: surfaceColor, borderColor, transform: [{ scale: levelBumpScale }] }]}>
          <Text style={[styles.levelPillLabel, { color: subTextColor }]}>Level</Text>
          <Text style={[styles.levelPillValue, { color: textColor }]}>{displayedLevel}</Text>
        </Animated.View>
      </View>

      {isMaster && (
        <View style={[styles.masterBadge, { backgroundColor: warningSoftColor, borderColor: warningColor }]}>
          <MaterialIcons name="workspace-premium" size={17} color={warningTextColor} />
          <View style={styles.masterBadgeCopy}>
            <Text style={[styles.masterBadgeTitle, { color: warningTextColor }]}>{levelBadgeLabel}</Text>
            <Text style={[styles.masterBadgeSubtitle, { color: warningTextColor }]}>
              {stats.level === MASTER_LEVEL_START ? 'Ellie Master' : masterTierLabel}
            </Text>
          </View>
          <View style={styles.masterStars}>
            {Array.from({ length: masterStarCount }).map((_, index) => (
              <MaterialIcons key={`master-star-${index}`} name="star" size={12} color={warningColor} />
            ))}
          </View>
        </View>
      )}

      {primaryAvatarUnlock && (
        <Pressable
          style={({ pressed }) => [
            styles.avatarUnlockCard,
            { backgroundColor: surfaceColor, borderColor, opacity: pressed && onGoToAccount ? 0.8 : 1 },
          ]}
          onPress={onGoToAccount ?? undefined}
          disabled={!onGoToAccount}
        >
          <View
            style={[
              styles.avatarUnlockPreview,
              {
                backgroundColor: primaryAvatarUnlock.backgroundColor,
                borderColor: primaryAvatarUnlock.accentColor,
                borderWidth: primaryAvatarUnlock.borderWidth ?? 2,
              },
            ]}
          >
            <Image
              source={primaryAvatarUnlock.image}
              style={styles.avatarUnlockImage}
              resizeMode={primaryAvatarUnlock.imageFit ?? 'cover'}
            />
          </View>
          <View style={styles.avatarUnlockCopy}>
            <Text style={[styles.avatarUnlockTitle, { color: textColor }]}>New profile picture unlocked</Text>
            <Text style={[styles.avatarUnlockText, { color: subTextColor }]}>
              {primaryAvatarUnlock.label}{extraAvatarUnlockCount > 0 ? ` and ${extraAvatarUnlockCount} more` : ''}
            </Text>
            {onGoToAccount && (
              <Text style={[styles.avatarUnlockCta, { color: primaryColor }]}>Set as picture →</Text>
            )}
          </View>
        </Pressable>
      )}

      <View style={styles.progressHeader}>
        <Text style={[styles.progressLabel, { color: textColor }]}>{displayedLevelLabel}</Text>
        <Text style={[styles.progressAmount, { color: subTextColor }]}>{progressPercentLabel}</Text>
      </View>

      <View style={[styles.progressTrack, { backgroundColor: trackColor }]}>
        <Animated.View
          style={[
            styles.progressFill,
            {
              backgroundColor: progressColor,
              width: progressAnim.interpolate({
                inputRange: [0, 100],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      </View>

      <Text style={[styles.progressText, { color: subTextColor }]}>
        {stats.remainingXP} XP to {displayedNextLevelLabel}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    maxWidth: 620,
    alignSelf: 'center',
    borderRadius: 18,
    borderWidth: 1.5,
    padding: 16,
    marginTop: 12,
    marginBottom: 10,
    boxShadow: '0px 5px 12px rgba(0,0,0,0.08)',
    elevation: 3,
  },
  levelUpBanner: {
    minHeight: 64,
    marginBottom: 13,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
    backgroundColor: '#FFE8A3',
    borderWidth: 2,
    borderColor: '#F4B942',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  levelUpEmoji: {
    fontSize: 32,
    lineHeight: 36,
  },
  levelUpTextBlock: {
    flexShrink: 1,
    alignItems: 'center',
  },
  levelUpTitle: {
    color: '#7A4B00',
    fontSize: 24,
    lineHeight: 28,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  levelUpText: {
    color: '#7A4B00',
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '700',
    textAlign: 'center',
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  xpIconBox: {
    width: 50,
    height: 50,
    borderRadius: 15,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCopy: {
    flex: 1,
    minWidth: 0,
  },
  headerLabel: {
    fontSize: 12,
    lineHeight: 15,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  xpValue: {
    marginTop: 1,
    fontSize: 32,
    lineHeight: 36,
    fontWeight: '900',
  },
  levelPill: {
    minWidth: 78,
    minHeight: 50,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelPillLabel: {
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  levelPillValue: {
    marginTop: 1,
    fontSize: 21,
    lineHeight: 24,
    fontWeight: '900',
  },
  masterBadge: {
    minHeight: 42,
    marginTop: 10,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#D79A00',
    backgroundColor: '#FFF7D7',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  masterBadgeCopy: {
    flex: 1,
    minWidth: 0,
  },
  masterBadgeTitle: {
    color: '#7A4B00',
    fontSize: 12,
    lineHeight: 15,
    fontWeight: '900',
  },
  masterBadgeSubtitle: {
    color: '#7A4B00',
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '800',
  },
  masterStars: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 1,
  },
  avatarUnlockCard: {
    minHeight: 62,
    marginTop: 12,
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatarUnlockPreview: {
    width: 44,
    height: 44,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarUnlockImage: {
    width: 38,
    height: 38,
  },
  avatarUnlockCopy: {
    flex: 1,
    minWidth: 0,
  },
  avatarUnlockTitle: {
    fontSize: 14,
    lineHeight: 17,
    fontWeight: '900',
  },
  avatarUnlockText: {
    marginTop: 2,
    fontSize: 12,
    lineHeight: 15,
    fontWeight: '800',
  },
  avatarUnlockCta: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 15,
    fontWeight: '900',
  },
  progressHeader: {
    marginTop: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  progressLabel: {
    flex: 1,
    minWidth: 0,
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '900',
  },
  progressAmount: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '800',
  },
  progressTrack: {
    width: '100%',
    height: 26,
    marginTop: 8,
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  progressText: {
    marginTop: 6,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
});
