import React from 'react';
import { StyleSheet, TouchableOpacity, Platform, View, LayoutChangeEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { MaterialIcons } from '@expo/vector-icons';

interface Props {
  /** Remote uri string (fallback if `source` not provided) */
  uri?: string;
  /** Local or remote image source (preferred) */
  source?: any;
  onClose: () => void;
  // Optional props kept for compatibility
  panSensitivity?: number;
  maxScale?: number;
  doubleTapZoom?: number;
  wheelZoomSpeed?: number;
  speedPreset?: 'slow' | 'balanced' | 'fast';
}

const PinchZoomImage: React.FC<Props> = ({
  uri,
  source,
  onClose,
  maxScale = 5,
  doubleTapZoom = 2.5,
  wheelZoomSpeed = 0.006,
}) => {
  // Shared values for transform and layout
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const containerW = useSharedValue(0);
  const containerH = useSharedValue(0);
  const pinchStartScale = useSharedValue(1);

  const imgSource = source ? source : uri ? { uri } : undefined;

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    containerW.value = width;
    containerH.value = height;
  };

  const clampTranslations = () => {
    'worklet';
    const w = containerW.value;
    const h = containerH.value;
    if (w <= 0 || h <= 0) return;
    const maxX = (w * (scale.value - 1)) / 2;
    const maxY = (h * (scale.value - 1)) / 2;
    // inline clamp to keep this worklet pure
    translateX.value = Math.min(Math.max(translateX.value, -maxX), maxX);
    translateY.value = Math.min(Math.max(translateY.value, -maxY), maxY);
  };

  // PINCH gesture
  const pinch = Gesture.Pinch()
    .onStart(() => {
      pinchStartScale.value = scale.value;
    })
    .onChange((e) => {
      // inline clamp to avoid capturing non-worklet helpers
      const unclamped = pinchStartScale.value * e.scale;
      const next = Math.min(Math.max(unclamped, 1), maxScale);
      scale.value = next;
      clampTranslations();
    })
    .onEnd(() => {
      if (scale.value < 1) {
        scale.value = withTiming(1);
      }
      // When returning to 1x, also reset translations
      if (scale.value === 1) {
        translateX.value = withTiming(0);
        translateY.value = withTiming(0);
      } else {
        clampTranslations();
      }
    })
    .enabled(true)
    .runOnJS(false);

  // PAN gesture (only meaningful when zoomed in)
  const pan = Gesture.Pan()
    .minDistance(0)
    .onChange((e) => {
      if (scale.value <= 1) return;
      translateX.value += e.changeX;
      translateY.value += e.changeY;
      clampTranslations();
    })
    .onEnd(() => {
      clampTranslations();
    })
    .runOnJS(false);

  // DOUBLE TAP to toggle zoom 1x <-> doubleTapZoom
  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .maxDelay(180)
    .maxDeltaX(10)
    .maxDeltaY(10)
    .onEnd(() => {
      const target = scale.value > 1 ? 1 : Math.min(doubleTapZoom, maxScale);
      scale.value = withTiming(target, { duration: 140 });
      if (target === 1) {
        translateX.value = withTiming(0);
        translateY.value = withTiming(0);
      } else {
        clampTranslations();
      }
    })
    .runOnJS(false);

  const composed = Gesture.Simultaneous(pinch, pan, doubleTap);

  // Animated style applies translate first, then scale (scale about center)
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
      ],
    };
  });

  // Web-only: wheel zoom + double click
  const handleWheel = (e: any) => {
    if (Platform.OS !== 'web') return;
    try { if (e?.preventDefault) e.preventDefault(); } catch {}
    const dy = e?.nativeEvent?.deltaY ?? e?.deltaY ?? 0;
    const factor = 1 - dy * wheelZoomSpeed;
    const raw = scale.value * (isFinite(factor) ? factor : 1);
    const next = Math.min(Math.max(raw, 1), maxScale);
    scale.value = next;
    // Clamp pan for new scale
    clampTranslations();
  };

  const handleDoubleClick = () => {
    if (Platform.OS !== 'web') return;
    const target = scale.value > 1 ? 1 : Math.min(doubleTapZoom, maxScale);
    scale.value = withTiming(target, { duration: 140 });
    if (target === 1) {
      translateX.value = withTiming(0);
      translateY.value = withTiming(0);
    } else {
      clampTranslations();
    }
  };

  return (
    <View
      onLayout={onLayout}
      style={[
        styles.container,
        Platform.OS === 'web'
          ? ({ touchAction: 'none', userSelect: 'none', overscrollBehavior: 'contain' } as any)
          : null,
      ]}
    >
      <GestureDetector gesture={composed}>
        {/* Ensure this node exists on web to receive wheel/double-click events */}
        <Animated.View
          collapsable={false as any}
          style={styles.imageWrapper}
          {...(Platform.OS === 'web'
            ? ({ onWheel: handleWheel, onDoubleClick: handleDoubleClick } as any)
            : {})}
        >
          <Animated.Image
            source={imgSource}
            style={[styles.image, animatedStyle]}
            resizeMode="contain"
          />
        </Animated.View>
      </GestureDetector>
      <TouchableOpacity style={styles.closeButton} onPress={onClose}>
        <MaterialIcons name="close" size={32} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

export default PinchZoomImage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageWrapper: {
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  },
  image: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    padding: 10,
    zIndex: 2,
  },
});