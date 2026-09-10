import { useCallback, useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Updates from 'expo-updates';
import { useTheme } from '../settings/ThemeContext';
import Text from '../shared/ThemedText';
import MaterialIcons from '../shared/ThemedMaterialIcon';

// Students install the APK by hand, so an OTA update is the only way a fix
// reaches them. fallbackToCacheTimeout is 0 (startup never waits on the
// network), which means a downloaded update would otherwise sit unused until
// the next cold start. This offers it as soon as it has landed instead.
//
// It only ever offers — never reloads on its own. A silent restart mid-quiz
// would throw away whatever the student was in the middle of.
export default function UpdateBanner() {
  const { colors, isDarkMode } = useTheme();
  const insets = useSafeAreaInsets();
  const [dismissed, setDismissed] = useState(false);
  const [reloading, setReloading] = useState(false);
  const { isUpdatePending } = Updates.useUpdates();

  const handleReload = useCallback(async () => {
    if (reloading) return;
    setReloading(true);

    try {
      await Updates.reloadAsync();
    } catch {
      // A failed reload is not worth an error message: the update still
      // applies on the next cold start, so step out of the way instead.
      setReloading(false);
      setDismissed(true);
    }
  }, [reloading]);

  // Web has no updates to apply, and neither does a dev client running from
  // Metro, so the banner stays out of both.
  if (Platform.OS === 'web' || !Updates.isEnabled) return null;
  if (!isUpdatePending || dismissed) return null;

  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrap, { bottom: insets.bottom + 84 }]}
    >
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.card,
            borderColor: colors.primary,
            shadowOpacity: isDarkMode ? 0.5 : 0.2,
          },
        ]}
      >
        <View style={[styles.iconBubble, { backgroundColor: colors.primary }]}>
          <MaterialIcons name="cloud-download" size={22} color={colors.card} />
        </View>

        <View style={styles.copy}>
          <Text style={[styles.title, { color: colors.text }]}>
            {reloading ? 'Updating Ellie...' : 'New version ready'}
          </Text>
          <Text style={[styles.subtitle, { color: colors.text }]}>
            {reloading ? 'One moment' : 'Tap refresh to get the latest lessons'}
          </Text>
        </View>

        <Pressable
          onPress={handleReload}
          disabled={reloading}
          accessibilityRole="button"
          accessibilityLabel="Restart to apply the new version"
          style={[styles.button, { backgroundColor: colors.primary, opacity: reloading ? 0.6 : 1 }]}
        >
          <Text style={[styles.buttonLabel, { color: colors.card }]}>Refresh</Text>
        </Pressable>

        <Pressable
          onPress={() => setDismissed(true)}
          accessibilityRole="button"
          accessibilityLabel="Dismiss"
          hitSlop={12}
          style={styles.close}
        >
          <MaterialIcons name="close" size={18} color={colors.text} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 12,
    zIndex: 900,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    maxWidth: 460,
    borderWidth: 2,
    borderRadius: 20,
    paddingLeft: 12,
    paddingRight: 10,
    paddingVertical: 12,
    gap: 12,
    shadowColor: '#000',
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
  iconBubble: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    flexShrink: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
    opacity: 0.7,
  },
  button: {
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 999,
  },
  buttonLabel: {
    fontSize: 14,
    fontWeight: '800',
  },
  close: {
    padding: 4,
    opacity: 0.55,
  },
});
