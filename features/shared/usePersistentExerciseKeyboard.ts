import { useCallback, useEffect, useRef, type RefObject } from 'react';
import { Platform, type TextInput } from 'react-native';
import { useIsFocused } from '@react-navigation/native';

type PersistentExerciseKeyboardOptions = {
  inputRef: RefObject<TextInput | null>;
  enabled: boolean;
  androidFocusRetries?: boolean;
  blurWhenDisabled?: boolean;
};

const toDelayList = (delays: number | number[]) =>
  Array.isArray(delays) ? delays : [delays];

export const usePersistentExerciseKeyboard = ({
  inputRef,
  enabled,
  androidFocusRetries = Platform.OS === 'android',
  blurWhenDisabled = true,
}: PersistentExerciseKeyboardOptions) => {
  const isScreenFocused = useIsFocused();
  const shouldKeepKeyboardOpen = enabled && isScreenFocused;
  const shouldKeepKeyboardOpenRef = useRef(false);
  const focusTimeoutIdsRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const clearFocusTimeouts = useCallback(() => {
    focusTimeoutIdsRef.current.forEach(clearTimeout);
    focusTimeoutIdsRef.current.clear();
  }, []);

  useEffect(() => {
    shouldKeepKeyboardOpenRef.current = shouldKeepKeyboardOpen;

    if (!shouldKeepKeyboardOpen) {
      clearFocusTimeouts();
      if (blurWhenDisabled) {
        inputRef.current?.blur();
      }
    }
  }, [blurWhenDisabled, clearFocusTimeouts, inputRef, shouldKeepKeyboardOpen]);

  useEffect(() => () => {
    clearFocusTimeouts();
  }, [clearFocusTimeouts]);

  const focusInput = useCallback((delay = 0) => {
    if (!shouldKeepKeyboardOpenRef.current) {
      return;
    }

    const runFocus = () => {
      requestAnimationFrame(() => {
        if (!shouldKeepKeyboardOpenRef.current) {
          return;
        }

        // These retries exist to recover focus that was actually lost (a sheet or keyboard
        // transition dropping it). Re-focusing an input that never lost it makes Android
        // hide and reshow the keyboard, which reads as a flash on every exercise change.
        if (inputRef.current?.isFocused()) {
          return;
        }

        inputRef.current?.focus();
      });
    };

    if (delay > 0) {
      const existingTimeoutId = focusTimeoutIdsRef.current.get(delay);
      if (existingTimeoutId) {
        clearTimeout(existingTimeoutId);
      }

      const timeoutId = setTimeout(() => {
        focusTimeoutIdsRef.current.delete(delay);
        runFocus();
      }, delay);
      focusTimeoutIdsRef.current.set(delay, timeoutId);
      return;
    }

    runFocus();
  }, [inputRef]);

  const focusInputSequence = useCallback((delays: number | number[]) => {
    toDelayList(delays).forEach(focusInput);
  }, [focusInput]);

  const focusOnExerciseChange = useCallback(() => {
    if (!shouldKeepKeyboardOpenRef.current) {
      return;
    }

    focusInput(60);
    if (androidFocusRetries) {
      // Android can drop focus while a sheet or keyboard transition is still settling.
      focusInput(220);
      focusInput(420);
    }
  }, [androidFocusRetries, focusInput]);

  return {
    isScreenFocused,
    shouldKeepKeyboardOpen,
    focusInput,
    focusInputSequence,
    focusOnExerciseChange,
    clearFocusTimeouts,
  };
};
