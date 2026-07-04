import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  TouchableOpacity,
  Image,
  Animated,
  Easing,
  TextInput,
  Platform,
  Pressable,
  Modal,
  useWindowDimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../settings/ThemeContext';
import BackButton from '../shared/BackButton';
import { getLessonImage, getLessonThumbnailSource, shuffleArray } from './vocabularyUtils';
import { vocabularyCategories } from '../../content/lessons/vocabularyRegistry';
import { getCustomVocabularyLessons } from '../lessons/customLessonStorage';
import { getMenuCopy } from '../shared/menuCopy';
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

const bundledCustomVocabularyLessons = require('../../content/lessons/customVocabularyLessons.json') as any[];

const STAR_EMOJI = '\u2B50';
const LEARNT_MIX_MAX_WORDS = 36;
const LEARNT_MIX_UNLOCK_COUNT = 50;
const LEARNT_MIX_UNLOCK_SEEN_KEY = '@learnt_words_challenge_unlock_seen_overlay_v1';
const LEARNT_MIX_UNLOCK_GRADIENT: [string, string, string] = [
  'rgba(0,0,0,0.18)',
  'rgba(0,0,0,0.62)',
  'rgba(0,0,0,0.94)',
];

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
  const topContentInset = Platform.OS === 'ios'
    ? insets.top
    : Platform.OS === 'android' && isAndroidStatusBarEnabled
      ? insets.top
      : 0;
  const thumbX = useRef(new Animated.Value(0)).current;
  const unlockOverlayOpacity = useRef(new Animated.Value(0)).current;
  const unlockOverlayScale = useRef(new Animated.Value(0.96)).current;
  const isPortraitTight = windowWidth < 430;
  const isMobileHeader = windowWidth < 640;

  const bundledCustomLessons = useMemo(
    () => bundledCustomVocabularyLessons.map(normalizeCustomLesson).filter(Boolean),
    []
  );

  const [customLessons, setCustomLessons] = useState<any[]>([]);
  const [selectedDifficulty, setSelectedDifficulty] = useState<number | null>(null);
  const [showDifficultyMenu, setShowDifficultyMenu] = useState(false);
  const [viewMode, setViewMode] = useState<'category' | 'abc'>('category');
  const [cardView, setCardView] = useState<'list' | 'tile'>(vocabLessonCardView);
  const [searchText, setSearchText] = useState('');
  const [toggleWidth, setToggleWidth] = useState(0);
  const [difficultyAnchor, setDifficultyAnchor] = useState({ x: 16, y: 0, width: 180, height: 50 });
  const [failedLessonImageKeys, setFailedLessonImageKeys] = useState<Set<string>>(() => new Set());
  const [learnedMixWords, setLearnedMixWords] = useState<Word[]>([]);
  const [learnedMixUnlockMessageVisible, setLearnedMixUnlockMessageVisible] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedLessonKeys, setSelectedLessonKeys] = useState<Set<string>>(() => new Set());
  const segmentPadding = isPortraitTight ? 5 : 6;

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
    const half = Math.max(0, (toggleWidth - segmentPadding * 2) / 2);
    const toValue = viewMode === 'category' ? 0 : half;
    Animated.timing(thumbX, {
      toValue,
      duration: 200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [thumbX, toggleWidth, viewMode]);

  useEffect(() => {
    setCardView(vocabLessonCardView);
  }, [vocabLessonCardView]);

  useEffect(() => {
    if (!learnedMixUnlockMessageVisible) {
      unlockOverlayOpacity.setValue(0);
      unlockOverlayScale.setValue(0.96);
      return;
    }

    Animated.parallel([
      Animated.timing(unlockOverlayOpacity, {
        toValue: 1,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(unlockOverlayScale, {
        toValue: 1,
        friction: 8,
        tension: 80,
        useNativeDriver: true,
      }),
    ]).start();
  }, [learnedMixUnlockMessageVisible, unlockOverlayOpacity, unlockOverlayScale]);

  useEffect(() => {
    let active = true;

    if (learnedMixWords.length < LEARNT_MIX_UNLOCK_COUNT) {
      setLearnedMixUnlockMessageVisible(false);
      return () => {
        active = false;
      };
    }

    AsyncStorage.getItem(LEARNT_MIX_UNLOCK_SEEN_KEY)
      .then((seen) => {
        if (!active || seen === 'true') return;
        setLearnedMixUnlockMessageVisible(true);
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [learnedMixWords.length]);

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
    navigation.navigate('VocabularyLesson', { lesson });
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
    if (learnedMixWords.length < LEARNT_MIX_UNLOCK_COUNT) return;

    const mixedWords = shuffleArray(learnedMixWords).slice(0, LEARNT_MIX_MAX_WORDS);

    setSelectionMode(false);
    setSelectedLessonKeys(new Set());
    navigation.navigate('VocabularyLesson', {
      lesson: {
        id: 'learned-mix',
        title: 'Learnt Words Challenge',
        description: 'A random matching game with words you marked as learnt.',
        flashcards: mixedWords,
        isLearnedMix: true,
      },
      initialMode: 'matching',
      backLabel: 'Back to Vocabulary',
    });
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

  const closeLearnedMixUnlock = () => {
    setLearnedMixUnlockMessageVisible(false);
    AsyncStorage.setItem(LEARNT_MIX_UNLOCK_SEEN_KEY, 'true').catch(() => {});
  };

  const startLearnedMixFromUnlock = () => {
    closeLearnedMixUnlock();
    startLearnedMix();
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
  const learnedMixPlayable = learnedMixWords.length >= LEARNT_MIX_UNLOCK_COUNT;
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
  const learnedMixColors = {
    background: studySurface.goldSurface,
    border: studySurface.goldBorder,
    iconBackground: colors.buttonBackground,
    iconColor: colors.buttonText,
    countBackground: isDarkMode ? 'rgba(255, 209, 102, 0.14)' : '#FFFFFF',
    countText: studySurface.goldText,
    actionBackground: colors.buttonBackground,
    actionForeground: colors.buttonText,
    actionBorder: colors.buttonBackground,
    shadow: isDarkMode ? '#000000' : '#8DBFDB',
  };

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
        {isTile && item.lessons.length === 1 && <View style={{ width: '48%' }} />}
      </View>
    );
  }, [
    cardView, selectionMode, selectedLessonKeys, failedLessonImageKeys,
    colors, isDarkMode, copy, openVocabularyLesson, toggleLessonSelection, markLessonImageFailed,
  ]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SectionList
        sections={sectionListData}
        keyExtractor={(item: LessonRowItem) => item.key}
        renderItem={renderLessonItem}
        renderSectionHeader={renderSectionHeader}
        renderSectionFooter={renderSectionFooter}
        contentContainerStyle={{ paddingTop: topContentInset, paddingBottom: selectionScrollPadding }}
        onScrollBeginDrag={() => setShowDifficultyMenu(false)}
        keyboardShouldPersistTaps="handled"
        stickySectionHeadersEnabled={false}
        ListHeaderComponent={<>
        <BackButton label={commonCopy.backToHome} onPress={() => navigation.navigate('Home')} />

        <View style={[styles.headerTitleContainer, isMobileHeader && styles.headerTitleContainerMobile]}>
          <View style={[styles.headerTitleRow, isMobileHeader && styles.headerTitleRowCompact]}>
            <Text
              style={[styles.headerTitle, isMobileHeader && styles.headerTitleCompact, { color: colors.text }]}
              numberOfLines={isMobileHeader ? 2 : 1}
            >
              {copy.header}
            </Text>
            <View style={[styles.headerActions, isMobileHeader && styles.headerActionsCompact]}>
              {learnedMixPlayable && !selectionMode && (
                <TouchableOpacity
                  activeOpacity={0.84}
                  onPress={startLearnedMix}
                  style={[
                    styles.headerChallengeChip,
                    {
                      backgroundColor: learnedMixColors.background,
                      borderColor: learnedMixColors.border,
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Start Learnt Words Challenge"
                >
                  <MaterialIcons name="confirmation-number" size={17} color={learnedMixColors.countText} />
                  {(!isPortraitTight || isMobileHeader) && (
                    <Text style={[styles.headerChallengeChipText, { color: learnedMixColors.countText }]} numberOfLines={1}>
                      Challenge
                    </Text>
                  )}
                  <View style={[styles.headerChallengeChipCount, { backgroundColor: learnedMixColors.countBackground }]}>
                    <Text style={[styles.headerChallengeChipCountText, { color: learnedMixColors.countText }]}>
                      {Math.min(learnedMixWords.length, LEARNT_MIX_MAX_WORDS)}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                activeOpacity={0.84}
                onPress={toggleSelectionMode}
                style={[
                  styles.headerSelectButton,
                  isMobileHeader && styles.headerSelectButtonCompact,
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
          </View>

          <View
            style={[
              styles.browsePanel,
              getSoftShadow(isDarkMode, 'soft'),
              {
                backgroundColor: studySurface.panel,
                borderColor: studySurface.panelBorder,
                shadowColor: colors.primary,
              },
            ]}
          >
            <View
              style={[
                styles.controlPanel,
                isPortraitTight && styles.controlPanelCompact,
              ]}
            >
              <View style={styles.controlsRow}>
                <View
                  onLayout={(event) => setToggleWidth(event.nativeEvent.layout.width)}
                  style={[
                    styles.modeToggle,
                    getInsetSurfaceStyle(colors, isDarkMode),
                    isPortraitTight && styles.modeToggleCompact,
                    {
                      backgroundColor: studySurface.control,
                      borderColor: studySurface.controlBorder,
                    },
                  ]}
                >
                  <Animated.View
                    pointerEvents="none"
                    style={{
                      position: 'absolute',
                      top: segmentPadding,
                      bottom: segmentPadding,
                      left: segmentPadding,
                      width: Math.max(0, (toggleWidth - segmentPadding * 2) / 2),
                      borderRadius: 16,
                      backgroundColor: colors.buttonBackground,
                      borderWidth: 1,
                      borderColor: isDarkMode ? colors.primary : 'rgba(255,255,255,0.66)',
                      shadowColor: colors.primary,
                      shadowOpacity: 0.2,
                      shadowRadius: 5,
                      shadowOffset: { width: 0, height: 2 },
                      elevation: 2,
                      transform: [{ translateX: thumbX }],
                    }}
                  />
                  <TouchableOpacity
                    style={styles.modeOption}
                    onPress={() => setViewMode('category')}
                    activeOpacity={0.9}
                    accessibilityRole="button"
                    accessibilityLabel={copy.showByCategory}
                    accessibilityState={{ selected: viewMode === 'category' }}
                  >
                    <Text style={[styles.modeOptionText, isPortraitTight && styles.modeOptionTextCompact, { color: viewMode === 'category' ? colors.buttonText : colors.text }]}>
                      {copy.category}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.modeOption}
                    onPress={() => setViewMode('abc')}
                    activeOpacity={0.9}
                    accessibilityRole="button"
                    accessibilityLabel={copy.showAlphabetically}
                    accessibilityState={{ selected: viewMode === 'abc' }}
                  >
                    <Text style={[styles.modeOptionText, isPortraitTight && styles.modeOptionTextCompact, { color: viewMode === 'abc' ? colors.buttonText : colors.text }]}>
                      {copy.abc}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View
                  style={[
                    styles.viewToggleGroup,
                    isPortraitTight && styles.viewToggleGroupCompact,
                    {
                      backgroundColor: studySurface.control,
                      borderColor: studySurface.controlBorder,
                    },
                  ]}
                >
                  <TouchableOpacity
                    onPress={() => handleCardViewChange('list')}
                    accessibilityRole="button"
                    accessibilityLabel={copy.useListLayout}
                    accessibilityState={{ selected: cardView === 'list' }}
                    style={[
                      styles.iconToggleButton,
                      isPortraitTight && styles.iconToggleButtonCompact,
                      {
                        backgroundColor: cardView === 'list' ? colors.buttonBackground : studySurface.control,
                        borderColor: cardView === 'list' ? colors.primary : 'transparent',
                        shadowColor: cardView === 'list' ? colors.primary : '#000',
                      },
                      cardView === 'list' && styles.iconToggleButtonSelected,
                    ]}
                  >
                    <MaterialIcons name="view-list" size={20} color={cardView === 'list' ? colors.buttonText : colors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleCardViewChange('tile')}
                    accessibilityRole="button"
                    accessibilityLabel={copy.useTileLayout}
                    accessibilityState={{ selected: cardView === 'tile' }}
                    style={[
                      styles.iconToggleButton,
                      isPortraitTight && styles.iconToggleButtonCompact,
                      {
                        backgroundColor: cardView === 'tile' ? colors.buttonBackground : studySurface.control,
                        borderColor: cardView === 'tile' ? colors.primary : 'transparent',
                        shadowColor: cardView === 'tile' ? colors.primary : '#000',
                      },
                      cardView === 'tile' && styles.iconToggleButtonSelected,
                    ]}
                  >
                    <MaterialIcons name="grid-view" size={19} color={cardView === 'tile' ? colors.buttonText : colors.primary} />
                  </TouchableOpacity>
                </View>

                <View
                  style={[styles.levelControlWrap, isPortraitTight && styles.levelControlWrapCompact]}
                  onLayout={(event) => {
                    const { x, y, width, height } = event.nativeEvent.layout;
                    setDifficultyAnchor({ x, y, width, height });
                  }}
                >
                  <TouchableOpacity
                    style={[
                      styles.dropdownButton,
                      isPortraitTight && styles.dropdownButtonCompact,
                      {
                        backgroundColor: selectedDifficulty ? colors.primarySoft : studySurface.control,
                        borderColor: selectedDifficulty ? colors.primary : studySurface.controlBorder,
                      },
                    ]}
                    onPress={() => setShowDifficultyMenu((current) => !current)}
                    accessibilityRole="button"
                    accessibilityLabel={copy.chooseLevel}
                    accessibilityState={{ expanded: showDifficultyMenu }}
                  >
                    <Text style={[styles.dropdownButtonText, isPortraitTight && styles.dropdownButtonTextCompact, { color: selectedDifficulty ? colors.primary : colors.text }]}>
                      {getLevelLabel(selectedDifficulty)}
                    </Text>
                    <MaterialIcons name="arrow-drop-down" size={22} color={colors.primary} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <View
              style={[
                styles.searchShell,
                getInsetSurfaceStyle(colors, isDarkMode),
                {
                  backgroundColor: searchSurfaceColor,
                  borderColor: searchText.trim() ? searchActiveColor : searchBorderColor,
                  borderWidth: searchText.trim() ? 1.5 : 1,
                  borderRadius: uiRadii.control,
                },
              ]}
            >
              <TextInput
                placeholder={copy.searchPlaceholder}
                placeholderTextColor={colors.secondaryText}
                value={searchText}
                onChangeText={setSearchText}
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
                <TouchableOpacity
                  onPress={() => setSearchText('')}
                  style={styles.searchClearButton}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  accessibilityRole="button"
                  accessibilityLabel={copy.clearSearch}
                >
                  <MaterialIcons name="close" size={20} color={searchActiveColor} />
                </TouchableOpacity>
              )}
            </View>
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
          pointerEvents="box-none"
          style={[
            styles.selectionTrayWrap,
            {
              paddingBottom: selectionTrayBottomPadding,
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

      <Modal
        visible={learnedMixUnlockMessageVisible}
        transparent={true}
        animationType="fade"
        statusBarTranslucent={true}
        presentationStyle="overFullScreen"
        hardwareAccelerated
        onRequestClose={closeLearnedMixUnlock}
      >
        <Animated.View
          style={[styles.learnedMixUnlockOverlay, { opacity: unlockOverlayOpacity }]}
          pointerEvents={learnedMixUnlockMessageVisible ? 'auto' : 'none'}
        >
          <LinearGradient
            style={StyleSheet.absoluteFill}
            colors={LEARNT_MIX_UNLOCK_GRADIENT}
            start={[0.5, 0]}
            end={[0.5, 1]}
          />

          <Animated.View
            style={[
              styles.learnedMixUnlockModalCard,
              {
                backgroundColor: learnedMixColors.background,
                borderColor: learnedMixColors.border,
                shadowColor: learnedMixColors.shadow,
                transform: [{ scale: unlockOverlayScale }],
              },
            ]}
          >
            <TouchableOpacity
              onPress={closeLearnedMixUnlock}
              style={styles.learnedMixUnlockClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityRole="button"
              accessibilityLabel="Close learnt words challenge message"
            >
              <MaterialIcons name="close" size={21} color={learnedMixColors.countText} />
            </TouchableOpacity>

            <View style={styles.learnedMixUnlockHero}>
              <Text style={styles.learnedMixUnlockHeroStar}>{STAR_EMOJI}</Text>
              <View
                style={[
                  styles.learnedMixUnlockIcon,
                  {
                    backgroundColor: learnedMixColors.iconBackground,
                    borderColor: learnedMixColors.border,
                  },
                ]}
              >
                <MaterialIcons name="workspace-premium" size={42} color={learnedMixColors.iconColor} />
              </View>
            </View>

            <Text style={[styles.learnedMixUnlockTitle, { color: colors.text }]}>Learnt Words Challenge Unlocked!</Text>
            <Text style={[styles.learnedMixUnlockText, { color: colors.secondaryText }]}>
              You have {LEARNT_MIX_UNLOCK_COUNT} learnt cards. A big matching challenge is ready.
            </Text>

            <TouchableOpacity
              onPress={startLearnedMixFromUnlock}
              style={[
                styles.learnedMixUnlockStartButton,
                {
                  backgroundColor: learnedMixColors.actionBackground,
                  borderColor: learnedMixColors.actionBorder,
                  shadowColor: learnedMixColors.shadow,
                },
              ]}
              activeOpacity={0.9}
              accessibilityRole="button"
              accessibilityLabel="Start Learnt Words Challenge"
            >
              <MaterialIcons name="play-arrow" size={22} color={learnedMixColors.actionForeground} />
              <Text style={[styles.learnedMixUnlockStartText, { color: learnedMixColors.actionForeground }]}>Start Challenge</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={closeLearnedMixUnlock}
              style={styles.learnedMixUnlockLaterButton}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Close and stay on vocabulary"
            >
              <Text style={[styles.learnedMixUnlockLaterText, { color: learnedMixColors.countText }]}>
                Later
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </Modal>

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
                shadowColor: '#000',
                top: insets.top + difficultyAnchor.y + difficultyAnchor.height + 8,
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerTitleContainer: { paddingHorizontal: 16, paddingBottom: 6 },
  headerTitleContainerMobile: {
    paddingTop: 4,
    paddingBottom: 8,
  },
  headerTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    marginBottom: 6,
  },
  headerTitleRowCompact: {
    alignItems: 'stretch',
    flexDirection: 'column',
    gap: 8,
    marginBottom: 12,
  },
  headerTitle: { flex: 1, fontSize: 32, fontWeight: 'bold', minWidth: 0 },
  headerTitleCompact: {
    alignSelf: 'stretch',
    flex: 0,
    flexShrink: 0,
    lineHeight: 42,
    minHeight: 44,
    width: '100%',
  },
  headerActions: {
    alignItems: 'center',
    flexDirection: 'row',
    flexShrink: 0,
    gap: 7,
  },
  headerActionsCompact: {
    alignSelf: 'stretch',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
  },
  headerSelectButton: {
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    minHeight: 38,
    maxWidth: 154,
    paddingHorizontal: 10,
  },
  headerSelectButtonCompact: {
    maxWidth: 180,
    paddingHorizontal: 8,
  },
  headerSelectText: {
    flexShrink: 1,
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 16,
  },
  headerChallengeChip: {
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1.5,
    borderBottomWidth: 2.5,
    flexDirection: 'row',
    gap: 5,
    minHeight: 34,
    minWidth: 0,
    paddingHorizontal: 8,
  },
  headerChallengeChipText: {
    flexShrink: 1,
    fontSize: 12,
    fontWeight: '900',
    lineHeight: 14,
  },
  headerChallengeChipCount: {
    alignItems: 'center',
    borderRadius: 999,
    justifyContent: 'center',
    minWidth: 22,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  headerChallengeChipCountText: {
    fontSize: 10,
    fontWeight: '900',
    lineHeight: 12,
  },
  browsePanel: {
    borderRadius: 22,
    borderWidth: 2,
    gap: 8,
    marginTop: 4,
    padding: 9,
  },
  controlPanel: {
    borderRadius: 16,
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 0,
  },
  controlPanelCompact: {
    paddingTop: 0,
    paddingBottom: 0,
  },
  controlsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6 },
  viewToggleGroup: {
    flexDirection: 'row',
    gap: 4,
    width: '20%',
    minWidth: 88,
    maxWidth: 104,
    minHeight: 46,
    padding: 4,
    borderRadius: 13,
    borderWidth: 1.5,
  },
  viewToggleGroupCompact: { minHeight: 48, minWidth: 78, maxWidth: 90, padding: 4, gap: 3 },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderWidth: 1.5,
    borderRadius: 12,
    minHeight: 46,
    paddingHorizontal: 10,
    paddingVertical: 5,
    width: '100%',
  },
  dropdownButtonCompact: {
    minHeight: 48,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  dropdownButtonText: { fontSize: 12, fontWeight: '700' },
  dropdownButtonTextCompact: { fontSize: 10, lineHeight: 12 },
  modeToggle: { flexDirection: 'row', borderRadius: 13, borderWidth: 1.5, padding: 5, minHeight: 46, width: '30%', minWidth: 122, maxWidth: 136, marginRight: 0, overflow: 'hidden' },
  modeToggleCompact: { padding: 5, minHeight: 52, minWidth: 108, maxWidth: 120 },
  modeOption: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 9 },
  modeOptionText: { fontSize: 12, fontWeight: '700' },
  modeOptionTextCompact: { fontSize: 10, lineHeight: 12 },
  iconToggleButton: {
    minHeight: 38,
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
  },
  iconToggleButtonCompact: {
    minHeight: 38,
  },
  iconToggleButtonSelected: {
    shadowOpacity: 0.18,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  levelControlWrap: { width: '30%', minWidth: 124, maxWidth: 156 },
  levelControlWrapCompact: { minWidth: 104, maxWidth: 128 },
  menuBackdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9998 },
  dropdownMenu: {
    position: 'absolute',
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    zIndex: 9999,
    shadowOpacity: 0.16,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  difficultyMenu: { width: 210 },
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
    marginHorizontal: 0,
    marginTop: 0,
    marginBottom: 0,
    borderWidth: 1,
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
  },
  searchInput: { minHeight: 44, padding: 14, fontSize: 16 },
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
  emptyStateCard: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 10,
    padding: 18,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  emptyStateText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },
  learnedMixUnlockOverlay: {
    flex: 1,
    paddingHorizontal: 18,
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  learnedMixUnlockModalCard: {
    width: '100%',
    maxWidth: 540,
    minHeight: 340,
    borderRadius: 22,
    borderWidth: 3,
    paddingHorizontal: 24,
    paddingTop: 34,
    paddingBottom: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.52,
    shadowRadius: 18,
    elevation: 10,
  },
  learnedMixUnlockHero: {
    width: 122,
    height: 122,
    marginBottom: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  learnedMixUnlockHeroStar: {
    position: 'absolute',
    top: 0,
    right: 4,
    fontSize: 32,
    zIndex: 1,
  },
  learnedMixUnlockIcon: {
    width: 96,
    height: 96,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  learnedMixUnlockTitle: {
    fontSize: 25,
    lineHeight: 31,
    fontWeight: '900',
    textAlign: 'center',
  },
  learnedMixUnlockText: {
    marginTop: 9,
    fontSize: 16,
    lineHeight: 23,
    fontWeight: '700',
    textAlign: 'center',
    maxWidth: 390,
  },
  learnedMixUnlockStartButton: {
    marginTop: 22,
    minHeight: 50,
    borderRadius: 999,
    paddingHorizontal: 22,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.28,
    shadowRadius: 6,
    elevation: 4,
  },
  learnedMixUnlockStartText: {
    color: '#3F2E02',
    fontSize: 16,
    fontWeight: '900',
  },
  learnedMixUnlockLaterButton: {
    marginTop: 12,
    minHeight: 36,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  learnedMixUnlockLaterText: {
    fontSize: 14,
    fontWeight: '800',
  },
  learnedMixUnlockClose: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
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
  categoryHeader: { fontSize: 22, fontWeight: '800' },
  categoryMeta: { fontSize: 12, fontWeight: '700', marginTop: 2 },
  categoryRule: {
    width: '100%',
    height: 2,
    borderRadius: 999,
    marginTop: 8,
  },
  lessonsContainerTile: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
});
