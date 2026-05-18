import type { PronunciationCategory } from './pronunciationTypes';

export const pastStoriesPronunciation: PronunciationCategory = {
  title: 'Past Stories',
  emoji: '\u23F0',
  color: '#F0A7D8',
  lessons: [
    {
      title: 'Tell a past story',
      subtitle: 'I watched / I played / I visited',
      category: 'Past Stories',
      goal: 'Say regular past verbs clearly.',
      focus: '-ed endings: /t/, /d/ or /id/',
      tip: 'Only add an extra syllable for wanted, needed, visited, decided. Do not say play-ed for played.',
      imageUrl: 'https://i.ibb.co/rf11mY1f/Pronounciation.png',
      examples: ['watched', 'played', 'visited', 'wanted', 'liked', 'loved'],
      usefulPhrases: [
        'I watched a film.',
        'I played football.',
        'I visited London.',
        'It was fun.',
      ],
      ruleCards: [
        {
          title: '/t/',
          description: 'After a quiet sound: p, k, f, s, sh, ch.',
          examples: ['watched', 'liked', 'helped', 'finished'],
        },
        {
          title: '/d/',
          description: 'After a voiced sound: b, g, v, m, n, l, r, vowel sounds.',
          examples: ['played', 'loved', 'opened', 'called'],
        },
        {
          title: '/id/',
          description: 'Only after t or d. This is the extra syllable.',
          examples: ['wanted', 'needed', 'visited', 'decided'],
        },
      ],
      commonMistake: 'Do not add an extra syllable every time. Played is one syllable. Wanted is two syllables.',
    },
  ],
};
