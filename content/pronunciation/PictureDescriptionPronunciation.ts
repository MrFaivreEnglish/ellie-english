import type { PronunciationCategory } from './pronunciationTypes';

export const pictureDescriptionPronunciation: PronunciationCategory = {
  title: 'Describe A Picture',
  emoji: '\uD83D\uDDBC',
  color: '#8FB3C7',
  lessons: [
    {
      title: 'Describe what you see',
      subtitle: 'In the picture, I can see...',
      category: 'Describe A Picture',
      goal: 'Prepare useful sentences for picture description.',
      focus: 'There is / there are rhythm',
      tip: 'Say there is like one small chunk. Stress the important noun after it.',
      examples: ['picture', 'background', 'left', 'right', 'people'],
      usefulPhrases: [
        'In the picture, I can see...',
        'There is a person.',
        'There are two people.',
        'In the background, there is...',
        'On the left, I can see...',
      ],
    },
  ],
};
