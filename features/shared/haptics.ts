import { Platform, Vibration } from 'react-native';
import * as Haptics from 'expo-haptics';

type WebNavigatorWithVibrate = Navigator & {
  vibrate?: (pattern: number | number[]) => boolean;
};

const vibrateWeb = (pattern: number | number[]) => {
  if (Platform.OS !== 'web') return;
  if (typeof globalThis === 'undefined') return;

  const navigatorWithVibrate = globalThis.navigator as WebNavigatorWithVibrate | undefined;
  if (typeof navigatorWithVibrate?.vibrate !== 'function') return;

  try {
    navigatorWithVibrate.vibrate(pattern);
  } catch {}
};

const canUseNativeHaptics = Platform.OS === 'ios' || Platform.OS === 'android';

export const hapticsAreSupported = canUseNativeHaptics || Platform.OS === 'web';
let hapticsEnabled = hapticsAreSupported;

export const setHapticsEnabled = (enabled: boolean) => {
  hapticsEnabled = hapticsAreSupported && enabled;
  if (!enabled) vibrateWeb(0);
};

const runNativeHaptic = (effect: () => Promise<void>, webPattern: number | number[]) => {
  if (!hapticsAreSupported || !hapticsEnabled) return;

  if (Platform.OS === 'web') {
    vibrateWeb(webPattern);
    return;
  }

  void effect().catch(() => {
    Vibration.vibrate(webPattern);
  });
};

export const triggerSelectionHaptic = () => {
  runNativeHaptic(
    () => Haptics.selectionAsync(),
    18
  );
};

export const triggerSuccessHaptic = () => {
  runNativeHaptic(
    () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
    [18, 22, 18]
  );
};

export const triggerWarningHaptic = () => {
  runNativeHaptic(
    () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
    [22, 28, 22]
  );
};
