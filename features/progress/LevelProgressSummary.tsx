import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Image, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
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
};

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
}: LevelProgressSummaryProps) {
  const earnedXP = normalizeXP(sessionXP);
  const safeTotalXP = normalizeXP(totalXP);
  const previousXP = Math.max(0, safeTotalXP - earnedXP);
  const progressAnim = useRef(new Animated.Value(0)).current;

  const stats = useMemo(() => getXPLevelStats(safeTotalXP), [safeTotalXP]);
  const previousStats = useMemo(() => getXPLevelStats(previousXP), [previousXP]);
  const previousLevel = useMemo(() => getXPLevel(previousXP), [previousXP]);
  const didLevelUp = stats.level > previousLevel;
  const startProgress = didLevelUp ? 0 : previousStats.progressPercent;
  const isMaster = isMasterLevel(stats.level);
  const levelDisplayLabel = getLevelDisplayLabel(stats.level);
  const levelBadgeLabel = getLevelBadgeLabel(stats.level);
  const nextLevelDisplayLabel = getLevelDisplayLabel(stats.level + 1);
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
  const levelUpTitle = didReachMaster
    ? 'Ellie Master!'
    : didMasterTierUp
      ? 'Master Tier Up!'
      : 'Level Up!';

  useEffect(() => {
    progressAnim.setValue(startProgress);
    Animated.timing(progressAnim, {
      toValue: stats.progressPercent,
      duration: 760,
      useNativeDriver: false,
    }).start();
  }, [progressAnim, startProgress, stats.progressPercent]);

  if (earnedXP <= 0) return null;

  const backgroundColor = colors?.card ?? (isDarkMode ? '#0D2742' : '#FFFFFF');
  const borderColor = colors?.borderStrong ?? colors?.border ?? (isDarkMode ? '#2A5C84' : '#D7E3EE');
  const textColor = colors?.text ?? (isDarkMode ? '#F7FAFF' : '#0F172A');
  const subTextColor = colors?.secondaryText ?? (isDarkMode ? '#C9DDF0' : '#64748B');
  const primaryColor = colors?.primary ?? colors?.buttonBackground ?? '#3B82F6';
  const successColor = colors?.success ?? '#24B75A';
  const surfaceColor = colors?.surface ?? (isDarkMode ? '#123B61' : '#F4F8FC');
  const surfaceAltColor = colors?.surfaceAlt ?? (isDarkMode ? '#1B527F' : '#ECF6FF');
  const trackColor = colors?.border ?? (isDarkMode ? '#1B527F' : '#D6E2EE');
  const progressColor = isMaster ? '#D79A00' : primaryColor;
  const progressPercentLabel = `${stats.progressXP}/${stats.neededXP} XP`;

  return (
    <View style={[styles.card, { backgroundColor, borderColor }, style]}>
      {didLevelUp && (
        <View style={[styles.levelUpBanner, isMaster && styles.masterLevelUpBanner]}>
          <MaterialIcons name="workspace-premium" size={22} color="#7A4B00" />
          <View style={styles.levelUpTextBlock}>
            <Text style={styles.levelUpTitle}>{levelUpTitle}</Text>
            <Text style={styles.levelUpText}>You reached {levelDisplayLabel}</Text>
          </View>
        </View>
      )}

      <View style={styles.heroRow}>
        <View style={[styles.xpIconBox, { backgroundColor: surfaceAltColor, borderColor }]}>
          <MaterialIcons name="bolt" size={27} color={successColor} />
        </View>

        <View style={styles.heroCopy}>
          <Text style={[styles.headerLabel, { color: subTextColor }]}>XP earned</Text>
          <Text style={[styles.xpValue, { color: successColor }]}>+{earnedXP}</Text>
        </View>

        <View style={[styles.levelPill, { backgroundColor: surfaceColor, borderColor }]}>
          <Text style={[styles.levelPillLabel, { color: subTextColor }]}>Level</Text>
          <Text style={[styles.levelPillValue, { color: textColor }]}>{stats.level}</Text>
        </View>
      </View>

      {isMaster && (
        <View style={styles.masterBadge}>
          <MaterialIcons name="workspace-premium" size={17} color="#8A5A00" />
          <View style={styles.masterBadgeCopy}>
            <Text style={styles.masterBadgeTitle}>{levelBadgeLabel}</Text>
            <Text style={styles.masterBadgeSubtitle}>
              {stats.level === MASTER_LEVEL_START ? 'Ellie Master' : masterTierLabel}
            </Text>
          </View>
          <View style={styles.masterStars}>
            {Array.from({ length: masterStarCount }).map((_, index) => (
              <MaterialIcons key={`master-star-${index}`} name="star" size={12} color="#B87500" />
            ))}
          </View>
        </View>
      )}

      {primaryAvatarUnlock && (
        <View style={[styles.avatarUnlockCard, { backgroundColor: surfaceColor, borderColor }]}>
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
            {primaryAvatarUnlock.type === 'thumbnail' ? (
              <Image
                source={primaryAvatarUnlock.image}
                style={styles.avatarUnlockImage}
                resizeMode={primaryAvatarUnlock.imageFit ?? 'cover'}
              />
            ) : (
              <MaterialIcons
                name={primaryAvatarUnlock.icon as React.ComponentProps<typeof MaterialIcons>['name']}
                size={24}
                color={primaryAvatarUnlock.accentColor}
              />
            )}
          </View>
          <View style={styles.avatarUnlockCopy}>
            <Text style={[styles.avatarUnlockTitle, { color: textColor }]}>New profile icon unlocked</Text>
            <Text style={[styles.avatarUnlockText, { color: subTextColor }]}>
              {primaryAvatarUnlock.label}{extraAvatarUnlockCount > 0 ? ` and ${extraAvatarUnlockCount} more` : ''}
            </Text>
          </View>
        </View>
      )}

      <View style={styles.progressHeader}>
        <Text style={[styles.progressLabel, { color: textColor }]}>{levelDisplayLabel}</Text>
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
        {stats.remainingXP} XP to {nextLevelDisplayLabel}
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  levelUpBanner: {
    minHeight: 54,
    marginBottom: 11,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 16,
    backgroundColor: '#FFE8A3',
    borderWidth: 1.5,
    borderColor: '#F4B942',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },
  masterLevelUpBanner: {
    backgroundColor: '#FFF2B8',
    borderColor: '#D79A00',
  },
  levelUpTextBlock: {
    flexShrink: 1,
  },
  levelUpTitle: {
    color: '#7A4B00',
    fontSize: 19,
    lineHeight: 22,
    fontWeight: '900',
    textAlign: 'center',
  },
  levelUpText: {
    color: '#7A4B00',
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '800',
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
    height: 12,
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
