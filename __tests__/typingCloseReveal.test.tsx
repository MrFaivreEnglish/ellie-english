import { act, renderHook } from '@testing-library/react-native';

jest.mock('../features/vocabulary/reviewWordsStorage', () => ({
  recordReviewMistake: jest.fn(() => Promise.resolve()),
  recordReviewSuccess: jest.fn(() => Promise.resolve()),
}));
jest.mock('../features/progress/streakStorage', () => ({ recordPracticeToday: jest.fn(() => Promise.resolve()) }));
jest.mock('../features/progress/xpStorage', () => ({
  getXP: jest.fn(() => Promise.resolve(0)),
  grantXP: jest.fn(() => Promise.resolve(0)),
  previewGrantXP: jest.fn(() => Promise.resolve(0)),
  hasWordXpAwardedToday: jest.fn(() => Promise.resolve(false)),
  markWordXpAwardedToday: jest.fn(() => Promise.resolve()),
}));

import { useTypingGame } from '../features/vocabulary/useTypingGame';
import { recordReviewMistake } from '../features/vocabulary/reviewWordsStorage';

describe('typing near-misses', () => {
  it('reveals the answer on the second near-miss even with no combo, and queues the word for review', async () => {
    const words = [{ english: 'elephant', french: 'éléphant' }];
    const { result } = renderHook(() => useTypingGame(words));

    act(() => result.current.setTypedAnswer('elephent'));
    await act(async () => { await result.current.handleSubmit(); });
    expect(result.current.feedbackEvent?.type).toBe('close');
    expect(result.current.feedbackEvent?.text).toBe('So close — one more try!');
    expect(recordReviewMistake).not.toHaveBeenCalled();

    await act(async () => { await result.current.handleSubmit(); });
    expect(result.current.feedbackEvent?.type).toBe('wrong');
    expect(result.current.feedbackEvent?.answer).toBe('elephant');
    expect(recordReviewMistake).toHaveBeenCalledTimes(1);
  });
});
