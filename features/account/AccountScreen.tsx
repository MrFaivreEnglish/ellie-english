import React from 'react';
import { ActivityIndicator, Alert, Platform, ScrollView, StyleSheet, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../../types/navigationTypes';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Text from '../shared/ThemedText';
import MaterialIcons from '../shared/ThemedMaterialIcon';
import AccountPanel from './AccountPanel';
import BackButton from '../shared/BackButton';
import { useAccount } from './AccountContext';
import { useTheme } from '../settings/ThemeContext';
import { getButtonStyle, getButtonTextColor, getSoftShadow } from '../shared/uiPrimitives';
import { getDesktopContentMaxWidth, getDesktopTypographyScale, getTopSafeAreaInset, isDesktopWebWidth } from '../shared/responsiveLayout';
import { DesktopTypographyProvider } from '../shared/DesktopTypography';

const cleanDisplayName = (value: string) => value.trim().replace(/\s+/g, ' ');

export default function AccountScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'Account'>>();
  const openAvatarPicker = route.params?.openAvatarPicker === true;
  const scrollRef = React.useRef<ScrollView | null>(null);
  const { colors, isDarkMode, isAndroidStatusBarEnabled } = useTheme();
  const {
    session,
    isSyncing,
    signOut,
    deleteAccount,
    resetSavedProgress,
    clearError,
  } = useAccount();
  const insets = useSafeAreaInsets();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const isDesktopWeb = isDesktopWebWidth(windowWidth, undefined, windowHeight);
  const desktopContentMaxWidth = getDesktopContentMaxWidth(windowWidth, 'fit', windowHeight);





  const desktopScale = getDesktopTypographyScale(windowWidth, windowHeight, 'fit');
  const [resetMessage, setResetMessage] = React.useState('');
  const [isAdvancedOpen, setIsAdvancedOpen] = React.useState(false);
  const [avatarSectionOffset, setAvatarSectionOffset] = React.useState<number | null>(null);
  const accountPanelYRef = React.useRef(0);

  React.useEffect(() => {
    if (!openAvatarPicker || avatarSectionOffset === null) return;
    scrollRef.current?.scrollTo({ y: Math.max(0, avatarSectionOffset - 20), animated: true });
  }, [openAvatarPicker, avatarSectionOffset]);
  const accountName = cleanDisplayName(session?.user.displayName || session?.user.username || '');
  const topContentInset = getTopSafeAreaInset(Platform.OS, insets.top, isAndroidStatusBarEnabled);
  const warningButtonStyle = getButtonStyle(colors, isDarkMode, 'warning');
  const warningButtonTextColor = getButtonTextColor(colors, isDarkMode, 'warning');
  const dangerButtonStyle = getButtonStyle(colors, isDarkMode, 'danger');
  const dangerButtonTextColor = getButtonTextColor(colors, isDarkMode, 'danger');
  const resetToHome = React.useCallback(() => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Home' }],
    });
  }, [navigation]);

  const runDeleteAccount = React.useCallback(async () => {
    try {
      await deleteAccount();
      resetToHome();
    } catch {

    }
  }, [deleteAccount, resetToHome]);

  const runResetSavedProgress = React.useCallback(async () => {
    setResetMessage('');

    try {
      await resetSavedProgress();
      setResetMessage(session ? 'Saved work reset here and online.' : 'Saved work reset on this device.');
    } catch {

    }
  }, [resetSavedProgress, session]);

  const runSignOut = React.useCallback(async () => {
    setResetMessage('');

    try {
      await signOut();
      resetToHome();
    } catch {

    }
  }, [resetToHome, signOut]);

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
      ? 'This clears revision points, grammar answers, learnt words, and best times on this device and in this online account.'
      : 'This clears revision points, grammar answers, learnt words, and best times on this device.';

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
    <DesktopTypographyProvider mode="fit">
    <ScrollView
      ref={scrollRef}
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{
        paddingTop: topContentInset,
        paddingBottom: insets.bottom + 32,
      }}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="none"
    >
      <View style={isDesktopWeb && [styles.desktopContentWrap, { maxWidth: desktopContentMaxWidth }]}>
      <BackButton onPress={() => navigation.goBack()} />

      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
            Account
          </Text>
          <Text style={[styles.subtitle, { color: colors.secondaryText }]}>
            {session
              ? `${accountName || `@${session.user.username}`} - online backup ready`
              : 'Local profile - online backup optional.'}
          </Text>
        </View>
      </View>

      <View onLayout={(event) => { accountPanelYRef.current = event.nativeEvent.layout.y; }}>
        <AccountPanel
          colors={colors}
          isDarkMode={isDarkMode}
          openAvatarPicker={openAvatarPicker}
          onAvatarSectionLayout={(y) => setAvatarSectionOffset(accountPanelYRef.current + y)}
        />
      </View>

      {session && (
        <TouchableOpacity
          onPress={confirmSignOut}
          disabled={isSyncing}
          style={[styles.signOutCard, getSoftShadow(isDarkMode, 'soft', colors.shadow, colors.visualStyle === 'pixel'), { backgroundColor: colors.card, borderColor: colors.danger }]}
          accessibilityRole="button"
          accessibilityLabel="Sign out"
        >
          <View style={[styles.signOutIcon, { backgroundColor: colors.dangerSoft }]}>
            <MaterialIcons name="logout" size={Math.round(21 * desktopScale)} color={colors.danger} />
          </View>
          <View style={styles.signOutCopy}>
            <Text style={[styles.signOutTitle, { color: colors.danger }]}>Sign out</Text>
            <Text style={[styles.signOutDescription, { color: colors.secondaryText }]}>
              Leave this account and return to the work saved on this device.
            </Text>
          </View>
          {isSyncing ? (
            <ActivityIndicator color={colors.danger} />
          ) : (
            <MaterialIcons name="chevron-right" size={Math.round(24 * desktopScale)} color={colors.danger} />
          )}
        </TouchableOpacity>
      )}

      <View style={styles.accountSection}>
        <TouchableOpacity
          onPress={() => setIsAdvancedOpen((current) => !current)}
          style={[styles.advancedToggle, getSoftShadow(isDarkMode, 'soft', colors.shadow, colors.visualStyle === 'pixel'), { backgroundColor: colors.card, borderColor: colors.border }]}
          accessibilityRole="button"
          accessibilityLabel={isAdvancedOpen ? 'Close advanced account actions' : 'Open advanced account actions'}
          accessibilityState={{ expanded: isAdvancedOpen }}
        >
          <View style={styles.advancedCopy}>
            <MaterialIcons name="tune" size={Math.round(22 * desktopScale)} color={colors.secondaryText} />
            <View style={styles.dangerTextBlock}>
              <Text style={[styles.advancedTitle, { color: colors.text }]}>Advanced</Text>
              <Text style={[styles.advancedText, { color: colors.secondaryText }]}>
                Reset saved work or manage the online account.
              </Text>
            </View>
          </View>
          <MaterialIcons name={isAdvancedOpen ? 'expand-less' : 'expand-more'} size={Math.round(24 * desktopScale)} color={colors.secondaryText} />
        </TouchableOpacity>

        {isAdvancedOpen && (
          <>
            <View
              style={[
                styles.resetCard,
                getSoftShadow(isDarkMode, 'soft', colors.shadow, colors.visualStyle === 'pixel'),
                { backgroundColor: colors.card, borderColor: colors.warning },
              ]}
            >
              <View style={styles.dangerCopy}>
                <MaterialIcons name="restart-alt" size={Math.round(22 * desktopScale)} color={colors.warning} />
                <View style={styles.dangerTextBlock}>
                  <Text style={[styles.dangerTitle, { color: colors.text }]}>Reset saved work</Text>
                  <Text style={[styles.dangerText, { color: colors.secondaryText }]}>
                    Clears revision points, grammar answers, learnt words, and best times.
                    {session ? ' The online copy resets too.' : ''}
                  </Text>
                  {!!resetMessage && <Text style={[styles.resetMessage, { color: colors.warning }]}>{resetMessage}</Text>}
                </View>
              </View>
              <TouchableOpacity
                onPress={confirmResetSavedProgress}
                disabled={isSyncing}
                style={[styles.resetWorkButton, warningButtonStyle]}
                accessibilityRole="button"
                accessibilityLabel="Reset saved work"
              >
                {isSyncing ? (
                  <ActivityIndicator color={colors.warning} />
                ) : (
                  <Text style={[styles.deleteButtonText, { color: warningButtonTextColor }]}>Reset</Text>
                )}
              </TouchableOpacity>
            </View>

            {session && (
              <View
                style={[
                  styles.dangerCard,
                  getSoftShadow(isDarkMode, 'soft', colors.shadow, colors.visualStyle === 'pixel'),
                  { backgroundColor: colors.card, borderColor: colors.danger },
                ]}
              >
                <View style={styles.dangerCopy}>
                  <MaterialIcons name="delete-outline" size={Math.round(22 * desktopScale)} color={colors.danger} />
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
                  style={[styles.deleteButton, dangerButtonStyle]}
                  accessibilityRole="button"
                  accessibilityLabel="Delete online account"
                >
                  {isSyncing ? (
                    <ActivityIndicator color={colors.danger} />
                  ) : (
                    <Text style={[styles.deleteButtonText, { color: dangerButtonTextColor }]}>Delete</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </>
          )}
      </View>
      </View>
    </ScrollView>
    </DesktopTypographyProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  desktopContentWrap: {


    width: '100%',
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 8,
    gap: 12,
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 30,
    fontWeight: '900',
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
    marginTop: 4,
  },
  signOutCard: {
    minHeight: 58,
    marginHorizontal: 16,
    marginTop: 7,
    borderRadius: 12,
    borderWidth: 1.5,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  signOutIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signOutCopy: {
    flex: 1,
    minWidth: 0,
  },
  signOutTitle: {
    fontSize: 15,
    fontWeight: '900',
  },
  signOutDescription: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '700',
    marginTop: 2,
  },
  accountSection: {
    marginTop: 6,
  },
  advancedToggle: {
    minHeight: 54,
    marginHorizontal: 16,
    marginTop: 7,
    borderRadius: 12,
    borderWidth: 1.5,
    paddingHorizontal: 12,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  advancedCopy: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  advancedTitle: {
    fontSize: 15,
    fontWeight: '900',
  },
  advancedText: {
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 17,
    marginTop: 3,
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
    marginTop: 7,
    borderRadius: 12,
    borderWidth: 1.5,
    padding: 12,
    gap: 12,
  },
  resetCard: {
    marginHorizontal: 16,
    marginTop: 7,
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
    minHeight: 38,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetWorkButton: {
    minHeight: 38,
    borderRadius: 10,
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
