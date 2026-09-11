import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  SectionList,
  View,
  TouchableOpacity,
  Image,
  StyleSheet,
  Platform,
  UIManager,
  LayoutAnimation,
  useWindowDimensions
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import Animated, { FadeIn, FadeInDown, FadeOut } from 'react-native-reanimated';
import {
  getBottomSafeAreaInset,
  getDesktopContentMaxWidth,
  getTopSafeAreaInset,
  isDesktopWebWidth,
  NARROW_TRAY_WIDTH,
} from '../shared/responsiveLayout';
import { useSpringPress } from '../shared/useSpringPress';
import { useSearchFocusAnimation } from '../shared/useSearchFocusAnimation';
import FloatingIcon from '../shared/FloatingIcon';
import { useTheme, type ThemeColors } from '../settings/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import Text, { ThemedTextInput as TextInput } from '../shared/ThemedText';
import MaterialIcons from '../shared/ThemedMaterialIcon';
import BackButton from '../shared/BackButton';
import { createMixedGrammarLesson, grammarCategories } from '../../content/lessons/grammarRegistry';
import { getGrammarLessonProgressCounts, getGrammarLessonProgressKey, getGrammarLessonKeysPracticedToday } from './grammarProgressStorage';
import { getMenuCopy } from '../shared/menuCopy';
import {
  getInsetSurfaceStyle,
  getSelectionTrayColors,
  getSoftShadow,
  getStudySurfaceColors,
  uiRadii,
  withColorAlpha,
} from '../shared/uiPrimitives';
import type { GrammarLesson } from '../../types/lessonTypes';
import { useDesktopTypographyScale } from '../shared/DesktopTypography';

const isRemoteLessonImage = (imageUrl: any) =>
  typeof imageUrl === 'string' && /^https?:\/\//i.test(imageUrl);

const getLessonImageSource = (imageUrl: any) => {
  if (!imageUrl) return null;
  return typeof imageUrl === 'string' ? { uri: imageUrl } : imageUrl;
};

type GrammarLessonRowProps = {
  lesson: GrammarLesson;
  savedAnswerCount: number;
  practicedToday: boolean;
  rowIndex: number;
  staggerRemoteImageLoad: boolean;
  colors: ThemeColors;
  isDarkMode: boolean;
  copy: any;
  onSelectLesson: (lesson: GrammarLesson) => void;
  selectionMode?: boolean;
  selected?: boolean;
  selectable?: boolean;
  onToggleLesson?: (lesson: GrammarLesson) => void;
};

type GrammarSubcategoryListItem = {
  key: string;
  sub: {
    title: string;
    lessons: GrammarLesson[];
  };
  lessons: GrammarLesson[];
  subIndex: number;
  levelTitle: string;
};

const GrammarLessonRow = React.memo(({
  lesson,
  savedAnswerCount,
  practicedToday,
  rowIndex,
  staggerRemoteImageLoad,
  colors,
  isDarkMode,
  copy,
  onSelectLesson,
  selectionMode = false,
  selected = false,
  selectable = true,
  onToggleLesson,
}: GrammarLessonRowProps) => {
  const desktopScale = useDesktopTypographyScale();
  const handlePress = useCallback(() => {
    if (selectionMode && selectable && onToggleLesson) {
      onToggleLesson(lesson);
      return;
    }

    onSelectLesson(lesson);
  }, [lesson, onSelectLesson, onToggleLesson, selectable, selectionMode]);
  const rowPress = useSpringPress();
  const isMixedGrammarLesson = !!lesson.isMixedGrammarLesson;
  const mixedLessonImageUrls: string[] = Array.isArray(lesson.sourceLessonImages)
    ? lesson.sourceLessonImages.filter((imageUrl: unknown): imageUrl is string => typeof imageUrl === 'string' && imageUrl.trim().length > 0)
    : [];
  const imageSource = getLessonImageSource(lesson.imageUrl);
  const isRemoteImage = isRemoteLessonImage(lesson.imageUrl);
  const [canLoadRemoteImage, setCanLoadRemoteImage] = useState(!isRemoteImage || !staggerRemoteImageLoad);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageLoadFailed, setImageLoadFailed] = useState(false);
  const shouldRenderThumbnail = !isMixedGrammarLesson && imageSource && (!isRemoteImage || canLoadRemoteImage);
  const studySurface = getStudySurfaceColors(colors, isDarkMode);
  const mixedLessonSurface = colors.card;
  const mixedLessonBorder = isDarkMode ? '#FFFFFF' : colors.border;
  const mixedLessonIconSurface = studySurface.control;
  const mixedLessonMetaSurface = studySurface.control;

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
    <Animated.View
      entering={FadeInDown.delay(Math.min(rowIndex, 10) * 40).duration(300)}
    >
      <Animated.View style={rowPress.animatedStyle}>
      <TouchableOpacity
      style={[
        styles.lessonItem,
        desktopScale > 1 && {
          paddingVertical: Math.round(12 * desktopScale),
          paddingHorizontal: Math.round(12 * desktopScale),
          borderRadius: Math.round(uiRadii.panel * desktopScale),
        },
        getInsetSurfaceStyle(colors, isDarkMode),
        isMixedGrammarLesson && styles.mixedLessonItem,
        selected && styles.selectedLessonItem,
        {
          backgroundColor: isMixedGrammarLesson
            ? selected ? colors.primarySoft : mixedLessonSurface
            : selected ? colors.primarySoft
            : colors.card,
          borderColor: isMixedGrammarLesson
            ? selected ? colors.primary : mixedLessonBorder
            : selected ? colors.primary
            : colors.border,
          borderWidth: isMixedGrammarLesson ? undefined : 2,
          borderBottomColor: selected ? colors.primary : colors.border,
          borderBottomWidth: selected ? 3 : 2.5,
        },
      ]}
      activeOpacity={0.82}
      onPress={handlePress}
      onPressIn={rowPress.onPressIn}
      onPressOut={rowPress.onPressOut}
      accessibilityRole="button"
      accessibilityLabel={lesson.title}
      accessibilityState={{ selected }}
    >
      <View
        style={[
          styles.lessonThumbnail,
          isMixedGrammarLesson && styles.mixedLessonThumbnail,
          desktopScale > 1 && {
            width: Math.round(70 * desktopScale),
            height: Math.round(70 * desktopScale),
            borderRadius: Math.round(uiRadii.thumbnail * desktopScale),
            marginRight: Math.round(6 * desktopScale),
          },
          {
            backgroundColor: isMixedGrammarLesson ? 'transparent' : studySurface.photoFrame,
            borderColor: isMixedGrammarLesson ? 'transparent' : studySurface.photoFrameBorder,
            borderWidth: isMixedGrammarLesson ? 0 : 2.5,
            boxShadow: isMixedGrammarLesson
              ? 'none'
              : isDarkMode
                ? '0px 2px 5px rgba(0,0,0,0.25)'
                : `0px 2px 5px ${withColorAlpha(colors.shadow, 0.72)}`,
          },
        ]}
      >
        {isMixedGrammarLesson ? (
          <View style={[styles.mixedLessonIcon, { backgroundColor: mixedLessonIconSurface, borderColor: mixedLessonBorder }]}>
            {mixedLessonImageUrls.length > 0 ? (
              <View style={styles.mixedLessonImageStack}>
                {mixedLessonImageUrls.slice(0, 3).map((imageUrl, index) => (
                  <ExpoImage
                    key={`${imageUrl}-${index}`}
                    source={{ uri: imageUrl }}
                    style={[
                      styles.mixedLessonStackImage,
                      {
                        backgroundColor: colors.surfaceAlt,
                        left: index * 13,
                        transform: [{ rotate: index === 0 ? '-6deg' : index === 1 ? '3deg' : '9deg' }],
                      },
                    ]}
                    contentFit="cover"
                    transition={200}
                    cachePolicy="memory-disk"
                  />
                ))}
              </View>
            ) : null}
            <View style={[styles.mixedLessonShuffleBadge, { backgroundColor: colors.buttonBackground, borderColor: '#FFFFFF' }]}>
              <MaterialIcons name="shuffle" size={Math.round(17 * desktopScale)} color={colors.buttonText} />
            </View>
          </View>
        ) : (
          <>
            {(!shouldRenderThumbnail || !imageLoaded) && (
              <View style={styles.lessonThumbnailSkeleton}>
                <View
                  style={[
                    styles.thumbnailSkeletonPanel,
                    { backgroundColor: colors.card },
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
              <ExpoImage
                source={imageSource}
                style={styles.lessonThumbnailImage}
                contentFit="cover"
                transition={200}
                cachePolicy="memory-disk"
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageLoadFailed(true)}
              />
            )}

            {imageLoadFailed && (
              <MaterialIcons name="image-not-supported" size={Math.round(22 * desktopScale)} color={colors.secondaryText} />
            )}
          </>
        )}
      </View>

      <View style={styles.lessonInfo}>
        <Text style={[styles.lessonTitle, { color: colors.text }]} numberOfLines={2}>
          {lesson.title}
        </Text>
        {isMixedGrammarLesson && typeof lesson.description === 'string' && (
          <Text
            style={[styles.lessonSubtitle, { color: colors.secondaryText }]}
            numberOfLines={1}
          >
            {lesson.description}
          </Text>
        )}
        {isMixedGrammarLesson && (
          <View style={styles.mixedMetaRow}>
            <View style={[styles.mixedMetaPill, { backgroundColor: mixedLessonMetaSurface, borderColor: colors.primary }]}>
              <MaterialIcons name="auto-awesome" size={Math.round(13 * desktopScale)} color={colors.primary} />
              <Text style={[styles.mixedMetaText, { color: colors.primary }]}>
                {lesson.sourceLessonCount ?? mixedLessonImageUrls.length} {lesson.sourceLessonCount === 1 ? copy.lessonSingular : copy.lessonPlural}
              </Text>
            </View>
          </View>
        )}
        <View style={styles.lessonPillRow}>
          {practicedToday && (
            <View style={[styles.todayPill, { backgroundColor: colors.primarySoft, borderColor: colors.primary }]}>
              <MaterialIcons name="today" size={Math.round(12 * desktopScale)} color={colors.primary} />
              <Text style={[styles.todayPillText, { color: colors.primary }]}>Today</Text>
            </View>
          )}
          {savedAnswerCount > 0 && (
            <View style={[styles.savedAnswersPill, { backgroundColor: colors.successSoft, borderColor: colors.success }]}>
              <MaterialIcons name="check-circle" size={Math.round(14 * desktopScale)} color={colors.success} />
              <Text style={[styles.savedAnswersText, { color: colors.successText ?? colors.success }]}>
                {savedAnswerCount} {savedAnswerCount === 1 ? copy.savedAnswerSingular : copy.savedAnswerPlural}
              </Text>
            </View>
          )}
        </View>
      </View>

      {selectionMode && selectable ? (
        <MaterialIcons
          name={selected ? 'check-box' : 'check-box-outline-blank'}
          size={Math.round(24 * desktopScale)}
          color={selected ? colors.primary : colors.secondaryText}
        />
      ) : (
        <MaterialIcons
          name="arrow-forward-ios"
          size={Math.round(16 * desktopScale)}
          color={colors.secondaryText}
        />
      )}
      </TouchableOpacity>
      </Animated.View>
    </Animated.View>
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

const GrammarCategoryList: React.FC<{ onSelectLesson: (lesson: GrammarLesson) => void }> =
({ onSelectLesson }) => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const isDesktopWeb = isDesktopWebWidth(windowWidth, undefined, windowHeight);
  const desktopContentMaxWidth = getDesktopContentMaxWidth(windowWidth, 'scroll', windowHeight);
  const desktopScale = useDesktopTypographyScale();
  // Tablet keeps the mobile structural layout (isDesktopWeb stays false)
  // but still gets a real desktopScale > 1 — numeric-only scale call sites
  // gate on this instead of isDesktopWeb alone, which used to leave tablet
  // at the flat phone size even though its own scale was already correct.
  const isScaledLayout = isDesktopWeb || desktopScale > 1;
  // Growing 1:1 with desktopScale makes the "Select lessons" button dominate the header on
  // wide screens, so its whole box (and the text inside it) scales at a gentler rate instead.
  const selectButtonScale = 1 + (desktopScale - 1) * 0.5;
  const { colors, isDarkMode, isAndroidStatusBarEnabled } = useTheme();
  const appCopy = getMenuCopy();
  const copy = appCopy.grammar;
  const commonCopy = appCopy.common;
  const isSelectionTrayCompact = windowWidth < NARROW_TRAY_WIDTH;
  const topContentInset = getTopSafeAreaInset(Platform.OS, insets.top, isAndroidStatusBarEnabled);

  const [expandedSub, setExpandedSub] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState('');
  const [grammarProgressCounts, setGrammarProgressCounts] = useState<Record<string, number>>({});
  const [practicedTodayKeys, setPracticedTodayKeys] = useState<Set<string>>(() => new Set());
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedLessonKeys, setSelectedLessonKeys] = useState<Set<string>>(() => new Set());
  const selectableGrammarLessons = useMemo(
    () =>
      grammarCategories.flatMap((level) =>
        level.subcategories.flatMap((subcategory) =>
          subcategory.lessons.filter((lesson) =>
            lesson.practiceType !== 'vocabulary' &&
            Array.isArray(lesson.exercises) &&
            lesson.exercises.length > 0
          )
        )
      ),
    []
  );
  const selectedLessons = useMemo(
    () =>
      selectableGrammarLessons.filter((lesson) =>
        selectedLessonKeys.has(getGrammarLessonProgressKey(lesson))
      ),
    [selectableGrammarLessons, selectedLessonKeys]
  );
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

      Promise.all([
        getGrammarLessonProgressCounts(lessonProgressKeys),
        getGrammarLessonKeysPracticedToday(),
      ]).then(([counts, todayKeys]) => {
        if (!active) return;
        setGrammarProgressCounts(counts);
        setPracticedTodayKeys(todayKeys);
      }).catch(() => {});

      return () => {
        active = false;
      };
    }, [lessonProgressKeys])
  );

  const toggleSub = (key: string) => {
    if (Platform.OS === 'android') {
      UIManager.setLayoutAnimationEnabledExperimental?.(true);
    }
    LayoutAnimation.configureNext(
      LayoutAnimation.create(220, LayoutAnimation.Types.easeInEaseOut, LayoutAnimation.Properties.opacity)
    );
    setExpandedSub(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const canSelectLessonForMix = (lesson: any) =>
    lesson.practiceType !== 'vocabulary' &&
    Array.isArray(lesson.exercises) &&
    lesson.exercises.length > 0 &&
    !lesson.isMixedGrammarLesson;

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
    const lessonKey = getGrammarLessonProgressKey(lesson);

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

  const startSelectedMix = () => {
    if (selectedLessons.length < 2) return;

    const selectedKeys = selectedLessons
      .map((lesson) => getGrammarLessonProgressKey(lesson))
      .sort()
      .join('-');
    const mixedLesson = createMixedGrammarLesson({
      idSeed: `selected-${selectedKeys}`,
      title: `${copy.mixedPracticeTitle}: ${copy.selectedMixTitle}`,
      description: copy.mixedPracticeSubtitle.replace('{count}', String(selectedLessons.length)),
      sourceLessons: selectedLessons,
    });

    if (!mixedLesson) return;

    setSelectionMode(false);
    setSelectedLessonKeys(new Set());
    onSelectLesson(mixedLesson);
  };

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

  const getSavedAnswerCount = (lesson: any) => {
    if (Array.isArray(lesson.sourceLessonProgressKeys)) {
      return lesson.sourceLessonProgressKeys.reduce(
        (total: number, lessonKey: string) => total + (grammarProgressCounts[lessonKey] ?? 0),
        0
      );
    }

    return grammarProgressCounts[getGrammarLessonProgressKey(lesson)] ?? 0;
  };
  const selectionTrayBottomPadding = getBottomSafeAreaInset(insets.bottom);
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
  const searchSurfaceColor = studySurface.search;
  const searchBorderColor = studySurface.searchBorder;
  const searchActiveColor = studySurface.searchActive;
  const searchFocusAnim = useSearchFocusAnimation(!!search.trim(), searchBorderColor, searchActiveColor);
  const visibleGrammarSections = grammarCategories
    .map((level) => ({
      key: level.group,
      title: level.title,
      data: level.subcategories
        .map((sub, subIndex) => ({
          key: `${level.group}-${subIndex}`,
          sub,
          subIndex,
          levelTitle: level.title,
          lessons: filterLessons(sub.lessons, `${level.title} ${sub.title}`),
        }))
        .filter(({ lessons }) => !search.trim() || lessons.length > 0),
    }))
    .filter((section) => !search.trim() || section.data.length > 0);
  const hasGrammarLessons = grammarCategories.some((level) =>
    level.subcategories.some((subcategory) => subcategory.lessons.length > 0)
  );
  const hasSearchResults = !search.trim() || visibleGrammarSections.some((section) => section.data.length > 0);

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
    <SectionList
      style={styles.container}
      sections={hasGrammarLessons ? visibleGrammarSections : []}
      keyExtractor={(item: GrammarSubcategoryListItem) => item.key}
      removeClippedSubviews={Platform.OS !== 'web'}
      overScrollMode="never"
      bounces={false}
      alwaysBounceVertical={false}
      stickySectionHeadersEnabled={false}
      contentContainerStyle={[
        {
          paddingTop: topContentInset,
          paddingBottom: selectionMode ? 142 : 18,
        },
        isDesktopWeb && [styles.desktopContentWrap, { maxWidth: desktopContentMaxWidth }],
      ]}
      ListHeaderComponent={(
        <>
          <BackButton label={commonCopy.backToHome} onPress={() => navigation.goBack()} />

          <View style={styles.headerRow}>
            <Text
              style={[
                styles.headerTitle,
                isSelectionTrayCompact && styles.headerTitleCompact,
                { color: colors.text },
              ]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.7}
            >
              {copy.header}
            </Text>
            <TouchableOpacity
              activeOpacity={0.84}
              onPress={toggleSelectionMode}
              style={[
              styles.headerSelectButton,
              isSelectionTrayCompact && styles.headerSelectButtonCompact,
              isScaledLayout && {
                minHeight: Math.round(42 * selectButtonScale),
                maxWidth: Math.round(174 * selectButtonScale),
                paddingHorizontal: Math.round(12 * selectButtonScale),
                gap: Math.round(7 * selectButtonScale),
              },
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
                size={Math.round(18 * (isScaledLayout ? selectButtonScale : 1))}
                color={selectionMode ? colors.primary : colors.secondaryText}
              />
              <Text
                style={[
                  styles.headerSelectText,
                  isSelectionTrayCompact && styles.headerSelectTextCompact,
                  isScaledLayout && { fontSize: Math.round(14 * selectButtonScale) },
                  { color: selectionMode ? colors.primary : colors.text },
                ]}
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





              desktopScale > 1 && { borderRadius: Math.round(uiRadii.control * desktopScale) },
              searchFocusAnim.animatedStyle,
            ]}
          >
            <TextInput
              value={search}
              onChangeText={setSearch}
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




                desktopScale > 1 && {
                  minHeight: Math.round(46 * desktopScale),
                  paddingRight: Math.round(45 * desktopScale),
                  paddingLeft: Math.round(44 * desktopScale),
                  paddingVertical: Math.round(14 * desktopScale),
                },
              ]}
            />

            <View
              style={[
                styles.searchIconWrap,
                desktopScale > 1 && { left: Math.round(16 * desktopScale), width: Math.round(24 * desktopScale) },
              ]}
            >
              <MaterialIcons name="search" size={Math.round(20 * desktopScale)} color={searchActiveColor} />
            </View>

            {search.length > 0 && (
              <Animated.View
                entering={FadeIn.duration(140)}
                exiting={FadeOut.duration(110)}
                style={[
                  styles.searchClearButton,
                  desktopScale > 1 && { right: Math.round(18 * desktopScale), width: Math.round(40 * desktopScale) },
                ]}
              >
                <TouchableOpacity
                  onPress={() => setSearch('')}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <MaterialIcons name="close" size={Math.round(20 * desktopScale)} color={searchActiveColor} />
                </TouchableOpacity>
              </Animated.View>
            )}
          </Animated.View>

          {!hasGrammarLessons && (
            <View style={[styles.searchEmptyState, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <FloatingIcon name="menu-book" size={Math.round(28 * desktopScale)} color={colors.secondaryText} />
              <Text style={[styles.searchEmptyTitle, { color: colors.text }]}>{copy.noLessonTitle}</Text>
              <Text style={[styles.searchEmptySubtitle, { color: colors.secondaryText }]}>
                {copy.noLessonText}
              </Text>
            </View>
          )}

          {hasGrammarLessons && !hasSearchResults && (
            <View style={[styles.searchEmptyState, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <FloatingIcon name="search-off" size={Math.round(28 * desktopScale)} color={colors.secondaryText} />
              <Text style={[styles.searchEmptyTitle, { color: colors.text }]}>{copy.noSearchTitle}</Text>
              <Text style={[styles.searchEmptySubtitle, { color: colors.secondaryText }]}>
                {copy.noSearchText}
              </Text>
            </View>
          )}
        </>
      )}
      renderSectionHeader={({ section }) => (
        <View style={styles.levelHeader}>
          <Text style={[styles.levelTitle, { color: colors.text }]}>
            {section.title}
          </Text>
        </View>
      )}
      renderSectionFooter={() => <View style={styles.levelFooterSpacer} />}
      renderItem={({ item }: { item: GrammarSubcategoryListItem }) => {
        const { key, sub, lessons, subIndex } = item;
        const open = search ? true : expandedSub[key];
        const subColor = subColors[subIndex % subColors.length];
        const emoji = subEmojiMap[sub.title] || '\uD83D\uDCD8';

        return (
          <View
            style={[
              styles.categoryContainer,
              desktopScale > 1 && {
                marginBottom: Math.round(16 * desktopScale),
                marginHorizontal: Math.round(16 * desktopScale),
                borderRadius: Math.round(uiRadii.card * desktopScale),
              },
              {
                backgroundColor: colors.card,
                borderWidth: 2.5,
                borderColor: '#FFFFFF',
              }
            ]}
          >
            <TouchableOpacity
              style={[
                styles.categoryHeader,
                desktopScale > 1 && { padding: Math.round(16 * desktopScale) },
                { backgroundColor: subColor },
              ]}
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
                  size={Math.round(20 * desktopScale)}
                  color="#FFFFFF"
                />
              )}
            </TouchableOpacity>

            {open && (
              <View style={styles.lessonsContainer}>
                {lessons.map((lesson: any, li: number) => {
                  const selectable = canSelectLessonForMix(lesson);
                  const savedAnswerCount = getSavedAnswerCount(lesson);
                  const lessonKey = getGrammarLessonProgressKey(lesson);
                  const rowKey = lesson.id ? String(lesson.id) : `${lesson.title}-${li}`;

                  return (
                    <GrammarLessonRow
                      key={rowKey}
                      lesson={lesson}
                      savedAnswerCount={savedAnswerCount}
                      practicedToday={practicedTodayKeys.has(getGrammarLessonProgressKey(lesson))}
                      rowIndex={li}
                      staggerRemoteImageLoad={lessons.length > 6 || !!search.trim()}
                      colors={colors}
                      isDarkMode={isDarkMode}
                      copy={copy}
                      onSelectLesson={onSelectLesson}
                      selectionMode={selectionMode}
                      selected={selectedLessonKeys.has(lessonKey)}
                      selectable={selectable}
                      onToggleLesson={toggleLessonSelection}
                    />
                  );
                })}
              </View>
            )}
          </View>
        );
      }}
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
            getSoftShadow(isDarkMode, 'raised', colors.shadow, colors.visualStyle === 'pixel'),
            isDesktopWeb && [styles.selectionControlsDesktopWeb, { maxWidth: desktopContentMaxWidth }],
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
            <View style={[styles.selectedMixPreviewRow, isSelectionTrayCompact && styles.selectedMixPreviewRowCompact, { borderTopColor: trayBorderColor }]}>
              <View style={[styles.selectedMixStackCanvas, isSelectionTrayCompact && styles.selectedMixStackCanvasCompact]}>
                {selectedLessons.slice(0, 4).map((selectedLesson: any, stackIndex: number) => {
                  const selectedLessonImageSource = getLessonImageSource(selectedLesson.imageUrl);
                  const selectedLessonKey = getGrammarLessonProgressKey(selectedLesson);

                  return (
                    <View
                      key={selectedLessonKey}
                      style={[
                        styles.selectedMixStackCard,
                        isSelectionTrayCompact && styles.selectedMixStackCardCompact,
                        {
                          left: stackIndex * (isSelectionTrayCompact ? 22 : 32),
                          zIndex: stackIndex + 1,
                          transform: [{ rotate: stackIndex === 0 ? '-7deg' : stackIndex === 1 ? '-1deg' : stackIndex === 2 ? '5deg' : '10deg' }],
                          backgroundColor: trayColors.stackFrame,
                        },
                      ]}
                    >
                      {selectedLessonImageSource ? (
                        <Image
                          source={selectedLessonImageSource}
                          style={styles.selectedMixStackImage}
                          resizeMode="cover"
                        />
                      ) : (
                        <MaterialIcons name="image-not-supported" size={19} color={colors.secondaryText} />
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
                <Text
                  style={[styles.selectedMixPreviewTitle, isSelectionTrayCompact && styles.selectedMixPreviewTitleCompact, { color: trayTextColor }]}
                  numberOfLines={1}
                >
                  {selectedLessons.slice(0, 3).map((selectedLesson: any) => selectedLesson.title).join(' + ')}
                  {selectedLessons.length > 3 ? ` + ${selectedLessons.length - 3} more` : ''}
                </Text>
                {selectedLessons.length === 1 && (
                  <Text style={[styles.selectedMixHint, { color: trayMutedColor }]}>
                    Select 1 more to start
                  </Text>
                )}
              </View>
              <TouchableOpacity
                activeOpacity={selectedLessons.length >= 2 ? 0.84 : 1}
                onPress={startSelectedMix}
                disabled={selectedLessons.length < 2}
                style={[
                  styles.startMixButton,
                  isSelectionTrayCompact && styles.startMixButtonCompact,
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
                {!isSelectionTrayCompact && (
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
    </View>
  );
};

export default GrammarCategoryList;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  container: { flex: 1 },
  desktopContentWrap: {


    width: '100%',
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




  headerTitleCompact: {
    fontSize: 26,
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
  headerSelectButtonCompact: {
    maxWidth: 132,
    paddingHorizontal: 9,
    gap: 5,
  },
  headerSelectText: {
    flexShrink: 1,
    fontSize: 14,
    fontWeight: '800',
  },
  headerSelectTextCompact: {
    fontSize: 12.5,
  },
  searchShell: {
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 20,
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
  searchEmptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 12,
    marginTop: 24,
    paddingVertical: 32,
    paddingHorizontal: 24,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  searchEmptyTitle: {
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
  },
  searchEmptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
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
    // Keep elevation (it's what puts the tray above the tab bar on Android), but this
    // wrapper is explicitly transparent — the shadow it casts is a rectangular grey halo
    // around the rounded tray inside it, drawn from this view's own outline.
    elevation: 20,
    shadowColor: 'transparent',
    left: 0,
    paddingTop: 10,
    position: 'absolute',
    right: 0,
    zIndex: 20,
  },
  selectionControlsDesktopWeb: {


    width: '100%',
    alignSelf: 'center',
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
  levelHeader: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  levelTitle: {
    fontSize: 25,
    fontWeight: 'bold',
  },
  levelFooterSpacer: {
    height: 16,
  },

  categoryContainer: {
    marginBottom: 16,
    marginHorizontal: 16,
    borderRadius: uiRadii.card,
    overflow: 'hidden',
  },
  categoryContainerActive: {
    borderWidth: 2,
  },

  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    justifyContent: 'space-between',
  },

  categoryIcon: {
    fontSize: 24,
  },
  categoryTitleBlock: {
    flex: 1,
    marginLeft: 12,
    minHeight: 39,
    minWidth: 0,
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
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
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
    borderBottomWidth: 2,
  },
  mixedLessonItem: {
    borderWidth: 1.5,
    paddingVertical: 14,
  },
  selectedLessonItem: {
    borderWidth: 2,
  },

  lessonThumbnail: {
    width: 70,
    height: 70,
    borderRadius: uiRadii.thumbnail,
    marginRight: 6,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    // No elevation: the row fades/slides in (FadeInDown), and Android composites a native
    // elevation shadow separately from that, so mid-animation it read as a grey plate
    // around the thumbnail. The boxShadow applied at the call site fades with the row.
  },
  mixedLessonThumbnail: {
    backgroundColor: 'transparent',
    overflow: 'visible',
  },
  lessonThumbnailImage: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  mixedLessonIcon: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: uiRadii.thumbnail,
    borderWidth: 1.5,
    overflow: 'visible',
  },
  mixedLessonImageStack: {
    width: 58,
    height: 52,
    position: 'relative',
  },
  mixedLessonStackImage: {
    position: 'absolute',
    top: 4,
    width: 36,
    height: 44,
    borderRadius: 8,
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    backgroundColor: '#EAF0F6',
  },
  mixedLessonShuffleBadge: {
    position: 'absolute',
    right: -4,
    bottom: -4,
    width: 27,
    height: 27,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lessonThumbnailSkeleton: {
    ...StyleSheet.absoluteFill,
    padding: 8,
    justifyContent: 'flex-end',
  },
  thumbnailSkeletonPanel: {
    ...StyleSheet.absoluteFill,
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
  lessonSubtitle: {
    marginTop: 3,
    fontSize: 13,
    fontWeight: '700',
  },
  mixedMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    marginTop: 7,
  },
  mixedMetaPill: {
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1.5,
    flexDirection: 'row',
    gap: 4,
    minHeight: 24,
    paddingHorizontal: 8,
  },
  mixedMetaText: {
    fontSize: 12,
    fontWeight: '900',
  },
  lessonPillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    marginTop: 8,
  },
  todayPill: {
    minHeight: 24,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  todayPillText: {
    fontSize: 11,
    fontWeight: '900',
  },
  selectedMixHint: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  savedAnswersPill: {
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
