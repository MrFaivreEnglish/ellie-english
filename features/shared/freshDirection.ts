// "Fresh Direction" design tokens — single source of truth for the visual
// redesign spec (see project README handoff doc). Every hex value here is a
// precise sRGB conversion of the spec's oklch() source value (Björn
// Ottosson's OKLab matrices), not an eyeballed approximation — keep it that
// way when adding new tokens: convert from the oklch source, don't guess.
import { Platform, type ViewStyle } from 'react-native';

// ---------------------------------------------------------------------------
// Color — oklch() source values are noted in comments for future edits.
// ---------------------------------------------------------------------------
export const FRESH_COLORS = {
  // Surfaces
  pageBackground: '#F9F5EB', // oklch(0.97 0.014 90)
  pageBackgroundOuter: '#F7F2E3', // oklch(0.96 0.02 90) — desk bg, prototypes only
  cardSurface: '#FFFDF9', // oklch(0.995 0.006 90)
  hairline: '#E3DECF', // oklch(0.9 0.02 90)
  divider: '#EAE8E0', // oklch(0.93 0.01 90)

  // Ink
  inkPrimary: '#1E1A10', // oklch(0.22 0.02 90)
  inkSecondary: '#686357', // oklch(0.5 0.02 90)
  inkTertiary: '#767165', // oklch(0.55-0.62 0.02 90), low end
  inkTertiaryHi: '#8B8679', // high end

  // Primary blue
  primaryBlue: '#0D7DD4', // oklch(0.58 0.16 250)
  primaryBluePressed: '#0055A9', // oklch(0.45 0.16 250)
  primaryBlueShadow: '#005EB3', // same hue, L-0.10 (hard-offset shade)

  // Exercise blue (quiz/fill/reorder/translate chrome)
  exerciseBlue: '#4AA3D2', // oklch(0.68 0.11 235)
  exerciseBlueLabel: '#007CB7', // oklch(0.55 0.14 235)
  exerciseBlueTint: '#D6ECF9', // oklch(0.93 0.03 235)
  exerciseBlueShadow: '#2584B2', // L-0.10

  // Vocabulary coral
  vocabCoralSolid: '#CA5747', // oklch(0.6 0.15 30)
  vocabCoralShadow: '#A8372A', // L-0.10
  vocabCoralChipFill: '#FFEDEA', // oklch(0.96 0.02 30)
  vocabCoralChipBorder: '#F8D5CF', // oklch(0.9 0.04 30)
  vocabCoralChipText: '#562E27', // oklch(0.35 0.06 30)

  // Grammar lavender (chips)
  grammarLavenderFill: '#EBF2FF', // oklch(0.96 0.02 265)
  grammarLavenderBorder: '#D1DEF9', // oklch(0.9 0.04 265)
  grammarLavenderText: '#2A4072', // oklch(0.38 0.09 265)

  // Streak / danger / hearts
  streakDanger: '#D64938', // oklch(0.6 0.18 30)
  streakDangerShadow: '#B32517', // L-0.10
  heartFilled: '#CC272E', // oklch(0.55 0.2 25)
  heartEmpty: '#D0CEC7', // oklch(0.85 0.01 90)

  // Goal card purple
  goalCardPurple: '#7541B8', // oklch(0.5 0.18 300)
  goalCardPurpleShadow: '#591F97', // L-0.10

  // Home category tiles
  tileGrammar: '#73A9E1', // oklch(0.72 0.1 250)
  tileGrammarShadow: '#558AC0',
  tileVocabulary: '#66C4BE', // oklch(0.76 0.09 190)
  tileVocabularyShadow: '#44A49E',
  tileChapters: '#D8A4CC', // oklch(0.78 0.08 335)
  tileChaptersShadow: '#B886AC',
  tileSettings: '#A8AFB8', // oklch(0.75 0.015 255)
  tileSettingsShadow: '#899098',

  // Shadow offset shades for neutral surfaces
  whiteCardShadow: '#E3DECF', // oklch(0.9 0.02 90)
  pillWarmShadow: '#D5CDB8', // oklch(0.85 0.03 90)
  progressTodo: '#DCD7C9', // oklch(0.88 0.02 90)
} as const;

// Chapter level colors — each level gets: solid, shadow (hard-offset, L-0.10),
// border (expanded-panel border, L 0.8), wash (expanded-panel bg, L 0.965 /
// C~0.015), tint (chapter badge / "Open chapter" pill bg, L 0.97), textDark
// (that pill's text, L 0.42-0.45).
export const CHAPTER_LEVEL_COLORS = {
  '6e': {
    solid: '#EB9191', shadow: '#C97273', border: '#EBAAA9',
    wash: '#FEF0EF', tint: '#FFE7E6', textDark: '#822A30',
  },
  '5e': {
    solid: '#CB9FD5', shadow: '#AB80B5', border: '#D0B1D7',
    wash: '#F8F0FA', tint: '#FFECFF', textDark: '#64396E',
  },
  '4e': {
    solid: '#A4A2E8', shadow: '#8683C7', border: '#B8B8EA',
    wash: '#F2F2FE', tint: '#F1F1FF', textDark: '#484286',
  },
  '3e': {
    solid: '#80A5E3', shadow: '#6287C2', border: '#A4BFEB',
    wash: '#EEF4FE', tint: '#E2F7FF', textDark: '#274B88',
  },
  '3A': {
    solid: '#6FB789', shadow: '#50986B', border: '#9ACCAA',
    wash: '#ECF7EF', tint: '#DCFFE7', textDark: '#005E31',
  },
  irregular: {
    solid: '#6EB1BD', shadow: '#4F929D', border: '#9AC7CF',
    wash: '#E9F6F9', tint: '#DBFCFF', textDark: '#005864',
  },
} as const;

// ---------------------------------------------------------------------------
// Dark mode — token-swap per spec §2b: surfaces invert to dark warm
// neutrals, hard-offset shadow survives with a darker-neutral offset instead
// of a lighter one, accent hues keep hue/chroma and gain lightness, tints
// become low-lightness/low-chroma washes.
// ---------------------------------------------------------------------------
export const FRESH_COLORS_DARK = {
  pageBackground: '#070F1C',
  cardSurface: '#0D1A2E',
  hairline: '#16233A',
  divider: '#16233A',

  inkPrimary: '#F5F3EE',
  inkSecondary: '#B8C0CC',
  inkTertiary: '#8B96A6',

  primaryBlue: '#5AA8F5',
  primaryBluePressed: '#3D8FE0',
  primaryBlueShadow: '#08131F', // darker-neutral offset, not a lighter blue

  exerciseBlue: '#3FA0DB',
  exerciseBlueLabel: '#7FC4EE',
  exerciseBlueTint: '#12345A',
  exerciseBlueShadow: '#08131F',

  vocabCoralSolid: '#E07A63',
  vocabCoralShadow: '#08131F',
  vocabCoralChipFill: '#3D1E14',
  vocabCoralChipBorder: '#5A3226',
  vocabCoralChipText: '#FFDCD2',

  grammarLavenderFill: '#1B2440',
  grammarLavenderBorder: '#2E3D66',
  grammarLavenderText: '#B7CBFF',

  streakDanger: '#E8604C',
  heartFilled: '#E8524F',
  heartEmpty: '#2A3B58',

  goalCardPurple: '#9A6BDB',
  goalCardPurpleShadow: '#08131F',

  tileGrammar: '#4E86C4',
  tileGrammarShadow: '#08131F',
  tileVocabulary: '#3FA398',
  tileVocabularyShadow: '#08131F',
  tileChapters: '#B87DAB',
  tileChaptersShadow: '#08131F',
  tileSettings: '#6E7C8E',
  tileSettingsShadow: '#08131F',

  whiteCardShadow: '#08131F',
  pillWarmShadow: '#08131F',
  progressTodo: '#16233A',
} as const;

// ---------------------------------------------------------------------------
// Type — system default font (no custom family loaded), weights only.
// Kept as `freshFontFamily` for call-site compatibility even though it now
// holds `fontWeight` values, not family names — spread as
// `{ fontWeight: freshFontFamily.extrabold }` at each call site.
// ---------------------------------------------------------------------------
export const freshFontFamily = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
} as const;

export type FreshFontWeight = keyof typeof freshFontFamily;

// Type scale from spec §1 (size/weight pairs). Values are the RN style
// fragment — spread into a component's text style.
export const freshType = {
  screenTitle: { fontWeight: freshFontFamily.extrabold, fontSize: 29 },
  cardTitle: { fontWeight: freshFontFamily.extrabold, fontSize: 17 },
  questionText: { fontWeight: freshFontFamily.extrabold, fontSize: 26 },
  body: { fontWeight: freshFontFamily.semibold, fontSize: 14 },
  bodyBold: { fontWeight: freshFontFamily.bold, fontSize: 14 },
  meta: { fontWeight: freshFontFamily.semibold, fontSize: 12.5 },
  overline: {
    fontWeight: freshFontFamily.bold,
    fontSize: 10.5,
    letterSpacing: 0.7, // ~0.06em at 11px
    textTransform: 'uppercase' as const,
  },
} as const;

// ---------------------------------------------------------------------------
// Radii
// ---------------------------------------------------------------------------
export const freshRadii = {
  pill: 999,
  card: 15,
  largeTile: 19,
  iconButton: 11,
  chapterBadge: 11,
} as const;

// ---------------------------------------------------------------------------
// Spacing
// ---------------------------------------------------------------------------
export const freshSpacing = {
  gutterPhone: 22,
  gutterDesktop: 36,
  rhythm: [10, 12, 14, 18, 22, 26] as const,
  exerciseMaxWidth: 640,
};

// ---------------------------------------------------------------------------
// Shadows — "hard offset + soft ambient". RN 0.83 (New Architecture) and
// react-native-web both accept a CSS-syntax `boxShadow` string, so we can
// express the spec's two-part recipe exactly instead of approximating it
// with a single native shadow + colored border.
// ---------------------------------------------------------------------------
const rgba = (hex: string, alpha: number) => {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
};

/** White card: 2px 3px 0 hairline, 0 4px 12px rgba(0,0,0,0.04) */
export const freshCardShadow = (isDarkMode: boolean, pressed = false): ViewStyle => {
  const offset = isDarkMode ? FRESH_COLORS_DARK.whiteCardShadow : FRESH_COLORS.whiteCardShadow;
  const hard = pressed ? '1px 2px 0' : '2px 3px 0';
  const ambientAlpha = isDarkMode ? 0.28 : 0.04;
  return { boxShadow: `${hard} ${offset}, 0px 4px 12px ${rgba('#000000', ambientAlpha)}` } as ViewStyle;
};

/** White card / control pill sitting on the warm page ground. */
export const freshPillShadow = (isDarkMode: boolean, pressed = false): ViewStyle => {
  const offset = isDarkMode ? FRESH_COLORS_DARK.pillWarmShadow : FRESH_COLORS.pillWarmShadow;
  const hard = pressed ? '1px 2px 0' : '2px 3px 0';
  const ambientAlpha = isDarkMode ? 0.3 : 0.05;
  return { boxShadow: `${hard} ${offset}, 0px 4px 12px ${rgba('#000000', ambientAlpha)}` } as ViewStyle;
};

/** Colored tile/card: 2px 3px 0 <same hue, L-0.10>, 0 4px 12px rgba(0,0,0,0.05). Large tiles use 2px 4px 0. */
export const freshTileShadow = (shadowHex: string, large = false, pressed = false): ViewStyle => {
  const hard = pressed ? '1px 2px 0' : large ? '2px 4px 0' : '2px 3px 0';
  return { boxShadow: `${hard} ${shadowHex}, 0px 4px 12px ${rgba('#000000', 0.05)}` } as ViewStyle;
};

/** Small colored pill (streak badge, level badge): 1px 1px 0 <darker hue>, 0 4px 12px rgba(0,0,0,0.05) */
export const freshSmallPillShadow = (shadowHex: string): ViewStyle =>
  ({ boxShadow: `1px 1px 0 ${shadowHex}, 0px 4px 12px ${rgba('#000000', 0.05)}` } as ViewStyle);

/** Primary CTA glow — no hard offset. */
export const freshGlowShadow = (glowHex: string = FRESH_COLORS.exerciseBlue): ViewStyle =>
  ({ boxShadow: `0px 6px 14px ${rgba(glowHex, 0.3)}` } as ViewStyle);

// ---------------------------------------------------------------------------
// Interaction rules (§3): card/tile press = translate 1px toward the shadow
// + shrink the hard offset. Spread onto a Pressable's style callback.
// ---------------------------------------------------------------------------
export const freshPressTransform = (pressed: boolean): ViewStyle =>
  pressed ? { transform: [{ translateX: 1 }, { translateY: 1 }] } : {};

export const freshTransition = Platform.OS === 'web' ? { transitionDuration: '140ms', transitionTimingFunction: 'ease-out' } : {};
