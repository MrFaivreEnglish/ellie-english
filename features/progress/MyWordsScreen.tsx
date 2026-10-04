import React from 'react';
import { ActivityIndicator, Platform, ScrollView, StyleSheet, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image as ExpoImage } from 'expo-image';
import type { RootStackParamList } from '../../types/navigationTypes';
import Text, { ThemedTextInput as TextInput } from '../shared/ThemedText';
import MaterialIcons from '../shared/ThemedMaterialIcon';
import BackButton from '../shared/BackButton';
import { useTheme } from '../settings/ThemeContext';
import { DesktopTypographyProvider } from '../shared/DesktopTypography';
import { getDesktopContentMaxWidth, getDesktopTypographyScale, getTopSafeAreaInset, isDesktopWebWidth } from '../shared/responsiveLayout';
import { getSoftShadow } from '../shared/uiPrimitives';
import { useEnglishSpeech } from '../shared/useEnglishSpeech';
import { getLearningLibrary, type LearningLibrary } from './learningLibrary';
import { getTodayKey } from '../vocabulary/reviewWordsStorage';
import { openWordReview } from '../vocabulary/wordReviewLesson';
import WeeklyGoalCard from './WeeklyGoalCard';
import { getPracticeWeek, type PracticeWeek } from './weeklyGoal';

// What a student has learnt and what's waiting for review, opened from Home or their profile.

// The review list can grow long; the rest are summarised in a "+N more" line.
const MAX_REVIEW_ROWS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;
// Lesson groups cycle through these so a long list is easy to scan.
const GROUP_ACCENTS = ['#3A8F5C', '#1F7AD1', '#D4681D', '#7654D4', '#D63B55', '#1687A7'];

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
  const { speak } = useEnglishSpeech();
  const insets = useSafeAreaInsets();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const isDesktopWeb = isDesktopWebWidth(windowWidth, undefined, windowHeight);
  const desktopContentMaxWidth = getDesktopContentMaxWidth(windowWidth, 'fit', windowHeight);
  const desktopScale = getDesktopTypographyScale(windowWidth, windowHeight, 'fit');
  const topContentInset = getTopSafeAreaInset(Platform.OS, insets.top, isAndroidStatusBarEnabled);

  const [library, setLibrary] = React.useState<LearningLibrary | null>(null);
  const [week, setWeek] = React.useState<PracticeWeek | null>(null);
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
      getPracticeWeek()
        .then((next) => {
          if (active) setWeek(next);
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

  const buttonColor = colors.buttonBackground ?? colors.primary;
  const buttonTextColor = colors.buttonText ?? '#fff';
  const cardStyle = [
    styles.card,
    getSoftShadow(isDarkMode, 'soft', colors.shadow ?? colors.border, colors.visualStyle === 'pixel'),
    { backgroundColor: colors.card, borderColor: colors.border },
  ];
  const heroBackground = isDarkMode ? colors.successSoft : '#E3F6E8';

  const renderSpeaker = (text: string) => (
    <TouchableOpacity
      onPress={() => speak(text)}
      hitSlop={8}
      style={[styles.speakerButton, { backgroundColor: colors.surface }]}
      accessibilityRole="button"
      accessibilityLabel={`Listen to "${text}"`}
    >
      <MaterialIcons name="volume-up" size={Math.round(16 * desktopScale)} color={colors.primary} />
    </TouchableOpacity>
  );

  const renderHero = (data: LearningLibrary) => {
    const progress = data.totalWordCount > 0 ? Math.min(1, data.learnedWordCount / data.totalWordCount) : 0;
    const accent = isDarkMode ? '#7DD9A0' : '#2F7D4F';

    return (
      <View style={[styles.hero, { backgroundColor: heroBackground, borderColor: isDarkMode ? colors.border : '#BFE6CB' }]}>
        <View style={styles.heroTop}>
          <View style={[styles.heroIcon, { backgroundColor: isDarkMode ? colors.card : '#fff' }]}>
            <MaterialIcons name="menu-book" size={Math.round(26 * desktopScale)} color={accent} />
          </View>
          <View style={styles.heroCopy}>
            <Text style={[styles.heroNumber, { color: colors.text }]}>{data.learnedWordCount}</Text>
            <Text style={[styles.heroLabel, { color: colors.secondaryText }]}>
              {data.learnedWordCount === 1 ? 'word learnt' : 'words learnt'}
            </Text>
          </View>
        </View>
        {data.totalWordCount > 0 && (
          <View style={styles.heroProgress}>
            <View style={[styles.heroTrack, { backgroundColor: isDarkMode ? colors.progressTrack ?? colors.border : '#fff' }]}>
              <View style={[styles.heroFill, { width: `${Math.max(progress * 100, data.learnedWordCount > 0 ? 3 : 0)}%`, backgroundColor: accent }]} />
            </View>
            <Text style={[styles.heroProgressText, { color: colors.secondaryText }]}>
              {data.learnedWordCount} of {data.totalWordCount} words in Ellie
            </Text>
          </View>
        )}
        {data.dueReviewCount > 0 ? (
          <TouchableOpacity
            onPress={startReview}
            activeOpacity={0.85}
            style={[styles.heroButton, { backgroundColor: buttonColor }]}
            accessibilityRole="button"
          >
            <MaterialIcons name="keyboard" size={Math.round(18 * desktopScale)} color={buttonTextColor} />
            <Text style={[styles.heroButtonText, { color: buttonTextColor }]}>
              {data.dueReviewCount === 1 ? 'Review 1 word now' : `Review ${data.dueReviewCount} words now`}
            </Text>
          </TouchableOpacity>
        ) : (
          <Text style={[styles.heroHint, { color: colors.secondaryText }]}>
            {data.learnedWordCount === 0
              ? 'Tap ✓ on a flashcard to save a word here.'
              : 'Nothing to review right now. Nice work!'}
          </Text>
        )}
      </View>
    );
  };

  const renderStat = (icon: React.ComponentProps<typeof MaterialIcons>['name'], value: number, label: string, accent: string, tint: string) => (
    <View key={label} style={[styles.statTile, { backgroundColor: isDarkMode ? colors.card : tint, borderColor: isDarkMode ? colors.border : 'transparent' }]}>
      <MaterialIcons name={icon} size={Math.round(20 * desktopScale)} color={accent} />
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.secondaryText }]} numberOfLines={2}>{label}</Text>
    </View>
  );

  const renderSectionTitle = (icon: React.ComponentProps<typeof MaterialIcons>['name'], title: string, accent: string) => (
    <View style={styles.cardHeader}>
      <View style={[styles.cardHeaderIcon, { backgroundColor: accent + '22' }]}>
        <MaterialIcons name={icon} size={Math.round(18 * desktopScale)} color={accent} />
      </View>
      <Text style={[styles.cardTitle, { color: colors.text }]}>{title}</Text>
    </View>
  );

  const renderReviewSection = (data: LearningLibrary) => {
    const { reviewWords } = data;

    return (
      <View style={cardStyle}>
        {renderSectionTitle('replay', 'Words to review', colors.warning)}
        {reviewWords.length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.secondaryText }]}>
            Nothing to review. Words you get wrong while typing, or mark “not yet” on a flashcard, come back here a day later.
          </Text>
        ) : (
          <>
            <Text style={[styles.cardIntro, { color: colors.secondaryText }]}>
              Get each word right 3 times, a few days apart, and it leaves the list.
            </Text>
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
                  <View style={[styles.duePill, { backgroundColor: isDue ? colors.warning + '26' : colors.surface }]}>
                    <Text style={[styles.dueLabel, { color: isDue ? colors.warning : colors.secondaryText }]}>
                      {getDueLabel(word.dueOn, today)}
                    </Text>
                  </View>
                  {renderSpeaker(word.english)}
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

  const renderLearnedSection = (data: LearningLibrary) => (
    <View style={cardStyle}>
      {renderSectionTitle('style', 'Words learnt', colors.success)}
      {data.learnedWordCount === 0 ? (
        <Text style={[styles.emptyText, { color: colors.secondaryText }]}>
          No words yet. Tap ✓ on a flashcard and the word appears here, under its lesson.
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
          {visibleGroups.map((group, index) => {
            const accent = GROUP_ACCENTS[index % GROUP_ACCENTS.length];
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
                  <View style={[styles.lessonBadge, { backgroundColor: accent + '22' }]}>
                    {group.thumbnail ? (
                      <ExpoImage
                        source={group.thumbnail as any}
                        style={styles.lessonThumb}
                        contentFit="contain"
                        cachePolicy="memory-disk"
                        accessibilityElementsHidden
                      />
                    ) : (
                      <Text style={[styles.lessonBadgeText, { color: accent }]}>{group.lessonTitle.charAt(0).toUpperCase()}</Text>
                    )}
                  </View>
                  <View style={styles.lessonCopy}>
                    <Text style={[styles.lessonTitle, { color: colors.text }]} numberOfLines={1}>{group.lessonTitle}</Text>
                    <View style={styles.lessonBarRow}>
                      <View style={[styles.lessonBarTrack, { backgroundColor: colors.progressTrack ?? colors.border }]}>
                        <View
                          style={[
                            styles.lessonBarFill,
                            {
                              backgroundColor: accent,
                              width: `${Math.min(100, Math.round((group.words.length / Math.max(1, group.lessonWordCount)) * 100))}%`,
                            },
                          ]}
                        />
                      </View>
                      <Text style={[styles.lessonBarText, { color: colors.secondaryText }]}>
                        {group.words.length}/{Math.max(group.lessonWordCount, group.words.length)}
                      </Text>
                    </View>
                  </View>
                  <MaterialIcons
                    name={isOpen ? 'expand-less' : 'expand-more'}
                    size={Math.round(22 * desktopScale)}
                    color={colors.secondaryText}
                  />
                </TouchableOpacity>
                {isOpen && group.words.map((word) => (
                  <View key={`${word.english}|${word.french}`} style={[styles.learnedRow, { backgroundColor: colors.surface }]}>
                    <Text style={[styles.wordEnglish, styles.learnedEnglish, { color: colors.text }]}>{word.english}</Text>
                    <Text style={[styles.wordFrench, styles.learnedFrench, { color: colors.secondaryText }]}>{word.french}</Text>
                    {renderSpeaker(word.english)}
                  </View>
                ))}
              </View>
            );
          })}
        </>
      )}
    </View>
  );

  const renderGrammarSection = (data: LearningLibrary) => {
    if (data.grammarLessons.length === 0) return null;

    return (
      <View style={cardStyle}>
        {renderSectionTitle('edit', 'Grammar practised', colors.primary)}
        {data.grammarLessons.map((lesson) => (
          <View key={lesson.title} style={[styles.wordRow, { borderTopColor: colors.border }]}>
            <Text style={[styles.wordEnglish, styles.wordCopy, { color: colors.text }]} numberOfLines={2}>{lesson.title}</Text>
            <View style={[styles.duePill, { backgroundColor: colors.primarySoft }]}>
              <Text style={[styles.dueLabel, { color: colors.primary }]}>
                {lesson.answers === 1 ? '1 answer' : `${lesson.answers} answers`}
              </Text>
            </View>
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
              Everything you’ve learnt, in one place.
            </Text>
          </View>

          {!library ? (
            <ActivityIndicator style={styles.loading} color={colors.primary} />
          ) : (
            <>
              {renderHero(library)}
              {week && (
                <WeeklyGoalCard
                  week={week}
                  onGoalChange={(goal) => setWeek((current) => current && ({ ...current, goal, goalReached: current.daysPractised >= goal }))}
                />
              )}
              <View style={styles.statsRow}>
                {renderStat('replay', library.dueReviewCount, 'To review now', colors.warning, '#FFF1D6')}
                {renderStat('verified', library.masteredReviewCount, 'Mistakes fixed', colors.primary, '#DCEBFF')}
                {renderStat('edit', library.grammarAnswerCount, 'Grammar answers', colors.danger, '#FFE3E8')}
              </View>
              {renderReviewSection(library)}
              {renderLearnedSection(library)}
              {renderGrammarSection(library)}
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
    paddingBottom: 10,
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
  hero: {
    marginHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  heroIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCopy: {
    flex: 1,
    minWidth: 0,
  },
  heroNumber: {
    fontSize: 38,
    lineHeight: 42,
    fontWeight: '900',
  },
  heroLabel: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '800',
  },
  heroProgress: {
    gap: 6,
  },
  heroTrack: {
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
  },
  heroFill: {
    height: '100%',
    borderRadius: 5,
  },
  heroProgressText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
  },
  heroButton: {
    minHeight: 48,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  heroButtonText: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '900',
  },
  heroHint: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 10,
  },
  statTile: {
    flex: 1,
    minWidth: 0,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 6,
    alignItems: 'center',
    gap: 2,
  },
  statValue: {
    fontSize: 22,
    lineHeight: 26,
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
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  cardHeaderIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
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
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    paddingVertical: 4,
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
  duePill: {
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  dueLabel: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '800',
  },
  speakerButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
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
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 10,
    minHeight: 44,
    marginBottom: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 8,
  },
  lessonGroup: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 2,
  },
  lessonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 60,
    paddingVertical: 6,
  },
  lessonBadge: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  lessonThumb: {
    width: '100%',
    height: '100%',
  },
  lessonCopy: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  lessonBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  lessonBarTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  lessonBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  lessonBarText: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '800',
  },
  lessonBadgeText: {
    fontSize: 14,
    fontWeight: '900',
  },
  lessonTitle: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '800',
  },
  countPill: {
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 2,
    minWidth: 28,
    alignItems: 'center',
  },
  lessonCount: {
    fontSize: 13,
    fontWeight: '900',
  },
  learnedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 10,
    paddingVertical: 7,
    paddingHorizontal: 10,
    marginBottom: 4,
  },
  learnedEnglish: {
    flex: 1,
  },
  learnedFrench: {
    flex: 1,
    textAlign: 'right',
  },
});
