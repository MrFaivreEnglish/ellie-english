import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Platform,
  TextInput
} from 'react-native';
import { useTheme, type ThemeColors } from '../settings/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import BackButton from '../shared/BackButton';
import { grammarCategories } from '../../content/lessons/grammarRegistry';
import { getGrammarLessonProgressCounts, getGrammarLessonProgressKey } from './grammarProgressStorage';
import { getMenuCopy } from '../shared/menuCopy';
import { getInsetSurfaceStyle, getPanelStyle, uiRadii } from '../shared/uiPrimitives';

const isRemoteLessonImage = (imageUrl: any) =>
  typeof imageUrl === 'string' && /^https?:\/\//i.test(imageUrl);

const getLessonImageSource = (imageUrl: any) => {
  if (!imageUrl) return null;
  return typeof imageUrl === 'string' ? { uri: imageUrl } : imageUrl;
};

type GrammarLessonRowProps = {
  lesson: any;
  savedAnswerCount: number;
  rowIndex: number;
  staggerRemoteImageLoad: boolean;
  colors: ThemeColors;
  isDarkMode: boolean;
  copy: any;
  onSelectLesson: (lesson: any) => void;
};

const GrammarLessonRow = React.memo(({
  lesson,
  savedAnswerCount,
  rowIndex,
  staggerRemoteImageLoad,
  colors,
  isDarkMode,
  copy,
  onSelectLesson,
}: GrammarLessonRowProps) => {
  const handlePress = useCallback(() => onSelectLesson(lesson), [lesson, onSelectLesson]);
  const imageSource = getLessonImageSource(lesson.imageUrl);
  const isRemoteImage = isRemoteLessonImage(lesson.imageUrl);
  const [canLoadRemoteImage, setCanLoadRemoteImage] = useState(!isRemoteImage || !staggerRemoteImageLoad);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageLoadFailed, setImageLoadFailed] = useState(false);
  const shouldRenderThumbnail = imageSource && (!isRemoteImage || canLoadRemoteImage);

  useEffect(() => {
    if (!isRemoteImage || !staggerRemoteImageLoad) {
      setCanLoadRemoteImage(true);
      return undefined;
    }

    setCanLoadRemoteImage(false);
    const timeout = setTimeout(
      () => setCanLoadRemoteImage(true),
      80 + Math.min(rowIndex, 10) * 55
    );

    return () => clearTimeout(timeout);
  }, [isRemoteImage, lesson.imageUrl, rowIndex, staggerRemoteImageLoad]);

  useEffect(() => {
    setImageLoaded(false);
    setImageLoadFailed(false);
  }, [lesson.imageUrl]);

  return (
    <TouchableOpacity
      style={[
        styles.lessonItem,
        getInsetSurfaceStyle(colors, isDarkMode),
        {
          backgroundColor: isDarkMode ? colors.surface : '#F8FBFF',
          borderColor: isDarkMode ? colors.borderStrong : '#D7E6F3',
        },
      ]}
      activeOpacity={0.82}
      onPress={handlePress}
    >
      <View
        style={[
          styles.lessonThumbnail,
          {
            backgroundColor: isDarkMode ? colors.surfaceAlt : '#EDF5FC',
          },
        ]}
      >
        {(!shouldRenderThumbnail || !imageLoaded) && (
          <View style={styles.lessonThumbnailSkeleton}>
            <View
              style={[
                styles.thumbnailSkeletonPanel,
                { backgroundColor: isDarkMode ? colors.card : '#f8fafc' },
              ]}
            />
            <View
              style={[
                styles.thumbnailSkeletonLine,
                { backgroundColor: isDarkMode ? colors.borderStrong : 'rgba(255,255,255,0.82)' },
              ]}
            />
            <View
              style={[
                styles.thumbnailSkeletonLine,
                styles.thumbnailSkeletonLineShort,
                { backgroundColor: isDarkMode ? colors.border : 'rgba(255,255,255,0.62)' },
              ]}
            />
          </View>
        )}

        {shouldRenderThumbnail && !imageLoadFailed && (
          <Image
            source={imageSource}
            style={[
              styles.lessonThumbnailImage,
              !imageLoaded && styles.lessonThumbnailImageLoading,
            ]}
            resizeMode="cover"
            fadeDuration={0}
            progressiveRenderingEnabled
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageLoadFailed(true)}
          />
        )}

        {imageLoadFailed && (
          <MaterialIcons name="image-not-supported" size={22} color={colors.secondaryText} />
        )}
      </View>

      <View style={styles.lessonInfo}>
        <Text style={[styles.lessonTitle, { color: colors.text }]}>
          {lesson.title}
        </Text>
        {savedAnswerCount > 0 && (
          <View style={[styles.savedAnswersPill, { backgroundColor: colors.successSoft, borderColor: colors.success }]}>
            <MaterialIcons name="check-circle" size={14} color={colors.success} />
            <Text style={[styles.savedAnswersText, { color: colors.successText ?? colors.success }]}>
              {savedAnswerCount} {savedAnswerCount === 1 ? copy.savedAnswerSingular : copy.savedAnswerPlural}
            </Text>
          </View>
        )}
      </View>

      <MaterialIcons
        name="arrow-forward-ios"
        size={16}
        color={colors.secondaryText}
      />
    </TouchableOpacity>
  );
});

const subEmojiMap: Record<string, string> = {
  'Temps du pr\u00E9sent': '\u23F0',
  'Parler de soi': '\uD83D\uDC4B',
  'La possession': '\uD83D\uDD11',
  'Pouvoir / Devoir': '\u2705',
  'Fr\u00E9quence': '\uD83D\uDD01',
  'Temps du pass\u00E9': '\uD83D\uDD70\uFE0F',
  'Irregular Verbs': '\uD83D\uDCD3',
  'Futur': '\uD83D\uDD2E',
  'Modaux': '\uD83E\uDDF0',
  'Comparaisons': '\u2696\uFE0F',
  'Ordres/Conseils': '\uD83D\uDCE3',
  'Temps parfaits': '\u2728',
  'Voix passive': '\uD83D\uDD01',
  'Pronoms': '\uD83C\uDFF7\uFE0F',
  'Modaux avanc\u00E9s': '\uD83D\uDD27',
  'Conditions': '\uD83C\uDFB2',
  'Bases de grammaire': '\uD83D\uDCD8',
};
const subColors = [
  '#ee9cb0ff',
  '#D9A6E8',
  '#B79CFF',
  '#8F9BFF',
  '#6FA8FF',
  '#92c490ff',
];

const GrammarCategoryList: React.FC<{ onSelectLesson: (lesson: any) => void }> =
({ onSelectLesson }) => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { colors, isDarkMode, isAndroidStatusBarEnabled, menuLanguage } = useTheme();
  const appCopy = getMenuCopy(menuLanguage);
  const copy = appCopy.grammar;
  const commonCopy = appCopy.common;
  const topContentInset = Platform.OS === 'ios'
    ? (insets.top ?? 0)
    : Platform.OS === 'android' && isAndroidStatusBarEnabled
      ? insets.top
      : 0;

  const [expandedSub, setExpandedSub] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState('');
  const [grammarProgressCounts, setGrammarProgressCounts] = useState<Record<string, number>>({});
  const lessonProgressKeys = useMemo(
    () =>
      grammarCategories.flatMap((level) =>
        level.subcategories.flatMap((subcategory) =>
          subcategory.lessons.map((lesson) => getGrammarLessonProgressKey(lesson))
        )
      ),
    []
  );

  useFocusEffect(
    useCallback(() => {
      let active = true;

      getGrammarLessonProgressCounts(lessonProgressKeys).then((counts) => {
        if (active) setGrammarProgressCounts(counts);
      });

      return () => {
        active = false;
      };
    }, [lessonProgressKeys])
  );

  const toggleSub = (key: string) =>
    setExpandedSub(prev => ({ ...prev, [key]: !prev[key] }));

  const normalizeSearchText = (value: string) =>
    value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();

  const isLooseTokenMatch = (textToken: string, queryToken: string) => {
    if (textToken.includes(queryToken) || queryToken.includes(textToken)) return true;
    if (queryToken.length < 4) return false;

    let misses = 0;
    let queryIndex = 0;

    for (let textIndex = 0; textIndex < textToken.length && queryIndex < queryToken.length; textIndex++) {
      if (textToken[textIndex] === queryToken[queryIndex]) {
        queryIndex++;
      } else {
        misses++;
      }
    }

    return queryIndex >= queryToken.length - 1 && misses <= 3;
  };

  const matchesSearch = (text: string, query: string) => {
    const normalizedText = normalizeSearchText(text);
    const normalizedQuery = normalizeSearchText(query);

    if (!normalizedQuery) return true;
    if (normalizedText.includes(normalizedQuery)) return true;

    const textTokens = normalizedText.split(' ').filter(Boolean);
    const queryTokens = normalizedQuery.split(' ').filter(Boolean);

    return queryTokens.every((queryToken) =>
      textTokens.some((textToken) => isLooseTokenMatch(textToken, queryToken))
    );
  };

  const filterLessons = (lessons: any[], categoryText: string) => {
    if (!search.trim()) return lessons;
    if (matchesSearch(categoryText, search)) return lessons;

    return lessons.filter((lesson) => matchesSearch(lesson.title || '', search));
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      removeClippedSubviews={Platform.OS !== 'web'}
      overScrollMode="never"
      bounces={false}
      alwaysBounceVertical={false}
      contentContainerStyle={{
        paddingTop: topContentInset
      }}
    >
      <BackButton label={commonCopy.backToHome} onPress={() => navigation.goBack()} />

      <Text style={[styles.headerTitle, { color: colors.text }]}>
        {copy.header}
      </Text>

      <View
        style={[
          styles.searchShell,
          getInsetSurfaceStyle(colors, isDarkMode),
          {
            backgroundColor: colors.surfaceAlt,
            borderColor: search.trim() ? colors.primary : colors.borderStrong,
            borderWidth: search.trim() ? 2 : 1.5,
            borderRadius: uiRadii.control,
          },
        ]}
      >
        <TextInput
          value={search}
          onChangeText={setSearch}
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
          <MaterialIcons name="search" size={20} color={colors.primary} />
        </View>

        {search.length > 0 && (
          <TouchableOpacity
            onPress={() => setSearch('')}
            style={styles.searchClearButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialIcons name="close" size={20} color={colors.primary} />
          </TouchableOpacity>
        )}
      </View>

      {grammarCategories.map((level) => {
        const visibleSubcategories = level.subcategories
          .map((sub, si) => ({
            sub,
            si,
            lessons: filterLessons(
              sub.lessons,
              `${level.title} ${sub.title}`
            ),
          }))
          .filter(({ lessons }) => !search.trim() || lessons.length > 0);

        if (search.trim() && visibleSubcategories.length === 0) return null;

        return (
        <View key={level.group} style={{ marginBottom: 32 }}>
          <View style={styles.levelHeader}>
            <Text style={[styles.levelTitle, { color: colors.text }]}>
              {level.title}
            </Text>
          </View>

          {visibleSubcategories.map(({ sub, si, lessons }) => {
            const key = `${level.group}-${si}`;
            const open = search ? true : expandedSub[key];

            const subIdx = level.subcategories.findIndex(s => s === sub);
            const subColor = subColors[subIdx % subColors.length];
            const emoji = subEmojiMap[sub.title] || '\uD83D\uDCD8';

            return (
              <View
                key={key}
                style={[
                  styles.categoryContainer,
                  getPanelStyle(colors, isDarkMode, open ? 'raised' : 'soft'),
                  open && styles.categoryContainerActive,
                  {
                    backgroundColor: colors.card,
                    borderColor: isDarkMode ? 'rgba(255,255,255,0.68)' : '#FFFFFF',
                    borderWidth: 1.5,
                  }
                ]}
              >
                <TouchableOpacity
                  style={[styles.categoryHeader, { backgroundColor: subColor }]}
                  onPress={() => toggleSub(key)}
                >
                  <Text style={styles.categoryIcon}>{emoji}</Text>
                  <View style={styles.categoryTitleBlock}>
                    <Text style={styles.categoryTitle}>{sub.title}</Text>
                  </View>
                  <View style={styles.lessonCountPill}>
                    <Text style={styles.lessonCountText}>
                      {lessons.length} {lessons.length > 1 ? copy.lessonPlural : copy.lessonSingular}
                    </Text>
                  </View>

                  {!search && (
                    <MaterialIcons
                      name={open ? 'expand-less' : 'expand-more'}
                      size={20}
                      color={colors.text}
                    />
                  )}
                </TouchableOpacity>

                {open && (
                  <View style={styles.lessonsContainer}>
                    {lessons.map((lesson: any, li: number) => {
                      const savedAnswerCount = grammarProgressCounts[getGrammarLessonProgressKey(lesson)] ?? 0;
                      const rowKey = lesson.id ? String(lesson.id) : `${lesson.title}-${li}`;

                      return (
                        <GrammarLessonRow
                          key={rowKey}
                          lesson={lesson}
                          savedAnswerCount={savedAnswerCount}
                          rowIndex={li}
                          staggerRemoteImageLoad={lessons.length > 6 || !!search.trim()}
                          colors={colors}
                          isDarkMode={isDarkMode}
                          copy={copy}
                          onSelectLesson={onSelectLesson}
                        />
                      );
                    })}
                  </View>
                )}
              </View>
            );
          })}
        </View>
        );
      })}
    </ScrollView>
  );
};

export default GrammarCategoryList;

const styles = StyleSheet.create({
  container: { flex: 1 },

  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    paddingHorizontal: 24,
    paddingBottom: 16,
  },

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

  levelHeader: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  levelTitle: {
    fontSize: 25,
    fontWeight: 'bold',
  },

  categoryContainer: {
    marginBottom: 16,
    marginHorizontal: 16,
    borderRadius: uiRadii.card,
    overflow: 'hidden',
  },
  categoryContainerActive: {
    borderWidth: 1.5,
  },

  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    justifyContent: 'space-between'
  },

  categoryIcon: {
    fontSize: 24,
  },
  categoryTitleBlock: {
    flex: 1,
    marginLeft: 12,
    minHeight: 39,
    justifyContent: 'center',
  },
  categoryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  lessonCountPill: {
    minWidth: 88,
    height: 28,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.24)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
  },
  lessonCountText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
  },

  lessonsContainer: {
    padding: 14,
    gap: 10,
  },
  lessonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: uiRadii.panel,
  },

  lessonThumbnail: {
    width: 64,
    height: 64,
    borderRadius: uiRadii.thumbnail,
    marginRight: 6,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  lessonThumbnailImage: {
    width: '100%',
    height: '100%',
  },
  lessonThumbnailImageLoading: {
    opacity: 0,
  },
  lessonThumbnailSkeleton: {
    ...StyleSheet.absoluteFillObject,
    padding: 8,
    justifyContent: 'flex-end',
  },
  thumbnailSkeletonPanel: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.88,
  },
  thumbnailSkeletonLine: {
    width: 34,
    height: 5,
    borderRadius: 999,
    marginTop: 4,
  },
  thumbnailSkeletonLineShort: {
    width: 22,
  },

  lessonInfo: {
    flex: 1,
    marginLeft: 16
  },

  lessonTitle: {
    fontSize: 17,
    fontWeight: '700',
    lineHeight: 22,
  },
  savedAnswersPill: {
    alignSelf: 'flex-start',
    marginTop: 8,
    minHeight: 26,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  savedAnswersText: {
    fontSize: 12,
    fontWeight: '800',
  }
});
