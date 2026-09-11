import { useEffect, useRef, useState } from 'react';
import { View, Image, StyleSheet, Animated, ActivityIndicator, Platform, useWindowDimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as Font from 'expo-font';
import { enterImmersive, exitImmersiveOpaque } from '../../lib/immersive';
import { useTheme } from '../settings/ThemeContext';
import { getAndroidBottomBarButtonStyle, getAndroidBottomBarColor } from '../shared/appChromeColors';
import { getSplashBackground, getSplashCopy } from '../shared/homeMenuColors';
import { freshFontFamily } from '../shared/freshDirection';
import Text from '../shared/ThemedText';
import { getDesktopTypographyScale, isDesktopWebWidth } from '../shared/responsiveLayout';

export default function SplashScreen() {
  const navigation = useNavigation<any>();
  const { isShinyEllieMode, isShinyElliePresentationMode, unlockShinyEllie, isAndroidStatusBarEnabled, isDarkMode, colors } = useTheme();
  const { width, height } = useWindowDimensions();
  const isDesktopWeb = isDesktopWebWidth(width);
  const desktopScale = getDesktopTypographyScale(width, height, 'fit');
  // Tablet keeps the mobile structural layout (isDesktopWeb stays false)
  // but still gets a real desktopScale > 1 — numeric-only scale call sites
  // gate on this instead of isDesktopWeb alone, which used to leave tablet
  // at the flat phone size even though its own scale was already correct.
  const isScaledLayout = isDesktopWeb || desktopScale > 1;
  const appNavigationBarColor = getAndroidBottomBarColor(isDarkMode, colors);
  const appNavigationBarButtonStyle = getAndroidBottomBarButtonStyle(isDarkMode);
  const [isShiny, setIsShiny] = useState(isShinyElliePresentationMode);
  const splashBackground = getSplashBackground(isShinyElliePresentationMode);
  const splashCopy = getSplashCopy(isShiny);
  const logoFontSize = Math.round(
    isShiny
      ? isScaledLayout
        ? 64 * desktopScale
        : Math.min(54, Math.max(34, (width - 48) / 6.6))
      : isScaledLayout
        ? 72 * desktopScale
        : Math.min(64, Math.max(42, (width - 48) / 4.4))
  );

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const appChromeRef = useRef<{
    navigationBarColor: string;
    navigationBarButtonStyle: 'light' | 'dark';
    showStatusBar: boolean;
  }>({
    navigationBarColor: appNavigationBarColor,
    navigationBarButtonStyle: appNavigationBarButtonStyle,
    showStatusBar: Platform.OS !== 'android' || isAndroidStatusBarEnabled,
  });
  useEffect(() => {
    appChromeRef.current = {
      navigationBarColor: appNavigationBarColor,
      navigationBarButtonStyle: appNavigationBarButtonStyle,
      showStatusBar: Platform.OS !== 'android' || isAndroidStatusBarEnabled,
    };
  }, [appNavigationBarButtonStyle, appNavigationBarColor, isAndroidStatusBarEnabled]);

  useEffect(() => {
    enterImmersive(splashBackground, 'light').catch(() => {});
  }, [splashBackground]);

  useEffect(() => {

    const roll = Math.floor(Math.random() * 4096);
    const foundShiny = roll === 0;

    if (isShinyElliePresentationMode || foundShiny) {
      setIsShiny(true);
    }

    if (foundShiny) {
      unlockShinyEllie();
    }

    const loadResources = async () => {
      try {
        await Font.loadAsync({});

        Animated.sequence([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.delay(1200),
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 250,
            useNativeDriver: Platform.OS !== 'web',
          }),
        ]).start(() => {
          navigation.replace('Home');
        });
      } catch (error) {
        console.error('Error loading resources:', error);
        navigation.replace('MainTabs');
      }
    };

    loadResources();

    return () => {
      const appChrome = appChromeRef.current;
      exitImmersiveOpaque(
        appChrome.navigationBarColor,
        appChrome.navigationBarButtonStyle,
        appChrome.showStatusBar
      ).catch(() => {});
    };
  }, []);

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: splashBackground },
      ]}
    >
      <View
        style={[
          styles.decorativeCircle,
          styles.decorativeCircleTopRight,
          isScaledLayout && {
            width: Math.round(220 * desktopScale),
            height: Math.round(220 * desktopScale),
            top: Math.round(-60 * desktopScale),
            right: Math.round(-60 * desktopScale),
          },
          { pointerEvents: 'none' },
        ]}
      />
      <View
        style={[
          styles.decorativeCircle,
          styles.decorativeCircleBottomLeft,
          isScaledLayout && {
            width: Math.round(260 * desktopScale),
            height: Math.round(260 * desktopScale),
            bottom: Math.round(-80 * desktopScale),
            left: Math.round(-60 * desktopScale),
          },
          { pointerEvents: 'none' },
        ]}
      />

      <Animated.View style={[styles.logoContainer, { opacity: fadeAnim }]}>
        <View style={[
          styles.mark,
          isScaledLayout && {
            width: Math.round(108 * desktopScale),
            height: Math.round(108 * desktopScale),
            borderRadius: Math.round(28 * desktopScale),
            marginBottom: Math.round(22 * desktopScale),
          },
          isShinyEllieMode && styles.pixelMark,
        ]}>
          <Image
            source={require('../../assets/icony.png')}
            style={styles.markImage}
            resizeMode="contain"
          />
        </View>

        <Text
          style={[
            styles.logoText,
            { fontSize: logoFontSize },
            isDesktopWeb && styles.logoTextDesktop,
            isScaledLayout && { lineHeight: Math.round((isShiny ? 82 : 102) * desktopScale) },
          ]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.72}
          allowFontScaling={false}
        >
          {splashCopy.title}
        </Text>

        <Text
          style={[
            styles.logoSubText,
            isDesktopWeb && styles.logoSubTextDesktop,
            isScaledLayout && { fontSize: Math.round(28 * desktopScale), lineHeight: Math.round(36 * desktopScale) },
          ]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.5}
          allowFontScaling={false}
        >
          {splashCopy.subtitle}
        </Text>
      </Animated.View>

      <Animated.View style={[styles.creditRow, { opacity: fadeAnim }]}>
        <Text style={[
          styles.logoSubSubText,
          isDesktopWeb && styles.logoSubSubTextDesktop,
          isScaledLayout && { fontSize: Math.round(18 * desktopScale), lineHeight: Math.round(24 * desktopScale) },
        ]}>By Mr Faivre</Text>
        <ActivityIndicator size="small" color="white" style={styles.loader} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  decorativeCircle: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  decorativeCircleTopRight: {
    width: 220,
    height: 220,
    top: -60,
    right: -60,
  },
  decorativeCircleBottomLeft: {
    width: 260,
    height: 260,
    bottom: -80,
    left: -60,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  logoContainer: {
    alignItems: 'center',
    paddingHorizontal: 24,
    width: '100%',
  },
  mark: {
    width: 108,
    height: 108,
    borderRadius: 28,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 22,
    boxShadow: '0px 12px 28px rgba(0,0,0,0.15)',
  },
  markImage: {
    width: '72%',
    height: '72%',
  },
  pixelMark: {
    borderRadius: 2,
    boxShadow: '8px 8px 0 rgba(122,75,0,0.45)',
  },
  markEmoji: {
    fontSize: 46,
  },
  logoText: {
    fontWeight: freshFontFamily.extrabold,
    fontSize: 72,
    letterSpacing: -0.6,
    color: 'white',
    textAlign: 'center',
    width: '100%',
  },
  logoTextDesktop: {
    lineHeight: 102,
    letterSpacing: -1,
  },
  logoSubText: {
    fontWeight: freshFontFamily.semibold,
    fontSize: 22,
    color: 'white',
    marginTop: 10,
    opacity: 0.85,
    textAlign: 'center',
    width: '100%',
  },
  logoSubTextDesktop: {
    fontSize: 28,
    lineHeight: 36,
    marginTop: 12,
  },
  creditRow: {
    position: 'absolute',
    bottom: 64,
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: 14,
  },
  logoSubSubText: {
    fontWeight: freshFontFamily.semibold,
    fontSize: 16,
    color: 'white',
    opacity: 0.6,
    textAlign: 'center',
  },
  logoSubSubTextDesktop: {
    fontSize: 18,
    lineHeight: 24,
  },
  loader: {
    marginTop: 2,
  },
});
