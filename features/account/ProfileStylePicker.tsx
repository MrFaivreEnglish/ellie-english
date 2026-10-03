import { useMemo, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { toast } from 'sonner-native';
import Text from '../shared/ThemedText';
import MaterialIcons from '../shared/ThemedMaterialIcon';
import { useDesktopTypographyScale } from '../shared/DesktopTypography';
import AccountAvatar from './AccountAvatar';
import {
  ACCOUNT_AVATAR_COLOR_PRESETS,
  IMAGE_ACCOUNT_AVATAR_PRESETS,
  type AccountAvatarColorId,
  type AccountAvatarId,
} from './accountAvatarStorage';

// The avatar and colour picker that opens from the account profile.

const ALL_AVATAR_PRESETS = [...IMAGE_ACCOUNT_AVATAR_PRESETS]
  .sort((a, b) => (a.unlockLevel ?? 0) - (b.unlockLevel ?? 0));

// The tile's border and background already show the new pick, so the check only needs
// to appear — a spring zoom on every tap read as too busy.
const SELECTION_CHECK_ENTERING = FadeIn.duration(120);

// A new student used to face a wall of ~80 faded tiles. The presets are sorted by level,
// so these are the next few they'll earn; the rest wait behind "See all".
const LOCKED_AVATAR_PREVIEW_COUNT = 4;

// One id for every locked-tile toast, so tapping several in a row replaces it instead of stacking.
const LOCKED_HINT_TOAST_ID = 'account-locked-style';

type ProfileStylePickerProps = {
  colors: {
    card: string;
    surface: string;
    text: string;
    secondaryText: string;
    primary: string;
    primarySoft: string;
    border: string;
    borderStrong: string;
    warning: string;
  };
  level: number;
  levelBadgeLabel: string;
  levelBadgeColor: string;
  checkColor: string;
  checkIconColor: string;
  // What's saved, which can be a locked pick after a progress reset...
  storedAvatarId?: string | null;
  storedColorId?: string | null;
  // ...and what's shown, which falls back to an unlocked default in that case.
  selectedAvatarId: AccountAvatarId;
  selectedColorId: AccountAvatarColorId;
  onSelectAvatar: (avatarId: AccountAvatarId) => void;
  onSelectColor: (colorId: AccountAvatarColorId) => void;
  onLayout?: (y: number) => void;
};

export default function ProfileStylePicker({
  colors,
  level,
  levelBadgeLabel,
  levelBadgeColor,
  checkColor,
  checkIconColor,
  storedAvatarId,
  storedColorId,
  selectedAvatarId,
  selectedColorId,
  onSelectAvatar,
  onSelectColor,
  onLayout,
}: ProfileStylePickerProps) {
  const desktopScale = useDesktopTypographyScale();
  const [showAllAvatars, setShowAllAvatars] = useState(false);
  const [hintedLockedId, setHintedLockedId] = useState<string | null>(null);

  const lockedAvatarCount = useMemo(
    () => ALL_AVATAR_PRESETS.filter((preset) => !!preset.unlockLevel && level < preset.unlockLevel).length,
    [level]
  );
  const visibleAvatarPresets = useMemo(() => {
    if (showAllAvatars) return ALL_AVATAR_PRESETS;

    let lockedShown = 0;
    return ALL_AVATAR_PRESETS.filter((preset) => {
      if (!preset.unlockLevel || level >= preset.unlockLevel) return true;
      lockedShown += 1;
      return lockedShown <= LOCKED_AVATAR_PREVIEW_COUNT;
    });
  }, [level, showAllAvatars]);
  // The tiles used fixed sizes while the pictures, icons and badge text inside them grew
  // with the desktop scale, so on a large screen the "L26" text spilled out of its badge.
  const pickerSizes = useMemo(() => {
    const scaled = (value: number) => Math.round(value * desktopScale);
    return {
      gridGap: scaled(6),
      avatarChoice: { width: scaled(46), height: scaled(46), borderRadius: scaled(14) },
      colorChoice: { width: scaled(44), height: scaled(38), borderRadius: scaled(13) },
      colorSwatch: { width: scaled(26), height: scaled(20), borderRadius: scaled(8) },
      avatarChoiceCheck: { width: scaled(19), height: scaled(19), borderRadius: scaled(10) },
      colorChoiceCheck: { width: scaled(18), height: scaled(18), borderRadius: scaled(9) },
      lockBadge: { minWidth: scaled(34), height: scaled(17), borderRadius: scaled(8.5), paddingHorizontal: scaled(3) },
    };
  }, [desktopScale]);

  const isUnlocked = (unlockLevel?: number) => !unlockLevel || level >= unlockLevel;

  // Locked tiles used to be disabled, so a tap did nothing and students couldn't tell
  // whether the app had frozen. Now the tap explains how far away the reward is, in a
  // toast so it shows wherever the student has scrolled to in a long grid. Keep
  // `disabled` out of their accessibilityState too: TouchableOpacity treats it as the
  // disabled prop and swallows the tap. Their label already says they're locked.
  const showLockedHint = (id: string, names: { english: string; french: string }, unlockLevel?: number) => {
    if (!unlockLevel) return;
    const levelsToGo = unlockLevel - level;
    setHintedLockedId(id);
    // English as the title, French as the toast's lighter description line.
    toast(
      `${names.english} unlocks at Level ${unlockLevel}. ${levelsToGo} more ${levelsToGo === 1 ? 'level' : 'levels'} to go.`,
      {
        id: LOCKED_HINT_TOAST_ID,
        description: `${names.french} se débloque au niveau ${unlockLevel}. ${levelsToGo === 1 ? 'Plus qu’un niveau.' : `Plus que ${levelsToGo} niveaux.`}`,
      }
    );
  };

  const renderLockBadge = (unlockLevel?: number) => (
    <View style={[styles.lockBadge, pickerSizes.lockBadge, { backgroundColor: colors.secondaryText }]}>
      <MaterialIcons name="lock" size={Math.round(9 * desktopScale)} color="#fff" />
      <Text style={styles.lockBadgeText}>{unlockLevel ? `L${unlockLevel}` : ''}</Text>
    </View>
  );

  const renderAvatarChoice = (avatarId: AccountAvatarId, label: string, unlockLevel?: number) => {
    const selected = selectedAvatarId === avatarId;
    const unlocked = isUnlocked(unlockLevel);
    const hinted = hintedLockedId === avatarId;

    return (
      <TouchableOpacity
        key={avatarId}
        onPress={() => {
          if (!unlocked) {
            showLockedHint(avatarId, { english: label, french: `L’avatar « ${label} »` }, unlockLevel);
            return;
          }
          setHintedLockedId(null);
          // Compares the stored pick, not the displayed one: after a progress reset the
          // stored avatar can be locked and shown as the default, and tapping the default
          // should still save it.
          if (storedAvatarId !== avatarId) onSelectAvatar(avatarId);
        }}
        activeOpacity={0.78}
        style={[
          styles.avatarChoice,
          pickerSizes.avatarChoice,
          {
            backgroundColor: selected ? colors.primarySoft : colors.card,
            borderColor: selected ? colors.primary : hinted ? colors.warning : unlocked ? colors.border : colors.borderStrong,
          },
          !unlocked && styles.lockedChoice,
        ]}
        accessibilityRole="button"
        accessibilityLabel={unlocked ? `Choose ${label} avatar` : `${label} avatar unlocks at level ${unlockLevel}`}
        accessibilityState={{ selected }}
      >
        <AccountAvatar avatarId={avatarId} colorId={selectedColorId} size={Math.round(36 * desktopScale)} />
        {selected && (
          <Animated.View entering={SELECTION_CHECK_ENTERING} style={[styles.choiceCheck, pickerSizes.avatarChoiceCheck, { backgroundColor: checkColor }]}>
            <MaterialIcons name="check" size={Math.round(13 * desktopScale)} color={checkIconColor} />
          </Animated.View>
        )}
        {!selected && !unlocked && renderLockBadge(unlockLevel)}
      </TouchableOpacity>
    );
  };

  const renderColorChoice = (preset: (typeof ACCOUNT_AVATAR_COLOR_PRESETS)[number]) => {
    const { id: colorId, label, backgroundColor, accentColor, unlockLevel, borderWidth } = preset;
    const selected = selectedColorId === colorId;
    const unlocked = isUnlocked(unlockLevel);
    const hinted = hintedLockedId === colorId;

    return (
      <TouchableOpacity
        key={colorId}
        onPress={() => {
          if (!unlocked) {
            showLockedHint(colorId, { english: `${label} colour`, french: `La couleur « ${label} »` }, unlockLevel);
            return;
          }
          setHintedLockedId(null);
          if (storedColorId !== colorId) onSelectColor(colorId);
        }}
        activeOpacity={0.78}
        style={[
          styles.colorChoice,
          pickerSizes.colorChoice,
          {
            backgroundColor: selected ? colors.primarySoft : colors.card,
            borderColor: selected ? colors.primary : hinted ? colors.warning : unlocked ? colors.border : colors.borderStrong,
          },
          !unlocked && styles.lockedChoice,
        ]}
        accessibilityRole="button"
        accessibilityLabel={unlocked ? `Choose ${label} avatar colour` : `${label} avatar colour unlocks at level ${unlockLevel}`}
        accessibilityState={{ selected }}
      >
        <View style={[styles.colorSwatch, pickerSizes.colorSwatch, { backgroundColor, borderColor: accentColor, borderWidth: borderWidth ?? 2 }]} />
        {selected && (
          <Animated.View entering={SELECTION_CHECK_ENTERING} style={[styles.choiceCheck, pickerSizes.colorChoiceCheck, { backgroundColor: checkColor }]}>
            <MaterialIcons name="check" size={Math.round(12 * desktopScale)} color={checkIconColor} />
          </Animated.View>
        )}
        {!selected && !unlocked && renderLockBadge(unlockLevel)}
      </TouchableOpacity>
    );
  };

  return (
    <View
      style={[styles.profileCustomizer, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onLayout={(event) => onLayout?.(event.nativeEvent.layout.y)}
    >
      <View style={styles.profileEditor}>
        <View style={styles.profileEditorHeader}>
          <Text style={[styles.profileEditorTitle, { color: colors.text }]}>Profile styles</Text>
          <Text style={[styles.profileEditorMeta, { color: levelBadgeColor }]}>{levelBadgeLabel}</Text>
        </View>
        <Text style={[styles.groupLabel, { color: colors.secondaryText }]}>Colour</Text>
        <View style={[styles.colorGrid, { gap: pickerSizes.gridGap }]}>
          {ACCOUNT_AVATAR_COLOR_PRESETS.map(renderColorChoice)}
        </View>
        <Text style={[styles.groupLabel, { color: colors.secondaryText }]}>Avatars</Text>
        <View style={[styles.avatarGrid, { gap: pickerSizes.gridGap }]}>
          {visibleAvatarPresets.map((preset) => renderAvatarChoice(preset.id, preset.label, preset.unlockLevel))}
        </View>
        {lockedAvatarCount > LOCKED_AVATAR_PREVIEW_COUNT && (
          <TouchableOpacity
            onPress={() => {
              setShowAllAvatars((current) => !current);
              setHintedLockedId(null);
            }}
            activeOpacity={0.7}
            style={styles.moreButton}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            accessibilityRole="button"
            accessibilityState={{ expanded: showAllAvatars }}
          >
            <Text style={[styles.moreText, { color: colors.primary }]}>
              {showAllAvatars
                ? 'Show fewer'
                : `See all avatars (${lockedAvatarCount - LOCKED_AVATAR_PREVIEW_COUNT} more)`}
            </Text>
            <MaterialIcons
              name={showAllAvatars ? 'expand-less' : 'expand-more'}
              size={Math.round(18 * desktopScale)}
              color={colors.primary}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// Tile, swatch, check and lock-badge sizes live in pickerSizes so they follow the desktop scale.
const styles = StyleSheet.create({
  profileCustomizer: {
    borderRadius: 12,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  profileEditor: {
    padding: 9,
  },
  profileEditorHeader: {
    minHeight: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 10,
  },
  profileEditorTitle: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '900',
  },
  profileEditorMeta: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '800',
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  groupLabel: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '900',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  avatarChoice: {
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorChoice: {
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorSwatch: {
    borderWidth: 2,
  },
  lockedChoice: {
    opacity: 0.58,
  },
  moreButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 8,
    paddingVertical: 4,
  },
  moreText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '800',
  },
  choiceCheck: {
    position: 'absolute',
    right: -3,
    top: -3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockBadge: {
    position: 'absolute',
    right: -3,
    bottom: -3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
  },
  lockBadgeText: {
    color: '#fff',
    fontSize: 9,
    lineHeight: 11,
    fontWeight: '900',
  },
});
