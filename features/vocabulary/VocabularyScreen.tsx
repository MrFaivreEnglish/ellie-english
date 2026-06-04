import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
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
import { Word } from '../../types/VocabularyTypes';
import {
  getLearnedFlashcardKeysByLesson,
  normalizeFlashcardLessonKey,
} from './flashcardProgressStorage';
import { getInsetSurfaceStyle, getPanelStyle, getSoftShadow, uiRadii } from '../shared/uiPrimitives';

const bundledCustomVocabularyLessons = require('../../content/lessons/customVocabularyLessons.json') as any[];

const STAR = '\u2605';
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
  'School Basics': 1,
  'School life': 2,
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

const getLessonWordCount = (lesson: any) => {
  if (!lesson?.flashcards) return 0;
  if (Array.isArray(lesson.flashcards[0]?.words)) {
    return lesson.flashcards.reduce((total: number, group: any) => total + (group.words?.length ?? 0), 0);
  }
  return lesson.flashcards.length;
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

export default function VocabularyScreen() {
  const navigation = useNavigation<any>();
  const { isDarkMode, colors, vocabLessonCardView, updateVocabLessonCardView, isAndroidStatusBarEnabled, menuLanguage } = useTheme();
  const appCopy = getMenuCopy(menuLanguage);
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
  const segmentPadding = 8;

  const markLessonImageFailed = (key: string) => {
    setFailedLessonImageKeys((current) => {
      if (current.has(key)) return current;
      const next = new Set(current);
      next.add(key);
      return next;
    });
  };

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

  useFocusEffect(
    React.useCallback(() => {
      let active = true;

      getCustomVocabularyLessons().then((lessons) => {
        if (active) setCustomLessons(lessons);
      });

      return () => {
        active = false;
      };
    }, [])
  );

  useFocusEffect(
    React.useCallback(() => {
      let active = true;

      getLearnedFlashcardKeysByLesson().then((learnedByLesson) => {
        if (active) setLearnedMixWords(buildLearnedMixWords(allLessons, learnedByLesson));
      });

      return () => {
        active = false;
      };
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

  const filterLessons = (lessons: any[]) =>
    lessons.filter((lesson: any) => {
      const title = (lesson.title || '').replace(/\s*\d+$/, '');
      return (
        (!selectedDifficulty || difficultyMap[title] === selectedDifficulty) &&
        (!searchText || title.toLowerCase().includes(searchText.toLowerCase()))
      );
    });

  const getLevelLabel = (level: number | null) => {
    if (!level) return copy.allLevels;
    return STAR_EMOJI.repeat(level);
  };

  const startLearnedMix = () => {
    if (learnedMixWords.length < LEARNT_MIX_UNLOCK_COUNT) return;

    const mixedWords = shuffleArray(learnedMixWords).slice(0, LEARNT_MIX_MAX_WORDS);

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

  const closeLearnedMixUnlock = () => {
    setLearnedMixUnlockMessageVisible(false);
    AsyncStorage.setItem(LEARNT_MIX_UNLOCK_SEEN_KEY, 'true').catch(() => {});
  };

  const startLearnedMixFromUnlock = () => {
    closeLearnedMixUnlock();
    startLearnedMix();
  };

  const visibleSections = (viewMode === 'category' ? categories : [{ title: 'All', lessons: allLessons }]).filter(
    (category) => filterLessons(category.lessons).length > 0
  );
  const learnedMixPlayable = learnedMixWords.length >= LEARNT_MIX_UNLOCK_COUNT;
  const learnedMixVisible = learnedMixPlayable;
  const learnedMixColors = {
    background: isDarkMode ? colors.card : '#FFF7D6',
    border: isDarkMode ? colors.warning : '#F4B740',
    iconBackground: isDarkMode ? 'rgba(255, 211, 109, 0.16)' : '#FFE8A3',
    iconColor: isDarkMode ? colors.warning : '#A45C00',
    countBackground: isDarkMode ? 'rgba(255, 211, 109, 0.14)' : 'rgba(244, 185, 66, 0.28)',
    countText: isDarkMode ? colors.warning : '#7A4B00',
    actionBackground: colors.warning,
    actionForeground: '#3F2E02',
    shadow: isDarkMode ? '#000000' : colors.warning,
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={{ paddingTop: topContentInset }}
        removeClippedSubviews={false}
        onScrollBeginDrag={() => setShowDifficultyMenu(false)}
        keyboardShouldPersistTaps="handled"
      >
        <BackButton label={commonCopy.backToHome} onPress={() => navigation.navigate('Home')} />

        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{copy.header}</Text>

          <View
            style={[
              styles.controlPanel,
              getInsetSurfaceStyle(colors, isDarkMode),
              isPortraitTight && styles.controlPanelCompact,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
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
                    backgroundColor: isDarkMode ? colors.card : colors.surface,
                    borderColor: colors.borderStrong,
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
                  <Text style={[styles.modeOptionText, isPortraitTight && styles.modeOptionTextCompact, { color: viewMode === 'category' ? colors.buttonText : colors.primary }]}>
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
                  <Text style={[styles.modeOptionText, isPortraitTight && styles.modeOptionTextCompact, { color: viewMode === 'abc' ? colors.buttonText : colors.primary }]}>
                    {copy.abc}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={[styles.viewToggleGroup, isPortraitTight && styles.viewToggleGroupCompact]}>
                <TouchableOpacity
                  onPress={() => handleCardViewChange('list')}
                  accessibilityRole="button"
                  accessibilityLabel={copy.useListLayout}
                  accessibilityState={{ selected: cardView === 'list' }}
                  style={[
                    styles.iconToggleButton,
                    getInsetSurfaceStyle(colors, isDarkMode),
                    isPortraitTight && styles.iconToggleButtonCompact,
                    { backgroundColor: isDarkMode ? colors.card : colors.surface, borderColor: colors.borderStrong },
                    cardView === 'list' && { backgroundColor: colors.buttonBackground, borderColor: colors.primary },
                  ]}
                >
                  <MaterialIcons name="view-agenda" size={18} color={cardView === 'list' ? colors.buttonText : colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleCardViewChange('tile')}
                  accessibilityRole="button"
                  accessibilityLabel={copy.useTileLayout}
                  accessibilityState={{ selected: cardView === 'tile' }}
                  style={[
                    styles.iconToggleButton,
                    getInsetSurfaceStyle(colors, isDarkMode),
                    { backgroundColor: isDarkMode ? colors.card : colors.surface, borderColor: colors.borderStrong },
                    cardView === 'tile' && { backgroundColor: colors.buttonBackground, borderColor: colors.primary },
                  ]}
                >
                  <MaterialIcons name="grid-view" size={18} color={cardView === 'tile' ? colors.buttonText : colors.primary} />
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
                  style={[styles.dropdownButton, getInsetSurfaceStyle(colors, isDarkMode), isPortraitTight && styles.dropdownButtonCompact, { backgroundColor: isDarkMode ? colors.card : colors.surface, borderColor: colors.borderStrong }]}
                  onPress={() => setShowDifficultyMenu((current) => !current)}
                  accessibilityRole="button"
                  accessibilityLabel={copy.chooseLevel}
                  accessibilityState={{ expanded: showDifficultyMenu }}
                >
                  <Text style={[styles.dropdownButtonText, isPortraitTight && styles.dropdownButtonTextCompact, { color: colors.primary }]}>
                    {getLevelLabel(selectedDifficulty)}
                  </Text>
                  <MaterialIcons name="arrow-drop-down" size={22} color={colors.primary} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        <View
          style={[
          styles.searchShell,
          getInsetSurfaceStyle(colors, isDarkMode),
          {
            backgroundColor: colors.surfaceAlt,
            borderColor: searchText.trim() ? colors.primary : colors.borderStrong,
            borderWidth: searchText.trim() ? 2 : 1.5,
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
            <MaterialIcons name="search" size={20} color={colors.primary} />
          </View>

          {searchText.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchText('')}
              style={styles.searchClearButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityRole="button"
              accessibilityLabel={copy.clearSearch}
            >
              <MaterialIcons name="close" size={20} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>

        {learnedMixVisible && (
          <TouchableOpacity
            style={[
              styles.learnedMixCard,
              getSoftShadow(isDarkMode),
              {
                backgroundColor: learnedMixColors.background,
                borderColor: learnedMixColors.border,
                shadowColor: learnedMixColors.shadow,
                shadowOpacity: isDarkMode ? 0.22 : 0.08,
              },
            ]}
            onPress={startLearnedMix}
            accessibilityRole="button"
            accessibilityLabel="Play Learnt Words Challenge"
          >
            <View style={[styles.learnedMixIcon, { backgroundColor: learnedMixColors.iconBackground }]}>
              <MaterialIcons name="shuffle" size={19} color={learnedMixColors.iconColor} />
            </View>
            <Text style={[styles.learnedMixTitle, { color: colors.text }]} numberOfLines={1}>Learnt Words Challenge</Text>
            <Text style={[styles.learnedMixSpark, { color: learnedMixColors.countText }]}>{STAR}</Text>
            <View style={[styles.learnedMixCountPill, { backgroundColor: learnedMixColors.countBackground }]}>
              <Text style={[styles.learnedMixCountText, { color: learnedMixColors.countText }]}>
                {Math.min(learnedMixWords.length, LEARNT_MIX_MAX_WORDS)} words
              </Text>
            </View>
            <View style={[styles.learnedMixButton, { backgroundColor: learnedMixColors.actionBackground }]}>
              <MaterialIcons name="play-arrow" size={20} color={learnedMixColors.actionForeground} />
            </View>
          </TouchableOpacity>
        )}

        {visibleSections.length === 0 && (
          <View
            style={[
              styles.emptyStateCard,
              getPanelStyle(colors, isDarkMode),
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={[styles.emptyStateTitle, { color: colors.text }]}>{copy.noLessonTitle}</Text>
            <Text style={[styles.emptyStateText, { color: colors.secondaryText }]}>
              {copy.noLessonText}
            </Text>
          </View>
        )}

        {visibleSections.map((category) => {
          const lessons = filterLessons(category.lessons);

          return (
            <View key={category.title} style={{ paddingHorizontal: 16, marginBottom: 8 }}>
              {viewMode === 'category' && (
                <View style={styles.categoryHeaderRow}>
                  <Text style={styles.categoryEmoji}>{CATEGORY_EMOJI_MAP[category.title] || '\u{1F4DA}'}</Text>
                  <View style={styles.categoryTitleBlock}>
                    <Text style={[styles.categoryHeader, { color: colors.text }]}>{category.title}</Text>
                    <Text style={[styles.categoryMeta, { color: colors.secondaryText }]}>
                      {lessons.length} {lessons.length > 1 ? copy.lessonPlural : copy.lessonSingular}
                    </Text>
                    <View style={[styles.categoryRule, { backgroundColor: colors.border }]} />
                  </View>
                </View>
              )}

              <View style={[styles.lessonsContainer, cardView === 'tile' && styles.lessonsContainerTile]}>
                {lessons.map((lesson: any, i: number) => {
                  const lessonTitle = (lesson.title || '').replace(/\s*\d+/, '');
                  const difficulty = difficultyMap[lessonTitle];
                  const lessonImageKey = String(lesson.id || lesson.title || lessonTitle || i);
                  const localLessonImage = getLessonThumbnailSource(lesson);
                  const lessonImageSource = localLessonImage || { uri: getLessonImage(lesson.title) };
                  const imageFailed = failedLessonImageKeys.has(lessonImageKey);

                  return (
                    <TouchableOpacity
                      key={`${lesson.id || lesson.title}-${i}`}
                      style={[
                        styles.lessonCard,
                        getPanelStyle(colors, isDarkMode, 'soft'),
                        cardView === 'tile' ? styles.lessonCardTile : styles.lessonCardList,
                        { backgroundColor: colors.card, borderColor: isDarkMode ? colors.border : '#DDE8F2' },
                      ]}
                      onPress={() => navigation.navigate('VocabularyLesson', { lesson })}
                      accessibilityRole="button"
                      accessibilityLabel={`Open ${lessonTitle}`}
                    >
                      {cardView === 'tile' && !!difficulty && (
                        <View
                          style={[
                            styles.lessonDifficultyBadge,
                            styles.lessonDifficultyBadgeTile,
                            { backgroundColor: colors.primarySoft },
                          ]}
                        >
                          <Text style={[styles.lessonDifficultyText, { color: colors.primary }]}>{STAR.repeat(difficulty)}</Text>
                        </View>
                      )}

                      <View
                        style={[
                          styles.lessonImageFrame,
                          cardView === 'tile' && styles.lessonImageFrameTile,
                          { backgroundColor: 'transparent' },
                          imageFailed && [
                            styles.lessonImageFallback,
                            { borderColor: colors.border },
                          ],
                        ]}
                      >
                        {imageFailed ? (
                          <MaterialIcons
                            name="image-not-supported"
                            size={cardView === 'tile' ? 30 : 26}
                            color={colors.secondaryText}
                          />
                        ) : (
                          <Image
                            source={lessonImageSource}
                            style={styles.lessonImage}
                            onError={() => markLessonImageFailed(lessonImageKey)}
                            accessibilityIgnoresInvertColors
                          />
                        )}
                      </View>

                      <View style={[styles.lessonContent, cardView === 'tile' && styles.lessonContentTile]}>
                        <View style={[styles.lessonTopRow, cardView === 'tile' && styles.lessonTopRowTile]}>
                          <Text
                            style={[styles.lessonTitle, cardView === 'tile' && styles.lessonTitleTile, { color: colors.text }]}
                            numberOfLines={2}
                          >
                            {lessonTitle}
                          </Text>
                          {cardView === 'list' && !!difficulty && (
                            <View
                              style={[
                                styles.lessonDifficultyBadge,
                                { backgroundColor: colors.primarySoft },
                              ]}
                            >
                              <Text style={[styles.lessonDifficultyText, { color: colors.primary }]}>{STAR.repeat(difficulty)}</Text>
                            </View>
                          )}
                        </View>

                        <Text
                          style={[
                            styles.lessonMetaLine,
                            cardView === 'tile' && styles.lessonMetaLineTile,
                            { color: colors.secondaryText },
                          ]}
                        >
                          {getLessonWordCount(lesson)} {getLessonWordCount(lesson) > 1 ? copy.wordPlural : copy.wordSingular}
                        </Text>

                        {cardView === 'list' && !!lesson.description && (
                          <Text
                            style={[styles.lessonDescription, { color: colors.secondaryText }]}
                            numberOfLines={2}
                          >
                            {lesson.description}
                          </Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          );
        })}
      </ScrollView>

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
              style={[styles.learnedMixUnlockStartButton, { backgroundColor: learnedMixColors.actionBackground }]}
              activeOpacity={0.9}
              accessibilityRole="button"
              accessibilityLabel="Start Learnt Words Challenge"
            >
              <MaterialIcons name="play-arrow" size={22} color={learnedMixColors.actionForeground} />
              <Text style={styles.learnedMixUnlockStartText}>Start Challenge</Text>
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
                <Text style={[styles.difficultyMenuText, { color: colors.text }]}>
                  {lvl ? STAR_EMOJI.repeat(lvl) : `\u2728 ${copy.allLevels}`}
                </Text>
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
  headerTitle: { fontSize: 32, fontWeight: 'bold', marginBottom: 4 },
  controlPanel: {
    marginTop: 4,
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 8,
  },
  controlPanelCompact: {
    paddingTop: 4,
    paddingBottom: 4,
  },
  controlsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6 },
  viewToggleGroup: { flexDirection: 'row', gap: 6, width: '20%', minWidth: 84, maxWidth: 96 },
  viewToggleGroupCompact: { minWidth: 74, maxWidth: 84 },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderWidth: 1.5,
    borderColor: '#BFD7EA',
    borderRadius: 999,
    minHeight: 50,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#fff',
    width: '100%',
  },
  dropdownButtonCompact: {
    minHeight: 38,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  dropdownButtonText: { color: '#1671B6', fontSize: 12, fontWeight: '700' },
  dropdownButtonTextCompact: { fontSize: 10, lineHeight: 12 },
  modeToggle: { flexDirection: 'row', borderRadius: 16, padding: 8, minHeight: 54, width: '30%', minWidth: 122, maxWidth: 136, marginRight: 0 },
  modeToggleCompact: { padding: 5, minHeight: 42, minWidth: 108, maxWidth: 120 },
  modeOption: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 12 },
  modeOptionText: { fontSize: 12, fontWeight: '700' },
  modeOptionTextCompact: { fontSize: 10, lineHeight: 12 },
  iconToggleButton: {
    minHeight: 50,
    flex: 1,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: '#BFD7EA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconToggleButtonCompact: {
    minHeight: 38,
  },
  iconToggleButtonActive: {
    backgroundColor: '#1671B6',
    borderColor: '#1671B6',
  },
  levelControlWrap: { width: '30%', minWidth: 124, maxWidth: 156 },
  levelControlWrapCompact: { minWidth: 104, maxWidth: 128 },
  menuBackdrop: { ...StyleSheet.absoluteFillObject, zIndex: 9998 },
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
  difficultyMenu: { width: 180 },
  difficultyMenuItem: {
    paddingVertical: 14,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  difficultyMenuText: { fontSize: 15, fontWeight: '700' },
  searchShell: {
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 14,
    borderWidth: 1.5,
    borderRadius: 12,
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
    paddingBottom : 15,
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
    backgroundColor: '#FFE8A3',
    alignItems: 'center',
    justifyContent: 'center',
                borderWidth: 1,
    borderColor: '#F4B942',
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
    backgroundColor: '#F4B942',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    shadowColor: '#D4A72C',
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
  learnedMixCard: {
    marginHorizontal: 16,
    marginTop: -2,
    marginBottom: 8,
    alignSelf: 'center',
    maxWidth: '92%',
    minHeight: 40,
    borderRadius: 999,
    borderWidth: 1.5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  learnedMixIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  learnedMixTitle: {
    fontSize: 14,
    lineHeight: 17,
    fontWeight: '800',
    flexShrink: 1,
  },
  learnedMixSpark: {
    fontSize: 11,
    fontWeight: '900',
  },
  learnedMixCountPill: {
    minHeight: 24,
    borderRadius: 999,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  learnedMixCountText: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '900',
  },
  learnedMixButton: {
    width: 32,
    height: 32,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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
  lessonsContainer: { paddingBottom: 8 },
  lessonsContainerTile: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  lessonCard: {
    borderRadius: 16,
    marginBottom: 12,
    padding: 12,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  lessonCardList: { flexDirection: 'row', alignItems: 'center' },
  lessonCardTile: { width: '48%', minHeight: 176, alignItems: 'center', paddingTop: 16, paddingBottom: 14 },
  lessonImageFrame: { width: 80, height: 80, borderRadius: uiRadii.thumbnail, marginRight: 12, overflow: 'hidden', backgroundColor: 'transparent' },
  lessonImageFrameTile: { width: 92, height: 92, marginRight: 0, marginBottom: 10 },
  lessonImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  lessonImageFallback: { alignItems: 'center', justifyContent: 'center', borderWidth: 1.5 },
  lessonContent: { flex: 1, minWidth: 0 },
  lessonContentTile: { alignItems: 'center' },
  lessonTopRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  lessonTopRowTile: { width: '100%', justifyContent: 'center' },
  lessonTitle: { flex: 1, fontSize: 17, fontWeight: '700', lineHeight: 21, textTransform: 'capitalize' },
  lessonTitleTile: { textAlign: 'center', lineHeight: 19, fontSize: 15 },
  lessonDifficultyBadge: {
    minWidth: 42,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lessonDifficultyBadgeTile: {
    position: 'absolute',
    top: 10,
    right: 10,
    minWidth: 36,
    paddingHorizontal: 6,
    paddingVertical: 4,
    zIndex: 2,
  },
  lessonDifficultyText: { color: '#1671B6', fontSize: 12, fontWeight: '800' },
  lessonMetaLine: { fontSize: 13, fontWeight: '700', marginTop: 4 },
  lessonMetaLineTile: { textAlign: 'center', marginTop: 6 },
  lessonDescription: { fontSize: 13, lineHeight: 17, marginTop: 4 },
});
