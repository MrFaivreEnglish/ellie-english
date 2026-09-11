import { render } from '@testing-library/react-native';

jest.mock('../features/shared/soundEffects', () => ({
  BEST_SUCCESS_SOUND: null,
  BIG_SUCCESS_SOUND: null,
  SOUND_EFFECT_OPTIONS: {},
  SUCCESS_SOUND: null,
  replaySoundEffect: jest.fn(),
}));

import VocabularyFlashcard from '../features/vocabulary/VocabularyFlashcard';

const mockWords = [
  { english: 'hello', french: 'bonjour' },
  { english: 'goodbye', french: 'au revoir' },
] as any;

const mockColors = {} as any;

describe('VocabularyFlashcard', () => {
  it('renders the current card and its navigation controls', () => {
    const { toJSON, getByText } = render(
      <VocabularyFlashcard
        words={mockWords}
        currentIndex={0}
        reverseDirection={false}
        onNext={jest.fn()}
        onPrevious={jest.fn()}
        onShuffle={jest.fn()}
        onToggleDirection={jest.fn()}
        colors={mockColors}
        isDarkMode={false}
      />
    );

    expect(toJSON()).toBeTruthy();
    expect(getByText('hello')).toBeTruthy();
  });
});
