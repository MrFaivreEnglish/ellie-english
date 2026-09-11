import { useEffect, useMemo, useState } from 'react';
import { lessonCategories as chapterCategories } from '../../../content/lessons/chapterData';
import { resolveChapterAppLink } from '../../../content/lessons/appLessonRegistry';
import {
  deleteCustomChapterLinkOverride,
  getCustomChapterLinkOverrides,
  makeChapterLinkOverrideId,
  normalizeChapterLinkOverrides,
  saveCustomChapterLinkOverride,
  type ChapterAppLinkTarget,
  type ChapterLinkOverride,
} from '../chapterLinkStorage';
import { fetchLessonTitleFromUrl, isLessonTitleFetchConfigured } from '../lessonTitleFetch';
import { confirmDestructive, notify } from './adminDialogs';
import { copyTextToClipboard } from './webClipboardFile';
import type { CustomVocabularyLesson } from '../customLessonStorage';

const bundledCustomChapterLinks = require('../../../content/lessons/customChapterLinks.json') as any[];

export type EditableChapterLink = {
  id: string;
  categoryTitle: string;
  lessonTitle: string;
  defaultTitle: string;
  defaultUrl: string;
  color: string;
};

export type ChapterLinkDraft = {
  displayTitle: string;
  url: string;
  appLinkMode?: 'url' | 'app';
  appLinkTarget?: 'grammar' | 'vocabulary';
  appLinkLessonTitle?: string;
  appLinkLessonId?: string;
};

export function useChapterLinksAdmin(vocabularyLessons: CustomVocabularyLesson[] = []) {
  const [isLoading, setIsLoading] = useState(true);
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
  const [fetchingTitleIds, setFetchingTitleIds] = useState<Record<string, boolean>>({});
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

  const unsavedChapterLinkCount = useMemo(
    () =>
      chapterLinkItems.filter((item) => {
        const publishedTitle = getPublishedChapterTitle(item);
        const publishedUrl = getPublishedChapterUrl(item);
        const effectiveOverride = chapterLinkOverrideMap.get(item.id);
        const effectiveAppLink = effectiveOverride?.appLink;
        const currentDraft = chapterLinkDrafts[item.id] ?? {
          displayTitle: publishedTitle,
          url: publishedUrl,
        };
        const draftAppLinkMode = currentDraft.appLinkMode ?? (effectiveAppLink ? 'app' : 'url');
        const draftAppLinkTarget = currentDraft.appLinkTarget ?? effectiveAppLink?.target ?? 'grammar';
        const draftAppLinkLessonTitle = currentDraft.appLinkLessonTitle ?? effectiveAppLink?.lessonTitle ?? '';
        const draftAppLinkLessonId = currentDraft.appLinkLessonId ?? effectiveAppLink?.lessonId ?? '';
        const effectiveTitle = effectiveOverride?.displayTitle ?? item.defaultTitle;
        const effectiveUrl = effectiveOverride?.url ?? item.defaultUrl;

        return (
          currentDraft.displayTitle.trim() !== effectiveTitle ||
          (draftAppLinkMode === 'url'
            ? currentDraft.url.trim() !== effectiveUrl || !!effectiveAppLink
            : draftAppLinkTarget !== effectiveAppLink?.target
              || draftAppLinkLessonTitle.trim() !== (effectiveAppLink?.lessonTitle ?? '')
              || draftAppLinkLessonId.trim() !== (effectiveAppLink?.lessonId ?? '')
              || !effectiveAppLink)
        );
      }).length,
    [chapterLinkDrafts, chapterLinkItems, chapterLinkOverrideMap, bundledChapterLinkOverrideMap]
  );

  const loadChapterLinks = async () => {
    setIsLoading(true);
    try {
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
                appLinkMode: override?.appLink ? 'app' : 'url',
                appLinkTarget: override?.appLink?.target ?? 'grammar',
                appLinkLessonTitle: override?.appLink?.lessonTitle ?? '',
                appLinkLessonId: override?.appLink?.lessonId ?? '',
              },
            ];
          })
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadChapterLinks();
  }, []);

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
        appLinkMode: current[id]?.appLinkMode,
        appLinkTarget: current[id]?.appLinkTarget,
        appLinkLessonTitle: current[id]?.appLinkLessonTitle,
        appLinkLessonId: current[id]?.appLinkLessonId,
        ...(field === 'appLinkLessonTitle' || field === 'appLinkTarget' ? { appLinkLessonId: '' } : {}),
        [field]: value,
      } as ChapterLinkDraft,
    }));
  };

  const handleSaveChapterLink = async (item: EditableChapterLink) => {
    const draft = chapterLinkDrafts[item.id];
    const displayTitle = (draft?.displayTitle ?? '').trim();
    const url = (draft?.url ?? '').trim();
    const appLinkMode = draft?.appLinkMode ?? 'url';
    const publishedTitle = getPublishedChapterTitle(item);
    const publishedUrl = getPublishedChapterUrl(item);

    if (!displayTitle) {
      notify('Missing title', 'Give the chapter a title before saving.');
      return;
    }

    let appLink: ChapterAppLinkTarget | undefined;

    if (appLinkMode === 'app') {
      const target = draft?.appLinkTarget ?? 'grammar';
      const lessonTitle = (draft?.appLinkLessonTitle ?? '').trim();

      if (!lessonTitle) {
        notify('Missing lesson', 'Choose a Grammar or Vocabulary lesson before saving.');
        return;
      }

      const resolved = resolveChapterAppLink({
        label: displayTitle,
        target,
        lessonTitle,
        ...(draft?.appLinkLessonId ? { lessonId: draft.appLinkLessonId } : {}),
      }, { vocabularyLessons });
      if (!resolved) {
        notify('Lesson not found', `No ${target} lesson titled "${lessonTitle}" was found. Check the spelling and try again.`);
        return;
      }

      const resolvedLessonId = (resolved.lesson as { id?: string | number }).id;
      appLink = {
        target,
        lessonTitle: resolved.lesson.title,
        ...(resolvedLessonId === undefined ? {} : { lessonId: String(resolvedLessonId) }),
      };
    } else {
      if (!url) {
        notify('Missing link', 'Paste a chapter link before saving.');
        return;
      }

      if (!/^https?:\/\//i.test(url)) {
        notify('Invalid link', 'Chapter links must start with http:// or https://.');
        return;
      }
    }

    if (appLinkMode === 'url' && displayTitle === publishedTitle && url === publishedUrl) {
      const nextOverrides = await deleteCustomChapterLinkOverride(item.id);
      setChapterLinkOverrides(nextOverrides);
      setChapterLinkDrafts((current) => ({
        ...current,
        [item.id]: { displayTitle: publishedTitle, url: publishedUrl },
      }));
      setEditingChapterLinkIds((current) => ({ ...current, [item.id]: false }));
      notify('Saved', 'This chapter now uses the published title and link.');
      return;
    }

    const existingOverride = chapterLinkOverrides.find((override) => override.id === item.id);
    const nextOverrides = await saveCustomChapterLinkOverride({
      id: item.id,
      categoryTitle: item.categoryTitle,
      lessonTitle: item.lessonTitle,
      displayTitle,
      url,
      appLink,
      createdAt: existingOverride?.createdAt,
    });

    setChapterLinkOverrides(nextOverrides);
    setChapterLinkDrafts((current) => ({
      ...current,
      [item.id]: {
        displayTitle,
        url,
        appLinkMode,
        appLinkTarget: appLink?.target ?? draft?.appLinkTarget,
        appLinkLessonTitle: appLink?.lessonTitle ?? draft?.appLinkLessonTitle,
        appLinkLessonId: appLink?.lessonId ?? draft?.appLinkLessonId,
      },
    }));
    setEditingChapterLinkIds((current) => ({ ...current, [item.id]: false }));
    notify('Saved', appLinkMode === 'app' ? 'This chapter now opens the in-app lesson.' : 'This chapter title and link have been updated on this device.');
  };

  const handleFetchChapterLinkTitle = async (item: EditableChapterLink) => {
    const url = (chapterLinkDrafts[item.id]?.url ?? '').trim();

    if (!url) {
      notify('Missing link', 'Paste a chapter link before fetching its title.');
      return;
    }

    if (!isLessonTitleFetchConfigured()) {
      notify('Not configured', 'Title fetching needs Supabase configured on this build.');
      return;
    }

    setFetchingTitleIds((current) => ({ ...current, [item.id]: true }));

    try {
      const fetchedTitle = await fetchLessonTitleFromUrl(url);
      updateChapterLinkDraft(item.id, 'displayTitle', fetchedTitle);
    } catch (error) {
      notify('Fetch failed', error instanceof Error ? error.message : 'Could not fetch the page title.');
    } finally {
      setFetchingTitleIds((current) => ({ ...current, [item.id]: false }));
    }
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
      ...(override.appLink ? { appLink: override.appLink } : {}),
    }));

    await copyTextToClipboard(JSON.stringify(payload, null, 2));
    notify(
      'Copied',
      'Chapter link JSON copied to clipboard. Paste it into content/lessons/customChapterLinks.json before building.'
    );
  };

  return {
    isLoading,
    editingChapterLinkIds,
    expandedChapterLevels,
    chapterLinkOverrides,
    chapterLinkDrafts,
    fetchingTitleIds,
    bundledChapterLinkOverrides,
    chapterLinkItems,
    chapterLinkGroups,
    bundledChapterLinkOverrideMap,
    chapterLinkOverrideMap,
    getPublishedChapterUrl,
    getPublishedChapterTitle,
    unsavedChapterLinkCount,
    loadChapterLinks,
    toggleChapterLinkEditor,
    updateChapterLinkDraft,
    handleSaveChapterLink,
    handleFetchChapterLinkTitle,
    handleResetChapterLink,
    toggleChapterLevel,
    handleCopyChapterLinksJson,
    vocabularyLessons,
  };
}
