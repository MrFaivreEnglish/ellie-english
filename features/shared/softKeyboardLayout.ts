import { useRef } from 'react';
import { Platform, useWindowDimensions } from 'react-native';
import { isDesktopWebWidth } from './responsiveLayout';
import { isApkLayoutPreviewEnabled } from './apkPreview';



















// Non-desktop layouts reserve keyboard space before the keyboard opens.
export const reservesSoftKeyboardSpace = (width: number) => {
  const isGenuineDesktopWeb = Platform.OS === 'web' && !isApkLayoutPreviewEnabled() && isDesktopWebWidth(width);
  return !isGenuineDesktopWeb;
};













// Ignore keyboard-induced height shrink; width changes and genuine growth update the baseline.
export const useStableViewportHeight = () => {
  const { width, height } = useWindowDimensions();
  const baselineRef = useRef({ width, height });




  if (isDesktopWebWidth(width)) {
    baselineRef.current = { width, height };
    return height;
  }

  if (width !== baselineRef.current.width || height > baselineRef.current.height) {
    baselineRef.current = { width, height };
  }

  return baselineRef.current.height;
};
