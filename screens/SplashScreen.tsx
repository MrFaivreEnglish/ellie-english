import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as Font from 'expo-font';

export default function SplashScreen() {
  const navigation = useNavigation();
  const fadeAnim = new Animated.Value(0);

  useEffect(() => {
    // Load any fonts or other resources here
    const loadResources = async () => {
      try {
        // Load any fonts or other resources here
        await Font.loadAsync({
          // Add any custom fonts here if needed
        });

        // Start fade animation
        Animated.sequence([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.delay(1200)
        ]).start(() => {          // Navigate to Home after resources are loaded
          navigation.replace('Home');
        });
      } catch (error) {
        console.error('Error loading resources:', error);
        // Navigate to Home even if there's an error
        navigation.replace('MainTabs');
      }
    };

    loadResources();

    // No cleanup needed for StatusBar because the entire app keeps it hidden globally
    return () => {};
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.logoContainer, { opacity: fadeAnim }]}>
        <Text style={styles.logoText}>Ellie</Text>
        <Text style={styles.logoSubText}>My English Assistant</Text>
        <Text style={styles.logoSubSubText}>By Mr Faivre</Text>
        <ActivityIndicator size="large" color="#fff" style={styles.loader} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,    backgroundColor: '#1671B6',
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
    marginTop: 16, // extra spacing for clarity
    opacity: 0.9,
    textAlign: 'center',
  },
  logoSubSubText: {
    fontSize: 24,
    color: 'white',
    marginTop: 12, // extra spacing for clarity
    opacity: 0.8,
    textAlign: 'center',
  },
  loader: {
    marginTop: 20,
  }
});