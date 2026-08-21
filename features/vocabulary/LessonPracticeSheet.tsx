import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { VocabularyMode } from './useLessonSheetLayout';

// Hand-converted from the design spec's oklch() source values (hue 90, near-neutral warm
// grays, plus the primary blue accent) — see features/shared/freshDirection.ts for the same
// convention on the app's shared palette. Kept local since this palette is specific to the
// rising-sheet spec and isn't otherwise used in the app.
const SHEET_COLORS = {
  scrim: 'rgba(26,22,11,0.26)', // oklch(0.2 0.02 90 / .26)
  handle: '#DAD7D0', // oklch(0.88 0.01 90)
  chipIdleBg: '#F4F2EC', // oklch(0.96 0.008 90)
  chipIdleText: '#3C382C', // oklch(0.34 0.02 90)
  divider: '#EAE8E0', // oklch(0.93 0.01 90)
  ink: '#1E1A10', // oklch(0.22 0.02 90)
  inkSecondary: '#686357', // oklch(0.5 0.02 90)
  accent: '#0D7DD4', // oklch(0.58 0.16 250)
  accentShadow: 'rgba(13,125,212,0.3)', // oklch(0.58 0.16 250 / .3)
};

const DEFAULT_MODE_LABELS: Record<VocabularyMode, string> = {
  flashcards: 'Flashcards',
  matching: 'Match',
  typing: 'Write',
};

const DEFAULT_SEGMENTS: { key: VocabularyMode; label: string }[] = [
  { key: 'flashcards', label: 'Cards' },
  { key: 'matching', label: 'Match' },
  { key: 'typing', label: 'Write' },
];

const OPEN_DURATION = 280;
const CLOSE_DURATION = 220;
const OPEN_EASING = Easing.out(Easing.cubic);
const CLOSE_EASING = Easing.inOut(Easing.quad);
const SCRIM_OPEN_DURATION = 220;
const SCRIM_CLOSE_DURATION = 180;

type SheetThemeColors = {
  card: string;
  text: string;
  secondaryText: string;
  border: string;
  primary: string;
  surface: string;
};

export type LessonPracticeSheetModeOption<TMode extends string = string> = {
  key: TMode;
  label: string;
  title?: string;
};

type Props<TMode extends string> = {
  visible: boolean;
  mode: TMode;
  isDarkMode: boolean;
  colors: SheetThemeColors;
  onClose: () => void;
  onSwitchMode: (mode: TMode) => void;
  segments?: readonly LessonPracticeSheetModeOption<TMode>[];
  modeTitles?: Partial<Record<TMode, string>>;
  children: React.ReactNode;
  // Renders as a plain in-tree overlay (no RN Modal) confined to the parent
  // screen container, instead of a full-window Modal — so a sibling bottom
  // tab bar rendered outside that container stays visible while the sheet
  // is open. GrammarQuiz's practice panel isn't laid out for that (it's
  // nested mid-scrollview), so it keeps the Modal path via the default.
  edgeToEdge?: boolean;
  // Space to leave clear at the bottom of an edgeToEdge sheet, e.g. for a
  // mode dock that stays visible/interactive below the sheet.
  bottomInset?: number;
  // Whether to render the built-in segmented mode control. Off when the
  // caller already shows a persistent mode dock outside the sheet.
  showModeControl?: boolean;
  // When set, the sheet's own title row echoes the lesson header's
  // "Lesson › Mode" breadcrumb instead of showing just the mode name.
  lessonTitle?: string;
  // Experimental: hides the title row (breadcrumb + back circle) entirely,
  // so the practice module starts right under the drag handle. The handle
  // itself and the dock's toggle-to-close still close the sheet, so this is
  // safe to try — flip back to true (or drop the prop) to restore it.
  showTitleRow?: boolean;
};

export default function LessonPracticeSheet<TMode extends string = VocabularyMode>({
  visible,
  mode,
  isDarkMode,
  colors,
  onClose,
  onSwitchMode,
  segments = DEFAULT_SEGMENTS as unknown as readonly LessonPracticeSheetModeOption<TMode>[],
  modeTitles,
  children,
  edgeToEdge = false,
  bottomInset = 0,
  showModeControl = true,
  lessonTitle,
  showTitleRow = true,
}: Props<TMode>) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width >= 768;

  const theme = useMemo(() => ({
    sheetBg: colors.card,
    handle: isDarkMode ? colors.border : SHEET_COLORS.handle,
    chipIdleBg: isDarkMode ? colors.surface : SHEET_COLORS.chipIdleBg,
    ink: isDarkMode ? colors.text : SHEET_COLORS.ink,
    inkSecondary: isDarkMode ? colors.secondaryText : SHEET_COLORS.inkSecondary,
    accent: isDarkMode ? colors.primary : SHEET_COLORS.accent,
    knobBg: isDarkMode ? colors.card : '#FFFFFF',
  }), [isDarkMode, colors]);

  const [mounted, setMounted] = useState(visible);
  const translateY = useRef(new Animated.Value(height)).current;
  const scrimOpacity = useRef(new Animated.Value(0)).current;
  const sheetTop = edgeToEdge ? Math.max(insets.top, 4) : (isDesktop ? 24 : 38);
  const sheetHeight = Math.max(1, height - sheetTop);
  // Read via a ref inside the animation effect (not as a dependency) — the
  // on-screen keyboard opening for Write mode can change the reported window
  // height mid-open, and re-running this effect on that change replayed the
  // whole open animation from scratch ("opens twice").
  const sheetHeightRef = useRef(sheetHeight);
  sheetHeightRef.current = sheetHeight;
  const activeSegment = segments.find((segment) => segment.key === mode);
  const activeTitle = modeTitles?.[mode]
    ?? activeSegment?.title
    ?? (mode in DEFAULT_MODE_LABELS ? DEFAULT_MODE_LABELS[mode as VocabularyMode] : activeSegment?.label)
    ?? mode;

  useEffect(() => {
    if (visible) {
      setMounted(true);
      translateY.setValue(sheetHeightRef.current * 1.02);
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: OPEN_DURATION,
          easing: OPEN_EASING,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(scrimOpacity, {
          toValue: 1,
          duration: SCRIM_OPEN_DURATION,
          easing: Easing.out(Easing.ease),
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]).start();
      return;
    }

    if (!mounted) return;

    Animated.parallel([
      Animated.timing(translateY, {
        toValue: sheetHeightRef.current * 1.02,
        duration: CLOSE_DURATION,
        easing: CLOSE_EASING,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(scrimOpacity, {
        toValue: 0,
        duration: SCRIM_CLOSE_DURATION,
        easing: Easing.in(Easing.ease),
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]).start(({ finished }) => {
      if (finished) setMounted(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_evt, gesture) => Math.abs(gesture.dy) > 4 && Math.abs(gesture.dy) > Math.abs(gesture.dx),
        onPanResponderMove: (_evt, gesture) => {
          if (gesture.dy > 0) translateY.setValue(gesture.dy);
        },
        onPanResponderRelease: (_evt, gesture) => {
          if (gesture.dy > 70 || gesture.vy > 0.8) {
            onClose();
            return;
          }
          Animated.timing(translateY, {
            toValue: 0,
            duration: 180,
            easing: OPEN_EASING,
            useNativeDriver: Platform.OS !== 'web',
          }).start();
        },
      }),
    [onClose, translateY]
  );

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined' || !visible) return undefined;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [visible, onClose]);

  if (!mounted) return null;

  const sheetInner = (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          styles.scrim,
          { opacity: scrimOpacity, bottom: edgeToEdge ? bottomInset : 0 },
        ]}
        pointerEvents={visible ? 'auto' : 'none'}
      >
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} accessibilityLabel="Close practice" accessibilityRole="button" />
      </Animated.View>

      <Animated.View
        style={[
          styles.sheet,
          isDesktop ? styles.sheetDesktop : styles.sheetMobile,
          {
            top: sheetTop,
            bottom: edgeToEdge ? bottomInset : 0,
            backgroundColor: theme.sheetBg,
            paddingBottom: Math.max(insets.bottom, isDesktop ? 0 : 8),
            transform: [{ translateY }],
          },
        ]}
      >
        <View {...panResponder.panHandlers}>
          <TouchableOpacity
            style={styles.handleWrap}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close practice"
          >
            <View style={[styles.handle, isDesktop ? styles.handleDesktop : styles.handleMobile, { backgroundColor: theme.handle }]} />
          </TouchableOpacity>
        </View>

        {showTitleRow && (
          <View style={[styles.titleRow, mode === 'matching' && styles.titleRowMatching]}>
            <TouchableOpacity
              style={[styles.backCircle, mode === 'matching' && styles.backCircleCompact, { backgroundColor: theme.chipIdleBg }]}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Back to lesson"
            >
              <MaterialIcons name="arrow-back" size={mode === 'matching' ? 15 : 18} color={theme.ink} />
            </TouchableOpacity>

            <View style={styles.titleBreadcrumb}>
              {lessonTitle ? (
                <>
                  <Text
                    style={[styles.titleText, styles.titleTextShrunk, { color: theme.ink }]}
                    numberOfLines={1}
                  >
                    {lessonTitle}
                  </Text>
                  <MaterialIcons name="chevron-right" size={16} color={theme.inkSecondary} />
                  <Text
                    style={[styles.titleText, styles.titleModeText, { color: theme.inkSecondary }]}
                    numberOfLines={1}
                  >
                    {activeTitle}
                  </Text>
                </>
              ) : (
                <Text style={[styles.titleText, { color: theme.ink }]} numberOfLines={1}>
                  {activeTitle}
                </Text>
              )}
            </View>
          </View>
        )}

        <KeyboardAvoidingView
          style={styles.contentSlot}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {children}
        </KeyboardAvoidingView>

        {showModeControl && (
          <ModeSegmentedControl mode={mode} segments={segments} isDesktop={isDesktop} theme={theme} onChange={onSwitchMode} />
        )}
      </Animated.View>
    </View>
  );

  if (edgeToEdge) return sheetInner;

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent onRequestClose={onClose}>
      {sheetInner}
    </Modal>
  );
}

function ModeSegmentedControl<TMode extends string>({
  mode,
  segments,
  isDesktop,
  theme,
  onChange,
}: {
  mode: TMode;
  segments: readonly LessonPracticeSheetModeOption<TMode>[];
  isDesktop: boolean;
  theme: { chipIdleBg: string; inkSecondary: string; accent: string; knobBg: string };
  onChange: (mode: TMode) => void;
}) {
  const [trackWidth, setTrackWidth] = useState(0);
  const knobX = useRef(new Animated.Value(0)).current;
  const activeIndex = Math.max(0, segments.findIndex((segment) => segment.key === mode));
  const trackPadding = 4;
  const segmentWidth = Math.max(0, (trackWidth - trackPadding * 2) / segments.length);

  useEffect(() => {
    if (!trackWidth) return;
    Animated.timing(knobX, {
      toValue: activeIndex * segmentWidth,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, [activeIndex, segmentWidth, trackWidth, knobX]);

  return (
    <View style={[styles.segmentedWrap, isDesktop && styles.segmentedWrapDesktop]}>
      <View
        style={[styles.segmentedTrack, { backgroundColor: theme.chipIdleBg }]}
        onLayout={(event) => setTrackWidth(event.nativeEvent.layout.width)}
      >
        {trackWidth > 0 && (
          <Animated.View
            style={[
              styles.segmentedKnob,
              { width: segmentWidth, backgroundColor: theme.knobBg, transform: [{ translateX: knobX }] },
            ]}
          />
        )}
        {segments.map((segment) => {
          const active = segment.key === mode;
          return (
            <TouchableOpacity
              key={segment.key}
              style={styles.segmentedItem}
              onPress={() => onChange(segment.key)}
              accessibilityRole="button"
              accessibilityLabel={`Switch to ${segment.label}`}
              accessibilityState={{ selected: active }}
            >
              <Text
                style={[styles.segmentedLabel, { color: active ? theme.accent : theme.inkSecondary }, active && styles.segmentedLabelActive]}
                numberOfLines={1}
              >
                {segment.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scrim: {
    backgroundColor: SHEET_COLORS.scrim,
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
    boxShadow: '0px -14px 44px rgba(0,0,0,0.22)',
  },
  sheetDesktop: {
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
  },
  sheetMobile: {
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
  },
  handleWrap: {
    alignItems: 'center',
    paddingTop: 6,
    paddingBottom: 12,
  },
  handle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: SHEET_COLORS.handle,
  },
  handleMobile: {
    width: 40,
  },
  handleDesktop: {
    width: 44,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingBottom: 2,
  },
  titleRowMatching: {
    paddingBottom: 0,
  },
  titleBreadcrumb: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  titleText: {
    fontSize: 18,
    fontWeight: '800',
    color: SHEET_COLORS.ink,
  },
  titleTextShrunk: {
    flexShrink: 1,
  },
  titleModeText: {
    flexShrink: 2,
    minWidth: 0,
  },
  backCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: SHEET_COLORS.chipIdleBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backCircleCompact: {
    width: 26,
    height: 26,
    borderRadius: 13,
  },
  contentSlot: {
    flex: 1,
    minHeight: 0,
    width: '100%',
  },
  segmentedWrap: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 12,
  },
  segmentedWrapDesktop: {
    paddingBottom: 16,
  },
  segmentedTrack: {
    flexDirection: 'row',
    width: '100%',
    maxWidth: 420,
    backgroundColor: SHEET_COLORS.chipIdleBg,
    borderRadius: 999,
    padding: 4,
    position: 'relative',
  },
  segmentedKnob: {
    position: 'absolute',
    top: 4,
    left: 4,
    bottom: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    boxShadow: '0px 2px 7px rgba(0,0,0,0.09)',
  },
  segmentedItem: {
    flex: 1,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentedLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: SHEET_COLORS.inkSecondary,
  },
  segmentedLabelActive: {
    color: SHEET_COLORS.accent,
    fontWeight: '700',
  },
});
