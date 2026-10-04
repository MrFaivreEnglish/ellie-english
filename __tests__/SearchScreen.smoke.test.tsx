import { act, fireEvent, render } from '@testing-library/react-native';

jest.mock('../features/lessons/customLessonStorage', () => ({
  getCustomVocabularyLessons: jest.fn(() => Promise.resolve([])),
}));

import SearchScreen from '../features/home/SearchScreen';
import { vocabularyLessons } from '../content/lessons/vocabularyRegistry';

const flush = async () => {
  await act(async () => {
    for (let i = 0; i < 10; i += 1) await Promise.resolve();
  });
};

describe('SearchScreen', () => {
  it('offers suggestions before typing, then filters results by kind', async () => {
    const lessonTitle = String(vocabularyLessons[0].title);
    const { getByText, getByLabelText, queryByText } = render(<SearchScreen />);
    await flush();

    expect(getByText('Try a lesson')).toBeTruthy();
    expect(getByLabelText(`Search for ${lessonTitle}`)).toBeTruthy();

    // Tapping a suggestion fills the box and shows results with filter chips.
    fireEvent.press(getByLabelText(`Search for ${lessonTitle}`));
    await flush();
    expect(queryByText('Try a lesson')).toBeNull();
    expect(getByLabelText(/^All, \d+/)).toBeTruthy();
    expect(getByLabelText(/^Lessons, [1-9]/)).toBeTruthy();

    fireEvent.press(getByLabelText(/^Words, \d+/));
    expect(queryByText('Lessons')).toBeNull();
  });

  it('says so when nothing matches', async () => {
    const { getByLabelText, getByText } = render(<SearchScreen />);
    await flush();

    fireEvent.changeText(getByLabelText('Search words and lessons'), 'zzzqqq');
    expect(getByText('Nothing found')).toBeTruthy();
  });
});
