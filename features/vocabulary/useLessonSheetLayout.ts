import { Platform, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getApkPreviewStatusBarInset, isApkLayoutPreviewEnabled } from '../shared/apkPreview';

export type VocabularyMode = 'flashcards' | 'matching' | 'typing';

/**
 * Platform/viewport flags shared by the lesson screen's header, image stage,
 * practice dock and rising sheet. The old useLessonLayout.ts computed ~30
 * interdependent pixel constants to drive a scroll-to-reveal layout; the
 * fixed-column + overlay-sheet layout doesn't scroll, so practice-module
 * sizing is measured directly via onLayout instead of derived here.
 */
export function useLessonSheetLayout(isAndroidStatusBarEnabled: boolean) {
  const insets = useSafeAreaInsets();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const useApkPreviewLayout = isApkLayoutPreviewEnabled();

  const isAndroidLesson = Platform.OS === 'android' || useApkPreviewLayout;
  const isWebLessonLayout = Platform.OS === 'web' && !useApkPreviewLayout;
  const isDesktopWebLesson = isWebLessonLayout && screenWidth >= 768;

  const androidTopInsetValue = useApkPreviewLayout ? getApkPreviewStatusBarInset() : insets.top;
  const layoutTopInset = Platform.OS === 'ios'
    ? (insets.top > 0 ? insets.top : 0)
    : isAndroidLesson && isAndroidStatusBarEnabled
      ? androidTopInsetValue
      : 0;

  return {
    insets,
    screenWidth,
    screenHeight,
    useApkPreviewLayout,
    isAndroidLesson,
    isWebLessonLayout,
    isDesktopWebLesson,
    layoutTopInset,
  };
}
