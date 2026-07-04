import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BackButton from '../shared/BackButton';
import { useTheme } from '../settings/ThemeContext';
import {
  deleteCustomVocabularyLesson,
  getCustomVocabularyLessons,
  saveCustomVocabularyLesson,
  type CustomVocabularyLesson,
} from './customLessonStorage';
import { lessonCategories as chapterCategories } from '../../content/lessons/chapterData';
import {
  deleteCustomChapterLinkOverride,
  getCustomChapterLinkOverrides,
  makeChapterLinkOverrideId,
  normalizeChapterLinkOverrides,
  saveCustomChapterLinkOverride,
  type ChapterLinkOverride,
} from './chapterLinkStorage';
import { getXP } from '../progress/xpStorage';
import { clearLocalStudentProgress } from '../progress/studentProgressStorage';
import { getGrammarProgressSummary } from '../grammar/grammarProgressStorage';
import { getLearnedFlashcardSummary } from '../vocabulary/flashcardProgressStorage';
import { getVocabularyTimerBests } from '../vocabulary/vocabularyTimerStorage';

const bundledCustomChapterLinks = require('../../content/lessons/customChapterLinks.json') as any[];
const packageInfo = require('../../package.json') as { version?: string };
type MaterialIconName = React.ComponentProps<typeof MaterialIcons>['name'];

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

type ValidationTone = 'success' | 'warning' | 'error' | 'neutral';
type AdminTab = 'chapterLinks' | 'vocabularyLessons' | 'qa';

type QaSnapshot = {
  xp: number;
  learnedWords: number;
  learnedLessons: number;
  grammarAnswers: number;
  grammarLessons: number;
  timerBestCount: number;
};

const emptyQaSnapshot: QaSnapshot = {
  xp: 0,
  learnedWords: 0,
  learnedLessons: 0,
  grammarAnswers: 0,
  grammarLessons: 0,
  timerBestCount: 0,
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

const copyTextToClipboard = async (text: string) => {
  if (Platform.OS !== 'web' || typeof document === 'undefined') {
    throw new Error('Clipboard export is only available on web.');
  }

  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.position = 'fixed';
  textArea.style.opacity = '0';
  textArea.style.pointerEvents = 'none';
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();

  try {
    document.execCommand('copy');
  } finally {
    document.body.removeChild(textArea);
  }
};

const pickTextFile = async (): Promise<{ contents: string; name?: string } | null> => {
  if (Platform.OS !== 'web' || typeof document === 'undefined') {
    Alert.alert('Import unavailable', 'File import is only available in the web admin tool.');
    return null;
  }

  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,.txt,.csv,text/plain,text/csv,application/json';
    input.style.display = 'none';

    const cleanup = () => {
      if (input.parentNode) input.parentNode.removeChild(input);
    };

    input.addEventListener('change', async () => {
      const file = input.files?.[0];
      cleanup();

      if (!file) {
        resolve(null);
        return;
      }

      try {
        resolve({
          contents: await file.text(),
          name: file.name,
        });
      } catch {
        resolve(null);
      }
    }, { once: true });

    document.body.appendChild(input);
    input.click();
  });
};

export default function AdminLessonPreviewScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { colors, isDarkMode } = useTheme();
  const isWideLayout = width >= 820;
  const [activeAdminTab, setActiveAdminTab] = useState<AdminTab>('chapterLinks');
  const [lessons, setLessons] = useState<CustomVocabularyLesson[]>([]);
  const [draft, setDraft] = useState(createEmptyDraft());
  const [isSaving, setIsSaving] = useState(false);
  const [qaSnapshot, setQaSnapshot] = useState<QaSnapshot>(emptyQaSnapshot);
  const [qaMessage, setQaMessage] = useState('');
  const [editingChapterLinkIds, setEditingChapterLinkIds] = useState<Record<string, boolean>>({});
  const [expandedChapterLevels, setExpandedChapterLevels] = useState<Record<string, boolean>>({
    '6e': false,
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
  const getPublishedChapterUrl = (item: EditableChapterLink) =>
    bundledChapterLinkOverrideMap.get(item.id)?.url ?? item.defaultUrl;

  const getPublishedChapterTitle = (item: EditableChapterLink) =>
    bundledChapterLinkOverrideMap.get(item.id)?.displayTitle ?? item.defaultTitle;

  const validWordCount = useMemo(
    () => draft.flashcards.filter((word) => word.english.trim() && word.french.trim()).length,
    [draft.flashcards]
  );
  const incompleteWordCount = useMemo(
    () => draft.flashcards.filter((word) => {
      const english = word.english.trim();
      const french = word.french.trim();
      return (english || french) && (!english || !french);
    }).length,
    [draft.flashcards]
  );
  const duplicateWordCount = useMemo(() => {
    const seen = new Set<string>();
    let duplicates = 0;

    draft.flashcards.forEach((word) => {
      const english = word.english.trim().toLowerCase();
      const french = word.french.trim().toLowerCase();
      if (!english || !french) return;

      const key = `${english}::${french}`;
      if (seen.has(key)) {
        duplicates += 1;
        return;
      }

      seen.add(key);
    });

    return duplicates;
  }, [draft.flashcards]);
  const hasInvalidImageUrl = useMemo(() => {
    const imageUrl = draft.imageUrl.trim();
    return !!imageUrl && !/^https?:\/\//i.test(imageUrl);
  }, [draft.imageUrl]);
  const hasLessonDraft = useMemo(
    () =>
      lessons.some((lesson) => lesson.id === draft.id) ||
      !!draft.title.trim() ||
      !!draft.description.trim() ||
      !!draft.imageUrl.trim() ||
      (draft.category.trim() && draft.category.trim() !== 'Custom') ||
      draft.flashcards.some((word) => word.english.trim() || word.french.trim()),
    [draft, lessons]
  );
  const unsavedChapterLinkCount = useMemo(
    () =>
      chapterLinkItems.filter((item) => {
        const publishedTitle = getPublishedChapterTitle(item);
        const publishedUrl = getPublishedChapterUrl(item);
        const effectiveOverride = chapterLinkOverrideMap.get(item.id);
        const currentDraft = chapterLinkDrafts[item.id] ?? {
          displayTitle: publishedTitle,
          url: publishedUrl,
        };
        const effectiveTitle = effectiveOverride?.displayTitle ?? item.defaultTitle;
        const effectiveUrl = effectiveOverride?.url ?? item.defaultUrl;

        return (
          currentDraft.displayTitle.trim() !== effectiveTitle ||
          currentDraft.url.trim() !== effectiveUrl
        );
      }).length,
    [chapterLinkDrafts, chapterLinkItems, chapterLinkOverrideMap, bundledChapterLinkOverrideMap]
  );
  const isEditingExistingLesson = lessons.some((lesson) => lesson.id === draft.id);
  const buildChangeCount = chapterLinkOverrides.length + lessons.length;
  const openDraftCount = hasLessonDraft ? 1 : 0;
  const canSaveLesson = !!draft.title.trim() && validWordCount > 0 && !hasInvalidImageUrl;
  const lessonValidationItems = useMemo<Array<{
    tone: ValidationTone;
    icon: MaterialIconName;
    text: string;
  }>>(() => {
    const items: Array<{ tone: ValidationTone; icon: MaterialIconName; text: string }> = [];

    if (!draft.title.trim()) {
      items.push({ tone: 'error', icon: 'error-outline', text: 'Title required before saving.' });
    }

    if (validWordCount === 0) {
      items.push({ tone: 'error', icon: 'error-outline', text: 'Add at least one complete word pair.' });
    }

    if (hasInvalidImageUrl) {
      items.push({ tone: 'error', icon: 'link-off', text: 'Image URL must start with http:// or https://.' });
    }

    if (incompleteWordCount > 0) {
      items.push({
        tone: 'warning',
        icon: 'warning-amber',
        text: `${incompleteWordCount} incomplete row${incompleteWordCount === 1 ? '' : 's'} will not be saved.`,
      });
    }

    if (duplicateWordCount > 0) {
      items.push({
        tone: 'warning',
        icon: 'content-copy',
        text: `${duplicateWordCount} duplicate pair${duplicateWordCount === 1 ? '' : 's'} found.`,
      });
    }

    if (items.length === 0) {
      items.push({ tone: 'success', icon: 'check-circle', text: 'Ready to save locally.' });
    }

    return items;
  }, [draft.title, duplicateWordCount, hasInvalidImageUrl, incompleteWordCount, validWordCount]);
  const previewWordPairs = useMemo(
    () => draft.flashcards
      .filter((word) => word.english.trim() && word.french.trim())
      .slice(0, 2),
    [draft.flashcards]
  );

  const loadQaSnapshot = async () => {
    const [xp, learnedSummary, grammarSummary, timerBests] = await Promise.all([
      getXP(),
      getLearnedFlashcardSummary(),
      getGrammarProgressSummary(),
      getVocabularyTimerBests(),
    ]);

    setQaSnapshot({
      xp,
      learnedWords: learnedSummary.totalLearned,
      learnedLessons: learnedSummary.lessonCount,
      grammarAnswers: grammarSummary.totalCorrectAnswers,
      grammarLessons: grammarSummary.lessonCount,
      timerBestCount: Object.keys(timerBests).length,
    });
  };

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
    void loadQaSnapshot();
  }, []);

  const resetDraft = () => {
    setDraft(createEmptyDraft());
  };

  const confirmDestructive = (
    title: string,
    message: string,
    onConfirm: () => void | Promise<void>
  ) => {
    if (Platform.OS === 'web') {
      const confirmed = typeof window !== 'undefined'
        ? window.confirm(`${title}\n\n${message}`)
        : true;

      if (confirmed) void onConfirm();
      return;
    }

    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Continue',
        style: 'destructive',
        onPress: () => {
          void onConfirm();
        },
      },
    ]);
  };

  const handleClearLocalProgress = () => {
    confirmDestructive(
      'Clear local progress',
      'Clear XP, learnt words, grammar answers, timer records, and Shiny Ellie progress on this device?',
      async () => {
        await clearLocalStudentProgress();
        await loadQaSnapshot();
        setQaMessage('Local student progress cleared.');
      }
    );
  };

  const handleResetDraftPress = () => {
    if (!hasLessonDraft) {
      resetDraft();
      return;
    }

    confirmDestructive(
      'Reset draft',
      'Clear the lesson currently open in the editor?',
      resetDraft
    );
  };

  const toggleChapterLinkEditor = (id: string) => {
    setEditingChapterLinkIds((current) => ({
      ...current,
      [id]: !current[id],
    }));
  };

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
      setEditingChapterLinkIds((current) => ({ ...current, [item.id]: false }));
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
    setEditingChapterLinkIds((current) => ({ ...current, [item.id]: false }));
    Alert.alert('Saved', 'This chapter title and link have been updated on this device.');
  };

  const handleResetChapterLink = (item: EditableChapterLink) => {
    const resetLink = async () => {
      const publishedTitle = getPublishedChapterTitle(item);
      const publishedUrl = getPublishedChapterUrl(item);
      const nextOverrides = await deleteCustomChapterLinkOverride(item.id);
      setChapterLinkOverrides(nextOverrides);
      setChapterLinkDrafts((current) => ({
        ...current,
        [item.id]: { displayTitle: publishedTitle, url: publishedUrl },
      }));
      setEditingChapterLinkIds((current) => ({ ...current, [item.id]: false }));
    };

    confirmDestructive(
      'Reset link',
      'Restore the published title and link for this chapter?',
      resetLink
    );
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

    await copyTextToClipboard(JSON.stringify(payload, null, 2));
    Alert.alert(
      'Copied',
      'Chapter link JSON copied to clipboard. Paste it into content/lessons/customChapterLinks.json before building.'
    );
  };

  const handleCopyBuildJson = async () => {
    if (buildChangeCount === 0) {
      Alert.alert('No local changes', 'There are no custom links or lessons to export yet.');
      return;
    }

    const payload = {
      customChapterLinks: chapterLinkOverrides.map((override) => ({
        id: override.id,
        categoryTitle: override.categoryTitle,
        lessonTitle: override.lessonTitle,
        displayTitle: override.displayTitle,
        url: override.url,
      })),
      customVocabularyLessons: lessons.map(exportableLesson),
    };

    await copyTextToClipboard(JSON.stringify(payload, null, 2));
    Alert.alert(
      'Copied',
      'Build bundle copied. Use customChapterLinks for content/lessons/customChapterLinks.json and customVocabularyLessons for content/lessons/customVocabularyLessons.json.'
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
      const file = await pickTextFile();
      if (!file) return;

      const importedPairs = parseImportedPairs(file.contents, file.name);

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

    if (hasInvalidImageUrl) {
      Alert.alert('Invalid image URL', 'Image URLs must start with http:// or https://.');
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

    if (hasInvalidImageUrl) {
      Alert.alert('Invalid image URL', 'Image URLs must start with http:// or https://.');
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

    await copyTextToClipboard(json);
    Alert.alert('Copied', 'Current lesson JSON copied to clipboard.');
  };

  const handleCopyAllLessonsJson = async () => {
    const payload = lessons.map(exportableLesson);
    await copyTextToClipboard(JSON.stringify(payload, null, 2));
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

    confirmDestructive(
      'Delete lesson',
      `Delete "${lesson.title}"? This only removes the local draft on this device.`,
      deleteLesson
    );
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingTop: insets.top, paddingBottom: insets.bottom + 28 }}
    >
      <BackButton label="Back to Settings" onPress={() => navigation.goBack()} />

      <View style={styles.header}>
        <Text style={[styles.eyebrow, { color: colors.secondaryText }]}>Admin Tools</Text>
        <Text style={[styles.title, { color: colors.text }]}>Content Studio</Text>
        <Text style={[styles.subtitle, { color: colors.secondaryText }]}>
          Manage local chapter links and vocabulary lesson drafts before publishing them in the build.
        </Text>
      </View>

      <View
        style={[
          styles.statusCard,
          {
            backgroundColor: colors.card,
            borderColor: isDarkMode ? colors.border : 'rgba(31,41,55,0.10)',
          },
        ]}
      >
        <View style={styles.statusHeaderRow}>
          <View style={styles.statusTitleBlock}>
            <Text style={[styles.statusTitle, { color: colors.text }]}>Workspace Status</Text>
            <Text style={[styles.statusSubtitle, { color: colors.secondaryText }]}>
              Local changes stay on this device until copied into the build files.
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleCopyBuildJson}
            disabled={buildChangeCount === 0}
            style={[
              styles.buildBundleButton,
              buildChangeCount === 0 && styles.disabledButton,
            ]}
          >
            <MaterialIcons name="ios-share" size={18} color="#fff" />
            <Text style={styles.buildBundleButtonText}>Copy Build Bundle</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statusGrid}>
          <View style={[styles.statusMetric, { backgroundColor: isDarkMode ? colors.surface : '#F6F7F9' }]}>
            <MaterialIcons name="link" size={20} color="#1671B6" />
            <View>
              <Text style={[styles.statusMetricValue, { color: colors.text }]}>
                {chapterLinkOverrides.length}
              </Text>
              <Text style={[styles.statusMetricLabel, { color: colors.secondaryText }]}>Custom links</Text>
            </View>
          </View>
          <View style={[styles.statusMetric, { backgroundColor: isDarkMode ? colors.surface : '#F6F7F9' }]}>
            <MaterialIcons name="library-books" size={20} color="#1671B6" />
            <View>
              <Text style={[styles.statusMetricValue, { color: colors.text }]}>{lessons.length}</Text>
              <Text style={[styles.statusMetricLabel, { color: colors.secondaryText }]}>Custom lessons</Text>
            </View>
          </View>
          <View style={[styles.statusMetric, { backgroundColor: isDarkMode ? colors.surface : '#F6F7F9' }]}>
            <MaterialIcons name="edit-note" size={22} color="#D97706" />
            <View>
              <Text style={[styles.statusMetricValue, { color: colors.text }]}>
                {unsavedChapterLinkCount + openDraftCount}
              </Text>
              <Text style={[styles.statusMetricLabel, { color: colors.secondaryText }]}>Open edits</Text>
            </View>
          </View>
        </View>
      </View>

      <View
        style={[
          styles.adminTabBar,
          {
            backgroundColor: isDarkMode ? colors.card : '#F6F9FC',
            borderColor: isDarkMode ? colors.border : '#DDE5EE',
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => setActiveAdminTab('chapterLinks')}
          style={[
            styles.adminTabButton,
            activeAdminTab === 'chapterLinks' && { backgroundColor: colors.buttonBackground },
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
            activeAdminTab === 'vocabularyLessons' && { backgroundColor: colors.buttonBackground },
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
            Vocabulary
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveAdminTab('qa')}
          style={[
            styles.adminTabButton,
            activeAdminTab === 'qa' && { backgroundColor: colors.buttonBackground },
          ]}
          accessibilityRole="button"
          accessibilityState={{ selected: activeAdminTab === 'qa' }}
        >
          <MaterialIcons
            name="bug-report"
            size={18}
            color={activeAdminTab === 'qa' ? colors.buttonText : colors.primary}
          />
          <Text
            style={[
              styles.adminTabText,
              { color: activeAdminTab === 'qa' ? colors.buttonText : colors.primary },
            ]}
          >
            QA
          </Text>
        </TouchableOpacity>
      </View>

      {activeAdminTab === 'qa' && (
        <View
          style={[
            styles.editorCard,
            {
              backgroundColor: colors.card,
              borderColor: isDarkMode ? colors.border : 'rgba(31,41,55,0.10)',
            },
          ]}
        >
          <View style={styles.sectionHeaderRow}>
            <View style={styles.chapterLinksTitleBlock}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>QA Snapshot</Text>
              <Text style={[styles.chapterLinksSubtitle, { color: colors.secondaryText }]}>
                Quick diagnostics for builds, theme checks, and saved-progress testing.
              </Text>
            </View>
            <TouchableOpacity onPress={loadQaSnapshot} style={styles.exportButton}>
              <MaterialIcons name="refresh" size={18} color="#1671B6" />
              <Text style={styles.exportButtonText}>Refresh</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.qaGrid}>
            {[
              ['Version', packageInfo.version ?? 'unknown'],
              ['Platform', Platform.OS],
              ['Theme', isDarkMode ? 'Dark' : 'Light'],
              ['Width', `${Math.round(width)} px`],
              ['XP', String(qaSnapshot.xp)],
              ['Learnt words', `${qaSnapshot.learnedWords} / ${qaSnapshot.learnedLessons} lessons`],
              ['Grammar answers', `${qaSnapshot.grammarAnswers} / ${qaSnapshot.grammarLessons} lessons`],
              ['Timer records', String(qaSnapshot.timerBestCount)],
              ['Custom links', String(chapterLinkOverrides.length)],
              ['Custom vocab lessons', String(lessons.length)],
              ['Open edits', String(unsavedChapterLinkCount + openDraftCount)],
            ].map(([label, value]) => (
              <View
                key={label}
                style={[
                  styles.qaMetric,
                  {
                    backgroundColor: isDarkMode ? colors.surface : '#F6F7F9',
                    borderColor: isDarkMode ? colors.border : '#E2E8F0',
                  },
                ]}
              >
                <Text style={[styles.qaMetricLabel, { color: colors.secondaryText }]}>{label}</Text>
                <Text style={[styles.qaMetricValue, { color: colors.text }]}>{value}</Text>
              </View>
            ))}
          </View>

          {!!qaMessage && (
            <Text style={[styles.qaMessage, { color: colors.success }]}>{qaMessage}</Text>
          )}

          <View style={styles.qaActionRow}>
            <TouchableOpacity onPress={loadQaSnapshot} style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>Reload Counts</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleClearLocalProgress} style={styles.deleteLessonButton}>
              <Text style={styles.deleteLessonButtonText}>Clear Local Progress</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {activeAdminTab === 'chapterLinks' && (
      <View
        style={[
          styles.editorCard,
          {
            backgroundColor: colors.card,
            borderColor: isDarkMode ? colors.border : 'rgba(31,41,55,0.10)',
          },
        ]}
      >
        <View style={styles.sectionHeaderRow}>
          <View style={styles.chapterLinksTitleBlock}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Chapter Links</Text>
            <Text style={[styles.chapterLinksSubtitle, { color: colors.secondaryText }]}>
              Edit only the chapters that need a custom Digipad title or URL.
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
                    backgroundColor: isDarkMode ? colors.surface : '#F6F7F9',
                    borderColor: isDarkMode ? colors.border : 'rgba(31,41,55,0.10)',
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
                        {group.items.length} links{localOverrideCount > 0 ? ` - ${localOverrideCount} custom` : ''}
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
                      const isEditingRow = editingChapterLinkIds[item.id] || hasUnsavedChange;
                      const statusLabel = hasUnsavedChange
                        ? 'Unsaved'
                        : hasLocalOverride
                          ? 'Custom'
                          : 'Published';
                      const statusColor = hasUnsavedChange
                        ? '#B45309'
                        : hasLocalOverride
                          ? '#1671B6'
                          : '#4B5563';
                      const statusBackground = hasUnsavedChange
                        ? '#FEF3C7'
                        : hasLocalOverride
                          ? '#E8F4FF'
                          : '#EEF2F6';

                      return (
                        <View
                          key={item.id}
                          style={[
                            styles.chapterLinkRow,
                            {
                              backgroundColor: isDarkMode ? colors.card : '#FFFFFF',
                              borderColor: isDarkMode ? colors.border : 'rgba(31,41,55,0.10)',
                            },
                          ]}
                        >
                          <View style={styles.chapterLinkSummaryRow}>
                            <View style={styles.chapterLinkSummaryLeft}>
                              <View style={[styles.chapterLevelBadge, { backgroundColor: item.color }]}>
                                <Text style={styles.chapterLevelBadgeText}>{item.categoryTitle}</Text>
                              </View>
                              <View style={styles.chapterLinkTitleBlock}>
                                <Text style={[styles.chapterLinkTitle, { color: colors.text }]} numberOfLines={1}>
                                  {effectiveTitle}
                                </Text>
                                <Text style={[styles.chapterLinkStatus, { color: colors.secondaryText }]} numberOfLines={1}>
                                  {currentDraft.url.trim() || effectiveUrl}
                                </Text>
                              </View>
                            </View>

                            <View style={styles.chapterLinkSummaryActions}>
                              <View style={[styles.statusChip, { backgroundColor: statusBackground }]}>
                                <Text style={[styles.statusChipText, { color: statusColor }]}>{statusLabel}</Text>
                              </View>
                              <TouchableOpacity
                                onPress={() => toggleChapterLinkEditor(item.id)}
                                style={styles.inlineEditButton}
                              >
                                <MaterialIcons
                                  name={isEditingRow ? 'expand-less' : 'edit'}
                                  size={18}
                                  color="#1671B6"
                                />
                                <Text style={styles.inlineEditButtonText}>
                                  {isEditingRow ? 'Close' : 'Edit'}
                                </Text>
                              </TouchableOpacity>
                            </View>
                          </View>

                          {isEditingRow && (
                            <View style={styles.chapterLinkEditorPanel}>
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
                                      borderColor: isDarkMode ? colors.borderStrong : '#DDE5EE',
                                      backgroundColor: isDarkMode ? colors.card : '#fff',
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
                                      borderColor: isDarkMode ? colors.borderStrong : '#DDE5EE',
                                      backgroundColor: isDarkMode ? colors.card : '#fff',
                                    },
                                  ]}
                                />
                              </View>

                              <View style={styles.chapterLinkActionsRow}>
                                <TouchableOpacity
                                  onPress={() => handleResetChapterLink(item)}
                                  disabled={!hasUnsavedChange && !hasLocalOverride}
                                  style={[
                                    styles.secondaryButton,
                                    !hasUnsavedChange && !hasLocalOverride && styles.disabledSecondaryButton,
                                  ]}
                                >
                                  <Text style={styles.secondaryButtonText}>Reset</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                  onPress={() => handleSaveChapterLink(item)}
                                  disabled={!hasUnsavedChange}
                                  style={[
                                    styles.primaryButton,
                                    hasUnsavedChange && styles.primaryButtonAttention,
                                    !hasUnsavedChange && styles.disabledButton,
                                  ]}
                                >
                                  <Text style={styles.primaryButtonText}>Save Link</Text>
                                </TouchableOpacity>
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
        </View>
      </View>
      )}

      {activeAdminTab === 'vocabularyLessons' && (
        <View
          style={[
            styles.editorCard,
            {
              backgroundColor: colors.card,
              borderColor: isDarkMode ? colors.border : 'rgba(31,41,55,0.10)',
            },
          ]}
        >
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {isEditingExistingLesson ? 'Edit Lesson' : 'New Lesson'}
              </Text>
              <Text style={[styles.chapterLinksSubtitle, { color: colors.secondaryText }]}>
                Save locally first, test in the app, then export for the build.
              </Text>
            </View>
            <View style={styles.exportRowCompact}>
              <TouchableOpacity onPress={handleCopyCurrentLessonJson} style={styles.exportButton}>
                <MaterialIcons name="content-copy" size={18} color="#1671B6" />
                <Text style={styles.exportButtonText}>Copy Draft</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleCopyAllLessonsJson} style={styles.exportButton}>
                <MaterialIcons name="inventory-2" size={18} color="#1671B6" />
                <Text style={styles.exportButtonText}>Copy Lessons</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={[styles.lessonEditorGrid, isWideLayout && styles.lessonEditorGridWide]}>
            <View style={[styles.lessonDetailsColumn, isWideLayout && styles.lessonDetailsColumnWide]}>
              <View
                style={[
                  styles.previewCard,
                  {
                    backgroundColor: isDarkMode ? colors.surface : '#F6F7F9',
                    borderColor: isDarkMode ? colors.border : 'rgba(31,41,55,0.10)',
                  },
                ]}
              >
                <View style={styles.previewHeaderRow}>
                  <View style={styles.previewIcon}>
                    <MaterialIcons name="style" size={20} color="#1671B6" />
                  </View>
                  <View style={styles.previewTitleBlock}>
                    <Text style={[styles.previewTitle, { color: colors.text }]} numberOfLines={1}>
                      {draft.title.trim() || 'Untitled lesson'}
                    </Text>
                    <Text style={[styles.previewMeta, { color: colors.secondaryText }]}>
                      {(draft.category.trim() || 'Custom')} - {validWordCount} words
                    </Text>
                  </View>
                </View>

                {previewWordPairs.length > 0 ? (
                  <View style={styles.previewWords}>
                    {previewWordPairs.map((word, index) => (
                      <View key={`${word.english}-${word.french}-${index}`} style={styles.previewWordRow}>
                        <Text style={[styles.previewWordText, { color: colors.text }]} numberOfLines={1}>
                          {word.english.trim()}
                        </Text>
                        <MaterialIcons name="arrow-forward" size={14} color={colors.secondaryText} />
                        <Text style={[styles.previewWordText, { color: colors.text }]} numberOfLines={1}>
                          {word.french.trim()}
                        </Text>
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text style={[styles.previewEmptyText, { color: colors.secondaryText }]}>
                    Add word pairs to preview the lesson.
                  </Text>
                )}
              </View>

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
                      borderColor: isDarkMode ? colors.borderStrong : '#DDE5EE',
                      backgroundColor: isDarkMode ? colors.surface : '#fff',
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
                      borderColor: isDarkMode ? colors.borderStrong : '#DDE5EE',
                      backgroundColor: isDarkMode ? colors.surface : '#fff',
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
                        borderColor: isDarkMode ? colors.borderStrong : '#DDE5EE',
                        backgroundColor: isDarkMode ? colors.surface : '#fff',
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
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={[
                      styles.input,
                      {
                        color: colors.text,
                        borderColor: isDarkMode ? colors.borderStrong : '#DDE5EE',
                        backgroundColor: isDarkMode ? colors.surface : '#fff',
                      },
                    ]}
                  />
                </View>
              </View>

              <View style={styles.validationPanel}>
                {lessonValidationItems.map((item) => {
                  const toneColor = item.tone === 'success'
                    ? '#15803D'
                    : item.tone === 'warning'
                      ? '#B45309'
                      : item.tone === 'error'
                        ? '#C62828'
                        : '#4B5563';
                  const toneBackground = item.tone === 'success'
                    ? '#ECFDF3'
                    : item.tone === 'warning'
                      ? '#FEF3C7'
                      : item.tone === 'error'
                        ? '#FFF1F1'
                        : '#EEF2F6';

                  return (
                    <View key={item.text} style={[styles.validationRow, { backgroundColor: toneBackground }]}>
                      <MaterialIcons name={item.icon} size={17} color={toneColor} />
                      <Text style={[styles.validationText, { color: toneColor }]}>{item.text}</Text>
                    </View>
                  );
                })}
              </View>

              <View style={styles.actionRow}>
                <TouchableOpacity onPress={handleResetDraftPress} style={styles.secondaryButton}>
                  <Text style={styles.secondaryButtonText}>Reset</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSave}
                  style={[styles.primaryButton, (!canSaveLesson || isSaving) && styles.disabledButton]}
                  disabled={!canSaveLesson || isSaving}
                >
                  <Text style={styles.primaryButtonText}>{isSaving ? 'Saving...' : 'Save Locally'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={[styles.wordsColumn, isWideLayout && styles.wordsColumnWide]}>
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
                          borderColor: isDarkMode ? colors.borderStrong : '#DDE5EE',
                          backgroundColor: isDarkMode ? colors.surface : '#fff',
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
                          borderColor: isDarkMode ? colors.borderStrong : '#DDE5EE',
                          backgroundColor: isDarkMode ? colors.surface : '#fff',
                        },
                      ]}
                    />
                    <TouchableOpacity onPress={() => removeWordRow(index)} style={styles.removeWordButton}>
                      <MaterialIcons name="delete-outline" size={20} color="#C62828" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>

              <View style={styles.wordActionRow}>
                <TouchableOpacity onPress={addWordRow} style={styles.addRowButton}>
                  <MaterialIcons name="add-circle-outline" size={20} color="#1671B6" />
                  <Text style={styles.addRowButtonText}>Add Pair</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={handleImportPairs} style={styles.importButton}>
                  <MaterialIcons name="upload-file" size={20} color="#1671B6" />
                  <Text style={styles.importButtonText}>Import File</Text>
                </TouchableOpacity>
              </View>

              <Text style={[styles.importHelpText, { color: colors.secondaryText }]}>
                CSV, TSV, TXT, or JSON with two columns: English, French.
              </Text>
            </View>
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
                  borderColor: isDarkMode ? colors.border : '#DDE5EE',
                },
              ]}
            >
              <View style={styles.lessonHeader}>
                <View style={styles.lessonTextBlock}>
                  <Text style={[styles.lessonTitle, { color: colors.text }]}>{lesson.title}</Text>
                  <Text style={[styles.lessonMeta, { color: colors.secondaryText }]}>
                    {lesson.category || 'Custom'} - {lesson.flashcards.length} words
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
  statusCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 14,
  },
  statusHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 14,
  },
  statusTitleBlock: {
    flex: 1,
    minWidth: 0,
  },
  statusTitle: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 4,
  },
  statusSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  buildBundleButton: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1671B6',
    borderRadius: 12,
    paddingHorizontal: 13,
    paddingVertical: 9,
  },
  buildBundleButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statusMetric: {
    minWidth: 138,
    flex: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statusMetricValue: {
    fontSize: 18,
    fontWeight: '900',
    lineHeight: 22,
  },
  statusMetricLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 1,
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
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 14,
  },
  exportRowCompact: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: 8,
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
  chapterLinkSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  chapterLinkSummaryLeft: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  chapterLinkSummaryActions: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
    gap: 8,
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
  statusChip: {
    minHeight: 26,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  statusChipText: {
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  inlineEditButton: {
    minHeight: 34,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 10,
    backgroundColor: '#E8F4FF',
    paddingHorizontal: 10,
  },
  inlineEditButtonText: {
    color: '#1671B6',
    fontSize: 12,
    fontWeight: '900',
  },
  chapterLinkEditorPanel: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(148,163,184,0.35)',
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
  lessonEditorGrid: {
    gap: 18,
  },
  lessonEditorGridWide: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  lessonDetailsColumn: {
    gap: 0,
  },
  lessonDetailsColumnWide: {
    flex: 0.95,
    minWidth: 0,
  },
  wordsColumn: {
    gap: 0,
  },
  wordsColumnWide: {
    flex: 1.15,
    minWidth: 0,
  },
  previewCard: {
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
  },
  previewHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  previewIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#E8F4FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewTitleBlock: {
    flex: 1,
    minWidth: 0,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '900',
    lineHeight: 20,
  },
  previewMeta: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  previewWords: {
    marginTop: 12,
    gap: 8,
  },
  previewWordRow: {
    minHeight: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(22,113,182,0.08)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
  },
  previewWordText: {
    flex: 1,
    minWidth: 0,
    fontSize: 13,
    fontWeight: '800',
  },
  previewEmptyText: {
    marginTop: 12,
    fontSize: 13,
    fontWeight: '700',
  },
  validationPanel: {
    gap: 8,
    marginTop: -2,
  },
  validationRow: {
    minHeight: 34,
    borderRadius: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  validationText: {
    flex: 1,
    minWidth: 0,
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 16,
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
  wordActionRow: {
    marginTop: 14,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 10,
  },
  addRowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    backgroundColor: '#E8F4FF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  addRowButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1671B6',
  },
  importButton: {
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
  qaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  qaMetric: {
    flexGrow: 1,
    flexBasis: 180,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  qaMetricLabel: {
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 5,
    textTransform: 'uppercase',
  },
  qaMetricValue: {
    fontSize: 17,
    fontWeight: '800',
  },
  qaMessage: {
    marginTop: 14,
    fontSize: 13,
    fontWeight: '800',
  },
  qaActionRow: {
    marginTop: 18,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: 10,
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
  disabledSecondaryButton: {
    opacity: 0.45,
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
  disabledButton: {
    opacity: 0.45,
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
