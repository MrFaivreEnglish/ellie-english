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







export const CHIP_DRAG_COMMIT_THRESHOLD_DY = 64;

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
      runOnJS(onDragStart)(position);
      scale.value = withSpring(1.15, { velocity: 0, damping: 20, stiffness: 260 });
    })
    .onUpdate((e) => {
      // Fires on the first real movement, not on touch-down. onBegin runs the moment a
      // finger lands, so a plain tap buzzed here and again in the chip's press handler on
      // release. A drag still gets exactly one buzz, and the press handler suppresses its
      // own once a drag has happened (see useSelectedWordDrag's shouldIgnorePress).
      if (!hasDragged.value) {
        hasDragged.value = true;
        runOnJS(triggerSelectionHaptic)();
      }
      translateX.value = e.translationX;
      translateY.value = e.translationY;
      runOnJS(onDragMove)(position, { dx: e.translationX, dy: e.translationY });
    })
    .onEnd((e) => {
      runOnJS(onDragEnd)(position, hasDragged.value, { dx: e.translationX, dy: e.translationY });
    })
    .onFinalize(() => {
      // Reset on the UI thread even when the JS drop handler does not rerender the chip.
      translateX.value = 0;
      translateY.value = 0;
      scale.value = withSpring(1, { damping: 26, stiffness: 260 });
      isActive.value = false;
    });

  const animatedStyle = useAnimatedStyle(() => {





    const dragOpacity = 1 - Math.min(1, Math.abs(translateY.value) / CHIP_DRAG_COMMIT_THRESHOLD_DY) * 0.65;

    return {
      opacity: dragOpacity,
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
      ],
      zIndex: isActive.value ? 20 : 0,
      elevation: isActive.value ? 14 : 0,
      boxShadow: isActive.value ? '0px 6px 10px rgba(0,0,0,0.28)' : 'none',
      // Android draws the elevation shadow against this view's own corners, not the rounded
      // chip inside it — without a matching radius here, lifting the chip showed a square
      // shadow poking out from behind its rounded edges. Matches wordChip's own radius.
      borderRadius: 11,
    };
  });

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
