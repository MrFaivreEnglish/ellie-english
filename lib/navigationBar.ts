import { Platform } from 'react-native';

let NavigationBar: any;

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  NavigationBar = require('expo-navigation-bar');
} catch {
  NavigationBar = null;
}

/**
 * Set navigation bar appearance on Android
 * @param options.color Hex color for background (default transparent)
 * @param options.buttonStyle 'light' | 'dark' (default 'light')
 * @param options.visibility 'visible' | 'hidden' (default 'visible')
 * @param options.behavior 'inset' | 'overlay-swipe' | 'overlay-fixed' (default 'overlay-swipe')
 */
export async function setNavigationBar({
  color = 'transparent',
  buttonStyle = 'light',
  visibility = 'visible',
  behavior = 'overlay-swipe',
}: {
  color?: string;
  buttonStyle?: 'light' | 'dark';
  visibility?: 'visible' | 'hidden';
  behavior?: 'inset' | 'overlay-swipe' | 'overlay-fixed';
}) {
  if (Platform.OS !== 'android' || !NavigationBar) return;

  try {
    if (NavigationBar.setBackgroundColorAsync) await NavigationBar.setBackgroundColorAsync(color);
    if (NavigationBar.setButtonStyleAsync) await NavigationBar.setButtonStyleAsync(buttonStyle);
    if (NavigationBar.setVisibilityAsync) await NavigationBar.setVisibilityAsync(visibility);
    if (NavigationBar.setBehaviorAsync) await NavigationBar.setBehaviorAsync(behavior);
  } catch (err) {
    console.warn('Failed to set Android navigation bar:', err);
  }
}

/**
 * Hide navigation bar completely (immersive style)
 */
export async function hideNavigationBar() {
  await setNavigationBar({
    visibility: 'hidden',
    behavior: 'overlay-swipe',
    color: 'transparent',
    buttonStyle: 'light',
  });
}

/**
 * Show navigation bar with inset style (default)
 */
export async function showNavigationBar(
  color = '#000000',
  buttonStyle: 'dark' | 'light' = 'light'
) {
  await setNavigationBar({
    visibility: 'visible',
    behavior: 'inset',
    color,
    buttonStyle,
  });
}