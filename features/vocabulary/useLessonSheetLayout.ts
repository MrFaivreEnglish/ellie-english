import { Platform, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getApkPreviewStatusBarInset, isApkLayoutPreviewEnabled } from '../shared/apkPreview';
import { isDesktopWebWidth } from '../shared/responsiveLayout';

export type VocabularyMode = 'flashcards' | 'matching' | 'typing';








export function useLessonSheetLayout(isAndroidStatusBarEnabled: boolean) {
  const insets = useSafeAreaInsets();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const useApkPreviewLayout = isApkLayoutPreviewEnabled();

  const isAndroidLesson = Platform.OS === 'android' || useApkPreviewLayout;
  const isWebLessonLayout = Platform.OS === 'web' && !useApkPreviewLayout;




  const isDesktopWebLesson = isWebLessonLayout && isDesktopWebWidth(screenWidth, undefined, screenHeight);

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
