import React, { useEffect } from 'react';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { MaterialIcons } from '@expo/vector-icons';

// A gentle idle float for empty-state icons so the screen doesn't read as inert.
export default function FloatingIcon({ name, size, color }: { name: React.ComponentProps<typeof MaterialIcons>['name']; size: number; color: string }) {
  const translateY = useSharedValue(0);

  useEffect(() => {
    translateY.value = withRepeat(
      withSequence(
        withTiming(-5, { duration: 1200, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 1200, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      false
    );
  }, [translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <MaterialIcons name={name} size={size} color={color} />
    </Animated.View>
  );
}
