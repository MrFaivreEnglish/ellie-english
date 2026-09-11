import { Platform, StatusBar, AppState } from 'react-native';
import { setNavigationBar } from './navigationBar';


let immersiveLock = false;
let systemChromeMode: 'app' | 'immersive' = 'app';
let appStatusBarVisible = true;
let immersiveNavigationBarColor = 'transparent';
let immersiveNavigationBarButtonStyle: 'dark' | 'light' = 'light';
export function setImmersiveLock(active: boolean) {
  immersiveLock = active;
}







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


  setImmersiveLock(true);

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





export function bindImmersiveOnForeground(
  appBackgroundColor = '#000000',
  appButtonStyle: 'dark' | 'light' = 'light'
): () => void {
  const sub = AppState.addEventListener('change', (state) => {
    if (state === 'active') {

      if (systemChromeMode === 'immersive' || immersiveLock) {
        applyImmersiveMode(immersiveNavigationBarColor, immersiveNavigationBarButtonStyle);
      } else {
        applyAppChrome(appBackgroundColor, appButtonStyle, appStatusBarVisible);
      }
    }
  });
  return () => sub.remove();
}
