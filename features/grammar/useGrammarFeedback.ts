import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { Animated, Easing, Platform, type View } from 'react-native';

export interface GrammarFeedbackFrame {
  left: number;
  top: number;
  width?: number;
  height: number;
}

export interface ShowGrammarFeedbackOptions {
  activeContentRef: RefObject<View | null>;
  containerRef: RefObject<View | null>;
  fallbackTop: number;
  fallbackHeight: number;
  onHidden: () => void;
}

export type ShowGrammarFeedback = (options: ShowGrammarFeedbackOptions) => Promise<void>;

// "Well done!" timing, in one place so it's easy to tune. Longer legs than a snappy pop —
// the motion should read as gliding rather than punchy — but still well short of the
// original 420/1400/420 (~2.3s), and without its 30ms lead-in stall.
const FEEDBACK_IN_MS = 340;
const FEEDBACK_HOLD_MS = 1200;
const FEEDBACK_OUT_MS = 300;

const isValidFrame = (x: number, y: number, width: number, height: number) => (
  [x, y, width, height].every(Number.isFinite)
  && x >= 0
  && y >= 0
  && width > 0
  && height > 0
);

const measureFeedbackFrame = ({
  activeContentRef,
  containerRef,
  fallbackTop,
  fallbackHeight,
}: Omit<ShowGrammarFeedbackOptions, 'onHidden'>): Promise<GrammarFeedbackFrame> => new Promise((resolve) => {
  const fallbackFrame = { left: 16, top: fallbackTop, height: fallbackHeight };
  let settled = false;
  let fallbackTimeout: ReturnType<typeof setTimeout> | null = null;
  const finish = (frame: GrammarFeedbackFrame) => {
    if (settled) return;
    settled = true;
    if (fallbackTimeout) clearTimeout(fallbackTimeout);
    resolve(frame);
  };
  const activeNode = activeContentRef.current;
  const containerNode = containerRef.current;

  if (!activeNode || !containerNode) {
    finish(fallbackFrame);
    return;
  }

  // Native measurement callbacks are not guaranteed after a view disappears
  // during a fast mode switch. Never leave answer progression waiting on one.
  fallbackTimeout = setTimeout(() => finish(fallbackFrame), 80);

  const resolveFromWindowMeasurements = () => {
    try {
      containerNode.measureInWindow((containerX, containerY) => {
        activeNode.measureInWindow((x, y, width, height) => {
          const relativeX = x - containerX;
          const relativeY = y - containerY;
          finish(
            isValidFrame(relativeX, relativeY, width, height)
              ? { left: relativeX, top: relativeY, width, height }
              : fallbackFrame,
          );
        });
      });
    } catch {
      finish(fallbackFrame);
    }
  };

  try {
    activeNode.measureLayout(
      containerNode,
      (x, y, width, height) => {
        if (isValidFrame(x, y, width, height)) {
          finish({ left: x, top: y, width, height });
          return;
        }
        resolveFromWindowMeasurements();
      },
      resolveFromWindowMeasurements,
    );
  } catch {
    resolveFromWindowMeasurements();
  }
});

/** Owns success-card measurement, animation, dismissal, and cancellation. */
export const useGrammarFeedback = (initialTop: number, initialHeight: number) => {
  const [feedback, setFeedback] = useState('');
  const [feedbackFrame, setFeedbackFrame] = useState<GrammarFeedbackFrame>({
    left: 16,
    top: initialTop,
    height: initialHeight,
  });
  const feedbackAnim = useRef(new Animated.Value(initialHeight)).current;
  const feedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const generationRef = useRef(0);

  const resetFeedback = useCallback(() => {
    generationRef.current += 1;
    if (feedbackTimeoutRef.current) {
      clearTimeout(feedbackTimeoutRef.current);
      feedbackTimeoutRef.current = null;
    }
    feedbackAnim.stopAnimation();
    feedbackAnim.setValue(initialHeight);
    setFeedback('');
  }, [feedbackAnim, initialHeight]);

  const showSuccess = useCallback(async (options: ShowGrammarFeedbackOptions) => {
    const generation = generationRef.current;
    const nextFrame = await measureFeedbackFrame(options);
    if (generation !== generationRef.current) return;

    const travelDistance = nextFrame.height;
    const canUseNativeDriver = Platform.OS !== 'web';
    setFeedbackFrame(nextFrame);
    setFeedback('Well done! 🎉');
    feedbackAnim.setValue(travelDistance);

    Animated.timing(feedbackAnim, {
      toValue: 0,
      duration: FEEDBACK_IN_MS,
      // Quad rather than cubic: cubic's steep start/hard settle is what read as punchy.
      easing: Easing.out(Easing.quad),
      useNativeDriver: canUseNativeDriver,
    }).start();

    if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
    feedbackTimeoutRef.current = setTimeout(() => {
      feedbackTimeoutRef.current = null;
      Animated.timing(feedbackAnim, {
        toValue: travelDistance,
        duration: FEEDBACK_OUT_MS,
        easing: Easing.in(Easing.quad),
        useNativeDriver: canUseNativeDriver,
      }).start(() => {
        if (generation !== generationRef.current) return;
        setFeedback('');
        options.onHidden();
      });
    }, FEEDBACK_HOLD_MS);
  }, [feedbackAnim]);

  useEffect(() => () => {
    generationRef.current += 1;
    if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
    feedbackAnim.stopAnimation();
  }, [feedbackAnim]);

  return {
    feedback,
    feedbackFrame,
    feedbackAnim,
    resetFeedback,
    showSuccess,
  };
};
