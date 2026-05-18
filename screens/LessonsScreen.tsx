import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Platform } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import BackButton from '../components/BackButton';
import { toast } from 'sonner-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { lessonCategories as chapterCategories } from '../content/lessons/chapterData';
import { resourceCategories as resourceLinkCategories } from '../content/lessons/resourceLinks';
import { resolveChapterAppLink } from '../content/lessons/appLessonRegistry';
import type { ResolvedChapterAppLink } from '../content/lessons/lessonTypes';
import { SHOW_PRONUNCIATION_FEATURE } from '../lib/featureFlags';
import { getMenuCopy } from '../utils/menuCopy';
import {
  getCustomChapterLinkOverrides,
  makeChapterLinkOverrideId,
  normalizeChapterLinkOverrides,
  type ChapterLinkOverride,
} from '../utils/chapterLinkStorage';

const bundledCustomChapterLinks = require('../content/lessons/customChapterLinks.json') as any[];

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

export default function LessonsScreen() {
  const navigation = useNavigation();
  const { isDarkMode, colors, isAndroidStatusBarEnabled, menuLanguage } = useTheme();
  const appCopy = getMenuCopy(menuLanguage);
  const copy = appCopy.lessons;
  const commonCopy = appCopy.common;
  const insets = useSafeAreaInsets();
  const topContentInset = Platform.OS === 'ios'
    ? (insets.top > 0 ? insets.top : 0)
    : Platform.OS === 'android' && isAndroidStatusBarEnabled
      ? insets.top
      : 0;
  const [viewMode, setViewMode] = useState<'chapters' | 'resources'>('chapters');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedResourceCategory, setSelectedResourceCategory] = useState<number | null>(null);
  const [selectedLink, setSelectedLink] = useState<string | null>(null);
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
        toast.error(copy.cannotOpenUrl);
      }
    } catch (err) {
      toast.error(copy.openUrlError);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await Clipboard.setStringAsync(text);
      toast.success(copy.copied);
    } catch (err) {
      toast.error(copy.copyFailed);
    }
  };

  const showLink = (url: string) => {
    setSelectedLink(url);
    openLink(url);
  };

  const openAppLink = (appLink: ResolvedChapterAppLink) => {
    setSelectedLink(null);

    if (appLink.target === 'vocabulary') {
      (navigation as any).navigate('Vocabulary', {
        screen: 'VocabularyLesson',
        params: {
          lesson: appLink.lesson,
          backLabel: commonCopy.backToChapters,
          backTarget: 'Lessons',
        },
      });
      return;
    }

    if (appLink.target === 'pronunciation') {
      (navigation as any).navigate('Pronunciation', {
        screen: 'PronunciationLesson',
        params: {
          lesson: appLink.lesson,
          categoryColor: appLink.categoryColor,
        },
      });
      return;
    }

    (navigation as any).navigate('Grammar', {
      lesson: appLink.lesson,
      backLabel: commonCopy.backToChapters,
      backTarget: 'Lessons',
      openKey: Date.now(),
    });
  };

  const handleViewModeChange = (mode: 'chapters' | 'resources') => {
    setViewMode(mode);
    setSelectedCategory(null);
    setSelectedResourceCategory(null);
    setSelectedLink(null);
  };

  return (
    <ScrollView 
      style={[
        styles.container, 
        { backgroundColor: colors.background }
      ]}
      contentContainerStyle={{
        paddingTop: topContentInset,
        paddingBottom: selectedLink ? 96 : 24,
      }}
    >
      <BackButton label={commonCopy.backToHome} onPress={() => (navigation as any).navigate('Home')} />
      <Text style={[styles.headerTitle, { color: colors.text }]}>{copy.header}</Text>

      <View
        style={[
          styles.modeToggle,
          {
            backgroundColor: isDarkMode ? colors.card : '#f6f9fc',
            borderColor: isDarkMode ? 'rgba(255,255,255,0.72)' : '#d9e2ec',
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.modeOption,
            viewMode === 'chapters' && styles.modeOptionActive,
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
              { color: viewMode === 'chapters' ? '#fff' : colors.text },
            ]}
          >
            {copy.chapters}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.modeOption,
            viewMode === 'resources' && styles.modeOptionActive,
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
              { color: viewMode === 'resources' ? '#fff' : colors.text },
            ]}
          >
            {copy.resources}
          </Text>
        </TouchableOpacity>
      </View>

      {viewMode === 'chapters' && chapterCategories.map((category, index) => (
        <View
          key={index}
          style={[
            styles.categoryContainer,
            selectedCategory === index && styles.categoryContainerActive,
            {
              backgroundColor: colors.card,
              borderColor: selectedCategory === index ? category.color : 'transparent',
              shadowColor: '#000000',
              shadowOpacity: selectedCategory === index ? (isDarkMode ? 0.28 : 0.16) : (isDarkMode ? 0.2 : 0.1),
            },
          ]}
        >
          <TouchableOpacity
            style={[styles.categoryHeader, { backgroundColor: category.color }]}
            onPress={() => setSelectedCategory(selectedCategory === index ? null : index)}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={`${selectedCategory === index ? commonCopy.collapse : commonCopy.expand} ${category.title} ${copy.chapterPlural}`}
            accessibilityState={{ expanded: selectedCategory === index }}
          >
            <Text style={styles.categoryIcon}>{category.icon}</Text>
            <View style={styles.categoryTitleBlock}>
              <Text style={styles.categoryTitle}>{category.title}</Text>
            </View>
            <View style={styles.lessonCountPill}>
              <Text style={styles.lessonCountText}>
                {category.lessons.length} {category.lessons.length > 1 ? copy.chapterPlural : copy.chapterSingular}
              </Text>
            </View>
            <MaterialIcons 
              name={selectedCategory === index ? 'expand-less' : 'expand-more'} 
              size={24} 
              color="white" 
            />
          </TouchableOpacity>
          {selectedCategory === index && (
            <View style={styles.lessonsContainer}>
              {category.lessons.map((lesson, lessonIndex) => {
                const chapterLinkOverride = chapterLinkOverrideMap.get(
                  makeChapterLinkOverrideId(category.title, lesson.title)
                );
                const chapterUrl = chapterLinkOverride?.url ?? lesson.url;
                const displayLessonTitle = chapterLinkOverride?.displayTitle || lesson.title;
                const chapter = parseChapterTitle(displayLessonTitle);
                const appLinks = (lesson.appLinks ?? [])
                  .map(resolveChapterAppLink)
                  .filter((link): link is ResolvedChapterAppLink => {
                    if (!link) return false;
                    return SHOW_PRONUNCIATION_FEATURE || link.target !== 'pronunciation';
                  });
                return (
                  <View
                    key={lessonIndex}
                    style={[
                      styles.lessonItem,
                      appLinks && appLinks.length > 0 ? styles.lessonItemWithAppLinks : null,
                      {
                        backgroundColor: isDarkMode ? '#23324d' : '#f8fafc',
                        borderColor: isDarkMode ? colors.border : '#e6edf5',
                      },
                    ]}
                  >
                    <TouchableOpacity
                      style={styles.chapterMainRow}
                      activeOpacity={0.82}
                      onPress={() => openLink(chapterUrl)}
                      accessibilityRole="link"
                      accessibilityLabel={`Open ${displayLessonTitle}`}
                    >
                      <View style={[styles.chapterLabelBadge, { backgroundColor: category.color }]}>
                        <Text style={styles.chapterLabelPrefix}>
                          {chapter.labelPrefix || copy.chapterFallback}
                        </Text>
                        <Text style={styles.chapterLabelNumber}>
                          {chapter.labelNumber || lessonIndex + 1}
                        </Text>
                      </View>
                      <View style={styles.chapterTextBlock}>
                        <Text style={[styles.lessonTitle, { color: colors.text }]}>{chapter.title}</Text>
                        {!!appLinks?.length && (
                          <Text style={[styles.revisionHint, { color: colors.secondaryText }]} />
                        )}
                      </View>
                      <View style={[styles.chapterArrow, { borderColor: isDarkMode ? colors.border : '#dbe6f2' }]}>
                        <MaterialIcons name="open-in-new" size={15} color={colors.secondaryText} />
                      </View>
                    </TouchableOpacity>

                    {!!appLinks?.length && (
                      <View style={styles.appLinksBlock}>
                        <Text style={[styles.appLinksTitle, { color: colors.text }]} />
                        <View style={styles.appLinksGrid}>
                          {appLinks.map((appLink) => (
                            <TouchableOpacity
                              key={`${lesson.title}-${appLink.label}`}
                              style={[
                                styles.appLinkButton,
                                {
                                  backgroundColor: isDarkMode ? '#1b2a42' : '#ffffff',
                                  borderColor: isDarkMode ? colors.border : '#dbe6f2',
                                },
                              ]}
                              onPress={() => openAppLink(appLink)}
                              activeOpacity={0.86}
                              accessibilityRole="button"
                              accessibilityLabel={`${copy.practice} ${appLink.label}`}
                            >
                              <MaterialIcons name={appLink.icon} size={18} color={category.color} />
                              <Text style={[styles.appLinkText, { color: colors.text }]}>
                                {appLink.label}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>          )}
        </View>
      ))}

      {viewMode === 'resources' && resourceLinkCategories.map((category, index) => (
        <View
          key={category.title}
          style={[
            styles.categoryContainer,
            selectedResourceCategory === index && styles.categoryContainerActive,
            {
              backgroundColor: colors.card,
              borderColor: selectedResourceCategory === index ? category.color : 'transparent',
              shadowColor: '#000000',
              shadowOpacity: selectedResourceCategory === index ? (isDarkMode ? 0.28 : 0.16) : (isDarkMode ? 0.2 : 0.1),
            },
          ]}
        >
          <TouchableOpacity
            style={[styles.categoryHeader, { backgroundColor: category.color }]}
            onPress={() => setSelectedResourceCategory(selectedResourceCategory === index ? null : index)}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={`${selectedResourceCategory === index ? commonCopy.collapse : commonCopy.expand} ${category.title} ${copy.resources}`}
            accessibilityState={{ expanded: selectedResourceCategory === index }}
          >
            <Text style={styles.categoryIcon}>{category.icon}</Text>
            <View style={styles.categoryTitleBlock}>
              <Text style={styles.categoryTitle}>{category.title}</Text>
            </View>
            <View style={styles.lessonCountPill}>
              <Text style={styles.lessonCountText}>
                {category.resources.length} {category.resources.length > 1 ? copy.linkPlural : copy.linkSingular}
              </Text>
            </View>
            <MaterialIcons
              name={selectedResourceCategory === index ? 'expand-less' : 'expand-more'}
              size={24}
              color="white"
            />
          </TouchableOpacity>
          {selectedResourceCategory === index && (
            <View style={styles.lessonsContainer}>
              {category.resources.map((resource, resourceIndex) => (
                <TouchableOpacity
                  key={resource.title}
                  style={[
                    styles.lessonItem,
                    {
                      backgroundColor: isDarkMode ? '#23324d' : '#f8fafc',
                      borderColor: isDarkMode ? colors.border : '#e6edf5',
                    },
                  ]}
                  activeOpacity={0.82}
                  onPress={() => showLink(resource.url)}
                  accessibilityRole="link"
                  accessibilityLabel={`Open ${resource.title}`}
                >
                  <View style={[styles.lessonNumberBadge, { backgroundColor: category.color }]}>
                    <Text style={styles.lessonNumberText}>{resourceIndex + 1}</Text>
                  </View>
                  <View style={styles.resourceTextBlock}>
                    <Text style={[styles.lessonTitle, { color: colors.text }]}>
                      {resource.title}
                    </Text>
                    <Text style={[styles.resourceDescription, { color: colors.secondaryText }]}>
                      {resource.description}
                    </Text>
                  </View>
                  <MaterialIcons name="open-in-new" size={18} color={colors.secondaryText} />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      ))}

    </ScrollView>
  );
}

const styles = StyleSheet.create({  container: {
    flex: 1,
  },  backButton: {
    marginTop: 4,
    paddingVertical: 6,
    paddingHorizontal: 0,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  modeToggle: {
    borderRadius: 20,
    borderWidth: 2,
    flexDirection: 'row',
    marginBottom: 18,
    marginHorizontal: 16,
    padding: 6,
  },
  modeOption: {
    alignItems: 'center',
    borderRadius: 14,
    flex: 1,
    justifyContent: 'center',
    minHeight: 44,
  },
  modeOptionActive: {
    backgroundColor: '#1671B6',
  },
  modeOptionText: {
    fontSize: 16,
    fontWeight: '800',
  },
  backText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
    marginLeft: 4,
  },
  categoryContainer: {
    marginBottom: 16,
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  categoryContainerActive: {
    shadowOffset: { width: 0, height: 5 },
    shadowRadius: 10,
    elevation: 6,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    justifyContent: 'space-between',
  },  categoryIcon: {
    fontSize: 24,
  },
  categoryTitleBlock: {
    flex: 1,
    marginLeft: 12,
  },
  categoryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  lessonCountPill: {
    minWidth: 92,
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
    minHeight: 72,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  lessonItemWithAppLinks: {
    alignItems: 'stretch',
    flexDirection: 'column',
  },
  chapterMainRow: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
  },
  lessonNumberBadge: {
    width: 30,
    height: 30,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  lessonNumberText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
  },
  chapterLabelBadge: {
    width: 74,
    minHeight: 52,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    paddingHorizontal: 6,
    paddingVertical: 7,
  },
  chapterLabelPrefix: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
    lineHeight: 12,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  chapterLabelNumber: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '900',
    lineHeight: 23,
    marginTop: 1,
    textAlign: 'center',
  },
  lessonTitle: {
    fontSize: 17,
    flex: 1,
    fontWeight: '800',
    lineHeight: 22,
  },
  chapterTextBlock: {
    flex: 1,
    marginRight: 10,
  },
  revisionHint: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
    marginTop: 3,
  },
  chapterArrow: {
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  appLinksBlock: {
    marginTop: 12,
  },
  appLinksTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  appLinksGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  appLinkButton: {
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 40,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  appLinkText: {
    fontSize: 13,
    fontWeight: '800',
    marginLeft: 6,
  },
  resourceTextBlock: {
    flex: 1,
    marginRight: 12,
  },
  resourceDescription: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
    marginTop: 4,
  },
  linkContainer: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    borderRadius: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  linkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  linkText: {
    flex: 1,
    fontSize: 14,
    marginRight: 12,
  },
});
