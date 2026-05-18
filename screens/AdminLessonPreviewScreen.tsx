import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BackButton from '../components/BackButton';
import { useTheme } from '../contexts/ThemeContext';
import {
  deleteCustomVocabularyLesson,
  getCustomVocabularyLessons,
  saveCustomVocabularyLesson,
  type CustomVocabularyLesson,
} from '../utils/customLessonStorage';
import { lessonCategories as chapterCategories } from '../content/lessons/chapterData';
import {
  deleteCustomChapterLinkOverride,
  getCustomChapterLinkOverrides,
  makeChapterLinkOverrideId,
  normalizeChapterLinkOverrides,
  saveCustomChapterLinkOverride,
  type ChapterLinkOverride,
} from '../utils/chapterLinkStorage';

const bundledCustomChapterLinks = require('../content/lessons/customChapterLinks.json') as any[];

type EditableWord = {
  english: string;
  french: string;
};

type EditableChapterLink = {
  id: string;
  categoryTitle: string;
  lessonTitle: string;
  defaultTitle: string;
  defaultUrl: string;
  color: string;
};

type ChapterLinkDraft = {
  displayTitle: string;
  url: string;
};

const emptyWord = (): EditableWord => ({ english: '', french: '' });

const createEmptyDraft = () => ({
  id: `custom-${Date.now()}`,
  title: '',
  description: '',
  imageUrl: '',
  category: 'Custom',
  flashcards: [emptyWord()],
  createdAt: undefined as string | undefined,
});

const parseDelimitedLines = (text: string, delimiter: string): EditableWord[] => {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  return lines
    .map((line) => {
      const parts = line.split(delimiter).map((part) => part.trim());
      if (parts.length < 2) return null;

      return {
        english: parts[0] ?? '',
        french: parts[1] ?? '',
      };
    })
    .filter((value): value is EditableWord => !!value)
    .filter((word, index) => {
      if (index !== 0) return true;

      const english = word.english.toLowerCase();
      const french = word.french.toLowerCase();

      return !(
        (english === 'english' || english === 'en') &&
        (french === 'french' || french === 'fr')
      );
    })
    .filter((word) => word.english && word.french);
};

const parseImportedPairs = (text: string, fileName?: string): EditableWord[] => {
  const trimmed = text.trim();
  const lowerName = fileName?.toLowerCase() ?? '';

  if (!trimmed) return [];

  if (lowerName.endsWith('.json')) {
    const parsed = JSON.parse(trimmed);

    if (Array.isArray(parsed)) {
      return parsed
        .map((entry) => {
          if (Array.isArray(entry) && entry.length >= 2) {
            return {
              english: String(entry[0] ?? '').trim(),
              french: String(entry[1] ?? '').trim(),
            };
          }

          if (entry && typeof entry === 'object') {
            return {
              english: String((entry as any).english ?? (entry as any).en ?? '').trim(),
              french: String((entry as any).french ?? (entry as any).fr ?? '').trim(),
            };
          }

          return null;
        })
        .filter((value): value is EditableWord => !!value)
        .filter((word) => word.english && word.french);
    }

    if (parsed && typeof parsed === 'object' && Array.isArray((parsed as any).flashcards)) {
      return (parsed as any).flashcards
        .map((entry: any) => ({
          english: String(entry?.english ?? '').trim(),
          french: String(entry?.french ?? '').trim(),
        }))
        .filter((word: EditableWord) => word.english && word.french);
    }
  }

  if (trimmed.includes('\t')) {
    return parseDelimitedLines(trimmed, '\t');
  }

  if ((trimmed.match(/;/g) || []).length > (trimmed.match(/,/g) || []).length) {
    return parseDelimitedLines(trimmed, ';');
  }

  return parseDelimitedLines(trimmed, ',');
};

const exportableLesson = (lesson: CustomVocabularyLesson) => ({
  id: lesson.id,
  title: lesson.title,
  description: lesson.description ?? '',
  imageUrl: lesson.imageUrl ?? '',
  category: lesson.category ?? 'Custom',
  flashcards: lesson.flashcards.map((word) => ({
    english: word.english,
    french: word.french,
  })),
});

export default function AdminLessonPreviewScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { colors, isDarkMode } = useTheme();
  const [activeAdminTab, setActiveAdminTab] = useState<'chapterLinks' | 'vocabularyLessons'>('chapterLinks');
  const [lessons, setLessons] = useState<CustomVocabularyLesson[]>([]);
  const [draft, setDraft] = useState(createEmptyDraft());
  const [isSaving, setIsSaving] = useState(false);
  const [expandedChapterLevels, setExpandedChapterLevels] = useState<Record<string, boolean>>({
    '6e': true,
    '5e': false,
    '4e': false,
    '3e': false,
  });
  const bundledChapterLinkOverrides = useMemo(
    () => normalizeChapterLinkOverrides(bundledCustomChapterLinks),
    []
  );
  const [chapterLinkOverrides, setChapterLinkOverrides] = useState<ChapterLinkOverride[]>([]);
  const [chapterLinkDrafts, setChapterLinkDrafts] = useState<Record<string, ChapterLinkDraft>>({});
  const chapterLinkItems = useMemo<EditableChapterLink[]>(
    () => chapterCategories.flatMap((category) =>
      category.lessons.map((lesson) => ({
        id: makeChapterLinkOverrideId(category.title, lesson.title),
        categoryTitle: category.title,
        lessonTitle: lesson.title,
        defaultTitle: lesson.title,
        defaultUrl: lesson.url,
        color: category.color,
      }))
    ),
    []
  );
  const chapterLinkGroups = useMemo(() => {
    const groupMap = new Map<string, EditableChapterLink[]>();

    chapterLinkItems.forEach((item) => {
      const group = groupMap.get(item.categoryTitle) ?? [];
      group.push(item);
      groupMap.set(item.categoryTitle, group);
    });

    return [...groupMap.entries()].map(([title, items]) => ({
      title,
      color: items[0]?.color ?? '#1671B6',
      items,
    }));
  }, [chapterLinkItems]);
  const bundledChapterLinkOverrideMap = useMemo(() => {
    const map = new Map<string, ChapterLinkOverride>();
    bundledChapterLinkOverrides.forEach((override) => map.set(override.id, override));
    return map;
  }, [bundledChapterLinkOverrides]);
  const chapterLinkOverrideMap = useMemo(() => {
    const map = new Map<string, ChapterLinkOverride>();
    bundledChapterLinkOverrides.forEach((override) => map.set(override.id, override));
    chapterLinkOverrides.forEach((override) => map.set(override.id, override));
    return map;
  }, [bundledChapterLinkOverrides, chapterLinkOverrides]);

  const validWordCount = useMemo(
    () => draft.flashcards.filter((word) => word.english.trim() && word.french.trim()).length,
    [draft.flashcards]
  );

  const loadLessons = async () => {
    const nextLessons = await getCustomVocabularyLessons();
    setLessons(nextLessons);
  };

  const loadChapterLinks = async () => {
    const nextOverrides = await getCustomChapterLinkOverrides();
    const localOverrideMap = new Map(nextOverrides.map((override) => [override.id, override]));

    setChapterLinkOverrides(nextOverrides);
    setChapterLinkDrafts(
      Object.fromEntries(
        chapterLinkItems.map((item) => {
          const override =
            localOverrideMap.get(item.id) ??
            bundledChapterLinkOverrideMap.get(item.id);

          return [
            item.id,
            {
              displayTitle: override?.displayTitle ?? item.defaultTitle,
              url: override?.url ?? item.defaultUrl,
            },
          ];
        })
      )
    );
  };

  useEffect(() => {
    void loadLessons();
    void loadChapterLinks();
  }, []);

  const resetDraft = () => {
    setDraft(createEmptyDraft());
  };

  const getPublishedChapterUrl = (item: EditableChapterLink) =>
    bundledChapterLinkOverrideMap.get(item.id)?.url ?? item.defaultUrl;

  const getPublishedChapterTitle = (item: EditableChapterLink) =>
    bundledChapterLinkOverrideMap.get(item.id)?.displayTitle ?? item.defaultTitle;

  const updateChapterLinkDraft = (id: string, field: keyof ChapterLinkDraft, value: string) => {
    setChapterLinkDrafts((current) => ({
      ...current,
      [id]: {
        displayTitle: current[id]?.displayTitle ?? '',
        url: current[id]?.url ?? '',
        [field]: value,
      },
    }));
  };

  const handleSaveChapterLink = async (item: EditableChapterLink) => {
    const displayTitle = (chapterLinkDrafts[item.id]?.displayTitle ?? '').trim();
    const url = (chapterLinkDrafts[item.id]?.url ?? '').trim();
    const publishedTitle = getPublishedChapterTitle(item);
    const publishedUrl = getPublishedChapterUrl(item);

    if (!displayTitle) {
      Alert.alert('Missing title', 'Give the chapter a title before saving.');
      return;
    }

    if (!url) {
      Alert.alert('Missing link', 'Paste a chapter link before saving.');
      return;
    }

    if (!/^https?:\/\//i.test(url)) {
      Alert.alert('Invalid link', 'Chapter links must start with http:// or https://.');
      return;
    }

    if (displayTitle === publishedTitle && url === publishedUrl) {
      const nextOverrides = await deleteCustomChapterLinkOverride(item.id);
      setChapterLinkOverrides(nextOverrides);
      setChapterLinkDrafts((current) => ({
        ...current,
        [item.id]: { displayTitle: publishedTitle, url: publishedUrl },
      }));
      Alert.alert('Saved', 'This chapter now uses the published title and link.');
      return;
    }

    const existingOverride = chapterLinkOverrides.find((override) => override.id === item.id);
    const nextOverrides = await saveCustomChapterLinkOverride({
      id: item.id,
      categoryTitle: item.categoryTitle,
      lessonTitle: item.lessonTitle,
      displayTitle,
      url,
      createdAt: existingOverride?.createdAt,
    });

    setChapterLinkOverrides(nextOverrides);
    setChapterLinkDrafts((current) => ({ ...current, [item.id]: { displayTitle, url } }));
    Alert.alert('Saved', 'This chapter title and link have been updated on this device.');
  };

  const handleResetChapterLink = async (item: EditableChapterLink) => {
    const publishedTitle = getPublishedChapterTitle(item);
    const publishedUrl = getPublishedChapterUrl(item);
    const nextOverrides = await deleteCustomChapterLinkOverride(item.id);
    setChapterLinkOverrides(nextOverrides);
    setChapterLinkDrafts((current) => ({
      ...current,
      [item.id]: { displayTitle: publishedTitle, url: publishedUrl },
    }));
  };

  const toggleChapterLevel = (title: string) => {
    setExpandedChapterLevels((current) => ({
      ...current,
      [title]: !(current[title] ?? false),
    }));
  };

  const handleCopyChapterLinksJson = async () => {
    const payload = chapterLinkOverrides.map((override) => ({
      id: override.id,
      categoryTitle: override.categoryTitle,
      lessonTitle: override.lessonTitle,
      displayTitle: override.displayTitle,
      url: override.url,
    }));

    await Clipboard.setStringAsync(JSON.stringify(payload, null, 2));
    Alert.alert(
      'Copied',
      'Chapter link JSON copied to clipboard. Paste it into content/lessons/customChapterLinks.json before building.'
    );
  };

  const updateDraftField = (
    field: 'title' | 'description' | 'imageUrl' | 'category',
    value: string
  ) => {
    setDraft((current) => ({ ...current, [field]: value }));
  };

  const updateWord = (index: number, key: keyof EditableWord, value: string) => {
    setDraft((current) => ({
      ...current,
      flashcards: current.flashcards.map((word, wordIndex) =>
        wordIndex === index ? { ...word, [key]: value } : word
      ),
    }));
  };

  const addWordRow = () => {
    setDraft((current) => ({
      ...current,
      flashcards: [...current.flashcards, emptyWord()],
    }));
  };

  const removeWordRow = (index: number) => {
    setDraft((current) => {
      const nextWords = current.flashcards.filter((_, wordIndex) => wordIndex !== index);
      return {
        ...current,
        flashcards: nextWords.length ? nextWords : [emptyWord()],
      };
    });
  };

  const handleImportPairs = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/json', 'text/plain', 'text/csv'],
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled || !result.assets?.length) {
        return;
      }

      const asset = result.assets[0];
      const fileContents = await FileSystem.readAsStringAsync(asset.uri);
      const importedPairs = parseImportedPairs(fileContents, asset.name);

      if (!importedPairs.length) {
        Alert.alert('Import failed', 'No English/French pairs were found in that file.');
        return;
      }

      setDraft((current) => ({
        ...current,
        flashcards: importedPairs,
      }));

      Alert.alert('Import complete', `${importedPairs.length} word pairs loaded.`);
    } catch {
      Alert.alert('Import failed', 'Could not read that file. Use CSV, TSV, TXT, or JSON.');
    }
  };

  const handleSave = async () => {
    if (!draft.title.trim()) {
      Alert.alert('Missing title', 'Give the lesson a title first.');
      return;
    }

    if (validWordCount === 0) {
      Alert.alert('No words', 'Add at least one English/French pair.');
      return;
    }

    setIsSaving(true);
    try {
      const nextLessons = await saveCustomVocabularyLesson(draft);
      setLessons(nextLessons);
      resetDraft();
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyCurrentLessonJson = async () => {
    if (!draft.title.trim() || validWordCount === 0) {
      Alert.alert('Nothing to export', 'Save or complete the lesson first.');
      return;
    }

    const json = JSON.stringify(
      {
        ...draft,
        flashcards: draft.flashcards.filter((word) => word.english.trim() && word.french.trim()),
      },
      null,
      2
    );

    await Clipboard.setStringAsync(json);
    Alert.alert('Copied', 'Current lesson JSON copied to clipboard.');
  };

  const handleCopyAllLessonsJson = async () => {
    const payload = lessons.map(exportableLesson);
    await Clipboard.setStringAsync(JSON.stringify(payload, null, 2));
    Alert.alert(
      'Copied',
      'Bundled lessons JSON copied to clipboard. Paste it into content/lessons/customVocabularyLessons.json before building.'
    );
  };

  const handleEdit = (lesson: CustomVocabularyLesson) => {
    setDraft({
      id: lesson.id,
      title: lesson.title,
      description: lesson.description ?? '',
      imageUrl: lesson.imageUrl ?? '',
      category: lesson.category ?? 'Custom',
      flashcards: lesson.flashcards.length ? lesson.flashcards : [emptyWord()],
      createdAt: lesson.createdAt,
    });
  };

  const handleDelete = (lesson: CustomVocabularyLesson) => {
    const deleteLesson = async () => {
      const nextLessons = await deleteCustomVocabularyLesson(lesson.id);
      setLessons(nextLessons);
      if (draft.id === lesson.id) {
        resetDraft();
      }
    };

    if (Platform.OS === 'web') {
      void deleteLesson();
      return;
    }

    Alert.alert('Delete lesson', `Delete "${lesson.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void deleteLesson();
        },
      },
    ]);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingTop: insets.top, paddingBottom: insets.bottom + 28 }}
    >
      <BackButton label="Back to Settings" onPress={() => navigation.goBack()} />

      <View style={styles.header}>
        <Text style={[styles.eyebrow, { color: colors.secondaryText }]}>Hidden Admin</Text>
        <Text style={[styles.title, { color: colors.text }]}>Lesson Studio</Text>
        <Text style={[styles.subtitle, { color: colors.secondaryText }]}>
          Create custom vocabulary lessons without touching code. The image URL is used inside the
          lesson, not for the card thumbnail.
        </Text>
      </View>

      <View
        style={[
          styles.infoCard,
          {
            backgroundColor: isDarkMode ? '#132033' : '#EAF4FF',
            borderColor: isDarkMode ? '#415a77' : '#CFE2F5',
          },
        ]}
      >
        <Text style={[styles.infoTitle, { color: colors.text }]}>Local Drafts</Text>
        <Text style={[styles.infoText, { color: colors.secondaryText }]}>
          Changes saved here stay on this app install only. They help you create and test content,
          but they are not published to every user yet.
        </Text>
      </View>

      <View
        style={[
          styles.infoCard,
          {
            backgroundColor: isDarkMode ? '#16261A' : '#F1FAEB',
            borderColor: isDarkMode ? '#47634D' : '#CFE7BF',
          },
        ]}
      >
        <Text style={[styles.infoTitle, { color: colors.text }]}>Build Workflow</Text>
        <Text style={[styles.infoText, { color: colors.secondaryText }]}>
          To publish changes for every user, copy the JSON from the relevant tab, paste it into
          the matching file in content/lessons, then build and deploy the app.
        </Text>
        <View style={styles.exportRow}>
          <TouchableOpacity onPress={handleCopyCurrentLessonJson} style={styles.exportButton}>
            <MaterialIcons name="content-copy" size={18} color="#1671B6" />
            <Text style={styles.exportButtonText}>Copy Current Lesson</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleCopyAllLessonsJson} style={styles.exportButton}>
            <MaterialIcons name="inventory-2" size={18} color="#1671B6" />
            <Text style={styles.exportButtonText}>Copy Bundled JSON</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View
        style={[
          styles.adminTabBar,
          {
            backgroundColor: isDarkMode ? colors.card : '#F6F9FC',
            borderColor: isDarkMode ? '#415a77' : '#DDE5EE',
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => setActiveAdminTab('chapterLinks')}
          style={[
            styles.adminTabButton,
            activeAdminTab === 'chapterLinks' && { backgroundColor: colors.primary },
          ]}
          accessibilityRole="button"
          accessibilityState={{ selected: activeAdminTab === 'chapterLinks' }}
        >
          <MaterialIcons
            name="link"
            size={18}
            color={activeAdminTab === 'chapterLinks' ? colors.buttonText : colors.primary}
          />
          <Text
            style={[
              styles.adminTabText,
              { color: activeAdminTab === 'chapterLinks' ? colors.buttonText : colors.primary },
            ]}
          >
            Chapter Links
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveAdminTab('vocabularyLessons')}
          style={[
            styles.adminTabButton,
            activeAdminTab === 'vocabularyLessons' && { backgroundColor: colors.primary },
          ]}
          accessibilityRole="button"
          accessibilityState={{ selected: activeAdminTab === 'vocabularyLessons' }}
        >
          <MaterialIcons
            name="library-add"
            size={18}
            color={activeAdminTab === 'vocabularyLessons' ? colors.buttonText : colors.primary}
          />
          <Text
            style={[
              styles.adminTabText,
              { color: activeAdminTab === 'vocabularyLessons' ? colors.buttonText : colors.primary },
            ]}
          >
            New Lesson
          </Text>
        </TouchableOpacity>
      </View>

      {activeAdminTab === 'chapterLinks' && (
      <View
        style={[
          styles.editorCard,
          {
            backgroundColor: colors.card,
            borderColor: isDarkMode ? '#415a77' : '#DDE5EE',
          },
        ]}
      >
        <View style={styles.chapterLinksHeader}>
          <View style={styles.chapterLinksTitleBlock}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Chapter Links</Text>
            <Text style={[styles.chapterLinksSubtitle, { color: colors.secondaryText }]}>
              Change the Digipad link opened from Chapters. Changes apply immediately on this app install.
            </Text>
          </View>
          <TouchableOpacity onPress={handleCopyChapterLinksJson} style={styles.exportButton}>
            <MaterialIcons name="inventory-2" size={18} color="#1671B6" />
            <Text style={styles.exportButtonText}>Copy Link JSON</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.chapterLinkList}>
          {chapterLinkGroups.map((group) => {
            const isExpanded = expandedChapterLevels[group.title] ?? false;
            const localOverrideCount = group.items.filter((item) =>
              chapterLinkOverrides.some((override) => override.id === item.id)
            ).length;

            return (
              <View
                key={group.title}
                style={[
                  styles.chapterLevelGroup,
                  {
                    backgroundColor: isDarkMode ? '#132033' : '#F8FAFC',
                    borderColor: isDarkMode ? '#415a77' : '#DDE5EE',
                  },
                ]}
              >
                <TouchableOpacity
                  onPress={() => toggleChapterLevel(group.title)}
                  style={styles.chapterLevelHeader}
                  accessibilityRole="button"
                  accessibilityState={{ expanded: isExpanded }}
                >
                  <View style={styles.chapterLevelHeaderLeft}>
                    <View style={[styles.chapterLevelBadge, { backgroundColor: group.color }]}>
                      <Text style={styles.chapterLevelBadgeText}>{group.title}</Text>
                    </View>
                    <View>
                      <Text style={[styles.chapterLevelTitle, { color: colors.text }]}>
                        {group.title} chapters
                      </Text>
                      <Text style={[styles.chapterLevelMeta, { color: colors.secondaryText }]}>
                        {group.items.length} links{localOverrideCount > 0 ? ` · ${localOverrideCount} custom` : ''}
                      </Text>
                    </View>
                  </View>
                  <MaterialIcons
                    name={isExpanded ? 'expand-less' : 'expand-more'}
                    size={24}
                    color={colors.secondaryText}
                  />
                </TouchableOpacity>

                {isExpanded && (
                  <View style={styles.chapterLevelItems}>
                    {group.items.map((item) => {
            const publishedTitle = getPublishedChapterTitle(item);
            const publishedUrl = getPublishedChapterUrl(item);
            const effectiveOverride = chapterLinkOverrideMap.get(item.id);
            const currentDraft = chapterLinkDrafts[item.id] ?? {
              displayTitle: publishedTitle,
              url: publishedUrl,
            };
            const hasLocalOverride = chapterLinkOverrides.some((override) => override.id === item.id);
            const effectiveTitle = effectiveOverride?.displayTitle ?? item.defaultTitle;
            const effectiveUrl = effectiveOverride?.url ?? item.defaultUrl;
            const hasUnsavedChange =
              currentDraft.displayTitle.trim() !== effectiveTitle ||
              currentDraft.url.trim() !== effectiveUrl;

            return (
              <View
                key={item.id}
                style={[
                  styles.chapterLinkRow,
                  {
                    backgroundColor: isDarkMode ? '#132033' : '#F8FAFC',
                    borderColor: isDarkMode ? '#415a77' : '#DDE5EE',
                  },
                ]}
              >
                <View style={styles.chapterLinkMetaRow}>
                  <View style={[styles.chapterLevelBadge, { backgroundColor: item.color }]}>
                    <Text style={styles.chapterLevelBadgeText}>{item.categoryTitle}</Text>
                  </View>
                  <View style={styles.chapterLinkTitleBlock}>
                    <Text style={[styles.chapterLinkTitle, { color: colors.text }]}>{effectiveTitle}</Text>
                    <Text style={[styles.chapterLinkStatus, { color: colors.secondaryText }]}>
                      {hasLocalOverride ? 'Local custom title/link' : 'Published title/link'}
                    </Text>
                  </View>
                </View>

                <View style={styles.field}>
                  <Text style={[styles.fieldLabel, { color: colors.secondaryText }]}>Display Title</Text>
                  <TextInput
                    value={currentDraft.displayTitle}
                    onChangeText={(value) => updateChapterLinkDraft(item.id, 'displayTitle', value)}
                    placeholder={item.defaultTitle}
                    placeholderTextColor="#94A3B8"
                    style={[
                      styles.input,
                      {
                        color: colors.text,
                        borderColor: isDarkMode ? '#415a77' : '#DDE5EE',
                        backgroundColor: isDarkMode ? '#0E1828' : '#fff',
                      },
                    ]}
                  />
                </View>

                <View style={styles.field}>
                  <Text style={[styles.fieldLabel, { color: colors.secondaryText }]}>Chapter Link</Text>
                <TextInput
                  value={currentDraft.url}
                  onChangeText={(value) => updateChapterLinkDraft(item.id, 'url', value)}
                  placeholder="https://digipad.app/..."
                  placeholderTextColor="#94A3B8"
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={[
                    styles.input,
                    styles.chapterLinkInput,
                    {
                      color: colors.text,
                      borderColor: isDarkMode ? '#415a77' : '#DDE5EE',
                      backgroundColor: isDarkMode ? '#0E1828' : '#fff',
                    },
                  ]}
                />
                </View>

                <View style={styles.chapterLinkActionsRow}>
                  <TouchableOpacity
                    onPress={() => handleResetChapterLink(item)}
                    style={styles.secondaryButton}
                  >
                    <Text style={styles.secondaryButtonText}>Reset</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleSaveChapterLink(item)}
                    style={[styles.primaryButton, hasUnsavedChange && styles.primaryButtonAttention]}
                  >
                    <Text style={styles.primaryButtonText}>Save Link</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
                    })}
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </View>
      )}

      {activeAdminTab === 'vocabularyLessons' && (
      <View
        style={[
          styles.editorCard,
          {
            backgroundColor: colors.card,
            borderColor: isDarkMode ? '#415a77' : '#DDE5EE',
          },
        ]}
      >
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {lessons.some((lesson) => lesson.id === draft.id) ? 'Edit Lesson' : 'New Lesson'}
        </Text>

        <View style={styles.field}>
          <Text style={[styles.fieldLabel, { color: colors.secondaryText }]}>Title</Text>
          <TextInput
            value={draft.title}
            onChangeText={(value) => updateDraftField('title', value)}
            placeholder="Food Basics - 5e A"
            placeholderTextColor="#94A3B8"
            style={[
              styles.input,
              {
                color: colors.text,
                borderColor: isDarkMode ? '#415a77' : '#DDE5EE',
                backgroundColor: isDarkMode ? '#132033' : '#fff',
              },
            ]}
          />
        </View>

        <View style={styles.field}>
          <Text style={[styles.fieldLabel, { color: colors.secondaryText }]}>Description</Text>
          <TextInput
            value={draft.description}
            onChangeText={(value) => updateDraftField('description', value)}
            placeholder="Optional description"
            placeholderTextColor="#94A3B8"
            style={[
              styles.input,
              {
                color: colors.text,
                borderColor: isDarkMode ? '#415a77' : '#DDE5EE',
                backgroundColor: isDarkMode ? '#132033' : '#fff',
              },
            ]}
          />
        </View>

        <View style={styles.fieldRow}>
          <View style={[styles.field, styles.fieldHalf]}>
            <Text style={[styles.fieldLabel, { color: colors.secondaryText }]}>Category</Text>
            <TextInput
              value={draft.category}
              onChangeText={(value) => updateDraftField('category', value)}
              placeholder="Custom"
              placeholderTextColor="#94A3B8"
              style={[
                styles.input,
                {
                  color: colors.text,
                  borderColor: isDarkMode ? '#415a77' : '#DDE5EE',
                  backgroundColor: isDarkMode ? '#132033' : '#fff',
                },
              ]}
            />
          </View>
          <View style={[styles.field, styles.fieldHalf]}>
            <Text style={[styles.fieldLabel, { color: colors.secondaryText }]}>Image URL</Text>
            <TextInput
              value={draft.imageUrl}
              onChangeText={(value) => updateDraftField('imageUrl', value)}
              placeholder="Used inside the lesson"
              placeholderTextColor="#94A3B8"
              style={[
                styles.input,
                {
                  color: colors.text,
                  borderColor: isDarkMode ? '#415a77' : '#DDE5EE',
                  backgroundColor: isDarkMode ? '#132033' : '#fff',
                },
              ]}
            />
          </View>
        </View>

        <View style={styles.wordsHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Word Pairs</Text>
          <Text style={[styles.wordsCounter, { color: colors.secondaryText }]}>
            {validWordCount} valid
          </Text>
        </View>

        <View style={styles.wordsList}>
          {draft.flashcards.map((word, index) => (
            <View key={`${draft.id}-${index}`} style={styles.wordRow}>
              <TextInput
                value={word.english}
                onChangeText={(value) => updateWord(index, 'english', value)}
                placeholder="English"
                placeholderTextColor="#94A3B8"
                style={[
                  styles.wordInput,
                  {
                    color: colors.text,
                    borderColor: isDarkMode ? '#415a77' : '#DDE5EE',
                    backgroundColor: isDarkMode ? '#132033' : '#fff',
                  },
                ]}
              />
              <TextInput
                value={word.french}
                onChangeText={(value) => updateWord(index, 'french', value)}
                placeholder="French"
                placeholderTextColor="#94A3B8"
                style={[
                  styles.wordInput,
                  {
                    color: colors.text,
                    borderColor: isDarkMode ? '#415a77' : '#DDE5EE',
                    backgroundColor: isDarkMode ? '#132033' : '#fff',
                  },
                ]}
              />
              <TouchableOpacity onPress={() => removeWordRow(index)} style={styles.removeWordButton}>
                <MaterialIcons name="delete-outline" size={20} color="#C62828" />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <TouchableOpacity onPress={addWordRow} style={styles.addRowButton}>
          <MaterialIcons name="add-circle-outline" size={20} color="#1671B6" />
          <Text style={styles.addRowButtonText}>Add word pair</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleImportPairs} style={styles.importButton}>
          <MaterialIcons name="upload-file" size={20} color="#1671B6" />
          <Text style={styles.importButtonText}>Import pairs from file</Text>
        </TouchableOpacity>

        <Text style={[styles.importHelpText, { color: colors.secondaryText }]}>
          Accepted formats: CSV, TSV, TXT, JSON. Use two columns: English, French.
        </Text>

        <View style={styles.actionRow}>
          <TouchableOpacity onPress={resetDraft} style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Reset</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSave} style={styles.primaryButton} disabled={isSaving}>
            <Text style={styles.primaryButtonText}>{isSaving ? 'Saving...' : 'Save Lesson'}</Text>
          </TouchableOpacity>
        </View>
      </View>
      )}

      {activeAdminTab === 'vocabularyLessons' && (
      <View style={styles.librarySection}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Saved Custom Lessons</Text>
        {lessons.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.emptyText, { color: colors.secondaryText }]}>No custom lessons yet.</Text>
          </View>
        ) : (
          lessons.map((lesson) => (
            <View
              key={lesson.id}
              style={[
                styles.lessonCard,
                {
                  backgroundColor: colors.card,
                  borderColor: isDarkMode ? '#415a77' : '#DDE5EE',
                },
              ]}
            >
              <View style={styles.lessonHeader}>
                <View style={styles.lessonTextBlock}>
                  <Text style={[styles.lessonTitle, { color: colors.text }]}>{lesson.title}</Text>
                  <Text style={[styles.lessonMeta, { color: colors.secondaryText }]}>
                    {lesson.category || 'Custom'} · {lesson.flashcards.length} words
                  </Text>
                </View>
                <TouchableOpacity onPress={() => handleDelete(lesson)}>
                  <MaterialIcons name="delete-outline" size={22} color="#C62828" />
                </TouchableOpacity>
              </View>

              {!!lesson.description && (
                <Text style={[styles.lessonDescription, { color: colors.secondaryText }]}>
                  {lesson.description}
                </Text>
              )}

              <View style={styles.lessonActionsRow}>
                <TouchableOpacity onPress={() => handleEdit(lesson)} style={styles.editButton}>
                  <Text style={styles.editButtonText}>Edit Lesson</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(lesson)} style={styles.deleteLessonButton}>
                  <Text style={styles.deleteLessonButtonText}>Delete Lesson</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 18,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '600',
  },
  infoCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 14,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 6,
  },
  infoText: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  exportRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 12,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#CFE2F5',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  exportButtonText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1671B6',
  },
  adminTabBar: {
    flexDirection: 'row',
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 6,
  },
  adminTabButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 10,
  },
  adminTabText: {
    fontSize: 14,
    fontWeight: '900',
  },
  chapterLinksHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 14,
  },
  chapterLinksTitleBlock: {
    flex: 1,
  },
  chapterLinksSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
    marginTop: -6,
  },
  chapterLinkList: {
    gap: 12,
  },
  chapterLevelGroup: {
    borderRadius: 14,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  chapterLevelHeader: {
    minHeight: 58,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  chapterLevelHeaderLeft: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  chapterLevelTitle: {
    fontSize: 15,
    fontWeight: '900',
  },
  chapterLevelMeta: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  chapterLevelItems: {
    gap: 10,
    padding: 10,
    paddingTop: 0,
  },
  chapterLinkRow: {
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 12,
  },
  chapterLinkMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  chapterLevelBadge: {
    minWidth: 46,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  chapterLevelBadgeText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '900',
  },
  chapterLinkTitleBlock: {
    flex: 1,
    minWidth: 0,
  },
  chapterLinkTitle: {
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 20,
  },
  chapterLinkStatus: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  chapterLinkInput: {
    fontSize: 13,
  },
  chapterLinkActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 10,
  },
  editorCard: {
    marginHorizontal: 16,
    marginBottom: 22,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '800',
    marginBottom: 12,
  },
  field: {
    marginBottom: 14,
  },
  fieldRow: {
    flexDirection: 'row',
    gap: 12,
  },
  fieldHalf: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  input: {
    minHeight: 46,
    borderRadius: 12,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    fontSize: 15,
    fontWeight: '600',
  },
  wordsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  wordsCounter: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 12,
  },
  wordsList: {
    gap: 10,
  },
  wordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  wordInput: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1.5,
    paddingHorizontal: 12,
    fontSize: 14,
    fontWeight: '600',
  },
  removeWordButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF1F1',
  },
  addRowButton: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
  },
  addRowButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1671B6',
  },
  importButton: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    backgroundColor: '#E8F4FF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  importButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1671B6',
  },
  importHelpText: {
    marginTop: 10,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  actionRow: {
    marginTop: 18,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  secondaryButton: {
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: '#EEF3F8',
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#44505C',
  },
  primaryButton: {
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: '#1671B6',
  },
  primaryButtonAttention: {
    backgroundColor: '#0F5E98',
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#fff',
  },
  librarySection: {
    paddingHorizontal: 16,
  },
  emptyCard: {
    borderRadius: 16,
    padding: 18,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '600',
  },
  lessonCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    marginBottom: 12,
  },
  lessonHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 8,
  },
  lessonTextBlock: {
    flex: 1,
  },
  lessonTitle: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 4,
  },
  lessonMeta: {
    fontSize: 13,
    fontWeight: '700',
  },
  lessonDescription: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
    marginBottom: 12,
  },
  editButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: '#E8F4FF',
  },
  editButtonText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1671B6',
  },
  lessonActionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  deleteLessonButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: '#FFF1F1',
  },
  deleteLessonButtonText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#C62828',
  },
});
