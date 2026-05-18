import type { PronunciationCategory } from './pronunciationTypes';

export const aboutMePronunciation: PronunciationCategory = {
  title: 'About Me',
  emoji: '\uD83D\uDC4B',
  color: '#31A87C',
  lessons: [
    {
      title: 'Introduce yourself',
      subtitle: 'My name is...',
      category: 'About Me',
      goal: 'Say basic personal information naturally.',
      focus: 'Contractions and final consonants',
      tip: "I'm is faster and more natural than I am in normal speaking. Finish words like live and like clearly.",
      examples: ["I'm", 'name', 'live', 'like', 'French'],
      usefulPhrases: [
        'My name is...',
        "I'm thirteen years old.",
        'I live in...',
        "I'm French.",
      ],
    },
    {
      title: 'Talk about likes',
      subtitle: 'I like / I love / I prefer',
      category: 'About Me',
      goal: 'Talk about hobbies and tastes.',
      focus: 'Final consonants and v sound',
      tip: 'Do not drop the last sound in like. For love, use your top teeth on your bottom lip for v.',
      examples: ['like', 'love', 'prefer', 'favourite', 'video games'],
      usefulPhrases: [
        'I like playing football.',
        'I love video games.',
        'My favourite sport is...',
        'I prefer music.',
      ],
    },
  ],
};
