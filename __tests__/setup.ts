jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
  multiGet: jest.fn(() => Promise.resolve([])),
  multiSet: jest.fn(() => Promise.resolve()),
  multiRemove: jest.fn(() => Promise.resolve()),
  getAllKeys: jest.fn(() => Promise.resolve([])),
  clear: jest.fn(() => Promise.resolve()),
}));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  notificationAsync: jest.fn(() => Promise.resolve()),
  selectionAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
  NotificationFeedbackType: { Success: 'success', Warning: 'warning', Error: 'error' },
}));

jest.mock('expo-audio', () => {
  const makePlayer = () => ({
    play: jest.fn(),
    pause: jest.fn(),
    isPlaying: false,
    remove: jest.fn(),
    seekTo: jest.fn(() => Promise.resolve()),
  });

  return {
    useAudioPlayer: jest.fn(makePlayer),
    createAudioPlayer: jest.fn(makePlayer),
    preload: jest.fn(() => Promise.resolve()),
    setAudioModeAsync: jest.fn(() => Promise.resolve()),
    setIsAudioActiveAsync: jest.fn(() => Promise.resolve()),
  };
});

jest.mock('expo-speech', () => ({
  speak: jest.fn(),
  stop: jest.fn(),
  isSpeakingAsync: jest.fn(() => Promise.resolve(false)),
  getAvailableVoicesAsync: jest.fn(() => Promise.resolve([])),
}));

jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { View } = require('react-native');
  const MockIcon = () => React.createElement(View, null);
  return {
    MaterialIcons: MockIcon,
    Ionicons: MockIcon,
    FontAwesome: MockIcon,
    AntDesign: MockIcon,
    Feather: MockIcon,
  };
});

jest.mock('react-native-svg', () => {
  const React = require('react');
  const { View } = require('react-native');
  const Mock = ({ children }: any) => React.createElement(View, null, children);
  return { Svg: Mock, Circle: Mock, Path: Mock, G: Mock, Rect: Mock, default: Mock };
});

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  SafeAreaProvider: ({ children }: any) => children,
  SafeAreaView: ({ children }: any) => children,
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    dispatch: jest.fn(),
    setOptions: jest.fn(),
    addListener: jest.fn(() => jest.fn()),
    canGoBack: jest.fn(() => false),
  }),
  useFocusEffect: (cb: () => unknown) => {
    // Run the focus callback exactly once on mount (prevents re-render loop in tests)
    const React = require('react');
    React.useEffect(() => { cb(); }, []);
  },
  useRoute: () => ({ params: {} }),
  useIsFocused: () => true,
  NavigationContainer: ({ children }: any) => children,
}));

jest.mock('../lib/immersive', () => ({
  exitImmersiveOpaque: jest.fn(() => Promise.resolve()),
  enterImmersive: jest.fn(() => Promise.resolve()),
}));

jest.mock('react-native-gesture-handler', () => ({
  GestureHandlerRootView: ({ children }: any) => children,
  GestureDetector: ({ children }: any) => children,
  PanGestureHandler: ({ children }: any) => children,
  Gesture: {
    Pan: () => {
      const gesture = {
        enabled: () => gesture,
        minDistance: () => gesture,
        onBegin: () => gesture,
        onUpdate: () => gesture,
        onEnd: () => gesture,
        onFinalize: () => gesture,
      };
      return gesture;
    },
    Pinch: () => {
      const gesture = {
        onBegin: () => gesture,
        onUpdate: () => gesture,
        onEnd: () => gesture,
      };
      return gesture;
    },
    Tap: () => {
      const gesture = {
        numberOfTaps: () => gesture,
        maxDuration: () => gesture,
        maxDistance: () => gesture,
        onEnd: () => gesture,
      };
      return gesture;
    },
    Exclusive: (...gestures: unknown[]) => gestures[0],
    Simultaneous: (...gestures: unknown[]) => gestures[0],
  },
  State: {},
  Directions: {},
}));

jest.mock('react-native-reanimated', () => {
  const React = require('react');
  const { ScrollView, Text, View } = require('react-native');
  const enteringTransition: any = {
    delay: jest.fn(() => enteringTransition),
    duration: jest.fn(() => enteringTransition),
    springify: jest.fn(() => enteringTransition),
    damping: jest.fn(() => enteringTransition),
  };
  const AnimatedMock = {
    createAnimatedComponent: (Component: any) => Component,
    Value: jest.fn(),
    event: jest.fn(),
    add: jest.fn(),
    eq: jest.fn(),
    set: jest.fn(),
    cond: jest.fn(),
    interpolate: jest.fn(),
    View: ({ children, ...props }: any) => React.createElement(View, props, children),
    Text: ({ children, ...props }: any) => React.createElement(Text, props, children),
    ScrollView: ({ children, ...props }: any) => React.createElement(ScrollView, props, children),
    Extrapolate: { CLAMP: 'clamp' },
  };

  return {
    __esModule: true,
    default: AnimatedMock,
    ...AnimatedMock,
    useSharedValue: jest.fn(() => ({ value: 0 })),
    useAnimatedStyle: jest.fn(() => ({})),
    withSpring: jest.fn((value: number) => value),
    withTiming: jest.fn((value: number) => value),
    runOnJS: jest.fn((fn: Function) => fn),
    // Reanimated's babel plugin injects a call to this next to inline style
    // arrays, so the mock has to answer it or those components fail to render.
    getUseOfValueInStyleWarning: () => '',
    FadeIn: enteringTransition,
    FadeInDown: enteringTransition,
    FadeOut: enteringTransition,
    ZoomIn: enteringTransition,
    Easing: {
      out: jest.fn(),
      in: jest.fn(),
      inOut: jest.fn(),
      linear: jest.fn((t: number) => t),
      bezier: jest.fn(() => jest.fn((t: number) => t)),
      ease: jest.fn((t: number) => t),
    },
    Extrapolation: { CLAMP: 'clamp' },
  };
});

const mockNativeModules = require('react-native/Libraries/BatchedBridge/NativeModules').default;
const imageLoaderMock = {
  configurable: true,
  enumerable: true,
  get: () => ({
    prefetchImage: jest.fn(() => Promise.resolve(true)),
    getSize: jest.fn((_uri: string, success?: unknown) => {
      if (typeof success === 'function') {
        process.nextTick(() => (success as (width: number, height: number) => void)(320, 240));
      }
      return Promise.resolve({ width: 320, height: 240 });
    }),
  }),
};

Object.defineProperty(mockNativeModules, 'ImageLoader', imageLoaderMock);
Object.defineProperty(mockNativeModules, 'ImageViewManager', imageLoaderMock);

jest.mock('expo-updates', () => ({
  isEnabled: false,
  useUpdates: () => ({
    isUpdatePending: false,
    isUpdateAvailable: false,
    currentlyRunning: {
      isEmbeddedLaunch: true,
      createdAt: null,
      channel: 'test',
      runtimeVersion: '1',
    },
  }),
  checkForUpdateAsync: jest.fn(async () => ({ isAvailable: false })),
  fetchUpdateAsync: jest.fn(),
  reloadAsync: jest.fn(),
}));
