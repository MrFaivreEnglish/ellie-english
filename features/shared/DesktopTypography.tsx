import React, { createContext, useContext, useMemo } from 'react';
import { useWindowDimensions } from 'react-native';
import {
  getDesktopTypographyScale,
  type DesktopTypographyMode,
} from './responsiveLayout';

const DesktopTypographyScaleContext = createContext(1);

export function DesktopTypographyProvider({
  children,
  mode = 'fit',





  maxScale,
}: {
  children: React.ReactNode;
  mode?: DesktopTypographyMode;
  maxScale?: number;
}) {
  const { width, height } = useWindowDimensions();
  const scale = useMemo(() => {
    const computed = getDesktopTypographyScale(width, height, mode);
    return maxScale != null ? Math.min(computed, maxScale) : computed;
  }, [height, maxScale, mode, width]);

  return (
    <DesktopTypographyScaleContext.Provider value={scale}>
      {children}
    </DesktopTypographyScaleContext.Provider>
  );
}

export const useDesktopTypographyScale = () => useContext(DesktopTypographyScaleContext);
