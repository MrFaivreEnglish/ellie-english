import { useEffect, useState } from 'react';
import { clearLocalChapterLinkDrafts, type ChapterLinkOverride } from '../chapterLinkStorage';
import { clearLocalCustomChapterDrafts, type CustomChapter } from '../customChapterStorage';
import { clearLocalVocabularyLessonDrafts, type CustomVocabularyLesson } from '../customLessonStorage';
import { getAdminContentAccess, isAdminContentSyncConfigured, publishAdminContent } from '../adminContentSync';
import { exportableLesson } from './lessonDraftUtils';
import { copyTextToClipboard } from './webClipboardFile';
import { notify } from './adminDialogs';

export function useAdminPublish(
  chapterLinkOverrides: ChapterLinkOverride[],
  customChapters: CustomChapter[],
  lessons: CustomVocabularyLesson[]
) {
  const [isPublishing, setIsPublishing] = useState(false);
  const [baseVersion, setBaseVersion] = useState<number | null>(null);
  const buildChangeCount = chapterLinkOverrides.length + customChapters.length + lessons.length;

  useEffect(() => {
    let active = true;
    getAdminContentAccess()
      .then((access) => {
        if (active && access.isAdmin) setBaseVersion(access.version);
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  const handlePublishLive = async () => {
    if (!isAdminContentSyncConfigured()) {
      notify('Not configured', 'Live publishing needs Supabase configured on this build.');
      return;
    }

    setIsPublishing(true);

    try {
      const currentVersion = baseVersion ?? (await getAdminContentAccess()).version;
      const result = await publishAdminContent({
        chapterLinkOverrides,
        customChapters,
        customVocabularyLessons: lessons,
      }, currentVersion);
      setBaseVersion(result.version);
      await Promise.all([
        clearLocalChapterLinkDrafts(),
        clearLocalCustomChapterDrafts(),
        clearLocalVocabularyLessonDrafts(),
      ]);

      notify(
        'Published live',
        `Live v${result.version}: ${result.chapterLinkCount} link override${result.chapterLinkCount === 1 ? '' : 's'}, ${result.customChapterCount} custom chapter${result.customChapterCount === 1 ? '' : 's'}, and ${result.vocabularyLessonCount} vocabulary lesson${result.vocabularyLessonCount === 1 ? '' : 's'}.`
      );
    } catch (error) {
      notify('Publish failed', error instanceof Error ? error.message : 'Could not publish content.');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleCopyBuildJson = async () => {
    if (buildChangeCount === 0) {
      notify('No local changes', 'There are no custom links or lessons to export yet.');
      return;
    }

    const payload = {
      customChapterLinks: chapterLinkOverrides.map((override) => ({
        id: override.id,
        categoryTitle: override.categoryTitle,
        lessonTitle: override.lessonTitle,
        displayTitle: override.displayTitle,
        url: override.url,
        ...(override.appLink ? { appLink: override.appLink } : {}),
      })),
      customChapters,
      customVocabularyLessons: lessons.map(exportableLesson),
    };

    await copyTextToClipboard(JSON.stringify(payload, null, 2));
    notify(
      'Copied',
      'Build bundle copied. It includes link overrides, custom chapters, and vocabulary lessons.'
    );
  };

  return {
    isPublishing,
    baseVersion,
    buildChangeCount,
    handlePublishLive,
    handleCopyBuildJson,
  };
}
