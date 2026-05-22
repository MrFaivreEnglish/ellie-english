import React from 'react';
import { Image, StyleSheet, View, type ViewStyle } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
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
  const [thumbnailFailed, setThumbnailFailed] = React.useState(false);
  const thumbnailSource = React.useMemo(() => {
    if (preset.type !== 'thumbnail') return null;
    return resolveThumbnailSource(preset.image);
  }, [preset]);

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
          borderRadius: Math.round(size * 0.32),
          backgroundColor: colorPreset.backgroundColor,
          borderColor: colorPreset.accentColor,
          borderWidth: colorPreset.borderWidth ?? preset.borderWidth ?? 2,
        },
        colorPreset.borderWidth ? styles.premiumAvatar : null,
        style,
      ]}
    >
      {preset.type === 'thumbnail' && thumbnailSource && !thumbnailFailed ? (
        <Image
          source={thumbnailSource as any}
          style={[
            styles.thumbnail,
            {
              width: size,
              height: size,
            },
          ]}
          resizeMode="cover"
          onError={() => setThumbnailFailed(true)}
        />
      ) : (
        <MaterialIcons
          name={(preset.type === 'icon' ? preset.icon : 'image') as React.ComponentProps<typeof MaterialIcons>['name']}
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
    shadowColor: '#C48B00',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.22,
    shadowRadius: 5,
    elevation: 3,
  },
  thumbnail: {
    flexShrink: 0,
  },
});
