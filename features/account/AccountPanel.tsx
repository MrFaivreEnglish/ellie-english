import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  LayoutAnimation,
  Platform,
  StyleSheet,
  TouchableOpacity,
  UIManager,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { ZoomIn } from 'react-native-reanimated';
import Text, { ThemedTextInput as TextInput } from '../shared/ThemedText';
import MaterialIcons from '../shared/ThemedMaterialIcon';
import { useDesktopTypographyScale } from '../shared/DesktopTypography';
import AccountAvatar from './AccountAvatar';
import { useAccount } from './AccountContext';
import {
  ACCOUNT_AVATAR_COLOR_PRESETS,
  IMAGE_ACCOUNT_AVATAR_PRESETS,
  getUnlockedAccountAvatarColorId,
  getUnlockedAccountAvatarId,
  type AccountAvatarColorId,
  type AccountAvatarId,
} from './accountAvatarStorage';
import { useAccountStats } from './useAccountStats';
import {
  getLevelBadgeLabel,
  getMasterStarCount,
  getMasterTierLabel,
  getNextMasterTierLevel,
  getXPLevelStats,
  isMasterLevel,
  MASTER_LEVEL_START,
} from '../progress/xpLevels';
import { getSoftShadow } from '../shared/uiPrimitives';

type AccountPanelProps = {
  colors: {
    card: string;
    surface: string;
    surfaceAlt: string;
    text: string;
    secondaryText: string;
    primary: string;
    primarySoft: string;
    border: string;
    borderStrong: string;
    shadow?: string;
    progressTrack?: string;
    success: string;
    successSoft: string;
    danger: string;
    dangerSoft: string;
    warning: string;
    warningSoft: string;
    buttonBackground?: string;
    buttonText?: string;
    visualStyle?: 'normal' | 'pixel';
  };
  isDarkMode: boolean;
  openAvatarPicker?: boolean;
  onAvatarSectionLayout?: (y: number) => void;
};

type AccountMode = 'signIn' | 'create';
type FocusedField = 'username' | 'password' | null;
type MaterialIconName = React.ComponentProps<typeof MaterialIcons>['name'];

const ACCOUNT_TOUR_SEEN_KEY = '@ellie_account_signed_in_tour_seen';

const ALL_AVATAR_PRESETS = [...IMAGE_ACCOUNT_AVATAR_PRESETS]
  .sort((a, b) => (a.unlockLevel ?? 0) - (b.unlockLevel ?? 0));


export default function AccountPanel({ colors, isDarkMode, openAvatarPicker, onAvatarSectionLayout }: AccountPanelProps) {



  const desktopScale = useDesktopTypographyScale();
  const {
    isConfigured,
    isLoading,
    isSyncing,
    syncStatus,
    session,
    error,
    lastSyncAt,
    signIn,
    createAccount,
    syncNow,
    accountAvatarColorId,
    accountAvatarId,
    updateAccountDisplayName,
    updateAccountAvatarColor,
    updateAccountAvatar,
    clearError,
  } = useAccount();
  const [mode, setMode] = useState<AccountMode>('signIn');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<FocusedField>(null);
  const { localXP, learnedSummary, grammarSummary, streak, timerBestCount } = useAccountStats(session?.user?.id, isSyncing);
  const [localMessage, setLocalMessage] = useState('');
  const [showConnectionTour, setShowConnectionTour] = useState(false);
  const [isProfileEditorOpen, setIsProfileEditorOpen] = useState(false);
  const [isNameEditorOpen, setIsNameEditorOpen] = useState(false);
  const toggleProfileEditor = useCallback(() => {
    if (Platform.OS === 'android') {
      UIManager.setLayoutAnimationEnabledExperimental?.(true);
    }
    LayoutAnimation.configureNext(
      LayoutAnimation.create(220, LayoutAnimation.Types.easeInEaseOut, LayoutAnimation.Properties.opacity)
    );
    setIsProfileEditorOpen((current) => !current);
    setIsNameEditorOpen(false);
  }, []);
  const [draftAccountName, setDraftAccountName] = useState('');

  useEffect(() => {
    if (!openAvatarPicker) return;
    setIsProfileEditorOpen(true);
  }, [openAvatarPicker]);
  const usernameInputRef = useRef<React.ElementRef<typeof TextInput>>(null);
  const passwordInputRef = useRef<React.ElementRef<typeof TextInput>>(null);
  const hasSyncedThisSessionRef = useRef(false);

  const isCreateMode = mode === 'create';
  const trimmedUsername = username.trim();
  const isUsernameTooShort = trimmedUsername.length > 0 && trimmedUsername.length < 3;
  const isPasswordTooShort = password.length > 0 && password.length < 6;
  const isSubmitDisabled =
    isSyncing ||
    !trimmedUsername ||
    !password ||
    trimmedUsername.length < 3 ||
    password.length < 6;
  const levelStats = useMemo(() => getXPLevelStats(localXP), [localXP]);
  const unlockedAccountAvatarId = useMemo(
    () => getUnlockedAccountAvatarId(accountAvatarId, levelStats.level),
    [accountAvatarId, levelStats.level]
  );
  const unlockedAccountAvatarColorId = useMemo(
    () => getUnlockedAccountAvatarColorId(accountAvatarColorId, levelStats.level),
    [accountAvatarColorId, levelStats.level]
  );
  const accountName = session?.user.displayName || session?.user.username || '';
  const cleanedDraftAccountName = draftAccountName.trim().replace(/\s+/g, ' ');
  const isNameSaveDisabled =
    isSyncing ||
    !cleanedDraftAccountName ||
    cleanedDraftAccountName.length > 40 ||
    cleanedDraftAccountName === accountName;
  const isMaster = isMasterLevel(levelStats.level);
  const levelBadgeLabel = useMemo(() => getLevelBadgeLabel(levelStats.level), [levelStats.level]);
  const masterTierLabel = useMemo(() => getMasterTierLabel(levelStats.level), [levelStats.level]);
  const masterStarCount = useMemo(() => getMasterStarCount(levelStats.level), [levelStats.level]);
  const actionButtonColor = colors.buttonBackground ?? colors.primary;
  const actionButtonTextColor = colors.buttonText ?? '#fff';
  const masterSurfaceColor = isDarkMode ? colors.warningSoft : '#FFF7D7';
  const masterTextColor = isDarkMode ? '#FFF7D6' : '#7A4B00';
  // Levels keep costing the same past 100, so the bar works for masters exactly as it does
  // for everyone else. Pinning it to 100% meant a master's only progress indicator sat
  // full and motionless for the rest of their time in the app.
  const profileProgressPercent = levelStats.progressPercent;
  const nextMasterTierLevel = useMemo(
    () => (isMaster ? getNextMasterTierLevel(levelStats.level) : null),
    [isMaster, levelStats.level]
  );
  const profileProgressNextLabel = `${levelStats.remainingXP} XP to Level ${levelStats.level + 1}`;
  // Masters get the rarer milestone on its own line — it's the thing actually worth
  // working toward once the next level is only ever 280 XP away.
  const profileProgressTierHint = isMaster && nextMasterTierLevel
    ? `${getMasterTierLabel(nextMasterTierLevel)} at Level ${nextMasterTierLevel}`
    : null;
  const streakDayLabel = streak.currentStreak === 1 ? 'day' : 'days';
  const profileProgressStats = useMemo(() => [
    {
      // XP and streak both used to be an amber flame, so the two leftmost stats read as
      // the same thing twice. XP is the bolt; the flame belongs to the streak.
      key: 'xp',
      icon: 'bolt' as MaterialIconName,
      value: `${localXP}`,
      label: 'Total XP',
      accent: colors.warning,
    },
    {
      key: 'streak',
      icon: 'local-fire-department' as MaterialIconName,
      value: `${streak.currentStreak}`,
      label: `Streak (${streakDayLabel})`,
      accent: colors.danger,
    },
    {
      key: 'learnt',
      icon: 'style' as MaterialIconName,
      value: `${learnedSummary.totalLearned}`,
      label: 'Words learnt',
      accent: colors.success,
    },
    {
      key: 'answers',
      icon: 'edit' as MaterialIconName,
      value: `${grammarSummary.totalCorrectAnswers}`,
      label: 'Saved answers',
      accent: colors.primary,
    },
  ], [
    colors.primary,
    colors.success,
    colors.warning,
    grammarSummary.totalCorrectAnswers,
    learnedSummary.totalLearned,
    localXP,
    streak.currentStreak,
    streakDayLabel,
  ]);
  const backupSummary = useMemo(
    () =>
      `${grammarSummary.totalCorrectAnswers} grammar answers, ${learnedSummary.totalLearned} learnt words, ${timerBestCount} best times, and ${localXP} revision points.`,
    [grammarSummary.totalCorrectAnswers, learnedSummary.totalLearned, localXP, timerBestCount]
  );
  const formCopy = useMemo(() => ({
    title: isCreateMode ? 'Create account' : 'Log in',
    subtitle: isCreateMode ? 'Start a fresh online backup.' : 'Open your online backup here.',
    status: isCreateMode
      ? 'New backup'
      : 'Existing backup',
    submitLabel: isCreateMode ? 'Create account' : 'Log in',
    submitIcon: isCreateMode ? 'cloud-upload' as const : 'login' as const,
  }), [isCreateMode]);
  const hasAuthValidationWarning = isUsernameTooShort || isPasswordTooShort;
  const authSupportText = isUsernameTooShort
    ? 'Username needs at least 3 characters.'
    : 'Password needs at least 6 characters.';
  const authSupportIcon: React.ComponentProps<typeof MaterialIcons>['name'] = 'error-outline';
  const syncCopy = useMemo(() => {
    if (!session) {
      return {
        icon: 'phone-iphone' as const,
        color: colors.primary,
        text: 'Your work is saved on this device.',
      };
    }

    if (isSyncing || syncStatus === 'syncing') {
      return {
        icon: 'sync' as const,
        color: colors.primary,
        text: 'Saving an online copy...',
      };
    }

    if (syncStatus === 'failed' || !!error) {
      return {
        icon: 'error-outline' as const,
        color: colors.danger,
        text: 'Backup did not work. Tap Retry.',
      };
    }

    if (lastSyncAt) {
      return {
        icon: 'cloud-done' as const,
        color: colors.success,
        text: `Backed up online at ${lastSyncAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      };
    }

    return {
      icon: 'cloud-queue' as const,
      color: colors.primary,
      text: 'Online copy not saved yet.',
    };
  }, [colors.danger, colors.primary, colors.success, error, isSyncing, lastSyncAt, session, syncStatus]);

  useEffect(() => {
    setDraftAccountName(accountName);
    setIsNameEditorOpen(false);
    hasSyncedThisSessionRef.current = false;
  }, [accountName, session?.user.id]);

  useEffect(() => {
    let active = true;

    if (!session) {
      setShowConnectionTour(false);
      return () => {
        active = false;
      };
    }

    AsyncStorage.getItem(ACCOUNT_TOUR_SEEN_KEY).then((value) => {
      if (!active) return;
      setShowConnectionTour(value !== 'true');
    }).catch(() => {
      if (!active) return;
      setShowConnectionTour(true);
    });

    return () => {
      active = false;
    };
  }, [session]);

  const resetForm = useCallback(() => {
    setUsername('');
    setPassword('');
    setShowPassword(false);
    setFocusedField(null);
  }, []);

  const setModeAndClearFeedback = useCallback((nextMode: AccountMode) => {
    setMode(nextMode);
    setLocalMessage('');
    clearError();
  }, [clearError]);

  const submit = useCallback(async () => {
    setLocalMessage('');
    clearError();

    try {
      if (isCreateMode) {
        await createAccount(trimmedUsername, password);
        setLocalMessage('Account made. Fresh online progress loaded.');
      } else {
        await signIn(trimmedUsername, password);
      }

      resetForm();
    } catch {

    }
  }, [
    clearError,
    createAccount,
    isCreateMode,
    password,
    resetForm,
    signIn,
    trimmedUsername,
  ]);

  const runSync = useCallback(async () => {
    hasSyncedThisSessionRef.current = true;
    setLocalMessage('');
    clearError();

    try {
      await syncNow();
      setLocalMessage('Backed up online.');
    } catch {

    }
  }, [clearError, syncNow]);

  const dismissConnectionTour = useCallback(() => {
    setShowConnectionTour(false);
    AsyncStorage.setItem(ACCOUNT_TOUR_SEEN_KEY, 'true').catch(() => {});
  }, []);

  const openNameEditor = useCallback(() => {
    setDraftAccountName(accountName);
    setIsNameEditorOpen(true);
    setIsProfileEditorOpen(false);
    setLocalMessage('');
    clearError();
  }, [accountName, clearError]);

  const closeNameEditor = useCallback(() => {
    setDraftAccountName(accountName);
    setIsNameEditorOpen(false);
    clearError();
  }, [accountName, clearError]);

  const submitAccountName = useCallback(async () => {
    if (isNameSaveDisabled) return;

    setLocalMessage('');
    clearError();

    try {
      await updateAccountDisplayName(cleanedDraftAccountName);
      setIsNameEditorOpen(false);
      setLocalMessage('Name updated.');
    } catch {

    }
  }, [cleanedDraftAccountName, clearError, isNameSaveDisabled, updateAccountDisplayName]);

  const confirmSync = useCallback(() => {
    const title = syncStatus === 'failed' || error ? 'Try backup again?' : 'Save online copy?';
    const message = [
      'This saves a copy of:',
      backupSummary,
      '',
      'Only progress already tied to this account is backed up.',
      'It keeps the highest revision-points total and the fastest times for this account.',
    ].join('\n');

    if (Platform.OS === 'web') {
      const confirmed = typeof window !== 'undefined' ? window.confirm(`${title}\n\n${message}`) : true;
      if (confirmed) void runSync();
      return;
    }

    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel' },
      { text: syncStatus === 'failed' || error ? 'Try again' : 'Save copy', onPress: () => void runSync() },
    ]);
  }, [backupSummary, error, runSync, syncStatus]);

  const handleSyncPress = useCallback(() => {
    const needsConfirmation = !hasSyncedThisSessionRef.current || syncStatus === 'failed' || !!error;
    if (needsConfirmation) {
      confirmSync();
    } else {
      void runSync();
    }
  }, [confirmSync, error, runSync, syncStatus]);

  const renderMasterStars = (size = 11) => {
    if (!isMaster) return null;

    return (
      <View style={styles.masterStars}>
        {Array.from({ length: masterStarCount }).map((_, index) => (
          <MaterialIcons key={`account-master-star-${index}`} name="star" size={size} color={colors.warning} />
        ))}
      </View>
    );
  };

  const renderMasterProfileBadge = () => {
    if (!isMaster) return null;

    return (
      // The level number is already in the pill above and the progress line below — saying
      // it a third time here left a wide banner carrying no information of its own. This
      // row is the rank: title, tier, stars.
      <View style={[styles.masterProfileBadge, { backgroundColor: masterSurfaceColor, borderColor: colors.warning }]}>
        <MaterialIcons name="workspace-premium" size={Math.round(16 * desktopScale)} color={masterTextColor} />
        <Text style={[styles.masterProfileBadgeText, { color: masterTextColor }]} numberOfLines={1}>
          Ellie Master
        </Text>
        {levelStats.level > MASTER_LEVEL_START && !!masterTierLabel && (
          <Text style={[styles.masterProfileBadgeSubtext, { color: masterTextColor }]} numberOfLines={1}>
            {masterTierLabel}
          </Text>
        )}
        {renderMasterStars()}
      </View>
    );
  };

  const renderProfileProgress = () => (
    <View
      style={[
        styles.profileProgressCard,
        getSoftShadow(isDarkMode, 'soft', colors.shadow ?? colors.border, colors.visualStyle === 'pixel'),
        {
          backgroundColor: colors.card,
          borderColor: isMaster ? colors.warning : colors.border,
        },
      ]}
    >
      <View style={styles.profileProgressHeader}>
        <View style={styles.profileProgressTitleBlock}>
          <Text style={[styles.profileProgressTitle, { color: colors.text }]}>Profile progress</Text>
        </View>
        <View
          style={[
            styles.profileProgressXpPill,
            {
              backgroundColor: isMaster ? masterSurfaceColor : colors.primarySoft,
              borderColor: isMaster ? colors.warning : colors.borderStrong,
            },
          ]}
        >
          <Text style={[styles.profileProgressXpText, { color: isMaster ? masterTextColor : colors.primary }]}>
            {levelBadgeLabel.replace('Level ', 'Lv.')}
          </Text>
        </View>
      </View>

      {renderMasterProfileBadge()}

      <View style={[styles.progressTrackLarge, { backgroundColor: colors.progressTrack ?? colors.border }]}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${profileProgressPercent}%`,
              backgroundColor: isMaster ? colors.warning : colors.primary,
            },
          ]}
        />
      </View>
      <View style={styles.profileProgressFooterRow}>
        <Text style={[styles.profileProgressNextText, { color: colors.secondaryText }]} numberOfLines={1}>
          {profileProgressNextLabel}
        </Text>
        <Text style={[styles.profileProgressValueText, { color: colors.secondaryText }]} numberOfLines={1}>
          {levelStats.progressXP} / {levelStats.neededXP} XP
        </Text>
      </View>
      {!!profileProgressTierHint && (
        <Text
          style={[styles.profileProgressTierHint, { color: isMaster ? masterTextColor : colors.secondaryText }]}
          numberOfLines={1}
        >
          {profileProgressTierHint}
        </Text>
      )}

      <View style={[styles.profileProgressStatsRow, { borderTopColor: colors.border }]}>
        {profileProgressStats.map((stat, index) => (
          <View
            key={stat.key}
            style={[
              styles.profileProgressStatItem,
              index > 0 && {
                borderLeftColor: colors.border,
                borderLeftWidth: StyleSheet.hairlineWidth,
              },
            ]}
          >
            <MaterialIcons name={stat.icon} size={Math.round(18 * desktopScale)} color={stat.accent} />
            <Text style={[styles.profileProgressStatValue, { color: colors.text }]} numberOfLines={1}>
              {stat.value}
            </Text>
            <Text style={[styles.profileProgressStatLabel, { color: colors.secondaryText }]} numberOfLines={2}>
              {stat.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );

  const isUnlocked = (unlockLevel?: number) => !unlockLevel || levelStats.level >= unlockLevel;

  const renderAvatarChoice = (avatarId: AccountAvatarId, label: string, unlockLevel?: number) => {
    const selected = unlockedAccountAvatarId === avatarId;
    const unlocked = isUnlocked(unlockLevel);
    const lockLabel = unlockLevel ? `Level ${unlockLevel}` : '';

    return (
      <TouchableOpacity
        key={avatarId}
        onPress={() => {
          if (unlocked) void updateAccountAvatar(avatarId);
        }}
        disabled={!unlocked}
        activeOpacity={unlocked ? 0.78 : 1}
        style={[
          styles.avatarChoice,
          {
            backgroundColor: selected ? colors.primarySoft : colors.card,
            borderColor: selected ? colors.primary : unlocked ? colors.border : colors.borderStrong,
          },
          !unlocked && styles.lockedChoice,
        ]}
        accessibilityRole="button"
        accessibilityLabel={unlocked ? `Choose ${label} avatar` : `${label} avatar unlocks at level ${unlockLevel}`}
        accessibilityState={{ selected, disabled: !unlocked }}
      >
        <AccountAvatar avatarId={avatarId} colorId={unlockedAccountAvatarColorId} size={Math.round(36 * desktopScale)} />
        {selected && (
          <Animated.View entering={ZoomIn.springify().damping(12)} style={[styles.avatarChoiceCheck, { backgroundColor: actionButtonColor }]}>
            <MaterialIcons name="check" size={Math.round(13 * desktopScale)} color={actionButtonTextColor} />
          </Animated.View>
        )}
        {!selected && !unlocked && (
          <View style={[styles.lockBadge, { backgroundColor: colors.secondaryText }]}>
            <MaterialIcons name="lock" size={Math.round(9 * desktopScale)} color="#fff" />
            <Text style={styles.lockBadgeText}>{lockLabel.replace('Level ', 'L')}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderColorChoice = (
    colorId: AccountAvatarColorId,
    label: string,
    backgroundColor: string,
    accentColor: string,
    unlockLevel?: number,
    borderWidth?: number
  ) => {
    const selected = unlockedAccountAvatarColorId === colorId;
    const unlocked = isUnlocked(unlockLevel);
    const lockLabel = unlockLevel ? `Level ${unlockLevel}` : '';

    return (
      <TouchableOpacity
        key={colorId}
        onPress={() => {
          if (unlocked) void updateAccountAvatarColor(colorId);
        }}
        disabled={!unlocked}
        activeOpacity={unlocked ? 0.78 : 1}
        style={[
          styles.colorChoice,
          {
            backgroundColor: selected ? colors.primarySoft : colors.card,
            borderColor: selected ? colors.primary : unlocked ? colors.border : colors.borderStrong,
          },
          !unlocked && styles.lockedChoice,
        ]}
        accessibilityRole="button"
        accessibilityLabel={unlocked ? `Choose ${label} avatar colour` : `${label} avatar colour unlocks at level ${unlockLevel}`}
        accessibilityState={{ selected, disabled: !unlocked }}
      >
        <View style={[styles.colorSwatch, { backgroundColor, borderColor: accentColor, borderWidth: borderWidth ?? 2 }]} />
        {selected && (
          <Animated.View entering={ZoomIn.springify().damping(12)} style={[styles.colorChoiceCheck, { backgroundColor: actionButtonColor }]}>
            <MaterialIcons name="check" size={Math.round(12 * desktopScale)} color={actionButtonTextColor} />
          </Animated.View>
        )}
        {!selected && !unlocked && (
          <View style={[styles.lockBadge, { backgroundColor: colors.secondaryText }]}>
            <MaterialIcons name="lock" size={Math.round(9 * desktopScale)} color="#fff" />
            <Text style={styles.lockBadgeText}>{lockLabel.replace('Level ', 'L')}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderProfileCustomizer = () => !isProfileEditorOpen ? null : (
    <View
      style={[styles.profileCustomizer, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onLayout={(event) => onAvatarSectionLayout?.(event.nativeEvent.layout.y)}
    >
      <View style={styles.profileEditor}>
        <View style={styles.profileEditorHeader}>
          <Text style={[styles.profileEditorTitle, { color: colors.text }]}>Profile styles</Text>
          <Text style={[styles.profileEditorMeta, { color: isMaster ? masterTextColor : colors.secondaryText }]}>
            {levelBadgeLabel}
          </Text>
        </View>
        <Text style={[styles.avatarGroupLabel, { color: colors.secondaryText }]}>Colour</Text>
        <View style={styles.colorGrid}>
          {ACCOUNT_AVATAR_COLOR_PRESETS.map((preset) =>
            renderColorChoice(
              preset.id,
              preset.label,
              preset.backgroundColor,
              preset.accentColor,
              preset.unlockLevel,
              preset.borderWidth
            )
          )}
        </View>
        <Text style={[styles.avatarGroupLabel, { color: colors.secondaryText }]}>Avatars</Text>
        <View style={styles.avatarGrid}>
          {ALL_AVATAR_PRESETS.map((preset) =>
            renderAvatarChoice(preset.id, preset.label, preset.unlockLevel)
          )}
        </View>
      </View>
    </View>
  );

  const renderLocalProfileOverview = () => (
    <View style={[styles.accountOverview, { backgroundColor: colors.surface }]}>
      <View style={styles.dashboardHeroTop}>
        <View style={styles.identityCluster}>
          <TouchableOpacity
            onPress={toggleProfileEditor}
            activeOpacity={0.82}
            style={styles.avatarEditButton}
            accessibilityRole="button"
            accessibilityLabel={isProfileEditorOpen ? 'Close avatar editor' : 'Edit local avatar and colour'}
            accessibilityState={{ expanded: isProfileEditorOpen }}
          >
            <AccountAvatar avatarId={unlockedAccountAvatarId} colorId={unlockedAccountAvatarColorId} size={Math.round(64 * desktopScale)} />
            <View
              style={[
                styles.avatarEditBadge,
                {
                  backgroundColor: isProfileEditorOpen ? colors.success : colors.primary,
                  borderColor: colors.surface,
                },
              ]}
            >
              <MaterialIcons name={isProfileEditorOpen ? 'done' : 'palette'} size={Math.round(14 * desktopScale)} color="#fff" />
            </View>
          </TouchableOpacity>
          <View style={styles.identityCopy}>
            <Text style={[styles.dashboardGreeting, { color: colors.text }]} numberOfLines={1}>
              Local profile
            </Text>
          </View>
        </View>
        <View style={[styles.accountStatusPill, { backgroundColor: colors.primarySoft, borderColor: colors.primary }]}>
          <MaterialIcons name="phone-iphone" size={Math.round(15 * desktopScale)} color={colors.primary} />
          <Text style={[styles.accountStatusText, { color: colors.primary }]}>Device</Text>
        </View>
      </View>

      {renderProfileProgress()}
    </View>
  );

  const renderTextInput = ({
    icon,
    field,
    value,
    onChangeText,
    placeholder,
    secureTextEntry,
    returnKeyType,
  }: {
    icon: React.ComponentProps<typeof MaterialIcons>['name'];
    field: Exclude<FocusedField, null>;
    value: string;
    onChangeText: (value: string) => void;
    placeholder: string;
    secureTextEntry?: boolean;
    returnKeyType?: 'next' | 'done';
  }) => {
    const focused = focusedField === field;
    const isPasswordField = field === 'password';
    const inputRef = isPasswordField ? passwordInputRef : usernameInputRef;

    return (
      <TouchableOpacity
        activeOpacity={1}
        onPress={() => inputRef.current?.focus()}
        style={[
          styles.inputShell,
          {
            backgroundColor: isDarkMode ? colors.surface : '#fff',
            borderColor: focused ? colors.primary : colors.border,
          },
          focused && getSoftShadow(isDarkMode, 'soft', colors.shadow ?? colors.border, colors.visualStyle === 'pixel'),
        ]}
      >
        <View style={[styles.inputIconBox, { backgroundColor: focused ? colors.primarySoft : colors.surface }]}>
          <MaterialIcons name={icon} size={Math.round(19 * desktopScale)} color={focused ? colors.primary : colors.secondaryText} />
        </View>
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setFocusedField(field)}
          onBlur={() => setFocusedField(null)}
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry={secureTextEntry && !showPassword}
          placeholder={placeholder}
          placeholderTextColor={isDarkMode ? '#FFFFFF' : colors.secondaryText}
          returnKeyType={returnKeyType}
          showSoftInputOnFocus
          textContentType={isPasswordField ? 'password' : 'username'}
          autoComplete={isPasswordField ? 'password' : 'username'}
          importantForAutofill="yes"
          onSubmitEditing={
            isPasswordField
              ? !isSubmitDisabled ? submit : undefined
              : () => passwordInputRef.current?.focus()
          }
          style={[styles.input, { color: isDarkMode ? '#FFFFFF' : colors.text }, { outlineStyle: 'none' } as any]}
        />
        {isPasswordField && (
          <TouchableOpacity
            onPress={() => setShowPassword((current) => !current)}
            style={styles.iconButton}
            accessibilityRole="button"
            accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
          >
            <MaterialIcons
              name={showPassword ? 'visibility-off' : 'visibility'}
              size={Math.round(20 * desktopScale)}
              color={colors.secondaryText}
            />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  if (!isConfigured) {
    return (
      <View style={styles.dashboardCard}>
        {renderLocalProfileOverview()}
        <View style={styles.dashboardBody}>
          {renderProfileCustomizer()}
          <View style={[styles.mergePanel, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
            <MaterialIcons name="cloud-off" size={Math.round(19 * desktopScale)} color={colors.primary} />
            <Text style={[styles.mergePanelText, { color: colors.secondaryText }]}>
              Ask your teacher to turn on online accounts for online backup.
            </Text>
          </View>
        </View>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={[styles.card, styles.loadingCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <ActivityIndicator color={colors.primary} />
        <Text style={[styles.description, { color: colors.secondaryText }]}>Checking your account...</Text>
      </View>
    );
  }

  if (session) {
    return (
      <View style={styles.dashboardCard}>
        <View style={[styles.accountOverview, { backgroundColor: colors.surface }]}>
          <View style={styles.dashboardHeroTop}>
            <View style={styles.identityCluster}>
              <TouchableOpacity
                onPress={toggleProfileEditor}
                activeOpacity={0.82}
                style={styles.avatarEditButton}
                accessibilityRole="button"
                accessibilityLabel={isProfileEditorOpen ? 'Close avatar editor' : 'Edit avatar and colour'}
                accessibilityState={{ expanded: isProfileEditorOpen }}
              >
                <AccountAvatar avatarId={unlockedAccountAvatarId} colorId={unlockedAccountAvatarColorId} size={Math.round(64 * desktopScale)} />
                <View
                  style={[
                    styles.avatarEditBadge,
                    {
                      backgroundColor: isProfileEditorOpen ? colors.success : colors.primary,
                      borderColor: colors.surface,
                    },
                  ]}
                >
                  <MaterialIcons name={isProfileEditorOpen ? 'done' : 'palette'} size={Math.round(14 * desktopScale)} color="#fff" />
                </View>
              </TouchableOpacity>
              <View style={styles.identityCopy}>
                {isNameEditorOpen ? (
                  <View
                    style={[
                      styles.identityNameButton,
                      styles.identityNameEditorPill,
                      getSoftShadow(isDarkMode, 'soft', colors.shadow ?? colors.border, colors.visualStyle === 'pixel'),
                      {
                        backgroundColor: colors.primarySoft,
                        borderColor: colors.primary,
                      },
                    ]}
                  >
                    <TextInput
                      value={draftAccountName}
                      onChangeText={setDraftAccountName}
                      placeholder="Account name"
                      placeholderTextColor={colors.secondaryText}
                      autoCapitalize="words"
                      autoCorrect={false}
                      autoFocus
                      showSoftInputOnFocus
                      selectTextOnFocus
                      returnKeyType="done"
                      onSubmitEditing={submitAccountName}
                      maxLength={40}
                      style={[styles.inlineNameInput, { color: colors.text }, { outlineStyle: 'none' } as any]}
                    />
                    <TouchableOpacity
                      onPress={closeNameEditor}
                      disabled={isSyncing}
                      style={[styles.identityPillAction, { backgroundColor: colors.surface, borderColor: colors.border }]}
                      accessibilityRole="button"
                      accessibilityLabel="Cancel name edit"
                    >
                      <MaterialIcons name="close" size={Math.round(15 * desktopScale)} color={colors.secondaryText} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={submitAccountName}
                      disabled={isNameSaveDisabled}
                      style={[
                        styles.identityPillAction,
                        { backgroundColor: actionButtonColor, borderColor: actionButtonColor },
                        isNameSaveDisabled && styles.disabledButton,
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel="Save account name"
                    >
                      {isSyncing ? (
                        <ActivityIndicator color={actionButtonTextColor} size="small" />
                      ) : (
                        <MaterialIcons name="check" size={Math.round(16 * desktopScale)} color={actionButtonTextColor} />
                      )}
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={openNameEditor}
                    activeOpacity={0.82}
                    style={[
                      styles.identityNameButton,
                      {
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                      },
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel="Edit account name"
                  >
                    <Text style={[styles.dashboardGreeting, { color: colors.text }]} numberOfLines={1}>
                      {accountName}
                    </Text>
                    <View
                      style={[
                        styles.identityNameIcon,
                        {
                          backgroundColor: colors.surface,
                          borderColor: colors.border,
                        },
                      ]}
                    >
                      <MaterialIcons name="edit" size={Math.round(15 * desktopScale)} color={colors.primary} />
                    </View>
                  </TouchableOpacity>
                )}
                <View style={styles.identityMetaRow}>
                  <MaterialIcons name="alternate-email" size={Math.round(13 * desktopScale)} color={colors.secondaryText} />
                  <Text style={[styles.identityMeta, { color: colors.secondaryText }]} numberOfLines={1}>
                    {session.user.username}
                  </Text>
                </View>
              </View>
            </View>
            <View style={[styles.accountStatusPill, { backgroundColor: colors.successSoft, borderColor: colors.success }]}>
              <MaterialIcons name="cloud-done" size={Math.round(15 * desktopScale)} color={colors.success} />
              <Text style={[styles.accountStatusText, { color: colors.success }]}>Online</Text>
            </View>
          </View>

          {renderProfileProgress()}
        </View>

        <View style={styles.dashboardBody}>
          {showConnectionTour && (
            <View style={[styles.tourCard, { backgroundColor: colors.successSoft, borderColor: colors.success }]}>
              <View style={[styles.tourStepIcon, { backgroundColor: colors.card }]}>
                <MaterialIcons name="tips-and-updates" size={Math.round(18 * desktopScale)} color={colors.success} />
              </View>
              <View style={styles.tourHeaderCopy}>
                <Text style={[styles.tourTitle, { color: colors.text }]}>Account connected</Text>
                <Text style={[styles.tourStepText, { color: colors.secondaryText }]}>
                  Work saves here first. Tap Sync before using another device.
                </Text>
              </View>
              <TouchableOpacity
                onPress={dismissConnectionTour}
                style={[styles.tourDismissButton, { backgroundColor: colors.card, borderColor: colors.success }]}
                accessibilityRole="button"
                accessibilityLabel="Finish account tutorial"
              >
                <Text style={[styles.tourDismissText, { color: colors.success }]}>OK</Text>
              </TouchableOpacity>
            </View>
          )}

          {renderProfileCustomizer()}

          <View
            style={[
              styles.backupPanel,
              getSoftShadow(isDarkMode, 'soft', colors.shadow ?? colors.border, colors.visualStyle === 'pixel'),
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View style={[styles.backupIconDisc, { backgroundColor: colors.primarySoft }]}>
              <MaterialIcons name={syncCopy.icon} size={Math.round(24 * desktopScale)} color={syncCopy.color} />
            </View>
            <View style={styles.backupCopy}>
              <Text style={[styles.backupTitle, { color: colors.text }]}>Backup status</Text>
              <Text style={[styles.backupText, { color: colors.secondaryText }]}>{syncCopy.text}</Text>
            </View>
            <TouchableOpacity
              onPress={handleSyncPress}
              disabled={isSyncing}
              style={[styles.backupActionButton, { backgroundColor: actionButtonColor }]}
              accessibilityRole="button"
              accessibilityLabel="Sync account progress now"
            >
              {isSyncing ? (
                <ActivityIndicator color={actionButtonTextColor} />
              ) : (
                <>
                  <MaterialIcons name="sync" size={Math.round(17 * desktopScale)} color={actionButtonTextColor} />
                  <Text style={[styles.backupActionText, { color: actionButtonTextColor }]}>
                    {syncStatus === 'failed' || error ? 'Retry' : 'Sync'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <View style={[styles.mergePanel, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
            <MaterialIcons name="devices" size={Math.round(19 * desktopScale)} color={colors.primary} />
            <Text style={[styles.mergePanelText, { color: colors.secondaryText }]}>
              On another device, log in with the same account to combine progress.
            </Text>
          </View>

          {!!localMessage && <Text style={[styles.successText, { color: colors.primary }]}>{localMessage}</Text>}
          {!!error && (
            <Text style={[styles.errorText, { color: colors.danger, backgroundColor: colors.dangerSoft }]}>
              {error}
            </Text>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.authShell}>
      {renderLocalProfileOverview()}
      <View style={styles.authBody}>
        {renderProfileCustomizer()}
        <View
          style={[
            styles.authCard,
            styles.authCardSurface,
            getSoftShadow(isDarkMode, 'soft', colors.shadow ?? colors.border, colors.visualStyle === 'pixel'),
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
        <View style={styles.authCardHeader}>
          <View style={styles.authTitleBlock}>
            <Text style={[styles.authEyebrow, { color: colors.primary }]}>{formCopy.status}</Text>
            <Text style={[styles.authTitle, { color: colors.text }]}>{formCopy.title}</Text>
            <Text style={[styles.authSubtitle, { color: colors.secondaryText }]}>{formCopy.subtitle}</Text>
          </View>
          <View style={[styles.authActionIcon, { backgroundColor: colors.primarySoft, borderColor: colors.primary }]}>
            <MaterialIcons name={formCopy.submitIcon} size={Math.round(23 * desktopScale)} color={colors.primary} />
          </View>
        </View>

        <View style={[styles.modeRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TouchableOpacity
            onPress={() => setModeAndClearFeedback('signIn')}
            style={[styles.modeButton, mode === 'signIn' && { backgroundColor: actionButtonColor }]}
            accessibilityRole="button"
            accessibilityState={{ selected: mode === 'signIn' }}
            accessibilityLabel="Log in to a personal account"
          >
            <MaterialIcons
              name="login"
              size={Math.round(16 * desktopScale)}
              color={mode === 'signIn' ? actionButtonTextColor : colors.primary}
            />
            <Text style={[styles.modeText, { color: mode === 'signIn' ? actionButtonTextColor : colors.primary }]}>
              Log in
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setModeAndClearFeedback('create')}
            style={[styles.modeButton, mode === 'create' && { backgroundColor: actionButtonColor }]}
            accessibilityRole="button"
            accessibilityState={{ selected: mode === 'create' }}
            accessibilityLabel="Create a personal account"
          >
            <MaterialIcons
              name="person-add"
              size={Math.round(16 * desktopScale)}
              color={mode === 'create' ? actionButtonTextColor : colors.primary}
            />
            <Text style={[styles.modeText, { color: mode === 'create' ? actionButtonTextColor : colors.primary }]}>
              Create
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.form}>
          {renderTextInput({
            icon: 'person',
            field: 'username',
            value: username,
            onChangeText: setUsername,
            placeholder: 'Username',
            returnKeyType: 'next',
          })}
          {renderTextInput({
            icon: 'lock',
            field: 'password',
            value: password,
            onChangeText: setPassword,
            placeholder: 'Password',
            secureTextEntry: true,
            returnKeyType: 'done',
          })}
        </View>

        {hasAuthValidationWarning && (
          <View
            style={[
              styles.authSupportLine,
              { backgroundColor: colors.dangerSoft, borderColor: colors.danger },
            ]}
          >
            <MaterialIcons name={authSupportIcon} size={Math.round(17 * desktopScale)} color={colors.danger} />
            <Text style={[styles.authSupportText, { color: colors.danger }]}>
              {authSupportText}
            </Text>
          </View>
        )}

        {!!localMessage && <Text style={[styles.successText, { color: colors.primary }]}>{localMessage}</Text>}
        {!!error && (
          <Text style={[styles.errorText, { color: colors.danger, backgroundColor: colors.dangerSoft }]}>
            {error}
          </Text>
        )}

        <TouchableOpacity
          onPress={submit}
          disabled={isSubmitDisabled}
          style={[
            styles.primaryButton,
            { backgroundColor: actionButtonColor },
            isSubmitDisabled && styles.disabledButton,
          ]}
          accessibilityRole="button"
          accessibilityLabel={isCreateMode ? 'Create account' : 'Log in'}
        >
          {isSyncing ? (
            <ActivityIndicator color={actionButtonTextColor} />
          ) : (
            <>
              <MaterialIcons name={formCopy.submitIcon} size={Math.round(19 * desktopScale)} color={actionButtonTextColor} />
              <Text style={[styles.primaryButtonText, { color: actionButtonTextColor }]}>{formCopy.submitLabel}</Text>
            </>
          )}
        </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    borderWidth: 1.5,
    overflow: 'hidden',
    boxShadow: '0px 3px 8px rgba(0,0,0,0.12)',
  },
  dashboardCard: {
    marginHorizontal: 16,
    marginVertical: 5,
    borderRadius: 16,
    overflow: 'hidden',
  },
  authShell: {
    marginHorizontal: 16,
    marginVertical: 5,
    borderRadius: 16,
    overflow: 'hidden',
  },
  authBody: {
    padding: 10,
    gap: 8,
  },
  accountOverview: {
    padding: 12,
    gap: 9,
    borderRadius: 16,
  },
  dashboardHero: {
    padding: 14,
    gap: 10,
  },
  dashboardHeroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  identityCluster: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarEditButton: {
    width: 68,
    height: 68,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEditBadge: {
    position: 'absolute',
    right: 1,
    bottom: 1,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  identityCopy: {
    flex: 1,
    minWidth: 0,
  },
  identityMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 5,
    paddingLeft: 2,
  },
  identityMeta: {
    flex: 1,
    minWidth: 0,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
  },
  localProfileText: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '700',
    marginTop: 3,
  },
  identityNameButton: {
    alignSelf: 'flex-start',
    maxWidth: '100%',
    minHeight: 40,
    borderRadius: 12,
    borderWidth: 1.5,
    paddingLeft: 12,
    paddingRight: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  identityNameEditorPill: {
    alignSelf: 'stretch',
    paddingLeft: 11,
    paddingRight: 5,
    gap: 6,
  },
  identityNameIcon: {
    width: 30,
    height: 30,
    borderRadius: 9,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inlineNameInput: {
    flex: 1,
    minWidth: 0,
    minHeight: 36,
    paddingHorizontal: 0,
    paddingVertical: 0,
    fontSize: 19,
    lineHeight: 23,
    fontWeight: '900',
  },
  identityPillAction: {
    width: 30,
    height: 30,
    borderRadius: 9,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLarge: {
    width: 54,
    height: 54,
    borderRadius: 17,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  protectedBadge: {
    minHeight: 32,
    borderRadius: 999,
    borderWidth: 1.5,
    paddingHorizontal: 9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  protectedBadgeText: {
    fontSize: 12,
    fontWeight: '900',
  },
  dashboardGreeting: {
    flexShrink: 1,
    minWidth: 0,
    fontSize: 22,
    lineHeight: 26,
    fontWeight: '900',
  },
  accountStatusPill: {
    minHeight: 32,
    borderRadius: 999,
    borderWidth: 1.5,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  accountStatusText: {
    fontSize: 12,
    fontWeight: '900',
  },
  levelShowcase: {
    minHeight: 70,
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 12,
  },
  levelMedallion: {
    width: 58,
    height: 58,
    borderRadius: 17,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelMedallionValue: {
    fontSize: 26,
    lineHeight: 30,
    fontWeight: '900',
  },
  levelMedallionLabel: {
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  levelShowcaseCopy: {
    flex: 1,
    minWidth: 0,
  },
  levelShowcaseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 8,
  },
  levelShowcaseTitle: {
    fontSize: 15,
    fontWeight: '900',
  },
  levelShowcaseMeta: {
    fontSize: 12,
    fontWeight: '800',
  },
  profileProgressCard: {
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 12,
    gap: 9,
  },
  profileProgressHeader: {
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  profileProgressTitleBlock: {
    flex: 1,
    minWidth: 0,
  },
  profileProgressTitle: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '900',
  },
  profileProgressHint: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '800',
    marginTop: 2,
  },
  profileProgressXpPill: {
    minHeight: 32,
    minWidth: 76,
    borderRadius: 999,
    borderWidth: 1.5,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileProgressXpText: {
    fontSize: 12,
    lineHeight: 15,
    fontWeight: '900',
  },
  progressTrackLarge: {
    height: 10,
    borderRadius: 999,
    overflow: 'hidden',
  },
  profileProgressFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  profileProgressNextText: {
    flexShrink: 1,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '800',
  },
  profileProgressValueText: {
    flexShrink: 0,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '800',
    opacity: 0.75,
    fontVariant: ['tabular-nums'],
  },
  profileProgressTierHint: {
    marginTop: -4,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '800',
  },
  profileProgressStatsRow: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 9,
    marginTop: 2,
  },
  profileProgressStatItem: {
    flex: 1,
    minHeight: 66,
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 3,
    paddingHorizontal: 5,
  },
  profileProgressStatValue: {
    fontSize: 14,
    lineHeight: 17,
    fontWeight: '900',
    textAlign: 'center',
  },
  profileProgressStatLabel: {
    fontSize: 9,
    lineHeight: 12,
    fontWeight: '800',
    textAlign: 'center',
  },
  levelShowcaseSubtext: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '800',
    marginTop: 7,
  },
  dashboardBody: {
    padding: 10,
    gap: 8,
  },
  tourCard: {
    minHeight: 58,
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  tourHeaderCopy: {
    flex: 1,
    minWidth: 0,
  },
  tourTitle: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '900',
  },
  tourDismissButton: {
    minWidth: 44,
    minHeight: 34,
    borderRadius: 999,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  tourStepIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tourStepText: {
    fontSize: 12,
    lineHeight: 15,
    fontWeight: '700',
    marginTop: 3,
  },
  tourDismissText: {
    fontSize: 13,
    fontWeight: '900',
  },
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
  avatarChooser: {
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 12,
  },
  avatarChooserHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 10,
  },
  avatarChooserCopy: {
    flex: 1,
    minWidth: 0,
  },
  avatarChooserTitle: {
    fontSize: 15,
    fontWeight: '900',
  },
  avatarChooserText: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '700',
    marginTop: 2,
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  avatarGroupLabel: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '900',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  avatarGroupLabelSpaced: {
    marginTop: 10,
  },
  avatarChoice: {
    width: 46,
    height: 46,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorChoice: {
    width: 44,
    height: 38,
    borderRadius: 13,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorSwatch: {
    width: 26,
    height: 20,
    borderRadius: 8,
    borderWidth: 2,
  },
  lockedChoice: {
    opacity: 0.58,
  },
  avatarChoiceCheck: {
    position: 'absolute',
    right: -3,
    top: -3,
    width: 19,
    height: 19,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorChoiceCheck: {
    position: 'absolute',
    right: -3,
    top: -3,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockBadge: {
    position: 'absolute',
    right: -3,
    bottom: -3,
    minWidth: 34,
    height: 17,
    borderRadius: 8.5,
    paddingHorizontal: 3,
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
  sectionHeaderRow: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  dashboardSectionTitle: {
    fontSize: 17,
    lineHeight: 21,
    fontWeight: '900',
  },
  dashboardSectionSubtitle: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '700',
    marginTop: 2,
  },
  dashboardStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    gap: 6,
  },
  dashboardStatsGridCompact: {
    gap: 5,
  },
  dashboardStat: {
    flex: 1,
    minWidth: 0,
    minHeight: 58,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dashboardStatIcon: {
    width: 28,
    height: 28,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dashboardStatValue: {
    fontSize: 15,
    lineHeight: 18,
    fontWeight: '900',
    marginTop: 4,
  },
  dashboardStatLabel: {
    fontSize: 9,
    lineHeight: 12,
    fontWeight: '800',
    marginTop: 1,
    textAlign: 'center',
  },
  backupPanel: {
    minHeight: 68,
    borderRadius: 12,
    borderWidth: 1.5,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backupIconDisc: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backupCopy: {
    flex: 1,
    minWidth: 0,
  },
  backupTitle: {
    fontSize: 15,
    fontWeight: '900',
  },
  backupText: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '700',
    marginTop: 3,
  },
  backupActionButton: {
    minWidth: 78,
    minHeight: 38,
    borderRadius: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  backupActionText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '900',
  },
  mergePanel: {
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  mergePanelText: {
    flex: 1,
    minWidth: 0,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '700',
  },
  authHeader: {
    padding: 14,
    borderBottomWidth: 1,
  },
  authHeaderTop: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  authHeaderIdentity: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  authHeaderIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  authHeaderCopy: {
    flex: 1,
    minWidth: 0,
  },
  authHeaderTitle: {
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '900',
  },
  authHeaderText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    marginTop: 2,
  },
  signOutHero: {
    padding: 15,
    gap: 11,
  },
  signOutHeroTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  signOutTitle: {
    fontSize: 26,
    lineHeight: 30,
    fontWeight: '900',
  },
  signOutSubtitle: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '700',
  },
  snapshotCard: {
    borderRadius: 12,
    borderWidth: 1.5,
    padding: 10,
    gap: 9,
  },
  snapshotHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  snapshotTitle: {
    fontSize: 14,
    fontWeight: '900',
  },
  snapshotCopy: {
    flex: 1,
    minWidth: 0,
  },
  snapshotStatsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 5,
    marginTop: 3,
  },
  snapshotMeta: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '700',
  },
  snapshotDot: {
    fontSize: 11,
    fontWeight: '900',
  },
  snapshotLevel: {
    minWidth: 44,
    minHeight: 34,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  snapshotLevelText: {
    fontSize: 13,
    fontWeight: '900',
  },
  benefitRail: {
    flexDirection: 'row',
    gap: 7,
    marginBottom: 10,
  },
  benefitRailCompact: {
    flexDirection: 'column',
  },
  benefitBubble: {
    flex: 1,
    minHeight: 52,
    borderRadius: 12,
    borderWidth: 1,
    padding: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  benefitIcon: {
    width: 30,
    height: 30,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitCopy: {
    flex: 1,
    minWidth: 0,
  },
  benefitTitle: {
    fontSize: 12,
    fontWeight: '900',
  },
  benefitText: {
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '700',
    marginTop: 1,
  },
  authCard: {
    padding: 14,
  },
  authCardSurface: {
    borderRadius: 14,
    borderWidth: 1.5,
  },
  authCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  authTitleBlock: {
    flex: 1,
    minWidth: 0,
  },
  authEyebrow: {
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  authTitle: {
    fontSize: 22,
    lineHeight: 26,
    fontWeight: '900',
    marginTop: 2,
  },
  authSubtitle: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '700',
    marginTop: 3,
  },
  authActionIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  passwordHint: {
    minHeight: 38,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 10,
  },
  passwordHintText: {
    flex: 1,
    minWidth: 0,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '700',
  },
  hero: {
    minHeight: 88,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  heroCompact: {
    minHeight: 82,
    padding: 10,
    gap: 8,
  },
  avatarDisc: {
    width: 46,
    height: 46,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarDiscCompact: {
    width: 40,
    height: 40,
    borderRadius: 12,
  },
  avatarInitial: {
    fontSize: 21,
    fontWeight: '900',
    lineHeight: 24,
  },
  heroCopy: {
    flex: 1,
    minWidth: 0,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  heroTitle: {
    fontSize: 19,
    fontWeight: '900',
    lineHeight: 23,
  },
  heroTitleCompact: {
    fontSize: 17,
    lineHeight: 21,
  },
  heroText: {
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
    marginTop: 3,
  },
  statusBadge: {
    minWidth: 72,
    minHeight: 38,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 8,
  },
  statusBadgeCompact: {
    minWidth: 64,
    minHeight: 36,
    paddingHorizontal: 7,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '900',
  },
  levelPill: {
    minWidth: 52,
    minHeight: 34,
    borderRadius: 999,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 10,
  },
  levelPillText: {
    fontSize: 13,
    fontWeight: '900',
  },
  body: {
    padding: 12,
  },
  description: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  loadingCard: {
    minHeight: 74,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  masterProfileBadge: {
    minHeight: 34,
    marginBottom: 7,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: '#D79A00',
    backgroundColor: '#FFF7D7',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  masterProfileBadgeText: {
    color: '#7A4B00',
    fontSize: 11,
    fontWeight: '900',
  },
  masterProfileBadgeSubtext: {
    color: '#7A4B00',
    fontSize: 11,
    fontWeight: '800',
    flexShrink: 1,
  },
  masterStars: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 1,
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  modeRow: {
    minHeight: 40,
    flexDirection: 'row',
    gap: 6,
    borderWidth: 1,
    borderRadius: 11,
    padding: 4,
    marginTop: 14,
  },
  modeButton: {
    flex: 1,
    minHeight: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  modeText: {
    fontSize: 13,
    fontWeight: '900',
  },
  activeModeText: {
    color: '#fff',
  },
  statusStrip: {
    minHeight: 38,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  statusStripText: {
    flex: 1,
    minWidth: 0,
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 17,
  },
  infoBox: {
    minHeight: 40,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 10,
  },
  infoText: {
    flex: 1,
    minWidth: 0,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 17,
  },
  ruleBox: {
    minHeight: 38,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 10,
  },
  ruleText: {
    flex: 1,
    minWidth: 0,
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 17,
  },
  form: {
    marginTop: 12,
    gap: 9,
  },
  inputShell: {
    minHeight: 46,
    borderRadius: 10,
    borderWidth: 1.5,
    paddingLeft: 8,
    paddingRight: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  inputIconBox: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    minWidth: 0,
    minHeight: 44,
    paddingVertical: 0,
    fontSize: 15,
    fontWeight: '800',
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    minHeight: 46,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '900',
  },
  disabledButton: {
    opacity: 0.55,
  },
  authSupportLine: {
    minHeight: 36,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  authSupportText: {
    flex: 1,
    minWidth: 0,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '800',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  secondaryButton: {
    flex: 1,
    minHeight: 40,
    borderRadius: 999,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 7,
  },
  secondaryButtonText: {
    fontSize: 13,
    fontWeight: '900',
  },
  successText: {
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 18,
    marginTop: 12,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 18,
    marginTop: 12,
    borderRadius: 10,
    overflow: 'hidden',
    padding: 10,
  },
  hidden: {
    display: 'none',
  },
});
