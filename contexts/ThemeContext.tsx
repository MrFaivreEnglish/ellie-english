import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { hapticsAreSupported, setHapticsEnabled } from '../utils/haptics';
import type { MenuLanguage } from '../utils/menuCopy';
import { ACTIVE_MENU_LANGUAGE, isMenuLanguage } from '../utils/menuCopy';
import {
  saveShinyEllieProgress,
  SHINY_ELLIE_MODE_KEY,
  SHINY_ELLIE_UNLOCKED_KEY,
} from '../utils/shinyEllieStorage';
import { ENABLE_MENU_LANGUAGE_SELECTOR, ENABLE_SHINY_ELLIE_COLOR_MODE } from '../lib/featureFlags';

type Colors = {
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
  colors: Colors;
  toggleTheme: () => void;
  isGrammarGameMode: boolean;
  toggleGrammarGameMode: () => void;
  updateGrammarGameMode: (value: boolean) => void;
  isVocabTimerMode: boolean;
  toggleVocabTimerMode: () => void;
  updateVocabTimerMode: (value: boolean) => void;
  isVocabTimerRecordSavingEnabled: boolean;
  toggleVocabTimerRecordSaving: () => void;
  updateVocabTimerRecordSaving: (value: boolean) => void;
  vocabLessonCardView: 'list' | 'tile';
  updateVocabLessonCardView: (value: 'list' | 'tile') => void;
  menuLanguage: MenuLanguage;
  updateMenuLanguage: (value: MenuLanguage) => void;
  isTypingStrictMode: boolean;
  toggleTypingStrictMode: () => void;
  updateTypingStrictMode: (value: boolean) => void;
  isHapticsEnabled: boolean;
  toggleHaptics: () => void;
  updateHaptics: (value: boolean) => void;
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
};

const lightColors: Colors = {
  background: '#f5f5f5',
  card: '#ffffff',
  surface: '#F4F8FC',
  surfaceAlt: '#ECF6FF',
  text: '#333333',
  secondaryText: '#666666',
  border: '#D6E2EE',
  borderStrong: '#BCD2E4',
  primary: '#1671B6',
  primarySoft: '#EAF5FF',
  success: '#42C67A',
  successSoft: '#E9F8EF',
  successText: '#12663D',
  danger: '#F06A7F',
  dangerSoft: '#FFE8EC',
  dangerText: '#8F2234',
  warning: '#F4B740',
  warningSoft: '#FFF6DE',
  buttonBackground: '#1671B6',
  buttonText: '#ffffff',
};

const darkColors: Colors = {
  background: '#0D1B2A',
  card: '#1B263B',
  surface: '#22324A',
  surfaceAlt: '#2B405C',
  text: '#F2F6FA',
  secondaryText: '#B8C5D3',
  border: '#3A506B',
  borderStrong: '#58708E',
  primary: '#45B7D1',
  primarySoft: '#17384B',
  success: '#6FD08C',
  successSoft: '#1D3A2A',
  successText: '#C4F4D1',
  danger: '#FF8A9A',
  dangerSoft: '#46242C',
  dangerText: '#FFD8DE',
  warning: '#F2C35C',
  warningSoft: '#3F321A',
  buttonBackground: '#45B7D1',
  buttonText: '#ffffff',
};

const shinyLightColors: Colors = {
  ...lightColors,
  surface: '#F3F8F1',
  surfaceAlt: '#E9F3E6',
  border: '#C9DAC5',
  borderStrong: '#AFC6AA',
  primary: '#5F8F6A',
  primarySoft: '#EAF3E6',
  buttonBackground: '#5F8F6A',
};

const shinyDarkColors: Colors = {
  ...darkColors,
  background: '#101A14',
  card: '#1A2A20',
  surface: '#223529',
  surfaceAlt: '#2A4232',
  border: '#45614C',
  borderStrong: '#63806A',
  primary: '#A7D3A2',
  primarySoft: '#243826',
  success: '#8EDB95',
  warning: '#E8C76C',
  buttonBackground: '#8FBE8C',
};

const THEME_STORAGE_KEY = '@app_theme';
const GRAMMAR_GAME_MODE_KEY = '@grammar_game_mode';
const VOCAB_TIMER_MODE_KEY = '@vocab_timer_mode';
const VOCAB_TIMER_RECORD_SAVING_KEY = '@vocab_timer_record_saving';
const VOCAB_LESSON_CARD_VIEW_KEY = '@vocab_lesson_card_view';
const MENU_LANGUAGE_KEY = '@menu_language';
const TYPING_STRICT_MODE_KEY = '@typing_strict_mode';
const HAPTICS_ENABLED_KEY = '@haptics_enabled';
const WEB_HAPTICS_RESTORED_KEY = '@web_haptics_restored';
const TODAY_CARD_ENABLED_KEY = '@today_card_enabled';
const TODAY_CARD_OPT_IN_KEY = '@today_card_opt_in';
const ANDROID_STATUS_BAR_ENABLED_KEY = '@android_status_bar_enabled';
export const ThemeContext = createContext<ThemeContextType>({
  isDarkMode: false,
  colors: lightColors,
  toggleTheme: () => {},
  isGrammarGameMode: false,
  toggleGrammarGameMode: () => {},
  updateGrammarGameMode: () => {},
  isVocabTimerMode: false,
  toggleVocabTimerMode: () => {},
  updateVocabTimerMode: () => {},
  isVocabTimerRecordSavingEnabled: false,
  toggleVocabTimerRecordSaving: () => {},
  updateVocabTimerRecordSaving: () => {},
  vocabLessonCardView: 'list',
  updateVocabLessonCardView: () => {},
  menuLanguage: ACTIVE_MENU_LANGUAGE,
  updateMenuLanguage: () => {},
  isTypingStrictMode: false,
  toggleTypingStrictMode: () => {},
  updateTypingStrictMode: () => {},
  isHapticsEnabled: hapticsAreSupported,
  toggleHaptics: () => {},
  updateHaptics: () => {},
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
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isThemeLoaded, setIsThemeLoaded] = useState(false);
  const [isGrammarGameMode, setIsGrammarGameMode] = useState(false);
  const [isVocabTimerMode, setIsVocabTimerMode] = useState(false);
  const [isVocabTimerRecordSavingEnabled, setIsVocabTimerRecordSavingEnabled] = useState(false);
  const [vocabLessonCardView, setVocabLessonCardView] = useState<'list' | 'tile'>('list');
  const [menuLanguage, setMenuLanguage] = useState<MenuLanguage>(ACTIVE_MENU_LANGUAGE);
  const [isTypingStrictMode, setIsTypingStrictMode] = useState(false);
  const [isHapticsEnabled, setIsHapticsEnabled] = useState(hapticsAreSupported);
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
          savedMenuLanguage,
          savedTypingStrictMode,
          savedHapticsEnabled,
          savedWebHapticsRestored,
          savedTodayCardEnabled,
          savedTodayCardOptIn,
          savedAndroidStatusBarEnabled,
          savedShinyEllieUnlocked,
          savedShinyEllieMode,
        ] = await Promise.all([
          AsyncStorage.getItem(THEME_STORAGE_KEY),
          AsyncStorage.getItem(GRAMMAR_GAME_MODE_KEY),
          AsyncStorage.getItem(VOCAB_TIMER_MODE_KEY),
          AsyncStorage.getItem(VOCAB_TIMER_RECORD_SAVING_KEY),
          AsyncStorage.getItem(VOCAB_LESSON_CARD_VIEW_KEY),
          AsyncStorage.getItem(MENU_LANGUAGE_KEY),
          AsyncStorage.getItem(TYPING_STRICT_MODE_KEY),
          AsyncStorage.getItem(HAPTICS_ENABLED_KEY),
          AsyncStorage.getItem(WEB_HAPTICS_RESTORED_KEY),
          AsyncStorage.getItem(TODAY_CARD_ENABLED_KEY),
          AsyncStorage.getItem(TODAY_CARD_OPT_IN_KEY),
          AsyncStorage.getItem(ANDROID_STATUS_BAR_ENABLED_KEY),
          AsyncStorage.getItem(SHINY_ELLIE_UNLOCKED_KEY),
          AsyncStorage.getItem(SHINY_ELLIE_MODE_KEY)
        ]);
        
        if (savedTheme !== null) {
          setIsDarkMode(savedTheme === 'dark');
        }
        
        if (savedGrammarMode !== null) {
          setIsGrammarGameMode(savedGrammarMode === 'true');
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

        if (ENABLE_MENU_LANGUAGE_SELECTOR && isMenuLanguage(savedMenuLanguage)) {
          setMenuLanguage(savedMenuLanguage);
        } else {
          setMenuLanguage(ACTIVE_MENU_LANGUAGE);
          if (savedMenuLanguage !== ACTIVE_MENU_LANGUAGE) {
            AsyncStorage.setItem(MENU_LANGUAGE_KEY, ACTIVE_MENU_LANGUAGE).catch((error) => {
              console.error('Failed to reset menu language preference:', error);
            });
          }
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
  const persistBoolean = async (key: string, value: boolean) => {
    try {
      await AsyncStorage.setItem(key, value ? 'true' : 'false');
    } catch (error) {
      console.error(`Failed to save preference for ${key}:`, error);
    }
  };

  // === Memoised toggle handlers ===
  const toggleTheme = useCallback(() => {
    setIsDarkMode(prev => {
      const next = !prev;
      // Persist asynchronously; no need to await for UI updates.
      AsyncStorage.setItem(THEME_STORAGE_KEY, next ? 'dark' : 'light').catch(err => {
        console.error('Failed to save theme preference:', err);
      });
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
    AsyncStorage.setItem(VOCAB_LESSON_CARD_VIEW_KEY, value).catch((error) => {
      console.error('Failed to save vocabulary card view preference:', error);
    });
  }, []);

  const updateMenuLanguage = useCallback((value: MenuLanguage) => {
    const next = ENABLE_MENU_LANGUAGE_SELECTOR ? value : ACTIVE_MENU_LANGUAGE;
    setMenuLanguage(next);
    AsyncStorage.setItem(MENU_LANGUAGE_KEY, next).catch((error) => {
      console.error('Failed to save menu language preference:', error);
    });
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
    });
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
      });
      return next;
    });
  }, [isShinyEllieUnlocked]);

  const updateShinyEllieMode = useCallback((value: boolean) => {
    const next = ENABLE_SHINY_ELLIE_COLOR_MODE ? value : false;
    setIsShinyEllieMode(next);
    saveShinyEllieProgress({ unlocked: isShinyEllieUnlocked, mode: next }).catch((error) => {
      console.error('Failed to save Shiny Ellie mode:', error);
    });
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

  const colors = useMemo(() => {
    if (ENABLE_SHINY_ELLIE_COLOR_MODE && isShinyEllieMode) {
      return isDarkMode ? shinyDarkColors : shinyLightColors;
    }

    return isDarkMode ? darkColors : lightColors;
  }, [isDarkMode, isShinyEllieMode]);

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
      isVocabTimerMode,
      toggleVocabTimerMode,
      updateVocabTimerMode,
      isVocabTimerRecordSavingEnabled,
      toggleVocabTimerRecordSaving,
      updateVocabTimerRecordSaving,
      vocabLessonCardView,
      updateVocabLessonCardView,
      menuLanguage,
      updateMenuLanguage,
      isTypingStrictMode,
      toggleTypingStrictMode,
      updateTypingStrictMode,
      isHapticsEnabled,
      toggleHaptics,
      updateHaptics,
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
      updateShinyEllieProgress
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
