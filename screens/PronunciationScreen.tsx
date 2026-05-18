import React, { useMemo, useState } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BackButton from '../components/BackButton';
import { useTheme } from '../contexts/ThemeContext';
import { pronunciationCategories } from '../content/pronunciationLessons';

export default function PronunciationScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { colors, isDarkMode, isAndroidStatusBarEnabled } = useTheme();
  const [searchText, setSearchText] = useState('');
  const topContentInset = Platform.OS === 'ios'
    ? insets.top
    : Platform.OS === 'android' && isAndroidStatusBarEnabled
      ? insets.top
      : 0;

  const filteredCategories = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    if (!query) return pronunciationCategories;

    return pronunciationCategories
      .map((category) => ({
        ...category,
        lessons: category.lessons.filter((lesson) =>
          [
            lesson.title,
            lesson.subtitle,
            lesson.category,
            lesson.goal,
            lesson.focus,
            lesson.tip,
            ...lesson.examples,
            ...(lesson.usefulPhrases ?? []),
            ...(lesson.ruleCards?.flatMap((rule) => [
              rule.title,
              rule.description,
              ...rule.examples,
            ]) ?? []),
          ]
            .join(' ')
            .toLowerCase()
            .includes(query)
        ),
      }))
      .filter((category) => category.lessons.length > 0);
  }, [searchText]);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{
        paddingTop: topContentInset,
        paddingBottom: insets.bottom + 24,
      }}
    >
      <BackButton label="Back to Home" onPress={() => (navigation as any).navigate('Home')} />

      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Pronunciation</Text>
        <Text style={[styles.headerSubtitle, { color: colors.secondaryText }]}>
          Practise short phrases you can reuse in class, revision, and oral tasks.
        </Text>
      </View>

      <View style={styles.searchWrap}>
        <TextInput
          value={searchText}
          onChangeText={setSearchText}
          placeholder="Search a situation..."
          placeholderTextColor={isDarkMode ? '#ffffff' : '#464646'}
          style={[
            styles.searchInput,
            {
              backgroundColor: isDarkMode ? '#3a5891' : '#ecf6ff',
              borderColor: isDarkMode ? '#ffffff' : '#134975',
              color: colors.text,
            },
          ]}
        />
        {searchText.length > 0 && (
          <TouchableOpacity style={styles.clearButton} onPress={() => setSearchText('')}>
            <MaterialIcons
              name="close"
              size={20}
              color={isDarkMode ? '#ffffff' : '#134975'}
            />
          </TouchableOpacity>
        )}
      </View>

      {filteredCategories.map((category) => (
        <View key={category.title} style={styles.categoryBlock}>
          <View style={styles.categoryHeader}>
            <Text style={styles.categoryEmoji}>{category.emoji}</Text>
            <View>
              <Text style={[styles.categoryTitle, { color: colors.text }]}>
                {category.title}
              </Text>
              <Text style={[styles.categoryCount, { color: colors.secondaryText }]}>
                {category.lessons.length} lesson{category.lessons.length > 1 ? 's' : ''}
              </Text>
            </View>
          </View>

          <View style={styles.lessonGrid}>
            {category.lessons.map((lesson) => (
              <TouchableOpacity
                key={lesson.title}
                style={[
                  styles.lessonCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: isDarkMode ? '#415a77' : '#e6edf5',
                  },
                ]}
                onPress={() =>
                  (navigation as any).navigate('PronunciationLesson', {
                    lesson,
                    categoryColor: category.color,
                  })
                }
                activeOpacity={0.86}
              >
                <View style={[styles.lessonIcon, { backgroundColor: category.color }]}>
                  <MaterialIcons name="record-voice-over" size={23} color="#ffffff" />
                </View>
                <Text style={[styles.lessonTitle, { color: colors.text }]}>
                  {lesson.title}
                </Text>
                <Text style={[styles.lessonSubtitle, { color: colors.secondaryText }]}>
                  {lesson.goal}
                </Text>
                <View style={styles.lessonFooter}>
                  <MaterialIcons name="volume-up" size={18} color={category.color} />
                  <Text style={[styles.lessonMeta, { color: category.color }]}>
                    Phrases + sounds
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 8 },
  headerTitle: { fontSize: 32, fontWeight: 'bold' },
  headerSubtitle: { fontSize: 16, lineHeight: 22, marginTop: 6 },
  searchWrap: { marginHorizontal: 16, position: 'relative' },
  searchInput: {
    borderRadius: 12,
    borderWidth: 2,
    fontSize: 16,
    marginBottom: 18,
    marginTop: 10,
    minHeight: 50,
    paddingHorizontal: 15,
    paddingRight: 45,
  },
  clearButton: {
    alignItems: 'center',
    bottom: 18,
    justifyContent: 'center',
    position: 'absolute',
    right: 12,
    top: 10,
    width: 36,
  },
  categoryBlock: { marginBottom: 18, paddingHorizontal: 16 },
  categoryHeader: { alignItems: 'center', flexDirection: 'row', marginBottom: 12 },
  categoryEmoji: { fontSize: 32, marginRight: 8 },
  categoryTitle: { fontSize: 24, fontWeight: 'bold' },
  categoryCount: { fontSize: 14, fontWeight: '600', marginTop: 2 },
  lessonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  lessonCard: {
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: 14,
    minHeight: 172,
    padding: 14,
    width: '48%',
  },
  lessonIcon: {
    alignItems: 'center',
    borderRadius: 8,
    height: 42,
    justifyContent: 'center',
    marginBottom: 10,
    width: 42,
  },
  lessonTitle: { fontSize: 18, fontWeight: '800', marginBottom: 6 },
  lessonSubtitle: { flex: 1, fontSize: 14, fontWeight: '600', lineHeight: 19 },
  lessonFooter: { alignItems: 'center', flexDirection: 'row', marginTop: 12 },
  lessonMeta: { fontSize: 13, fontWeight: '800', marginLeft: 4 },
});
