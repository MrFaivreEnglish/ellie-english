import { useEffect, useRef } from 'react';
import { useAnimatedStyle, useSharedValue, withSequence, withSpring } from 'react-native-reanimated';

// A one-shot scale pop fired the moment a card/row becomes selected (not on
// initial mount if it starts out already selected), for multi-select modes.
export function useSelectPop(selected: boolean) {
  const scale = useSharedValue(1);
  const wasSelected = useRef(selected);

  useEffect(() => {
    if (selected && !wasSelected.current) {
      scale.value = withSequence(
        withSpring(1.1, { damping: 10, stiffness: 300 }),
        withSpring(1, { damping: 12, stiffness: 260 })
      );
    }
    wasSelected.current = selected;
  }, [selected, scale]);

  return useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
}
