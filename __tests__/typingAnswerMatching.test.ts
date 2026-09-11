import { act, renderHook } from '@testing-library/react-native';

import { useTypingGame } from '../features/vocabulary/useTypingGame';
import type { Word } from '../types/VocabularyTypes';

// Typing prompts the French and marks the typed English. Lessons write a free choice between
// synonyms with either separator ("A cab / A taxi", "Trendy, Stylish") and gloss an answer in
// brackets ("Physical Education (PE)"), so each option has to stand on its own.
const answerIsAccepted = async (word: Word, typed: string) => {
  // Stable array identity: the hook resets its session whenever `words` changes identity,
  // so rebuilding it on every render would loop.
  const words = [word];
  const { result } = renderHook(() => useTypingGame(words));

  act(() => {
    result.current.setTypedAnswer(typed);
  });
  await act(async () => {
    await result.current.handleSubmit();
  });

  return result.current.typingFeedback === 'correct';
};

const word = (english: string, alternatives?: string[]): Word => ({
  english,
  french: 'Peu importe',
  ...(alternatives ? { alternatives } : {}),
});

describe('typing answer matching', () => {
  describe('synonyms listed with a slash', () => {
    it.each([
      ['A cab / A taxi', 'a cab'],
      ['A cab / A taxi', 'a taxi'],
      ['A cab / A taxi', 'taxi'],
      ['Shrimp / Prawn', 'prawn'],
    ])('accepts %j typed as %j', async (prompt, typed) => {
      expect(await answerIsAccepted(word(prompt), typed)).toBe(true);
    });
  });

  describe('synonyms listed with a comma', () => {
    it.each([
      ['Trendy, Stylish', 'trendy'],
      ['Trendy, Stylish', 'stylish'],
      ['Trendy, Stylish', 'trendy stylish'],
      ['Sustainable, Eco-friendly', 'sustainable'],
      ['Clever, Smart', 'smart'],
    ])('accepts %j typed as %j', async (prompt, typed) => {
      expect(await answerIsAccepted(word(prompt), typed)).toBe(true);
    });
  });

  describe('bracketed glosses', () => {
    it.each([
      ['Prison (UK) / Jail (US)', 'prison'],
      ['Prison (UK) / Jail (US)', 'jail'],
      ['A (cotton) plantation', 'a plantation'],
      ['A (cotton) plantation', 'a cotton plantation'],
      ['Physical Education (PE)', 'physical education'],
    ])('accepts %j typed as %j', async (prompt, typed) => {
      expect(await answerIsAccepted(word(prompt), typed)).toBe(true);
    });

    it('leaves an abbreviation to the alternatives field', async () => {
      // The gloss alone is a real answer for PE but not for "(UK)" or "(cotton)", so it is
      // opted into per word rather than accepted for every bracket.
      expect(await answerIsAccepted(word('Physical Education (PE)'), 'PE')).toBe(false);
      expect(await answerIsAccepted(word('Physical Education (PE)', ['PE']), 'PE')).toBe(true);
    });
  });

  it('still rejects a wrong answer', async () => {
    expect(await answerIsAccepted(word('Trendy, Stylish'), 'boring')).toBe(false);
    expect(await answerIsAccepted(word('A cab / A taxi'), 'a bus')).toBe(false);
  });
});
