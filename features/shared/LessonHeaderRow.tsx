import React from 'react';
import { Platform, StyleSheet, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { useFonts } from 'expo-font';
import { LibreFranklin_700Bold, LibreFranklin_800ExtraBold } from '@expo-google-fonts/libre-franklin';
import Text from './ThemedText';
import MaterialIcons from './ThemedMaterialIcon';
import { fontFamilyForWeight } from '../vocabulary/vocabRush/vocabRushFonts';
import type { ThemeColors } from '../settings/ThemeContext';
import { getWebLessonScale, scaleValue } from './responsiveLayout';

const HEADER_HIT_SLOP = { top: 5, bottom: 5, left: 5, right: 5 };




const IDLE_TITLE_FONT_SIZE = 17;
const IDLE_TITLE_FONT_SIZE_DESKTOP = 20;
// Native (APK) runs full-screen with no browser chrome above the header, so the lesson title
// can carry the extra weight that reads as cramped in a mobile browser tab.
const IDLE_TITLE_FONT_SIZE_NATIVE = 20;

export type LessonHeaderRowProps = {
  isDesktopWeb: boolean;
  isDarkMode: boolean;
  colors: ThemeColors;
  onBack: () => void;
  backLabel: string;




  title: string;
  activeModeLabel: string | null;

  idleTrailingSlot?: React.ReactNode;
};

const LessonHeaderRow: React.FC<LessonHeaderRowProps> = ({
  isDesktopWeb,
  colors,
  onBack,
  backLabel,
  title,
  activeModeLabel,
  idleTrailingSlot,
}) => {
  const { width, height } = useWindowDimensions();



  const desktopScale = getWebLessonScale(width, height);






  const isScaledLayout = isDesktopWeb || desktopScale > 1;
  const [chromeFontsLoaded] = useFonts({ LibreFranklin_700Bold, LibreFranklin_800ExtraBold });
  const chromeFont = (weight: '700' | '800') => (chromeFontsLoaded ? fontFamilyForWeight(weight) : undefined);
  const isActive = !!activeModeLabel;
  const idleTitleFontSize = isDesktopWeb
    ? IDLE_TITLE_FONT_SIZE_DESKTOP
    : Platform.OS === 'web'
      ? IDLE_TITLE_FONT_SIZE
      : IDLE_TITLE_FONT_SIZE_NATIVE;

  return (
    <View
      pointerEvents={isActive ? 'none' : 'auto'}
      style={[
        styles.header,
        isDesktopWeb ? styles.headerDesktop : styles.headerMobile,
        isScaledLayout && {
          minHeight: scaleValue(56, desktopScale),
          paddingTop: scaleValue(12, desktopScale),
          paddingHorizontal: scaleValue(32, desktopScale),
          paddingBottom: scaleValue(3, desktopScale),
          gap: scaleValue(14, desktopScale),
        },
      ]}
    >
      <TouchableOpacity
        onPress={onBack}
        accessibilityRole="button"
        accessibilityLabel={backLabel}
        hitSlop={HEADER_HIT_SLOP}
        style={[
          styles.iconButton,
          isDesktopWeb ? styles.iconButtonDesktop : styles.iconButtonMobile,
          isScaledLayout && {
            borderRadius: scaleValue(12, desktopScale),
            height: scaleValue(38, desktopScale),
            width: scaleValue(38, desktopScale),
          },
          { backgroundColor: colors.card },
        ]}
      >
        <MaterialIcons
          name="arrow-back"
          size={scaleValue(isDesktopWeb ? 16 : 15, desktopScale)}
          color={colors.secondaryText}
        />
      </TouchableOpacity>

      {!isActive && (
        <View style={[styles.titleRow, isDesktopWeb ? styles.titleRowDesktop : styles.titleRowMobile]}>
          <Text
            style={[
              styles.text,
              { fontSize: scaleValue(idleTitleFontSize, desktopScale) },
              styles.flex,
              { color: colors.text, fontFamily: chromeFont('800') },
            ]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {title}
          </Text>
        </View>
      )}

      {isActive && <View style={[styles.titleRow, isDesktopWeb ? styles.titleRowDesktop : styles.titleRowMobile]} />}

      {!isActive && idleTrailingSlot}
    </View>
  );
};

export default React.memo(LessonHeaderRow);

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    flexShrink: 0,
    gap: 14,
  },






  headerDesktop: {
    minHeight: 56,
    paddingTop: 12,
    paddingHorizontal: 32,
    paddingBottom: 3,
  },
  headerMobile: {
    minHeight: 44,
    paddingTop: 10,
    paddingHorizontal: 16,
    paddingBottom: 2,
  },
  iconButton: {
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0px 3px 8px rgba(0,0,0,0.05)',
    flexShrink: 0,
  },
  iconButtonDesktop: {
    borderRadius: 12,
    height: 38,
    width: 38,
  },
  iconButtonMobile: {
    borderRadius: 11,
    height: 34,
    width: 34,
  },
  titleRow: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    minWidth: 0,
  },
  titleRowDesktop: { gap: 9 },
  titleRowMobile: { gap: 7 },
  text: {
    includeFontPadding: false,
    fontWeight: '800',
  },
  textDesktop: {
    fontSize: 15,
    lineHeight: 19,
  },
  textMobile: {
    fontSize: 13.5,
    lineHeight: 18,
  },
  flex: {
    flex: 1,
    minWidth: 0,
  },
  shrink: {
    flexShrink: 1,
    minWidth: 0,
  },
});
