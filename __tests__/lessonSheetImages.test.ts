import { vocabularyCategories } from '../content/lessons/vocabularyRegistry';
import { getLessonImage, getLessonSheetImageUris, getLessonThumbnailSource } from '../features/vocabulary/vocabularyUtils';

const bundledCustomLessons = require('../content/lessons/customVocabularyLessons.json') as any[];

describe('getLessonSheetImageUris', () => {
  it('lists each category sheet and the lesson sheet once', () => {
    const uris = getLessonSheetImageUris({
      title: 'Animals',
      imageUrl: 'https://example.com/animals.webp',
      flashcards: [
        { category: 'Pets', imageUrl: 'https://example.com/pets.webp', words: [] },
        { category: 'Farm', image: 'https://example.com/farm.webp', words: [] },
        { category: 'Wild', imageUrl: 'https://example.com/animals.webp', words: [] },
      ],
    });

    expect(uris.sort()).toEqual([
      'https://example.com/animals.webp',
      'https://example.com/farm.webp',
      'https://example.com/pets.webp',
    ]);
  });

  it('falls back to the hosted image for the title when the lesson has none', () => {
    const lesson = { title: 'A lesson with no bundled picture', flashcards: [{ english: 'always', french: 'toujours' }] };

    expect(getLessonSheetImageUris(lesson)).toEqual([getLessonImage(lesson.title)]);
  });

  it('skips bundled images, which need no download', () => {
    expect(getLessonSheetImageUris({ title: 'Anything', image: 42 })).toEqual([]);
    expect(getLessonSheetImageUris({ title: 'Anything', thumbnail: 42 })).toEqual([]);
    expect(getLessonSheetImageUris(null)).toEqual([]);
  });
});

// getLessonImage no longer knows any lesson by title, so a lesson without its own image
// would show the generic placeholder sheet.
it('every bundled vocabulary lesson has its own sheet or thumbnail', () => {
  const lessons = [...vocabularyCategories.flatMap((category) => category.lessons), ...bundledCustomLessons];
  const missing = lessons
    .filter((lesson: any) => !(lesson.imageUrl ?? lesson.image) && !getLessonThumbnailSource(lesson))
    .map((lesson: any) => lesson.title);

  expect(missing).toEqual([]);
});
