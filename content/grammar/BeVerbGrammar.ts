const BeVerbGrammar = {
  id: '43',
  title: 'Le verbe BE',
  description: 'Present and past forms of the verb to be: am/is/are, was/were',
  imageUrl: 'https://i.ibb.co/QBtZC55/Be.png',
  textContent: {
    cards: [
      {
        eyebrow: 'Forme positive',
        paragraph: 'Je parle de mon nom, mon âge, ma personnalité, d’où je viens...',
        columns: [
          {
            label: 'Forme complète',
            accent: 'blue',
            rows: ['I **am**', 'You **are**', 'He / She / It **is**', 'We **are**', 'They **are**'],
          },
          {
            label: 'Forme contractée (à l’oral)',
            accent: 'teal',
            rows: ["I**’m**", "You**’re**", "He / She / It**’s**", "We**’re**", "They**’re**"],
          },
        ],
        examples: [
          { en: '**I am** Emma. **She is** Chloe.', fr: 'Je suis Emma. C’est Chloé.' },
          { en: '**You are** 12 years old. **I am** 8.', fr: 'Tu as 12 ans. J’ai 8 ans.' },
        ],
      },
      {
        eyebrow: 'Forme négative',
        tip: 'À l’oral, on peut contracter : is not → isn’t, are not → aren’t.',
        columns: [
          {
            label: 'Forme complète',
            accent: 'coral',
            rows: ['I **am not**', 'You **are not**', 'He / She / It **is not**', 'We **are not**', 'They **are not**'],
          },
          {
            label: 'Forme contractée',
            accent: 'amber',
            rows: ["I**’m not**", 'You **aren’t**', 'He / She / It **isn’t**', 'We **aren’t**', 'They **aren’t**'],
          },
        ],
        examples: [
          { en: '**I am not** Emma. I’m Chloe.', fr: 'Je ne suis pas Emma. Je suis Chloé.' },
          { en: '**You are not** very nice.', fr: 'Tu n’es pas très gentil.' },
        ],
      },
    ],
  },
translateExercises: [
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Je suis heureux.",
    answer: "I am happy.",
    wordBank: ["I", "am", "is", "are", "happy."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Tu es très gentil.",
    answer: "You are very kind.",
    wordBank: ["You", "am", "is", "are", "very", "kind."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Il est médecin.",
    answer: "He is a doctor.",
    wordBank: ["He", "am", "is", "are", "a doctor."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Elle est professeure.",
    answer: "She is a teacher.",
    wordBank: ["She", "am", "is", "are", "a teacher."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Nous sommes prêts à partir.",
    answer: "We are ready to go.",
    wordBank: ["We", "am", "is", "are", "ready", "to", "go."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Ils sont à la maison.",
    answer: "They are at home.",
    wordBank: ["They", "am", "is", "are", "at", "home."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Le chat est sur le toit.",
    answer: "The cat is on the roof.",
    wordBank: ["The cat", "am", "is", "are", "on", "the roof."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Mon frère est grand.",
    answer: "My brother is tall.",
    wordBank: ["My brother", "am", "is", "are", "tall."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Le livre est lourd.",
    answer: "The book is heavy.",
    wordBank: ["The book", "am", "is", "are", "heavy."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Il fait froid aujourd’hui.",
    answer: "It is cold today.",
    wordBank: ["It", "am", "is", "are", "cold", "today."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Les fleurs sont belles.",
    answer: "The flowers are beautiful.",
    wordBank: ["The flowers", "am", "is", "are", "beautiful."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Je ne suis pas sûr.",
    answer: "I am not sure.",
    wordBank: ["I", "am not", "is not", "are not", "sure."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Tu es très intelligent.",
    answer: "You are very clever.",
    wordBank: ["You", "am", "is", "are", "very", "clever."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Il n’est pas ici.",
    answer: "He is not here.",
    wordBank: ["He", "am not", "is not", "are not", "here."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Elle est à la maison.",
    answer: "She is at home.",
    wordBank: ["She", "am", "is", "are", "at", "home."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Nous sommes amis.",
    answer: "We are friends.",
    wordBank: ["We", "am", "is", "are", "friends."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Ils sont à l’école.",
    answer: "They are at school.",
    wordBank: ["They", "am", "is", "are", "at", "school."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Le chien est amical.",
    answer: "The dog is friendly.",
    wordBank: ["The dog", "am", "is", "are", "friendly."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "La maison est grande.",
    answer: "The house is big.",
    wordBank: ["The house", "am", "is", "are", "big."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Il fait beau.",
    answer: "The weather is nice.",
    wordBank: ["The weather", "am", "is", "are", "nice."]
  }
],

  exercises: [
    { question: 'I ___ happy.', answer: 'am', options: ['am', 'is', 'are'] },
    { question: 'You ___ very kind.', answer: 'are', options: ['am', 'is', 'are'] },
    { question: 'He ___ a doctor.', answer: 'is', options: ['am', 'is', 'are'] },
    { question: 'She ___ a teacher.', answer: 'is', options: ['am', 'is', 'are'] },
    { question: 'We ___ ready to go.', answer: 'are', options: ['am', 'is', 'are'] },
    { question: 'They ___ at home.', answer: 'are', options: ['am', 'is', 'are'] },
    { question: 'The cat ___ on the roof.', answer: 'is', options: ['am', 'is', 'are'] },
    { question: 'My brother ___ tall.', answer: 'is', options: ['am', 'is', 'are'] },
    { question: 'The book ___ heavy.', answer: 'is', options: ['am', 'is', 'are'] },
    { question: 'It ___ cold today.', answer: 'is', options: ['am', 'is', 'are'] },
    { question: 'The flowers ___ beautiful.', answer: 'are', options: ['am', 'is', 'are'] },
    { question: 'I ___ not sure.', answer: 'am', options: ['am', 'is', 'are'] },
    { question: 'You ___ very clever.', answer: 'are', options: ['am', 'is', 'are'] },
    { question: 'He ___ not here.', answer: 'is', options: ['am', 'is', 'are'] },
    { question: 'She ___ at home.', answer: 'is', options: ['am', 'is', 'are'] },
    { question: 'We ___ friends.', answer: 'are', options: ['am', 'is', 'are'] },
    { question: 'They ___ at school.', answer: 'are', options: ['am', 'is', 'are'] },
    { question: 'The dog ___ friendly.', answer: 'is', options: ['am', 'is', 'are'] },
    { question: 'The house ___ big.', answer: 'is', options: ['am', 'is', 'are'] },
    { question: 'The weather ___ nice.', answer: 'is', options: ['am', 'is', 'are'] },
    { question: 'The baby ___ sleeping.', answer: 'is', options: ['am', 'is', 'are'] },
    { question: 'The windows ___ open.', answer: 'are', options: ['am', 'is', 'are'] },
    { question: 'The soup ___ hot.', answer: 'is', options: ['am', 'is', 'are'] },
    { question: 'The sky ___ blue.', answer: 'is', options: ['am', 'is', 'are'] },
    { question: 'He ___ late.', answer: 'is', options: ['am', 'is', 'are'] }
  ]
};

export default BeVerbGrammar;
