import React from 'react';
import { Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image as ExpoImage } from 'expo-image';
import type { RootStackParamList } from '../../types/navigationTypes';
import Text, { ThemedTextInput as TextInput } from '../shared/ThemedText';
import MaterialIcons from '../shared/ThemedMaterialIcon';
import BackButton from '../shared/BackButton';
import { useTheme } from '../settings/ThemeContext';
import { getTopSafeAreaInset } from '../shared/responsiveLayout';
import { useEnglishSpeech } from '../shared/useEnglishSpeech';
import { vocabularyLessons } from '../../content/lessons/vocabularyRegistry';
import { grammarLessons } from '../../content/lessons/grammarRegistry';
import { getAllVocabularyLessons, vocabularyWordKey } from '../vocabulary/knownWords';
import { getLearnedFlashcardKeysByLesson } from '../vocabulary/flashcardProgressStorage';
import { getLessonThumbnailSource, getSerializableVocabularyLesson } from '../vocabulary/vocabularyUtils';
import { highlightParts, searchContent } from './searchContent';
import { addRecentSearch, clearRecentSearches, getRecentSearches } from './recentSearches';

type ResultFilter = 'all' | 'lessons' | 'words';
// A few lesson titles to try when the box is empty.
const SUGGESTION_COUNT = 6;

export default function SearchScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { colors, isDarkMode, isAndroidStatusBarEnabled } = useTheme();
  const { speak } = useEnglishSpeech();
  const insets = useSafeAreaInsets();
  const topContentInset = getTopSafeAreaInset(Platform.OS, insets.top, isAndroidStatusBarEnabled);

  const accent = isDarkMode ? '#3DB873' : '#2F9B5C';
  const accentSoft = isDarkMode ? '#17382A' : '#D3F5E0';
  const lineColor = isDarkMode ? '#2C3340' : '#E6E3DB';
  const cardShadow = { boxShadow: `0px 1px 0px ${lineColor}` } as const;

  const [query, setQuery] = React.useState('');
  const [filter, setFilter] = React.useState<ResultFilter>('all');
  const [focused, setFocused] = React.useState(false);
  const [recent, setRecent] = React.useState<string[]>([]);
  const [learntKeys, setLearntKeys] = React.useState<Set<string>>(() => new Set());
  // Built-in lessons are searchable straight away; teacher-added ones join once loaded.
  const [vocabularySource, setVocabularySource] = React.useState<any[]>(vocabularyLessons);

  React.useEffect(() => {
    let active = true;
    getAllVocabularyLessons()
      .then((all) => {
        if (active) setVocabularySource(all);
      })
      .catch(() => {});
    getRecentSearches()
      .then((items) => {
        if (active) setRecent(items);
      })
      .catch(() => {});
    getLearnedFlashcardKeysByLesson()
      .then((byLesson) => {
        if (!active) return;
        const keys = new Set<string>();
        byLesson.forEach((wordKeys) => wordKeys.forEach((key) => keys.add(key)));
        setLearntKeys(keys);
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
  const suggestions = React.useMemo(
    () => vocabularySource.slice(0, SUGGESTION_COUNT).map((lesson) => String(lesson?.title ?? '')).filter(Boolean),
    [vocabularySource]
  );
  const hasQuery = query.trim().length >= 2;
  const isEmpty = hasQuery && results.lessons.length === 0 && results.words.length === 0;
  const showLessons = results.lessons.length > 0 && filter !== 'words';
  const showWords = results.words.length > 0 && filter !== 'lessons';

  const rememberSearch = () => {
    void addRecentSearch(query).then(setRecent);
  };

  const openLesson = (type: 'vocabulary' | 'grammar', lesson: any) => {
    rememberSearch();

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

  const renderHighlighted = (text: string, baseStyle: object[], numberOfLines?: number) => (
    <Text style={baseStyle} numberOfLines={numberOfLines}>
      {highlightParts(text, query).map((part, index) => (
        <Text key={index} style={part.match ? { backgroundColor: accentSoft, color: isDarkMode ? '#CFF3DE' : '#1C3D2A' } : undefined}>
          {part.text}
        </Text>
      ))}
    </Text>
  );

  const renderChip = (id: ResultFilter, label: string, count: number) => {
    const selected = filter === id;
    return (
      <TouchableOpacity
        key={id}
        onPress={() => setFilter(id)}
        activeOpacity={0.85}
        style={[styles.chip, { backgroundColor: selected ? accent : colors.card }, !selected && cardShadow]}
        accessibilityRole="button"
        accessibilityState={{ selected }}
        accessibilityLabel={`${label}, ${count}`}
      >
        <Text style={[styles.chipText, { color: selected ? '#FFFFFF' : colors.text }]}>
          {label} {count}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderLessonRow = (hit: (typeof results.lessons)[number]) => {
    const own = hit.lesson?.imageUrl ?? hit.lesson?.image;
    const thumbnail = hit.type === 'vocabulary'
      ? getLessonThumbnailSource(hit.lesson) ?? (typeof own === 'string' && own ? { uri: own } : undefined)
      : undefined;

    return (
      <TouchableOpacity
        key={`${hit.type}:${hit.title}`}
        onPress={() => openLesson(hit.type, hit.lesson)}
        activeOpacity={0.85}
        style={[styles.row, cardShadow, { backgroundColor: colors.card }]}
        accessibilityRole="button"
        accessibilityLabel={`Open ${hit.type} lesson ${hit.title}`}
      >
        <View style={[styles.rowIcon, { backgroundColor: hit.type === 'grammar' ? colors.primarySoft : accentSoft }]}>
          {thumbnail ? (
            <ExpoImage source={thumbnail as any} style={styles.rowThumb} contentFit="contain" cachePolicy="memory-disk" accessibilityElementsHidden />
          ) : (
            <MaterialIcons name={hit.type === 'grammar' ? 'edit' : 'style'} size={22} color={hit.type === 'grammar' ? colors.primary : accent} />
          )}
        </View>
        <View style={styles.rowCopy}>
          {renderHighlighted(hit.title, [styles.rowTitle, { color: colors.text }], 1)}
          <Text style={[styles.rowMeta, { color: colors.secondaryText }]}>
            {hit.type === 'grammar' ? 'Grammar lesson' : 'Vocabulary lesson'}
          </Text>
        </View>
        <MaterialIcons name="chevron-right" size={24} color={colors.secondaryText} />
      </TouchableOpacity>
    );
  };

  const renderWordRow = (hit: (typeof results.words)[number]) => {
    const isLearnt = learntKeys.has(vocabularyWordKey(hit.word));

    return (
      <TouchableOpacity
        key={`${hit.word.english}|${hit.word.french}`}
        onPress={() => openLesson('vocabulary', hit.lesson)}
        activeOpacity={0.85}
        style={[styles.row, cardShadow, { backgroundColor: colors.card }]}
        accessibilityRole="button"
        accessibilityLabel={`Open lesson ${hit.lessonTitle}, ${hit.word.english}, ${hit.word.french}${isLearnt ? ', saved' : ''}`}
      >
        <View style={styles.rowCopy}>
          {renderHighlighted(hit.word.french, [styles.wordFrench, { color: colors.text }], 1)}
          {renderHighlighted(hit.word.english, [styles.wordEnglish, { color: colors.secondaryText }], 1)}
          <Text style={[styles.rowMeta, { color: colors.secondaryText }]} numberOfLines={1}>{hit.lessonTitle}</Text>
        </View>
        {isLearnt && (
          <View style={[styles.savedBadge, { backgroundColor: accentSoft }]} accessible={false}>
            <MaterialIcons name="check" size={14} color={accent} />
            <Text style={[styles.savedText, { color: accent }]}>Saved</Text>
          </View>
        )}
        <TouchableOpacity
          onPress={() => speak(hit.word.english)}
          hitSlop={8}
          style={[styles.speaker, { backgroundColor: colors.background }]}
          accessibilityRole="button"
          accessibilityLabel={`Listen to "${hit.word.english}"`}
        >
          <MaterialIcons name="volume-up" size={18} color={accent} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const renderStartState = () => (
    <View style={styles.startState}>
      {recent.length > 0 && (
        <View style={styles.block}>
          <View style={styles.blockHeader}>
            <Text style={[styles.eyebrow, { color: colors.secondaryText }]}>Recent</Text>
            <TouchableOpacity
              onPress={() => {
                void clearRecentSearches();
                setRecent([]);
              }}
              accessibilityRole="button"
              accessibilityLabel="Clear recent searches"
              hitSlop={8}
            >
              <Text style={[styles.clearText, { color: colors.secondaryText }]}>Clear</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.pillRow}>
            {recent.map((item) => (
              <TouchableOpacity
                key={item}
                onPress={() => setQuery(item)}
                activeOpacity={0.85}
                style={[styles.pill, cardShadow, { backgroundColor: colors.card }]}
                accessibilityRole="button"
                accessibilityLabel={`Search again for ${item}`}
              >
                <MaterialIcons name="history" size={16} color={colors.secondaryText} />
                <Text style={[styles.pillText, { color: colors.text }]}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      <View style={styles.block}>
        <Text style={[styles.eyebrow, { color: colors.secondaryText }]}>Try a lesson</Text>
        <View style={styles.pillRow}>
          {suggestions.map((title) => (
            <TouchableOpacity
              key={title}
              onPress={() => setQuery(title)}
              activeOpacity={0.85}
              style={[styles.pill, { backgroundColor: accentSoft }]}
              accessibilityRole="button"
              accessibilityLabel={`Search for ${title}`}
            >
              <Text style={[styles.pillText, { color: isDarkMode ? '#CFF3DE' : '#1C3D2A' }]}>{title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <Text style={[styles.hint, { color: colors.secondaryText }]}>
        Search a word in English or French. Accents don’t matter: “ete” finds “été”.
      </Text>
    </View>
  );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingTop: topContentInset, paddingBottom: insets.bottom + 32 }}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.column}>
      <BackButton onPress={() => navigation.goBack()} />
      <Text style={[styles.title, { color: colors.text }]}>Search</Text>

      <View style={[styles.searchBox, { backgroundColor: colors.card, borderColor: focused ? accent : lineColor }]}>
        <MaterialIcons name="search" size={22} color={colors.secondaryText} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onSubmitEditing={rememberSearch}
          returnKeyType="search"
          placeholder="A word or a lesson"
          placeholderTextColor={colors.secondaryText}
          style={[styles.input, { color: colors.text }]}
          autoFocus
          autoCorrect={false}
          autoCapitalize="none"
          accessibilityLabel="Search words and lessons"
        />
        {!!query && (
          <TouchableOpacity onPress={() => setQuery('')} accessibilityRole="button" accessibilityLabel="Clear search" hitSlop={8}>
            <MaterialIcons name="close" size={22} color={colors.secondaryText} />
          </TouchableOpacity>
        )}
      </View>

      {!hasQuery && renderStartState()}

      {isEmpty && (
        <View style={styles.emptyState}>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Nothing found</Text>
          <Text style={[styles.hint, styles.hintCentered, { color: colors.secondaryText }]}>
            No lesson or word matches “{query.trim()}”. Try fewer letters, or the other language.
          </Text>
        </View>
      )}

      {hasQuery && !isEmpty && (
        <>
          <View style={styles.chipsRow}>
            {renderChip('all', 'All', results.lessons.length + results.words.length)}
            {renderChip('lessons', 'Lessons', results.lessons.length)}
            {renderChip('words', 'Words', results.words.length)}
          </View>

          {showLessons && (
            <View style={styles.section}>
              <Text style={[styles.eyebrow, { color: colors.secondaryText }]}>Lessons</Text>
              {results.lessons.map(renderLessonRow)}
            </View>
          )}

          {showWords && (
            <View style={styles.section}>
              <Text style={[styles.eyebrow, { color: colors.secondaryText }]}>Words</Text>
              {results.words.map(renderWordRow)}
            </View>
          )}
        </>
      )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  // Keeps lines readable on tablets and wide browser windows.
  column: { width: '100%', maxWidth: 680, alignSelf: 'center' },
  title: { fontSize: 36, lineHeight: 42, fontWeight: '900', paddingHorizontal: 20, paddingBottom: 12 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 20,
    minHeight: 56,
    borderRadius: 18,
    borderWidth: 2,
    paddingHorizontal: 16,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 10,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none', outlineWidth: 0 } as object) : null),
  },
  startState: { marginTop: 20, paddingHorizontal: 20, gap: 22 },
  block: { gap: 10 },
  blockHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  eyebrow: { fontSize: 13, lineHeight: 18, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.1 },
  clearText: { fontSize: 13, lineHeight: 18, fontWeight: '700' },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 99, paddingHorizontal: 14, paddingVertical: 8 },
  pillText: { fontSize: 14, lineHeight: 18, fontWeight: '700' },
  hint: { fontSize: 14, lineHeight: 20, fontWeight: '600' },
  hintCentered: { textAlign: 'center' },
  emptyState: { marginTop: 40, paddingHorizontal: 32, alignItems: 'center', gap: 8 },
  emptyTitle: { fontSize: 24, lineHeight: 30, fontWeight: '800' },
  chipsRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, marginTop: 16 },
  chip: { borderRadius: 99, paddingHorizontal: 16, paddingVertical: 8 },
  chipText: { fontSize: 14, lineHeight: 18, fontWeight: '800' },
  section: { marginTop: 20, paddingHorizontal: 20, gap: 10 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 64,
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  rowIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  rowThumb: { width: '100%', height: '100%' },
  rowCopy: { flex: 1, minWidth: 0 },
  rowTitle: { fontSize: 17, lineHeight: 23, fontWeight: '800' },
  rowMeta: { fontSize: 13, lineHeight: 18, fontWeight: '600' },
  wordFrench: { fontSize: 20, lineHeight: 26, fontWeight: '800' },
  wordEnglish: { fontSize: 15, lineHeight: 20, fontWeight: '700' },
  savedBadge: { flexDirection: 'row', alignItems: 'center', gap: 2, borderRadius: 99, paddingHorizontal: 8, paddingVertical: 3 },
  savedText: { fontSize: 12, lineHeight: 16, fontWeight: '800' },
  speaker: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
});
