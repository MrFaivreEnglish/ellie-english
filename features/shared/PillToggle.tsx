import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet } from 'react-native';

const TRACK_WIDTH = 38;
const TRACK_HEIGHT = 22;
const KNOB_SIZE = 16;
const KNOB_INSET = 3;

type PillToggleProps = {
  value: boolean;
  onValueChange: () => void;
  activeColor: string;
  trackOffColor?: string;
  accessibilityLabel?: string;
};

export default function PillToggle({
  value,
  onValueChange,
  activeColor,
  trackOffColor = '#D9D2C4',
  accessibilityLabel,
}: PillToggleProps) {
  const knobPosition = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(knobPosition, {
      toValue: value ? 1 : 0,
      duration: 160,
      useNativeDriver: false,
    }).start();
  }, [value, knobPosition]);

  const knobLeft = knobPosition.interpolate({
    inputRange: [0, 1],
    outputRange: [KNOB_INSET, TRACK_WIDTH - KNOB_SIZE - KNOB_INSET],
  });

  return (
    <Pressable
      onPress={onValueChange}
      accessibilityRole="switch"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked: value }}
      hitSlop={8}
    >
      <Animated.View
        style={[
          styles.track,
          { backgroundColor: value ? activeColor : trackOffColor },
        ]}
      >
        <Animated.View style={[styles.knob, { left: knobLeft }]} />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    width: TRACK_WIDTH,
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    justifyContent: 'center',
  },
  knob: {
    position: 'absolute',
    width: KNOB_SIZE,
    height: KNOB_SIZE,
    borderRadius: KNOB_SIZE / 2,
    backgroundColor: '#FFFFFF',
    boxShadow: '0px 1px 2px rgba(0,0,0,0.20)',
    elevation: 2,
  },
});
