type AppChromeColors = Record<string, unknown>;

export const getAndroidBottomBarColor = (isDarkMode: boolean, _colors: AppChromeColors) =>
  isDarkMode ? '#071A2D' : '#FFFFFF';

export const getAndroidBottomBarButtonStyle = (isDarkMode: boolean): 'light' | 'dark' =>
  isDarkMode ? 'light' : 'dark';
