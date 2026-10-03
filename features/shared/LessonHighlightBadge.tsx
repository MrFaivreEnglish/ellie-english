import { StyleSheet, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import Text from './ThemedText';
import { getMenuCopy } from './menuCopy';
import { DESIGN_ACCENTS } from './uiPrimitives';
import type { LessonHighlightKind } from './lessonHighlights';

// Fixed colours rather than theme ones: the badge has to stand out against the
// blue, teal and mauve surfaces it sits on, in both light and dark mode.
const BADGE_FILL = {
  new: DESIGN_ACCENTS.coral.shadow,
  updated: '#A86F1F',
} as const;

type Props = {
  kind: LessonHighlightKind;
  // 'sticker' straddles the top edge of whatever it's placed in (parent must not clip);
  // 'inline' sits in a row; 'dot' is a bare marker for tight spots like tab icons.
  variant?: 'sticker' | 'inline' | 'dot';
  // Which top corner a sticker sits in.
  side?: 'left' | 'right';
  style?: StyleProp<ViewStyle>;
};

const LessonHighlightBadge = ({ kind, variant = 'sticker', side = 'right', style }: Props) => {
  const copy = getMenuCopy().common;
  const fill = BADGE_FILL[kind];
  const label = kind === 'new' ? copy.newBadge : copy.updatedBadge;

  if (variant === 'dot') {
    return (
      <View
        style={[styles.dot, { backgroundColor: fill }, style]}
        accessibilityLabel={label}
      />
    );
  }

  return (
    <View
      style={[
        styles.pill,
        variant === 'sticker' && [styles.sticker, side === 'left' ? styles.stickerLeft : styles.stickerRight],
        { backgroundColor: fill },
        style,
      ]}
    >
      <Text style={styles.text} numberOfLines={1}>{label}</Text>
    </View>
  );
};

export default LessonHighlightBadge;

const styles = StyleSheet.create({
  pill: {
    alignSelf: 'center',
    pointerEvents: 'none',
    borderRadius: 999,
    borderWidth: 2,
    borderColor: '#ffffff',
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  sticker: {
    position: 'absolute',
    top: -9,
    zIndex: 5,
    elevation: 2,
  },
  stickerLeft: { left: 10 },
  stickerRight: { right: 12 },
  text: { color: '#ffffff', fontSize: 11, fontWeight: '800', letterSpacing: 0.4, textTransform: 'uppercase' },
  dot: {
    position: 'absolute',
    top: -2,
    right: 4,
    width: 11,
    height: 11,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#ffffff',
    zIndex: 5,
  },
});
