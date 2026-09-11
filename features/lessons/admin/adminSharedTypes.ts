import React from 'react';
import MaterialIcons from '../../shared/ThemedMaterialIcon';

export type MaterialIconName = React.ComponentProps<typeof MaterialIcons>['name'];

export type ValidationTone = 'success' | 'warning' | 'error' | 'neutral';
export type AdminTab = 'chapterLinks' | 'customChapters' | 'vocabularyLessons' | 'qa';

export type QaSnapshot = {
  xp: number;
  learnedWords: number;
  learnedLessons: number;
  grammarAnswers: number;
  grammarLessons: number;
  timerBestCount: number;
};

export const emptyQaSnapshot: QaSnapshot = {
  xp: 0,
  learnedWords: 0,
  learnedLessons: 0,
  grammarAnswers: 0,
  grammarLessons: 0,
  timerBestCount: 0,
};
