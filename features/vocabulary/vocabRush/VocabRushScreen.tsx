import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useFonts } from 'expo-font';
import {
  LibreFranklin_400Regular,
  LibreFranklin_500Medium,
  LibreFranklin_600SemiBold,
  LibreFranklin_700Bold,
  LibreFranklin_800ExtraBold,
} from '@expo-google-fonts/libre-franklin';
import { vocabRushColorsForTheme } from './vocabRushColors';
import VocabRushGame from './VocabRushGame';
import { getKnownVocabularyWords, MAX_VOCAB_RUSH_WORDS } from '../knownWords';
import { useTheme } from '../../settings/ThemeContext';
import type { Word } from '../../../types/VocabularyTypes';

export default function VocabRushScreen({ navigation }: any) {
  const { isDarkMode, colors: themeColors } = useTheme();
  const colors = vocabRushColorsForTheme(isDarkMode, themeColors);
  const [fontsLoaded] = useFonts({
    LibreFranklin_400Regular,
    LibreFranklin_500Medium,
    LibreFranklin_600SemiBold,
    LibreFranklin_700Bold,
    LibreFranklin_800ExtraBold,
  });

  const [words, setWords] = useState<Word[] | null>(null);




  useEffect(() => {
    let active = true;
    getKnownVocabularyWords(MAX_VOCAB_RUSH_WORDS).then((known) => {
      if (active) setWords(known);
    });
    return () => {
      active = false;
    };
  }, []);

  const goBack = () => {
    if (navigation?.canGoBack?.()) {
      navigation.goBack();
      return;
    }
    navigation?.navigate?.('VocabularyList');
  };

  const handleNavigate = (key: 'grammar' | 'vocabulary' | 'lessons' | 'settings') => {
    if (key === 'vocabulary') {
      navigation?.navigate?.('VocabularyList');
      return;
    }

    const tabName = key === 'grammar' ? 'Grammar' : key === 'lessons' ? 'Lessons' : 'Settings';
    navigation?.getParent?.()?.navigate?.(tabName);
  };

  const handleGoToAccount = () => {
    const rootNav = navigation?.getParent?.()?.getParent?.();
    rootNav?.navigate?.('Account', { openAvatarPicker: true });
  };

  if (!fontsLoaded || !words) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={colors.comboValue} />
      </View>
    );
  }

  return (
    <VocabRushGame
      words={words}
      startingScore={0}
      startingStreak={0}
      onBack={goBack}
      onNavigate={handleNavigate}
      onGoToAccount={handleGoToAccount}
    />
  );
}
