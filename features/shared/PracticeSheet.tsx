import React, { useEffect } from 'react';
import { Platform, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import type { ThemeColors } from '../settings/ThemeContext';
import { getWebLessonScale, scaleValue } from './responsiveLayout';
import { withColorAlpha } from './uiPrimitives';
import PracticeCollapseButton from './PracticeCollapseButton';

// Matches the reference mock's own transition: opacity fades faster than the slide settles.
// Kept short so the whole thing reads as quick — the sheet's own opacity additionally
// saturates early (see sheetAnimatedStyle), so this mostly paces the scrim and base layer.
const OPACITY_DURATION_MS = 200;
const TRANSFORM_DURATION_MS = 280;
const TRANSFORM_EASING = Easing.bezier(0.2, 0.92, 0.28, 1);

// Resting offset for ordinary tap-to-close/open transitions. Drag-dismiss uses a dynamic
// target beyond the release point and viewport so its handoff can never reverse direction.
const CLOSED_TRANSLATE_Y = 280;
const DISMISS_THRESHOLD = 90;

// How far the base layer recedes while the sheet covers it: ~4.5%. Dragging the sheet away
// eases that back toward full size rather than receding further — scaling down about the
// centre lifts everything below the midpoint, so receding read as the lesson lurching upward
// (worst on the APK, where the full-screen stage puts the image well below centre). Easing
// back lets the drag preview the state a release settles into, which is where tap-to-close
// already lands.
const BASE_LAYER_REST_SCALE = 0.955;
const BASE_LAYER_DARKEN_OPACITY = 0.06;
const SCRIM_MAX_OPACITY = 0.18;

export type PracticeSheetProps = {
  open: boolean;
  onClose: () => void;
  // Keyboard modes defer focus until the entrance animation settles.
  onEntered?: () => void;
  isDarkMode?: boolean;
  isDesktopWeb?: boolean;
  colors: ThemeColors;
  // The lesson content this sheet rises to cover — rendered as the receding base layer.
  baseLayer: React.ReactNode;
  children: React.ReactNode;
};

const PracticeSheet: React.FC<PracticeSheetProps> = ({
  open,
  onClose,
  onEntered,
  isDarkMode = false,
  isDesktopWeb = false,
  colors,
  baseLayer,
  children,
}) => {
  const palette = {
    scrim: withColorAlpha(isDarkMode ? '#000000' : '#2B2620', isDarkMode ? 0.56 : SCRIM_MAX_OPACITY),
    background: colors.background,
    edge: colors.border,
    dragHandle: colors.borderStrong,
  };

  const { width, height } = useWindowDimensions();
  const webLessonScale = getWebLessonScale(width, height);
  // Mobile web only: the browser's own chrome already eats into the viewport, so the sheet's
  // grab area is tightened to just contain the collapse button rather than the roomier
  // native spacing. Desktop web and native (APK) keep the heights they had.
  const isMobileWeb = Platform.OS === 'web' && !isDesktopWeb;
  const collapseButtonSize = scaleValue(34, webLessonScale);
  // A little breathing room above the button so it doesn't sit flush against the sheet's
  // top edge — small enough that the header stays much tighter than the native one.
  const collapseButtonTop = scaleValue(isMobileWeb ? 3 : 4, webLessonScale);

  const openProgress = useSharedValue(open ? 1 : 0);
  const translateY = useSharedValue(open ? 0 : CLOSED_TRANSLATE_Y);
  const dragY = useSharedValue(0);
  const closeTargetY = useSharedValue(CLOSED_TRANSLATE_Y);
  const handleEntered = () => { onEntered?.(); };

  useEffect(() => {
    if (open) {
      closeTargetY.value = CLOSED_TRANSLATE_Y;
      openProgress.value = withTiming(1, { duration: OPACITY_DURATION_MS, easing: Easing.ease });
      translateY.value = withTiming(0, { duration: TRANSFORM_DURATION_MS, easing: TRANSFORM_EASING }, (finished) => {
        if (finished) runOnJS(handleEntered)();
      });
      return;
    }

    openProgress.value = withTiming(0, { duration: OPACITY_DURATION_MS, easing: Easing.ease });
    translateY.value = withTiming(
      closeTargetY.value,
      { duration: TRANSFORM_DURATION_MS, easing: TRANSFORM_EASING },
      (finished) => {
        if (!finished) return;
        // The sheet is transparent now. Resetting the resting position here keeps the next
        // tap-open animation consistent even if the previous close followed a long drag.
        translateY.value = CLOSED_TRANSLATE_Y;
        closeTargetY.value = CLOSED_TRANSLATE_Y;
      }
    );
  }, [closeTargetY, open, openProgress, translateY, onEntered]);

  const dragGesture = Gesture.Pan()
    .minDistance(6)
    .onUpdate((event) => {
      dragY.value = Math.max(0, event.translationY);
    })
    .onEnd(() => {
      if (dragY.value > DISMISS_THRESHOLD) {
        // Hand off from the raw drag offset to the animated one so the close transition
        // continues downward from the release point. The target is always beyond both the
        // viewport and the current drag, so even a long pull can never reverse on release.
        const releaseY = dragY.value;
        closeTargetY.value = Math.max(height, releaseY + DISMISS_THRESHOLD, CLOSED_TRANSLATE_Y);
        translateY.value = releaseY;
        dragY.value = 0;
        translateY.value = withTiming(closeTargetY.value, {
          duration: TRANSFORM_DURATION_MS,
          easing: TRANSFORM_EASING,
        });
        runOnJS(onClose)();
        return;
      }

      dragY.value = withTiming(0, { duration: TRANSFORM_DURATION_MS, easing: TRANSFORM_EASING });
    });

  // Esc closes on web only; native has no keyboard to listen on.
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined' || !open) return undefined;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  const sheetAnimatedStyle = useAnimatedStyle(() => ({
    // Saturates at 35% of the progress rather than tracking it linearly: a half-transparent
    // full-screen sheet with the lesson showing through it is what reads as a flash, so the
    // sheet goes opaque almost immediately and the slide carries the rest of the motion.
    // Closing is the mirror — it stays solid on the way down and only fades at the very end.
    // The scrim and the receding base layer still use the full, smooth ramp below.
    opacity: interpolate(openProgress.value, [0, 0.35, 1], [0, 1, 1], Extrapolation.CLAMP),
    transform: [{ translateY: translateY.value + dragY.value }],
  }));

  const scrimAnimatedStyle = useAnimatedStyle(() => {
    const fraction = interpolate(dragY.value, [0, DISMISS_THRESHOLD * 1.4], [0, 1], Extrapolation.CLAMP);
    return { opacity: openProgress.value * (1 - fraction) };
  });

  const baseLayerAnimatedStyle = useAnimatedStyle(() => {
    const fraction = interpolate(dragY.value, [0, DISMISS_THRESHOLD * 1.4], [0, 1], Extrapolation.CLAMP);
    const restScale = interpolate(openProgress.value, [0, 1], [1, BASE_LAYER_REST_SCALE], Extrapolation.CLAMP);
    return {
      transform: [{ scale: restScale + fraction * (1 - restScale) }],
    };
  });

  const baseLayerDarkenStyle = useAnimatedStyle(() => {
    // Lifts with the layer as it eases back (alongside the scrim) so the lesson brightens
    // as it returns.
    const fraction = interpolate(dragY.value, [0, DISMISS_THRESHOLD * 1.4], [0, 1], Extrapolation.CLAMP);
    return { opacity: openProgress.value * BASE_LAYER_DARKEN_OPACITY * (1 - fraction) };
  });

  return (
    <View style={styles.stage}>
      <Animated.View style={[styles.baseLayer, baseLayerAnimatedStyle]}>
        {baseLayer}
        <Animated.View
          pointerEvents="none"
          style={[styles.baseLayerDarken, baseLayerDarkenStyle, { backgroundColor: '#000000' }]}
        />
      </Animated.View>

      <Animated.View
        style={[styles.scrim, scrimAnimatedStyle, { backgroundColor: palette.scrim }]}
        pointerEvents={open ? 'auto' : 'none'}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close practice" />
      </Animated.View>

      <Animated.View
        style={[
          styles.sheetShadowWrap,
          sheetAnimatedStyle,
          getSheetShadow(isDarkMode),
        ]}
        pointerEvents={open ? 'auto' : 'none'}
      >
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: palette.background,
              // The boxShadow/border edge effect below renders as an odd transparent-grey
              // halo on native — keep it web-only and let the sheet's own background carry
              // the separation on native instead.
              borderTopWidth: Platform.OS === 'web' ? 1.5 : 0,
              borderTopColor: palette.edge,
              borderTopLeftRadius: Platform.OS === 'web' ? scaleValue(24, webLessonScale) : 0,
              borderTopRightRadius: Platform.OS === 'web' ? scaleValue(24, webLessonScale) : 0,
            },
          ]}
        >
          <View
            style={[
              styles.sheetHeader,
              {
                // Both mobile branches stay tall enough to fully contain the collapse button,
                // so it never overflows into the content below — that's what lets the screens
                // underneath drop the minHeight/paddingLeft they reserved to dodge it.
                height: isDesktopWeb
                  ? Math.min(scaleValue(12, webLessonScale), 14)
                  : isMobileWeb
                    // The collapse button plus its top gap and nothing more, so the pill stays
                    // centered without the spare padding the native header carries.
                    ? Math.min(collapseButtonTop + collapseButtonSize, 39)
                    : Math.min(scaleValue(42, webLessonScale), 46),
              },
            ]}
          >
            {/* The pill is purely visual — always centered on the full header — while the
                draggable zone below is inset from the left so it never competes with the
                back button's own touch target for the same gesture arena. */}
            <View pointerEvents="none" style={styles.dragZone}>
              <View
                style={[
                  styles.dragHandle,
                  {
                    width: scaleValue(40, webLessonScale),
                    height: scaleValue(4, webLessonScale),
                    borderRadius: scaleValue(100, webLessonScale),
                    backgroundColor: palette.dragHandle,
                  },
                ]}
              />
            </View>
            <GestureDetector gesture={dragGesture}>
              <View style={styles.dragTouchZone} />
            </GestureDetector>
          </View>
          <View style={styles.content}>
            {children}
          </View>
          {/* Rendered above the (short) header and the content below it — the button is
              taller than the compact header, so it would otherwise get visually and
              functionally covered by the content that starts right where the header ends. */}
          <View
            style={[
              styles.collapseButtonSlot,
              { top: collapseButtonTop, left: scaleValue(12, webLessonScale) },
            ]}
          >
            <PracticeCollapseButton
              colors={colors}
              isDarkMode={isDarkMode}
              isDesktopWeb={isDesktopWeb}
              scale={webLessonScale}
              onPress={onClose}
            />
          </View>
        </View>
      </Animated.View>
    </View>
  );
};

// A shadow needs to paint outside the sheet's own rounded-corner clip, so it lives on this
// wrapper instead of the (overflow:hidden) sheet view itself. Web-only — on native this
// boxShadow rendered as an odd transparent-grey border/halo instead of a soft shadow.
const getSheetShadow = (isDarkMode: boolean) => (
  Platform.OS === 'web'
    ? {
        boxShadow: isDarkMode
          ? '0px -16px 40px rgba(0,0,0,0.4)'
          : '0px -16px 40px rgba(0,0,0,0.22)',
      }
    // The wrapper keeps its elevation on Android because that's what drives native
    // stacking (dropping it put the sheet behind the lesson), but the shadow it casts
    // reads as a grey border along the sheet's edge — so paint that shadow transparent.
    : { shadowColor: 'transparent' }
);

export default PracticeSheet;

const styles = StyleSheet.create({
  stage: {
    flex: 1,
    minHeight: 0,
    position: 'relative',
    overflow: 'hidden',
  },
  baseLayer: {
    flex: 1,
    minHeight: 0,
  },
  baseLayerDarken: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  scrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9,
  },
  sheetShadowWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
    // Keep elevation: on Android it drives sibling stacking, not just the shadow —
    // dropping it put the whole sheet behind the base layer.
    elevation: 10,
  },
  sheet: {
    flex: 1,
    minHeight: 0,
    borderTopWidth: 1.5,
    overflow: 'hidden',
    flexDirection: 'column',
  },
  content: {
    flex: 1,
    minHeight: 0,
  },
  sheetHeader: {
    width: '100%',
    flexShrink: 0,
    justifyContent: 'center',
  },
  dragZone: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Starts to the right of the back button's own touch target so the two never compete for
  // the same gesture arena — a plain TouchableOpacity can otherwise lose that race.
  dragTouchZone: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 90,
    right: 0,
  },
  dragHandle: {},
  collapseButtonSlot: {
    position: 'absolute',
    zIndex: 5,
    // Keep elevation (Android stacking), but this wrapper has no background of its own —
    // the shadow it casts is a square grey halo drawn around the round button inside it,
    // since Android casts from this view's own (unrounded) outline, not its child's.
    elevation: 5,
    shadowColor: 'transparent',
  },
});
