import { useEffect, useMemo, useRef } from 'react';
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



  scale?: number;
};

export default function PillToggle({
  value,
  onValueChange,
  activeColor,
  trackOffColor = '#D9D2C4',
  accessibilityLabel,
  scale = 1,
}: PillToggleProps) {
  const knobPosition = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(knobPosition, {
      toValue: value ? 1 : 0,
      duration: 160,
      // translateX (below) is native-drivable, unlike the `left` this used to animate —
      // the knob now slides on the UI thread instead of per-frame JS layout work.
      useNativeDriver: true,
    }).start();
  }, [value, knobPosition]);

  const trackWidth = Math.round(TRACK_WIDTH * scale);
  const trackHeight = Math.round(TRACK_HEIGHT * scale);
  const knobSize = Math.round(KNOB_SIZE * scale);
  const knobInset = Math.round(KNOB_INSET * scale);

  const knobTranslateX = useMemo(
    () => knobPosition.interpolate({
      inputRange: [0, 1],
      outputRange: [0, trackWidth - knobSize - knobInset * 2],
    }),
    [knobPosition, knobInset, trackWidth, knobSize]
  );

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
          {
            width: trackWidth,
            height: trackHeight,
            borderRadius: trackHeight / 2,
            backgroundColor: value ? activeColor : trackOffColor,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.knob,
            {
              width: knobSize,
              height: knobSize,
              borderRadius: knobSize / 2,
              left: knobInset,
              transform: [{ translateX: knobTranslateX }],
            },
          ]}
        />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    justifyContent: 'center',
  },
  knob: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    boxShadow: '0px 1px 2px rgba(0,0,0,0.20)',
  },
});
