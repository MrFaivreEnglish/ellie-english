import React from 'react';
import { ActivityIndicator, Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import AccountPanel from '../components/AccountPanel';
import BackButton from '../components/BackButton';
import { useAccount } from '../contexts/AccountContext';
import { useTheme } from '../contexts/ThemeContext';

const cleanDisplayName = (value: string) => value.trim().replace(/\s+/g, ' ');

export default function AccountScreen() {
  const navigation = useNavigation<any>();
  const { colors, isDarkMode, isAndroidStatusBarEnabled } = useTheme();
  const { session, isSyncing, signOut, deleteAccount, resetSavedProgress, clearError } = useAccount();
  const insets = useSafeAreaInsets();
  const [resetMessage, setResetMessage] = React.useState('');
  const accountName = cleanDisplayName(session?.user.displayName || session?.user.username || '');
  const topContentInset = Platform.OS === 'ios'
    ? (insets.top > 0 ? insets.top : 0)
    : Platform.OS === 'android' && isAndroidStatusBarEnabled
      ? insets.top
      : 0;
  const runDeleteAccount = React.useCallback(async () => {
    try {
      await deleteAccount();
    } catch {
      // AccountContext exposes the readable error in the panel.
    }
  }, [deleteAccount]);

  const runResetSavedProgress = React.useCallback(async () => {
    setResetMessage('');

    try {
      await resetSavedProgress();
      setResetMessage(session ? 'Saved work reset here and online.' : 'Saved work reset on this device.');
    } catch {
      // AccountContext exposes the readable error in the panel.
    }
  }, [resetSavedProgress, session]);

  const runSignOut = React.useCallback(async () => {
    setResetMessage('');

    try {
      await signOut();
    } catch {
      // AccountContext exposes the readable error in the panel.
    }
  }, [signOut]);

  const confirmSignOut = React.useCallback(() => {
    if (!session) return;

    clearError();

    const title = 'Sign out?';
    const message = 'This restores the work that was on this device before login. The online copy stays safe.';

    if (Platform.OS === 'web') {
      const confirmed = typeof window !== 'undefined' ? window.confirm(`${title}\n\n${message}`) : true;
      if (confirmed) void runSignOut();
      return;
    }

    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => void runSignOut() },
    ]);
  }, [clearError, runSignOut, session]);

  const confirmResetSavedProgress = React.useCallback(() => {
    clearError();

    const title = 'Reset saved work?';
    const message = session
      ? 'This clears XP, grammar answers, learnt words, and best times on this device and in this online account.'
      : 'This clears XP, grammar answers, learnt words, and best times on this device.';

    if (Platform.OS === 'web') {
      const confirmed = typeof window !== 'undefined' ? window.confirm(`${title}\n\n${message}`) : true;
      if (confirmed) void runResetSavedProgress();
      return;
    }

    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reset work', style: 'destructive', onPress: () => void runResetSavedProgress() },
    ]);
  }, [clearError, runResetSavedProgress, session]);

  const confirmDeleteAccount = React.useCallback(() => {
    if (!session) return;

    clearError();

    const title = 'Delete online account?';
    const message = 'This deletes the online copy and the login. Work already saved on this device stays here.';

    if (Platform.OS === 'web') {
      const confirmed = typeof window !== 'undefined' ? window.confirm(`${title}\n\n${message}`) : true;
      if (confirmed) void runDeleteAccount();
      return;
    }

    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete account', style: 'destructive', onPress: () => void runDeleteAccount() },
    ]);
  }, [clearError, runDeleteAccount, session]);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{
        paddingTop: topContentInset,
        paddingBottom: insets.bottom + 32,
      }}
    >
      <BackButton onPress={() => navigation.goBack()} />

      <View style={styles.header}>
        <View style={[styles.headerIcon, { backgroundColor: session ? colors.successSoft : colors.primarySoft }]}>
          {session ? (
            <Text style={[styles.headerInitial, { color: colors.success }]}>
              {accountName.charAt(0).toUpperCase() || 'E'}
            </Text>
          ) : (
            <MaterialIcons name="account-circle" size={28} color={colors.primary} />
          )}
        </View>
        <View style={styles.headerCopy}>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
            {session ? accountName : 'Account backup'}
          </Text>
          <Text style={[styles.subtitle, { color: colors.secondaryText }]}>
            {session
              ? `Logged in as @${session.user.username}. This device saves first.`
              : 'Optional. Your work stays on this device first.'}
          </Text>
        </View>
        {session && (
          <TouchableOpacity
            onPress={confirmSignOut}
            disabled={isSyncing}
            style={[styles.signOutButton, { borderColor: colors.border, backgroundColor: colors.card }]}
            accessibilityRole="button"
            accessibilityLabel="Sign out"
          >
            {isSyncing ? (
              <ActivityIndicator color={colors.secondaryText} />
            ) : (
              <>
                <MaterialIcons name="logout" size={17} color={colors.secondaryText} />
                <Text style={[styles.signOutText, { color: colors.secondaryText }]}>Sign out</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>

      <AccountPanel colors={colors} isDarkMode={isDarkMode} />

      <View style={styles.accountSection}>
        <Text style={[styles.sectionLabel, { color: colors.secondaryText }]}>Advanced</Text>
        <View style={[styles.resetCard, { backgroundColor: colors.card, borderColor: colors.warning }]}>
          <View style={styles.dangerCopy}>
            <MaterialIcons name="restart-alt" size={22} color={colors.warning} />
            <View style={styles.dangerTextBlock}>
              <Text style={[styles.dangerTitle, { color: colors.text }]}>Reset saved work</Text>
              <Text style={[styles.dangerText, { color: colors.secondaryText }]}>
                Clears XP, grammar answers, learnt words, and best times.
                {session ? ' The online copy resets too.' : ''}
              </Text>
              {!!resetMessage && <Text style={[styles.resetMessage, { color: colors.warning }]}>{resetMessage}</Text>}
            </View>
          </View>
          <TouchableOpacity
            onPress={confirmResetSavedProgress}
            disabled={isSyncing}
            style={[styles.resetWorkButton, { backgroundColor: colors.warningSoft, borderColor: colors.warning }]}
            accessibilityRole="button"
            accessibilityLabel="Reset saved work"
          >
            {isSyncing ? (
              <ActivityIndicator color={colors.warning} />
            ) : (
              <Text style={[styles.deleteButtonText, { color: colors.warning }]}>Reset</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {session && (
      <View style={styles.accountSection}>
        <Text style={[styles.sectionLabel, { color: colors.secondaryText }]}>Danger zone</Text>
        <View style={[styles.dangerCard, { backgroundColor: colors.card, borderColor: colors.danger }]}>
          <View style={styles.dangerCopy}>
            <MaterialIcons name="delete-outline" size={22} color={colors.danger} />
            <View style={styles.dangerTextBlock}>
              <Text style={[styles.dangerTitle, { color: colors.text }]}>Delete online account</Text>
              <Text style={[styles.dangerText, { color: colors.secondaryText }]}>
                Deletes the online copy. Work on this device stays here.
              </Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={confirmDeleteAccount}
            disabled={isSyncing}
            style={[styles.deleteButton, { backgroundColor: colors.dangerSoft, borderColor: colors.danger }]}
            accessibilityRole="button"
            accessibilityLabel="Delete online account"
          >
            {isSyncing ? (
              <ActivityIndicator color={colors.danger} />
            ) : (
            <Text style={[styles.deleteButtonText, { color: colors.danger }]}>Delete</Text>
          )}
        </TouchableOpacity>
        </View>
      </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 10,
    gap: 12,
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInitial: {
    fontSize: 23,
    lineHeight: 27,
    fontWeight: '900',
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
    marginTop: 4,
  },
  signOutButton: {
    minHeight: 38,
    borderRadius: 999,
    borderWidth: 1.5,
    paddingHorizontal: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  signOutText: {
    fontSize: 12,
    fontWeight: '900',
  },
  accountSection: {
    marginTop: 8,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0,
    textTransform: 'uppercase',
    paddingHorizontal: 24,
    marginBottom: 6,
  },
  dangerCard: {
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1.5,
    padding: 12,
    gap: 12,
  },
  resetCard: {
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1.5,
    padding: 12,
    gap: 12,
  },
  dangerCopy: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  dangerTextBlock: {
    flex: 1,
    minWidth: 0,
  },
  dangerTitle: {
    fontSize: 15,
    fontWeight: '900',
  },
  dangerText: {
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 17,
    marginTop: 3,
  },
  deleteButton: {
    minHeight: 40,
    borderRadius: 999,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetWorkButton: {
    minHeight: 40,
    borderRadius: 999,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: {
    fontSize: 13,
    fontWeight: '900',
  },
  resetMessage: {
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 17,
    marginTop: 7,
  },
});
