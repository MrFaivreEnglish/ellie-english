import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  Animated,
  Image,
  type ImageSourcePropType,
  Platform,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
  type ViewStyle,
} from 'react-native';
import Text from '../shared/ThemedText';
import MaterialIcons, { type MaterialIconName } from '../shared/ThemedMaterialIcon';
import type { ThemeColors } from '../settings/ThemeContext';
import { freshFontFamily } from '../shared/freshDirection';
import { useDesktopTypographyScale } from '../shared/DesktopTypography';
import { getSheetDensity } from '../shared/responsiveLayout';

export type SessionResultTone = 'success' | 'celebration' | 'perfect' | 'warning';

export type SessionResultStat = {
  emoji?: string;
  label: string;
  value: string | number;
};

type SessionResultCardProps = {
  colors: ThemeColors;
  isDarkMode: boolean;
  tone: SessionResultTone;
  eyebrow: string;
  title: string;
  subtitle?: string;
  image?: ImageSourcePropType;
  heroEmoji?: string;
  iconName?: MaterialIconName;
  heroVisualStyle?: any;
  heroContainerStyle?: any;
  sectionLabel?: string;
  onBack?: () => void;
  contentSized?: boolean;
  fillContainer?: boolean;
  showHero?: boolean;
  showBody?: boolean;
  forceDense?: boolean;
  children: ReactNode;
};

type SessionResultStatsProps = {
  colors: ThemeColors;
  isDarkMode: boolean;
  items: SessionResultStat[];
  reveal?: boolean;
  animationsEnabled?: boolean;
  revealDelay?: number;
  forceDense?: boolean;
};

type SessionResultActionsProps = {
  colors: ThemeColors;
  isDarkMode: boolean;
  primaryLabel: string;
  onPrimary: () => void;
  primaryDisabled?: boolean;
  secondaryLabel?: string;
  onSecondary?: () => void;
  forceDense?: boolean;
};

const TONES = {
  success: {
    light: { hero: '#3FA671', border: '#2F8A5C', accent: '#FFFFFF', visual: 'rgba(255,255,255,0.16)', visualInk: '#FFE066' },
    dark: { hero: '#16745F', border: '#0F5E50', accent: '#FFFFFF', visual: 'rgba(255,255,255,0.12)', visualInk: '#FFE07A' },
  },
  celebration: {
    light: { hero: '#7357B6', border: '#594092', accent: '#FFFFFF', visual: 'rgba(255,255,255,0.16)', visualInk: '#FFE066' },
    dark: { hero: '#58408F', border: '#3E2B6D', accent: '#FFFFFF', visual: 'rgba(255,255,255,0.12)', visualInk: '#FFE07A' },
  },
  perfect: {
    light: { hero: '#D69A22', border: '#A96F08', accent: '#FFFFFF', visual: 'rgba(255,255,255,0.18)', visualInk: '#FFFFFF' },
    dark: { hero: '#8E6518', border: '#6F4B09', accent: '#FFF7D6', visual: 'rgba(255,255,255,0.12)', visualInk: '#FFF0A6' },
  },
  warning: {
    light: { hero: '#D65D4D', border: '#A84438', accent: '#FFFFFF', visual: 'rgba(255,255,255,0.16)', visualInk: '#FFFFFF' },
    dark: { hero: '#8E3D33', border: '#6E2E27', accent: '#FFFFFF', visual: 'rgba(255,255,255,0.12)', visualInk: '#FFFFFF' },
  },
} as const;




const STAT_PALETTE_LIGHT = [
  { background: '#F2F6FE', label: '#7D8AA5', ink: '#1B9E77' },
  { background: '#F2F6FE', label: '#7D8AA5', ink: '#3B4FA0' },
  { background: '#F2F6FE', label: '#7D8AA5', ink: '#B8860B' },
  { background: '#F2F6FE', label: '#7D8AA5', ink: '#9A4338' },
];

const STAT_PALETTE_DARK = [
  { background: '#0E2E28', label: '#8DDCCA', ink: '#6FE3C4' },
  { background: '#132A42', label: '#9DC7E8', ink: '#7FC4EE' },
  { background: '#362D17', label: '#E2C77C', ink: '#FFE19A' },
  { background: '#491513', label: '#F3AAA5', ink: '#FEBAB4' },
];

export default function SessionResultCard({
  colors,
  isDarkMode,
  tone,
  eyebrow,
  title,
  subtitle,
  image,
  heroEmoji,
  iconName = 'check',
  heroVisualStyle,
  heroContainerStyle,
  sectionLabel,
  onBack,
  contentSized = false,
  fillContainer = false,
  showHero = true,
  showBody = true,
  forceDense = false,
  children,
}: SessionResultCardProps) {
  const { width, height } = useWindowDimensions();
  const desktopScale = useDesktopTypographyScale();
  const { compact, dense, veryShort } = getSheetDensity(width, height, desktopScale, forceDense);
  const availableHeight = Math.max(320, height - Math.round((dense ? 32 : 48) * desktopScale));
  const portraitCardMinHeight = compact && height > width
    ? Math.min(availableHeight, Math.max(500, Math.round((width - 32) * 1.4)))
    : 0;
  const toneColors = TONES[tone][isDarkMode ? 'dark' : 'light'];

  return (
    <View
      style={[
        styles.card,
        contentSized && styles.cardContentSized,
        dense && styles.cardCompact,
        veryShort && styles.cardVeryShort,
        {
          backgroundColor: isDarkMode ? colors.background : '#F1F5FE',
          height: fillContainer ? '100%' : undefined,
          minHeight: fillContainer
            ? 0
            : contentSized
            ? portraitCardMinHeight
            : Math.max(portraitCardMinHeight, Math.min(Math.round(760 * desktopScale), availableHeight)),
          maxWidth: Math.min(Math.round(570 * desktopScale), Math.max(320, width - (dense ? 32 : 48))),
          borderRadius: Math.round(24 * desktopScale),
          paddingHorizontal: Math.round((veryShort ? 16 : dense ? 20 : 36) * desktopScale),
          paddingTop: Math.round((veryShort ? 10 : dense ? 14 : 28) * desktopScale),
          paddingBottom: Math.round((veryShort ? 14 : dense ? 18 : 36) * desktopScale),
          maxHeight: availableHeight,
          boxShadow: isDarkMode
            ? '0px 8px 24px rgba(0,0,0,0.34)'
            : '0px 8px 24px rgba(40,60,110,0.12)',
        } as ViewStyle,
      ]}
      accessibilityViewIsModal
    >
      {!!sectionLabel && (
        <Pressable
          onPress={onBack}
          disabled={!onBack}
          accessibilityRole={onBack ? 'button' : undefined}
          accessibilityLabel={onBack ? `Back to ${sectionLabel}` : undefined}
          style={({ pressed }) => [
            styles.sectionLabelRow,
            dense && styles.sectionLabelRowCompact,
            desktopScale > 1 && {
              minHeight: Math.round((dense ? 30 : 38) * desktopScale),
              gap: Math.round(8 * desktopScale),
              marginLeft: Math.round(-10 * desktopScale),
              marginBottom: Math.round((dense ? 6 : 12) * desktopScale),
              paddingHorizontal: Math.round(10 * desktopScale),
              borderRadius: Math.round(12 * desktopScale),
            },
            {
              backgroundColor: pressed ? (isDarkMode ? colors.surfaceAlt : '#E4EAF8') : 'transparent',
              opacity: onBack ? 1 : 0.76,
            },
            Platform.OS === 'web' && onBack && ({ cursor: 'pointer' } as ViewStyle),
          ]}
        >
          <MaterialIcons name="chevron-left" size={Math.round(18 * desktopScale)} color={colors.secondaryText} />
          <Text style={[styles.sectionLabel, { color: colors.secondaryText }]}>{sectionLabel}</Text>
        </Pressable>
      )}

      {showHero && <Animated.View
        style={[
          styles.hero,
          dense && styles.heroCompact,
          veryShort && styles.heroVeryShort,
          desktopScale > 1 && {
            minHeight: Math.round((veryShort ? 82 : dense ? 92 : 122) * desktopScale),
            paddingHorizontal: Math.round((dense ? 16 : 24) * desktopScale),
            paddingVertical: Math.round((veryShort ? 9 : dense ? 12 : 24) * desktopScale),
            borderRadius: Math.round(20 * desktopScale),
          },
          { backgroundColor: toneColors.hero, borderColor: toneColors.border },
          heroContainerStyle,
        ]}
      >
        <View style={[styles.orbit, styles.orbitLarge, { borderColor: toneColors.accent }]} />
        <View style={[styles.orbit, styles.orbitSmall, { backgroundColor: toneColors.accent }]} />
        <Text style={[styles.sparkle, styles.sparkleOne]}>✨</Text>
        <Text style={[styles.sparkle, styles.sparkleTwo]}>✨</Text>
        <Text style={[styles.sparkle, styles.sparkleThree]}>✨</Text>

        <View style={styles.heroMain}>
          <Animated.View
            style={[
              styles.visual,
              dense && styles.visualCompact,
              desktopScale > 1 && {
                width: Math.round((dense ? 54 : 64) * desktopScale),
                height: Math.round((dense ? 54 : 64) * desktopScale),
                borderRadius: Math.round((dense ? 17 : 20) * desktopScale),
              },
              { backgroundColor: toneColors.visual },
              heroVisualStyle,
            ]}
          >
            {image ? (
              <Image
                source={image}
                style={[
                  styles.heroImage,
                  dense && styles.heroImageCompact,
                  desktopScale > 1 && {
                    width: Math.round((dense ? 50 : 58) * desktopScale),
                    height: Math.round((dense ? 50 : 58) * desktopScale),
                  },
                ]}
                resizeMode="contain"
              />
            ) : heroEmoji ? (
              <Text style={[styles.heroEmoji, dense && styles.heroEmojiCompact]}>{heroEmoji}</Text>
            ) : (
              <MaterialIcons name={iconName} size={Math.round((dense ? 34 : 42) * desktopScale)} color={toneColors.visualInk} />
            )}
          </Animated.View>

          <View style={styles.heroCopy}>
            <Text style={[styles.eyebrow, { color: toneColors.accent }]}>{eyebrow}</Text>
            <Text style={[styles.title, dense && styles.titleCompact, veryShort && styles.titleVeryShort]}>{title}</Text>
            {!!subtitle && (
              <Text style={[styles.subtitle, dense && styles.subtitleCompact, veryShort && styles.subtitleVeryShort]}>{subtitle}</Text>
            )}
          </View>
        </View>
      </Animated.View>}

      {showBody && (
        <View style={[
          styles.body,
          contentSized && styles.bodyContentSized,
          portraitCardMinHeight > 0 && styles.bodyPortrait,
          dense && styles.bodyCompact,
          veryShort && styles.bodyVeryShort,
          desktopScale > 1 && {
            paddingTop: Math.round((veryShort ? 9 : dense ? 12 : 24) * desktopScale),
            gap: Math.round((veryShort ? 9 : dense ? 12 : 24) * desktopScale),
          },
        ]}>{children}</View>
      )}
    </View>
  );
}

// Only plain integer values count up — formatted stats (e.g. "5/8", "01:23", "+3") stay static.
const getNumericStatValue = (value: string | number): number | null => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string' && /^\d+$/.test(value.trim())) return Number(value);
  return null;
};

export function SessionResultStats({
  isDarkMode,
  items,
  reveal = true,
  animationsEnabled = true,
  revealDelay = 0,
  forceDense = false,
}: SessionResultStatsProps) {
  const { width, height } = useWindowDimensions();
  const desktopScale = useDesktopTypographyScale();
  const tileAnimations = useRef(Array.from({ length: 6 }, () => new Animated.Value(0))).current;
  // Separate, JS-driven values just for the count-up listeners — the tile reveal above runs
  // on the native driver, where per-frame listeners don't fire reliably.
  const countAnimations = useRef(Array.from({ length: 6 }, () => new Animated.Value(0))).current;
  const [displayedValues, setDisplayedValues] = useState<Record<number, number>>({});

  useEffect(() => {
    tileAnimations.forEach((animation) => {
      animation.stopAnimation();
      animation.setValue(reveal && !animationsEnabled ? 1 : 0);
    });
    countAnimations.forEach((animation) => animation.stopAnimation());

    const removeListeners: Array<() => void> = [];
    const nextDisplayed: Record<number, number> = {};

    items.forEach((item, index) => {
      const numericTarget = getNumericStatValue(item.value);
      if (numericTarget === null) return;

      if (!reveal || !animationsEnabled) {
        nextDisplayed[index] = numericTarget;
        countAnimations[index].setValue(1);
        return;
      }

      nextDisplayed[index] = 0;
      countAnimations[index].setValue(0);
      const listenerId = countAnimations[index].addListener(({ value }) => {
        const next = Math.round(value * numericTarget);
        // Only re-render when the displayed integer actually changes — without this it
        // fired every frame per tile, rebuilding the whole map each time.
        setDisplayedValues((prev) => (prev[index] === next ? prev : { ...prev, [index]: next }));
      });
      removeListeners.push(() => countAnimations[index].removeListener(listenerId));
    });

    setDisplayedValues(nextDisplayed);

    if (!reveal || !animationsEnabled || items.length === 0) {
      return () => removeListeners.forEach((remove) => remove());
    }

    const cascade = Animated.sequence([
      Animated.delay(revealDelay),
      Animated.stagger(
        215,
        tileAnimations.slice(0, items.length).map((animation, index) =>
          Animated.parallel([
            Animated.spring(animation, {
              toValue: 1,
              friction: 10,
              tension: 58,
              useNativeDriver: Platform.OS !== 'web',
            }),
            // JS-driven by necessity: it feeds the listener above that ticks the number.
            Animated.timing(countAnimations[index], {
              toValue: 1,
              duration: 640,
              useNativeDriver: false,
            }),
          ])
        )
      ),
    ]);
    cascade.start();
    return () => {
      cascade.stop();
      removeListeners.forEach((remove) => remove());
    };
    // Deliberately keyed on items.length, not `items`. Callers build this array inline, so
    // its identity changes on every render of the end screen — including the many renders
    // the counters here cause. Depending on it restarted this effect each time, resetting
    // every tile to 0 and replaying the cascade, which is what made the stats blink in and
    // out. The stat values themselves are fixed for the life of an end screen, so the tile
    // count is the only thing here that can meaningfully change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animationsEnabled, items.length, reveal, revealDelay, tileAnimations, countAnimations]);

  if (items.length === 0) return null;

  const palette = isDarkMode ? STAT_PALETTE_DARK : STAT_PALETTE_LIGHT;
  const useGrid = items.length >= 4;
  const { dense, veryShort } = getSheetDensity(width, height, desktopScale, forceDense);

  return (
    <View style={[
      styles.stats,
      useGrid && styles.statsGrid,
      desktopScale > 1 && { gap: Math.round(14 * desktopScale) },
    ]}>
      {items.map((item, index) => {
        const tile = palette[index % palette.length];
        return (
          <Animated.View
            key={`${item.label}-${index}`}
            style={[
              styles.stat,
              dense && styles.statCompact,
              veryShort && styles.statVeryShort,
              useGrid && styles.statGrid,
              desktopScale > 1 && {
                minHeight: Math.round((veryShort ? 76 : dense ? 86 : 126) * desktopScale),
                borderRadius: Math.round((dense ? 14 : 18) * desktopScale),
                paddingVertical: Math.round((veryShort ? 7 : dense ? 10 : 20) * desktopScale),
                paddingHorizontal: Math.round(10 * desktopScale),
                gap: Math.round((dense ? 4 : 8) * desktopScale),
              },
              { backgroundColor: tile.background },
              {
                opacity: tileAnimations[index],
                transform: [
                  {
                    translateY: tileAnimations[index].interpolate({
                      inputRange: [0, 1],
                      outputRange: [18, 0],
                    }),
                  },
                  {
                    scale: tileAnimations[index].interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.94, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            {!!item.emoji && <Text style={[styles.statEmoji, dense && styles.statEmojiCompact]}>{item.emoji}</Text>}
            <View style={styles.statCopy}>
              <Text style={[styles.statLabel, dense && styles.statLabelCompact, { color: tile.label }]} numberOfLines={1} adjustsFontSizeToFit>
                {item.label}
              </Text>
              <Text style={[styles.statValue, dense && styles.statValueCompact, { color: tile.ink }]} numberOfLines={1} adjustsFontSizeToFit>
                {getNumericStatValue(item.value) !== null ? (displayedValues[index] ?? 0) : item.value}
              </Text>
            </View>
          </Animated.View>
        );
      })}
    </View>
  );
}

export function SessionResultActions({
  colors,
  isDarkMode,
  primaryLabel,
  onPrimary,
  primaryDisabled = false,
  secondaryLabel,
  onSecondary,
  forceDense = false,
}: SessionResultActionsProps) {
  const { width, height } = useWindowDimensions();
  const desktopScale = useDesktopTypographyScale();
  const hasSecondary = !!secondaryLabel && !!onSecondary;
  const { dense } = getSheetDensity(width, height, desktopScale, forceDense);

  return (
    <View style={[
      styles.actions,
      hasSecondary && styles.actionsSplit,
      desktopScale > 1 && hasSecondary && { gap: Math.round(12 * desktopScale) },
    ]}>
      {hasSecondary && (
        <Pressable
          onPress={onSecondary}
          accessibilityRole="button"
          accessibilityLabel={secondaryLabel}
          style={({ pressed }) => [
            styles.action,
            dense && styles.actionCompact,
            desktopScale > 1 && {
              minHeight: Math.round((dense ? 52 : 62) * desktopScale),
              borderRadius: Math.round((dense ? 16 : 18) * desktopScale),
              paddingHorizontal: Math.round((dense ? 16 : 20) * desktopScale),
            },
            styles.secondaryAction,
            styles.actionFlexible,
            {
              backgroundColor: isDarkMode ? colors.surfaceAlt : colors.card,
              borderColor: colors.borderStrong,
              opacity: pressed ? 0.78 : 1,
            },
            Platform.OS === 'web' && ({ cursor: 'pointer' } as ViewStyle),
          ]}
        >
          <Text style={[styles.secondaryActionText, { color: colors.text }]}>{secondaryLabel}</Text>
        </Pressable>
      )}

      <Pressable
        onPress={onPrimary}
        disabled={primaryDisabled}
        accessibilityRole="button"
        accessibilityLabel={primaryLabel}
        accessibilityState={{ disabled: primaryDisabled }}
        style={({ pressed }) => [
          styles.action,
          dense && styles.actionCompact,
          desktopScale > 1 && {
            minHeight: Math.round((dense ? 52 : 62) * desktopScale),
            borderRadius: Math.round((dense ? 16 : 18) * desktopScale),
            paddingHorizontal: Math.round((dense ? 16 : 20) * desktopScale),
          },
          hasSecondary ? styles.actionFlexible : styles.actionFull,
          {
            backgroundColor: colors.buttonBackground ?? colors.primary,
            boxShadow: `0px ${pressed ? 1 : 4}px 0 ${isDarkMode ? '#08131F' : colors.borderStrong}`,
            opacity: primaryDisabled ? 0.64 : pressed ? 0.86 : 1,
            transform: [{ translateY: pressed ? 3 : 0 }],
          } as ViewStyle,
          Platform.OS === 'web' && ({ cursor: primaryDisabled ? 'default' : 'pointer' } as ViewStyle),
        ]}
      >
        <Text style={[styles.primaryActionText, { color: colors.buttonText }]}>{primaryLabel}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    maxWidth: 570,
    minHeight: 760,
    borderRadius: 24,
    paddingHorizontal: 36,
    paddingTop: 28,
    paddingBottom: 36,
    overflow: 'hidden',
  },
  cardContentSized: {
    minHeight: 0,
  },
  cardCompact: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 18,
  },
  cardVeryShort: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 14,
  },
  sectionLabelRow: {
    minHeight: 38,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: -10,
    marginBottom: 12,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: freshFontFamily.bold,
  },
  sectionLabelRowCompact: {
    minHeight: 30,
    marginBottom: 6,
  },
  hero: {
    minHeight: 122,
    paddingHorizontal: 24,
    paddingVertical: 24,
    borderRadius: 20,
    borderWidth: 3,
    overflow: 'hidden',
    // boxShadow only, no elevation: this card fades/scales in, and Android composites a
    // native elevation shadow separately from the view, so mid-fade it showed through the
    // half-transparent card as a grey plate with a hard edge. boxShadow fades with it.
    boxShadow: '0px 6px 16px rgba(0,0,0,0.15)',
  },
  heroCompact: {
    minHeight: 92,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  heroVeryShort: {
    minHeight: 82,
    paddingVertical: 9,
  },
  orbit: {
    position: 'absolute',
    opacity: 0.1,
  },
  orbitLarge: {
    width: 126,
    height: 126,
    borderRadius: 63,
    borderWidth: 22,
    right: -42,
    top: -38,
  },
  orbitSmall: {
    width: 18,
    height: 18,
    borderRadius: 9,
    left: 18,
    bottom: 14,
  },
  sparkle: {
    position: 'absolute',
    fontSize: 15,
  },
  sparkleOne: {
    top: 10,
    left: 78,
  },
  sparkleTwo: {
    top: 30,
    right: 20,
  },
  sparkleThree: {
    bottom: 12,
    right: 26,
    fontSize: 12,
  },
  eyebrow: {
    fontSize: 10.5,
    lineHeight: 13,
    fontWeight: freshFontFamily.extrabold,
    letterSpacing: 1.3,
    textTransform: 'uppercase',
    opacity: 0.9,
  },
  heroMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  visual: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  visualCompact: {
    width: 54,
    height: 54,
    borderRadius: 17,
  },
  heroImage: {
    width: 58,
    height: 58,
  },
  heroImageCompact: {
    width: 50,
    height: 50,
  },
  heroEmoji: {
    fontSize: 46,
    lineHeight: 54,
  },
  heroEmojiCompact: {
    fontSize: 38,
    lineHeight: 46,
  },
  heroCopy: {
    flex: 1,
    gap: 3,
    alignItems: 'center',
    paddingRight: 34,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 29,
    lineHeight: 34,
    fontWeight: freshFontFamily.extrabold,
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  titleCompact: {
    fontSize: 22,
    lineHeight: 26,
  },
  titleVeryShort: {
    fontSize: 20,
    lineHeight: 24,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: 17,
    lineHeight: 22,
    fontWeight: freshFontFamily.medium,
    textAlign: 'center',
  },
  subtitleCompact: {
    fontSize: 13,
    lineHeight: 17,
  },
  subtitleVeryShort: {
    fontSize: 12,
    lineHeight: 15,
  },
  body: {
    flex: 1,
    paddingTop: 24,
    gap: 24,
  },
  bodyContentSized: {
    flex: 0,
  },
  bodyPortrait: {
    flex: 1,
  },
  bodyCompact: {
    paddingTop: 12,
    gap: 12,
  },
  bodyVeryShort: {
    paddingTop: 9,
    gap: 9,
  },
  stats: {
    flexDirection: 'row',
    gap: 14,
    width: '100%',
  },
  statsGrid: {
    flexWrap: 'wrap',
  },
  stat: {
    minWidth: 0,
    flex: 1,
    minHeight: 126,
    borderRadius: 18,
    paddingVertical: 20,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  statGrid: {
    flexBasis: '46%',
  },
  statCompact: {
    minHeight: 86,
    borderRadius: 14,
    paddingVertical: 10,
    gap: 4,
  },
  statVeryShort: {
    minHeight: 76,
    paddingVertical: 7,
  },
  statEmoji: {
    fontSize: 22,
    lineHeight: 26,
  },
  statEmojiCompact: {
    fontSize: 17,
    lineHeight: 20,
  },
  statCopy: {
    minWidth: 0,
    width: '100%',
    alignItems: 'center',
    gap: 6,
  },
  statValue: {
    fontSize: 30,
    lineHeight: 34,
    fontWeight: freshFontFamily.extrabold,
    letterSpacing: -0.5,
  },
  statValueCompact: {
    fontSize: 22,
    lineHeight: 26,
  },
  statLabel: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: freshFontFamily.bold,
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  statLabelCompact: {
    fontSize: 9,
    lineHeight: 11,
    letterSpacing: 0.45,
  },
  actions: {
    width: '100%',
  },
  actionsSplit: {
    flexDirection: 'row',
    gap: 12,
  },
  action: {
    minHeight: 62,
    borderRadius: 18,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  actionCompact: {
    minHeight: 52,
    borderRadius: 16,
    paddingHorizontal: 16,
  },
  actionFlexible: {
    flex: 1,
  },
  actionFull: {
    width: '100%',
  },
  secondaryAction: {
    borderWidth: 2,
  },
  primaryActionText: {
    fontSize: 18,
    fontWeight: freshFontFamily.bold,
    textAlign: 'center',
  },
  secondaryActionText: {
    fontSize: 17,
    fontWeight: freshFontFamily.bold,
    textAlign: 'center',
  },
});
