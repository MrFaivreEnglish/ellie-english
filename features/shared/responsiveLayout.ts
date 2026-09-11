import { Platform } from 'react-native';

export const clampNumber = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));









export const NARROW_TRAY_WIDTH = 430;

export const NARROW_CARD_WIDTH = 480;

export const COMPACT_WIDTH = 390;

export const VERY_COMPACT_WIDTH = 360;

export const LARGE_WIDTH = 900;

export const LARGE_PHONE_WIDTH = 400;
export const LARGE_PHONE_HEIGHT = 900;

export const DESKTOP_WEB_MIN_WIDTH = 768;






export const TABLET_MAX_WIDTH = 1366;





const TABLET_LANDSCAPE_MAX_ASPECT_RATIO = 1.5;

// Tablet browsers retain the mobile structure; aspect ratio excludes wide desktop windows.
export const isTabletWebViewport = (width: number, height: number) => {
  if (Platform.OS !== 'web') return false;
  if (width < DESKTOP_WEB_MIN_WIDTH) return false;


  if (height > width) return true;
  if (width >= TABLET_MAX_WIDTH) return false;

  return width / height < TABLET_LANDSCAPE_MAX_ASPECT_RATIO;
};


export const COMPACT_VIEWPORT_HEIGHT = 760;



export const COMPACT_STAGE_HEIGHT = 700;












// Pass height when tablet web must remain on the mobile layout path.
export const isDesktopWebWidth = (width: number, threshold = DESKTOP_WEB_MIN_WIDTH, height?: number) =>
  Platform.OS === 'web' && width >= threshold && !(height != null && isTabletWebViewport(width, height));






export const isCompactViewport = (
  width: number,
  height: number,
  options?: { widthThreshold?: number; heightThreshold?: number }
) => {
  const widthThreshold = options?.widthThreshold ?? COMPACT_WIDTH;
  const heightThreshold = options?.heightThreshold ?? COMPACT_VIEWPORT_HEIGHT;
  return width < widthThreshold || height < heightThreshold;
};

export const getWebAppContentMaxWidth = (windowWidth: number) => {
  if (Platform.OS !== 'web') return 800;

  return windowWidth;
};

export type DesktopTypographyMode = 'fit' | 'scroll';







const SCALE_REFERENCE_WIDTH = 1280 / 1.1;
const SCALE_REFERENCE_HEIGHT = 720 / 1.1;




const DESKTOP_SCALE_MAX = 1.9;



const MOBILE_SCALE_FLOOR = 0.94;

// Fairphone 4's ~412px CSS viewport — the single reference phone/tablet scaling is anchored
// to (scale === 1 there). Tablets are not a separate design; they're this same curve
// continuing upward as the device gets bigger than the reference phone.
const PHONE_SCALE_REFERENCE_WIDTH = 412;
const MOBILE_TABLET_SCALE_MAX = 1.35;

// The APK has no browser chrome eating into the viewport and no mobile-web reader expecting
// "phone-sized" text, so it can afford to sit a bit larger than the shared phone/web curve —
// mirrors the desktop-only boost pattern below (MATCH_WRITE_DESKTOP_BOOST).
const NATIVE_SCALE_BOOST = 1.08;













export const getViewportScale = (
  windowWidth: number,
  windowHeight: number,
  mode: DesktopTypographyMode = 'fit',
  options?: { enableThreshold?: number; allowMobileDownscale?: boolean }
): number => {
  if (isDesktopWebWidth(windowWidth, options?.enableThreshold ?? DESKTOP_WEB_MIN_WIDTH, windowHeight)) {
    const widthScale = windowWidth / SCALE_REFERENCE_WIDTH;
    if (mode === 'scroll') {
      return Math.round(clampNumber(widthScale, 1, DESKTOP_SCALE_MAX) * 1000) / 1000;
    }

    const heightScale = windowHeight / SCALE_REFERENCE_HEIGHT;
    return Math.round(clampNumber(Math.min(widthScale, heightScale), 1, DESKTOP_SCALE_MAX) * 1000) / 1000;
  }







  if (options?.allowMobileDownscale === false) return 1;

  // One continuous curve for phone through tablet, anchored at the reference phone's
  // narrower dimension (min(width, height) protects portrait tablets from over-scaling).
  const mobileScale = clampNumber(
    Math.min(windowWidth, windowHeight) / PHONE_SCALE_REFERENCE_WIDTH,
    MOBILE_SCALE_FLOOR,
    MOBILE_TABLET_SCALE_MAX
  );
  const boostedScale = Platform.OS === 'web' ? mobileScale : mobileScale * NATIVE_SCALE_BOOST;
  return Math.round(clampNumber(boostedScale, MOBILE_SCALE_FLOOR, MOBILE_TABLET_SCALE_MAX) * 1000) / 1000;
};





export const getDesktopTypographyScale = (
  windowWidth: number,
  windowHeight: number,
  mode: DesktopTypographyMode = 'fit'
) => getViewportScale(windowWidth, windowHeight, mode);



export const getWebLessonScale = (windowWidth: number, windowHeight: number) =>
  getViewportScale(windowWidth, windowHeight, 'fit', { enableThreshold: LARGE_WIDTH });










const MATCH_WRITE_SCALE_REFERENCE_WIDTH = 1180 / 1.1;



const MATCH_WRITE_SCALE_MAX = 1.5;
const MATCH_WRITE_DESKTOP_BOOST = 1.06;
const MATCH_WRITE_DESKTOP_SCALE_MAX = 1.7;

// Width-only scaling stays stable when the soft keyboard changes viewport height.
export const getMatchWriteCardScale = (width: number, isDesktopWeb: boolean) => {
  const widthOnlyScale = clampNumber(width / MATCH_WRITE_SCALE_REFERENCE_WIDTH, 1, MATCH_WRITE_SCALE_MAX);
  return isDesktopWeb
    ? Math.min(widthOnlyScale * MATCH_WRITE_DESKTOP_BOOST, MATCH_WRITE_DESKTOP_SCALE_MAX)
    : widthOnlyScale;
};

export const scaleValue = (value: number, scale: number) =>
  Math.round(value * scale);








export const fitSlots = (
  availableSpace: number,
  slotCount: number,
  gap: number,
  options: { floor: number; cap: number }
) => clampNumber(
  (availableSpace - gap * (slotCount - 1)) / slotCount,
  options.floor,
  options.cap
);

export const getDesktopContentMaxWidth = (
  windowWidth: number,
  mode: DesktopTypographyMode = 'fit',
  windowHeight?: number
) => {
  if (!isDesktopWebWidth(windowWidth, undefined, windowHeight)) return windowWidth;

  const widthRatio = mode === 'scroll' ? 0.82 : 0.88;






  const cap = mode === 'scroll' ? 1700 : 1900;
  return Math.round(Math.min(cap, Math.max(720, windowWidth * widthRatio)));
};










// Rounding and tolerance prevent onLayout-to-state feedback from sub-pixel jitter.
export const commitMeasuredSize = (next: number, tolerance = 1) => (current: number) => {
  const rounded = Math.round(next);
  if (rounded <= 0) return current;
  return Math.abs(current - rounded) > tolerance ? rounded : current;
};










const SHEET_COMPACT_WIDTH = 480;
const SHEET_SHORT_HEIGHT = 800;
const SHEET_VERY_SHORT_HEIGHT = 700;

export type SheetDensity = {
  effectiveWidth: number;
  effectiveHeight: number;
  compact: boolean;
  dense: boolean;
  veryShort: boolean;
};

export const getSheetDensity = (
  width: number,
  height: number,
  desktopScale: number,
  forceDense = false
): SheetDensity => {
  const effectiveWidth = width / desktopScale;
  const effectiveHeight = height / desktopScale;
  const compact = effectiveWidth < SHEET_COMPACT_WIDTH;
  const veryShort = effectiveHeight < SHEET_VERY_SHORT_HEIGHT;
  const dense = forceDense || compact || effectiveHeight < SHEET_SHORT_HEIGHT;
  return { effectiveWidth, effectiveHeight, compact, dense, veryShort };
};







export const getTopSafeAreaInset = (
  platformOS: typeof Platform.OS,
  insetsTop: number,
  isAndroidStatusBarEnabled: boolean
) => {
  // Android reserves the status-bar inset only when that app setting is enabled.
  if (platformOS === 'ios') return Math.max(insetsTop, 0);
  if (platformOS === 'android' && isAndroidStatusBarEnabled) return insetsTop;
  return 0;
};







export const BOTTOM_SAFE_AREA_FALLBACK = 16;

// Keep controls clear of Android gesture/navigation areas when no inset is reported.
export const getBottomSafeAreaInset = (
  insetsBottom: number,
  fallback: number = BOTTOM_SAFE_AREA_FALLBACK
) => Math.max(insetsBottom, fallback);
