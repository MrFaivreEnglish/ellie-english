import type { ResourceCategory } from './lessonTypes';

export const resourceCategories: ResourceCategory[] = [
  {
    title: 'Find vocabulary: Dictionaries',
    icon: '🔎',
    color: '#EF6F6C',
    resources: [
      {
        title: 'WordReference',
        description: 'Check a French-English translation and read real examples.',
        url: 'https://www.wordreference.com/',
      },
      {
        title: 'Cambridge Learner Dictionary',
        description: 'Simple English definitions, examples, and pronunciation audio.',
        url: 'https://dictionary.cambridge.org/dictionary/learner-english/',
      },
    ],
  },
  {
    title: 'Create and Play',
    icon: '\uD83C\uDFAE',
    color: '#F4A261',
    resources: [
      {
        title: 'Flashcards Auto',
        description: 'Create flashcards quickly and practise vocabulary.',
        url: 'https://flashcardsauto.netlify.app/',
      },
      {
        title: 'Crosswords Auto',
        description: 'Create crossword games from your own words.',
        url: 'https://crosswordsauto.netlify.app/',
      },
      {
        title: 'LearningApps',
        description: 'Find or create small learning games and activities.',
        url: 'https://learningapps.org/',
      },
    ],
  },
  {
    title: 'Improve pronunciation',
    icon: '🔊',
    color: '#CFA6E8',
    resources: [
      {
        title: 'Howjsay.com',
        description: 'Search for pronunciation of tricky words.',
        url: 'https://howjsay.com/',
      },
      {
        title: 'BBC Pronunciation',
        description: 'British English sounds, stress, and pronunciation videos.',
        url: 'https://www.bbc.co.uk/learningenglish/english/features/pronunciation',
      },
    ],
  },
  {
    title: 'Practice listening',
    icon: '🎧',
    color: '#31A87C',
    resources: [
      {
        title: 'BBC Learning English',
        description: 'Short videos and audio lessons for English learners.',
        url: 'https://www.bbc.co.uk/learningenglish',
      },
      {
        title: 'BBC 6 Minute English',
        description: 'Short listening lessons with transcripts when you need support.',
        url: 'https://www.bbc.co.uk/learningenglish/english/features/6-minute-english',
      },
      {
        title: 'Learn English with TV Series',
        description: 'Listening and video activities from concrete examples.',
        url: 'https://www.youtube.com/c/LearnEnglishWithTVSeries',
      },
      {
        title: 'France 24 English',
        description: 'Short news videos from French channel France 24.',
        url: 'https://www.youtube.com/@France24_en',
      },
    ],
  },
  {
    title: 'Read in English',
    icon: '📖',
    color: '#8FB3C7',
    resources: [
      {
        title: 'BBC.com',
        description: 'News in English',
        url: 'https://www.bbc.com/',
      },
      {
        title: 'Breaking News English',
        description: 'News texts with audio, vocabulary, and practice activities.',
        url: 'https://breakingnewsenglish.com/',
      },
    ],
  },
];
