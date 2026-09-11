import React from 'react';
import { Image, StyleSheet, View, type ViewStyle } from 'react-native';
import MaterialIcons from '../shared/ThemedMaterialIcon';
import { getAccountAvatarColorPreset, getAccountAvatarPreset } from './accountAvatarStorage';

type AccountAvatarProps = {
  avatarId?: string | null;
  colorId?: string | null;
  size?: number;
  style?: ViewStyle;
};

const resolveThumbnailSource = (source: any) => {
  try {
    const resolveAssetSource = (Image as any).resolveAssetSource;
    if (typeof resolveAssetSource !== 'function') return source;

    const resolved = resolveAssetSource(source);
    return resolved?.uri ? resolved : source;
  } catch {
    return source;
  }
};

export default function AccountAvatar({ avatarId, colorId, size = 48, style }: AccountAvatarProps) {
  const preset = getAccountAvatarPreset(avatarId);
  const colorPreset = getAccountAvatarColorPreset(colorId);
  const iconSize = Math.max(18, Math.round(size * 0.48));
  const avatarRadius = Math.round(size * 0.36);
  const thumbnailInset = Math.round(size * (preset.imageInsetRatio ?? 0));
  const thumbnailSize = Math.max(1, size - thumbnailInset * 2);
  const [thumbnailFailed, setThumbnailFailed] = React.useState(false);
  const thumbnailSource = React.useMemo(() => resolveThumbnailSource(preset.image), [preset]);

  React.useEffect(() => {
    setThumbnailFailed(false);
  }, [avatarId]);

  return (
    <View
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          borderRadius: avatarRadius,
          backgroundColor: colorPreset.backgroundColor,
          borderColor: colorPreset.accentColor,
          borderWidth: colorPreset.borderWidth ?? preset.borderWidth ?? 2,
        },
        colorPreset.borderWidth ? styles.premiumAvatar : null,
        style,
      ]}
    >
      {thumbnailSource && !thumbnailFailed ? (
        <Image
          source={thumbnailSource as any}
          style={[
            styles.thumbnail,
            {
              width: thumbnailSize,
              height: thumbnailSize,
            },
          ]}
          resizeMode={preset.imageFit ?? 'cover'}
          onError={() => setThumbnailFailed(true)}
        />
      ) : (
        <MaterialIcons
          name="image"
          size={iconSize}
          color={colorPreset.accentColor}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  premiumAvatar: {
    boxShadow: '0px 2px 5px rgba(196,139,0,0.22)',
  },
  thumbnail: {
    flexShrink: 0,
  },
});
