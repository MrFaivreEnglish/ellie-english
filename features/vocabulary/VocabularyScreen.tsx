import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  TouchableOpacity,
  Image,
  TextInput,
  Platform,
  Pressable,
  useWindowDimensions,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useTheme } from '../settings/ThemeContext';
import BackButton from '../shared/BackButton';
import { useSearchFocusAnimation } from '../shared/useSearchFocusAnimation';
import { getLessonImage, getLessonThumbnailSource, getSerializableVocabularyLesson, shuffleArray } from './vocabularyUtils';
import { vocabularyCategories } from '../../content/lessons/vocabularyRegistry';
import { getCustomVocabularyLessons } from '../lessons/customLessonStorage';
import { getMenuCopy } from '../shared/menuCopy';
import { MAX_XP_PER_PAIR } from './vocabRush/VocabRushGame';
import { MAX_VOCAB_RUSH_WORDS } from './knownWords';
import type { Word } from '../../types/VocabularyTypes';
import type { VocabularyLesson } from '../../types/lessonTypes';
import {
  getLearnedFlashcardKeysByLesson,
  normalizeFlashcardLessonKey,
} from './flashcardProgressStorage';
import {
  getInsetSurfaceStyle,
  getPanelStyle,
  getSelectionTrayColors,
  getSoftShadow,
  getStudySurfaceColors,
  uiRadii,
} from '../shared/uiPrimitives';
import VocabularyLessonCard from './VocabularyLessonCard';
import { freshFontFamily } from '../shared/freshDirection';

const bundledCustomVocabularyLessons = require('../../content/lessons/customVocabularyLessons.json') as any[];

const STAR_EMOJI = '\u2B50';

const CATEGORY_EMOJI_MAP: Record<string, string> = {
  'Classroom English': '\u{1F3EB}',
  Basics: '\u{1F331}',
  People: '\u{1F465}',
  'Opinions & Tastes': '\u{1F4AC}',
  'Daily Life': '\u{1F3E0}',
  Food: '\u{1F37D}\uFE0F',
  'Hobbies & Culture': '\u{1F3AD}',
  'Travel & Places': '\u{1F9ED}',
  'Science & Nature': '\u{1F30C}',
  'History & Society': '\u{1F4DC}',
  Work: '\u{1F4BC}',
  Custom: '\u{1F4DA}',
};

const difficultyMap: Record<string, number> = {
  Activities: 1,
  Animals: 1,
  'American Dishes': 2,
  Body: 1,
  Breakfast: 1,
  Bullying: 3,
  Cinema: 3,
  'City Travel': 1,
  'Classroom English': 1,
  Clothes: 1,
  Colours: 1,
  Cooking: 2,
  'Daily questions': 2,
  'Daily Routine': 1,
  Date: 1,
  'Describing a picture': 2,
  Detective: 2,
  Dystopia: 3,
  Ecology: 2,
  Emotions: 1,
  'Emotions Plus': 3,
  'Extreme Sports': 3,
  Family: 1,
  'Food Basics': 1,
  'Food +': 1,
  'Frequency Adverbs': 1,
  Furniture: 1,
  Geography: 2,
  'Getting a job': 3,
  House: 1,
  Instructions: 1,
  Internet: 3,
  Jobs: 2,
  Legends: 2,
  Location: 1,
  Love: 3,
  Nationality: 1,
  'Opinion Basics': 1,
  'Opinion +': 3,
  'Personality Basics': 1,
  'Personality +': 3,
  'Physical Description': 1,
  'Question Words': 1,
  Robots: 2,
  'School Subjects': 1,
  'School Supplies': 1,
  'School life': 2,
  Christmas: 1,
  Halloween: 1,
  Segregation: 3,
  Space: 3,
  Tastes: 1,
  'The UK': 1,
  Time: 1,
  'Types of documents': 1,
  'Video game powers': 2,
  'Video Games': 2,
  'The Blitz': 3,
  Fashion: 2,
};

const normalizeCustomLesson = (lesson: any) => {
  if (!lesson || typeof lesson !== 'object' || typeof lesson.title !== 'string' || !Array.isArray(lesson.flashcards)) {
    return null;
  }

  const flashcards = lesson.flashcards
    .map((word: any) => ({
      english: String(word?.english ?? '').trim(),
      french: String(word?.french ?? '').trim(),
    }))
    .filter((word: any) => word.english && word.french);

  if (!flashcards.length) return null;

  return {
    id: typeof lesson.id === 'string' ? lesson.id : `bundled-${lesson.title}`,
    title: lesson.title.trim(),
    description: typeof lesson.description === 'string' ? lesson.description : '',
    imageUrl: typeof lesson.imageUrl === 'string' ? lesson.imageUrl : '',
    category: typeof lesson.category === 'string' ? lesson.category : 'Custom',
    flashcards,
  };
};

const vocabularyWordKey = (word: Word) => `${word.english.trim().toLowerCase()}|${word.french.trim().toLowerCase()}`;

const getLessonWords = (lesson: any): Word[] => {
  if (!lesson?.flashcards) return [];

  const words = Array.isArray(lesson.flashcards[0]?.words)
    ? lesson.flashcards.flatMap((group: any) => group.words ?? [])
    : lesson.flashcards;

  return words
    .map((word: any) => ({
      english: String(word?.english ?? '').trim(),
      french: String(word?.french ?? '').trim(),
    }))
    .filter((word: Word) => word.english && word.french);
};

const getVocabularyLessonImageSource = (lesson: any) => {
  const thumbnail = getLessonThumbnailSource(lesson);
  if (thumbnail) return thumbnail;

  const rawImage = lesson?.imageUrl ?? lesson?.image;

  if (typeof rawImage === 'string' && rawImage.trim().length > 0) {
    return { uri: rawImage.trim() };
  }

  if (rawImage) return rawImage;

  return lesson?.title ? { uri: getLessonImage(lesson.title) } : undefined;
};

const getVocabularyLessonImageUrl = (lesson: any) => {
  const rawImage = lesson?.imageUrl ?? lesson?.image;

  if (typeof rawImage === 'string' && rawImage.trim().length > 0) {
    return rawImage.trim();
  }

  return lesson?.title ? getLessonImage(lesson.title) : undefined;
};

const getLessonProgressKey = (lesson: any) =>
  normalizeFlashcardLessonKey(String(lesson?.id || lesson?.title || 'lesson'));

const buildLearnedMixWords = (lessons: any[], learnedByLesson: Map<string, Set<string>>) => {
  const seenWords = new Set<string>();
  const learnedWords: Word[] = [];

  lessons.forEach((lesson) => {
    const learnedKeys = learnedByLesson.get(getLessonProgressKey(lesson));
    if (!learnedKeys?.size) return;

    getLessonWords(lesson).forEach((word) => {
      const wordKey = vocabularyWordKey(word);
      if (!learnedKeys.has(wordKey) || seenWords.has(wordKey)) return;

      seenWords.add(wordKey);
      learnedWords.push(word);
    });
  });

  return learnedWords;
};

function chunkArray<T>(arr: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) result.push(arr.slice(i, i + size));
  return result;
}

type LessonRowItem = { key: string; lessons: VocabularyLesson[]; categoryTitle: string };
type LessonSection = { title: string; count: number; data: LessonRowItem[] };

export default function VocabularyScreen() {
  const navigation = useNavigation<any>();
  const { isDarkMode, colors, vocabLessonCardView, updateVocabLessonCardView, isAndroidStatusBarEnabled } = useTheme();
  const appCopy = getMenuCopy();
  const copy = appCopy.vocabulary;
  const commonCopy = appCopy.common;
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const isDesktopWeb = Platform.OS === 'web' && windowWidth >= 768;
  const topContentInset = Platform.OS === 'ios'
    ? insets.top
    : Platform.OS === 'android' && isAndroidStatusBarEnabled
      ? insets.top
      : 0;
  const isPortraitTight = windowWidth < 430;

  const bundledCustomLessons = useMemo(
    () => bundledCustomVocabularyLessons.map(normalizeCustomLesson).filter(Boolean),
    []
  );

  const [customLessons, setCustomLessons] = useState<any[]>([]);
  const [selectedDifficulty, setSelectedDifficulty] = useState<number | null>(null);
  const [showDifficultyMenu, setShowDifficultyMenu] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [viewMode, setViewMode] = useState<'category' | 'abc'>('category');
  const [cardView, setCardView] = useState<'list' | 'tile'>(vocabLessonCardView);
  const [searchText, setSearchText] = useState('');
  const [difficultyAnchor, setDifficultyAnchor] = useState({ x: 16, y: 0, width: 180, height: 50 });
  const [sortAnchor, setSortAnchor] = useState({ x: 16, y: 0, width: 100, height: 30 });
  const difficultyAnchorRef = useRef<View>(null);
  const sortAnchorRef = useRef<View>(null);
  const [failedLessonImageKeys, setFailedLessonImageKeys] = useState<Set<string>>(() => new Set());
  const [learnedMixWords, setLearnedMixWords] = useState<Word[]>([]);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedLessonKeys, setSelectedLessonKeys] = useState<Set<string>>(() => new Set());

  const markLessonImageFailed = useCallback((key: string) => {
    setFailedLessonImageKeys((current) => {
      if (current.has(key)) return current;
      const next = new Set(current);
      next.add(key);
      return next;
    });
  }, []);

  const categories = useMemo(() => {
    const mergedCustomLessons = [...bundledCustomLessons];

    customLessons.forEach((lesson) => {
      const existingIndex = mergedCustomLessons.findIndex((item: any) => item.id === lesson.id);
      if (existingIndex >= 0) {
        mergedCustomLessons[existingIndex] = lesson;
      } else {
        mergedCustomLessons.unshift(lesson);
      }
    });

    if (!mergedCustomLessons.length) return vocabularyCategories;
    return [{ title: 'Custom', lessons: mergedCustomLessons }, ...vocabularyCategories];
  }, [bundledCustomLessons, customLessons]);

  const allLessons = useMemo(() => {
    return categories
      .flatMap((category: any) => category.lessons)
      .sort((a, b) => (a.title || '').localeCompare(b.title || '', undefined, { sensitivity: 'base' }));
  }, [categories]);
  const selectedLessons = useMemo(
    () => allLessons.filter((lesson: any) => selectedLessonKeys.has(getLessonProgressKey(lesson))),
    [allLessons, selectedLessonKeys]
  );

  useFocusEffect(
    React.useCallback(() => {
      let active = true;
      getCustomVocabularyLessons().then((lessons) => {
        if (active) setCustomLessons(lessons);
      });
      return () => { active = false; };
    }, [])
  );

  useFocusEffect(
    React.useCallback(() => {
      let active = true;
      getLearnedFlashcardKeysByLesson().then((learnedByLesson) => {
        if (active) setLearnedMixWords(buildLearnedMixWords(allLessons, learnedByLesson));
      });
      return () => { active = false; };
    }, [allLessons])
  );

  useEffect(() => {
    setCardView(vocabLessonCardView);
  }, [vocabLessonCardView]);

  const handleDifficultySelect = (level: number | null) => {
    setSelectedDifficulty(level === selectedDifficulty ? null : level);
    setShowDifficultyMenu(false);
  };

  const handleCardViewChange = (nextView: 'list' | 'tile') => {
    setCardView(nextView);
    updateVocabLessonCardView(nextView);
  };

  const toggleSelectionMode = () => {
    if (selectionMode) {
      setSelectedLessonKeys(new Set());
    }

    setSelectionMode((current) => !current);
  };

  const clearSelection = () => {
    setSelectedLessonKeys(new Set());
  };

  const closeSelectionMode = () => {
    setSelectedLessonKeys(new Set());
    setSelectionMode(false);
  };

  const toggleLessonSelection = useCallback((lesson: any) => {
    const lessonKey = getLessonProgressKey(lesson);

    setSelectedLessonKeys((current) => {
      const next = new Set(current);

      if (next.has(lessonKey)) {
        next.delete(lessonKey);
      } else {
        next.add(lessonKey);
      }

      return next;
    });
  }, []);

  const openVocabularyLesson = useCallback((lesson: any) => {
    navigation.navigate('VocabularyLesson', { lesson: getSerializableVocabularyLesson(lesson) });
  }, [navigation]);

  const filterLessons = React.useCallback(
    (lessons: any[]) => lessons.filter((lesson: any) => {
      const title = (lesson.title || '').replace(/\s*\d+$/, '');
      return (
        (!selectedDifficulty || difficultyMap[title] === selectedDifficulty) &&
        (!searchText || title.toLowerCase().includes(searchText.toLowerCase()))
      );
    }),
    [searchText, selectedDifficulty]
  );

  const getLevelLabel = (level: number | null) => {
    if (!level) return copy.allLevels;
    return STAR_EMOJI.repeat(level);
  };

  const startLearnedMix = () => {
    if (!learnedMixWords.length) return;

    setSelectionMode(false);
    setSelectedLessonKeys(new Set());
    navigation.navigate('VocabRush');
  };

  const startSelectedVocabularyMix = () => {
    if (selectedLessons.length < 2) return;

    const seenWords = new Set<string>();
    const mixedWords: Word[] = [];

    selectedLessons.forEach((lesson: any) => {
      const sourceLesson = {
        id: lesson?.id ?? getLessonProgressKey(lesson),
        title: String(lesson?.title ?? ''),
      };

      getLessonWords(lesson).forEach((word) => {
        const wordKey = vocabularyWordKey(word);
        if (seenWords.has(wordKey)) return;

        seenWords.add(wordKey);
        mixedWords.push({
          ...word,
          sourceLesson,
        });
      });
    });

    if (mixedWords.length === 0) return;

    const selectedKeys = selectedLessons
      .map((lesson: any) => getLessonProgressKey(lesson))
      .sort()
      .join('-');
    const sourceLessonImageCards = selectedLessons
      .map((lesson: any) => {
        const imageUrl = getVocabularyLessonImageUrl(lesson);

        return imageUrl
          ? {
              id: getLessonProgressKey(lesson),
              title: String(lesson?.title ?? ''),
              imageUrl,
            }
          : null;
      })
      .filter((imageCard): imageCard is { id: string; title: string; imageUrl: string } => !!imageCard);
    const sourceLessonImages = sourceLessonImageCards.map((imageCard) => imageCard.imageUrl);

    setSelectionMode(false);
    setSelectedLessonKeys(new Set());
    navigation.navigate('VocabularyLesson', {
      lesson: {
        id: `vocabulary-mix-${selectedKeys}`,
        title: `${copy.mixedPracticeTitle}: ${copy.selectedMixTitle}`,
        description: copy.mixedPracticeSubtitle.replace('{count}', String(selectedLessons.length)),
        imageUrl: sourceLessonImages[0] ?? selectedLessons[0]?.imageUrl ?? '',
        flashcards: shuffleArray(mixedWords),
        isVocabularyMix: true,
        sourceLessonCount: selectedLessons.length,
        sourceLessonImageCards,
        sourceLessonImages,
      },
      backLabel: commonCopy.backToVocabulary,
    });
  };

  const visibleSections = useMemo(
    () => (viewMode === 'category' ? categories : [{ title: 'All', lessons: allLessons }])
      .map((category) => ({
        ...category,
        lessons: filterLessons(category.lessons),
      }))
      .filter((category) => category.lessons.length > 0),
    [allLessons, categories, filterLessons, viewMode]
  );
  const knownWordsAvailable = learnedMixWords.length > 0;
  const selectionTrayBottomPadding = Platform.OS === 'web' ? 16 : Math.max(insets.bottom, 12);
  const studySurface = useMemo(() => getStudySurfaceColors(colors, isDarkMode), [colors, isDarkMode]);
  const trayColors = useMemo(() => getSelectionTrayColors(colors, isDarkMode), [colors, isDarkMode]);
  const traySurfaceColor = trayColors.surface;
  const trayControlColor = trayColors.control;
  const trayBorderColor = trayColors.border;
  const trayTextColor = trayColors.text;
  const trayMutedColor = trayColors.muted;
  const trayActionColor = trayColors.action;
  const trayStartEnabledBackground = trayColors.startBackground;
  const trayStartEnabledText = trayColors.startText;
  const selectedMixWordCount = useMemo(() => {
    const seenWords = new Set<string>();

    selectedLessons.forEach((lesson: any) => {
      getLessonWords(lesson).forEach((word) => {
        seenWords.add(vocabularyWordKey(word));
      });
    });

    return seenWords.size;
  }, [selectedLessons]);
  const selectionScrollPadding = selectionMode
    ? selectedLessons.length > 0 ? 150 : 96
    : 18;
  const searchSurfaceColor = studySurface.search;
  const searchBorderColor = studySurface.searchBorder;
  const searchActiveColor = studySurface.searchActive;
  const searchFocusAnim = useSearchFocusAnimation(!!searchText.trim(), searchBorderColor, searchActiveColor);

  const sectionListData = useMemo<LessonSection[]>(() =>
    visibleSections.map((category) => {
      const rows: LessonRowItem[] = cardView === 'tile'
        ? chunkArray(category.lessons, 2).map((group, i) => ({
            key: `${category.title}-tile-${i}`,
            lessons: group,
            categoryTitle: category.title,
          }))
        : category.lessons.map((lesson: any, i: number) => ({
            key: `${category.title}-list-${lesson.id || lesson.title || i}`,
            lessons: [lesson],
            categoryTitle: category.title,
          }));
      return { title: category.title, count: category.lessons.length, data: rows };
    }),
  [visibleSections, cardView]);
  const hasVocabularyLessons = allLessons.length > 0;
  const hasActiveVocabularyFilters = !!searchText.trim() || selectedDifficulty != null;
  const emptyStateTitle = hasVocabularyLessons && hasActiveVocabularyFilters
    ? copy.noSearchTitle
    : copy.noLessonTitle;
  const emptyStateText = hasVocabularyLessons && hasActiveVocabularyFilters
    ? copy.noSearchText
    : copy.noLessonText;

  const renderSectionHeader = useCallback(({ section }: { section: LessonSection }) => {
    if (viewMode !== 'category') return null;
    return (
      <View style={{ paddingHorizontal: 16 }}>
        <View style={styles.categoryHeaderRow}>
          <Text style={styles.categoryEmoji}>{CATEGORY_EMOJI_MAP[section.title] || '\u{1F4DA}'}</Text>
          <View style={styles.categoryTitleBlock}>
            <Text style={[styles.categoryHeader, { color: colors.text }]}>{section.title}</Text>
            <Text style={[styles.categoryMeta, { color: colors.secondaryText }]}>
              {section.count} {section.count > 1 ? copy.lessonPlural : copy.lessonSingular}
            </Text>
            <View style={[styles.categoryRule, { backgroundColor: colors.border }]} />
          </View>
        </View>
      </View>
    );
  }, [viewMode, colors.text, colors.secondaryText, colors.border, copy.lessonPlural, copy.lessonSingular]);

  const renderSectionFooter = useCallback(() => <View style={{ height: 8 }} />, []);

  const renderLessonItem = useCallback(({ item }: { item: LessonRowItem }) => {
    const isTile = cardView === 'tile';
    return (
      <View style={[{ paddingHorizontal: 16 }, isTile && styles.lessonsContainerTile]}>
        {item.lessons.map((lesson, i) => {
          const lessonProgressKey = getLessonProgressKey(lesson);
          const lessonTitle = (lesson.title || '').replace(/\s*\d+/, '');
          const lessonImageKey = String(lesson.id || lesson.title || lessonTitle || i);
          return (
            <VocabularyLessonCard
              key={`${lesson.id || lesson.title}-${i}`}
              lesson={lesson}
              rowIndex={i}
              cardView={cardView}
              compactTile={windowWidth < 768}
              selectionMode={selectionMode}
              selected={selectedLessonKeys.has(lessonProgressKey)}
              imageFailed={failedLessonImageKeys.has(lessonImageKey)}
              imageSource={getVocabularyLessonImageSource(lesson)}
              difficulty={difficultyMap[lessonTitle]}
              categoryEmoji={CATEGORY_EMOJI_MAP[item.categoryTitle] || '📚'}
              colors={colors}
              isDarkMode={isDarkMode}
              copy={copy}
              onOpenLesson={openVocabularyLesson}
              onToggleLesson={toggleLessonSelection}
              onImageError={markLessonImageFailed}
            />
          );
        })}
        {isTile && item.lessons.length === 1 && <View style={{ width: windowWidth < 768 ? '46%' : '48%' }} />}
      </View>
    );
  }, [
    cardView, selectionMode, selectedLessonKeys, failedLessonImageKeys,
    colors, isDarkMode, copy, openVocabularyLesson, toggleLessonSelection, markLessonImageFailed, windowWidth,
  ]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SectionList
        sections={sectionListData}
        keyExtractor={(item: LessonRowItem) => item.key}
        renderItem={renderLessonItem}
        renderSectionHeader={renderSectionHeader}
        renderSectionFooter={renderSectionFooter}
        contentContainerStyle={[
          { paddingTop: topContentInset, paddingBottom: selectionScrollPadding },
          isDesktopWeb && styles.desktopContentWrap,
        ]}
        onScrollBeginDrag={() => { setShowDifficultyMenu(false); setShowSortMenu(false); }}
        keyboardShouldPersistTaps="handled"
        stickySectionHeadersEnabled={false}
        ListHeaderComponent={<>
        <BackButton label={commonCopy.backToHome} onPress={() => navigation.navigate('Home')} />

        <View style={styles.headerRow}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            {copy.header}
          </Text>
          <TouchableOpacity
            activeOpacity={0.84}
            onPress={toggleSelectionMode}
            style={[
              styles.headerSelectButton,
              {
                backgroundColor: selectionMode ? colors.primarySoft : studySurface.control,
                borderColor: selectionMode ? colors.primary : studySurface.controlBorder,
              },
            ]}
            accessibilityRole="button"
            accessibilityState={{ selected: selectionMode }}
          >
            <MaterialIcons
              name={selectionMode ? 'close' : 'checklist'}
              size={18}
              color={selectionMode ? colors.primary : colors.secondaryText}
            />
            <Text
              style={[styles.headerSelectText, { color: selectionMode ? colors.primary : colors.text }]}
              numberOfLines={1}
            >
              {selectionMode ? copy.cancelSelection : copy.selectLessons}
            </Text>
          </TouchableOpacity>
        </View>

        <Animated.View
          style={[
            styles.searchShell,
            getInsetSurfaceStyle(colors, isDarkMode),
            {
              backgroundColor: searchSurfaceColor,
              borderRadius: uiRadii.control,
            },
            searchFocusAnim.animatedStyle,
          ]}
        >
          <TextInput
            value={searchText}
            onChangeText={setSearchText}
            onFocus={searchFocusAnim.onFocus}
            onBlur={searchFocusAnim.onBlur}
            placeholder={copy.searchPlaceholder}
            placeholderTextColor={colors.secondaryText}
            style={[
              styles.searchInput,
              {
                backgroundColor: 'transparent',
                color: colors.text,
                borderWidth: 0,
                paddingRight: 45,
                paddingLeft: 44,
                paddingVertical: 14,
                fontSize: 16,
              },
            ]}
          />

          <View style={styles.searchIconWrap}>
            <MaterialIcons name="search" size={20} color={searchActiveColor} />
          </View>

          {searchText.length > 0 && (
            <Animated.View entering={FadeIn.duration(140)} exiting={FadeOut.duration(110)} style={styles.searchClearButton}>
              <TouchableOpacity
                onPress={() => setSearchText('')}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessibilityRole="button"
                accessibilityLabel={copy.clearSearch}
              >
                <MaterialIcons name="close" size={20} color={searchActiveColor} />
              </TouchableOpacity>
            </Animated.View>
          )}
        </Animated.View>

        <View style={[styles.newFilterRow, styles.newFilterRowSpacing, viewMode === 'abc' && styles.newFilterRowSpacingAbc]}>
          <View ref={sortAnchorRef}>
          <TouchableOpacity
            onPress={() => {
              if (showSortMenu) { setShowSortMenu(false); return; }
              sortAnchorRef.current?.measureInWindow((x, y, width, height) => {
                setSortAnchor({ x, y, width, height });
                setShowSortMenu(true);
              });
            }}
            accessibilityRole="button"
            accessibilityLabel={copy.openFilters}
            accessibilityState={{ expanded: showSortMenu }}
          >
            <Text style={[styles.newFilterLink, { color: colors.text }]} numberOfLines={1}>
              Sort: {viewMode === 'category' ? copy.category : copy.abc} ▾
            </Text>
          </TouchableOpacity>
          </View>

          <Text style={[styles.newFilterDivider, { color: isDarkMode ? colors.border : '#D9D3C7' }]}>·</Text>

          <View ref={difficultyAnchorRef}>
            <TouchableOpacity
              onPress={() => {
                if (showDifficultyMenu) { setShowDifficultyMenu(false); return; }
                difficultyAnchorRef.current?.measureInWindow((x, y, width, height) => {
                  setDifficultyAnchor({ x, y, width, height });
                  setShowDifficultyMenu(true);
                });
              }}
              accessibilityRole="button"
              accessibilityLabel={copy.openFilters}
              accessibilityState={{ expanded: showDifficultyMenu }}
            >
              <Text
                style={[
                  styles.newFilterLink,
                  { color: selectedDifficulty ? colors.primary : colors.text },
                ]}
                numberOfLines={1}
              >
                {getLevelLabel(selectedDifficulty)} ▾
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.newFilterSpacer} />

          <View style={styles.newViewToggleGroup}>
            <TouchableOpacity
              onPress={() => handleCardViewChange('list')}
              style={[
                styles.newGridToggle,
                {
                  backgroundColor: cardView === 'list' ? (isDarkMode ? colors.primarySoft : '#EAF2FF') : (isDarkMode ? colors.surface : 'transparent'),
                },
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected: cardView === 'list' }}
              accessibilityLabel="Switch to list view"
            >
              <MaterialIcons
                name="view-list"
                size={17}
                color={cardView === 'list' ? colors.primary : colors.text}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleCardViewChange('tile')}
              style={[
                styles.newGridToggle,
                {
                  backgroundColor: cardView === 'tile' ? (isDarkMode ? colors.primarySoft : '#EAF2FF') : (isDarkMode ? colors.surface : 'transparent'),
                },
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected: cardView === 'tile' }}
              accessibilityLabel="Switch to grid view"
            >
              <MaterialIcons
                name="grid-view"
                size={17}
                color={cardView === 'tile' ? colors.primary : colors.text}
              />
            </TouchableOpacity>
          </View>
        </View>

      </>}
      ListEmptyComponent={
        <View
          style={[
            styles.emptyStateCard,
            getPanelStyle(colors, isDarkMode),
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.emptyStateTitle, { color: colors.text }]}>{emptyStateTitle}</Text>
          <Text style={[styles.emptyStateText, { color: colors.secondaryText }]}>{emptyStateText}</Text>
        </View>
      }
      />

      {selectionMode && (
        <View
          style={[
            styles.selectionTrayWrap,
            {
              paddingBottom: selectionTrayBottomPadding,
              pointerEvents: 'box-none',
            },
          ]}
        >
          <View
            style={[
              styles.selectionControls,
              getSoftShadow(isDarkMode, 'raised'),
              {
                backgroundColor: traySurfaceColor,
                borderColor: trayBorderColor,
              },
            ]}
          >
            <View style={styles.selectionActionRow}>
              <TouchableOpacity
                activeOpacity={selectedLessons.length > 0 ? 0.82 : 1}
                onPress={clearSelection}
                disabled={selectedLessons.length === 0}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={[
                  styles.trayIconButton,
                  selectedLessons.length === 0 && styles.trayIconButtonDisabled,
                  {
                    backgroundColor: trayControlColor,
                    borderColor: trayBorderColor,
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel={copy.clearSelection}
                accessibilityState={{ disabled: selectedLessons.length === 0 }}
              >
                <MaterialIcons
                  name="delete-sweep"
                  size={19}
                  color={selectedLessons.length > 0 ? trayActionColor : trayMutedColor}
                />
              </TouchableOpacity>
              <View style={styles.selectionCountPill}>
                <MaterialIcons name="view-carousel" size={19} color={trayActionColor} />
                <View style={styles.selectionDeckCopy}>
                  <Text style={[styles.selectionDeckTitle, { color: trayTextColor }]} numberOfLines={1}>
                    {copy.selectedMixTitle}
                  </Text>
                  <Text style={[styles.selectedCountText, { color: trayMutedColor }]} numberOfLines={1}>
                    {copy.selectionCount.replace('{count}', String(selectedLessons.length))}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                activeOpacity={0.82}
                onPress={closeSelectionMode}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={[
                  styles.trayIconButton,
                  {
                    backgroundColor: trayControlColor,
                    borderColor: trayBorderColor,
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel={copy.cancelSelection}
              >
                <MaterialIcons name="close" size={19} color={trayActionColor} />
              </TouchableOpacity>
            </View>

            {selectedLessons.length > 0 && (
              <View style={[styles.selectedMixPreviewRow, isPortraitTight && styles.selectedMixPreviewRowCompact, { borderTopColor: trayBorderColor }]}>
                <View style={[styles.selectedMixStackCanvas, isPortraitTight && styles.selectedMixStackCanvasCompact]}>
                  {selectedLessons.slice(0, 4).map((selectedLesson: any, stackIndex: number) => {
                    const selectedLessonImageSource = getVocabularyLessonImageSource(selectedLesson);
                    const selectedLessonKey = getLessonProgressKey(selectedLesson);

                    return (
                      <View
                        key={selectedLessonKey}
                        style={[
                          styles.selectedMixStackCard,
                          isPortraitTight && styles.selectedMixStackCardCompact,
                          {
                            left: stackIndex * (isPortraitTight ? 22 : 32),
                            zIndex: stackIndex + 1,
                            transform: [{ rotate: stackIndex === 0 ? '-7deg' : stackIndex === 1 ? '-1deg' : stackIndex === 2 ? '5deg' : '10deg' }],
                            backgroundColor: trayColors.stackFrame,
                          },
                        ]}
                      >
                        {selectedLessonImageSource ? (
                          <Image
                            source={selectedLessonImageSource}
                            style={[styles.selectedMixStackImage, { backgroundColor: isDarkMode ? colors.surfaceAlt : '#DCEAF3' }]}
                            resizeMode="cover"
                          />
                        ) : (
                          <MaterialIcons name="image-not-supported" size={19} color={trayMutedColor} />
                        )}
                      </View>
                    );
                  })}
                  {selectedLessons.length > 4 && (
                    <View style={[styles.selectedMixMoreBadge, { backgroundColor: trayStartEnabledBackground, borderColor: trayColors.stackFrame }]}>
                      <Text style={[styles.selectedMixMoreText, { color: trayStartEnabledText }]}>
                        +{selectedLessons.length - 4}
                      </Text>
                    </View>
                  )}
                </View>
                <View style={styles.selectedMixPreviewTextBlock}>
                  <Text style={[styles.selectedMixPreviewTitle, isPortraitTight && styles.selectedMixPreviewTitleCompact, { color: trayTextColor }]} numberOfLines={1}>
                    {selectedLessons.slice(0, 3).map((selectedLesson: any) => selectedLesson.title).join(' + ')}
                    {selectedLessons.length > 3 ? ` + ${selectedLessons.length - 3} more` : ''}
                  </Text>
                  {selectedLessons.length === 1 ? (
                    <Text style={[styles.selectedMixHint, { color: trayMutedColor }]} numberOfLines={1}>
                      Select 1 more to start
                    </Text>
                  ) : (
                    <Text style={[styles.selectedMixPreviewMeta, { color: trayMutedColor }]} numberOfLines={1}>
                      {selectedMixWordCount} {selectedMixWordCount === 1 ? copy.wordSingular : copy.wordPlural}
                    </Text>
                  )}
                </View>
                <TouchableOpacity
                  activeOpacity={selectedLessons.length >= 2 ? 0.84 : 1}
                  onPress={startSelectedVocabularyMix}
                  disabled={selectedLessons.length < 2}
                  style={[
                    styles.startMixButton,
                    isPortraitTight && styles.startMixButtonCompact,
                    {
                      backgroundColor: selectedLessons.length >= 2 ? trayStartEnabledBackground : trayControlColor,
                      borderColor: selectedLessons.length >= 2 ? trayStartEnabledBackground : trayBorderColor,
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: selectedLessons.length < 2 }}
                >
                  <MaterialIcons
                    name="shuffle"
                    size={18}
                    color={selectedLessons.length >= 2 ? trayStartEnabledText : trayMutedColor}
                  />
                  {!isPortraitTight && (
                    <Text
                      style={[
                        styles.startMixText,
                        { color: selectedLessons.length >= 2 ? trayStartEnabledText : trayMutedColor },
                      ]}
                      numberOfLines={1}
                    >
                      {copy.startMixedPractice}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      )}

      {showSortMenu && (
        <Pressable style={styles.menuBackdrop} onPress={() => setShowSortMenu(false)}>
          <View
            style={[
              styles.dropdownMenu,
              styles.sortMenu,
              getSoftShadow(isDarkMode, 'strong'),
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                top: sortAnchor.y + sortAnchor.height + 8,
                left: sortAnchor.x,
              },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.difficultyMenuItem,
                viewMode === 'category' && { backgroundColor: colors.primarySoft },
              ]}
              onPress={() => { setViewMode('category'); setShowSortMenu(false); }}
              accessibilityRole="button"
              accessibilityLabel={copy.showByCategory}
              accessibilityState={{ selected: viewMode === 'category' }}
            >
              <Text style={[styles.difficultyMenuText, { color: viewMode === 'category' ? colors.primary : colors.text }]}>
                {copy.category}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.difficultyMenuItem,
                viewMode === 'abc' && { backgroundColor: colors.primarySoft },
              ]}
              onPress={() => { setViewMode('abc'); setShowSortMenu(false); }}
              accessibilityRole="button"
              accessibilityLabel={copy.showAlphabetically}
              accessibilityState={{ selected: viewMode === 'abc' }}
            >
              <Text style={[styles.difficultyMenuText, { color: viewMode === 'abc' ? colors.primary : colors.text }]}>
                {copy.abc}
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      )}

      {showDifficultyMenu && (
        <Pressable style={styles.menuBackdrop} onPress={() => setShowDifficultyMenu(false)}>
          <View
            style={[
              styles.dropdownMenu,
              styles.difficultyMenu,
              getSoftShadow(isDarkMode, 'strong'),
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                top: difficultyAnchor.y + difficultyAnchor.height + 8,
                left: Math.max(16, difficultyAnchor.x + difficultyAnchor.width - 188),
              },
            ]}
          >
            {[null, 1, 2, 3].map((lvl, i) => (
              <TouchableOpacity
                key={i}
                style={[
                  styles.difficultyMenuItem,
                  selectedDifficulty === lvl && { backgroundColor: colors.primarySoft },
                ]}
                onPress={() => handleDifficultySelect(lvl)}
                accessibilityRole="button"
                accessibilityLabel={lvl ? `${copy.showLevel} ${lvl}` : copy.showAllLevels}
              >
                {lvl ? (
                  <View style={styles.difficultyMenuItemRow}>
                    <Text style={[styles.difficultyMenuText, { color: colors.text }]}>
                      {STAR_EMOJI.repeat(lvl)}
                    </Text>
                    <Text style={[styles.difficultyMenuLabel, { color: colors.secondaryText }]}>
                      {copy.levelLabels[lvl - 1]}
                    </Text>
                  </View>
                ) : (
                  <Text style={[styles.difficultyMenuText, { color: colors.text }]}>
                    {`\u2728 ${copy.allLevels}`}
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      )}

      {knownWordsAvailable && !selectionMode && (
        <TouchableOpacity
          onPress={startLearnedMix}
          style={[
            styles.vocabRushFab,
            getSoftShadow(isDarkMode, 'strong'),
            {
              bottom: Math.max(insets.bottom, 16) + 24,
              backgroundColor: isDarkMode ? '#b3282c' : '#d73337',
              borderColor: '#ffffff',
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel={`Start Vocab Rush — up to ${Math.min(learnedMixWords.length, MAX_VOCAB_RUSH_WORDS) * MAX_XP_PER_PAIR} XP possible`}
        >
          <MaterialIcons name="bolt" size={28} color="#ffffff" />
          <View style={[styles.vocabRushFabBadge, { backgroundColor: '#ffffff', borderColor: isDarkMode ? '#b3282c' : '#d73337' }]}>
            <Text style={[styles.vocabRushFabBadgeText, { color: isDarkMode ? '#b3282c' : '#d73337' }]} numberOfLines={1}>
              {(() => {
                const maxXp = Math.min(learnedMixWords.length, MAX_VOCAB_RUSH_WORDS) * MAX_XP_PER_PAIR;
                return `${maxXp > 999 ? '999+' : maxXp} XP`;
              })()}
            </Text>
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  desktopContentWrap: {
    width: '100%',
    maxWidth: 1000,
    alignSelf: 'center',
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    paddingBottom: 14,
    paddingHorizontal: 24,
  },
  headerTitle: {
    flex: 1,
    fontSize: 32,
    fontWeight: 'bold',
    minWidth: 0,
  },
  headerSelectButton: {
    alignItems: 'center',
    borderRadius: uiRadii.control,
    borderWidth: 1.5,
    flexDirection: 'row',
    gap: 7,
    minHeight: 42,
    maxWidth: 174,
    paddingHorizontal: 12,
  },
  headerSelectText: {
    flexShrink: 1,
    fontSize: 14,
    fontWeight: '800',
  },
  newFilterSpacer: {
    flex: 1,
  },
  filterMenuSection: { marginBottom: 4 },
  filterMenuSectionLabel: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 6,
  },
  filterMenuViewRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    paddingBottom: 10,
  },
  filterMenuViewOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 40,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  filterMenuViewOptionText: { fontSize: 12, fontWeight: '700' },
  filterMenuDivider: { height: 1, marginHorizontal: 12 },
  menuBackdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9998 },
  dropdownMenu: {
    position: 'absolute',
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    zIndex: 9999,
    elevation: 8,
  },
  difficultyMenu: { width: 210 },
  sortMenu: { width: 150 },
  difficultyMenuItem: {
    paddingVertical: 14,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  difficultyMenuItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  difficultyMenuText: { fontSize: 15, fontWeight: '700' },
  difficultyMenuLabel: { fontSize: 13, fontWeight: '700' },
  searchShell: {
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 14,
    borderWidth: 1.5,
    borderRadius: uiRadii.control,
    overflow: 'hidden',
    position: 'relative',
  },
  searchInput: { minHeight: 46, padding: 14, fontSize: 16 },
  searchIconWrap: {
    position: 'absolute',
    left: 16,
    top: 0,
    bottom: 0,
    width: 24,
    paddingTop: 15,
    paddingBottom: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchClearButton: {
    position: 'absolute',
    right: 18,
    top: 0,
    bottom: 0,
    width: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  newFilterRowSpacing: {
    paddingHorizontal: 16,
  },
  // ABC (alphabetical) mode has no category section header below this row to
  // provide breathing room before the first lesson card, unlike category mode.
  newFilterRowSpacingAbc: {
    marginBottom: 28,
  },
  newFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 34,
    marginBottom: 16,
  },
  newFilterLink: {
    fontSize: 14.5,
    fontWeight: '700',
  },
  newFilterDivider: {
    fontSize: 15,
    fontWeight: '600',
  },
  vocabRushFab: {
    position: 'absolute',
    right: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vocabRushFabBadge: {
    position: 'absolute',
    top: -6,
    right: -10,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vocabRushFabBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  newViewToggleGroup: {
    flexDirection: 'row',
    gap: 4,
  },
  newGridToggle: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateCard: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 10,
    padding: 18,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  emptyStateTitle: {
    fontWeight: freshFontFamily.extrabold,
    fontSize: 18,
    marginBottom: 4,
  },
  emptyStateText: {
    fontWeight: freshFontFamily.semibold,
    fontSize: 14,
    lineHeight: 20,
  },
  selectionControls: {
    alignItems: 'stretch',
    borderRadius: 28,
    borderWidth: 2,
    gap: 7,
    marginHorizontal: 10,
    minHeight: 46,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 8,
  },
  selectionTrayWrap: {
    backgroundColor: 'transparent',
    bottom: 0,
    elevation: 20,
    left: 0,
    paddingTop: 10,
    position: 'absolute',
    right: 0,
    zIndex: 20,
  },
  selectionActionRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  selectionCountPill: {
    alignItems: 'center',
    flexDirection: 'row',
    flexGrow: 1,
    gap: 7,
    justifyContent: 'flex-start',
    minHeight: 34,
    minWidth: 0,
    paddingHorizontal: 3,
  },
  selectionDeckCopy: {
    flex: 1,
    minWidth: 0,
  },
  selectionDeckTitle: {
    fontSize: 12,
    fontWeight: '900',
    lineHeight: 14,
  },
  selectedCountText: {
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 13,
  },
  trayIconButton: {
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1.5,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  trayIconButtonDisabled: {
    opacity: 0.55,
  },
  startMixButton: {
    alignItems: 'center',
    borderRadius: 13,
    borderWidth: 1.5,
    borderBottomWidth: 2.5,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    minHeight: 40,
    minWidth: 116,
    paddingHorizontal: 12,
  },
  startMixButtonCompact: {
    minWidth: 44,
    paddingHorizontal: 10,
  },
  startMixText: {
    fontSize: 13,
    fontWeight: '800',
  },
  selectedMixPreviewRow: {
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 12,
    minHeight: 96,
    paddingHorizontal: 0,
    paddingTop: 8,
  },
  selectedMixPreviewRowCompact: {
    gap: 8,
  },
  selectedMixStackCanvas: {
    height: 96,
    position: 'relative',
    width: 200,
  },
  selectedMixStackCanvasCompact: {
    width: 134,
  },
  selectedMixStackCard: {
    alignItems: 'center',
    borderColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 2.5,
    elevation: 3,
    height: 90,
    justifyContent: 'center',
    overflow: 'hidden',
    padding: 0,
    position: 'absolute',
    boxShadow: '0px 2px 6px rgba(0,0,0,0.18)',
    top: 3,
    width: 74,
  },
  selectedMixStackCardCompact: {
    height: 74,
    width: 60,
  },
  selectedMixStackImage: {
    borderRadius: 0,
    height: '100%',
    width: '100%',
  },
  selectedMixMoreBadge: {
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 2,
    bottom: 0,
    height: 28,
    justifyContent: 'center',
    position: 'absolute',
    right: 0,
    width: 28,
    zIndex: 8,
  },
  selectedMixMoreText: {
    fontSize: 10,
    fontWeight: '900',
  },
  selectedMixPreviewTextBlock: {
    flex: 1,
    minWidth: 0,
  },
  selectedMixPreviewTitle: {
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 18,
  },
  selectedMixPreviewTitleCompact: {
    fontSize: 13,
    lineHeight: 16,
  },
  selectedMixHint: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  selectedMixPreviewMeta: {
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 16,
    marginTop: 2,
  },
  categoryHeaderRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 12, marginBottom: 12 },
  categoryEmoji: { fontSize: 34, marginRight: 8 },
  categoryTitleBlock: { flex: 1 },
  categoryHeader: { fontWeight: freshFontFamily.extrabold, fontSize: 22 },
  categoryMeta: { fontWeight: freshFontFamily.semibold, fontSize: 12, marginTop: 2 },
  categoryRule: {
    width: '100%',
    height: 2,
    borderRadius: 999,
    marginTop: 8,
  },
  lessonsContainerTile: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
});
