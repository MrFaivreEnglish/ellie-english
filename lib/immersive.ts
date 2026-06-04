import { Platform, StatusBar, AppState } from 'react-native';
import { setNavigationBar } from './navigationBar';

// Global immersive lock: when true, applyImmersiveMode will keep nav hidden (used by overlays/modals)
let immersiveLock = false;
let systemChromeMode: 'app' | 'immersive' = 'app';
let appStatusBarVisible = true;
let immersiveNavigationBarColor = 'transparent';
let immersiveNavigationBarButtonStyle: 'dark' | 'light' = 'light';
export function setImmersiveLock(active: boolean) {
  immersiveLock = active;
}

/**
 * Enter immersive (fullscreen) mode for screens that should hide the Android
 * navigation bar (e.g. splash, full-image viewer).
 * - Hides the status bar where possible
 * - Hides Android navigation bar with overlay behavior and transparent background
 */
export async function enterImmersive(
  navigationBarColor = 'transparent',
  navigationBarButtonStyle: 'dark' | 'light' = 'light'
): Promise<void> {
  systemChromeMode = 'immersive';
  immersiveNavigationBarColor = navigationBarColor;
  immersiveNavigationBarButtonStyle = navigationBarButtonStyle;

  try {
    StatusBar.setHidden(true, 'fade');
  } catch {}

  // Activate lock so foreground re-applies keep nav hidden
  setImmersiveLock(true);

  if (Platform.OS === 'android') {
    // Use centralized navigationBar helper which safely requires the native module
    // and guards against missing packages or undefined requires.
    try {
      await setNavigationBar({
        visibility: 'hidden',
        behavior: 'overlay-swipe',
        color: navigationBarColor,
        buttonStyle: navigationBarButtonStyle,
      });
    } catch {}
  }
}

/**
 * Exit immersive mode and make the Android navigation bar visible with an
 * opaque background color. Use from screens like Home to ensure nav is shown.
 *
 * @param backgroundColor hex color for nav background (default: '#ffffff')
 * @param buttonStyle 'dark' | 'light' preferred button icon style
 */
export async function exitImmersiveOpaque(
  backgroundColor = '#000000',
  buttonStyle: 'dark' | 'light' = 'light',
  showStatusBar = true
): Promise<void> {
  systemChromeMode = 'app';
  appStatusBarVisible = showStatusBar;

  try {
    StatusBar.setHidden(!showStatusBar, 'fade');
  } catch {}

  // Release lock so future applyImmersiveMode can restore default app behavior
  setImmersiveLock(false);

  if (Platform.OS === 'android') {
    try {
      await setNavigationBar({
        visibility: 'visible',
        behavior: 'inset',
        color: backgroundColor,
        buttonStyle,
      });
    } catch {}
  }
}

/**
 * Restore normal app chrome for non-immersive screens.
 * Shows the Android/iOS status bar and keeps Android navigation visible.
 */
export async function applyAppChrome(
  backgroundColor = '#000000',
  buttonStyle: 'dark' | 'light' = 'light',
  showStatusBar = true
): Promise<void> {
  systemChromeMode = 'app';
  appStatusBarVisible = showStatusBar;
  setImmersiveLock(false);

  try {
    StatusBar.setHidden(!showStatusBar, 'fade');
  } catch {}

  if (Platform.OS === 'android') {
    try {
      await setNavigationBar({
        visibility: 'visible',
        behavior: 'inset',
        color: backgroundColor,
        buttonStyle,
      });
    } catch {}
  }
}

/**
 * Apply immersive, edge-to-edge UI across the app.
 * - Hides the status bar (iOS & Android)
 * - On Android, respects immersiveLock: when true, keeps nav hidden with overlay-swipe;
 *   otherwise, leaves current nav bar configuration as-is (so screens can control it).
 */
export async function applyImmersiveMode(
  navigationBarColor = 'transparent',
  navigationBarButtonStyle: 'dark' | 'light' = 'light'
): Promise<void> {
  systemChromeMode = 'immersive';
  immersiveNavigationBarColor = navigationBarColor;
  immersiveNavigationBarButtonStyle = navigationBarButtonStyle;

  try {
    StatusBar.setHidden(true, 'fade');
  } catch {}

  if (Platform.OS === 'android') {
    try {
      await setNavigationBar({
        visibility: 'hidden',
        behavior: 'overlay-swipe',
        color: navigationBarColor,
        buttonStyle: navigationBarButtonStyle,
      });
    } catch {}
  }
}

/**
 * Attach a foreground listener so immersive mode is reapplied whenever the app
 * returns to the foreground (Android can sometimes reveal system bars on resume).
 */
export function bindImmersiveOnForeground(
  appBackgroundColor = '#000000',
  appButtonStyle: 'dark' | 'light' = 'light'
): () => void {
  const sub = AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      // Fire and forget; no need to await
      if (systemChromeMode === 'immersive' || immersiveLock) {
        applyImmersiveMode(immersiveNavigationBarColor, immersiveNavigationBarButtonStyle);
      } else {
        applyAppChrome(appBackgroundColor, appButtonStyle, appStatusBarVisible);
      }
    }
  });
  return () => sub.remove();
}
