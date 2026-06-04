import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, ActivityIndicator, Platform, useWindowDimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as Font from 'expo-font';
import { enterImmersive, exitImmersiveOpaque } from '../../lib/immersive';
import { useTheme } from '../settings/ThemeContext';
import { getAndroidBottomBarButtonStyle, getAndroidBottomBarColor } from '../shared/appChromeColors';
import { DEFAULT_SPLASH_BACKGROUND, SHINY_SPLASH_BACKGROUND } from '../shared/homeMenuColors';

export default function SplashScreen() {
  const navigation = useNavigation<any>();
  const { isShinyEllieMode, unlockShinyEllie, isAndroidStatusBarEnabled, isDarkMode, colors } = useTheme();
  const { width } = useWindowDimensions();
  const appNavigationBarColor = getAndroidBottomBarColor(isDarkMode, colors);
  const appNavigationBarButtonStyle = getAndroidBottomBarButtonStyle(isDarkMode);
  const [isShiny, setIsShiny] = useState(isShinyEllieMode);
  const splashBackground = isShiny ? SHINY_SPLASH_BACKGROUND : DEFAULT_SPLASH_BACKGROUND;
  const shinyLogoFontSize = Math.round(Math.min(58, Math.max(34, (width - 48) / 9.6)));

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
      <Animated.View style={[styles.logoContainer, { opacity: fadeAnim }]}>
        <Text
          style={[styles.logoText, isShiny && styles.logoTextShiny, isShiny && { fontSize: shinyLogoFontSize }]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.72}
          allowFontScaling={false}
        >
          {isShiny ? '\u2728 Shiny Ellie \u2728' : 'Ellie'}
        </Text>

        <Text style={styles.logoSubText}>{isShiny ? 'A Shiny Ellie appeared!' : 'My English Assistant'}</Text>
        <Text style={styles.logoSubSubText}>By Mr Faivre</Text>

        <ActivityIndicator size="large" color="white" style={styles.loader} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    paddingHorizontal: 24,
    width: '100%',
  },
  logoText: {
    fontSize: 70,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    width: '100%',
  },
  logoTextShiny: {
    fontSize: 58,
  },
  logoSubText: {
    fontSize: 32,
    color: 'white',
    marginTop: 16,
    opacity: 0.9,
    textAlign: 'center',
  },
  logoSubSubText: {
    fontSize: 24,
    color: 'white',
    marginTop: 12,
    opacity: 0.8,
    textAlign: 'center',
  },
  loader: {
    marginTop: 20,
  },
});
