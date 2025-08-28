import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

type Colors = {
  background: string;
  card: string;
  text: string;
  secondaryText: string;
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
};

const lightColors: Colors = {
  background: '#f5f5f5',
  card: '#ffffff',
  text: '#333333',
  secondaryText: '#666666',
  buttonBackground: '#1671B6',
  buttonText: '#ffffff',
};

// Deep-blue based dark theme for a richer night-mode experience
const darkColors: Colors = {
  background: '#0d1b2a',      // deep navy background
  card: '#1b263b',            // slightly lighter blue for surfaces / cards
  text: '#e0e1dd',            // warm off-white for high contrast against blue
  secondaryText: '#a9b4c2',   // desaturated light blue-grey for secondary text
  buttonBackground: '#45B7D1',
  buttonText: '#ffffff',
};

const THEME_STORAGE_KEY = '@app_theme';
const GRAMMAR_GAME_MODE_KEY = '@grammar_game_mode';
const VOCAB_TIMER_MODE_KEY = '@vocab_timer_mode';

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
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isThemeLoaded, setIsThemeLoaded] = useState(false);
  const [isGrammarGameMode, setIsGrammarGameMode] = useState(false);
  const [isVocabTimerMode, setIsVocabTimerMode] = useState(false);

  // Load saved preferences
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const [savedTheme, savedGrammarMode, savedVocabMode] = await Promise.all([
          AsyncStorage.getItem(THEME_STORAGE_KEY),
          AsyncStorage.getItem(GRAMMAR_GAME_MODE_KEY),
          AsyncStorage.getItem(VOCAB_TIMER_MODE_KEY)
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
      // Persist asynchronously – no need to await for UI updates
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
  }, []);  const toggleVocabTimerMode = useCallback(() => {
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

  const updateGrammarGameMode = useCallback((value: boolean) => {
    setIsGrammarGameMode(value);
    persistBoolean(GRAMMAR_GAME_MODE_KEY, value);
  }, []);

  const saveSettings = useCallback(async () => {
    try {
      await AsyncStorage.setItem('isDarkMode', JSON.stringify(isDarkMode));
      await AsyncStorage.setItem('isVocabTimerMode', JSON.stringify(isVocabTimerMode));
    } catch (e) {
      console.error("Failed to save settings to AsyncStorage", e);
    }
  }, [isDarkMode, isVocabTimerMode]);

  const colors = useMemo(() => (isDarkMode ? darkColors : lightColors), [isDarkMode]);

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
      updateVocabTimerMode
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);