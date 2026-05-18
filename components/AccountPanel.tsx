import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useAccount } from '../contexts/AccountContext';
import { getXP } from '../utils/xpStorage';
import {
  getLearnedFlashcardSummary,
  type LearnedFlashcardSummary,
} from '../utils/flashcardProgressStorage';
import {
  getGrammarProgressSummary,
  type GrammarProgressSummary,
} from '../utils/grammarProgressStorage';
import { getVocabularyTimerBests } from '../utils/vocabularyTimerStorage';

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
    success: string;
    successSoft: string;
    danger: string;
    dangerSoft: string;
    warning: string;
    warningSoft: string;
  };
  isDarkMode: boolean;
};

type AccountMode = 'signIn' | 'create';
type FocusedField = 'username' | 'password' | null;

const xpNeededForLevel = (lvl: number) => Math.min(50 + (lvl - 1) * 10, 200);

const xpForLevel = (lvl: number) => {
  let total = 0;

  for (let i = 1; i < lvl; i += 1) {
    total += xpNeededForLevel(i);
  }

  return total;
};

const getLevelStats = (xp: number) => {
  let level = 1;

  while (xp >= xpForLevel(level + 1)) {
    level += 1;
  }

  const currentLevelXP = xpForLevel(level);
  const nextLevelXP = xpForLevel(level + 1);
  const progressXP = Math.max(0, xp - currentLevelXP);
  const neededXP = Math.max(1, nextLevelXP - currentLevelXP);
  const progressPercent = Math.min(100, Math.round((progressXP / neededXP) * 100));

  return {
    level,
    progressXP,
    neededXP,
    progressPercent,
  };
};

const getInitial = (name: string) => name.trim().charAt(0).toUpperCase() || 'E';

const emptyLearnedSummary: LearnedFlashcardSummary = {
  totalLearned: 0,
  lessonCount: 0,
  learnedToday: 0,
};

const emptyGrammarSummary: GrammarProgressSummary = {
  totalCorrectAnswers: 0,
  lessonCount: 0,
  correctToday: 0,
};

export default function AccountPanel({ colors, isDarkMode }: AccountPanelProps) {
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
    clearError,
  } = useAccount();
  const { width } = useWindowDimensions();
  const [mode, setMode] = useState<AccountMode>('signIn');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<FocusedField>(null);
  const [localXP, setLocalXP] = useState(0);
  const [learnedSummary, setLearnedSummary] = useState<LearnedFlashcardSummary>(emptyLearnedSummary);
  const [grammarSummary, setGrammarSummary] = useState<GrammarProgressSummary>(emptyGrammarSummary);
  const [timerBestCount, setTimerBestCount] = useState(0);
  const [localMessage, setLocalMessage] = useState('');

  const isCreateMode = mode === 'create';
  const isSubmitDisabled = isSyncing || !username.trim() || !password;
  const compact = width < 390;
  const levelStats = useMemo(() => getLevelStats(localXP), [localXP]);
  const heroGradient = useMemo<[string, string, string]>(
    () => isDarkMode ? ['#0F2A3B', '#17384B', '#1F2D45'] : ['#DFF2FF', '#F6FBFF', '#FFFFFF'],
    [isDarkMode]
  );
  const accountName = session?.user.displayName || session?.user.username || '';
  const backupSummary = useMemo(
    () =>
      `${localXP} XP, ${grammarSummary.totalCorrectAnswers} grammar answers, ${learnedSummary.totalLearned} learnt words, and ${timerBestCount} best times.`,
    [grammarSummary.totalCorrectAnswers, learnedSummary.totalLearned, localXP, timerBestCount]
  );
  const formCopy = useMemo(() => ({
    title: isCreateMode ? 'Make an account' : 'Log in',
    subtitle: isCreateMode ? 'Optional: keep an online copy.' : 'Use your work on another device.',
    status: isCreateMode
      ? 'This backs up the work already on this device.'
      : 'Log in to add online work. This device does not get erased.',
    submitLabel: isCreateMode ? 'Make account' : 'Log in',
    submitIcon: isCreateMode ? 'cloud-upload' as const : 'login' as const,
  }), [isCreateMode]);
  const syncCopy = useMemo(() => {
    if (!session) {
      return {
        icon: 'phone-iphone' as const,
        color: colors.primary,
        text: 'Saved on this device. Log in to keep an online copy.',
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
        text: `Online copy saved at ${lastSyncAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      };
    }

    return {
      icon: 'cloud-queue' as const,
      color: colors.primary,
      text: 'Online copy not saved yet.',
    };
  }, [colors.danger, colors.primary, colors.success, error, isSyncing, lastSyncAt, session, syncStatus]);

  useEffect(() => {
    let active = true;

    Promise.all([
      getXP(),
      getLearnedFlashcardSummary(),
      getGrammarProgressSummary(),
      getVocabularyTimerBests(),
    ]).then(([xp, nextLearnedSummary, nextGrammarSummary, timerBests]) => {
      if (!active) return;

      setLocalXP(xp);
      setLearnedSummary(nextLearnedSummary);
      setGrammarSummary(nextGrammarSummary);
      setTimerBestCount(Object.keys(timerBests).length);
    });

    return () => {
      active = false;
    };
  }, [session, isSyncing]);

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
      const trimmedUsername = username.trim();

      if (isCreateMode) {
        await createAccount(trimmedUsername, password);
        setLocalMessage('Account made. This device was backed up.');
      } else {
        await signIn(trimmedUsername, password);
        setLocalMessage('Logged in. This device and online copy are combined.');
      }

      resetForm();
    } catch {
      // The context exposes a clean error string for the UI.
    }
  }, [
    clearError,
    createAccount,
    isCreateMode,
    password,
    resetForm,
    signIn,
    username,
  ]);

  const runSync = useCallback(async () => {
    setLocalMessage('');
    clearError();

    try {
      await syncNow();
      setLocalMessage('Backed up online.');
    } catch {
      // The context exposes a clean error string for the UI.
    }
  }, [clearError, syncNow]);

  const confirmSync = useCallback(() => {
    const title = syncStatus === 'failed' || error ? 'Try backup again?' : 'Save online copy?';
    const message = [
      'This saves a copy of:',
      backupSummary,
      '',
      'If you use two devices, the app combines your work.',
      'It keeps the biggest XP number and the fastest times.',
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

  const renderLevelProgress = () => (
    <View style={styles.levelBlock}>
      <View style={styles.levelHeader}>
        <Text style={[styles.levelText, { color: colors.text }]}>Level {levelStats.level}</Text>
        <Text style={[styles.levelSubtext, { color: colors.secondaryText }]}>
          {levelStats.progressXP}/{levelStats.neededXP} XP
        </Text>
      </View>
      <View style={[styles.progressTrack, { backgroundColor: isDarkMode ? '#294259' : '#D8E9F7' }]}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${levelStats.progressPercent}%`,
              backgroundColor: colors.warning,
            },
          ]}
        />
      </View>
    </View>
  );

  const renderStat = (
    icon: React.ComponentProps<typeof MaterialIcons>['name'],
    value: string,
    label: string,
    accentColor: string
  ) => (
    <View style={[styles.statTile, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <MaterialIcons name={icon} size={18} color={accentColor} />
      <Text style={[styles.statValue, { color: colors.text }]} numberOfLines={1}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.secondaryText }]} numberOfLines={2}>{label}</Text>
    </View>
  );

  const renderProgressStats = () => (
    <View style={styles.savedWorkBlock}>
      <View style={styles.savedWorkHeader}>
        <Text style={[styles.savedWorkTitle, { color: colors.text }]}>Saved work</Text>
        <Text style={[styles.savedWorkSubtitle, { color: colors.secondaryText }]}>On this device</Text>
      </View>
      <View style={[styles.statsRow, compact && styles.statsRowCompact]}>
        {renderStat('edit', `${grammarSummary.totalCorrectAnswers}`, 'Grammar', colors.primary)}
        {renderStat('style', `${learnedSummary.totalLearned}`, 'Words learnt', colors.success)}
        {renderStat('timer', `${timerBestCount}`, 'Best times', colors.primary)}
      </View>
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

    return (
      <View
        style={[
          styles.inputShell,
          {
            backgroundColor: isDarkMode ? '#132033' : '#fff',
            borderColor: focused ? colors.primary : colors.border,
          },
          focused && styles.inputShellFocused,
        ]}
      >
        <View style={[styles.inputIconBox, { backgroundColor: focused ? colors.primarySoft : colors.surface }]}>
          <MaterialIcons name={icon} size={19} color={focused ? colors.primary : colors.secondaryText} />
        </View>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setFocusedField(field)}
          onBlur={() => setFocusedField(null)}
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry={secureTextEntry && !showPassword}
          placeholder={placeholder}
          placeholderTextColor={colors.secondaryText}
          returnKeyType={returnKeyType}
          onSubmitEditing={returnKeyType === 'done' && !isSubmitDisabled ? submit : undefined}
          style={[styles.input, { color: colors.text }]}
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
              size={20}
              color={colors.secondaryText}
            />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (!isConfigured) {
    return (
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <LinearGradient colors={heroGradient} style={styles.hero}>
          <View style={[styles.avatarDisc, { backgroundColor: colors.primarySoft, borderColor: colors.border }]}>
            <MaterialIcons name="cloud-off" size={28} color={colors.primary} />
          </View>
          <View style={styles.heroCopy}>
            <Text style={[styles.eyebrow, { color: colors.primary }]}>No account yet</Text>
            <Text style={[styles.heroTitle, { color: colors.text }]}>Progress stays here</Text>
            <Text style={[styles.heroText, { color: colors.secondaryText }]}>
              Ask your teacher to turn on online accounts.
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <MaterialIcons name="phone-iphone" size={17} color={colors.primary} />
            <Text style={[styles.statusBadgeText, { color: colors.primary }]}>Device</Text>
          </View>
        </LinearGradient>
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
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <LinearGradient colors={heroGradient} style={styles.hero}>
          <View style={[styles.avatarDisc, { backgroundColor: colors.successSoft, borderColor: colors.success }]}>
            <Text style={[styles.avatarInitial, { color: colors.success }]}>{getInitial(accountName)}</Text>
          </View>
          <View style={styles.heroCopy}>
            <Text style={[styles.eyebrow, { color: colors.success }]}>Signed in</Text>
            <Text style={[styles.heroTitle, { color: colors.text }]} numberOfLines={1}>
              {accountName}
            </Text>
            <Text style={[styles.heroText, { color: colors.secondaryText }]} numberOfLines={1}>
              This device saves first. Online copy is backup.
            </Text>
          </View>
          <View style={[styles.levelPill, { backgroundColor: colors.warningSoft, borderColor: colors.warning }]}>
            <MaterialIcons name="military-tech" size={17} color={colors.warning} />
            <Text style={[styles.levelPillText, { color: isDarkMode ? colors.text : '#6F4A00' }]}>
              L{levelStats.level}
            </Text>
          </View>
        </LinearGradient>

        <View style={styles.body}>
          {renderLevelProgress()}

          {renderProgressStats()}

          <View style={[styles.statusStrip, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
            <MaterialIcons name={syncCopy.icon} size={18} color={syncCopy.color} />
            <Text style={[styles.statusStripText, { color: colors.secondaryText }]}>
              {syncCopy.text}
            </Text>
          </View>

          <View style={[styles.infoBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <MaterialIcons name="merge-type" size={18} color={colors.primary} />
            <Text style={[styles.infoText, { color: colors.secondaryText }]}>
              Using two devices? We combine answers and words, keep your biggest XP number, and keep fastest times.
            </Text>
          </View>

          {!!localMessage && <Text style={[styles.successText, { color: colors.primary }]}>{localMessage}</Text>}
          {!!error && (
            <Text style={[styles.errorText, { color: colors.danger, backgroundColor: colors.dangerSoft }]}>
              {error}
            </Text>
          )}

          <View style={styles.actionsRow}>
            <TouchableOpacity
              onPress={confirmSync}
              disabled={isSyncing}
              style={[styles.secondaryButton, { borderColor: colors.primary, backgroundColor: colors.primarySoft }]}
              accessibilityRole="button"
              accessibilityLabel="Save account progress now"
            >
              {isSyncing ? (
                <ActivityIndicator color={colors.primary} />
              ) : (
                <>
                  <MaterialIcons name="sync" size={18} color={colors.primary} />
                  <Text style={[styles.secondaryButtonText, { color: colors.primary }]}>
                    {syncStatus === 'failed' || error ? 'Try again' : 'Save copy'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <LinearGradient colors={heroGradient} style={[styles.hero, compact && styles.heroCompact]}>
        <View style={[
          styles.avatarDisc,
          compact && styles.avatarDiscCompact,
          { backgroundColor: colors.primarySoft, borderColor: colors.primary },
        ]}>
          <MaterialIcons name={isCreateMode ? 'rocket-launch' : 'account-circle'} size={28} color={colors.primary} />
        </View>
        <View style={styles.heroCopy}>
          <Text style={[styles.eyebrow, { color: colors.primary }]}>Optional</Text>
          <Text style={[styles.heroTitle, compact && styles.heroTitleCompact, { color: colors.text }]}>
            {formCopy.title}
          </Text>
          <Text style={[styles.heroText, { color: colors.secondaryText }]} numberOfLines={compact ? 1 : 2}>
            {formCopy.subtitle}
          </Text>
        </View>
        <View style={[
          styles.statusBadge,
          compact && styles.statusBadgeCompact,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}>
          <MaterialIcons name="phone-iphone" size={17} color={colors.primary} />
          <Text style={[styles.statusBadgeText, { color: colors.primary }]}>Device</Text>
        </View>
      </LinearGradient>

      <View style={styles.body}>
        {renderLevelProgress()}

        {renderProgressStats()}

        <View style={[styles.modeRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TouchableOpacity
            onPress={() => setModeAndClearFeedback('signIn')}
            style={[styles.modeButton, mode === 'signIn' && { backgroundColor: colors.primary }]}
            accessibilityRole="button"
            accessibilityState={{ selected: mode === 'signIn' }}
            accessibilityLabel="Log in to a personal account"
          >
            <MaterialIcons
              name="login"
              size={17}
              color={mode === 'signIn' ? '#fff' : colors.primary}
            />
            <Text style={[styles.modeText, { color: colors.primary }, mode === 'signIn' && styles.activeModeText]}>
              Log in
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setModeAndClearFeedback('create')}
            style={[styles.modeButton, mode === 'create' && { backgroundColor: colors.primary }]}
            accessibilityRole="button"
            accessibilityState={{ selected: mode === 'create' }}
            accessibilityLabel="Create a personal account"
          >
            <MaterialIcons
              name="person-add"
              size={17}
              color={mode === 'create' ? '#fff' : colors.primary}
            />
            <Text style={[styles.modeText, { color: colors.primary }, mode === 'create' && styles.activeModeText]}>
              Make account
            </Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.statusStrip, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
          <MaterialIcons name={isCreateMode ? 'backup' : 'verified-user'} size={18} color={colors.primary} />
          <Text style={[styles.statusStripText, { color: colors.secondaryText }]}>
            {formCopy.status}
          </Text>
        </View>

        <View style={[styles.infoBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <MaterialIcons name="cloud-upload" size={18} color={colors.primary} />
          <Text style={[styles.infoText, { color: colors.secondaryText }]}>
            Online copy saves XP, grammar answers, learnt words, and best times.
          </Text>
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

        {!isCreateMode && (
          <View style={[styles.infoBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <MaterialIcons name="help-outline" size={18} color={colors.secondaryText} />
            <Text style={[styles.infoText, { color: colors.secondaryText }]}>
              Forgot password? Ask your teacher. Passwords cannot be seen, but your teacher can set a new one.
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
            { backgroundColor: colors.primary },
            isSubmitDisabled && styles.disabledButton,
          ]}
          accessibilityRole="button"
          accessibilityLabel={isCreateMode ? 'Create account' : 'Log in'}
        >
          {isSyncing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <MaterialIcons name={formCopy.submitIcon} size={19} color="#fff" />
              <Text style={styles.primaryButtonText}>{formCopy.submitLabel}</Text>
            </>
          )}
        </TouchableOpacity>
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
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
  levelBlock: {
    marginBottom: 10,
  },
  levelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 7,
  },
  levelText: {
    fontSize: 13,
    fontWeight: '900',
  },
  levelSubtext: {
    fontSize: 12,
    fontWeight: '800',
  },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  savedWorkBlock: {
    marginTop: 2,
  },
  savedWorkHeader: {
    minHeight: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 7,
  },
  savedWorkTitle: {
    fontSize: 13,
    fontWeight: '900',
  },
  savedWorkSubtitle: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  statsRowCompact: {
    gap: 6,
  },
  statTile: {
    flex: 1,
    minHeight: 64,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  statValue: {
    fontSize: 15,
    fontWeight: '900',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '800',
    marginTop: 2,
    lineHeight: 13,
    textAlign: 'center',
  },
  modeRow: {
    minHeight: 44,
    flexDirection: 'row',
    gap: 6,
    borderWidth: 1,
    borderRadius: 999,
    padding: 4,
    marginTop: 12,
  },
  modeButton: {
    flex: 1,
    minHeight: 34,
    borderRadius: 999,
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
  form: {
    marginTop: 10,
    gap: 8,
  },
  inputShell: {
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    paddingLeft: 8,
    paddingRight: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  inputShellFocused: {
    shadowColor: '#1671B6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 2,
  },
  inputIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
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
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 11,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '900',
  },
  disabledButton: {
    opacity: 0.55,
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
