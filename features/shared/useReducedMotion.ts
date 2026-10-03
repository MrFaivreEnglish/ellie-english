import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';
import { useTheme } from '../settings/ThemeContext';

// True when the phone's own "reduce motion" setting is on or the student picked
// Fewer Animations in Settings. Reanimated animations follow the same two settings
// globally (see App.tsx); this is for React Native Animated, which has no global switch.
export default function useReducedMotion() {
  const { isReduceAnimationsEnabled } = useTheme();
  const [systemReducedMotion, setSystemReducedMotion] = useState(false);

  useEffect(() => {
    let mounted = true;

    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        // false is already the starting value; skipping it saves a re-render per screen.
        if (mounted && enabled) setSystemReducedMotion(true);
      })
      .catch(() => {});

    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setSystemReducedMotion);

    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  return systemReducedMotion || isReduceAnimationsEnabled;
}
