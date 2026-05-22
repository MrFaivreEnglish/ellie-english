import { useEffect, useMemo, useState } from 'react';
import { Word } from '../../types/VocabularyTypes';

type Params = {
  words: Word[];
};

export function useFlashcards({ words }: Params) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [reverseDirection, setReverseDirection] = useState(false);
  const [shuffledWords, setShuffledWords] = useState<Word[]>([]);

  // Initialize + reshuffle when words change
  useEffect(() => {
    if (!words || words.length === 0) {
      setShuffledWords([]);
      setCurrentIndex(0);
      setIsFlipped(false);
      return;
    }

    const shuffled = [...words].sort(() => Math.random() - 0.5);
    setShuffledWords(shuffled);
    setCurrentIndex(0);
    setIsFlipped(false);
  }, [words]);

  // Actions
  const flip = () => {
    setIsFlipped(prev => !prev);
  };

  const next = () => {
    setCurrentIndex(prev => {
      const max = shuffledWords.length - 1;
      if (prev < max) {
        setIsFlipped(false);
        return prev + 1;
      }
      return prev;
    });
  };

  const prev = () => {
    setCurrentIndex(prev => {
      if (prev > 0) {
        setIsFlipped(false);
        return prev - 1;
      }
      return prev;
    });
  };

  const shuffle = () => {
    setShuffledWords(prev => [...prev].sort(() => Math.random() - 0.5));
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  const toggleDirection = () => {
    setReverseDirection(prev => !prev);
    setIsFlipped(false);
  };

  const reset = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  return {
    // state
    currentIndex,
    isFlipped,
    reverseDirection,
    shuffledWords,

    // actions
    flip,
    next,
    prev,
    shuffle,
    toggleDirection,
    setReverseDirection,

    // utility
    reset,
  };
}