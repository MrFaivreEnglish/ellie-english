import React from 'react';
import { Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { RootStackParamList } from '../../types/navigationTypes';
import Text, { ThemedTextInput as TextInput } from '../shared/ThemedText';
import MaterialIcons from '../shared/ThemedMaterialIcon';
import BackButton from '../shared/BackButton';
import { useTheme } from '../settings/ThemeContext';
import { getTopSafeAreaInset } from '../shared/responsiveLayout';
import { useEnglishSpeech } from '../shared/useEnglishSpeech';
import { vocabularyLessons } from '../../content/lessons/vocabularyRegistry';
import { grammarLessons } from '../../content/lessons/grammarRegistry';
import { getAllVocabularyLessons } from '../vocabulary/knownWords';
import { getSerializableVocabularyLesson } from '../vocabulary/vocabularyUtils';
import { searchContent } from './searchContent';

export default function SearchScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { colors, isAndroidStatusBarEnabled } = useTheme();
  const { speak } = useEnglishSpeech();
  const insets = useSafeAreaInsets();
  const topContentInset = getTopSafeAreaInset(Platform.OS, insets.top, isAndroidStatusBarEnabled);

  const [query, setQuery] = React.useState('');
  // Built-in lessons are searchable straight away; teacher-added ones join once loaded.
  const [vocabularySource, setVocabularySource] = React.useState<any[]>(vocabularyLessons);

  React.useEffect(() => {
    let active = true;
    getAllVocabularyLessons()
      .then((all) => {
        if (active) setVocabularySource(all);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const results = React.useMemo(
    () => searchContent(query, vocabularySource, grammarLessons),
    [query, vocabularySource]
  );
  const hasQuery = query.trim().length >= 2;
  const isEmpty = hasQuery && results.lessons.length === 0 && results.words.length === 0;

  const openLesson = (type: 'vocabulary' | 'grammar', lesson: any) => {
    if (type === 'grammar') {
      navigation.navigate('MainTabs', { screen: 'Grammar', params: { lesson, openKey: Date.now() } });
      return;
    }

    navigation.navigate('MainTabs', {
      screen: 'Vocabulary',
      params: {
        screen: 'VocabularyLesson',
        params: { lesson: getSerializableVocabularyLesson(lesson) },
      },
    });
  };

  const rowStyle = [styles.row, { backgroundColor: colors.card, borderColor: colors.border }];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingTop: topContentInset, paddingBottom: insets.bottom + 32 }}
      keyboardShouldPersistTaps="handled"
    >
      <BackButton onPress={() => navigation.goBack()} />
      <Text style={[styles.title, { color: colors.text }]}>Search</Text>

      <View style={[styles.searchBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <MaterialIcons name="search" size={20} color={colors.secondaryText} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="A word in English or French, or a lesson"
          placeholderTextColor={colors.secondaryText}
          style={[styles.input, { color: colors.text }]}
          autoFocus
          autoCorrect={false}
          autoCapitalize="none"
          accessibilityLabel="Search words and lessons"
        />
        {!!query && (
          <TouchableOpacity onPress={() => setQuery('')} accessibilityRole="button" accessibilityLabel="Clear search" hitSlop={8}>
            <MaterialIcons name="close" size={20} color={colors.secondaryText} />
          </TouchableOpacity>
        )}
      </View>

      {!hasQuery && (
        <Text style={[styles.hint, { color: colors.secondaryText }]}>
          Type at least 2 letters. Accents don’t matter: “ete” finds “été”.
        </Text>
      )}
      {isEmpty && <Text style={[styles.hint, { color: colors.secondaryText }]}>Nothing found for “{query.trim()}”.</Text>}

      {results.lessons.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.secondaryText }]}>Lessons</Text>
          {results.lessons.map((hit) => (
            <TouchableOpacity
              key={`${hit.type}:${hit.title}`}
              onPress={() => openLesson(hit.type, hit.lesson)}
              activeOpacity={0.8}
              style={rowStyle}
              accessibilityRole="button"
              accessibilityLabel={`Open ${hit.type} lesson ${hit.title}`}
            >
              <MaterialIcons name={hit.type === 'grammar' ? 'edit' : 'style'} size={20} color={colors.primary} />
              <View style={styles.rowCopy}>
                <Text style={[styles.rowTitle, { color: colors.text }]} numberOfLines={1}>{hit.title}</Text>
                <Text style={[styles.rowMeta, { color: colors.secondaryText }]}>{hit.type === 'grammar' ? 'Grammar' : 'Vocabulary'}</Text>
              </View>
              <MaterialIcons name="chevron-right" size={22} color={colors.secondaryText} />
            </TouchableOpacity>
          ))}
        </View>
      )}

      {results.words.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.secondaryText }]}>Words</Text>
          {results.words.map((hit) => (
            <TouchableOpacity
              key={`${hit.word.english}|${hit.word.french}`}
              onPress={() => openLesson('vocabulary', hit.lesson)}
              activeOpacity={0.8}
              style={rowStyle}
              accessibilityRole="button"
              accessibilityLabel={`Open lesson ${hit.lessonTitle}, ${hit.word.english}, ${hit.word.french}`}
            >
              <View style={styles.rowCopy}>
                <Text style={[styles.rowTitle, { color: colors.text }]}>{hit.word.english}</Text>
                <Text style={[styles.rowMeta, { color: colors.secondaryText }]} numberOfLines={1}>
                  {hit.word.french} · {hit.lessonTitle}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => speak(hit.word.english)}
                hitSlop={8}
                style={[styles.speaker, { backgroundColor: colors.surface }]}
                accessibilityRole="button"
                accessibilityLabel={`Listen to "${hit.word.english}"`}
              >
                <MaterialIcons name="volume-up" size={16} color={colors.primary} />
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { fontSize: 30, lineHeight: 34, fontWeight: '900', paddingHorizontal: 20, paddingBottom: 10 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    minHeight: 50,
    borderRadius: 14,
    borderWidth: 1.5,
    paddingHorizontal: 12,
  },
  input: { flex: 1, fontSize: 16, paddingVertical: 10 },
  hint: { fontSize: 13, lineHeight: 18, fontWeight: '600', marginHorizontal: 20, marginTop: 14 },
  section: { marginTop: 16, marginHorizontal: 16, gap: 6 },
  sectionTitle: { fontSize: 12, lineHeight: 16, fontWeight: '900', textTransform: 'uppercase', marginLeft: 4 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 54,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  rowCopy: { flex: 1, minWidth: 0 },
  rowTitle: { fontSize: 15, lineHeight: 20, fontWeight: '800' },
  rowMeta: { fontSize: 12, lineHeight: 16, fontWeight: '700' },
  speaker: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
});
