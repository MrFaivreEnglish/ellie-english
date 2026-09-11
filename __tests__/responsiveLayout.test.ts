import { Platform } from 'react-native';
import {
  BOTTOM_SAFE_AREA_FALLBACK,
  clampNumber,
  getBottomSafeAreaInset,
  getDesktopTypographyScale,
  getTopSafeAreaInset,
  getViewportScale,
  getWebLessonScale,
  isCompactViewport,
} from '../features/shared/responsiveLayout';

describe('clampNumber', () => {
  it('passes values through unchanged when already in range', () => {
    expect(clampNumber(5, 0, 10)).toBe(5);
  });

  it('floors below the minimum and caps above the maximum', () => {
    expect(clampNumber(-5, 0, 10)).toBe(0);
    expect(clampNumber(50, 0, 10)).toBe(10);
  });
});

describe('getViewportScale — desktop web branch (scales up, anchored at the user\'s own screen)', () => {
  const originalOS = Platform.OS;

  beforeEach(() => {
    (Platform as { OS: string }).OS = 'web';
  });

  afterEach(() => {
    (Platform as { OS: string }).OS = originalOS;
  });

  it('reproduces the current formula bit-for-bit at known desktop sizes', () => {
    expect(getViewportScale(900, 600, 'fit')).toBe(1); // below reference on both axes, floors at 1
    expect(getViewportScale(1440, 900, 'fit')).toBe(1.238);
    expect(getViewportScale(3000, 2000, 'fit')).toBe(1.9); // hits the 1.9 cap
  });

  it('getDesktopTypographyScale wrapper matches getViewportScale exactly', () => {
    expect(getDesktopTypographyScale(1440, 900, 'fit')).toBe(getViewportScale(1440, 900, 'fit'));
    expect(getDesktopTypographyScale(1024, 1200, 'scroll')).toBe(
      getViewportScale(1024, 1200, 'scroll')
    );
  });

  it('getWebLessonScale forwards its own 900px enable gate rather than the 768px default', () => {
    expect(getWebLessonScale(1440, 900)).toBe(getViewportScale(1440, 900, 'fit', { enableThreshold: 900 }));
  });

  it('a web window below getWebLessonScale\'s 900px gate falls through to the phone/tablet curve, not a flat 1', () => {
    // 768-900px web windows aren't "desktop" by this gate, so they're scaled like any other
    // device narrower than the desktop threshold — same curve a tablet uses, not a special case.
    expect(getWebLessonScale(800, 900)).toBe(1.35);
  });

  it('never fires for other platforms at the same size — they use the phone/tablet curve instead', () => {
    (Platform as { OS: string }).OS = 'android';
    expect(getViewportScale(1440, 900, 'fit')).toBe(1.35); // phone/tablet curve, capped
  });
});

describe('getViewportScale — phone/tablet branch (one continuous curve, boosted 8% on native)', () => {
  it('is exactly 1 at the reference phone width (Fairphone 4, ~412px) on web, and boosted on native', () => {
    (Platform as { OS: string }).OS = 'web';
    expect(getViewportScale(412, 892)).toBe(1);

    for (const os of ['ios', 'android']) {
      (Platform as { OS: string }).OS = os;
      // Native has no browser chrome to fit inside and no "phone-sized text" reader
      // expectation, so it sits 8% above the shared web/phone curve (NATIVE_SCALE_BOOST).
      expect(getViewportScale(412, 892)).toBe(1.08);
    }
  });

  it('interpolates smoothly below the reference width, boosted on native', () => {
    (Platform as { OS: string }).OS = 'android';
    expect(getViewportScale(400, 800)).toBe(1.049);
    expect(getViewportScale(395, 800)).toBe(1.035);
  });

  it('still floors the pre-boost curve at 0.94 on very small phones — boost is applied after', () => {
    (Platform as { OS: string }).OS = 'android';
    // 360px and 320px both clamp to the 0.94 floor before the boost multiplies it, so both
    // land on the same boosted value rather than continuing to shrink apart.
    expect(getViewportScale(360, 700)).toBe(1.015);
    expect(getViewportScale(320, 640)).toBe(1.015);
  });

  it('can be opted out of via allowMobileDownscale: false (bypasses the native boost too)', () => {
    (Platform as { OS: string }).OS = 'android';
    expect(getViewportScale(320, 640, 'fit', { allowMobileDownscale: false })).toBe(1);
  });

  it('keeps scaling up past the reference width — tablets are this same curve, not a separate formula', () => {
    (Platform as { OS: string }).OS = 'ios';
    expect(getViewportScale(500, 900)).toBe(1.311);
  });

  it('caps at 1.35x so large tablets do not scale without bound, even after the native boost', () => {
    (Platform as { OS: string }).OS = 'ios';
    expect(getViewportScale(1024, 768)).toBe(1.35);
  });

  it('uses the narrower dimension so a short landscape window is not over-scaled by width alone', () => {
    (Platform as { OS: string }).OS = 'android';
    // Width alone (1200/412) would hit the 1.35 cap; the actual height keeps it far lower.
    expect(getViewportScale(1200, 430)).toBe(1.127);
  });
});

describe('isCompactViewport', () => {
  it('is false when both dimensions clear the default thresholds', () => {
    expect(isCompactViewport(400, 800)).toBe(false);
  });

  it('is true when width is below the default threshold', () => {
    expect(isCompactViewport(380, 800)).toBe(true);
  });

  it('is true when height is below the default threshold', () => {
    expect(isCompactViewport(400, 700)).toBe(true);
  });

  it('honors explicit per-call-site overrides', () => {
    expect(isCompactViewport(385, 800, { widthThreshold: 380 })).toBe(false);
    expect(isCompactViewport(385, 800, { widthThreshold: 390 })).toBe(true);
  });
});

describe('getTopSafeAreaInset', () => {
  it('respects insets.top on iOS, floored at 0', () => {
    expect(getTopSafeAreaInset('ios', 47, false)).toBe(47);
    expect(getTopSafeAreaInset('ios', -5, false)).toBe(0);
  });

  it('respects insets.top on Android only when the status bar toggle is on', () => {
    expect(getTopSafeAreaInset('android', 24, true)).toBe(24);
    expect(getTopSafeAreaInset('android', 24, false)).toBe(0);
  });

  it('reserves nothing on web', () => {
    expect(getTopSafeAreaInset('web', 20, true)).toBe(0);
  });
});

describe('getBottomSafeAreaInset', () => {
  it('falls back to the shared floor when insets.bottom is 0', () => {
    expect(getBottomSafeAreaInset(0)).toBe(BOTTOM_SAFE_AREA_FALLBACK);
  });

  it('keeps the real inset when it already clears the floor', () => {
    expect(getBottomSafeAreaInset(30)).toBe(30);
  });

  it('honors a caller-supplied fallback instead of the shared default', () => {
    expect(getBottomSafeAreaInset(10, 24)).toBe(24);
  });
});
