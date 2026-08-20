import React from 'react';
import type { LayoutChangeEvent, StyleProp, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { triggerSelectionHaptic } from '../../shared/haptics';

export type DragGestureState = { dx: number; dy: number };

interface DraggableWordChipProps {
  position: number;
  disabled: boolean;
  onLayoutMeasured: (position: number, event: LayoutChangeEvent) => void;
  onDragStart: (position: number) => void;
  onDragMove: (position: number, gestureState: DragGestureState) => void;
  onDragEnd: (position: number, didDrag: boolean, gestureState: DragGestureState) => void;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}

// Drives the drag-to-reorder chip via react-native-gesture-handler + Reanimated so the
// per-frame position/scale updates run on the UI thread instead of being gated behind
// the JS thread (the limitation of the PanResponder + Animated.Value approach this replaces).
const DraggableWordChip: React.FC<DraggableWordChipProps> = ({
  position,
  disabled,
  onLayoutMeasured,
  onDragStart,
  onDragMove,
  onDragEnd,
  style,
  children,
}) => {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const isActive = useSharedValue(false);
  const hasDragged = useSharedValue(false);

  const pan = Gesture.Pan()
    .enabled(!disabled)
    .minDistance(5)
    .onBegin(() => {
      hasDragged.value = false;
      isActive.value = true;
      runOnJS(triggerSelectionHaptic)();
      runOnJS(onDragStart)(position);
      scale.value = withSpring(1.15, { velocity: 0, damping: 20, stiffness: 260 });
    })
    .onUpdate((e) => {
      hasDragged.value = true;
      translateX.value = e.translationX;
      translateY.value = e.translationY;
      runOnJS(onDragMove)(position, { dx: e.translationX, dy: e.translationY });
    })
    .onEnd((e) => {
      runOnJS(onDragEnd)(position, hasDragged.value, { dx: e.translationX, dy: e.translationY });
    })
    .onFinalize(() => {
      // Snap the position back instantly rather than animating it: onDragEnd reorders the
      // list on drop, which reflows this chip into its new slot on the same frame. Animating
      // the offset back to 0 at the same time races that reflow and reads as a glitchy
      // double-motion (slide one way while the layout jumps another). Scale has no such
      // conflict, so it's still free to ease back smoothly.
      translateX.value = 0;
      translateY.value = 0;
      scale.value = withSpring(1, { damping: 26, stiffness: 260 });
      isActive.value = false;
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    zIndex: isActive.value ? 20 : 0,
    elevation: isActive.value ? 14 : 0,
    boxShadow: isActive.value ? '0px 6px 10px rgba(0,0,0,0.28)' : 'none',
  }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View
        onLayout={(event) => onLayoutMeasured(position, event)}
        style={[style, animatedStyle]}
      >
        {children}
      </Animated.View>
    </GestureDetector>
  );
};

export default DraggableWordChip;
