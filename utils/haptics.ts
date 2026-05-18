import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

type WebNavigatorWithVibrate = Navigator & {
  vibrate?: (pattern: number | number[]) => boolean;
};

const canUseNativeHaptics = Platform.OS === 'ios' || Platform.OS === 'android';

export const hapticsAreSupported = canUseNativeHaptics || Platform.OS === 'web';
let hapticsEnabled = hapticsAreSupported;

const triggerWebVibration = (pattern: number | number[]) => {
  if (Platform.OS !== 'web') return;
  if (typeof globalThis === 'undefined') return;

  const navigatorWithVibrate = globalThis.navigator as WebNavigatorWithVibrate | undefined;
  if (typeof navigatorWithVibrate?.vibrate !== 'function') return;

  try {
    navigatorWithVibrate.vibrate(pattern);
  } catch {}
};

const trigger = (effect: () => Promise<void>, webPattern: number | number[]) => {
  if (!hapticsAreSupported || !hapticsEnabled) return;

  if (!canUseNativeHaptics) {
    triggerWebVibration(webPattern);
    return;
  }

  void effect().catch(() => {});
};

export const setHapticsEnabled = (enabled: boolean) => {
  hapticsEnabled = hapticsAreSupported && enabled;
  if (!enabled) triggerWebVibration(0);
};

export const triggerSelectionHaptic = () => {
  trigger(() => Haptics.selectionAsync(), 20);
};

export const triggerSuccessHaptic = () => {
  trigger(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success), [20, 30, 35]);
};

export const triggerWarningHaptic = () => {
  trigger(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning), [45, 40, 45]);
};
