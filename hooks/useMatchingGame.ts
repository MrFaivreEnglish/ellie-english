import { useState, useEffect, useMemo } from 'react';

export function useMatchingGame(words: any[]) {
  const PAIRS_PER_SET = 6;

  // ---------------- STATE (like typing hook) ----------------
  const [selectedCard, setSelectedCard] = useState<any>(null);
  const [matchedPairs, setMatchedPairs] = useState<number[]>([]);
  const [typingFeedback, setTypingFeedback] =
    useState<'correct' | 'wrong' | 'close' | null>(null);

  const [sessionScore, setSessionScore] = useState(0);
  const [streak, setStreak] = useState(0);

  const [feedbackEvent, setFeedbackEvent] = useState<null | {
    type: 'correct' | 'wrong' | 'close';
    text: string;
    streak: number;
  }>(null);

  const [currentSet, setCurrentSet] = useState(0);
  const [isLocked, setIsLocked] = useState(false);

  // ---------------- GAME DATA ----------------
  const shuffle = (arr: any[]) => [...arr].sort(() => Math.random() - 0.5);

  const matchingGamePairs = useMemo(() => {
    const start = currentSet * PAIRS_PER_SET;
    const setWords = words.slice(start, start + PAIRS_PER_SET);

    const english = shuffle(
      setWords.map((w, i) => ({
        id: start + i,
        text: w.english,
        pairId: start + i,
        side: 'en',
      }))
    );

    const french = shuffle(
      setWords.map((w, i) => ({
        id: start + i + 1000,
        text: w.french,
        pairId: start + i,
        side: 'fr',
      }))
    );

    return { english, french };
  }, [words, currentSet]);

  // ---------------- MAIN LOGIC ----------------
  const handleCardPress = (card: any) => {
    if (isLocked) return;

    // first selection
    if (!selectedCard) {
      setSelectedCard(card);
      return;
    }

    // same card tapped
    if (selectedCard.id === card.id) return;

    setIsLocked(true);

    const isMatch = selectedCard.pairId === card.pairId;

    if (isMatch) {
      setTypingFeedback('correct');

      setFeedbackEvent({
        type: 'correct',
        text: 'Match!',
        streak: streak + 1,
      });

      setMatchedPairs(prev => [...prev, selectedCard.id, card.id]);

      const newStreak = streak + 1;
      setStreak(newStreak);
      setSessionScore(prev => prev + 1);

      setSelectedCard(null);
      setIsLocked(false);
    } else {
      setTypingFeedback('wrong');

      setFeedbackEvent({
        type: 'wrong',
        text: 'Try again',
        streak: 0,
      });

      setStreak(0);

      setTimeout(() => {
        setSelectedCard(null);
        setIsLocked(false);
      }, 600);
    }
  };

  // ---------------- RESET (like typing reset) ----------------
  const reset = () => {
    setSelectedCard(null);
    setMatchedPairs([]);
    setTypingFeedback(null);
    setSessionScore(0);
    setStreak(0);
    setCurrentSet(0);
    setFeedbackEvent(null);
    setIsLocked(false);
  };

  // ---------------- SET ADVANCE (optional helper) ----------------
  const advanceSet = () => {
    setCurrentSet(prev => prev + 1);
    setMatchedPairs([]);
    setSelectedCard(null);
    setIsLocked(false);
  };

  return {
    // state (mirrors typing hook style)
    selectedCard,
    matchedPairs,
    typingFeedback,
    sessionScore,
    streak,
    currentSet,
    feedbackEvent,

    // game data
    matchingGamePairs,

    // actions
    handleCardPress,
    reset,
    advanceSet,
  };
}