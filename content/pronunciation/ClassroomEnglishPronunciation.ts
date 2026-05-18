import type { PronunciationCategory } from './pronunciationTypes';

export const classroomEnglishPronunciation: PronunciationCategory = {
  title: 'Classroom English',
  emoji: '\uD83C\uDF92',
  color: '#EF6F6C',
  lessons: [
    {
      title: 'Ask for help',
      subtitle: 'Can you repeat, please?',
      category: 'Classroom English',
      goal: 'Ask for help clearly during class.',
      focus: 'Sentence stress and polite classroom phrases',
      tip: 'Stress the important word: repeat, understand, say. Keep please soft and polite.',
      examples: ['repeat', 'understand', 'please', 'English'],
      usefulPhrases: [
        'Can you repeat, please?',
        "I don't understand.",
        'How do you say this in English?',
        'Can you help me, please?',
      ],
    },
    {
      title: 'Give an answer',
      subtitle: 'I think...',
      category: 'Classroom English',
      goal: 'Take part in class without freezing.',
      focus: 'TH sound and confident sentence rhythm',
      tip: 'For think, put your tongue gently between your teeth. Then say the rest of the sentence smoothly.',
      examples: ['think', 'three', 'this', 'answer'],
      usefulPhrases: [
        'I think the answer is...',
        'This is my answer.',
        'I agree with you.',
        'I am not sure.',
      ],
    },
  ],
};
