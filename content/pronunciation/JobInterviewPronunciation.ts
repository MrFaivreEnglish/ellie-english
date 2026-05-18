import type { PronunciationCategory } from './pronunciationTypes';

export const jobInterviewPronunciation: PronunciationCategory = {
  title: 'Job Interview',
  emoji: '\uD83D\uDCBC',
  color: '#F0A35E',
  lessons: [
    {
      title: 'Get ready for a job interview',
      subtitle: 'I would like to... because...',
      category: 'Job Interview',
      goal: 'Answer simple job interview questions with clear, prepared phrases.',
      focus: 'Polite answers, present perfect, and sentence stress',
      tip: 'Stress the reason in your answer: help, earn money, learn, experience, qualities. Keep I would like to smooth: I\'d like to.',
      imageUrl: 'https://i.ibb.co/B2dHkXJD/Get-ready-for-A-job-interview.png',
      examples: [
        'interview',
        'experience',
        'qualities',
        'because',
        'since',
        'for',
        'earn',
        'learn',
      ],
      usefulPhrases: [
        'My name is...',
        'I am... years old.',
        "I'd like to be a... because...",
        'I would like to ...',
        'I like helping ...',
        'In my opinion, I am...',
        'I think I am...',
        'I have worked since...',
        'I have worked for...',
      ],
      ruleCards: [
        {
          title: 'Start',
          description: 'Introduce yourself clearly and slowly.',
          examples: ['My name is...', 'I am... years old.', 'I live in...'],
        },
        {
          title: 'Motivation',
          description: 'Use would like to for a polite answer.',
          examples: [
            "I'd like to be a...",
            'I would like to help people.',
            'I would like to learn.',
          ],
        },
        {
          title: 'Experience',
          description: 'Use have + past participle. Add since for a starting date and for for a duration.',
          examples: [
            'I have worked.',
            'I have worked since June.',
            'I have worked for two weeks.',
          ],
        },
        {
          title: 'Qualities',
          description: 'Use short confident phrases, then give one example if you can.',
          examples: ['I am serious.', 'I am motivated.', 'I am punctual.'],
        },
      ],
      commonMistake: 'Do not answer only yes or no. Add a reason: Yes, I have. I have worked for two weeks.',
    },
  ],
};
