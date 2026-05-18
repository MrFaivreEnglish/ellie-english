import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, ActivityIndicator, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as Font from 'expo-font';
import { enterImmersive, exitImmersiveOpaque } from '../lib/immersive';
import { useTheme } from '../contexts/ThemeContext';

export default function SplashScreen() {
  const navigation = useNavigation<any>();
  const { isShinyEllieMode, unlockShinyEllie, isAndroidStatusBarEnabled } = useTheme();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [isShiny, setIsShiny] = useState(isShinyEllieMode);

  useEffect(() => {
    enterImmersive().catch(() => {});

    // 🎲 SHINY ROLL (1 / 4096)
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
      exitImmersiveOpaque('#000000', 'light', Platform.OS !== 'android' || isAndroidStatusBarEnabled).catch(() => {});
    };
  }, []);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isShiny ? '#f4b942' : '#1671B6',
        },
      ]}
    >
      <Animated.View style={[styles.logoContainer, { opacity: fadeAnim }]}>
        <Text style={styles.logoText}>
          {isShiny ? '✨ Shiny Ellie ✨' : 'Ellie'}
        </Text>

        <Text style={styles.logoSubText}>My English Assistant</Text>
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
  },
  logoText: {
    fontSize: 70,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
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
