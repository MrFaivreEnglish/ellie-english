import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Image,
  ImageSourcePropType,
  LayoutChangeEvent,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
  Animated,
  ActivityIndicator,
} from 'react-native';

interface ImageWithCreditProps {
  source?: ImageSourcePropType;
  uri?: string;
  style?: ViewStyle[];
  onPress?: () => void;
  showCredit?: boolean;
  creditLabel?: string;
  accessibilityLabel?: string;
}

const ImageWithCredit: React.FC<ImageWithCreditProps> = ({
  source,
  uri,
  style,
  onPress,
  showCredit = true,
  creditLabel = 'Mr Faivre',
  accessibilityLabel = 'Lesson image',
}) => {
  const [loading, setLoading] = useState(true);
  const [loadingText, setLoadingText] = useState('');
  const [hasImageError, setHasImageError] = useState(false);

  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number } | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  // ----------------------------
  // Loading messages
  // ----------------------------
  const loadingMessages = [
    'Loading picture… 👀',
    'Teaching the pixels 🎓',
    'Organizing visuals ✨',
    'Almost ready… 💪',
    'Summoning the image 🪄',
    'Preparing something beautiful 🎨',
    'Get ready to be wowed ✨',
    'How are you today?',
    'Get ready!'
  ];

  const getRandomMessage = () =>
    loadingMessages[Math.floor(Math.random() * loadingMessages.length)];

  // ----------------------------
  // Image source
  // ----------------------------
  const imgSource = useMemo(() => {
    if (source) return source as any;
    if (uri) return { uri } as any;
    return undefined;
  }, [source, uri]);

  // ----------------------------
  // Reset on image change
  // ----------------------------
  useEffect(() => {
    const hasImageSource = !!source || !!uri;
    setLoading(hasImageSource);
    setHasImageError(!hasImageSource);
    setLoadingText(getRandomMessage());
    fadeAnim.setValue(0);
  }, [uri, source]);

  // ----------------------------
  // Resolve natural size
  // ----------------------------
  useEffect(() => {
    let cancelled = false;

    if (source) {
      if (typeof source === 'number') {
        const asset = Image.resolveAssetSource(source as any);
        if (!cancelled && asset?.width && asset?.height) {
          setNaturalSize({ width: asset.width, height: asset.height });
        }
      } else {
        const s = source as any;
        if (s?.uri) {
          Image.getSize(
            s.uri,
            (w, h) => !cancelled && setNaturalSize({ width: w, height: h }),
            () => !cancelled && setNaturalSize(null)
          );
        } else if (s?.width && s?.height) {
          setNaturalSize({ width: s.width, height: s.height });
        }
      }
    } else if (uri) {
      Image.getSize(
        uri,
        (w, h) => !cancelled && setNaturalSize({ width: w, height: h }),
        () => !cancelled && setNaturalSize(null)
      );
    }

    return () => {
      cancelled = true;
    };
  }, [source, uri]);

  // ----------------------------
  // Layout
  // ----------------------------
  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setContainerSize({ width, height });
  };

  // ----------------------------
  // Contain math (KEEP THIS)
  // ----------------------------
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

  const horizontalInset = Math.max(
    0,
    (containerSize.width - fittedBox.width) / 2
  );

  const verticalInset = Math.max(
    0,
    (containerSize.height - fittedBox.height) / 2
  );

  // ----------------------------
  // On load
  // ----------------------------
  const handleLoad = () => {
    setLoading(false);
    setHasImageError(false);

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  };

  const handleError = () => {
    setLoading(false);
    setHasImageError(true);
    fadeAnim.setValue(0);
  };

  // ----------------------------
  // Content
  // ----------------------------
  const content = (
    <View onLayout={onLayout} style={[styles.container, style as any]}>
      
      {/* IMAGE */}
      {!!imgSource && !hasImageError && (
        <Animated.Image
          source={imgSource}
          style={[styles.image, { opacity: fadeAnim }]}
          resizeMode="contain"
          onLoad={handleLoad}
          onError={handleError}
          blurRadius={loading ? 8 : 0}
          accessible
          accessibilityRole="image"
          accessibilityLabel={accessibilityLabel}
        />
      )}

      {/* LOADER */}
      {loading && !hasImageError && (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#1671B6" />
          <Text style={styles.loadingText}>{loadingText}</Text>
        </View>
      )}

      {hasImageError && (
        <View
          style={styles.fallback}
          accessible
          accessibilityRole="image"
          accessibilityLabel={`${accessibilityLabel} unavailable`}
        >
          <Text style={styles.fallbackTitle}>Image unavailable</Text>
          <Text style={styles.fallbackText}>This lesson can still be practised.</Text>
        </View>
      )}

      {/* CREDIT — DO NOT TOUCH THIS */}
      {showCredit && (
        <View
          pointerEvents="none"
          style={[
            styles.creditBadge,
            {
              position: 'absolute',
              top: verticalInset + 12,
              right: horizontalInset + 12,
            },
          ]}
        >
          <Text style={styles.creditText}>{creditLabel}</Text>
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
  image: {
    width: '100%',
    height: '100%',
  },
  loader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    textAlign: 'center',
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
