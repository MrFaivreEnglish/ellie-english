import { useEffect, useMemo, useState } from 'react';
import { lessonCategories as chapterCategories } from '../../../content/lessons/chapterData';
import { resolveChapterAppLink } from '../../../content/lessons/appLessonRegistry';
import {
  deleteCustomChapter,
  getCustomChapters,
  saveCustomChapter,
  type CustomChapter,
} from '../customChapterStorage';
import type { CustomVocabularyLesson } from '../customLessonStorage';
import { confirmDestructive, notify } from './adminDialogs';

export type CustomChapterDraft = {
  id: string;
  categoryTitle: string;
  categoryIcon: string;
  categoryColor: string;
  title: string;
  url: string;
  linkMode: 'url' | 'app';
  appLinkTarget: 'grammar' | 'vocabulary';
  appLinkLessonTitle: string;
  appLinkLessonId: string;
  position: string;
  createdAt?: string;
};

const makeDraftId = () => `custom-chapter-${Date.now()}`;

const createEmptyDraft = (): CustomChapterDraft => ({
  id: makeDraftId(),
  categoryTitle: chapterCategories[0]?.title ?? '6e',
  categoryIcon: chapterCategories[0]?.icon ?? '\u{1F4DA}',
  categoryColor: chapterCategories[0]?.color ?? '#1671B6',
  title: '',
  url: '',
  linkMode: 'url',
  appLinkTarget: 'vocabulary',
  appLinkLessonTitle: '',
  appLinkLessonId: '',
  position: '',
});

export function useCustomChaptersAdmin(vocabularyLessons: CustomVocabularyLesson[]) {
  const [isLoading, setIsLoading] = useState(true);
  const [chapters, setChapters] = useState<CustomChapter[]>([]);
  const [draft, setDraft] = useState<CustomChapterDraft>(createEmptyDraft);
  const [isSaving, setIsSaving] = useState(false);

  const categoryOptions = useMemo(
    () => chapterCategories.map((category) => ({
      title: category.title,
      icon: category.icon,
      color: category.color,
    })),
    []
  );

  const hasDraft = useMemo(() => (
    chapters.some((chapter) => chapter.id === draft.id)
    || !!draft.title.trim()
    || !!draft.url.trim()
    || !!draft.appLinkLessonTitle.trim()
  ), [chapters, draft]);

  const loadChapters = async () => {
    setIsLoading(true);
    try {
      setChapters(await getCustomChapters());
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadChapters();
  }, []);

  const resetDraft = () => setDraft(createEmptyDraft());

  const updateDraft = (field: keyof CustomChapterDraft, value: string) => {
    setDraft((current) => ({
      ...current,
      [field]: value,
      ...(field === 'appLinkLessonTitle' || field === 'appLinkTarget'
        ? { appLinkLessonId: '' }
        : {}),
    }));
  };

  const chooseCategory = (title: string) => {
    const category = categoryOptions.find((option) => option.title === title);
    setDraft((current) => ({
      ...current,
      categoryTitle: title,
      ...(category ? { categoryIcon: category.icon, categoryColor: category.color } : {}),
    }));
  };

  const chooseAppLesson = (title: string, id?: string | number) => {
    setDraft((current) => ({
      ...current,
      appLinkLessonTitle: title,
      appLinkLessonId: id === undefined ? '' : String(id),
    }));
  };

  const handleSave = async () => {
    const categoryTitle = draft.categoryTitle.trim();
    const title = draft.title.trim();
    const url = draft.url.trim();

    if (!categoryTitle || !title) {
      notify('Missing details', 'Give the chapter a category and title before saving.');
      return;
    }

    let appLink: CustomChapter['appLink'];
    if (draft.linkMode === 'app') {
      const lessonTitle = draft.appLinkLessonTitle.trim();
      if (!lessonTitle) {
        notify('Missing lesson', 'Choose the Grammar or Vocabulary lesson this chapter should open.');
        return;
      }

      const resolved = resolveChapterAppLink({
        label: title,
        target: draft.appLinkTarget,
        lessonTitle,
        ...(draft.appLinkLessonId ? { lessonId: draft.appLinkLessonId } : {}),
      }, { vocabularyLessons });

      if (!resolved) {
        notify('Lesson not found', `No ${draft.appLinkTarget} lesson titled "${lessonTitle}" was found.`);
        return;
      }

      const resolvedLessonId = (resolved.lesson as { id?: string | number }).id;
      appLink = {
        target: draft.appLinkTarget,
        lessonTitle: resolved.lesson.title,
        ...(resolvedLessonId === undefined ? {} : { lessonId: String(resolvedLessonId) }),
      };
    } else if (!/^https?:\/\//i.test(url)) {
      notify('Invalid link', 'External chapter links must start with http:// or https://.');
      return;
    }

    const parsedPosition = Number.parseInt(draft.position, 10);
    setIsSaving(true);
    try {
      const next = await saveCustomChapter({
        id: draft.id,
        categoryTitle,
        categoryIcon: draft.categoryIcon.trim() || '\u{1F4DA}',
        categoryColor: draft.categoryColor.trim() || '#1671B6',
        title,
        url: draft.linkMode === 'url' ? url : '',
        ...(appLink ? { appLink } : {}),
        position: Number.isFinite(parsedPosition) ? Math.max(0, parsedPosition) : 0,
        createdAt: draft.createdAt,
      });
      setChapters(next);
      resetDraft();
      notify('Saved locally', 'Publish Live when you are ready to send this chapter to every app.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (chapter: CustomChapter) => {
    setDraft({
      id: chapter.id,
      categoryTitle: chapter.categoryTitle,
      categoryIcon: chapter.categoryIcon,
      categoryColor: chapter.categoryColor,
      title: chapter.title,
      url: chapter.url,
      linkMode: chapter.appLink ? 'app' : 'url',
      appLinkTarget: chapter.appLink?.target ?? 'vocabulary',
      appLinkLessonTitle: chapter.appLink?.lessonTitle ?? '',
      appLinkLessonId: chapter.appLink?.lessonId ?? '',
      position: chapter.position ? String(chapter.position) : '',
      createdAt: chapter.createdAt,
    });
  };

  const handleDelete = (chapter: CustomChapter) => {
    confirmDestructive(
      'Delete chapter',
      `Remove "${chapter.title}" from the next live publish?`,
      async () => {
        setChapters(await deleteCustomChapter(chapter.id));
        if (draft.id === chapter.id) resetDraft();
      }
    );
  };

  const handleReset = () => {
    if (!hasDraft) {
      resetDraft();
      return;
    }
    confirmDestructive('Reset chapter draft', 'Clear the chapter currently open in the editor?', resetDraft);
  };

  return {
    isLoading,
    chapters,
    draft,
    isSaving,
    hasDraft,
    categoryOptions,
    updateDraft,
    chooseCategory,
    chooseAppLesson,
    handleSave,
    handleEdit,
    handleDelete,
    handleReset,
  };
}

export type CustomChaptersAdmin = ReturnType<typeof useCustomChaptersAdmin>;
