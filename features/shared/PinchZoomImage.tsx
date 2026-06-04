import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, TouchableOpacity, Platform, View, LayoutChangeEvent, Text, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { MaterialIcons } from '@expo/vector-icons';
import { useWindowDimensions } from 'react-native';


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
  /** Show a small credit badge over the image (bottom-right) */
  showCredit?: boolean;
  /** Custom label for the credit badge */
  creditLabel?: string;
  accessibilityLabel?: string;
}

const PinchZoomImage: React.FC<Props> = ({
  uri,
  source,
  onClose,
  maxScale = 5,
  doubleTapZoom = 2.5,
  wheelZoomSpeed = 0.006,
  showCredit = true,
  creditLabel = 'Mr. Faivre',
  accessibilityLabel = 'Full screen image',
}) => {
  const insets = useSafeAreaInsets();
  // Shared values for transform and layout
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const containerW = useSharedValue(0);
  const containerH = useSharedValue(0);
  const pinchStartScale = useSharedValue(1);
  const contentW = useSharedValue(0);
  const contentH = useSharedValue(0);

  // Local state to compute fitted image box that will be transformed alongside the image
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number } | null>(null);
  const [hasImageError, setHasImageError] = useState(false);

  const imgSource = source ? source : uri ? { uri } : undefined;

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    containerW.value = width;
    containerH.value = height;
    setContainerSize({ width, height });
  };

  const { width } = useWindowDimensions();

  const closeSize = Math.max(32, Math.min(44, width * 0.08));

  // Resolve natural image size once (handles local require and remote URIs)
  useEffect(() => {
    let cancelled = false;
    setHasImageError(!source && !uri);
    const resolve = () => {
      try {
        if (source) {
          if (typeof source === 'number') {
            const asset = Image.resolveAssetSource(source as any);
            if (!cancelled && asset?.width && asset?.height) {
              setNaturalSize({ width: asset.width, height: asset.height });
            }
            return;
          }
          if ((source as any)?.uri) {
            Image.getSize(
              (source as any).uri,
              (w, h) => {
                if (!cancelled) setNaturalSize({ width: w, height: h });
              },
              () => {
                if (!cancelled) setNaturalSize(null);
              }
            );
            return;
          }
          if ((source as any)?.width && (source as any)?.height) {
            const w = (source as any).width;
            const h = (source as any).height;
            if (!cancelled) setNaturalSize({ width: w, height: h });
            return;
          }
        }
        if (uri) {
          Image.getSize(
            uri,
            (w, h) => {
              if (!cancelled) setNaturalSize({ width: w, height: h });
            },
            () => {
              if (!cancelled) setNaturalSize(null);
            }
          );
          return;
        }
        // Fallback
        if (!cancelled) setNaturalSize(null);
      } catch (e) {
        if (!cancelled) setNaturalSize(null);
      }
    };
    resolve();
    return () => {
      cancelled = true;
    };
  }, [source, uri]);

  // Compute fitted content box size that matches how the image is displayed with `contain`
  const fittedBox = useMemo(() => {
    const cw = containerSize.width;
    const ch = containerSize.height;
    if (cw <= 0 || ch <= 0) return { width: 0, height: 0 };
    const iw = naturalSize?.width ?? cw;
    const ih = naturalSize?.height ?? ch;
    if (iw <= 0 || ih <= 0) return { width: cw, height: ch };
    const scaleFactor = Math.min(cw / iw, ch / ih);
    const width = Math.max(1, iw * scaleFactor);
    const height = Math.max(1, ih * scaleFactor);
    return { width, height };
  }, [containerSize, naturalSize]);

  // Keep shared values in sync for clamping math on the UI thread
  useEffect(() => {
    contentW.value = fittedBox.width;
    contentH.value = fittedBox.height;
  }, [fittedBox.width, fittedBox.height]);

  const clampTranslations = () => {
    'worklet';
    const cw = containerW.value;
    const ch = containerH.value;
    const w = contentW.value > 0 ? contentW.value : cw;
    const h = contentH.value > 0 ? contentH.value : ch;
    if (cw <= 0 || ch <= 0) return;
    // How far we can move from center before edges leave the viewport
    const maxX = Math.max(0, (w * scale.value - cw) / 2);
    const maxY = Math.max(0, (h * scale.value - ch) / 2);
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
  const animatedContentStyle = useAnimatedStyle(() => {
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
        {/* Wrapper that receives gestures; centers the fitted content box */}
        <Animated.View
          collapsable={false as any}
          style={styles.imageWrapper}
          {...(Platform.OS === 'web'
            ? ({ onWheel: handleWheel, onDoubleClick: handleDoubleClick } as any)
            : {})}
        >
          {/* Transformed content box sized to the contained image; badge sits inside so it follows pan/zoom */}
          <Animated.View style={[{ width: fittedBox.width, height: fittedBox.height }, animatedContentStyle]}>
            {!!imgSource && !hasImageError ? (
              <Animated.Image
                source={imgSource}
                style={styles.image}
                resizeMode="contain"
                onError={() => setHasImageError(true)}
                accessible
                accessibilityRole="image"
                accessibilityLabel={accessibilityLabel}
              />
            ) : (
              <View
                style={styles.fallback}
                accessible
                accessibilityRole="image"
                accessibilityLabel={`${accessibilityLabel} unavailable`}
              >
                <Text style={styles.fallbackTitle}>Image unavailable</Text>
                <Text style={styles.fallbackText}>Close this view and keep practising.</Text>
              </View>
            )}
            {showCredit && (
              <View pointerEvents="none" style={styles.creditBadge}>
                <Text style={styles.creditText}>{creditLabel}</Text>
              </View>
            )}
          </Animated.View>
        </Animated.View>
      </GestureDetector>

<TouchableOpacity
  style={[
    styles.closeButton,
    {
      width: closeSize,
      height: closeSize,
      borderRadius: closeSize / 2,
      top: Math.max(12, (insets?.top || 0) + 12),
    }
  ]}
  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
  onPress={onClose}
  accessibilityRole="button"
  accessibilityLabel="Close full screen image"
>
        <MaterialIcons name="close" size={closeSize * 0.6} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

export default PinchZoomImage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(8,14,24,0.78)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageWrapper: {
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  fallback: {
    flex: 1,
    minWidth: 220,
    minHeight: 160,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  fallbackTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  fallbackText: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 6,
    textAlign: 'center',
  },
closeButton: {
  position: 'absolute',
  right: 20,
  backgroundColor: 'rgba(10,18,30,0.58)',
  alignItems: 'center',
  justifyContent: 'center',

  zIndex: 2,
},
  creditBadge: {
    position: 'absolute',
    right: 12,
    top: 12,
    backgroundColor: 'rgba(10,18,30,0.34)',
    borderRadius: 8,
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.18)',
    zIndex: 1,
  },
  creditText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
