import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance, Platform, useColorScheme } from 'react-native';
import { hapticsAreSupported, setHapticsEnabled } from '../shared/haptics';
import { setSoundEffectsEnabled } from '../shared/soundEffects';
import {
  saveShinyEllieProgress,
  SHINY_ELLIE_COLOR_VARIANT_KEY,
  SHINY_ELLIE_MODE_KEY,
  SHINY_ELLIE_PRESENTATION_MODE_KEY,
  SHINY_ELLIE_UNLOCKED_KEY,
  type ShinyEllieColorVariant,
} from '../progress/shinyEllieStorage';
import { ENABLE_SHINY_ELLIE_COLOR_MODE } from '../../lib/featureFlags';
import { DESIGN_ACCENTS } from '../shared/uiPrimitives';
import { APP_LIGHT_COLORWAYS, FRESH_COLORS } from '../shared/freshDirection';
import {
  ANDROID_STATUS_BAR_ENABLED_KEY,
  GRAMMAR_GAME_MODE_KEY,
  GRAMMAR_SPEECH_ENABLED_KEY,
  HAPTICS_ENABLED_KEY,
  SOUND_EFFECTS_ENABLED_KEY,
  REDUCE_ANIMATIONS_KEY,
  THEME_STORAGE_KEY,
  TODAY_CARD_ENABLED_KEY,
  TODAY_CARD_OPT_IN_KEY,
  TYPING_STRICT_MODE_KEY,
  VOCAB_LESSON_CARD_VIEW_KEY,
  VOCAB_TIMER_MODE_KEY,
  VOCAB_TIMER_RECORD_SAVING_KEY,
  VOCAB_AUDIO_MATCH_MODE_KEY,
  WEB_HAPTICS_RESTORED_KEY,
  syncAccountPreferencesToCloudIfSignedIn,
  type AccountPreferenceSnapshot,
} from '../account/accountPreferencesStorage';

const TEXT_SIZE_LEVEL_KEY = '@text_size_level';

export type TextSizeLevel = 'normal' | 'large' | 'xlarge';






export const TEXT_SCALE_BY_LEVEL: Record<TextSizeLevel, number> = {
  normal: 1,
  large: 1.15,
  xlarge: 1.3,
};

export type ThemeColors = {
  visualStyle: 'normal' | 'pixel';
  background: string;
  card: string;
  surface: string;
  surfaceAlt: string;
  exerciseSurface: string;
  text: string;
  secondaryText: string;
  border: string;
  borderStrong: string;
  shadow: string;
  progressTrack: string;
  primary: string;
  primarySoft: string;
  success: string;
  successSoft: string;
  successText: string;
  danger: string;
  dangerSoft: string;
  dangerText: string;
  warning: string;
  warningSoft: string;
  buttonBackground: string;
  buttonText: string;
};

type ThemeContextType = {
  isDarkMode: boolean;
  colors: ThemeColors;
  toggleTheme: () => void;
  textSizeLevel: TextSizeLevel;
  textScale: number;
  updateTextSizeLevel: (level: TextSizeLevel) => void;
  isGrammarGameMode: boolean;
  toggleGrammarGameMode: () => void;
  updateGrammarGameMode: (value: boolean) => void;
  isGrammarSpeechEnabled: boolean;
  toggleGrammarSpeech: () => void;
  updateGrammarSpeech: (value: boolean) => void;
  isVocabTimerMode: boolean;
  toggleVocabTimerMode: () => void;
  updateVocabTimerMode: (value: boolean) => void;
  isVocabTimerRecordSavingEnabled: boolean;
  toggleVocabTimerRecordSaving: () => void;
  updateVocabTimerRecordSaving: (value: boolean) => void;
  isVocabAudioMatchMode: boolean;
  toggleVocabAudioMatchMode: () => void;
  updateVocabAudioMatchMode: (value: boolean) => void;
  vocabLessonCardView: 'list' | 'tile';
  updateVocabLessonCardView: (value: 'list' | 'tile') => void;
isTypingStrictMode: boolean;
  toggleTypingStrictMode: () => void;
  updateTypingStrictMode: (value: boolean) => void;
  isHapticsEnabled: boolean;
  toggleHaptics: () => void;
  updateHaptics: (value: boolean) => void;
  isSoundEffectsEnabled: boolean;
  toggleSoundEffects: () => void;
  updateSoundEffects: (value: boolean) => void;
  isReduceAnimationsEnabled: boolean;
  toggleReduceAnimations: () => void;
  isTodayCardEnabled: boolean;
  toggleTodayCard: () => void;
  updateTodayCard: (value: boolean) => void;
  isAndroidStatusBarEnabled: boolean;
  toggleAndroidStatusBar: () => void;
  updateAndroidStatusBar: (value: boolean) => void;
  isShinyEllieUnlocked: boolean;
  isShinyEllieMode: boolean;
  isShinyElliePresentationMode: boolean;
  shinyEllieColorVariant: ShinyEllieColorVariant;
  isWarmColorVariant: boolean;
  unlockShinyEllie: () => void;
  toggleShinyEllieMode: () => void;
  updateShinyEllieMode: (value: boolean) => void;
  updateShinyElliePresentationMode: (value: boolean) => void;
  updateShinyEllieColorVariant: (value: ShinyEllieColorVariant) => void;
  updateShinyEllieProgress: (
    unlocked: boolean,
    mode: boolean,
    colorVariant?: ShinyEllieColorVariant,
    presentationMode?: boolean
  ) => void;
  applyAccountPreferences: (snapshot: AccountPreferenceSnapshot) => void;
};

const lightColors: ThemeColors = {
  visualStyle: 'normal',
  background: FRESH_COLORS.pageBackground,
  card: FRESH_COLORS.cardSurface,
  surface: APP_LIGHT_COLORWAYS.standard.surface,
  surfaceAlt: FRESH_COLORS.surfaceAlt,
  exerciseSurface: APP_LIGHT_COLORWAYS.standard.exerciseSurface,
  text: FRESH_COLORS.inkPrimary,
  secondaryText: FRESH_COLORS.inkSecondary,
  border: FRESH_COLORS.hairline,
  borderStrong: DESIGN_ACCENTS.blue.shadow,
  shadow: FRESH_COLORS.whiteCardShadow,
  progressTrack: FRESH_COLORS.progressTodo,
  primary: DESIGN_ACCENTS.blue.solid,
  primarySoft: DESIGN_ACCENTS.blue.soft,
  success: DESIGN_ACCENTS.teal.solid,
  successSoft: DESIGN_ACCENTS.teal.soft,
  successText: '#0B5B52',
  danger: DESIGN_ACCENTS.coral.solid,
  dangerSoft: DESIGN_ACCENTS.coral.soft,
  dangerText: '#7A2E1C',
  warning: '#F4B740',
  warningSoft: '#FFF6DE',
  buttonBackground: DESIGN_ACCENTS.blue.solid,
  buttonText: '#ffffff',
};

const shinyEllieLightColors: ThemeColors = {
  ...lightColors,
  background: APP_LIGHT_COLORWAYS.shinyEllie.background,
  surface: APP_LIGHT_COLORWAYS.shinyEllie.surface,
  surfaceAlt: APP_LIGHT_COLORWAYS.shinyEllie.surfaceAlt,
  exerciseSurface: APP_LIGHT_COLORWAYS.shinyEllie.exerciseSurface,
  text: APP_LIGHT_COLORWAYS.shinyEllie.text,
  secondaryText: APP_LIGHT_COLORWAYS.shinyEllie.secondaryText,
  border: APP_LIGHT_COLORWAYS.shinyEllie.border,
  shadow: APP_LIGHT_COLORWAYS.shinyEllie.cardShadow,
  progressTrack: APP_LIGHT_COLORWAYS.shinyEllie.progressTrack,
};

const darkColors: ThemeColors = {
  visualStyle: 'normal',
  background: '#070F1C',
  card: '#0D1A28',
  surface: '#162436',
  surfaceAlt: '#1E3450',
  exerciseSurface: '#0A1526',
  text: '#F7FAFF',
  secondaryText: '#C8D5EA',
  border: '#334D68',
  borderStrong: '#7BAAFB',
  shadow: '#08131F',
  progressTrack: '#16233A',
  primary: '#7BAAFB',
  primarySoft: DESIGN_ACCENTS.blue.softDark,
  success: '#4FD9C4',
  successSoft: DESIGN_ACCENTS.teal.softDark,
  successText: '#E9FFFC',
  danger: '#FF9478',
  dangerSoft: DESIGN_ACCENTS.coral.softDark,
  dangerText: '#FFEDE7',
  warning: '#FFD166',
  warningSoft: DESIGN_ACCENTS.amber.softDark,
  buttonBackground: '#5AA8F5',
  buttonText: '#FFFFFF',
};

const warmDarkColors: ThemeColors = {
  ...darkColors,
  background: '#1A130D',
  card: '#241A12',
  surface: '#302318',
  surfaceAlt: '#3B2B1E',
  exerciseSurface: '#17100B',
  text: '#FFF7EC',
  secondaryText: '#D9C8B2',
  border: '#5A4633',
  borderStrong: '#E3A94E',
  shadow: '#080503',
  progressTrack: '#3B2C20',
};

export const ThemeContext = createContext<ThemeContextType>({
  isDarkMode: false,
  colors: lightColors,
  toggleTheme: () => {},
  textSizeLevel: 'normal',
  textScale: 1,
  updateTextSizeLevel: () => {},
  isGrammarGameMode: false,
  toggleGrammarGameMode: () => {},
  updateGrammarGameMode: () => {},
  isGrammarSpeechEnabled: false,
  toggleGrammarSpeech: () => {},
  updateGrammarSpeech: () => {},
  isVocabTimerMode: false,
  toggleVocabTimerMode: () => {},
  updateVocabTimerMode: () => {},
  isVocabTimerRecordSavingEnabled: false,
  toggleVocabTimerRecordSaving: () => {},
  updateVocabTimerRecordSaving: () => {},
  isVocabAudioMatchMode: false,
  toggleVocabAudioMatchMode: () => {},
  updateVocabAudioMatchMode: () => {},
  vocabLessonCardView: 'list',
  updateVocabLessonCardView: () => {},
isTypingStrictMode: false,
  toggleTypingStrictMode: () => {},
  updateTypingStrictMode: () => {},
  isHapticsEnabled: hapticsAreSupported,
  toggleHaptics: () => {},
  updateHaptics: () => {},
  isSoundEffectsEnabled: true,
  toggleSoundEffects: () => {},
  updateSoundEffects: () => {},
  isReduceAnimationsEnabled: false,
  toggleReduceAnimations: () => {},
  isTodayCardEnabled: false,
  toggleTodayCard: () => {},
  updateTodayCard: () => {},
  isAndroidStatusBarEnabled: true,
  toggleAndroidStatusBar: () => {},
  updateAndroidStatusBar: () => {},
  isShinyEllieUnlocked: false,
  isShinyEllieMode: false,
  isShinyElliePresentationMode: false,
  shinyEllieColorVariant: 'cool',
  isWarmColorVariant: false,
  unlockShinyEllie: () => {},
  toggleShinyEllieMode: () => {},
  updateShinyEllieMode: () => {},
  updateShinyElliePresentationMode: () => {},
  updateShinyEllieColorVariant: () => {},
  updateShinyEllieProgress: () => {},
  applyAccountPreferences: () => {},
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const systemColorScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(() => Appearance.getColorScheme() === 'dark');



  const [hasExplicitThemeChoice, setHasExplicitThemeChoice] = useState(false);
  const [isThemeLoaded, setIsThemeLoaded] = useState(false);
  const [textSizeLevel, setTextSizeLevel] = useState<TextSizeLevel>('normal');
  const [isGrammarGameMode, setIsGrammarGameMode] = useState(false);
  const [isGrammarSpeechEnabled, setIsGrammarSpeechEnabled] = useState(false);
  const [isVocabTimerMode, setIsVocabTimerMode] = useState(false);
  const [isVocabTimerRecordSavingEnabled, setIsVocabTimerRecordSavingEnabled] = useState(false);
  const [isVocabAudioMatchMode, setIsVocabAudioMatchMode] = useState(false);
  const [vocabLessonCardView, setVocabLessonCardView] = useState<'list' | 'tile'>('list');
const [isTypingStrictMode, setIsTypingStrictMode] = useState(false);
  const [isHapticsEnabled, setIsHapticsEnabled] = useState(hapticsAreSupported);
  const [isSoundEffectsEnabled, setIsSoundEffectsEnabled] = useState(true);
  const [, setIsReduceAnimationsEnabled] = useState(false);
  const [isTodayCardEnabled, setIsTodayCardEnabled] = useState(false);
  const [isAndroidStatusBarEnabled, setIsAndroidStatusBarEnabled] = useState(true);
  const [isShinyEllieUnlocked, setIsShinyEllieUnlocked] = useState(false);
  const [isShinyEllieMode, setIsShinyEllieMode] = useState(false);
  const [isShinyElliePresentationMode, setIsShinyElliePresentationMode] = useState(false);
  const [shinyEllieColorVariant, setShinyEllieColorVariant] = useState<ShinyEllieColorVariant>('cool');


  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const [
          savedTheme,
          savedGrammarMode,
          savedVocabMode,
          savedVocabTimerRecordSaving,
          savedVocabAudioMatchMode,
          savedVocabLessonCardView,
          savedTypingStrictMode,
          savedHapticsEnabled,
          savedSoundEffectsEnabled,
          savedReduceAnimations,
          savedWebHapticsRestored,
          savedTodayCardEnabled,
          savedTodayCardOptIn,
          savedAndroidStatusBarEnabled,
          savedShinyEllieUnlocked,
          savedShinyEllieMode,
          savedShinyEllieColorVariant,
          savedShinyElliePresentationMode,
          savedGrammarSpeech,
          savedTextSizeLevel,
        ] = await Promise.all([
          AsyncStorage.getItem(THEME_STORAGE_KEY),
          AsyncStorage.getItem(GRAMMAR_GAME_MODE_KEY),
          AsyncStorage.getItem(VOCAB_TIMER_MODE_KEY),
          AsyncStorage.getItem(VOCAB_TIMER_RECORD_SAVING_KEY),
          AsyncStorage.getItem(VOCAB_AUDIO_MATCH_MODE_KEY),
          AsyncStorage.getItem(VOCAB_LESSON_CARD_VIEW_KEY),
          AsyncStorage.getItem(TYPING_STRICT_MODE_KEY),
          AsyncStorage.getItem(HAPTICS_ENABLED_KEY),
          AsyncStorage.getItem(SOUND_EFFECTS_ENABLED_KEY),
          AsyncStorage.getItem(REDUCE_ANIMATIONS_KEY),
          AsyncStorage.getItem(WEB_HAPTICS_RESTORED_KEY),
          AsyncStorage.getItem(TODAY_CARD_ENABLED_KEY),
          AsyncStorage.getItem(TODAY_CARD_OPT_IN_KEY),
          AsyncStorage.getItem(ANDROID_STATUS_BAR_ENABLED_KEY),
          AsyncStorage.getItem(SHINY_ELLIE_UNLOCKED_KEY),
          AsyncStorage.getItem(SHINY_ELLIE_MODE_KEY),
          AsyncStorage.getItem(SHINY_ELLIE_COLOR_VARIANT_KEY),
          AsyncStorage.getItem(SHINY_ELLIE_PRESENTATION_MODE_KEY),
          AsyncStorage.getItem(GRAMMAR_SPEECH_ENABLED_KEY),
          AsyncStorage.getItem(TEXT_SIZE_LEVEL_KEY),
        ]);

        if (savedTheme !== null) {
          setIsDarkMode(savedTheme === 'dark');
          setHasExplicitThemeChoice(true);
        }

        if (savedTextSizeLevel === 'large' || savedTextSizeLevel === 'xlarge') {
          setTextSizeLevel(savedTextSizeLevel);
        }

        if (savedGrammarMode !== null) {
          setIsGrammarGameMode(savedGrammarMode === 'true');
        }

        if (savedGrammarSpeech !== null) {
          setIsGrammarSpeechEnabled(savedGrammarSpeech === 'true');
        }

        if (savedVocabMode !== null) {
          setIsVocabTimerMode(savedVocabMode === 'true');
        }

        if (savedVocabTimerRecordSaving !== null) {
          setIsVocabTimerRecordSavingEnabled(savedVocabTimerRecordSaving === 'true');
        }

        if (savedVocabAudioMatchMode !== null) {
          setIsVocabAudioMatchMode(savedVocabAudioMatchMode === 'true');
        }

        if (savedVocabLessonCardView === 'list' || savedVocabLessonCardView === 'tile') {
          setVocabLessonCardView(savedVocabLessonCardView);
        }

        if (savedTypingStrictMode !== null) {
          setIsTypingStrictMode(savedTypingStrictMode === 'true');
        }

        if (!hapticsAreSupported) {
          setIsHapticsEnabled(false);
          setHapticsEnabled(false);
          if (savedHapticsEnabled !== 'false') {
            AsyncStorage.setItem(HAPTICS_ENABLED_KEY, 'false').catch((error) => {
              console.error('Failed to reset haptics preference:', error);
            });
          }
        } else if (Platform.OS === 'web' && savedWebHapticsRestored !== 'true') {
          setIsHapticsEnabled(true);
          setHapticsEnabled(true);
          AsyncStorage.setItem(HAPTICS_ENABLED_KEY, 'true').catch((error) => {
            console.error('Failed to restore web haptics preference:', error);
          });
          AsyncStorage.setItem(WEB_HAPTICS_RESTORED_KEY, 'true').catch((error) => {
            console.error('Failed to save web haptics migration:', error);
          });
        } else if (savedHapticsEnabled !== null) {
          const enabled = savedHapticsEnabled === 'true';
          setIsHapticsEnabled(enabled);
          setHapticsEnabled(enabled);
        } else {
          setHapticsEnabled(true);
        }

        const nextSoundEffectsEnabled = savedSoundEffectsEnabled !== 'false';
        setIsSoundEffectsEnabled(nextSoundEffectsEnabled);
        setSoundEffectsEnabled(nextSoundEffectsEnabled);
        setIsReduceAnimationsEnabled(savedReduceAnimations === 'true');

        if (savedTodayCardOptIn === 'true' && savedTodayCardEnabled !== null) {
          setIsTodayCardEnabled(savedTodayCardEnabled === 'true');
        }

        if (savedAndroidStatusBarEnabled !== null) {
          setIsAndroidStatusBarEnabled(savedAndroidStatusBarEnabled === 'true');
        }

        const shinyEllieUnlocked = savedShinyEllieUnlocked === 'true';
        const shinyEllieMode = ENABLE_SHINY_ELLIE_COLOR_MODE
          && shinyEllieUnlocked
          && (savedShinyEllieMode === null || savedShinyEllieMode === 'true');
        const nextShinyEllieColorVariant: ShinyEllieColorVariant =
          shinyEllieUnlocked && savedShinyEllieColorVariant !== 'cool' ? 'warm' : 'cool';
        const shinyElliePresentationMode = shinyEllieUnlocked
          && (savedShinyElliePresentationMode === null || savedShinyElliePresentationMode === 'true');
        setIsShinyEllieUnlocked(shinyEllieUnlocked);
        setIsShinyEllieMode(shinyEllieMode);
        setIsShinyElliePresentationMode(shinyElliePresentationMode);
        setShinyEllieColorVariant(nextShinyEllieColorVariant);

        const serializedShinyEllieMode = shinyEllieMode ? 'true' : 'false';
        if (savedShinyEllieMode !== serializedShinyEllieMode) {
          AsyncStorage.setItem(SHINY_ELLIE_MODE_KEY, serializedShinyEllieMode).catch((error) => {
            console.error('Failed to save the default Shiny Ellie mode preference:', error);
          });
        }
        if (savedShinyEllieColorVariant !== nextShinyEllieColorVariant) {
          AsyncStorage.setItem(SHINY_ELLIE_COLOR_VARIANT_KEY, nextShinyEllieColorVariant).catch((error) => {
            console.error('Failed to save the default Shiny Ellie color preference:', error);
          });
        }
        const serializedShinyElliePresentationMode = shinyElliePresentationMode ? 'true' : 'false';
        if (savedShinyElliePresentationMode !== serializedShinyElliePresentationMode) {
          AsyncStorage.setItem(SHINY_ELLIE_PRESENTATION_MODE_KEY, serializedShinyElliePresentationMode).catch((error) => {
            console.error('Failed to save the default Shiny Ellie presentation preference:', error);
          });
        }

        setIsThemeLoaded(true);
      } catch (error) {
        console.error('Failed to load preferences:', error);
        setIsThemeLoaded(true);
      }
    };

    loadPreferences();
  }, []);




  useEffect(() => {
    if (hasExplicitThemeChoice) return;
    if (systemColorScheme == null) return;
    setIsDarkMode(systemColorScheme === 'dark');
  }, [systemColorScheme, hasExplicitThemeChoice]);


  // Best effort: a failed upload here is retried by the account's background sync.
  const syncAccountPreferences = () => {
    syncAccountPreferencesToCloudIfSignedIn().catch(() => {});
  };

  const persistBoolean = async (
    key: string,
    value: boolean,
    options: { syncAccount?: boolean } = {}
  ) => {
    try {
      await AsyncStorage.setItem(key, value ? 'true' : 'false');
      if (options.syncAccount !== false) {
        syncAccountPreferences();
      }
    } catch (error) {
      console.error(`Failed to save preference for ${key}:`, error);
    }
  };

  const persistStringPreference = async (
    key: string,
    value: string,
    options: { syncAccount?: boolean } = {}
  ) => {
    try {
      await AsyncStorage.setItem(key, value);
      if (options.syncAccount !== false) {
        syncAccountPreferences();
      }
    } catch (error) {
      console.error(`Failed to save preference for ${key}:`, error);
    }
  };


  const updateTextSizeLevel = useCallback((level: TextSizeLevel) => {
    setTextSizeLevel(level);
    persistStringPreference(TEXT_SIZE_LEVEL_KEY, level);
  }, []);

  const toggleTheme = useCallback(() => {
    setHasExplicitThemeChoice(true);
    setIsDarkMode(prev => {
      const next = !prev;

      persistStringPreference(THEME_STORAGE_KEY, next ? 'dark' : 'light');
      return next;
    });
  }, []);

  const toggleGrammarGameMode = useCallback(() => {
    setIsGrammarGameMode(prev => {
      const next = !prev;
      persistBoolean(GRAMMAR_GAME_MODE_KEY, next);
      return next;
    });
  }, []);

  const toggleGrammarSpeech = useCallback(() => {
    setIsGrammarSpeechEnabled(prev => {
      const next = !prev;
      persistBoolean(GRAMMAR_SPEECH_ENABLED_KEY, next);
      return next;
    });
  }, []);

  const toggleVocabTimerMode = useCallback(() => {
    setIsVocabTimerMode(prev => {
      const next = !prev;
      persistBoolean(VOCAB_TIMER_MODE_KEY, next);
      return next;
    });
  }, []);

  const updateVocabTimerMode = useCallback((value: boolean) => {
    setIsVocabTimerMode(value);
    persistBoolean(VOCAB_TIMER_MODE_KEY, value);
  }, []);

  const toggleVocabTimerRecordSaving = useCallback(() => {
    setIsVocabTimerRecordSavingEnabled(prev => {
      const next = !prev;
      persistBoolean(VOCAB_TIMER_RECORD_SAVING_KEY, next);
      return next;
    });
  }, []);

  const updateVocabTimerRecordSaving = useCallback((value: boolean) => {
    setIsVocabTimerRecordSavingEnabled(value);
    persistBoolean(VOCAB_TIMER_RECORD_SAVING_KEY, value);
  }, []);

  const toggleVocabAudioMatchMode = useCallback(() => {
    setIsVocabAudioMatchMode(prev => {
      const next = !prev;
      persistBoolean(VOCAB_AUDIO_MATCH_MODE_KEY, next);
      return next;
    });
  }, []);

  const updateVocabAudioMatchMode = useCallback((value: boolean) => {
    setIsVocabAudioMatchMode(value);
    persistBoolean(VOCAB_AUDIO_MATCH_MODE_KEY, value);
  }, []);

  const updateVocabLessonCardView = useCallback((value: 'list' | 'tile') => {
    setVocabLessonCardView(value);
    persistStringPreference(VOCAB_LESSON_CARD_VIEW_KEY, value);
  }, []);

  const toggleTypingStrictMode = useCallback(() => {
    setIsTypingStrictMode(prev => {
      const next = !prev;
      persistBoolean(TYPING_STRICT_MODE_KEY, next);
      return next;
    });
  }, []);

  const updateTypingStrictMode = useCallback((value: boolean) => {
    setIsTypingStrictMode(value);
    persistBoolean(TYPING_STRICT_MODE_KEY, value);
  }, []);

  const toggleHaptics = useCallback(() => {
    if (!hapticsAreSupported) {
      setIsHapticsEnabled(false);
      setHapticsEnabled(false);
      persistBoolean(HAPTICS_ENABLED_KEY, false);
      return;
    }

    setIsHapticsEnabled(prev => {
      const next = !prev;
      setHapticsEnabled(next);
      persistBoolean(HAPTICS_ENABLED_KEY, next);
      return next;
    });
  }, []);

  const updateHaptics = useCallback((value: boolean) => {
    const next = hapticsAreSupported ? value : false;
    setIsHapticsEnabled(next);
    setHapticsEnabled(next);
    persistBoolean(HAPTICS_ENABLED_KEY, next);
  }, []);

  const toggleSoundEffects = useCallback(() => {
    setIsSoundEffectsEnabled(prev => {
      const next = !prev;
      setSoundEffectsEnabled(next);
      persistBoolean(SOUND_EFFECTS_ENABLED_KEY, next);
      return next;
    });
  }, []);

  const updateSoundEffects = useCallback((value: boolean) => {
    setIsSoundEffectsEnabled(value);
    setSoundEffectsEnabled(value);
    persistBoolean(SOUND_EFFECTS_ENABLED_KEY, value);
  }, []);

  const toggleReduceAnimations = useCallback(() => {
    setIsReduceAnimationsEnabled(prev => {
      const next = !prev;
      persistBoolean(REDUCE_ANIMATIONS_KEY, next);
      return next;
    });
  }, []);

  const toggleTodayCard = useCallback(() => {
    setIsTodayCardEnabled(prev => {
      const next = !prev;
      persistBoolean(TODAY_CARD_OPT_IN_KEY, true);
      persistBoolean(TODAY_CARD_ENABLED_KEY, next);
      return next;
    });
  }, []);

  const updateTodayCard = useCallback((value: boolean) => {
    setIsTodayCardEnabled(value);
    persistBoolean(TODAY_CARD_OPT_IN_KEY, true);
    persistBoolean(TODAY_CARD_ENABLED_KEY, value);
  }, []);

  const toggleAndroidStatusBar = useCallback(() => {
    setIsAndroidStatusBarEnabled(prev => {
      const next = !prev;
      persistBoolean(ANDROID_STATUS_BAR_ENABLED_KEY, next);
      return next;
    });
  }, []);

  const updateAndroidStatusBar = useCallback((value: boolean) => {
    setIsAndroidStatusBarEnabled(value);
    persistBoolean(ANDROID_STATUS_BAR_ENABLED_KEY, value);
  }, []);

  const unlockShinyEllie = useCallback(() => {
    const nextMode = ENABLE_SHINY_ELLIE_COLOR_MODE;
    setIsShinyEllieUnlocked(true);
    setIsShinyEllieMode(nextMode);
    setIsShinyElliePresentationMode(true);
    setShinyEllieColorVariant('warm');
    saveShinyEllieProgress({ unlocked: true, mode: nextMode, colorVariant: 'warm', presentationMode: true }).catch((error) => {
      console.error('Failed to save Shiny Ellie progress:', error);
    }).then(syncAccountPreferences);
  }, []);

  const toggleShinyEllieMode = useCallback(() => {
    if (!ENABLE_SHINY_ELLIE_COLOR_MODE || !isShinyEllieUnlocked) {
      setIsShinyEllieMode(false);
      persistBoolean(SHINY_ELLIE_MODE_KEY, false);
      return;
    }

    setIsShinyEllieMode(prev => {
      const next = !prev;
      saveShinyEllieProgress({
        unlocked: isShinyEllieUnlocked,
        mode: next,
        colorVariant: shinyEllieColorVariant,
        presentationMode: isShinyElliePresentationMode,
      }).catch((error) => {
        console.error('Failed to save Shiny Ellie mode:', error);
      }).then(syncAccountPreferences);
      return next;
    });
  }, [isShinyElliePresentationMode, isShinyEllieUnlocked, shinyEllieColorVariant]);

  const updateShinyEllieMode = useCallback((value: boolean) => {
    const next = ENABLE_SHINY_ELLIE_COLOR_MODE && isShinyEllieUnlocked ? value : false;
    setIsShinyEllieMode(next);
    saveShinyEllieProgress({
      unlocked: isShinyEllieUnlocked,
      mode: next,
      colorVariant: shinyEllieColorVariant,
      presentationMode: isShinyElliePresentationMode,
    }).catch((error) => {
      console.error('Failed to save Shiny Ellie mode:', error);
    }).then(syncAccountPreferences);
  }, [isShinyElliePresentationMode, isShinyEllieUnlocked, shinyEllieColorVariant]);

  const updateShinyElliePresentationMode = useCallback((value: boolean) => {
    const next = isShinyEllieUnlocked ? value : false;
    setIsShinyElliePresentationMode(next);
    saveShinyEllieProgress({
      unlocked: isShinyEllieUnlocked,
      mode: isShinyEllieMode,
      colorVariant: shinyEllieColorVariant,
      presentationMode: next,
    }).catch((error) => {
      console.error('Failed to save Shiny Ellie presentation mode:', error);
    }).then(syncAccountPreferences);
  }, [isShinyEllieMode, isShinyEllieUnlocked, shinyEllieColorVariant]);

  const updateShinyEllieColorVariant = useCallback((value: ShinyEllieColorVariant) => {
    const next = isShinyEllieUnlocked ? value : 'cool';
    setShinyEllieColorVariant(next);
    saveShinyEllieProgress({
      unlocked: isShinyEllieUnlocked,
      mode: isShinyEllieMode,
      colorVariant: next,
      presentationMode: isShinyElliePresentationMode,
    }).catch((error) => {
      console.error('Failed to save Shiny Ellie color variant:', error);
    }).then(syncAccountPreferences);
  }, [isShinyEllieMode, isShinyElliePresentationMode, isShinyEllieUnlocked]);

  const updateShinyEllieProgress = useCallback((
    unlocked: boolean,
    mode: boolean,
    colorVariant: ShinyEllieColorVariant = 'warm',
    presentationMode: boolean = true
  ) => {
    const nextMode = unlocked && ENABLE_SHINY_ELLIE_COLOR_MODE ? mode : false;
    const nextColorVariant = unlocked ? colorVariant : 'cool';
    const nextPresentationMode = unlocked ? presentationMode : false;
    setIsShinyEllieUnlocked(unlocked);
    setIsShinyEllieMode(nextMode);
    setIsShinyElliePresentationMode(nextPresentationMode);
    setShinyEllieColorVariant(nextColorVariant);
    saveShinyEllieProgress({
      unlocked,
      mode: nextMode,
      colorVariant: nextColorVariant,
      presentationMode: nextPresentationMode,
    }, { syncCloud: false }).catch((error) => {
      console.error('Failed to apply Shiny Ellie progress:', error);
    });
  }, []);

  const updateGrammarGameMode = useCallback((value: boolean) => {
    setIsGrammarGameMode(value);
    persistBoolean(GRAMMAR_GAME_MODE_KEY, value);
  }, []);

  const updateGrammarSpeech = useCallback((value: boolean) => {
    setIsGrammarSpeechEnabled(value);
    persistBoolean(GRAMMAR_SPEECH_ENABLED_KEY, value);
  }, []);

  const applyAccountPreferences = useCallback((snapshot: AccountPreferenceSnapshot) => {
    setHasExplicitThemeChoice(true);
    setIsDarkMode(snapshot.theme === 'dark');
    setIsGrammarGameMode(snapshot.grammarGameMode);
    setIsVocabTimerMode(snapshot.vocabTimerMode);
    setIsVocabTimerRecordSavingEnabled(snapshot.vocabTimerRecordSaving);
    setIsVocabAudioMatchMode(snapshot.vocabAudioMatchMode);
    setVocabLessonCardView(snapshot.vocabLessonCardView);
    setIsTypingStrictMode(snapshot.typingStrictMode);
    const nextHapticsEnabled = hapticsAreSupported && snapshot.hapticsEnabled;
    setIsHapticsEnabled(nextHapticsEnabled);
    setHapticsEnabled(nextHapticsEnabled);
    setIsSoundEffectsEnabled(snapshot.soundEffectsEnabled);
    setSoundEffectsEnabled(snapshot.soundEffectsEnabled);
    setIsReduceAnimationsEnabled(snapshot.reduceAnimations);
    setIsTodayCardEnabled(snapshot.todayCardOptIn && snapshot.todayCardEnabled);
    setIsAndroidStatusBarEnabled(snapshot.androidStatusBarEnabled);


  }, []);

  const isWarmColorVariant = isShinyEllieUnlocked && shinyEllieColorVariant === 'warm';
  const colors = useMemo(() => {
    const palette = isDarkMode
      ? (isWarmColorVariant ? warmDarkColors : darkColors)
      : (isWarmColorVariant ? shinyEllieLightColors : lightColors);

    return {
      ...palette,
      visualStyle: isShinyEllieMode ? 'pixel' as const : 'normal' as const,
    };
  }, [isDarkMode, isShinyEllieMode, isWarmColorVariant]);
  const textScale = useMemo(() => TEXT_SCALE_BY_LEVEL[textSizeLevel], [textSizeLevel]);


  const usePageBackgroundColor = (bgColor: string) => {
    useEffect(() => {
      if (Platform.OS !== 'web') return;
      const doc = (globalThis as any).document as Document | undefined;
      if (!doc) return;

      doc.documentElement.style.backgroundColor = bgColor;
      doc.body.style.backgroundColor = bgColor;
    }, [bgColor]);
  };


  usePageBackgroundColor(colors.background);


  if (!isThemeLoaded) {
    return null;
  }

  return (    <ThemeContext.Provider value={{
      isDarkMode,
      colors,
      toggleTheme,
      textSizeLevel,
      textScale,
      updateTextSizeLevel,
      isGrammarGameMode,
      toggleGrammarGameMode,
      updateGrammarGameMode,
      isGrammarSpeechEnabled,
      toggleGrammarSpeech,
      updateGrammarSpeech,
      isVocabTimerMode,
      toggleVocabTimerMode,
      updateVocabTimerMode,
      isVocabTimerRecordSavingEnabled,
      toggleVocabTimerRecordSaving,
      updateVocabTimerRecordSaving,
      isVocabAudioMatchMode,
      toggleVocabAudioMatchMode,
      updateVocabAudioMatchMode,
      vocabLessonCardView,
      updateVocabLessonCardView,
      isTypingStrictMode,
      toggleTypingStrictMode,
      updateTypingStrictMode,
      isHapticsEnabled,
      toggleHaptics,
      updateHaptics,
      isSoundEffectsEnabled,
      toggleSoundEffects,
      updateSoundEffects,
      // The "Fewer animations" setting was removed; the phone's own reduce-motion setting still
      // applies. A value saved by an earlier version is ignored.
      isReduceAnimationsEnabled: false,
      toggleReduceAnimations,
      isTodayCardEnabled,
      toggleTodayCard,
      updateTodayCard,
      isAndroidStatusBarEnabled,
      toggleAndroidStatusBar,
      updateAndroidStatusBar,
      isShinyEllieUnlocked,
      isShinyEllieMode,
      isShinyElliePresentationMode,
      shinyEllieColorVariant,
      isWarmColorVariant,
      unlockShinyEllie,
      toggleShinyEllieMode,
      updateShinyEllieMode,
      updateShinyElliePresentationMode,
      updateShinyEllieColorVariant,
      updateShinyEllieProgress,
      applyAccountPreferences
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
