import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Image,
  ImageSourcePropType,
  LayoutChangeEvent,
  StyleSheet,
  TouchableOpacity,
  View,
  StyleProp,
  ViewStyle,
  Animated,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useTheme } from '../settings/ThemeContext';
import Text from './ThemedText';
import { getWebLessonScale, scaleValue } from './responsiveLayout';

interface ImageWithCreditProps {
  source?: ImageSourcePropType;
  uri?: string;
  style?: StyleProp<ViewStyle>;
  imageScale?: number;
  onPress?: () => void;
  showCredit?: boolean;
  creditLabel?: string;
  accessibilityLabel?: string;

  onNaturalSize?: (size: { width: number; height: number }) => void;
}

const LOADING_MESSAGES = [
  'Loading picture… 👀',
  'Teaching the pixels 🎓',
  'Organising visuals ✨',
  'Almost ready… 💪',
  'Summoning the image 🪄',
  'Preparing something beautiful 🎨',
  'Get ready to be wowed ✨',
  'How are you today?',
  'Get ready!',
];

const ImageWithCredit: React.FC<ImageWithCreditProps> = ({
  source,
  uri,
  style,
  imageScale = 1,
  onPress,
  showCredit = true,
  creditLabel = 'Mr Faivre',
  accessibilityLabel = 'Lesson image',
  onNaturalSize,
}) => {
  const { colors } = useTheme();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();



  const creditScale = getWebLessonScale(windowWidth, windowHeight);
  const isLocalBundledAsset = typeof source === 'number';
  const [loading, setLoading] = useState(!isLocalBundledAsset && (!!source || !!uri));
  const [loadingText, setLoadingText] = useState('');
  const [hasImageError, setHasImageError] = useState(false);

  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number } | null>(null);

  const fadeAnim = useRef(new Animated.Value(isLocalBundledAsset ? 1 : 0)).current;
  const safeImageScale = Number.isFinite(imageScale) ? Math.max(1, imageScale) : 1;




  const imgSource = useMemo(() => {
    if (source) return source as any;
    if (uri) return { uri } as any;
    return undefined;
  }, [source, uri]);
  // Changing this key remounts the native image so stale load callbacks cannot win.
  const imageIdentity = useMemo(() => {
    if (typeof source === 'number') return `asset:${source}`;

    const sourceUri = source && typeof source === 'object' && 'uri' in source
      ? String((source as { uri?: unknown }).uri ?? '')
      : '';

    return `uri:${sourceUri || uri || ''}`;
  }, [source, uri]);




  useEffect(() => {
    const hasImageSource = !!source || !!uri;
    const isLocal = typeof source === 'number';




    setNaturalSize(null);

    if (isLocal) {
      setLoading(false);
      setHasImageError(false);
      fadeAnim.setValue(1);
      return;
    }

    setLoading(hasImageSource);
    setHasImageError(!hasImageSource);
    setLoadingText(LOADING_MESSAGES[Math.floor(Math.random() * LOADING_MESSAGES.length)]);
    fadeAnim.setValue(0);
  }, [uri, source]); // eslint-disable-line react-hooks/exhaustive-deps




  useEffect(() => {
    // Ignore a late natural-size callback after the source changes or unmounts.
    let cancelled = false;

    const applyNaturalSize = (size: { width: number; height: number }) => {
      if (cancelled) return;
      setNaturalSize(size);
      onNaturalSize?.(size);
    };

    if (source) {
      if (typeof source === 'number') {
        const asset = Image.resolveAssetSource(source as any);
        if (asset?.width && asset?.height) {
          applyNaturalSize({ width: asset.width, height: asset.height });
        }
      } else {
        const s = source as any;
        if (s?.uri) {
          Image.getSize(
            s.uri,
            (w, h) => applyNaturalSize({ width: w, height: h }),
            () => !cancelled && setNaturalSize(null)
          );
        } else if (s?.width && s?.height) {
          applyNaturalSize({ width: s.width, height: s.height });
        }
      }
    } else if (uri) {
      Image.getSize(
        uri,
        (w, h) => applyNaturalSize({ width: w, height: h }),
        () => !cancelled && setNaturalSize(null)
      );
    }

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source, uri]);




  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setContainerSize({ width, height });
  };




  const fittedBox = useMemo(() => {
    const { width: cw, height: ch } = containerSize;
    if (cw <= 0 || ch <= 0) return { width: 0, height: 0 };

    const iw = naturalSize?.width ?? cw;
    const ih = naturalSize?.height ?? ch;

    if (iw <= 0 || ih <= 0) return { width: cw, height: ch };

    const scaleFactor = Math.min(cw / iw, ch / ih);

    return {
      width: iw * scaleFactor,
      height: ih * scaleFactor,
    };
  }, [containerSize, naturalSize]);

  const creditHorizontalInset = Math.max(
    0,
    (containerSize.width - fittedBox.width * safeImageScale) / 2
  );
  const creditVerticalInset = Math.max(
    0,
    (containerSize.height - fittedBox.height * safeImageScale) / 2
  );




  const handleLoad = () => {
    setLoading(false);
    setHasImageError(false);

    if (typeof source !== 'number') {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: Platform.OS !== 'web',
      }).start();
    }
  };

  const handleError = () => {
    setLoading(false);
    setHasImageError(true);
    fadeAnim.setValue(0);
  };




  const content = (
    <View
      onLayout={onLayout}
      style={[
        styles.container,
        safeImageScale > 1 && styles.scaledImageContainer,
        style,
      ]}
    >
      {loading && !hasImageError && (
        <View
          style={[styles.placeholder, styles.placeholderContent, { pointerEvents: 'none' }]}
        >
          {!!loadingText && (
            <View
              style={[
                styles.loadingBadge,
                {
                  borderRadius: scaleValue(12, creditScale),
                  paddingVertical: scaleValue(6, creditScale),
                  paddingHorizontal: scaleValue(14, creditScale),
                },
              ]}
            >
              <Text style={[styles.placeholderText, { fontSize: scaleValue(13, creditScale) }]}>
                {loadingText}
              </Text>
            </View>
          )}
        </View>
      )}

      {!!imgSource && !hasImageError && (
        <Animated.Image
          key={imageIdentity}
          source={imgSource}
          style={[
            styles.image,
            safeImageScale > 1 && { transform: [{ scale: safeImageScale }] },
            { opacity: fadeAnim },
          ]}
          resizeMode="contain"
          fadeDuration={0}
          onLoad={handleLoad}
          onError={handleError}
          accessible
          accessibilityRole="image"
          accessibilityLabel={accessibilityLabel}
        />
      )}

      {hasImageError && (
        <View
          style={[styles.fallback, { backgroundColor: colors.surface, borderColor: colors.border }]}
          accessible
          accessibilityRole="image"
          accessibilityLabel={`${accessibilityLabel} unavailable`}
        >
          <Text style={[styles.fallbackTitle, { color: colors.text }]}>Image unavailable</Text>
          <Text style={[styles.fallbackText, { color: colors.secondaryText }]}>This lesson can still be practised.</Text>
        </View>
      )}

      {showCredit && (
        <View
          style={[
            styles.creditBadge,
            {
              paddingVertical: scaleValue(6, creditScale),
              paddingHorizontal: scaleValue(12, creditScale),
              borderRadius: scaleValue(12, creditScale),
            },
            {
              pointerEvents: 'none',
              position: 'absolute',
              top: creditVerticalInset + 12,
              right: creditHorizontalInset + 12,
            },
          ]}
        >
          <Text style={[styles.creditText, { fontSize: scaleValue(14, creditScale) }]}>{creditLabel}</Text>
        </View>
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`Open ${accessibilityLabel}`}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

export default React.memo(ImageWithCredit);

const styles = StyleSheet.create({
  container: {
    width: '100%',
    position: 'relative',
    backgroundColor: 'transparent',
  },
  scaledImageContainer: {
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  placeholderContent: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  loadingBadge: {
    backgroundColor: 'rgba(0,0,0,0.28)',
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  placeholderText: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    color: '#fff',
  },
  fallback: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    borderWidth: StyleSheet.hairlineWidth,
  },
  fallbackTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#44505C',
    textAlign: 'center',
  },
  fallbackText: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7785',
    textAlign: 'center',
  },
  creditBadge: {
    position: 'absolute',
    backgroundColor: 'rgba(0,0,0,0.22)',
    borderRadius: 10,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.18)',
    zIndex: 2,
  },
  creditText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
