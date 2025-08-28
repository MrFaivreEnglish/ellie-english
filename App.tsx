import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer, DefaultTheme as NavDefaultTheme, DarkTheme as NavDarkTheme } from '@react-navigation/native';
import { BackHandler, StatusBar, View, Image, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import 'react-native-gesture-handler';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SplashScreen from './screens/SplashScreen';
import { StyleSheet } from 'react-native';
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Toaster } from 'sonner-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import HomeScreen from "./screens/HomeScreen";
import GrammarScreen from "./screens/GrammarScreen";
import VocabularyScreen from "./screens/VocabularyScreen";
import LessonsScreen from "./screens/LessonsScreen";
import VocabularyLessonScreen from "./screens/VocabularyLessonScreen";
import SettingsScreen from "./screens/SettingsScreen";
import { Asset } from 'expo-asset';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function VocabularyStack(): React.JSX.Element {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="VocabularyList" 
        component={VocabularyScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="VocabularyLesson" 
        component={VocabularyLessonScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

function MainTabNavigator() {
  const { isDarkMode, colors } = useTheme();
  
  return (
    <Tab.Navigator
      backBehavior="none" // Let hardware back press bubble up to RootStack (we handle it globally)
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Grammar') {
            iconName = 'edit';
          } else if (route.name === 'Vocabulary') {
            iconName = 'style';
          } else if (route.name === 'Lessons') {
            iconName = 'menu-book';
          } else if (route.name === 'Settings') {
            iconName = 'settings';
          }
          return <MaterialIcons name={iconName} size={size} color={color} />;
        },        
        tabBarActiveTintColor: '#1671B6',
        tabBarInactiveTintColor: isDarkMode ? '#dddddd' : 'gray',
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: isDarkMode ? '#415a77' : '#eeeeee',
        },
      })}
    >
      <Tab.Screen name="Grammar" component={GrammarScreen} />
      <Tab.Screen name="Vocabulary" component={VocabularyStack} />
      <Tab.Screen name="Lessons" component={LessonsScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

function RootStack() {
  return (
    <Stack.Navigator
      initialRouteName="Splash"
      screenOptions={{ 
        headerShown: false,
        gestureEnabled: true,
        gestureDirection: 'horizontal'
      }}
    >
      <Stack.Screen 
        name="Splash" 
        component={SplashScreen}
        options={{
          gestureEnabled: false
        }} 
      />
      <Stack.Screen 
        name="Home" 
        component={HomeScreen}
        options={{
          gestureEnabled: false
        }}
      />
      <Stack.Screen 
        name="MainTabs" 
        component={MainTabNavigator}
        options={{
          gestureEnabled: true
        }}
      />
    </Stack.Navigator>
  );
}

function AppInner() {
  const navigationRef = React.useRef<any>(null);
  const { isDarkMode, colors } = useTheme();
  const [currentRoute, setCurrentRoute] = React.useState<string>('Splash');
  const splashBG = '#1671B6';

  // Preload lesson thumbnails (handles both bundled require() assets and http URIs)
  React.useEffect(() => {
    let mounted = true;
    const preloadThumbnails = async () => {
      try {
        // @ts-ignore - dynamic require of the generated assets index
        const Assets = require('./assets');
        const thumbs = Assets?.lessonThumbnails || {};
        const tasks: Promise<any>[] = [];

        Object.values(thumbs).forEach((entry: any) => {
          if (!entry) return;
          // Metro returns numeric module ids for require('./image.png') -> typeof entry === 'number'
          if (typeof entry === 'number') {
            tasks.push(Asset.loadAsync(entry));
          } else if (entry.uri && typeof entry.uri === 'string') {
            // Skip data URIs (already embedded). Prefetch http(s) URIs to warm cache.
            if (entry.uri.startsWith('http')) {
              tasks.push(Image.prefetch(entry.uri));
            }
          }
        });

        if (tasks.length) await Promise.all(tasks);
        if (mounted) console.log('Lesson thumbnails preloaded');
      } catch (err) {
        console.warn('Error preloading lesson thumbnails', err);
      }
    };

    preloadThumbnails();
    return () => { mounted = false; };
  }, []);

  // Global hardware back press handler
  React.useEffect(() => {
    const onBackPress = () => {
      const nav = navigationRef.current;
      const route = nav?.getCurrentRoute()?.name;

      if (route && ['MainTabs', 'Grammar', 'Vocabulary', 'VocabularyList', 'Lessons', 'Settings'].includes(route)) {
        // From any tab, go back to Home
        nav.navigate('Home');
        return true;
      }
      // Otherwise use default back if possible
      if (nav?.canGoBack()) {
        nav.goBack();
        return true;
      }
      return false; // exit app
    };

    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, []);

  return (
    <>
      {/* Full-width to capture scroll even when cursor is in the margins */}
      <SafeAreaProvider style={{ flex: 1, backgroundColor: currentRoute === 'Splash' ? splashBG : colors.background }}>
        <Toaster />
        {/* Show a translucent status bar to allow edge-to-edge content on Android */}
        <StatusBar
          hidden={Platform.OS === 'android'}
          translucent
          backgroundColor="transparent"
          barStyle={currentRoute === 'Splash' ? 'light-content' : (isDarkMode ? 'light-content' : 'dark-content')}
          animated
        />
        {/* Width-constrained content wrapper */}
        <View style={styles.contentWrapper}>
          <NavigationContainer
            ref={navigationRef}
            theme={isDarkMode ? NavDarkTheme : NavDefaultTheme}
            onReady={() => {
              const name = navigationRef.current?.getCurrentRoute()?.name;
              if (name) setCurrentRoute(name);
            }}
            onStateChange={() => {
              const name = navigationRef.current?.getCurrentRoute()?.name;
              if (name) setCurrentRoute(name);
            }}
          >
            <RootStack />
          </NavigationContainer>
        </View>
      </SafeAreaProvider>
    </>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <AppInner />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  // Wrapper that centres the actual app column but lets the SafeAreaProvider span
  contentWrapper: {
    flex: 1,
    userSelect: 'none',
    maxWidth: 800,
    width: '100%',
    alignSelf: 'center',
  },
});