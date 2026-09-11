import type { ChapterCategory, ChapterLesson } from '../../content/lessons/lessonTypes';
import type { CustomChapter } from './customChapterStorage';

const normalizeTitle = (value: string) => value.trim().toLocaleLowerCase();

const toChapterLesson = (chapter: CustomChapter): ChapterLesson => ({
  id: chapter.id,
  title: chapter.title,
  url: chapter.url,
  isCustom: true,
  ...(chapter.appLink
    ? {
        liveAppLink: {
          label: chapter.title,
          target: chapter.appLink.target,
          lessonTitle: chapter.appLink.lessonTitle,
          ...(chapter.appLink.lessonId ? { lessonId: chapter.appLink.lessonId } : {}),
        },
      }
    : {}),
});

export const mergeCustomChapters = (
  bundledCategories: ChapterCategory[],
  customChapters: CustomChapter[]
): ChapterCategory[] => {
  const categories = bundledCategories.map((category) => ({
    ...category,
    lessons: [...category.lessons],
  }));

  customChapters.forEach((chapter) => {
    const categoryKey = normalizeTitle(chapter.categoryTitle);
    let category = categories.find((candidate) => normalizeTitle(candidate.title) === categoryKey);

    if (!category) {
      category = {
        title: chapter.categoryTitle,
        icon: chapter.categoryIcon,
        color: chapter.categoryColor,
        lessons: [],
      };
      categories.push(category);
    }

    const lesson = toChapterLesson(chapter);
    if (chapter.position > 0) {
      category.lessons.splice(Math.min(chapter.position - 1, category.lessons.length), 0, lesson);
    } else {
      category.lessons.push(lesson);
    }
  });

  return categories;
};

