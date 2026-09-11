import { useMemo } from 'react';
import { freshSpacing, freshType } from './freshDirection';
import { scaleValue } from './responsiveLayout';
import { useDesktopTypographyScale } from './DesktopTypography';

export type ResponsiveTypeKey = keyof typeof freshType;

type ScaledTypeStyle = {
  fontWeight: (typeof freshType)[ResponsiveTypeKey]['fontWeight'];
  fontSize: number;
  letterSpacing?: number;
  textTransform?: 'uppercase';
};

const scaleTypeStyle = (key: ResponsiveTypeKey, scale: number): ScaledTypeStyle => {
  const base = freshType[key];
  return {
    ...base,
    fontSize: scaleValue(base.fontSize, scale),
  };
};

















export const useResponsiveTokens = (scale: number) => {
  const ambientScale = useDesktopTypographyScale();

  if (__DEV__ && ambientScale !== 1 && scale !== 1) {
    // eslint-disable-next-line no-console
    console.warn(
      '[useResponsiveTokens] Both an ambient DesktopTypographyProvider scale '
      + `(${ambientScale}) and this hook's manual scale (${scale}) are active `
      + 'in the same render tree. This double-applies scale to any Text that '
      + 'reads both — remove the DesktopTypographyProvider ancestor, or stop '
      + 'using useResponsiveTokens here.'
    );
  }

  return useMemo(() => ({
    type: (key: ResponsiveTypeKey): ScaledTypeStyle => scaleTypeStyle(key, scale),
    spacing: (value: number) => scaleValue(value, scale),
    rhythm: (index: number) => scaleValue(freshSpacing.rhythm[index], scale),
    gutter: scaleValue(freshSpacing.gutterPhone, scale),
    gutterDesktop: scaleValue(freshSpacing.gutterDesktop, scale),
    exerciseMaxWidth: scaleValue(freshSpacing.exerciseMaxWidth, scale),
  }), [scale]);
};
