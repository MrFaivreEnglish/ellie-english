import { useEffect, useMemo, useState } from 'react';
import {
  deleteCustomVocabularyLesson,
  getCustomVocabularyLessons,
  saveCustomVocabularyLesson,
  type CustomVocabularyLesson,
} from '../customLessonStorage';
import { vocabularyCategories } from '../../../content/lessons/vocabularyRegistry';
import {
  type EditableWord,
  createEmptyDraft,
  emptyWord,
  exportableLesson,
  parseImportedPairs,
} from './lessonDraftUtils';
import { copyTextToClipboard, pickTextFile } from './webClipboardFile';
import { confirmDestructive, notify } from './adminDialogs';
import type { MaterialIconName, ValidationTone } from './adminSharedTypes';

export function useVocabularyLessonsAdmin() {
  const [isLoading, setIsLoading] = useState(true);
  const [lessons, setLessons] = useState<CustomVocabularyLesson[]>([]);
  const [draft, setDraft] = useState(createEmptyDraft());
  const [isSaving, setIsSaving] = useState(false);
  const [isPickingNewCategory, setIsPickingNewCategory] = useState(false);

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
  const vocabularyCategoryTitles = useMemo(() => {
    const titles = vocabularyCategories.map((category) => category.title);
    return titles.includes('Custom') ? titles : [...titles, 'Custom'];
  }, []);
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
  const isEditingExistingLesson = lessons.some((lesson) => lesson.id === draft.id);
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

  const loadLessons = async () => {
    setIsLoading(true);
    try {
      const nextLessons = await getCustomVocabularyLessons();
      setLessons(nextLessons);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadLessons();
  }, []);

  const resetDraft = () => {
    setDraft(createEmptyDraft());
    setIsPickingNewCategory(false);
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
        notify('Import failed', 'No English/French pairs were found in that file.');
        return;
      }

      setDraft((current) => ({
        ...current,
        flashcards: importedPairs,
      }));

      notify('Import complete', `${importedPairs.length} word pairs loaded.`);
    } catch {
      notify('Import failed', 'Could not read that file. Use CSV, TSV, TXT, or JSON.');
    }
  };

  const handleSave = async () => {
    if (!draft.title.trim()) {
      notify('Missing title', 'Give the lesson a title first.');
      return;
    }

    if (validWordCount === 0) {
      notify('No words', 'Add at least one English/French pair.');
      return;
    }

    if (hasInvalidImageUrl) {
      notify('Invalid image URL', 'Image URLs must start with http:// or https://.');
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
      notify('Nothing to export', 'Save or complete the lesson first.');
      return;
    }

    if (hasInvalidImageUrl) {
      notify('Invalid image URL', 'Image URLs must start with http:// or https://.');
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
    notify('Copied', 'Current lesson JSON copied to clipboard.');
  };

  const handleCopyAllLessonsJson = async () => {
    const payload = lessons.map(exportableLesson);
    await copyTextToClipboard(JSON.stringify(payload, null, 2));
    notify(
      'Copied',
      'Bundled lessons JSON copied to clipboard. Paste it into content/lessons/customVocabularyLessons.json before building.'
    );
  };

  const handleEdit = (lesson: CustomVocabularyLesson) => {
    const category = lesson.category ?? 'Custom';
    setDraft({
      id: lesson.id,
      title: lesson.title,
      description: lesson.description ?? '',
      imageUrl: lesson.imageUrl ?? '',
      category,
      flashcards: lesson.flashcards.length ? lesson.flashcards : [emptyWord()],
      createdAt: lesson.createdAt,
    });
    setIsPickingNewCategory(!vocabularyCategoryTitles.includes(category));
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

  return {
    isLoading,
    lessons,
    draft,
    isSaving,
    isPickingNewCategory,
    setIsPickingNewCategory,
    validWordCount,
    incompleteWordCount,
    duplicateWordCount,
    vocabularyCategoryTitles,
    hasInvalidImageUrl,
    hasLessonDraft,
    lessonValidationItems,
    previewWordPairs,
    isEditingExistingLesson,
    canSaveLesson,
    loadLessons,
    resetDraft,
    handleResetDraftPress,
    updateDraftField,
    updateWord,
    addWordRow,
    removeWordRow,
    handleImportPairs,
    handleSave,
    handleCopyCurrentLessonJson,
    handleCopyAllLessonsJson,
    handleEdit,
    handleDelete,
  };
}
