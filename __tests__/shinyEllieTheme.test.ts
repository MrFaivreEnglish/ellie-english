import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ThemeColors } from '../features/settings/ThemeContext';
import { APP_LIGHT_COLORWAYS } from '../features/shared/freshDirection';
import {
  DEFAULT_SPLASH_BACKGROUND,
  getSplashBackground,
  getSplashCopy,
  SHINY_SPLASH_BACKGROUND,
} from '../features/shared/homeMenuColors';
import { getGrammarGameColors, getPixelSurfaceStyle } from '../features/shared/uiPrimitives';
import { getVocabularySelectionCardHeight } from '../features/vocabulary/vocabularySelectionCardLayout';
import {
  getShinyEllieProgress,
  mergeShinyEllieCloudItems,
  SHINY_ELLIE_COLOR_VARIANT_KEY,
  SHINY_ELLIE_MODE_KEY,
  SHINY_ELLIE_PRESENTATION_MODE_KEY,
  SHINY_ELLIE_UNLOCKED_KEY,
} from '../features/progress/shinyEllieStorage';

jest.mock('../features/account/accountStorage', () => ({
  syncProgressItemToCloudIfSignedIn: jest.fn(() => Promise.resolve()),
}));

const store: Record<string, string> = {};

beforeEach(() => {
  for (const key of Object.keys(store)) delete store[key];

  jest.mocked(AsyncStorage.getItem).mockImplementation((key: string) =>
    Promise.resolve(store[key] ?? null)
  );
  jest.mocked(AsyncStorage.setItem).mockImplementation((key: string, value: string) => {
    store[key] = value;
    return Promise.resolve();
  });
});

describe('Shiny Ellie appearance preferences', () => {
  it('keeps both cool blue and warm beige palettes available', () => {
    expect(APP_LIGHT_COLORWAYS.standard.background).toBe('#F1F5FE');
    expect(APP_LIGHT_COLORWAYS.standard.border).toBe('#D7DEEB');
    expect(APP_LIGHT_COLORWAYS.shinyEllie.background).toBe('#FFF7EC');
    expect(APP_LIGHT_COLORWAYS.shinyEllie.border).toBe('#E6DED3');
  });

  it('keeps the Shiny Ellie splash gold for every style and palette combination', () => {
    for (const mode of [false, true]) {
      for (const colorVariant of ['cool', 'warm']) {
        expect({
          mode,
          colorVariant,
          background: getSplashBackground(true),
        }).toEqual({
          mode,
          colorVariant,
          background: SHINY_SPLASH_BACKGROUND,
        });
      }
    }

    expect(getSplashBackground(false)).toBe(DEFAULT_SPLASH_BACKGROUND);
    expect(getSplashCopy(true)).toEqual({
      title: 'Shiny Ellie',
      subtitle: 'A Shiny Ellie appeared!',
    });
    expect(getSplashCopy(false)).toEqual({
      title: 'Ellie',
      subtitle: 'My English Assistant',
    });
  });

  it('keeps Vocabulary selection cards the same size in Normal and Pixel styles', () => {
    const layouts = [
      { cardView: 'list' as const, compactTile: false, expectedHeight: 124 },
      { cardView: 'tile' as const, compactTile: true, expectedHeight: 168 },
      { cardView: 'tile' as const, compactTile: false, expectedHeight: 194 },
    ];

    for (const layout of layouts) {
      const normalHeight = getVocabularySelectionCardHeight(layout.cardView, layout.compactTile, 'normal');
      const pixelHeight = getVocabularySelectionCardHeight(layout.cardView, layout.compactTile, 'pixel');
      expect(normalHeight).toBe(layout.expectedHeight);
      expect(pixelHeight).toBe(normalHeight);
    }
  });

  it('uses square borders and a hard, blur-free shadow only for Pixel style', () => {
    const pixelColors = {
      visualStyle: 'pixel',
      borderStrong: '#005EB3',
      shadow: '#CBD3E0',
    } as ThemeColors;
    const normalColors = { ...pixelColors, visualStyle: 'normal' } as ThemeColors;

    expect(getPixelSurfaceStyle(pixelColors, false, 'raised')).toMatchObject({
      borderRadius: 2,
      borderWidth: 2,
      boxShadow: '4px 4px 0 #CBD3E0',
    });
    expect(getPixelSurfaceStyle(normalColors, false, 'raised')).toEqual({});
  });

  it('applies the active neutral palette throughout Grammar exercises', () => {
    const grammarColorsFor = (colorway: typeof APP_LIGHT_COLORWAYS.standard | typeof APP_LIGHT_COLORWAYS.shinyEllie) =>
      getGrammarGameColors({
        card: '#FFFFFF',
        surfaceAlt: colorway.surfaceAlt,
        exerciseSurface: colorway.exerciseSurface,
        text: colorway.text,
        secondaryText: colorway.secondaryText,
        border: colorway.border,
        shadow: colorway.cardShadow,
        progressTrack: colorway.progressTrack,
        primary: '#0D7DD4',
        primarySoft: '#DBEAFE',
        borderStrong: '#005EB3',
        buttonBackground: '#0D7DD4',
        buttonText: '#FFFFFF',
      } as ThemeColors, false);

    const standard = grammarColorsFor(APP_LIGHT_COLORWAYS.standard);
    const shiny = grammarColorsFor(APP_LIGHT_COLORWAYS.shinyEllie);

    expect(standard.answerSurface).toBe('#FFFFFF');
    expect(standard.checkButtonBg).toBe('#0D7DD4');
    expect(standard.correctSurface).toBe('#22C55E');
    expect(standard.correctBorder).toBe('#16A34A');
    expect(standard.correctBottom).toBe('#15803D');
    expect(standard.correctText).toBe('#FFFFFF');
    expect(standard.feedbackSurface).toBe('#22C55E');
    expect(standard.feedbackBorder).toBe('#16A34A');
    expect(standard.feedbackText).toBe('#FFFFFF');
    expect(standard.answerBorder).toBe('#D7DEEB');
    expect(standard.wordBankSurface).toBe('#E8EEF8');
    expect(standard.progressTrack).toBe('#D7DEEB');
    expect(shiny.answerSurface).toBe('#FFFFFF');
    expect(shiny.answerBorder).toBe('#E6DED3');
    expect(shiny.wordBankSurface).toBe('#F2EAE0');
    expect(shiny.progressTrack).toBe('#E8E0D5');
  });

  it('defaults an unlocked legacy profile to Shiny + Pixel + Warm', async () => {
    store[SHINY_ELLIE_UNLOCKED_KEY] = 'true';

    await expect(getShinyEllieProgress()).resolves.toEqual({
      unlocked: true,
      mode: true,
      colorVariant: 'warm',
      presentationMode: true,
    });
  });

  it('preserves independent Normal presentation + Normal visual style + Cool palette choices', async () => {
    store[SHINY_ELLIE_UNLOCKED_KEY] = 'true';
    store[SHINY_ELLIE_MODE_KEY] = 'false';
    store[SHINY_ELLIE_COLOR_VARIANT_KEY] = 'cool';
    store[SHINY_ELLIE_PRESENTATION_MODE_KEY] = 'false';

    await expect(getShinyEllieProgress()).resolves.toEqual({
      unlocked: true,
      mode: false,
      colorVariant: 'cool',
      presentationMode: false,
    });
  });

  it('never enables Pixel mode while the achievement is locked', async () => {
    store[SHINY_ELLIE_UNLOCKED_KEY] = 'false';
    store[SHINY_ELLIE_MODE_KEY] = 'true';

    await expect(getShinyEllieProgress()).resolves.toEqual({
      unlocked: false,
      mode: false,
      colorVariant: 'cool',
      presentationMode: false,
    });
  });

  it('defaults a legacy unlocked cloud achievement to Shiny + Pixel + Warm', async () => {
    const progress = await mergeShinyEllieCloudItems([
      {
        type: 'achievement',
        itemKey: 'shiny_ellie',
        value: { unlocked: true },
      },
    ]);

    expect(progress).toEqual({ unlocked: true, mode: true, colorVariant: 'warm', presentationMode: true });
    expect(store[SHINY_ELLIE_MODE_KEY]).toBe('true');
    expect(store[SHINY_ELLIE_COLOR_VARIANT_KEY]).toBe('warm');
    expect(store[SHINY_ELLIE_PRESENTATION_MODE_KEY]).toBe('true');
  });

  it('keeps Shiny Ellie locked when a cloud record has no discovery flag', async () => {
    const progress = await mergeShinyEllieCloudItems([
      {
        type: 'achievement',
        itemKey: 'shiny_ellie',
        value: {},
      },
    ]);

    expect(progress).toEqual({ unlocked: false, mode: false, colorVariant: 'cool', presentationMode: false });
    expect(store[SHINY_ELLIE_UNLOCKED_KEY]).toBe('false');
  });

  it('round-trips Normal presentation + Pixel + Cool from cloud independently', async () => {
    const progress = await mergeShinyEllieCloudItems([
      {
        type: 'achievement',
        itemKey: 'shiny_ellie',
        value: { unlocked: true, mode: true, colorVariant: 'cool', presentationMode: false },
      },
    ]);

    expect(progress).toEqual({ unlocked: true, mode: true, colorVariant: 'cool', presentationMode: false });
    expect(store[SHINY_ELLIE_MODE_KEY]).toBe('true');
    expect(store[SHINY_ELLIE_COLOR_VARIANT_KEY]).toBe('cool');
    expect(store[SHINY_ELLIE_PRESENTATION_MODE_KEY]).toBe('false');
  });
});
