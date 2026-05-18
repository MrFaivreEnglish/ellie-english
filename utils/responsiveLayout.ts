import { Platform } from 'react-native';

export const clampNumber = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export const getWebAppContentMaxWidth = (windowWidth: number) => {
  if (Platform.OS !== 'web') return 800;

  return Math.round(clampNumber(windowWidth * 0.78, 800, 1440));
};

export const getWebLessonScale = (windowWidth: number, windowHeight: number) => {
  if (Platform.OS !== 'web' || windowWidth < 900) return 1;

  const widthScale = windowWidth / 1180;
  const heightScale = windowHeight / 820;
  return clampNumber(Math.min(widthScale, heightScale), 1, 1.1);
};

export const getWebLessonImageScale = (windowWidth: number, windowHeight: number) => {
  if (Platform.OS !== 'web' || windowWidth < 768) return 1;

  const widthScale = windowWidth / 900;
  const heightScale = windowHeight / 820;
  return clampNumber(Math.min(widthScale, heightScale), 1, 1.1);
};

export const scaleValue = (value: number, scale: number) =>
  Math.round(value * scale);
