import { grammarLessons } from '../content/lessons/grammarRegistry';

describe('Grammar Translate word banks', () => {
  it('groups articles with their nouns outside the Articles lesson', () => {
    const canLesson = grammarLessons.find((lesson) => lesson.id === '21');
    const exercise = canLesson?.exercises.find(
      (candidate: any) => candidate.type === 'translate' && candidate.answer === 'He can become a doctor.'
    );

    expect(exercise?.wordBank).toContain('a doctor.');
    expect(exercise?.wordBank).not.toContain('a');
    expect(exercise?.wordBank).not.toContain('doctor.');
  });

  it('keeps articles separate in the Articles lesson', () => {
    const articlesLesson = grammarLessons.find((lesson) => lesson.id === '40');
    const exercise = articlesLesson?.exercises.find(
      (candidate: any) => candidate.type === 'translate' && candidate.answer === 'I have a dog.'
    );

    expect(exercise?.wordBank).toEqual(expect.arrayContaining(['a', 'an', 'the', 'dog']));
    expect(exercise?.wordBank).not.toContain('a dog');
  });

  it('has no bare article chips in any other prepared Translate lesson', () => {
    const bareArticleChips = grammarLessons
      .filter((lesson) => lesson.id !== '40')
      .flatMap((lesson) => lesson.exercises ?? [])
      .filter((exercise: any) => exercise.type === 'translate' && Array.isArray(exercise.wordBank))
      .flatMap((exercise: any) => exercise.wordBank)
      .filter((chip: string) => ['a', 'an', 'the'].includes(chip.trim().toLowerCase()));

    expect(bareArticleChips).toEqual([]);
  });
});
