import type { PronunciationCategory } from './pronunciationTypes';

export const oralExamPronunciation: PronunciationCategory = {
  title: 'Oral Exam',
  emoji: '\uD83C\uDFA4',
  color: '#CFA6E8',
  lessons: [
    {
      title: 'Present a document',
      subtitle: 'This document is about...',
      category: 'Oral Exam',
      goal: 'Speak more clearly during an oral presentation.',
      focus: 'Chunks and sentence stress',
      tip: 'Prepare useful chunks. Stress the key words: document, about, first, finally, conclude.',
      examples: ['document', 'about', 'first', 'finally', 'conclude'],
      usefulPhrases: [
        'This document is about...',
        'First, I will present...',
        'Then, I will explain...',
        'To conclude...',
        'I would like to talk about...',
      ],
    },
  ],
};
