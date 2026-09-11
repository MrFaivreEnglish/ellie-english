import { useEffect, useMemo, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { Word } from '../../types/VocabularyTypes';
import { triggerSelectionHaptic, triggerSuccessHaptic } from '../shared/haptics';
import { shuffleArray } from './vocabularyUtils';
import {
  getLearnedFlashcardKeys,
  recordLearnedFlashcardToday,
  saveLearnedFlashcardKeys,
} from './flashcardProgressStorage';
import { markPracticeActivityToday } from '../progress/xpStorage';
import type { VocabularyMode } from './useLessonSheetLayout';

const vocabularyWordKey = (word: Word) => `${word.english.trim().toLowerCase()}|${word.french.trim().toLowerCase()}`;
const getInitialReverseDirection = (lesson: any) => !!lesson?.initialReverseDirection;







export function useVocabularyFlashcards(
  filteredWords: Word[],
  lesson: any,
  flashcardProgressLessonKey: string,
  setSheetMode: Dispatch<SetStateAction<VocabularyMode | null>>,
  setCompletionVisible: Dispatch<SetStateAction<boolean>>,
  onReviewAllLearned: () => void
) {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [reverseDirection, setReverseDirection] = useState(() => getInitialReverseDirection(lesson));
  const [flashcardDeckWords, setFlashcardDeckWords] = useState<Word[]>([]);
  const [shuffledFlashcards, setShuffledFlashcards] = useState<Word[]>([]);
  const [isFlashcardDeckShuffled, setIsFlashcardDeckShuffled] = useState(false);
  const [learnedFlashcardKeys, setLearnedFlashcardKeys] = useState<Set<string>>(new Set());
  const [learnedFlashcardKeysLoaded, setLearnedFlashcardKeysLoaded] = useState(false);
  const [knownFlashcardKeys, setKnownFlashcardKeys] = useState<Set<string>>(new Set());
  const [reviewFlashcardKeys, setReviewFlashcardKeys] = useState<Set<string>>(new Set());
  const [seenBackFlashcardKeys, setSeenBackFlashcardKeys] = useState<Set<string>>(new Set());
  const [flashcardProgressModeEnabled, setFlashcardProgressModeEnabled] = useState(false);

  const currentFlashcardWord = shuffledFlashcards[currentWordIndex] ?? null;
  const currentFlashcardKey = currentFlashcardWord ? vocabularyWordKey(currentFlashcardWord) : null;
  const currentFlashcardLearned = !!currentFlashcardKey && learnedFlashcardKeys.has(currentFlashcardKey);
  const learnedFlashcardCount = useMemo(
    () => filteredWords.reduce(
      (total: number, word: Word) => total + (learnedFlashcardKeys.has(vocabularyWordKey(word)) ? 1 : 0),
      0
    ),
    [filteredWords, learnedFlashcardKeys]
  );
  const currentWordReadyToMarkKnown = !!currentFlashcardKey && seenBackFlashcardKeys.has(currentFlashcardKey);


  useEffect(() => {
    let active = true;
    setLearnedFlashcardKeys(new Set());
    setLearnedFlashcardKeysLoaded(false);

    getLearnedFlashcardKeys(flashcardProgressLessonKey).then((keys) => {
      if (active) {
        setLearnedFlashcardKeys(keys);
        setLearnedFlashcardKeysLoaded(true);
      }
    }).catch(() => {});

    return () => {
      active = false;
    };
  }, [flashcardProgressLessonKey]);





  useEffect(() => {
    if (filteredWords.length > 0) {
      setFlashcardDeckWords(filteredWords);
      setCurrentWordIndex(0);
      setIsFlipped(false);
      setReverseDirection(getInitialReverseDirection(lesson));
      setIsFlashcardDeckShuffled(false);
      setShuffledFlashcards(filteredWords);
      setKnownFlashcardKeys(new Set());
      setReviewFlashcardKeys(new Set());
      setSeenBackFlashcardKeys(new Set());
      setFlashcardProgressModeEnabled(false);
      return;
    }

    setFlashcardDeckWords([]);
    setShuffledFlashcards([]);
    setCurrentWordIndex(0);
    setIsFlashcardDeckShuffled(false);
    setIsFlipped(false);
  }, [filteredWords, lesson]);

  const handleFlashcardFlip = () => {
    triggerSelectionHaptic();
    const willShowBack = !isFlipped;
    setIsFlipped(willShowBack);

    if (willShowBack && currentFlashcardKey) {
      setSeenBackFlashcardKeys((prev) => {
        const next = new Set(prev);
        next.add(currentFlashcardKey);
        return next;
      });
    }
  };

  const shuffleFlashcards = () => {
    const wordsForDeck = flashcardDeckWords.length > 0 ? flashcardDeckWords : shuffledFlashcards;
    if (!wordsForDeck.length) return;

    triggerSelectionHaptic();
    setCurrentWordIndex(0);
    setIsFlipped(false);

    if (isFlashcardDeckShuffled) {
      setIsFlashcardDeckShuffled(false);
      setShuffledFlashcards(wordsForDeck);
      return;
    }

    setIsFlashcardDeckShuffled(true);
    setShuffledFlashcards(shuffleArray(wordsForDeck));
  };

  const goToNextWord = () => {
    if (currentWordIndex < shuffledFlashcards.length - 1) {
      triggerSelectionHaptic();
    }

    setCurrentWordIndex((p) => {
      if (p >= shuffledFlashcards.length - 1) {
        return p;
      }
      return p + 1;
    });

    setIsFlipped(false);
  };

  const goToPrevWord = () => {
    if (currentWordIndex > 0) {
      triggerSelectionHaptic();
    }

    setCurrentWordIndex((p) => {
      if (p <= 0) {
        return p;
      }
      return p - 1;
    });

    setIsFlipped(false);
  };

  const restartFlashcardDeck = (wordsForDeck: Word[]) => {
    setFlashcardDeckWords(wordsForDeck);
    setShuffledFlashcards(wordsForDeck);
    setCurrentWordIndex(0);
    setIsFlipped(false);
    setIsFlashcardDeckShuffled(false);
  };

  const reviewFlashcardWords = (wordsForReview: Word[]) => {
    if (!wordsForReview.length) return;

    setCompletionVisible(false);
    setFlashcardDeckWords(wordsForReview);
    setShuffledFlashcards(wordsForReview);
    setCurrentWordIndex(0);
    setIsFlipped(false);
    setIsFlashcardDeckShuffled(false);
    setSheetMode('flashcards');
  };

  const startLearnedReviewGame = () => {
    if (!filteredWords.length || learnedFlashcardCount < filteredWords.length) return;

    triggerSuccessHaptic();
    onReviewAllLearned();
  };

  const handleToggleCurrentFlashcardLearned = () => {
    const currentWord = shuffledFlashcards[currentWordIndex];
    if (!currentWord) return;

    const key = vocabularyWordKey(currentWord);
    const alreadyLearned = learnedFlashcardKeys.has(key);
    if (!alreadyLearned && !seenBackFlashcardKeys.has(key)) return;

    const nextLearned = !alreadyLearned;
    if (nextLearned) {
      triggerSuccessHaptic();
    } else {
      triggerSelectionHaptic();
    }

    setLearnedFlashcardKeys((prev) => {
      const next = new Set(prev);

      if (nextLearned) {
        next.add(key);
      } else {
        next.delete(key);
      }

    void saveLearnedFlashcardKeys(flashcardProgressLessonKey, next);
      return next;
    });

    if (nextLearned) {
      void markPracticeActivityToday(`vocabulary:flashcard-learnt:${lesson.title}:${key}`);
    }

    void recordLearnedFlashcardToday(flashcardProgressLessonKey, key, nextLearned);
  };

  const handleMarkFlashcardKnown = () => {
    const currentWord = shuffledFlashcards[currentWordIndex];
    if (!currentWord) return;

    const key = vocabularyWordKey(currentWord);
    const alreadyKnown = knownFlashcardKeys.has(key);

    if (!alreadyKnown) {
      void markPracticeActivityToday(`vocabulary:flashcard:${lesson.title}:${key}`);

      setKnownFlashcardKeys((prev) => {
        const next = new Set(prev);
        next.add(key);
        return next;
      });
    }

    if (currentWordIndex < shuffledFlashcards.length - 1) {
      goToNextWord();
      return;
    }

  };

  const handleMarkFlashcardForReview = () => {
    const currentWord = shuffledFlashcards[currentWordIndex];
    if (!currentWord) return;

    const key = vocabularyWordKey(currentWord);

    setReviewFlashcardKeys((prev) => {
      const next = new Set(prev);
      next.add(key);
      return next;
    });

    if (currentWordIndex < shuffledFlashcards.length - 1) {
      goToNextWord();
      return;
    }

    const reviewWords = filteredWords.filter(
      (word: Word) => reviewFlashcardKeys.has(vocabularyWordKey(word)) || vocabularyWordKey(word) === key
    );

    if (reviewWords.length > 0) {
      restartFlashcardDeck(reviewWords);
    }
  };

  return {
    currentWordIndex,
    isFlipped,
    setIsFlipped,
    reverseDirection,
    setReverseDirection,
    flashcardDeckWords,
    shuffledFlashcards,
    isFlashcardDeckShuffled,
    learnedFlashcardKeys,
    learnedFlashcardKeysLoaded,
    knownFlashcardKeys,
    reviewFlashcardKeys,
    seenBackFlashcardKeys,
    flashcardProgressModeEnabled,
    setFlashcardProgressModeEnabled,
    currentFlashcardWord,
    currentFlashcardKey,
    currentFlashcardLearned,
    learnedFlashcardCount,
    currentWordReadyToMarkKnown,
    handleFlashcardFlip,
    shuffleFlashcards,
    goToNextWord,
    goToPrevWord,
    restartFlashcardDeck,
    reviewFlashcardWords,
    startLearnedReviewGame,
    handleToggleCurrentFlashcardLearned,
    handleMarkFlashcardKnown,
    handleMarkFlashcardForReview,
  };
}
