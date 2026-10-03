import React from 'react';
import { ActivityIndicator, Platform, ScrollView, StyleSheet, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { RootStackParamList } from '../../types/navigationTypes';
import Text, { ThemedTextInput as TextInput } from '../shared/ThemedText';
import MaterialIcons from '../shared/ThemedMaterialIcon';
import BackButton from '../shared/BackButton';
import { useTheme } from '../settings/ThemeContext';
import { DesktopTypographyProvider } from '../shared/DesktopTypography';
import { getDesktopContentMaxWidth, getDesktopTypographyScale, getTopSafeAreaInset, isDesktopWebWidth } from '../shared/responsiveLayout';
import { getSoftShadow } from '../shared/uiPrimitives';
import { getLearningLibrary, type LearningLibrary } from './learningLibrary';
import { getTodayKey } from '../vocabulary/reviewWordsStorage';
import { openWordReview } from '../vocabulary/wordReviewLesson';

// What a student has learnt and what's waiting for review, opened from their profile.

// The review list can grow long; the rest are summarised in a "+N more" line.
const MAX_REVIEW_ROWS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

const getDueLabel = (dueOn: string, today: string) => {
  if (dueOn <= today) return 'Due now';
  const days = Math.round((Date.parse(dueOn) - Date.parse(today)) / DAY_MS);
  return days === 1 ? 'Tomorrow' : `In ${days} days`;
};

const matchesSearch = (query: string, ...values: string[]) =>
  values.some((value) => value.toLowerCase().includes(query));

export default function MyWordsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { colors, isDarkMode, isAndroidStatusBarEnabled } = useTheme();
  const insets = useSafeAreaInsets();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const isDesktopWeb = isDesktopWebWidth(windowWidth, undefined, windowHeight);
  const desktopContentMaxWidth = getDesktopContentMaxWidth(windowWidth, 'fit', windowHeight);
  const desktopScale = getDesktopTypographyScale(windowWidth, windowHeight, 'fit');
  const topContentInset = getTopSafeAreaInset(Platform.OS, insets.top, isAndroidStatusBarEnabled);

  const [library, setLibrary] = React.useState<LearningLibrary | null>(null);
  const [search, setSearch] = React.useState('');
  const [openLessons, setOpenLessons] = React.useState<Set<string>>(() => new Set());

  // Reload on focus so a review session finished elsewhere shows up on return.
  useFocusEffect(
    React.useCallback(() => {
      let active = true;
      getLearningLibrary()
        .then((next) => {
          if (active) setLibrary(next);
        })
        .catch(() => {});
      return () => {
        active = false;
      };
    }, [])
  );

  const today = getTodayKey();
  const query = search.trim().toLowerCase();
  const visibleGroups = React.useMemo(() => {
    if (!library) return [];
    if (!query) return library.learnedGroups;
    return library.learnedGroups
      .map((group) => ({
        ...group,
        words: group.words.filter((word) => matchesSearch(query, word.english, word.french)),
      }))
      .filter((group) => group.words.length > 0);
  }, [library, query]);

  const toggleLesson = (title: string) => {
    setOpenLessons((current) => {
      const next = new Set(current);
      if (next.has(title)) next.delete(title); else next.add(title);
      return next;
    });
  };

  const startReview = () => {
    if (!library) return;
    const dueWords = library.reviewWords.filter((word) => word.dueOn <= today);
    openWordReview(navigation, dueWords, { backLabel: 'Back to My words', backTarget: 'MyWords' });
  };

  const cardStyle = [
    styles.card,
    getSoftShadow(isDarkMode, 'soft', colors.shadow ?? colors.border, colors.visualStyle === 'pixel'),
    { backgroundColor: colors.card, borderColor: colors.border },
  ];

  const renderStat = (icon: React.ComponentProps<typeof MaterialIcons>['name'], value: number, label: string, accent: string) => (
    <View key={label} style={[styles.statTile, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <MaterialIcons name={icon} size={Math.round(20 * desktopScale)} color={accent} />
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.secondaryText }]} numberOfLines={2}>{label}</Text>
    </View>
  );

  const renderReviewSection = () => {
    if (!library) return null;
    const { reviewWords, dueReviewCount } = library;

    return (
      <View style={cardStyle}>
        <View style={styles.cardHeader}>
          <MaterialIcons name="replay" size={Math.round(20 * desktopScale)} color={colors.warning} />
          <Text style={[styles.cardTitle, { color: colors.text }]}>Words to review</Text>
        </View>
        {reviewWords.length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.secondaryText }]}>
            Nothing to review. Words you get wrong while typing come back here a day later.
          </Text>
        ) : (
          <>
            <Text style={[styles.cardIntro, { color: colors.secondaryText }]}>
              Words you got wrong while typing. Get each one right 3 times, a few days apart, and it leaves the list.
            </Text>
            {dueReviewCount > 0 && (
              <TouchableOpacity
                onPress={startReview}
                activeOpacity={0.85}
                style={[styles.primaryButton, { backgroundColor: colors.buttonBackground ?? colors.primary }]}
                accessibilityRole="button"
              >
                <MaterialIcons name="keyboard" size={Math.round(18 * desktopScale)} color={colors.buttonText ?? '#fff'} />
                <Text style={[styles.primaryButtonText, { color: colors.buttonText ?? '#fff' }]}>
                  {dueReviewCount === 1 ? 'Review 1 word now' : `Review ${dueReviewCount} words now`}
                </Text>
              </TouchableOpacity>
            )}
            {reviewWords.slice(0, MAX_REVIEW_ROWS).map((word) => {
              const isDue = word.dueOn <= today;
              return (
                <View key={`${word.english}|${word.french}`} style={[styles.wordRow, { borderTopColor: colors.border }]}>
                  <View style={styles.wordCopy}>
                    <Text style={[styles.wordEnglish, { color: colors.text }]}>{word.english}</Text>
                    <Text style={[styles.wordFrench, { color: colors.secondaryText }]}>
                      {word.french}{word.lessonTitle ? ` · ${word.lessonTitle}` : ''}
                    </Text>
                  </View>
                  <Text style={[styles.dueLabel, { color: isDue ? colors.warning : colors.secondaryText }]}>
                    {getDueLabel(word.dueOn, today)}
                  </Text>
                </View>
              );
            })}
            {reviewWords.length > MAX_REVIEW_ROWS && (
              <Text style={[styles.moreText, { color: colors.secondaryText }]}>
                +{reviewWords.length - MAX_REVIEW_ROWS} more
              </Text>
            )}
          </>
        )}
      </View>
    );
  };

  const renderLearnedSection = () => {
    if (!library) return null;

    return (
      <View style={cardStyle}>
        <View style={styles.cardHeader}>
          <MaterialIcons name="style" size={Math.round(20 * desktopScale)} color={colors.success} />
          <Text style={[styles.cardTitle, { color: colors.text }]}>Words learnt</Text>
        </View>
        {library.learnedWordCount === 0 ? (
          <Text style={[styles.emptyText, { color: colors.secondaryText }]}>
            No words yet. Mark a flashcard as learnt and it appears here, under its lesson.
          </Text>
        ) : (
          <>
            <View style={[styles.searchBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <MaterialIcons name="search" size={Math.round(18 * desktopScale)} color={colors.secondaryText} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search in English or French"
                placeholderTextColor={colors.secondaryText}
                style={[styles.searchInput, { color: colors.text }]}
                autoCorrect={false}
                autoCapitalize="none"
                accessibilityLabel="Search learnt words"
              />
              {!!search && (
                <TouchableOpacity onPress={() => setSearch('')} accessibilityRole="button" accessibilityLabel="Clear search" hitSlop={8}>
                  <MaterialIcons name="close" size={Math.round(18 * desktopScale)} color={colors.secondaryText} />
                </TouchableOpacity>
              )}
            </View>
            {visibleGroups.length === 0 && (
              <Text style={[styles.emptyText, { color: colors.secondaryText }]}>No learnt word matches “{search.trim()}”.</Text>
            )}
            {visibleGroups.map((group) => {
              // Searching opens every lesson with a match, so results are visible at once.
              const isOpen = !!query || openLessons.has(group.lessonTitle);
              return (
                <View key={group.lessonTitle} style={[styles.lessonGroup, { borderTopColor: colors.border }]}>
                  <TouchableOpacity
                    onPress={() => toggleLesson(group.lessonTitle)}
                    disabled={!!query}
                    activeOpacity={0.8}
                    style={styles.lessonHeader}
                    accessibilityRole="button"
                    accessibilityState={{ expanded: isOpen }}
                    accessibilityLabel={`${group.lessonTitle}, ${group.words.length} ${group.words.length === 1 ? 'word' : 'words'}`}
                  >
                    <Text style={[styles.lessonTitle, { color: colors.text }]} numberOfLines={1}>{group.lessonTitle}</Text>
                    <Text style={[styles.lessonCount, { color: colors.secondaryText }]}>{group.words.length}</Text>
                    <MaterialIcons
                      name={isOpen ? 'expand-less' : 'expand-more'}
                      size={Math.round(22 * desktopScale)}
                      color={colors.secondaryText}
                    />
                  </TouchableOpacity>
                  {isOpen && group.words.map((word) => (
                    <View key={`${word.english}|${word.french}`} style={styles.learnedRow}>
                      <Text style={[styles.wordEnglish, styles.learnedEnglish, { color: colors.text }]}>{word.english}</Text>
                      <Text style={[styles.wordFrench, styles.learnedFrench, { color: colors.secondaryText }]}>{word.french}</Text>
                    </View>
                  ))}
                </View>
              );
            })}
          </>
        )}
      </View>
    );
  };

  const renderGrammarSection = () => {
    if (!library || library.grammarLessons.length === 0) return null;

    return (
      <View style={cardStyle}>
        <View style={styles.cardHeader}>
          <MaterialIcons name="edit" size={Math.round(20 * desktopScale)} color={colors.primary} />
          <Text style={[styles.cardTitle, { color: colors.text }]}>Grammar practised</Text>
        </View>
        {library.grammarLessons.map((lesson) => (
          <View key={lesson.title} style={[styles.wordRow, { borderTopColor: colors.border }]}>
            <Text style={[styles.wordEnglish, styles.wordCopy, { color: colors.text }]} numberOfLines={2}>{lesson.title}</Text>
            <Text style={[styles.dueLabel, { color: colors.secondaryText }]}>
              {lesson.answers === 1 ? '1 answer' : `${lesson.answers} answers`}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  return (
    <DesktopTypographyProvider mode="fit">
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={{ paddingTop: topContentInset, paddingBottom: insets.bottom + 32 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={isDesktopWeb && [styles.desktopContentWrap, { maxWidth: desktopContentMaxWidth }]}>
          <BackButton onPress={() => navigation.goBack()} />

          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>My words</Text>
            <Text style={[styles.subtitle, { color: colors.secondaryText }]}>
              What you’ve learnt so far, and what to review.
            </Text>
          </View>

          {!library ? (
            <ActivityIndicator style={styles.loading} color={colors.primary} />
          ) : (
            <>
              <View style={styles.statsRow}>
                {renderStat('style', library.learnedWordCount, 'Words learnt', colors.success)}
                {renderStat('replay', library.dueReviewCount, 'To review now', colors.warning)}
                {renderStat('verified', library.masteredReviewCount, 'Mistakes fixed', colors.primary)}
                {renderStat('edit', library.grammarAnswerCount, 'Grammar answers', colors.danger)}
              </View>
              {renderReviewSection()}
              {renderLearnedSection()}
              {renderGrammarSection()}
            </>
          )}
        </View>
      </ScrollView>
    </DesktopTypographyProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  desktopContentWrap: {
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  title: {
    fontSize: 30,
    fontWeight: '900',
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
    marginTop: 4,
  },
  loading: {
    marginTop: 40,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 4,
  },
  statTile: {
    flex: 1,
    minWidth: 0,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
    gap: 2,
  },
  statValue: {
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '900',
  },
  statLabel: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  card: {
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '900',
  },
  cardIntro: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    paddingVertical: 4,
  },
  primaryButton: {
    minHeight: 46,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 8,
  },
  primaryButtonText: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '900',
  },
  wordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 9,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  wordCopy: {
    flex: 1,
    minWidth: 0,
  },
  wordEnglish: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '800',
  },
  wordFrench: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  dueLabel: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '800',
  },
  moreText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    paddingTop: 8,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    minHeight: 42,
    marginBottom: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 8,
  },
  lessonGroup: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  lessonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 44,
  },
  lessonTitle: {
    flex: 1,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '800',
  },
  lessonCount: {
    fontSize: 13,
    fontWeight: '800',
  },
  learnedRow: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 5,
    paddingLeft: 4,
  },
  learnedEnglish: {
    flex: 1,
  },
  learnedFrench: {
    flex: 1,
    textAlign: 'right',
  },
});
