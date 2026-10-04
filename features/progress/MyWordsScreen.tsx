import React from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, TouchableOpacity, useWindowDimensions, View } from 'react-native';
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
import { getDesktopContentMaxWidth, getTopSafeAreaInset, isDesktopWebWidth } from '../shared/responsiveLayout';
import { useEnglishSpeech } from '../shared/useEnglishSpeech';
import useReducedMotion from '../shared/useReducedMotion';
import { getLearningLibrary, type LearnedWordGroup, type LearningLibrary } from './learningLibrary';
import { openWordReview } from '../vocabulary/wordReviewLesson';
import WeeklyGoalCard from './WeeklyGoalCard';
import { getPracticeWeek, type PracticeWeek } from './weeklyGoal';

// What a student has learnt, one next action, and a searchable bank of every word saved.
// Layout and colour follow the My Words design brief; the page background is the theme's.

const MILESTONE_STEP = 25;
const WIDE_LAYOUT = 700;
// Each colour has one job: green is progress, coral is "needs attention".
const LIGHT = {
  line: '#E6E3DB',
  greenBg: '#D3F5E0',
  green: '#2F9B5C',
  greenShade: '#1F7340',
  greenInk: '#1C3D2A',
  greenDark: '#BDEBCF',
  coralBg: '#FADFD3',
  coral: '#DB6A45',
  coralShade: '#B04A28',
  coralInk: '#5B2412',
};
const DARK = {
  line: '#2C3340',
  greenBg: '#17382A',
  green: '#3DB873',
  greenShade: '#237A4B',
  greenInk: '#CFF3DE',
  greenDark: '#1F4A37',
  coralBg: '#3F2218',
  coralInk: '#FBE0D5',
  coral: '#E8744F',
  coralShade: '#B9502C',
};
// Topic tints share lightness and chroma and change only hue: [background, bar].
const TOPIC_TINTS: Array<[string, string]> = [
  ['#D8F3E2', '#2FA063'],
  ['#DCE8FB', '#4A7FD6'],
  ['#FBE3D2', '#D9753F'],
  ['#EBDDF8', '#9A62CF'],
  ['#FADDE0', '#D55C70'],
  ['#D5F0F3', '#2A9DAE'],
];
const TILTS = [-1.5, 1, -0.5, 1.5, -1, 0.5];

const formatNumber = (value: number) => String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

const normalize = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();

const tintFor = (title: string) => {
  let hash = 0;
  for (let i = 0; i < title.length; i += 1) hash = (hash + title.charCodeAt(i)) % 1009;
  return TOPIC_TINTS[hash % TOPIC_TINTS.length];
};

type TactileButtonProps = {
  label: string;
  icon?: React.ComponentProps<typeof MaterialIcons>['name'];
  color: string;
  shade: string;
  onPress: () => void;
  reducedMotion: boolean;
};

// A chunky button: it sits on a darker edge and presses down into it.
function TactileButton({ label, icon, color, shade, onPress, reducedMotion }: TactileButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.tactile,
        {
          backgroundColor: color,
          borderBottomColor: shade,
          borderBottomWidth: pressed ? 1 : 4,
          marginBottom: pressed ? 3 : 0,
          transform: pressed && !reducedMotion ? [{ translateY: 3 }] : undefined,
        },
      ]}
    >
      {icon && <MaterialIcons name={icon} size={20} color="#fff" />}
      <Text style={styles.tactileText}>{label}</Text>
    </Pressable>
  );
}

export default function MyWordsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { colors, isDarkMode, isAndroidStatusBarEnabled } = useTheme();
  const { speak } = useEnglishSpeech();
  const reducedMotion = useReducedMotion();
  const insets = useSafeAreaInsets();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const isDesktopWeb = isDesktopWebWidth(windowWidth, undefined, windowHeight);
  const desktopContentMaxWidth = getDesktopContentMaxWidth(windowWidth, 'fit', windowHeight);
  const topContentInset = getTopSafeAreaInset(Platform.OS, insets.top, isAndroidStatusBarEnabled);
  const wide = windowWidth >= WIDE_LAYOUT;
  const palette = isDarkMode ? DARK : LIGHT;
  const surface = colors.card;
  const ink = colors.text;
  const muted = colors.secondaryText;
  const cardShadow = { boxShadow: `0px 1px 0px ${palette.line}` } as const;

  const [library, setLibrary] = React.useState<LearningLibrary | null>(null);
  const [week, setWeek] = React.useState<PracticeWeek | null>(null);
  const [search, setSearch] = React.useState('');
  const [searchFocused, setSearchFocused] = React.useState(false);
  const [showGrammar, setShowGrammar] = React.useState(false);
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

  const query = normalize(search);
  // Matches French, English and the topic name; a topic that matches by name shows all its words.
  const visibleGroups = React.useMemo<LearnedWordGroup[]>(() => {
    if (!library) return [];
    if (!query) return library.learnedGroups;
    return library.learnedGroups
      .map((group) => {
        if (normalize(group.lessonTitle).includes(query)) return group;
        return {
          ...group,
          words: group.words.filter((word) => normalize(word.english).includes(query) || normalize(word.french).includes(query)),
        };
      })
      .filter((group) => group.words.length > 0);
  }, [library, query]);

  const toggleLesson = (title: string) => {
    setOpenLessons((current) => {
      const next = new Set(current);
      if (next.has(title)) next.delete(title); else next.add(title);
      return next;
    });
  };

  const dueWords = React.useMemo(() => {
    if (!library) return [];
    const today = new Date();
    const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    return library.reviewWords.filter((word) => word.dueOn <= todayKey);
  }, [library]);

  const startReview = () => openWordReview(navigation, dueWords, { backLabel: 'Back to My words', backTarget: 'MyWords' });
  const learnNewWords = () => navigation.navigate('MainTabs', { screen: 'Vocabulary' });

  const pageGutter = wide ? 24 : 20;
  const titleSize = wide ? 44 : 36;
  const sectionSize = wide ? 28 : 24;
  const heroNumberSize = wide ? 76 : 64;

  const renderSpeaker = (text: string) => (
    <TouchableOpacity
      onPress={() => speak(text)}
      hitSlop={8}
      style={[styles.speakerButton, { backgroundColor: colors.background }]}
      accessibilityRole="button"
      accessibilityLabel={`Listen to "${text}"`}
    >
      <MaterialIcons name="volume-up" size={16} color={palette.green} />
    </TouchableOpacity>
  );

  const renderProgressCard = (data: LearningLibrary) => {
    const learnt = data.learnedWordCount;
    const milestone = (Math.floor(learnt / MILESTONE_STEP) + 1) * MILESTONE_STEP;
    const toGo = milestone - learnt;
    // Progress through the current block of 25, so the bar always feels within reach.
    const fill = (learnt % MILESTONE_STEP) / MILESTONE_STEP;

    return (
      <View style={[styles.heroCard, cardShadow, { backgroundColor: palette.greenBg }]}>
        <View style={[styles.heroCircle, { backgroundColor: palette.greenDark }]} />
        <Text style={[styles.eyebrow, { color: palette.green }]}>{learnt > 0 ? 'Bravo !' : 'C’est parti !'}</Text>
        <View style={styles.heroNumberRow}>
          <Text style={[styles.heroNumber, { color: palette.greenInk, fontSize: heroNumberSize, lineHeight: heroNumberSize + 6 }]}>{learnt}</Text>
          <Text style={[styles.heroNumberLabel, { color: palette.greenInk }]}>{learnt === 1 ? 'word learnt' : 'words learnt'}</Text>
        </View>
        <Text style={[styles.milestoneText, { color: palette.greenInk }]}>
          Next milestone: {milestone} words · {toGo} to go
        </Text>
        <View style={[styles.heroTrack, { backgroundColor: isDarkMode ? '#0F261C' : '#FFFFFF' }]}>
          <View style={[styles.heroFill, { backgroundColor: palette.green, width: `${Math.max(fill * 100, learnt > 0 ? 3 : 0)}%` }]} />
        </View>
        {data.totalWordCount > 0 && (
          <Text style={[styles.caption, { color: palette.greenInk }]}>
            {formatNumber(learnt)} of {formatNumber(data.totalWordCount)} words in Ellie
          </Text>
        )}
      </View>
    );
  };

  const renderActionCard = () => {
    if (dueWords.length > 0) {
      const shown = dueWords.slice(0, 6);
      return (
        <View style={[styles.actionCard, cardShadow, { backgroundColor: palette.coralBg }]}>
          <Text style={[styles.eyebrow, { color: palette.coral }]}>Ready for another go</Text>
          <Text style={[styles.actionTitle, { color: palette.coralInk }]}>
            {dueWords.length === 1 ? '1 word wants a second look' : `${dueWords.length} words want a second look`}
          </Text>
          <View style={styles.chipRow}>
            {shown.map((word) => (
              <View key={`${word.english}|${word.french}`} style={[styles.chip, { backgroundColor: isDarkMode ? '#2A1710' : '#FFFFFF' }]}>
                <Text style={[styles.chipText, { color: palette.coralInk }]}>{word.english}</Text>
              </View>
            ))}
            {dueWords.length > shown.length && (
              <View style={[styles.chip, { backgroundColor: isDarkMode ? '#2A1710' : '#FFFFFF' }]}>
                <Text style={[styles.chipText, { color: palette.coral }]}>+{dueWords.length - shown.length}</Text>
              </View>
            )}
          </View>
          <TactileButton label="Start review" icon="keyboard" color={palette.coral} shade={palette.coralShade} onPress={startReview} reducedMotion={reducedMotion} />
        </View>
      );
    }

    return (
      <View style={[styles.actionCard, styles.actionCardEmpty, { backgroundColor: surface, borderColor: palette.line }]}>
        <Text style={[styles.eyebrow, { color: palette.green }]}>Rien à réviser</Text>
        <Text style={[styles.actionTitle, { color: ink }]}>All caught up. Fancy a few new words?</Text>
        <Text style={[styles.actionBody, { color: muted }]}>
          Words you get wrong while typing, or mark “not yet” on a flashcard, come back here a day later.
        </Text>
        <TactileButton label="Learn new words" icon="style" color={palette.green} shade={palette.greenShade} onPress={learnNewWords} reducedMotion={reducedMotion} />
      </View>
    );
  };

  const renderFreshThisWeek = (data: LearningLibrary) => {
    if (data.recentWords.length === 0) return null;

    return (
      <View>
        <Text style={[styles.eyebrow, styles.eyebrowPadded, { color: muted }]}>Fresh this week</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.freshRow}>
          {data.recentWords.map((word, index) => (
            <View
              key={`${word.english}|${word.french}`}
              style={[styles.freshCard, cardShadow, { backgroundColor: surface, transform: [{ rotate: `${TILTS[index % TILTS.length]}deg` }] }]}
            >
              <Text style={[styles.freshFrench, { color: ink }]} numberOfLines={1}>{word.french}</Text>
              <Text style={[styles.freshEnglish, { color: muted }]} numberOfLines={1}>{word.english}</Text>
            </View>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderTopicRow = (group: LearnedWordGroup) => {
    const [tintBg, tintBar] = tintFor(group.lessonTitle);
    const isOpen = !!query || openLessons.has(group.lessonTitle);
    const total = Math.max(group.lessonWordCount, group.words.length);

    return (
      <View key={group.lessonTitle} style={[styles.topicCard, cardShadow, { backgroundColor: surface }]}>
        <TouchableOpacity
          onPress={() => toggleLesson(group.lessonTitle)}
          disabled={!!query}
          activeOpacity={0.85}
          style={styles.topicHeader}
          accessibilityRole="button"
          accessibilityState={{ expanded: isOpen }}
          accessibilityLabel={`${group.lessonTitle}, ${group.words.length} ${group.words.length === 1 ? 'word' : 'words'}`}
        >
          <View style={[styles.topicIcon, { backgroundColor: isDarkMode ? tintBar + '33' : tintBg }]}>
            {group.thumbnail ? (
              <ExpoImage source={group.thumbnail as any} style={styles.topicThumb} contentFit="contain" cachePolicy="memory-disk" accessibilityElementsHidden />
            ) : (
              <MaterialIcons name="style" size={24} color={tintBar} />
            )}
          </View>
          <View style={styles.topicCopy}>
            <Text style={[styles.topicName, { color: ink }]} numberOfLines={1}>{group.lessonTitle}</Text>
            <View style={styles.topicBarRow}>
              <View style={[styles.topicTrack, { backgroundColor: isDarkMode ? '#2C3340' : tintBg }]}>
                <View style={[styles.topicFill, { backgroundColor: tintBar, width: `${Math.min(100, Math.round((group.words.length / Math.max(1, total)) * 100))}%` }]} />
              </View>
              <Text style={[styles.topicCount, { color: muted }]}>{group.words.length} of {total}</Text>
            </View>
          </View>
          <MaterialIcons
            name="expand-more"
            size={26}
            color={muted}
            style={isOpen ? styles.chevronOpen : undefined}
          />
        </TouchableOpacity>
        {isOpen && (
          <View style={[styles.tileGrid, { backgroundColor: colors.background }]}>
            {group.words.map((word) => (
              <View key={`${word.english}|${word.french}`} style={[styles.wordTile, { backgroundColor: surface }]}>
                <View style={styles.wordTileCopy}>
                  <Text style={[styles.tileFrench, { color: ink }]} numberOfLines={1}>{word.french}</Text>
                  <Text style={[styles.tileEnglish, { color: muted }]} numberOfLines={1}>{word.english}</Text>
                </View>
                {renderSpeaker(word.english)}
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderWordBank = (data: LearningLibrary) => (
    <View style={styles.bankSection}>
      <View style={styles.bankTitleRow}>
        <Text style={[styles.sectionTitle, { color: ink, fontSize: sectionSize, lineHeight: sectionSize + 6 }]}>Your word bank</Text>
        <View style={styles.bankLinks}>
          <Text style={[styles.bankLink, { color: muted }]}>{data.masteredReviewCount} mistakes fixed</Text>
          {data.grammarAnswerCount > 0 && (
            <TouchableOpacity
              onPress={() => setShowGrammar((current) => !current)}
              accessibilityRole="button"
              accessibilityState={{ expanded: showGrammar }}
              accessibilityLabel={`${data.grammarAnswerCount} grammar answers`}
              hitSlop={8}
            >
              <Text style={[styles.bankLink, { color: muted }]}>{data.grammarAnswerCount} grammar answers {showGrammar ? '↑' : '→'}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {showGrammar && data.grammarLessons.length > 0 && (
        <View style={[styles.grammarList, cardShadow, { backgroundColor: surface }]}>
          {data.grammarLessons.map((lesson) => (
            <View key={lesson.title} style={styles.grammarRow}>
              <Text style={[styles.grammarTitle, { color: ink }]} numberOfLines={2}>{lesson.title}</Text>
              <Text style={[styles.grammarCount, { color: muted }]}>{lesson.answers === 1 ? '1 answer' : `${lesson.answers} answers`}</Text>
            </View>
          ))}
        </View>
      )}

      <View
        style={[
          styles.searchBox,
          { backgroundColor: surface, borderColor: searchFocused ? palette.green : palette.line },
        ]}
      >
        <MaterialIcons name="search" size={22} color={muted} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          placeholder="Search a word or a topic"
          placeholderTextColor={muted}
          style={[styles.searchInput, { color: ink }]}
          autoCorrect={false}
          autoCapitalize="none"
          accessibilityLabel="Search learnt words"
        />
        {!!search && (
          <TouchableOpacity onPress={() => setSearch('')} accessibilityRole="button" accessibilityLabel="Clear search" hitSlop={8}>
            <MaterialIcons name="close" size={20} color={muted} />
          </TouchableOpacity>
        )}
      </View>

      {data.learnedWordCount === 0 ? (
        <Text style={[styles.emptyText, { color: muted }]}>
          No words yet. Tap ✓ on a flashcard and the word appears here, under its topic.
        </Text>
      ) : visibleGroups.length === 0 ? (
        <Text style={[styles.emptyText, { color: muted }]}>No words match “{search.trim()}” yet.</Text>
      ) : (
        <View style={styles.topicList}>{visibleGroups.map(renderTopicRow)}</View>
      )}
    </View>
  );

  return (
    <DesktopTypographyProvider mode="fit">
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={{ paddingTop: topContentInset, paddingBottom: insets.bottom + 40 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.desktopContentWrap, { maxWidth: isDesktopWeb ? Math.min(desktopContentMaxWidth, 960) : 960 }]}>
          <BackButton onPress={() => navigation.goBack()} />

          <View style={[styles.column, { paddingHorizontal: pageGutter }]}>
            <View>
              <Text style={[styles.title, { color: ink, fontSize: titleSize, lineHeight: titleSize + 6 }]}>My words</Text>
              <Text style={[styles.subtitle, { color: muted }]}>Everything you’ve learnt, in one place.</Text>
            </View>

            {!library ? (
              <ActivityIndicator style={styles.loading} color={palette.green} />
            ) : (
              <>
                <View style={[styles.heroRow, wide && styles.heroRowWide]}>
                  <View style={wide ? styles.heroCol : undefined}>{renderProgressCard(library)}</View>
                  <View style={wide ? styles.heroCol : undefined}>{renderActionCard()}</View>
                </View>
                {week && (
                  <WeeklyGoalCard
                    week={week}
                    onGoalChange={(goal) => setWeek((current) => current && ({ ...current, goal, goalReached: current.daysPractised >= goal }))}
                  />
                )}
                {renderFreshThisWeek(library)}
                {renderWordBank(library)}
              </>
            )}
          </View>
        </View>
      </ScrollView>
    </DesktopTypographyProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  desktopContentWrap: { width: '100%', alignSelf: 'center' },
  column: { gap: 28 },
  loading: { marginTop: 40 },
  title: { fontWeight: '900' },
  subtitle: { fontWeight: '600', fontSize: 16, lineHeight: 22, marginTop: 6 },
  eyebrow: {
    fontWeight: '800',
    fontSize: 14,
    lineHeight: 18,
    textTransform: 'uppercase',
    letterSpacing: 1.1,
  },
  eyebrowPadded: { marginBottom: 12 },
  heroRow: { gap: 16 },
  heroRowWide: { flexDirection: 'row' },
  heroCol: { flex: 1 },
  heroCard: { borderRadius: 28, padding: 22, overflow: 'hidden', gap: 6 },
  heroCircle: { position: 'absolute', width: 140, height: 140, borderRadius: 70, top: -44, right: -44 },
  heroNumberRow: { flexDirection: 'row', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' },
  heroNumber: { fontWeight: '900' },
  heroNumberLabel: { fontWeight: '800', fontSize: 18, lineHeight: 24 },
  milestoneText: { fontWeight: '700', fontSize: 15, lineHeight: 20, marginTop: 6 },
  heroTrack: { height: 12, borderRadius: 6, overflow: 'hidden', marginTop: 4 },
  heroFill: { height: '100%', borderRadius: 6 },
  caption: { fontWeight: '600', fontSize: 13, lineHeight: 18, marginTop: 4, opacity: 0.8 },
  actionCard: { borderRadius: 28, padding: 22, gap: 12 },
  actionCardEmpty: { borderWidth: 2, borderStyle: 'dashed' },
  actionTitle: { fontWeight: '900', fontSize: 24, lineHeight: 30 },
  actionBody: { fontWeight: '500', fontSize: 15, lineHeight: 22 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderRadius: 99, paddingHorizontal: 14, paddingVertical: 6 },
  chipText: { fontWeight: '700', fontSize: 14, lineHeight: 18 },
  tactile: {
    minHeight: 52,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 22,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  tactileText: { fontWeight: '800', fontSize: 16, lineHeight: 22, color: '#FFFFFF' },
  freshRow: { gap: 14, paddingVertical: 10, paddingHorizontal: 4 },
  freshCard: { width: 132, borderRadius: 18, paddingVertical: 16, paddingHorizontal: 14, gap: 2 },
  freshFrench: { fontWeight: '900', fontSize: 20, lineHeight: 26 },
  freshEnglish: { fontWeight: '600', fontSize: 14, lineHeight: 18 },
  bankSection: { gap: 14 },
  bankTitleRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 },
  sectionTitle: { fontWeight: '900' },
  bankLinks: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  bankLink: { fontWeight: '700', fontSize: 14, lineHeight: 18 },
  grammarList: { borderRadius: 22, padding: 8 },
  grammarRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, paddingHorizontal: 12 },
  grammarTitle: { flex: 1, fontWeight: '700', fontSize: 15, lineHeight: 20 },
  grammarCount: { fontWeight: '700', fontSize: 13, lineHeight: 18 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 56,
    borderRadius: 18,
    borderWidth: 2,
    paddingHorizontal: 16,
  },
  searchInput: { flex: 1, fontWeight: '600', fontSize: 16, paddingVertical: 10 },
  emptyText: { fontWeight: '600', fontSize: 15, lineHeight: 22 },
  topicList: { gap: 12 },
  topicCard: { borderRadius: 22, overflow: 'hidden' },
  topicHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, minHeight: 76 },
  topicIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  topicThumb: { width: '100%', height: '100%' },
  topicCopy: { flex: 1, minWidth: 0, gap: 6 },
  topicName: { fontWeight: '800', fontSize: 18, lineHeight: 24 },
  topicBarRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  topicTrack: { flex: 1, maxWidth: 220, height: 8, borderRadius: 4, overflow: 'hidden' },
  topicFill: { height: '100%', borderRadius: 4 },
  topicCount: { fontWeight: '700', fontSize: 13, lineHeight: 18 },
  chevronOpen: { transform: [{ rotate: '180deg' }] },
  tileGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, padding: 14 },
  wordTile: {
    flexGrow: 1,
    flexBasis: 150,
    minWidth: 150,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  wordTileCopy: { flex: 1, minWidth: 0 },
  tileFrench: { fontWeight: '800', fontSize: 16, lineHeight: 22 },
  tileEnglish: { fontWeight: '600', fontSize: 14, lineHeight: 18 },
  speakerButton: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
});
