import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { hapticsAreSupported, setHapticsEnabled } from '../shared/haptics';
import { setSoundEffectsEnabled } from '../shared/soundEffects';
import {
  saveShinyEllieProgress,
  SHINY_ELLIE_MODE_KEY,
  SHINY_ELLIE_UNLOCKED_KEY,
} from '../progress/shinyEllieStorage';
import { ENABLE_SHINY_ELLIE_COLOR_MODE } from '../../lib/featureFlags';
import {
  ANDROID_STATUS_BAR_ENABLED_KEY,
  GRAMMAR_GAME_MODE_KEY,
  GRAMMAR_SPEECH_ENABLED_KEY,
  HAPTICS_ENABLED_KEY,
  SOUND_EFFECTS_ENABLED_KEY,
  THEME_STORAGE_KEY,
  TODAY_CARD_ENABLED_KEY,
  TODAY_CARD_OPT_IN_KEY,
  TYPING_STRICT_MODE_KEY,
  VOCAB_LESSON_CARD_VIEW_KEY,
  VOCAB_TIMER_MODE_KEY,
  VOCAB_TIMER_RECORD_SAVING_KEY,
  WEB_HAPTICS_RESTORED_KEY,
  syncAccountPreferencesToCloudIfSignedIn,
  type AccountPreferenceSnapshot,
} from '../account/accountPreferencesStorage';

export type ThemeColors = {
  background: string;
  card: string;
  surface: string;
  surfaceAlt: string;
  text: string;
  secondaryText: string;
  border: string;
  borderStrong: string;
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
  isTodayCardEnabled: boolean;
  toggleTodayCard: () => void;
  updateTodayCard: (value: boolean) => void;
  isAndroidStatusBarEnabled: boolean;
  toggleAndroidStatusBar: () => void;
  updateAndroidStatusBar: (value: boolean) => void;
  isShinyEllieUnlocked: boolean;
  isShinyEllieMode: boolean;
  unlockShinyEllie: () => void;
  toggleShinyEllieMode: () => void;
  updateShinyEllieMode: (value: boolean) => void;
  updateShinyEllieProgress: (unlocked: boolean, mode: boolean) => void;
  applyAccountPreferences: (snapshot: AccountPreferenceSnapshot) => void;
};

const lightColors: ThemeColors = {
  background: '#F3F6FA',
  card: '#ffffff',
  surface: '#F8FAFF',
  surfaceAlt: '#EAF5FF',
  text: '#243041',
  secondaryText: '#607089',
  border: '#D6E2EE',
  borderStrong: '#7ABCF2',
  primary: '#1F7AD1',
  primarySoft: '#EAF5FF',
  success: '#2FBF72',
  successSoft: '#E9F8EF',
  successText: '#11633B',
  danger: '#F06A7F',
  dangerSoft: '#FFE8EC',
  dangerText: '#8F2234',
  warning: '#F4B740',
  warningSoft: '#FFF6DE',
  buttonBackground: '#1F7AD1',
  buttonText: '#ffffff',
};

const darkColors: ThemeColors = {
  background: '#070F1C',
  card: '#0D1A28',
  surface: '#162436',
  surfaceAlt: '#1E3450',
  text: '#F7FAFF',
  secondaryText: '#C8D5EA',
  border: '#334D68',
  borderStrong: '#78C7F8',
  primary: '#8ED2FF',
  primarySoft: '#123657',
  success: '#8FF2B3',
  successSoft: '#153F31',
  successText: '#EFFFF4',
  danger: '#FFB4C2',
  dangerSoft: '#5B2737',
  dangerText: '#FFF3F6',
  warning: '#FFD166',
  warningSoft: '#FCC30B',
  buttonBackground: '#126EC6',
  buttonText: '#FFFFFF',
};

export const ThemeContext = createContext<ThemeContextType>({
  isDarkMode: false,
  colors: lightColors,
  toggleTheme: () => {},
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
  isTodayCardEnabled: false,
  toggleTodayCard: () => {},
  updateTodayCard: () => {},
  isAndroidStatusBarEnabled: false,
  toggleAndroidStatusBar: () => {},
  updateAndroidStatusBar: () => {},
  isShinyEllieUnlocked: false,
  isShinyEllieMode: false,
  unlockShinyEllie: () => {},
  toggleShinyEllieMode: () => {},
  updateShinyEllieMode: () => {},
  updateShinyEllieProgress: () => {},
  applyAccountPreferences: () => {},
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isThemeLoaded, setIsThemeLoaded] = useState(false);
  const [isGrammarGameMode, setIsGrammarGameMode] = useState(false);
  const [isGrammarSpeechEnabled, setIsGrammarSpeechEnabled] = useState(false);
  const [isVocabTimerMode, setIsVocabTimerMode] = useState(false);
  const [isVocabTimerRecordSavingEnabled, setIsVocabTimerRecordSavingEnabled] = useState(false);
  const [vocabLessonCardView, setVocabLessonCardView] = useState<'list' | 'tile'>('list');
const [isTypingStrictMode, setIsTypingStrictMode] = useState(false);
  const [isHapticsEnabled, setIsHapticsEnabled] = useState(hapticsAreSupported);
  const [isSoundEffectsEnabled, setIsSoundEffectsEnabled] = useState(true);
  const [isTodayCardEnabled, setIsTodayCardEnabled] = useState(false);
  const [isAndroidStatusBarEnabled, setIsAndroidStatusBarEnabled] = useState(false);
  const [isShinyEllieUnlocked, setIsShinyEllieUnlocked] = useState(false);
  const [isShinyEllieMode, setIsShinyEllieMode] = useState(false);

  // Load saved preferences
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const [
          savedTheme,
          savedGrammarMode,
          savedVocabMode,
          savedVocabTimerRecordSaving,
          savedVocabLessonCardView,
          savedTypingStrictMode,
          savedHapticsEnabled,
          savedSoundEffectsEnabled,
          savedWebHapticsRestored,
          savedTodayCardEnabled,
          savedTodayCardOptIn,
          savedAndroidStatusBarEnabled,
          savedShinyEllieUnlocked,
          savedShinyEllieMode,
          savedGrammarSpeech,
        ] = await Promise.all([
          AsyncStorage.getItem(THEME_STORAGE_KEY),
          AsyncStorage.getItem(GRAMMAR_GAME_MODE_KEY),
          AsyncStorage.getItem(VOCAB_TIMER_MODE_KEY),
          AsyncStorage.getItem(VOCAB_TIMER_RECORD_SAVING_KEY),
          AsyncStorage.getItem(VOCAB_LESSON_CARD_VIEW_KEY),
          AsyncStorage.getItem(TYPING_STRICT_MODE_KEY),
          AsyncStorage.getItem(HAPTICS_ENABLED_KEY),
          AsyncStorage.getItem(SOUND_EFFECTS_ENABLED_KEY),
          AsyncStorage.getItem(WEB_HAPTICS_RESTORED_KEY),
          AsyncStorage.getItem(TODAY_CARD_ENABLED_KEY),
          AsyncStorage.getItem(TODAY_CARD_OPT_IN_KEY),
          AsyncStorage.getItem(ANDROID_STATUS_BAR_ENABLED_KEY),
          AsyncStorage.getItem(SHINY_ELLIE_UNLOCKED_KEY),
          AsyncStorage.getItem(SHINY_ELLIE_MODE_KEY),
          AsyncStorage.getItem(GRAMMAR_SPEECH_ENABLED_KEY),
        ]);
        
        if (savedTheme !== null) {
          setIsDarkMode(savedTheme === 'dark');
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

        if (savedTodayCardOptIn === 'true' && savedTodayCardEnabled !== null) {
          setIsTodayCardEnabled(savedTodayCardEnabled === 'true');
        }

        if (savedAndroidStatusBarEnabled !== null) {
          setIsAndroidStatusBarEnabled(savedAndroidStatusBarEnabled === 'true');
        }

        if (savedShinyEllieUnlocked !== null) {
          setIsShinyEllieUnlocked(savedShinyEllieUnlocked === 'true');
        }

        if (ENABLE_SHINY_ELLIE_COLOR_MODE && savedShinyEllieMode !== null) {
          setIsShinyEllieMode(savedShinyEllieMode === 'true');
        } else {
          setIsShinyEllieMode(false);
          if (savedShinyEllieMode !== 'false') {
            AsyncStorage.setItem(SHINY_ELLIE_MODE_KEY, 'false').catch((error) => {
              console.error('Failed to reset Shiny Ellie mode preference:', error);
            });
          }
        }
        
        setIsThemeLoaded(true);
      } catch (error) {
        console.error('Failed to load preferences:', error);
        setIsThemeLoaded(true);
      }
    };
    
    loadPreferences();
  }, []);

  // === Helpers ===
  const syncAccountPreferences = () => {
    void syncAccountPreferencesToCloudIfSignedIn();
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

  // === Memoised toggle handlers ===
  const toggleTheme = useCallback(() => {
    setIsDarkMode(prev => {
      const next = !prev;
      // Persist asynchronously; no need to await for UI updates.
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
    saveShinyEllieProgress({ unlocked: true, mode: nextMode }).catch((error) => {
      console.error('Failed to save Shiny Ellie progress:', error);
    }).then(syncAccountPreferences);
  }, []);

  const toggleShinyEllieMode = useCallback(() => {
    if (!ENABLE_SHINY_ELLIE_COLOR_MODE) {
      setIsShinyEllieMode(false);
      persistBoolean(SHINY_ELLIE_MODE_KEY, false);
      return;
    }

    setIsShinyEllieMode(prev => {
      const next = !prev;
      saveShinyEllieProgress({ unlocked: isShinyEllieUnlocked, mode: next }).catch((error) => {
        console.error('Failed to save Shiny Ellie mode:', error);
      }).then(syncAccountPreferences);
      return next;
    });
  }, [isShinyEllieUnlocked]);

  const updateShinyEllieMode = useCallback((value: boolean) => {
    const next = ENABLE_SHINY_ELLIE_COLOR_MODE ? value : false;
    setIsShinyEllieMode(next);
    saveShinyEllieProgress({ unlocked: isShinyEllieUnlocked, mode: next }).catch((error) => {
      console.error('Failed to save Shiny Ellie mode:', error);
    }).then(syncAccountPreferences);
  }, [isShinyEllieUnlocked]);

  const updateShinyEllieProgress = useCallback((unlocked: boolean, mode: boolean) => {
    const nextMode = unlocked && ENABLE_SHINY_ELLIE_COLOR_MODE ? mode : false;
    setIsShinyEllieUnlocked(unlocked);
    setIsShinyEllieMode(nextMode);
    saveShinyEllieProgress({ unlocked, mode: nextMode }, { syncCloud: false }).catch((error) => {
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
    setIsDarkMode(snapshot.theme === 'dark');
    setIsGrammarGameMode(snapshot.grammarGameMode);
    setIsVocabTimerMode(snapshot.vocabTimerMode);
    setIsVocabTimerRecordSavingEnabled(snapshot.vocabTimerRecordSaving);
    setVocabLessonCardView(snapshot.vocabLessonCardView);
    setIsTypingStrictMode(snapshot.typingStrictMode);
    const nextHapticsEnabled = hapticsAreSupported && snapshot.hapticsEnabled;
    setIsHapticsEnabled(nextHapticsEnabled);
    setHapticsEnabled(nextHapticsEnabled);
    setIsSoundEffectsEnabled(snapshot.soundEffectsEnabled);
    setSoundEffectsEnabled(snapshot.soundEffectsEnabled);
    setIsTodayCardEnabled(snapshot.todayCardOptIn && snapshot.todayCardEnabled);
    setIsAndroidStatusBarEnabled(snapshot.androidStatusBarEnabled);
    setIsShinyEllieMode(ENABLE_SHINY_ELLIE_COLOR_MODE && snapshot.shinyEllieMode);
  }, []);

  const colors = useMemo(() => isDarkMode ? darkColors : lightColors, [isDarkMode]);

  // Elegantly sync the browser page background colour on web
  const usePageBackgroundColor = (bgColor: string) => {
    useEffect(() => {
      if (Platform.OS !== 'web') return;
      const doc = (globalThis as any).document as Document | undefined;
      if (!doc) return;
      
      doc.documentElement.style.backgroundColor = bgColor;
      doc.body.style.backgroundColor = bgColor;
    }, [bgColor]);
  };

  // Apply the hook
  usePageBackgroundColor(colors.background);

  // Show nothing until theme is loaded to prevent flash
  if (!isThemeLoaded) {
    return null;
  }

  return (    <ThemeContext.Provider value={{ 
      isDarkMode, 
      colors, 
      toggleTheme,
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
      isTodayCardEnabled,
      toggleTodayCard,
      updateTodayCard,
      isAndroidStatusBarEnabled,
      toggleAndroidStatusBar,
      updateAndroidStatusBar,
      isShinyEllieUnlocked,
      isShinyEllieMode,
      unlockShinyEllie,
      toggleShinyEllieMode,
      updateShinyEllieMode,
      updateShinyEllieProgress,
      applyAccountPreferences
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
