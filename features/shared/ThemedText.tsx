import React from 'react';
import {
  StyleSheet,
  Text as NativeText,
  TextInput as NativeTextInput,
  type StyleProp,
  type TextInputProps,
  type TextProps,
  type TextStyle,
} from 'react-native';
import { useTheme } from '../settings/ThemeContext';
import { useDesktopTypographyScale } from './DesktopTypography';

export const PIXEL_FONT_FAMILY = 'PressStart2P_400Regular';
export const PIXEL_FONT_SCALE = 0.66;

const pixelTextStyle: TextStyle = {
  fontFamily: PIXEL_FONT_FAMILY,
  fontWeight: '400',
  fontStyle: 'normal',
};

const getPixelTextStyle = (style: StyleProp<TextStyle>): TextStyle => {
  const fontSize = StyleSheet.flatten(style)?.fontSize;

  return {
    ...pixelTextStyle,
    ...(typeof fontSize === 'number'
      ? { fontSize: Math.max(8, Math.round(fontSize * PIXEL_FONT_SCALE * 2) / 2) }
      : null),
  };
};

const getDesktopTextStyle = (style: StyleProp<TextStyle>, scale: number): TextStyle | null => {
  if (scale === 1) return null;
  const flattened = StyleSheet.flatten(style);
  const fontSize = flattened?.fontSize;
  const lineHeight = flattened?.lineHeight;

  if (typeof fontSize !== 'number' && typeof lineHeight !== 'number') return null;

  return {
    ...(typeof fontSize === 'number' ? { fontSize: Math.round(fontSize * scale * 2) / 2 } : null),
    ...(typeof lineHeight === 'number' ? { lineHeight: Math.round(lineHeight * scale * 2) / 2 } : null),
  };
};

const ThemedText = React.forwardRef<any, TextProps>(({ style, ...props }, ref) => {
  const { isShinyEllieMode } = useTheme();
  const desktopScale = useDesktopTypographyScale();
  const desktopStyle = getDesktopTextStyle(style, desktopScale);
  const resolvedStyle = [style, desktopStyle];

  return (
    <NativeText
      ref={ref}
      {...props}
      style={[resolvedStyle, isShinyEllieMode && getPixelTextStyle(resolvedStyle)]}
    />
  );
});

ThemedText.displayName = 'ThemedText';

export const ThemedTextInput = React.forwardRef<any, TextInputProps>(({ style, ...props }, ref) => {
  const { isShinyEllieMode } = useTheme();
  const desktopScale = useDesktopTypographyScale();
  const desktopStyle = getDesktopTextStyle(style, desktopScale);
  const resolvedStyle = [style, desktopStyle];

  return (
    <NativeTextInput
      ref={ref}
      {...props}
      style={[resolvedStyle, isShinyEllieMode && getPixelTextStyle(resolvedStyle)]}
    />
  );
});

ThemedTextInput.displayName = 'ThemedTextInput';

export default ThemedText;
