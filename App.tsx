import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer, DefaultTheme as NavDefaultTheme, DarkTheme as NavDarkTheme } from '@react-navigation/native';
import { BackHandler, View, Image, Platform, Text, useWindowDimensions } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import 'react-native-gesture-handler';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SplashScreen from './features/system/SplashScreen';
import { StyleSheet } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import { Toaster } from 'sonner-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ThemeProvider, useTheme } from './features/settings/ThemeContext';
import { AccountProvider } from './features/account/AccountContext';
import HomeScreen from "./features/home/HomeScreen";
import GrammarScreen from "./features/grammar/GrammarScreen";
import VocabularyScreen from "./features/vocabulary/VocabularyScreen";
import LessonsScreen from "./features/lessons/LessonsScreen";
import VocabularyLessonScreen from "./features/vocabulary/VocabularyLessonScreen";
import SettingsScreen from "./features/settings/SettingsScreen";
import AccountScreen from "./features/account/AccountScreen";
import AdminLessonPreviewScreen from "./features/lessons/AdminLessonPreviewScreen";
import { Asset } from 'expo-asset';
import { applyAppChrome, applyImmersiveMode, bindImmersiveOnForeground } from './lib/immersive';
import FullImageScreen from './features/shared/FullImageScreen';
import { StatusBar } from 'expo-status-bar';
import { getWebAppContentMaxWidth } from './features/shared/responsiveLayout';
import { getMenuCopy } from './features/shared/menuCopy';
import {
  DEFAULT_SPLASH_BACKGROUND,
  HOME_MENU_ROUTE_COLORS,
  SHINY_HOME_MENU_ROUTE_COLORS,
  SHINY_SPLASH_BACKGROUND,
  SHINY_TAB_IDENTITY_BORDER_COLORS,
  SHINY_TAB_IDENTITY_SOFT_COLORS,
} from './features/shared/homeMenuColors';
import { getAndroidBottomBarButtonStyle, getAndroidBottomBarColor } from './features/shared/appChromeColors';
import { getApkPreviewContentMaxWidth, isApkLayoutPreviewEnabled } from './features/shared/apkPreview';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();
type MaterialIconName = React.ComponentProps<typeof MaterialIcons>['name'];

const tabIcons: Record<string, MaterialIconName> = {
  Grammar: 'edit',
  Vocabulary: 'style',
  Lessons: 'menu-book',
  Settings: 'settings',
};
const tabIdentitySoftColors: Record<string, string> = {
  Grammar: 'rgba(140,203,255,0.18)',
  Vocabulary: 'rgba(116,218,210,0.18)',
  Lessons: 'rgba(196,180,244,0.18)',
  Settings: 'rgba(183,198,213,0.18)',
};
const tabIdentityBorderColors: Record<string, string> = {
  Grammar: 'rgba(140,203,255,0.34)',
  Vocabulary: 'rgba(116,218,210,0.34)',
  Lessons: 'rgba(196,180,244,0.34)',
  Settings: 'rgba(183,198,213,0.34)',
};

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
  const { isDarkMode, colors, menuLanguage, isShinyEllieMode } = useTheme();
  const copy = getMenuCopy(menuLanguage);
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [tabState, setTabState] = React.useState<any>(null);
  const isCompactTabBar = width < 430;
  const isLargeTabBar = width >= 900;
  const useApkPreviewLayout = isApkLayoutPreviewEnabled();
  const isAndroidTabBarLayout = Platform.OS === 'android' || useApkPreviewLayout;
  const isWebTabBar = Platform.OS === 'web' && !useApkPreviewLayout;
  const androidSystemNavInset = isAndroidTabBarLayout ? Math.max(insets.bottom, 24) : 0;
  const tabBarBaseHeight = isWebTabBar ? (isCompactTabBar ? 58 : isLargeTabBar ? 60 : 58) : (isCompactTabBar ? 48 : isLargeTabBar ? 50 : 48);
  const tabBarHeight = tabBarBaseHeight + androidSystemNavInset;
  const tabBarIconSize = isCompactTabBar ? 22 : isLargeTabBar ? 23 : 22;
  const tabBarLabelFontSize = isCompactTabBar ? 11 : isLargeTabBar ? 12 : 11;
  const tabBarLabelLineHeight = isCompactTabBar ? 13 : isLargeTabBar ? 14 : 13;
  const tabBarStylePaddingBottom = androidSystemNavInset;
  const tabBarTopBorderWidth = isAndroidTabBarLayout ? 0 : StyleSheet.hairlineWidth;
  const tabBarBackgroundColor = isDarkMode
    ? colors.card
    : isAndroidTabBarLayout
      ? getAndroidBottomBarColor(isDarkMode, colors)
      : 'rgba(255, 255, 255, 0.82)';
  const tabRouteColors: Record<string, string> = isShinyEllieMode ? SHINY_HOME_MENU_ROUTE_COLORS : HOME_MENU_ROUTE_COLORS;
  const tabSoftColors: Record<string, string> = isShinyEllieMode ? SHINY_TAB_IDENTITY_SOFT_COLORS : tabIdentitySoftColors;
  const tabBorderColors: Record<string, string> = isShinyEllieMode ? SHINY_TAB_IDENTITY_BORDER_COLORS : tabIdentityBorderColors;
  const tabLabels = React.useMemo(
    () => ({
      Grammar: copy.home.grammarTitle,
      Vocabulary: isCompactTabBar ? 'Vocab' : copy.home.vocabularyTitle,
      Lessons: isCompactTabBar ? copy.lessons.chapters : copy.lessons.header,
      Settings: copy.home.settingsTitle,
    }),
    [copy.home.grammarTitle, copy.home.vocabularyTitle, copy.home.settingsTitle, copy.lessons.chapters, copy.lessons.header, isCompactTabBar]
  );
  const borrowedGrammarVocabularyActive = React.useMemo(() => {
    const activeTabRoute = tabState?.routes?.[tabState.index ?? 0];
    if (activeTabRoute?.name !== 'Vocabulary') return false;

    const vocabularyState = activeTabRoute.state;
    const activeVocabularyRoute = vocabularyState?.routes?.[vocabularyState.index ?? 0];

    return activeVocabularyRoute?.name === 'VocabularyLesson'
      && activeVocabularyRoute?.params?.backTarget === 'Grammar';
  }, [tabState]);
  const getVisualTabFocus = React.useCallback(
    (routeName: string, focused: boolean) => {
      if (borrowedGrammarVocabularyActive) {
        return routeName === 'Grammar';
      }

      return focused;
    },
    [borrowedGrammarVocabularyActive]
  );
  const getTabIdentityColor = React.useCallback(
    (routeName: string) =>
      tabRouteColors[routeName] ?? colors.primary,
    [colors.primary, tabRouteColors]
  );
  
  return (
    <Tab.Navigator
      backBehavior="none" // Let hardware back press bubble up to RootStack (we handle it globally)
      screenListeners={{
        state: (event) => setTabState(event.data.state),
      }}
      screenOptions={({ route }) => ({
        headerShown: false,
        safeAreaInsets: { bottom: 0 },
        tabBarShowLabel: true,
        tabBarLabelPosition: 'below-icon',
        tabBarLabel: ({ focused }) => {
          const visuallyFocused = getVisualTabFocus(route.name, focused);
          return (
            <Text
              style={{
                color: visuallyFocused ? colors.text : colors.secondaryText,
                fontSize: tabBarLabelFontSize,
                lineHeight: tabBarLabelLineHeight,
                marginTop: 0,
                marginBottom: 0,
                textAlign: 'center',
              }}
            >
              {tabLabels[route.name as keyof typeof tabLabels] ?? route.name}
            </Text>
          );
        },
        tabBarIcon: ({ focused }) => {
          const iconName = tabIcons[route.name] ?? 'help-outline';
          const visuallyFocused = getVisualTabFocus(route.name, focused);
          const identityColor = getTabIdentityColor(route.name);
          const iconColor = visuallyFocused ? identityColor : colors.secondaryText;
          return (
            <View
              style={[
                styles.tabIconPill,
                visuallyFocused
                  ? {
                      backgroundColor: tabSoftColors[route.name] ?? colors.primarySoft,
                      borderColor: tabBorderColors[route.name] ?? colors.primary,
                    }
                  : styles.tabIconPillInactive,
              ]}
            >
              <MaterialIcons name={iconName} size={tabBarIconSize} color={iconColor} />
            </View>
          );
        },        
        tabBarActiveTintColor: getTabIdentityColor(route.name),
        tabBarInactiveTintColor: colors.secondaryText,
        tabBarLabelStyle: {
          fontSize: tabBarLabelFontSize,
          lineHeight: tabBarLabelLineHeight,
          marginTop: 0,
          marginBottom: 0,
          includeFontPadding: false,
          textAlignVertical: 'center',
        },
        tabBarItemStyle: {
          justifyContent: 'center',
          alignItems: 'center',
          paddingTop: 0,
          transform: [{ translateY: isWebTabBar ? 0 : -2 }],
        },
        tabBarIconStyle: {
          marginTop: 0,
          marginBottom: 0,
        },
        tabBarStyle: {
          height: tabBarHeight,
          paddingTop: 3,
          paddingBottom: tabBarStylePaddingBottom,
          backgroundColor: tabBarBackgroundColor,
          borderTopColor: isAndroidTabBarLayout ? 'transparent' : isDarkMode ? colors.border : 'rgba(0,0,0,0.08)',
          borderTopWidth: tabBarTopBorderWidth,
        },
      })}
    >
      <Tab.Screen
        name="Grammar"
        component={GrammarScreen}
      />
      <Tab.Screen
        name="Vocabulary"
        component={VocabularyStack}
      />

      <Tab.Screen
        name="Lessons"
        component={LessonsScreen}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
      />
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
        name="Account"
        component={AccountScreen}
        options={{ headerShown: false }}
      />
      {/* Root-level full image modal so it overlays headers */}
      <Stack.Screen
        name="FullImageModal"
        component={FullImageScreen}
        options={{ presentation: 'transparentModal', headerShown: false }}
      />
      <Stack.Screen 
        name="MainTabs" 
        component={MainTabNavigator}
        options={{
          gestureEnabled: true
        }}
      />
      {Platform.OS === 'web' && (
        <Stack.Screen
          name="AdminLessonPreview"
          component={AdminLessonPreviewScreen}
          options={{ headerShown: false }}
        />
      )}
    </Stack.Navigator>
  );
}

function AppInner() {
  const navigationRef = React.useRef<any>(null);
  const { isDarkMode, colors, isAndroidStatusBarEnabled, isShinyEllieMode } = useTheme();
  const { width: windowWidth } = useWindowDimensions();
  const [currentRoute, setCurrentRoute] = React.useState<string>('Splash');
  const splashBG = isShinyEllieMode ? SHINY_SPLASH_BACKGROUND : DEFAULT_SPLASH_BACKGROUND;
  const isSplashRoute = currentRoute === 'Splash';
  const sideBackground =
    isSplashRoute
      ? splashBG
      : colors.background;
  const contentBackground = isSplashRoute ? splashBG : colors.background;
  const apkPreviewContentMaxWidth = getApkPreviewContentMaxWidth(windowWidth);
  const contentMaxWidth = apkPreviewContentMaxWidth ?? getWebAppContentMaxWidth(windowWidth);
  const isImmersiveRoute = currentRoute === 'Splash' || currentRoute === 'FullImageModal';
  const showAppStatusBar = Platform.OS !== 'android' || isAndroidStatusBarEnabled;
  const shouldHideStatusBar = isImmersiveRoute || !showAppStatusBar;
  const statusBarStyle = shouldHideStatusBar || isDarkMode ? 'light' : 'dark';
  const statusBarBackground = shouldHideStatusBar ? 'transparent' : colors.background;
  const appChromeNavColor = getAndroidBottomBarColor(isDarkMode, colors);
  const appChromeButtonStyle = getAndroidBottomBarButtonStyle(isDarkMode);
  const navigationTheme = React.useMemo(() => ({
    ...(isDarkMode ? NavDarkTheme : NavDefaultTheme),
    colors: {
      ...(isDarkMode ? NavDarkTheme.colors : NavDefaultTheme.colors),
      primary: colors.primary,
      background: colors.background,
      card: colors.card,
      text: colors.text,
      border: colors.border,
      notification: colors.warning,
    },
  }), [
    colors.background,
    colors.border,
    colors.card,
    colors.primary,
    colors.text,
    colors.warning,
    isDarkMode,
  ]);

  const applyRouteChrome = React.useCallback((name?: string) => {
    if (!name) return;

    if (name === 'Splash') {
      applyImmersiveMode(splashBG, 'light');
      return;
    }

    if (name === 'FullImageModal') {
      applyImmersiveMode();
      return;
    }

    applyAppChrome(appChromeNavColor, appChromeButtonStyle, showAppStatusBar);
  }, [appChromeButtonStyle, appChromeNavColor, showAppStatusBar, splashBG]);

  // Preload lesson thumbnails (handles both bundled require() assets and http URIs)
  React.useEffect(() => {
    const preloadThumbnails = async () => {
      try {
        const Assets = require('./assets/index') as typeof import('./assets/index');
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
      } catch (err) {
        console.warn('Error preloading lesson thumbnails', err);
      }
    };

    preloadThumbnails();
  }, []);

  // Ensure immersive mode is applied on mount and whenever app returns to foreground
  React.useEffect(() => {
    // Do not force immersive on mount; route-specific screens (like Splash) manage their own immersive state.
    const unbind = bindImmersiveOnForeground(appChromeNavColor, appChromeButtonStyle);
    return () => {
      unbind();
    };
  }, [appChromeButtonStyle, appChromeNavColor]);

  React.useEffect(() => {
    applyRouteChrome(currentRoute);
  }, [applyRouteChrome, currentRoute]);

  // Central back navigation logic for native hardware back.
  const onBackRequested = React.useCallback(() => {
    const nav = navigationRef.current;
    const route = nav?.getCurrentRoute()?.name;

    if (route && ['MainTabs', 'Grammar', 'Vocabulary', 'VocabularyList', 'Lessons', 'Settings'].includes(route)) {
      // From any tab, go back to Home
      nav.navigate('Home');
      return true;
    }
    if (nav?.canGoBack()) {
      nav.goBack();
      return true;
    }
    return false; // allow default behavior (exit app on native / leave page on web)
  }, []);

  // Global hardware back press handler (native)
  React.useEffect(() => {
    if (Platform.OS === 'web') return;

    const sub = BackHandler.addEventListener('hardwareBackPress', onBackRequested);
    return () => sub.remove();
  }, [onBackRequested]);

  // Web mobile: Android's system back button triggers browser history, not React Native BackHandler.
  React.useEffect(() => {
    if (Platform.OS !== 'web') return;
    if (typeof window === 'undefined') return;

    window.history.pushState({ ...(window.history.state ?? {}), ellieBackGuard: true }, '', window.location.href);

    const onPopState = () => {
      const handled = onBackRequested();
      if (handled) {
        window.history.pushState({ ...(window.history.state ?? {}), ellieBackGuard: true }, '', window.location.href);
      }
    };

    window.addEventListener('popstate', onPopState);
    return () => {
      window.removeEventListener('popstate', onPopState);
    };
  }, [onBackRequested]);

  // Web-only: block right-click/long-press save menus on images (local and remote).
  React.useEffect(() => {
    if (Platform.OS !== 'web') return;
    if (typeof document === 'undefined') return;

    const isImageTarget = (el: any): boolean => {
      let node: any = el;
      while (node && node !== document) {
        if (node.tagName === 'IMG') return true;
        if (node.getAttribute?.('role') === 'img') return true;

        const inlineBackgroundImage = node?.style?.backgroundImage;
        const computedBackgroundImage =
          typeof window !== 'undefined' && node instanceof HTMLElement
            ? window.getComputedStyle(node).backgroundImage
            : '';
        const backgroundImage = inlineBackgroundImage || computedBackgroundImage;

        if (typeof backgroundImage === 'string' && backgroundImage.includes('url(')) {
          return true;
        }

        node = node.parentElement;
      }
      return false;
    };

    const preventImageSaveMenu = (e: Event) => {
      const target = e.target as HTMLElement | null;
      if (target && isImageTarget(target)) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    const onDragStart = (e: Event) => {
      const target = e.target as HTMLElement | null;
      if (target && isImageTarget(target)) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    const markImagesUndraggable = () => {
      document.querySelectorAll('img, [role="img"]').forEach((element) => {
        element.setAttribute('draggable', 'false');
      });
    };

    markImagesUndraggable();

    const observer = typeof MutationObserver !== 'undefined'
      ? new MutationObserver(markImagesUndraggable)
      : null;
    observer?.observe(document.body, { childList: true, subtree: true });

    // Add listeners in capture phase so browser save affordances do not win first.
    document.addEventListener('contextmenu', preventImageSaveMenu, true);
    document.addEventListener('dragstart', onDragStart, true);
    document.addEventListener('selectstart', preventImageSaveMenu, true);
    document.addEventListener('copy', preventImageSaveMenu, true);

    // Inject CSS to further suppress iOS/Android callouts and dragging on web-rendered images.
    const style = document.createElement('style');
    style.id = 'a0-image-protect';
    style.textContent = `
      img,
      [role="img"],
      [style*="background-image"] {
        -webkit-touch-callout: none !important;
        -webkit-user-select: none !important;
        user-select: none !important;
        -webkit-user-drag: none !important;
        user-drag: none !important;
      }
    `;
    document.head.appendChild(style);

    return () => {
      observer?.disconnect();
      document.removeEventListener('contextmenu', preventImageSaveMenu, true);
      document.removeEventListener('dragstart', onDragStart, true);
      document.removeEventListener('selectstart', preventImageSaveMenu, true);
      document.removeEventListener('copy', preventImageSaveMenu, true);
      try {
        const existing = document.getElementById('a0-image-protect');
        if (existing && existing.parentNode) existing.parentNode.removeChild(existing);
      } catch {}
    };
  }, []);

  React.useEffect(() => {
    if (Platform.OS !== 'web') return;
    if (typeof document === 'undefined') return;

    document.documentElement.style.backgroundColor = sideBackground;
    document.body.style.backgroundColor = sideBackground;
  }, [sideBackground]);

  // Web-only (desktop): hide the scrollbar while keeping scrolling functional
  React.useEffect(() => {
    if (Platform.OS !== 'web') return;
    if (typeof document === 'undefined') return;

    const style = document.createElement('style');
    style.id = 'a0-hide-scrollbars-desktop';
    style.textContent = `
      @media (hover: hover) and (pointer: fine) {
        /* Hide scrollbars globally but preserve scrolling */
        * {
          -ms-overflow-style: none !important; /* IE 10+ */
          scrollbar-width: none !important;     /* Firefox */
        }
        *::-webkit-scrollbar {
          width: 0 !important;
          height: 0 !important;
        }
        *::-webkit-scrollbar-thumb {
          background-color: transparent !important;
        }
        html, body {
          -ms-overflow-style: none !important;
          scrollbar-width: none !important;
        }
        html::-webkit-scrollbar, body::-webkit-scrollbar {
          width: 0 !important;
          height: 0 !important;
        }
      }
    `;
    document.head.appendChild(style);

    return () => {
      try {
        const existing = document.getElementById('a0-hide-scrollbars-desktop');
        if (existing && existing.parentNode) existing.parentNode.removeChild(existing);
      } catch {}
    };
  }, []);

  return (
    <>
      {/* Full-width to capture scroll even when cursor is in the margins */}
      <SafeAreaProvider style={{ flex: 1, backgroundColor: sideBackground }}>
        <Toaster />
        <StatusBar
          hidden={shouldHideStatusBar}
          translucent={shouldHideStatusBar}
          backgroundColor={statusBarBackground}
          style={statusBarStyle}
          animated
        />
        <View style={[styles.appShell, { backgroundColor: sideBackground }]}>
          {/* Width-constrained content wrapper */}
          <View style={[styles.contentWrapper, { backgroundColor: contentBackground, maxWidth: contentMaxWidth }]}>
            <NavigationContainer
              ref={navigationRef}
              theme={navigationTheme}
              onReady={() => {
                const name = navigationRef.current?.getCurrentRoute()?.name;
                if (name) setCurrentRoute(name);
                applyRouteChrome(name);
              }}
              onStateChange={() => {
                const name = navigationRef.current?.getCurrentRoute()?.name;
                if (name) {
                  setCurrentRoute(name);
                }

                applyRouteChrome(name);

              }}
            >
              <RootStack />
            </NavigationContainer>
          </View>
        </View>
      </SafeAreaProvider>
    </>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <AccountProvider>
          <AppInner />
        </AccountProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  appShell: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
  },
  contentWrapper: {
    flex: 1,
    userSelect: 'none',
    maxWidth: 800,
    width: '100%',
    alignSelf: 'center',
  },
  tabIconPill: {
    width: 44,
    height: 28,
    borderRadius: 999,
    borderWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconPillInactive: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
});
