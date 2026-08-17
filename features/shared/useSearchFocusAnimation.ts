import { useCallback, useEffect, useState } from 'react';
import { interpolateColor, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

// Animates a search field's border between its idle and active states based on
// focus or non-empty text, instead of the raw style-array swap that snapped instantly.
export function useSearchFocusAnimation(hasText: boolean, inactiveColor: string, activeColor: string) {
  const [isFocused, setIsFocused] = useState(false);
  const isActive = isFocused || hasText;
  const progress = useSharedValue(isActive ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(isActive ? 1 : 0, { duration: 160 });
  }, [isActive, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(progress.value, [0, 1], [inactiveColor, activeColor]),
    borderWidth: 1.5 + progress.value * 0.5,
  }));

  const onFocus = useCallback(() => setIsFocused(true), []);
  const onBlur = useCallback(() => setIsFocused(false), []);

  return { animatedStyle, onFocus, onBlur };
}
