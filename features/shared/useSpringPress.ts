import { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

// Same spring tuning as DraggableWordChip's drag-lift scale, applied here as
// static press-in/press-out feedback for tappable list rows and cards.
const PRESS_SPRING = { damping: 22, stiffness: 260 };

export function useSpringPress(scaleTo: number = 0.97) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const onPressIn = () => {
    scale.value = withSpring(scaleTo, PRESS_SPRING);
  };

  const onPressOut = () => {
    scale.value = withSpring(1, PRESS_SPRING);
  };

  return { animatedStyle, onPressIn, onPressOut };
}
