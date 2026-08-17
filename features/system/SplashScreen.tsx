import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Image, StyleSheet, Animated, ActivityIndicator, Platform, useWindowDimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as Font from 'expo-font';
import { enterImmersive, exitImmersiveOpaque } from '../../lib/immersive';
import { useTheme } from '../settings/ThemeContext';
import { getAndroidBottomBarButtonStyle, getAndroidBottomBarColor } from '../shared/appChromeColors';
import { DEFAULT_SPLASH_BACKGROUND, SHINY_SPLASH_BACKGROUND } from '../shared/homeMenuColors';
import { freshFontFamily } from '../shared/freshDirection';

export default function SplashScreen() {
  const navigation = useNavigation<any>();
  const { isShinyEllieMode, unlockShinyEllie, isAndroidStatusBarEnabled, isDarkMode, colors } = useTheme();
  const { width } = useWindowDimensions();
  const appNavigationBarColor = getAndroidBottomBarColor(isDarkMode, colors);
  const appNavigationBarButtonStyle = getAndroidBottomBarButtonStyle(isDarkMode);
  const [isShiny, setIsShiny] = useState(isShinyEllieMode);
  const splashBackground = isShiny ? SHINY_SPLASH_BACKGROUND : DEFAULT_SPLASH_BACKGROUND;
  const shinyLogoFontSize = Math.round(Math.min(64, Math.max(34, (width - 48) / 6.6)));

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
    // Shiny roll: 1 / 4096.
    const roll = Math.floor(Math.random() * 4096);
    const foundShiny = roll === 0;

    if (isShinyEllieMode || foundShiny) {
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
            useNativeDriver: true,
          }),
          Animated.delay(1200),
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 250,
            useNativeDriver: true,
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
      <View style={[styles.decorativeCircle, styles.decorativeCircleTopRight]} pointerEvents="none" />
      <View style={[styles.decorativeCircle, styles.decorativeCircleBottomLeft]} pointerEvents="none" />

      <Animated.View style={[styles.logoContainer, { opacity: fadeAnim }]}>
        <View style={styles.mark}>
          {isShiny ? (
            <Text style={styles.markEmoji}>{'\u2728'}</Text>
          ) : (
            <Image
              source={require('../../assets/icony.png')}
              style={styles.markImage}
              resizeMode="contain"
            />
          )}
        </View>

        <Text
          style={[styles.logoText, isShiny && { fontSize: shinyLogoFontSize }]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.72}
          allowFontScaling={false}
        >
          {isShiny ? 'Shiny Ellie' : 'Ellie'}
        </Text>

        <Text style={styles.logoSubText}>{isShiny ? 'A Shiny Ellie appeared!' : 'My English Assistant'}</Text>
      </Animated.View>

      <Animated.View style={[styles.creditRow, { opacity: fadeAnim }]}>
        <Text style={styles.logoSubSubText}>By Mr Faivre</Text>
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
  logoSubText: {
    fontWeight: freshFontFamily.semibold,
    fontSize: 22,
    color: 'white',
    marginTop: 10,
    opacity: 0.85,
    textAlign: 'center',
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
  loader: {
    marginTop: 2,
  },
});
