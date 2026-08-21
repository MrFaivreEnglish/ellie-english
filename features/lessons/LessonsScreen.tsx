import React, { useMemo, useState } from 'react';
import { Alert, View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Platform, useWindowDimensions } from 'react-native';
import BackButton from '../shared/BackButton';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { TabParamList, RootStackParamList } from '../../types/navigationTypes';
import { useTheme } from '../settings/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { lessonCategories as chapterCategories } from '../../content/lessons/chapterData';
import { resourceCategories as resourceLinkCategories } from '../../content/lessons/resourceLinks';
import { resolveChapterAppLink } from '../../content/lessons/appLessonRegistry';
import { createMixedGrammarLesson } from '../../content/lessons/grammarRegistry';
import type { ResolvedChapterAppLink } from '../../content/lessons/lessonTypes';
import { getLessonImage, getSerializableVocabularyLesson } from '../vocabulary/vocabularyUtils';
import { getMenuCopy } from '../shared/menuCopy';
import {
  getCustomChapterLinkOverrides,
  makeChapterLinkOverrideId,
  normalizeChapterLinkOverrides,
  type ChapterLinkOverride,
} from './chapterLinkStorage';
import { getPanelStyle, getSoftShadow, uiRadii } from '../shared/uiPrimitives';
import { FRESH_COLORS, freshRadii } from '../shared/freshDirection';
import type { Word } from '../../types/VocabularyTypes';

const bundledCustomChapterLinks = require('../../content/lessons/customChapterLinks.json') as any[];

// Same sequence Grammar selection cycles through for its subcategory
// headers (features/grammar/GrammarCategoryList.tsx `subColors`) — kept in
// sync by hand so Chapters reads as the same visual system.
const LEVEL_COLORS = [
  '#ee9cb0ff',
  '#D9A6E8',
  '#B79CFF',
  '#8F9BFF',
  '#6FA8FF',
  '#92c490ff',
];

// Mirrors VocabularyScreen.tsx's `getVocabularyLessonImageUrl` — same
// raw-URL-with-generated-fallback resolution, so a vocabulary Mix built
// from Chapters carries the same multi-image carousel data a Mix built
// from the Vocabulary selection tray does.
const getVocabularyLessonImageUrl = (lesson: any) => {
  const rawImage = lesson?.imageUrl ?? lesson?.image;

  if (typeof rawImage === 'string' && rawImage.trim().length > 0) {
    return rawImage.trim();
  }

  return lesson?.title ? getLessonImage(lesson.title) : undefined;
};

const parseChapterTitle = (title: string) => {
  const match = title.match(/^\s*((?:Mini\s+)?Chapter\s+\d+)\s*:?\s*(.+)$/i);

  if (!match) {
    return {
      label: '',
      labelPrefix: '',
      labelNumber: '',
      title,
    };
  }

  const labelNumberMatch = match[1].match(/^(.+?)\s+(\d+)$/);

  return {
    label: match[1],
    labelPrefix: labelNumberMatch ? labelNumberMatch[1] : match[1],
    labelNumber: labelNumberMatch ? labelNumberMatch[2] : '',
    title: match[2],
  };
};

const vocabWordKey = (word: Word) => `${word.english.trim().toLowerCase()}|${word.french.trim().toLowerCase()}`;

type LessonsNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, 'Lessons'>,
  NativeStackNavigationProp<RootStackParamList>
>;

export default function LessonsScreen() {
  const navigation = useNavigation<LessonsNavigationProp>();
  const { width: windowWidth } = useWindowDimensions();
  const isDesktopWeb = Platform.OS === 'web' && windowWidth >= 768;
  const { isDarkMode, colors, isAndroidStatusBarEnabled } = useTheme();
  const appCopy = getMenuCopy();
  const copy = appCopy.lessons;
  const commonCopy = appCopy.common;
  const insets = useSafeAreaInsets();
  const topContentInset = Platform.OS === 'ios'
    ? (insets.top > 0 ? insets.top : 0)
    : Platform.OS === 'android' && isAndroidStatusBarEnabled
      ? insets.top
      : 0;
  const [viewMode, setViewMode] = useState<'chapters' | 'resources'>('chapters');
  // Independently expandable rows (§2.14) — several levels can be open at once.
  const [openChapterLevels, setOpenChapterLevels] = useState<Set<string>>(() => new Set());
  const [openResourceLevels, setOpenResourceLevels] = useState<Set<string>>(() => new Set());
  const bundledChapterLinkOverrides = useMemo(
    () => normalizeChapterLinkOverrides(bundledCustomChapterLinks),
    []
  );
  const [localChapterLinkOverrides, setLocalChapterLinkOverrides] = useState<ChapterLinkOverride[]>([]);
  const chapterLinkOverrideMap = useMemo(() => {
    const map = new Map<string, ChapterLinkOverride>();

    bundledChapterLinkOverrides.forEach((override) => {
      map.set(override.id, override);
    });

    localChapterLinkOverrides.forEach((override) => {
      map.set(override.id, override);
    });

    return map;
  }, [bundledChapterLinkOverrides, localChapterLinkOverrides]);

  useFocusEffect(
    React.useCallback(() => {
      let active = true;

      getCustomChapterLinkOverrides().then((overrides) => {
        if (active) setLocalChapterLinkOverrides(overrides);
      });

      return () => {
        active = false;
      };
    }, [])
  );

  const openLink = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert(copy.cannotOpenUrl);
      }
    } catch {
      Alert.alert(copy.openUrlError);
    }
  };

  const openAppLink = (appLink: ResolvedChapterAppLink) => {
    if (appLink.target === 'vocabulary') {
      navigation.navigate('Vocabulary', {
        screen: 'VocabularyLesson',
        params: {
          lesson: getSerializableVocabularyLesson(appLink.lesson),
          backLabel: commonCopy.backToChapters,
          backTarget: 'Lessons',
        },
      });
      return;
    }

    if (appLink.target !== 'grammar') return;

    navigation.navigate('Grammar', {
      lesson: appLink.lesson,
      backLabel: commonCopy.backToChapters,
      backTarget: 'Lessons',
      openKey: Date.now(),
    });
  };

  const openMixedGrammarPractice = (
    displayLessonTitle: string,
    chapterTitle: string,
    grammarAppLinks: ResolvedChapterAppLink[]
  ) => {
    const mixedLesson = createMixedGrammarLesson({
      idSeed: `chapter-${displayLessonTitle}`,
      title: `${copy.mixedGrammarPractice}: ${chapterTitle}`,
      description: appCopy.grammar.mixedPracticeSubtitle.replace(
        '{count}',
        String(grammarAppLinks.length)
      ),
      sourceLessons: grammarAppLinks.map((appLink) => appLink.lesson),
    });

    if (!mixedLesson) return;

    navigation.navigate('Grammar', {
      lesson: mixedLesson,
      backLabel: commonCopy.backToChapters,
      backTarget: 'Lessons',
      openKey: Date.now(),
    });
  };

  const openMixedVocabularyPractice = (
    displayLessonTitle: string,
    chapterTitle: string,
    vocabularyAppLinks: ResolvedChapterAppLink[]
  ) => {
    const seenWords = new Set<string>();
    const mixedWords: Word[] = [];

    vocabularyAppLinks.forEach((appLink) => {
      if (appLink.target !== 'vocabulary') return;
      const sourceLesson = { id: String(appLink.lesson.id ?? appLink.label), title: appLink.lesson.title };

      (appLink.lesson.flashcards ?? []).forEach((card: any) => {
        const word: Word = { english: String(card?.english ?? '').trim(), french: String(card?.french ?? '').trim() };
        if (!word.english || !word.french) return;
        const key = vocabWordKey(word);
        if (seenWords.has(key)) return;
        seenWords.add(key);
        mixedWords.push({ ...word, sourceLesson } as Word);
      });
    });

    if (!mixedWords.length) return;

    const sourceLessonImageCards = vocabularyAppLinks
      .filter((appLink): appLink is Extract<ResolvedChapterAppLink, { target: 'vocabulary' }> => appLink.target === 'vocabulary')
      .map((appLink) => {
        const imageUrl = getVocabularyLessonImageUrl(appLink.lesson);
        return imageUrl
          ? { id: String(appLink.lesson.id ?? appLink.label), title: String(appLink.lesson.title ?? ''), imageUrl }
          : null;
      })
      .filter((imageCard): imageCard is { id: string; title: string; imageUrl: string } => !!imageCard);
    const sourceLessonImages = sourceLessonImageCards.map((imageCard) => imageCard.imageUrl);

    navigation.navigate('Vocabulary', {
      screen: 'VocabularyLesson',
      params: {
        lesson: {
          id: `chapter-vocab-mix-${displayLessonTitle}`,
          title: `${appCopy.vocabulary.mixedPracticeTitle}: ${chapterTitle}`,
          description: appCopy.vocabulary.mixedPracticeSubtitle.replace('{count}', String(vocabularyAppLinks.length)),
          imageUrl: sourceLessonImages[0] ?? '',
          flashcards: mixedWords,
          isVocabularyMix: true,
          sourceLessonCount: vocabularyAppLinks.length,
          sourceLessonImageCards,
          sourceLessonImages,
        },
        backLabel: commonCopy.backToChapters,
        backTarget: 'Lessons',
      },
    });
  };

  const handleViewModeChange = (mode: 'chapters' | 'resources') => {
    setViewMode(mode);
  };

  const toggleChapterLevel = (title: string) => {
    setOpenChapterLevels((current) => {
      const next = new Set(current);
      if (next.has(title)) next.delete(title); else next.add(title);
      return next;
    });
  };

  const toggleResourceLevel = (title: string) => {
    setOpenResourceLevels((current) => {
      const next = new Set(current);
      if (next.has(title)) next.delete(title); else next.add(title);
      return next;
    });
  };

  const collapseAll = () => {
    if (viewMode === 'chapters') setOpenChapterLevels(new Set());
    else setOpenResourceLevels(new Set());
  };

  const hasAnyOpen = viewMode === 'chapters' ? openChapterLevels.size > 0 : openResourceLevels.size > 0;

  // Shows a "scroll for more" hint whenever the list overflows the screen
  // and the user hasn't scrolled near the bottom yet — with more chapter
  // categories than fit on one screen, there was no other cue that more
  // content exists below the fold.
  const [scrollViewportHeight, setScrollViewportHeight] = useState(0);
  const [scrollContentHeight, setScrollContentHeight] = useState(0);
  const [isNearScrollEnd, setIsNearScrollEnd] = useState(false);
  const canShowScrollHint = scrollContentHeight > scrollViewportHeight + 40 && !isNearScrollEnd;

  return (
    <View style={{ flex: 1 }}>
    <ScrollView
      style={[
        styles.container,
        { backgroundColor: colors.background }
      ]}
      contentContainerStyle={{
        paddingTop: topContentInset,
        paddingBottom: 24,
      }}
      onLayout={(event) => setScrollViewportHeight(event.nativeEvent.layout.height)}
      onContentSizeChange={(_width, height) => setScrollContentHeight(height)}
      onScroll={(event) => {
        const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
        const distanceFromBottom = contentSize.height - contentOffset.y - layoutMeasurement.height;
        setIsNearScrollEnd(distanceFromBottom < 40);
      }}
      scrollEventThrottle={32}
    >
      <View style={isDesktopWeb && styles.desktopContentWrap}>
      <BackButton label={commonCopy.backToHome} onPress={() => (navigation as any).navigate('Home')} />

      <View style={styles.headerRow}>
        <Text
          style={[styles.headerTitle, { color: colors.text }]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.7}
        >
          {copy.header}
        </Text>
        {hasAnyOpen && (
          <TouchableOpacity
            onPress={collapseAll}
            style={[styles.collapseAllPill, { backgroundColor: colors.card }, getSoftShadow(isDarkMode, 'soft')]}
            accessibilityRole="button"
            accessibilityLabel="Collapse all"
          >
            <Text style={[styles.collapseAllText, { color: colors.text }]} numberOfLines={1}>Collapse all</Text>
          </TouchableOpacity>
        )}
      </View>

      <View
        style={[
          styles.modeToggle,
          { backgroundColor: colors.card },
          getSoftShadow(isDarkMode, 'soft'),
        ]}
      >
        <TouchableOpacity
          style={[
            styles.modeOption,
            viewMode === 'chapters' && { backgroundColor: colors.buttonBackground },
          ]}
          onPress={() => handleViewModeChange('chapters')}
          activeOpacity={0.86}
          accessibilityRole="button"
          accessibilityLabel={copy.showChapters}
          accessibilityState={{ selected: viewMode === 'chapters' }}
        >
          <Text
            style={[
              styles.modeOptionText,
              { color: viewMode === 'chapters' ? colors.buttonText : colors.text },
            ]}
          >
            {copy.chapters}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.modeOption,
            viewMode === 'resources' && { backgroundColor: colors.buttonBackground },
          ]}
          onPress={() => handleViewModeChange('resources')}
          activeOpacity={0.86}
          accessibilityRole="button"
          accessibilityLabel={copy.showResources}
          accessibilityState={{ selected: viewMode === 'resources' }}
        >
          <Text
            style={[
              styles.modeOptionText,
              { color: viewMode === 'resources' ? colors.buttonText : colors.text },
            ]}
          >
            {copy.resources}
          </Text>
        </TouchableOpacity>
      </View>

      {viewMode === 'chapters' && chapterCategories.map((category, levelIndex) => {
        const isOpen = openChapterLevels.has(category.title);
        const levelColor = LEVEL_COLORS[levelIndex % LEVEL_COLORS.length];

        return (
          <View
            key={category.title}
            style={[
              styles.categoryContainer,
              getPanelStyle(colors, isDarkMode, isOpen ? 'raised' : 'soft'),
              { backgroundColor: colors.card, borderWidth: 0 },
            ]}
          >
            <TouchableOpacity
              style={[styles.levelRow, { backgroundColor: levelColor }]}
              onPress={() => toggleChapterLevel(category.title)}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={`${isOpen ? commonCopy.collapse : commonCopy.expand} ${category.title} ${copy.chapterPlural}`}
              accessibilityState={{ expanded: isOpen }}
            >
              <Text style={styles.levelIcon}>{category.icon}</Text>
              <Text style={styles.levelTitle} numberOfLines={1}>{category.title}</Text>
              <View style={styles.levelCountPill}>
                <Text style={styles.levelCountText}>
                  {category.lessons.length} {category.lessons.length > 1 ? copy.chapterPlural : copy.chapterSingular}
                </Text>
              </View>
              <MaterialIcons name={isOpen ? 'expand-less' : 'expand-more'} size={22} color="white" />
            </TouchableOpacity>

            {isOpen && (
              <View style={styles.lessonsContainer}>
                {category.lessons.map((lesson, lessonIndex) => {
                  const chapterLinkOverride = chapterLinkOverrideMap.get(
                    makeChapterLinkOverrideId(category.title, lesson.title)
                  );
                  const chapterUrl = chapterLinkOverride?.url ?? lesson.url;
                  const displayLessonTitle = chapterLinkOverride?.displayTitle || lesson.title;
                  const chapter = parseChapterTitle(displayLessonTitle);
                  const appLinks = (lesson.appLinks ?? [])
                    .filter((link) => link.target !== 'pronunciation')
                    .map(resolveChapterAppLink)
                    .filter((link): link is ResolvedChapterAppLink => !!link);
                  const vocabularyAppLinks = appLinks.filter((link) => link.target === 'vocabulary');
                  const grammarAppLinks = appLinks.filter(
                    (link) => link.target === 'grammar' && link.lesson?.practiceType !== 'vocabulary'
                  );
                  // "Irregular Verbs" is a standalone reference chapter, not paired
                  // vocab/grammar content — it links straight to each verb-group
                  // lesson instead of showing the usual two-column split.
                  const isLinksOnlyChapter = category.title === 'Irregular Verbs';

                  return (
                    <View
                      key={lessonIndex}
                      style={[
                        styles.chapterCard,
                        {
                          backgroundColor: isDarkMode ? colors.surface : '#FDFCFA',
                          borderColor: colors.border,
                        },
                      ]}
                    >
                      <View style={styles.chapterCardHeaderRow}>
                        <View style={[styles.chapterBadge, { backgroundColor: levelColor }]}>
                          <Text style={styles.chapterBadgePrefix} numberOfLines={1}>
                            {chapter.labelPrefix ? chapter.labelPrefix.toUpperCase() : copy.chapterFallback.toUpperCase()}
                          </Text>
                          <Text style={styles.chapterBadgeNumber}>
                            {chapter.labelNumber || lessonIndex + 1}
                          </Text>
                        </View>
                        <Text style={[styles.chapterCardTitle, { color: colors.text }]} numberOfLines={2}>
                          {chapter.title}
                        </Text>
                        <TouchableOpacity
                          style={[styles.openChapterPill, { backgroundColor: colors.card, borderColor: levelColor }]}
                          onPress={() => openLink(chapterUrl)}
                          activeOpacity={0.82}
                          accessibilityRole="link"
                          accessibilityLabel={`Open ${displayLessonTitle}`}
                        >
                          <Text style={[styles.openChapterPillText, { color: colors.text }]} numberOfLines={1}>
                            Open chapter ↗
                          </Text>
                        </TouchableOpacity>
                      </View>

                      <View style={[styles.chapterDivider, { backgroundColor: colors.border }]} />

                      {isLinksOnlyChapter ? (
                        <View style={styles.chipRow}>
                          {appLinks.map((appLink) => (
                            <TouchableOpacity
                              key={appLink.label}
                              style={[
                                styles.chip,
                                { backgroundColor: FRESH_COLORS.grammarLavenderFill, borderColor: FRESH_COLORS.grammarLavenderBorder },
                              ]}
                              onPress={() => openAppLink(appLink)}
                              activeOpacity={0.84}
                              accessibilityRole="button"
                              accessibilityLabel={`${copy.practice} ${appLink.label}`}
                            >
                              <Text style={[styles.chipText, { color: FRESH_COLORS.grammarLavenderText }]} numberOfLines={1}>
                                {appLink.label}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      ) : (
                      <View style={styles.chapterColumns}>
                        <View style={styles.chapterColumn}>
                          <Text style={[styles.chapterColumnHeader, { color: colors.secondaryText }]}>
                            📕 VOCABULARY
                          </Text>
                          {vocabularyAppLinks.length ? (
                            <View style={styles.chipRow}>
                              {vocabularyAppLinks.map((appLink) => (
                                <TouchableOpacity
                                  key={appLink.label}
                                  style={[
                                    styles.chip,
                                    { backgroundColor: FRESH_COLORS.vocabCoralChipFill, borderColor: FRESH_COLORS.vocabCoralChipBorder },
                                  ]}
                                  onPress={() => openAppLink(appLink)}
                                  activeOpacity={0.84}
                                  accessibilityRole="button"
                                  accessibilityLabel={`${copy.practice} ${appLink.label}`}
                                >
                                  <Text style={[styles.chipText, { color: FRESH_COLORS.vocabCoralChipText }]} numberOfLines={1}>
                                    {appLink.label}
                                  </Text>
                                </TouchableOpacity>
                              ))}
                              {vocabularyAppLinks.length >= 2 && (
                                <TouchableOpacity
                                  style={[styles.mixChip, { backgroundColor: FRESH_COLORS.vocabCoralSolid }]}
                                  onPress={() => openMixedVocabularyPractice(displayLessonTitle, chapter.title, vocabularyAppLinks)}
                                  activeOpacity={0.86}
                                  accessibilityRole="button"
                                  accessibilityLabel={`${copy.practice} Mix`}
                                >
                                  <Text style={styles.mixChipText}>🎲 Mix</Text>
                                </TouchableOpacity>
                              )}
                            </View>
                          ) : (
                            <Text style={[styles.emptyColumnText, { color: colors.secondaryText }]}>
                              No vocabulary lesson in this chapter
                            </Text>
                          )}
                        </View>

                        <View style={[styles.chapterColumnVerticalDivider, { backgroundColor: colors.border }]} />

                        <View style={styles.chapterColumn}>
                          <Text style={[styles.chapterColumnHeader, { color: colors.secondaryText }]}>
                            ✏️ GRAMMAR
                          </Text>
                          {grammarAppLinks.length ? (
                            <View style={styles.chipRow}>
                              {grammarAppLinks.map((appLink) => (
                                <TouchableOpacity
                                  key={appLink.label}
                                  style={[
                                    styles.chip,
                                    { backgroundColor: FRESH_COLORS.grammarLavenderFill, borderColor: FRESH_COLORS.grammarLavenderBorder },
                                  ]}
                                  onPress={() => openAppLink(appLink)}
                                  activeOpacity={0.84}
                                  accessibilityRole="button"
                                  accessibilityLabel={`${copy.practice} ${appLink.label}`}
                                >
                                  <Text style={[styles.chipText, { color: FRESH_COLORS.grammarLavenderText }]} numberOfLines={1}>
                                    {appLink.label}
                                  </Text>
                                </TouchableOpacity>
                              ))}
                              {grammarAppLinks.length >= 2 && (
                                <TouchableOpacity
                                  style={[styles.mixChip, { backgroundColor: FRESH_COLORS.primaryBlue }]}
                                  onPress={() => openMixedGrammarPractice(displayLessonTitle, chapter.title, grammarAppLinks)}
                                  activeOpacity={0.86}
                                  accessibilityRole="button"
                                  accessibilityLabel={`${copy.practice} ${copy.mixedGrammarPractice}`}
                                >
                                  <Text style={styles.mixChipText}>🎲 Mix</Text>
                                </TouchableOpacity>
                              )}
                            </View>
                          ) : (
                            <Text style={[styles.emptyColumnText, { color: colors.secondaryText }]}>
                              No grammar lesson in this chapter
                            </Text>
                          )}
                        </View>
                      </View>
                      )}
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        );
      })}

      {viewMode === 'resources' && resourceLinkCategories.map((category) => {
        const isOpen = openResourceLevels.has(category.title);

        return (
          <View
            key={category.title}
            style={[
              styles.categoryContainer,
              getPanelStyle(colors, isDarkMode, isOpen ? 'raised' : 'soft'),
              { backgroundColor: colors.card, borderWidth: 0 },
            ]}
          >
            <TouchableOpacity
              style={[styles.levelRow, { backgroundColor: category.color }]}
              onPress={() => toggleResourceLevel(category.title)}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={`${isOpen ? commonCopy.collapse : commonCopy.expand} ${category.title} ${copy.resources}`}
              accessibilityState={{ expanded: isOpen }}
            >
              <Text style={styles.levelIcon}>{category.icon}</Text>
              <Text style={styles.levelTitle} numberOfLines={1}>{category.title}</Text>
              <View style={styles.levelCountPill}>
                <Text style={styles.levelCountText}>
                  {category.resources.length} {category.resources.length > 1 ? copy.linkPlural : copy.linkSingular}
                </Text>
              </View>
              <MaterialIcons name={isOpen ? 'expand-less' : 'expand-more'} size={22} color="white" />
            </TouchableOpacity>

            {isOpen && (
              <View style={styles.lessonsContainer}>
                {category.resources.map((resource, resourceIndex) => (
                  <TouchableOpacity
                    key={resource.title}
                    style={[
                      styles.resourceItem,
                      { backgroundColor: isDarkMode ? colors.surface : '#FDFCFA', borderColor: colors.border },
                    ]}
                    activeOpacity={0.82}
                    onPress={() => openLink(resource.url)}
                    accessibilityRole="link"
                    accessibilityLabel={`Open ${resource.title}`}
                  >
                    <View style={[styles.resourceNumberBadge, { backgroundColor: category.color }]}>
                      <Text style={styles.resourceNumberText}>{resourceIndex + 1}</Text>
                    </View>
                    <View style={styles.resourceTextBlock}>
                      <Text style={[styles.resourceTitle, { color: colors.text }]}>{resource.title}</Text>
                      <Text style={[styles.resourceDescription, { color: colors.secondaryText }]}>{resource.description}</Text>
                    </View>
                    <MaterialIcons name="open-in-new" size={18} color={colors.secondaryText} />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        );
      })}
      </View>
    </ScrollView>
    {canShowScrollHint && (
      <View style={[styles.scrollHintWrap, { pointerEvents: 'none' }]}>
        <View style={[styles.scrollHintBubble, { backgroundColor: colors.card }]}>
          <MaterialIcons name="keyboard-arrow-down" size={20} color={colors.secondaryText} />
        </View>
      </View>
    )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollHintWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 14,
    alignItems: 'center',
  },
  scrollHintBubble: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  desktopContentWrap: {
    width: '100%',
    maxWidth: 1000,
    alignSelf: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  headerTitle: {
    flex: 1,
    minWidth: 0,
    fontSize: 30,
    fontWeight: '800',
  },
  collapseAllPill: {
    flexShrink: 0,
    borderRadius: freshRadii.pill,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  collapseAllText: {
    fontSize: 13,
    fontWeight: '700',
  },
  modeToggle: {
    borderRadius: freshRadii.pill,
    flexDirection: 'row',
    marginBottom: 18,
    marginHorizontal: 16,
    padding: 5,
    gap: 2,
  },
  modeOption: {
    alignItems: 'center',
    borderRadius: freshRadii.pill,
    flex: 1,
    justifyContent: 'center',
    minHeight: 44,
  },
  modeOptionText: {
    fontSize: 13.5,
    fontWeight: '800',
  },
  categoryContainer: {
    marginBottom: 16,
    marginHorizontal: 16,
    borderRadius: uiRadii.card,
    overflow: 'hidden',
  },
  lessonsContainer: {
    padding: 14,
    gap: 10,
  },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 18,
    gap: 12,
  },
  levelIcon: {
    fontSize: 20,
  },
  levelTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '800',
    color: 'white',
  },
  levelCountPill: {
    borderRadius: freshRadii.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(255,255,255,0.28)',
  },
  levelCountText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
  },
  chapterCard: {
    borderWidth: 1,
    borderRadius: freshRadii.card,
    padding: 14,
    paddingHorizontal: 16,
    overflow: 'hidden',
  },
  chapterCardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  chapterBadge: {
    minWidth: 64,
    borderRadius: freshRadii.chapterBadge,
    paddingHorizontal: 11,
    paddingVertical: 7,
    alignItems: 'center',
  },
  chapterBadgePrefix: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  chapterBadgeNumber: {
    color: 'white',
    fontSize: 19,
    fontWeight: '800',
    lineHeight: 22,
  },
  chapterCardTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '800',
    minWidth: 0,
  },
  openChapterPill: {
    borderRadius: freshRadii.pill,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  openChapterPillText: {
    fontSize: 12.5,
    fontWeight: '800',
  },
  chapterDivider: {
    height: 1,
    marginVertical: 12,
  },
  chapterColumns: {
    flexDirection: 'row',
    gap: 18,
  },
  chapterColumn: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
  },
  chapterColumnVerticalDivider: {
    width: 1,
  },
  chapterColumnHeader: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
    marginBottom: 9,
    textAlign: 'center',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  chip: {
    borderRadius: freshRadii.pill,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipText: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  mixChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: freshRadii.pill,
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 4,
  },
  mixChipText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '800',
  },
  emptyColumnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  resourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 72,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: freshRadii.card,
    borderWidth: 1,
  },
  resourceNumberBadge: {
    width: 30,
    height: 30,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  resourceNumberText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
  },
  resourceTextBlock: {
    flex: 1,
    marginRight: 12,
  },
  resourceTitle: {
    fontSize: 17,
    fontWeight: '800',
    lineHeight: 22,
  },
  resourceDescription: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
    marginTop: 4,
  },
});
