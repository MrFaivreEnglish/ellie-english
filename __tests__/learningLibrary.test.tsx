import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, fireEvent, render } from '@testing-library/react-native';

jest.mock('../features/account/accountStorage', () => ({
  syncProgressItemToCloudIfSignedIn: jest.fn(() => Promise.resolve()),
  deleteProgressItemFromCloudIfSignedIn: jest.fn(() => Promise.resolve()),
}));

jest.mock('../features/lessons/customLessonStorage', () => ({
  getCustomVocabularyLessons: jest.fn(() => Promise.resolve([])),
}));

const mockOpenWordReview = jest.fn();
jest.mock('../features/vocabulary/wordReviewLesson', () => ({
  openWordReview: (...args: unknown[]) => mockOpenWordReview(...args),
}));

import { vocabularyCategories } from '../content/lessons/vocabularyRegistry';
import { grammarLessons } from '../content/lessons/grammarRegistry';
import { getLearningLibrary } from '../features/progress/learningLibrary';
import MyWordsScreen from '../features/progress/MyWordsScreen';
import {
  clearLearnedFlashcardProgress,
  saveLearnedFlashcardKeys,
} from '../features/vocabulary/flashcardProgressStorage';
import {
  clearGrammarProgress,
  getGrammarLessonProgressKey,
  recordGrammarCorrectAnswer,
} from '../features/grammar/grammarProgressStorage';
import { getLessonProgressKey, getLessonWords, vocabularyWordKey } from '../features/vocabulary/knownWords';
import { clearReviewWords, recordReviewMistake } from '../features/vocabulary/reviewWordsStorage';

const store: Record<string, string> = {};
const lesson = vocabularyCategories.flatMap((category) => category.lessons).find((candidate) => getLessonWords(candidate).length >= 3)!;
const [firstWord, secondWord, thirdWord] = getLessonWords(lesson);
const grammarLesson = grammarLessons.find((candidate) => candidate?.title)!;

beforeEach(async () => {
  for (const k of Object.keys(store)) delete store[k];
  jest.mocked(AsyncStorage.getItem).mockImplementation((key: string) => Promise.resolve(store[key] ?? null));
  jest.mocked(AsyncStorage.setItem).mockImplementation((key: string, value: string) => {
    store[key] = value;
    return Promise.resolve();
  });
  jest.mocked(AsyncStorage.removeItem).mockImplementation((key: string) => {
    delete store[key];
    return Promise.resolve();
  });
  jest.mocked(AsyncStorage.getAllKeys).mockImplementation(() => Promise.resolve(Object.keys(store)));
  jest.mocked(AsyncStorage.multiGet).mockImplementation((keys: readonly string[]) =>
    Promise.resolve(keys.map((key) => [key, store[key] ?? null] as [string, string | null]))
  );
  jest.mocked(AsyncStorage.multiRemove).mockImplementation((keys: readonly string[]) => {
    keys.forEach((key) => delete store[key]);
    return Promise.resolve();
  });
  // Both stores cache what they read; clearing also drops those caches.
  await clearLearnedFlashcardProgress();
  await clearGrammarProgress();
  await clearReviewWords();
  mockOpenWordReview.mockClear();
});

describe('getLearningLibrary', () => {
  it('groups learnt words under the lesson they come from, even when learnt in a mix', async () => {
    await saveLearnedFlashcardKeys(getLessonProgressKey(lesson), new Set([vocabularyWordKey(firstWord)]));
    await saveLearnedFlashcardKeys('vocabulary-mix-a-b', new Set([vocabularyWordKey(secondWord)]));
    await saveLearnedFlashcardKeys('a-lesson-that-was-removed', new Set(['hello|bonjour']));

    const library = await getLearningLibrary();

    const lessonGroup = library.learnedGroups.find((group) => group.lessonTitle === lesson.title);
    expect(lessonGroup?.words.map((word) => word.english).sort()).toEqual([firstWord.english, secondWord.english].sort());
    expect(library.learnedGroups.find((group) => group.lessonTitle === 'Other practice')?.words)
      .toEqual([{ english: 'hello', french: 'bonjour' }]);
    expect(library.learnedWordCount).toBe(3);
  });

  it('lists grammar lessons with saved answers and words waiting for review', async () => {
    const grammarKey = getGrammarLessonProgressKey(grammarLesson);
    await recordGrammarCorrectAnswer(grammarKey, 'q1');
    await recordGrammarCorrectAnswer(grammarKey, 'q2');
    await recordReviewMistake(thirdWord, lesson.title);

    const library = await getLearningLibrary();

    expect(library.grammarLessons).toEqual([{ title: grammarLesson.title, answers: 2 }]);
    expect(library.grammarAnswerCount).toBe(2);
    expect(library.reviewWords.map((word) => word.english)).toEqual([thirdWord.english]);
    // Due tomorrow, not today.
    expect(library.dueReviewCount).toBe(0);
  });
});

describe('MyWordsScreen', () => {
  const renderScreen = async () => {
    const screen = render(<MyWordsScreen />);
    await act(async () => {
      for (let i = 0; i < 10; i += 1) await Promise.resolve();
    });
    return screen;
  };

  it('shows learnt words by lesson, opens a lesson and searches across them', async () => {
    await saveLearnedFlashcardKeys(getLessonProgressKey(lesson), new Set([vocabularyWordKey(firstWord), vocabularyWordKey(secondWord)]));
    const { getByText, queryByText, getByLabelText } = await renderScreen();

    expect(getByText('My words')).toBeTruthy();
    expect(queryByText(firstWord.french)).toBeNull();

    fireEvent.press(getByLabelText(`${lesson.title}, 2 words`));
    expect(getByText(firstWord.french)).toBeTruthy();

    fireEvent.changeText(getByLabelText('Search learnt words'), secondWord.french);
    expect(getByText(secondWord.english)).toBeTruthy();
    expect(queryByText(firstWord.english)).toBeNull();
  });

  it('starts a review of the words that are due', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-03-10T12:00:00'));
    await recordReviewMistake(thirdWord, lesson.title);
    jest.setSystemTime(new Date('2026-03-11T12:00:00'));

    const { getByText } = await renderScreen();
    fireEvent.press(getByText('Start review'));

    expect(mockOpenWordReview).toHaveBeenCalledWith(
      expect.anything(),
      [expect.objectContaining({ english: thirdWord.english })],
      { backLabel: 'Back to My words', backTarget: 'MyWords' }
    );
    jest.useRealTimers();
  });
});
