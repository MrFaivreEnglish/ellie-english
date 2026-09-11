import { mergeCustomChapters } from '../features/lessons/chapterContent';
import { resolveChapterAppLink } from '../content/lessons/appLessonRegistry';
import type { ChapterCategory } from '../content/lessons/lessonTypes';
import type { CustomChapter } from '../features/lessons/customChapterStorage';
import type { VocabularyLesson } from '../types/lessonTypes';

const makeChapter = (overrides: Partial<CustomChapter> = {}): CustomChapter => ({
  id: 'remote-chapter-1',
  categoryTitle: '6e',
  categoryIcon: '📚',
  categoryColor: '#1671B6',
  title: 'Remote chapter',
  url: 'https://example.com/chapter',
  position: 0,
  isCustom: true,
  createdAt: '2026-08-30T00:00:00.000Z',
  updatedAt: '2026-08-30T00:00:00.000Z',
  ...overrides,
});

describe('live chapter content', () => {
  const bundled: ChapterCategory[] = [{
    title: '6e',
    icon: '6',
    color: '#111111',
    lessons: [
      { title: 'First', url: 'https://example.com/first' },
      { title: 'Second', url: 'https://example.com/second' },
    ],
  }];

  it('inserts a remote chapter at its one-based position without mutating bundled data', () => {
    const merged = mergeCustomChapters(bundled, [makeChapter({ position: 2 })]);

    expect(merged[0].lessons.map((lesson) => lesson.title)).toEqual(['First', 'Remote chapter', 'Second']);
    expect(bundled[0].lessons.map((lesson) => lesson.title)).toEqual(['First', 'Second']);
  });

  it('creates a new remote category and carries its in-app target', () => {
    const merged = mergeCustomChapters(bundled, [makeChapter({
      categoryTitle: 'Summer course',
      categoryIcon: '☀️',
      categoryColor: '#F59E0B',
      url: '',
      appLink: { target: 'vocabulary', lessonTitle: 'Renamed lesson', lessonId: 'live-vocab-1' },
    })]);

    const category = merged.find((item) => item.title === 'Summer course');
    expect(category).toMatchObject({ icon: '☀️', color: '#F59E0B' });
    expect(category?.lessons[0]).toMatchObject({
      id: 'remote-chapter-1',
      isCustom: true,
      liveAppLink: { target: 'vocabulary', lessonId: 'live-vocab-1' },
    });
  });

  it('resolves a dynamic vocabulary lesson by stable ID even after its title changes', () => {
    const liveLesson: VocabularyLesson = {
      id: 'live-vocab-1',
      title: 'New lesson title',
      flashcards: [{ english: 'hello', french: 'bonjour' }],
    };

    const resolved = resolveChapterAppLink({
      label: 'Open vocabulary',
      target: 'vocabulary',
      lessonTitle: 'Old lesson title',
      lessonId: 'live-vocab-1',
    }, { vocabularyLessons: [liveLesson] });

    expect(resolved?.lesson.title).toBe('New lesson title');
  });
});
