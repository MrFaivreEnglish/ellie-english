import {
  normalizeAnswer,
  tokenizeTranslateAnswer,
  isFillExercise,
  isReorderExercise,
  isTranslateExercise,
  computeWordDensity,
  getQuestionsForMode,
  type Exercise,
} from '../features/grammar/grammarExercises/GrammarExerciseUtils';

// ─── normalizeAnswer ──────────────────────────────────────────────────────────

describe('normalizeAnswer', () => {
  it('lowercases and trims', () => {
    expect(normalizeAnswer('  Hello  ')).toBe('hello');
  });

  it('strips trailing punctuation', () => {
    expect(normalizeAnswer('great!')).toBe('great');
    expect(normalizeAnswer('really?')).toBe('really');
    expect(normalizeAnswer('yes.')).toBe('yes');
  });

  it('strips accents', () => {
    expect(normalizeAnswer('café')).toBe('cafe');
    expect(normalizeAnswer('naïve')).toBe('naive');
  });

  it('collapses space before punctuation', () => {
    expect(normalizeAnswer("it 's fine")).toBe("it's fine");
    expect(normalizeAnswer('hello , world')).toBe('hello, world');
  });

  it('preserves apostrophes in contractions', () => {
    expect(normalizeAnswer("don't")).toBe("don't");
  });
});

// ─── tokenizeTranslateAnswer ──────────────────────────────────────────────────

describe('tokenizeTranslateAnswer', () => {
  it('splits a plain sentence into words', () => {
    expect(tokenizeTranslateAnswer('I like cats')).toEqual(['I', 'like', 'cats']);
  });

  it('groups article + following word as a single token', () => {
    expect(tokenizeTranslateAnswer('I have a dog')).toEqual(['I', 'have', 'a dog']);
    expect(tokenizeTranslateAnswer('She reads the book')).toEqual(['She', 'reads', 'the book']);
  });

  it('groups possessive determiners', () => {
    expect(tokenizeTranslateAnswer('I see my friend')).toEqual(['I', 'see', 'my friend']);
  });

  it('handles a trailing article gracefully (no crash)', () => {
    const result = tokenizeTranslateAnswer('I see a');
    expect(result).toContain('a');
  });

  it('returns empty array for empty input', () => {
    expect(tokenizeTranslateAnswer('   ')).toEqual([]);
  });
});

// ─── exercise type guards ─────────────────────────────────────────────────────

describe('isFillExercise', () => {
  it('detects fill type by type field', () => {
    expect(isFillExercise({ question: 'Q', answer: 'A', type: 'fill' })).toBe(true);
  });

  it('detects fill type by ___ in question', () => {
    expect(isFillExercise({ question: 'He ___ a dog', answer: 'has' })).toBe(true);
  });

  it('returns false for choice exercises', () => {
    expect(isFillExercise({ question: 'Who?', answer: 'me', type: 'choice' })).toBe(false);
  });
});

describe('isReorderExercise', () => {
  it('returns true when type is reorder with words array and string answer', () => {
    expect(isReorderExercise({
      question: 'Reorder',
      answer: 'I like cats',
      type: 'reorder',
      words: ['like', 'I', 'cats'],
    })).toBe(true);
  });

  it('returns false when words is missing', () => {
    expect(isReorderExercise({ question: 'Q', answer: 'A', type: 'reorder' })).toBe(false);
  });

  it('returns false when answer is boolean', () => {
    expect(isReorderExercise({ question: 'Q', answer: true, type: 'reorder', words: ['x'] })).toBe(false);
  });
});

describe('isTranslateExercise', () => {
  it('returns true for translate type with string answer', () => {
    expect(isTranslateExercise({ question: 'Translate', answer: 'I am happy', type: 'translate' })).toBe(true);
  });

  it('returns false for other types', () => {
    expect(isTranslateExercise({ question: 'Q', answer: 'A', type: 'fill' })).toBe(false);
  });

  it('returns false when answer is boolean', () => {
    expect(isTranslateExercise({ question: 'Q', answer: true, type: 'translate' })).toBe(false);
  });
});

// ─── computeWordDensity ───────────────────────────────────────────────────────

describe('computeWordDensity', () => {
  it('returns 0 for a short answer', () => {
    expect(computeWordDensity(3, 20, false, false)).toBe(0);
  });

  it('returns 1 for a moderately dense answer', () => {
    expect(computeWordDensity(10, 50, false, false)).toBe(1);
  });

  it('returns 2 for a very dense answer', () => {
    expect(computeWordDensity(14, 90, false, false)).toBe(2);
  });

  it('uses lower thresholds on narrow layouts', () => {
    expect(computeWordDensity(8, 45, false, true)).toBe(1);
  });

  it('uses higher thresholds on desktop web', () => {
    expect(computeWordDensity(10, 50, true, false)).toBe(0);
  });
});

// ─── getQuestionsForMode ──────────────────────────────────────────────────────

describe('getQuestionsForMode', () => {
  const fillEx: Exercise = { question: 'He ___ tall', answer: 'is', type: 'fill' };
  const choiceEx: Exercise = { question: 'Choose', answer: 'B', type: 'choice', options: ['A', 'B', 'C'] };
  const reorderEx: Exercise = { question: 'Reorder', answer: 'I like cats', type: 'reorder', words: ['like', 'I', 'cats'] };
  const translateEx: Exercise = { question: 'Translate', answer: 'I am happy', type: 'translate' };

  const exercises = [fillEx, choiceEx, reorderEx, translateEx];

  it('returns only fill exercises for fill mode', () => {
    const result = getQuestionsForMode(exercises, 'fill', 10);
    expect(result.every(e => e.type === 'fill')).toBe(true);
    expect(result.every(e => e.options === undefined)).toBe(true);
  });

  it('returns only reorder exercises for reorder mode', () => {
    const result = getQuestionsForMode(exercises, 'reorder', 10);
    expect(result.every(e => e.type === 'reorder')).toBe(true);
  });

  it('returns only translate exercises for translate mode', () => {
    const result = getQuestionsForMode(exercises, 'translate', 10);
    expect(result.every(e => e.type === 'translate')).toBe(true);
  });

  it('excludes fill/reorder/translate from quiz mode', () => {
    const result = getQuestionsForMode(exercises, 'quiz', 10);
    expect(result.every(e => e.type !== 'fill' && e.type !== 'reorder' && e.type !== 'translate')).toBe(true);
  });

  it('respects the count limit', () => {
    const many = Array.from({ length: 20 }, (_, i) => ({
      ...choiceEx,
      question: `Q${i}`,
    }));
    expect(getQuestionsForMode(many, 'quiz', 5)).toHaveLength(5);
  });
});
