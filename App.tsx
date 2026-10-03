import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { ReducedMotionConfig, ReduceMotion, useAnimatedStyle, useSharedValue, withSequence, withSpring } from 'react-native-reanimated';
import { NavigationContainer, DefaultTheme as NavDefaultTheme, DarkTheme as NavDarkTheme } from '@react-navigation/native';
import { BackHandler, InteractionManager, View, Image, Platform, useWindowDimensions, type ImageSourcePropType } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import 'react-native-gesture-handler';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SplashScreen from './features/system/SplashScreen';
import UpdateBanner from './features/system/UpdateBanner';
import { StyleSheet } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import { Toaster } from 'sonner-native';
import { useFonts } from 'expo-font';
import { PressStart2P_400Regular } from '@expo-google-fonts/press-start-2p';
import { ThemeProvider, useTheme } from './features/settings/ThemeContext';
import Text from './features/shared/ThemedText';
import MaterialIcons from './features/shared/ThemedMaterialIcon';
import { AccountProvider } from './features/account/AccountContext';
import HomeScreen from "./features/home/HomeScreen";
import GrammarScreen from "./features/grammar/GrammarScreen";
import VocabularyScreen from "./features/vocabulary/VocabularyScreen";
import LessonsScreen from "./features/lessons/LessonsScreen";
import VocabularyLessonScreen from "./features/vocabulary/VocabularyLessonScreen";
import VocabRushScreen from "./features/vocabulary/vocabRush/VocabRushScreen";
import SettingsScreen from "./features/settings/SettingsScreen";
import AccountScreen from "./features/account/AccountScreen";
import MyWordsScreen from "./features/progress/MyWordsScreen";
import AdminLessonPreviewScreen from "./features/lessons/AdminLessonPreviewScreen";
import { Asset } from 'expo-asset';
import { applyAppChrome, applyImmersiveMode, bindImmersiveOnForeground } from './lib/immersive';
import { primeSoundEffects } from './features/shared/soundEffects';
import FullImageScreen from './features/shared/FullImageScreen';
import ErrorBoundary from './features/shared/ErrorBoundary';
import { StatusBar } from 'expo-status-bar';
import { DESKTOP_WEB_MIN_WIDTH, getDesktopTypographyScale, getWebAppContentMaxWidth, LARGE_WIDTH, NARROW_TRAY_WIDTH } from './features/shared/responsiveLayout';
import { getMenuCopy } from './features/shared/menuCopy';
import LessonHighlightBadge from './features/shared/LessonHighlightBadge';
import { getSectionHighlightKind, useSeenLessonHighlights } from './features/shared/lessonHighlights';
import {
  getSplashBackground,
  HOME_MENU_ROUTE_COLORS,
  SHINY_HOME_MENU_ROUTE_COLORS,
} from './features/shared/homeMenuColors';
import { getAndroidBottomBarButtonStyle, getAndroidBottomBarColor } from './features/shared/appChromeColors';
import { getApkPreviewContentMaxWidth, isApkLayoutPreviewEnabled } from './features/shared/apkPreview';
import type { RootStackParamList, TabParamList, VocabularyStackParamList } from './types/navigationTypes';
import { pruneOldDailyProgressRecords } from './features/progress/studentProgressStorage';
import { installGlobalErrorReporter } from './features/system/errorReporting';
import { bilingual } from './features/shared/bilingual';
import * as Updates from 'expo-updates';

installGlobalErrorReporter();

// Navigation state may be what broke, so the app-wide boundary restarts instead of
// navigating. Reloading also picks up a fixed OTA update if one has downloaded.
const restartApp = () => {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') window.location.reload();
    return;
  }
  Updates.reloadAsync().catch(() => {});
};





function AndroidStatusBarBackdrop({ visible, color }: { visible: boolean; color: string }) {
  const insets = useSafeAreaInsets();

  if (!visible || insets.top <= 0) return null;

  return (
    <View
      style={[styles.statusBarBackdrop, { height: insets.top, backgroundColor: color, pointerEvents: 'none' }]}
    />
  );
}

function TabIcon({
  iconName,
  imageSource,
  tintImage = true,
  imageOpacity = 1,
  size,
  color,
  focused,
}: {
  iconName: React.ComponentProps<typeof MaterialIcons>['name'];
  imageSource?: ImageSourcePropType;
  tintImage?: boolean;
  imageOpacity?: number;
  size: number;
  color: string;
  focused: boolean;
}) {
  const scale = useSharedValue(1);
  const wasFocused = React.useRef(focused);

  React.useEffect(() => {
    if (focused && !wasFocused.current) {
      scale.value = withSequence(
        withSpring(1.28, { damping: 10, stiffness: 300 }),
        withSpring(1, { damping: 12, stiffness: 260 })
      );
    }
    wasFocused.current = focused;
  }, [focused, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      {imageSource ? (
        <Image
          source={imageSource}
          style={[
            { width: size, height: size, opacity: imageOpacity },
            tintImage && { tintColor: color },
          ]}
          resizeMode="contain"
          fadeDuration={0}
          accessibilityIgnoresInvertColors
        />
      ) : (
        <MaterialIcons name={iconName} size={size} color={color} />
      )}
    </Animated.View>
  );
}

const Tab = createBottomTabNavigator<TabParamList>();
const VocabStack = createNativeStackNavigator<VocabularyStackParamList>();
const RootStackNav = createNativeStackNavigator<RootStackParamList>();
type MaterialIconName = React.ComponentProps<typeof MaterialIcons>['name'];

const tabIcons: Record<string, MaterialIconName> = {
  Grammar: 'edit',
  Vocabulary: 'style',
  Lessons: 'menu-book',
  Settings: 'settings',
};
const grammarIconSource = require('./assets/navigation/grammar.png');
const vocabularyIconSource = require('./assets/navigation/vocabulary.png');
const chaptersIconSource = require('./assets/navigation/chapters.png');
const settingsIconSource = require('./assets/navigation/settings.png');

function VocabularyLessonBoundaryScreen(props: any) {
  const goBack = React.useCallback(() => {
    if (props.navigation?.canGoBack?.()) {
      props.navigation.goBack();
      return;
    }

    props.navigation?.navigate?.('VocabularyList');
  }, [props.navigation]);

  const goHome = React.useCallback(() => {
    const rootNavigation = props.navigation?.getParent?.()?.getParent?.();

    if (rootNavigation?.navigate) {
      rootNavigation.navigate('Home');
      return;
    }

    goBack();
  }, [goBack, props.navigation]);

  return (
    <ErrorBoundary onBack={goBack} onHome={goHome}>
      <VocabularyLessonScreen {...props} />
    </ErrorBoundary>
  );
}

function VocabularyStack(): React.JSX.Element {
  return (
    <VocabStack.Navigator>
      <VocabStack.Screen
        name="VocabularyList"
        component={VocabularyScreen}
        options={{ headerShown: false }}
      />
      <VocabStack.Screen
        name="VocabularyLesson"
        component={VocabularyLessonBoundaryScreen}
        options={{ headerShown: false }}
      />
      <VocabStack.Screen
        name="VocabRush"
        component={VocabRushScreen}
        options={{ headerShown: false }}
      />
    </VocabStack.Navigator>
  );
}

function MainTabNavigator() {
  const { isDarkMode, colors, isShinyElliePresentationMode } = useTheme();
  const copy = getMenuCopy();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const [tabState, setTabState] = React.useState<{ routes: any[]; index: number } | null>(null);
  const isCompactTabBar = width < NARROW_TRAY_WIDTH;
  const isLargeTabBar = width >= LARGE_WIDTH;
  const useApkPreviewLayout = isApkLayoutPreviewEnabled();
  const seenLessonHighlights = useSeenLessonHighlights();
  const isAndroidTabBarLayout = Platform.OS === 'android' || useApkPreviewLayout;
  const isWebTabBar = Platform.OS === 'web' && !useApkPreviewLayout;
  const isMobileWebTabBar = isWebTabBar && width < DESKTOP_WEB_MIN_WIDTH;
  const isDesktopWebTabBar = isWebTabBar && !isMobileWebTabBar;
  const desktopChromeScale = isWebTabBar ? getDesktopTypographyScale(width, height, 'fit') : 1;
  const androidSystemNavInset = isAndroidTabBarLayout ? Math.max(insets.bottom, 24) : 0;
  const tabBarBaseHeight = isWebTabBar
    ? Math.round((isCompactTabBar ? 58 : isLargeTabBar ? 60 : 58) * desktopChromeScale)
    : (isCompactTabBar ? 48 : isLargeTabBar ? 50 : 48);
  const tabBarHeight = tabBarBaseHeight + androidSystemNavInset;
  const tabBarIconSize = isMobileWebTabBar
    ? 26
    : Math.round((isCompactTabBar ? 22 : isLargeTabBar ? 23 : 22) * desktopChromeScale);
  const tabBarLabelFontSize = Math.round((isCompactTabBar ? 11 : isLargeTabBar ? 12 : 11) * desktopChromeScale);
  const tabBarLabelLineHeight = Math.round((isCompactTabBar ? 13 : isLargeTabBar ? 14 : 13) * desktopChromeScale);
  const desktopTabIconContainerHeight = Math.round(28 * desktopChromeScale);
  const desktopTabContentTopOffset = Math.max(
    0,
    Math.round((tabBarBaseHeight - desktopTabIconContainerHeight - tabBarLabelLineHeight - 10) / 2)
  );
  const tabBarStylePaddingBottom = androidSystemNavInset;
  const tabBarTopBorderWidth = isAndroidTabBarLayout
    ? 0
    : colors.visualStyle === 'pixel'
      ? 2
      : StyleSheet.hairlineWidth;
  const tabBarBackgroundColor = isDarkMode
    ? colors.card
    : isAndroidTabBarLayout
      ? getAndroidBottomBarColor(isDarkMode, colors)
      : 'rgba(255, 255, 255, 0.9)';
  const tabRouteColors: Record<string, string> = isShinyElliePresentationMode ? SHINY_HOME_MENU_ROUTE_COLORS : HOME_MENU_ROUTE_COLORS;
  const tabLabels = React.useMemo(
    () => ({
      Grammar: copy.home.grammarTitle,
      Vocabulary: isCompactTabBar ? 'Vocab' : copy.home.vocabularyTitle,
      // Full name on desktop; the short form everywhere narrower, where "Chapters & Links"
      // wraps to two lines (which is what knocked the home card's icon off-centre).
      Lessons: isDesktopWebTabBar ? copy.lessons.header : copy.lessons.chapters,
      Settings: copy.home.settingsTitle,
    }),
    [copy.home.grammarTitle, copy.home.vocabularyTitle, copy.home.settingsTitle, copy.lessons.chapters, copy.lessons.header, isCompactTabBar, isDesktopWebTabBar]
  );
  const borrowedGrammarVocabularyActive = React.useMemo(() => {
    const activeTabRoute = tabState?.routes?.[tabState.index ?? 0];
    if (activeTabRoute?.name !== 'Vocabulary') return false;

    const vocabularyState = activeTabRoute.state;
    const activeVocabularyRoute = vocabularyState?.routes?.[vocabularyState.index ?? 0];

    return activeVocabularyRoute?.name === 'VocabularyLesson'
      && activeVocabularyRoute?.params?.backTarget === 'Grammar';
  }, [tabState]);



  const isVocabRushFocused = React.useMemo(() => {
    const activeTabRoute = tabState?.routes?.[tabState.index ?? 0];
    if (activeTabRoute?.name !== 'Vocabulary') return false;

    const vocabularyState = activeTabRoute.state;
    const activeVocabularyRoute = vocabularyState?.routes?.[vocabularyState.index ?? 0];

    return activeVocabularyRoute?.name === 'VocabRush';
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
      backBehavior="none"
      screenListeners={{
        state: (event) => setTabState(event.data.state),
      }}
      screenOptions={({ route }) => ({
        headerShown: false,
        // Not 'fade': a crossfade keeps the outgoing and incoming screens composited at the
        // same time, and on Android react-native-screens could end up leaving the incoming
        // one invisible while the outgoing one stayed drawn underneath — a blank content
        // area (with the previous tab's content showing through) that only ever reproduced
        // when switching via the tab bar.
        animation: 'none',
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
          const customIconSource = route.name === 'Grammar'
            ? grammarIconSource
            : route.name === 'Vocabulary'
              ? vocabularyIconSource
              : route.name === 'Lessons'
                ? chaptersIconSource
                : route.name === 'Settings'
                  ? settingsIconSource
                  : undefined;
          const tabHighlight = route.name === 'Grammar'
            ? getSectionHighlightKind('grammar', seenLessonHighlights)
            : route.name === 'Vocabulary'
              ? getSectionHighlightKind('vocabulary', seenLessonHighlights)
              : undefined;
          const isFullColorIcon = route.name === 'Grammar'
            || route.name === 'Vocabulary'
            || route.name === 'Lessons'
            || route.name === 'Settings';
          return (
            <View
              style={[
                styles.tabIconPill,
                isMobileWebTabBar && styles.tabIconPillMobileWeb,




                isWebTabBar && !isMobileWebTabBar && {
                  width: Math.round(44 * desktopChromeScale),
                  height: Math.round(28 * desktopChromeScale),
                },
              ]}
            >
              <TabIcon
                iconName={iconName}
                imageSource={customIconSource}
                tintImage={!isFullColorIcon}
                imageOpacity={isFullColorIcon && !visuallyFocused ? 0.58 : 1}
                size={isFullColorIcon ? tabBarIconSize + 2 : tabBarIconSize}
                color={iconColor}
                focused={visuallyFocused}
              />
              {!!tabHighlight && <LessonHighlightBadge kind={tabHighlight} variant="dot" />}
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
          marginTop: isDesktopWebTabBar ? desktopTabContentTopOffset : 0,
          marginBottom: 0,
          ...(isDesktopWebTabBar
            ? {
                width: Math.round(44 * desktopChromeScale),
                height: desktopTabIconContainerHeight,
                alignItems: 'center' as const,
                justifyContent: 'center' as const,
              }
            : isMobileWebTabBar
            ? {
                flex: 1,
                alignItems: 'center' as const,
                justifyContent: 'center' as const,
              }
            : null),
        },
        tabBarStyle: {
          height: tabBarHeight,
          paddingTop: isWebTabBar ? 0 : Math.round(3 * desktopChromeScale),
          paddingBottom: tabBarStylePaddingBottom,
          backgroundColor: tabBarBackgroundColor,
          borderTopColor: isAndroidTabBarLayout ? 'transparent' : colors.border,
          borderTopWidth: tabBarTopBorderWidth,
          // On Android, elevation (not zIndex) decides native draw/touch order, and
          // in-screen overlays carry their own elevation. This has to sit above the
          // practice sheet (10) so an open sheet can't swallow tab taps, but stay below
          // the lesson lists' selection tray (20), which is meant to cover the tab bar.
          ...(Platform.OS === 'android' ? { elevation: 12, zIndex: 12 } : null),
          ...(isVocabRushFocused ? { display: 'none' as const } : null),
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
    <RootStackNav.Navigator
      initialRouteName="Splash"
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        gestureDirection: 'horizontal'
      }}
    >
      <RootStackNav.Screen
        name="Splash"
        component={SplashScreen}
        options={{ gestureEnabled: false }}
      />
      <RootStackNav.Screen
        name="Home"
        component={HomeScreen}
        options={{ gestureEnabled: false, animation: 'fade' }}
      />
      <RootStackNav.Screen
        name="Account"
        component={AccountScreen}
        options={{ headerShown: false }}
      />
      <RootStackNav.Screen
        name="MyWords"
        component={MyWordsScreen}
        options={{ headerShown: false }}
      />
      <RootStackNav.Screen
        name="FullImageModal"
        component={FullImageScreen}
        options={{ presentation: 'transparentModal', headerShown: false }}
      />
      <RootStackNav.Screen
        name="MainTabs"
        component={MainTabNavigator}
        options={{ gestureEnabled: true, animation: 'none' }}
      />
      {Platform.OS === 'web' && (
        <RootStackNav.Screen
          name="AdminLessonPreview"
          component={AdminLessonPreviewScreen}
          options={{ headerShown: false }}
        />
      )}
    </RootStackNav.Navigator>
  );
}

function AppInner() {
  const navigationRef = React.useRef<any>(null);
  const { isDarkMode, colors, isAndroidStatusBarEnabled, isShinyEllieMode, isShinyElliePresentationMode, isReduceAnimationsEnabled } = useTheme();
  const { width: windowWidth } = useWindowDimensions();
  const [currentRoute, setCurrentRoute] = React.useState<string>('Splash');
  const splashBG = getSplashBackground(isShinyElliePresentationMode);
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


  // Configures and activates the audio session at startup so the first success sound of
  // the session does not have to wait on that work before it can be heard.
  React.useEffect(() => {
    primeSoundEffects();
  }, []);

  React.useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      void pruneOldDailyProgressRecords();
    });
    return () => task.cancel();
  }, []);

  React.useEffect(() => {
    const preloadThumbnails = async () => {
      try {
        const Assets = require('./assets/index') as typeof import('./assets/index');
        const thumbs = Assets?.lessonThumbnails || {};
        const tasks: Promise<any>[] = [];

        Object.values(thumbs).forEach((entry: any) => {
          if (!entry) return;

          if (typeof entry === 'number') {
            tasks.push(Asset.loadAsync(entry));
          } else if (entry.uri && typeof entry.uri === 'string') {

            if (entry.uri.startsWith('http')) {
              tasks.push(Image.prefetch(entry.uri));
            }
          }
        });

        if (tasks.length) await Promise.all(tasks);
      } catch (err) {
      }
    };

    preloadThumbnails();
  }, []);


  React.useEffect(() => {
    // Android resets system-bar styling after resume, so reapply the configured chrome.
    const unbind = bindImmersiveOnForeground(appChromeNavColor, appChromeButtonStyle);
    return () => {
      unbind();
    };
  }, [appChromeButtonStyle, appChromeNavColor]);

  React.useEffect(() => {
    applyRouteChrome(currentRoute);
  }, [applyRouteChrome, currentRoute]);


  const onBackRequested = React.useCallback(() => {
    const nav = navigationRef.current;
    if (!nav) return false;

    const route = nav?.getCurrentRoute()?.name;

    if (Platform.OS === 'web') {

      if (route === 'Home' || route === 'Splash') return false;

      if (!route) return true;

      if (nav.canGoBack()) {
        nav.goBack();
      } else {
        nav.navigate('Home');
      }
      return true;
    }


    if (route && ['MainTabs', 'Grammar', 'Vocabulary', 'VocabularyList', 'Lessons', 'Settings'].includes(route)) {
      nav.navigate('Home');
      return true;
    }

    if (nav.canGoBack()) {
      nav.goBack();
      return true;
    }

    if (route && route !== 'Home' && route !== 'Splash') {
      nav.navigate('Home');
      return true;
    }

    return false;
  }, []);


  React.useEffect(() => {
    if (Platform.OS === 'web') return;

    const sub = BackHandler.addEventListener('hardwareBackPress', onBackRequested);
    return () => sub.remove();
  }, [onBackRequested]);


  React.useEffect(() => {
    if (Platform.OS !== 'web') return;
    if (typeof window === 'undefined') return;

    // A synthetic entry lets browser Back follow the in-app navigation stack first.
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

    // Lesson images mount asynchronously, so protect additions as well as existing nodes.
    const observer = typeof MutationObserver !== 'undefined'
      ? new MutationObserver(markImagesUndraggable)
      : null;
    observer?.observe(document.body, { childList: true, subtree: true });


    document.addEventListener('contextmenu', preventImageSaveMenu, true);
    document.addEventListener('dragstart', onDragStart, true);
    document.addEventListener('selectstart', preventImageSaveMenu, true);
    document.addEventListener('copy', preventImageSaveMenu, true);


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

  React.useEffect(() => {
    if (Platform.OS !== 'web') return;
    if (typeof document === 'undefined') return;

    document.documentElement.dataset.ellieVisualStyle = isShinyEllieMode ? 'pixel' : 'normal';

    const styleId = 'ellie-pixel-art-runtime';
    let style = document.getElementById(styleId) as HTMLStyleElement | null;
    if (!style) {
      style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        html[data-ellie-visual-style="pixel"] [role="button"],
        html[data-ellie-visual-style="pixel"] input,
        html[data-ellie-visual-style="pixel"] textarea {
          border-radius: 2px !important;
        }
        html[data-ellie-visual-style="pixel"] #root div,
        html[data-ellie-visual-style="pixel"] #root img {
          border-radius: 2px !important;
        }
        html[data-ellie-visual-style="pixel"] img,
        html[data-ellie-visual-style="pixel"] canvas {
          image-rendering: pixelated;
        }
      `;
      document.head.appendChild(style);
    }

    return () => {
      delete document.documentElement.dataset.ellieVisualStyle;
    };
  }, [isShinyEllieMode]);


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


  React.useEffect(() => {
    if (Platform.OS !== 'web') return;
    if (typeof document === 'undefined') return;

    const style = document.createElement('style');
    style.id = 'a0-no-autofill-yellow';
    style.textContent = `
      input:-webkit-autofill,
      input:-webkit-autofill:hover,
      input:-webkit-autofill:focus,
      input:-webkit-autofill:active {
        -webkit-box-shadow: 0 0 0px 1000px transparent inset !important;
        box-shadow: 0 0 0px 1000px transparent inset !important;
        -webkit-text-fill-color: inherit !important;
        caret-color: inherit !important;
        transition: background-color 9999s ease-in-out 0s;
      }
    `;
    document.head.appendChild(style);

    return () => {
      try {
        const existing = document.getElementById('a0-no-autofill-yellow');
        if (existing && existing.parentNode) existing.parentNode.removeChild(existing);
      } catch {}
    };
  }, []);

  return (
    <>
      <SafeAreaProvider style={{ flex: 1, backgroundColor: sideBackground }}>
        {/* Reanimated already follows the phone's reduce-motion setting; this adds the
            in-app Fewer Animations switch on top. Unmounting restores the phone's setting. */}
        {isReduceAnimationsEnabled && <ReducedMotionConfig mode={ReduceMotion.Always} />}
        <Toaster theme={isDarkMode ? 'dark' : 'light'} />
        <UpdateBanner />
        <StatusBar
          hidden={shouldHideStatusBar}
          style={statusBarStyle}
          animated
        />
        <View style={[styles.appShell, { backgroundColor: sideBackground }]}>
          <View style={[styles.contentWrapper, { backgroundColor: contentBackground, maxWidth: contentMaxWidth }]}>
            <ErrorBoundary
              reportSource="app"
              message={bilingual(
                'Ellie hit a problem. Your saved progress is safe.',
                'Ellie a rencontré un problème. Ta progression enregistrée est en sécurité.'
              )}
              onRestart={restartApp}
            >
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
            </ErrorBoundary>
          </View>
        </View>
        <AndroidStatusBarBackdrop
          visible={Platform.OS === 'android' && !shouldHideStatusBar}
          color={contentBackground}
        />
      </SafeAreaProvider>
    </>
  );
}

export default function App() {
  const [pixelFontLoaded] = useFonts({ PressStart2P_400Regular });

  if (!pixelFontLoaded) return null;

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
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconPillMobileWeb: {
    width: 52,
    height: 44,
  },
  statusBarBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 999,
  },
});
