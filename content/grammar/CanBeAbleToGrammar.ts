const CanBeAbleToGrammar = {
  id: '31',
  title: 'Can & Be Able To',
  description: 'Express ability in present and past using can, be able to, could, and was able to',
  imageUrl: 'https://wretggbpaejzjdilemit.supabase.co/storage/v1/object/public/lesson-images/15274719ab/can-and-be-able-to.webp',
  textContent: {
    cards: [
      {
        eyebrow: 'Can + base verbale',
        paragraph: 'Je parle de ce que je peux faire.',
        tip: 'Formule : sujet + can (ou can’t) + base verbale. Can ne change jamais.',
        columns: [
          {
            label: 'Sujet',
            accent: 'blue',
            rows: ['I', 'You', 'He / She / It', 'We', 'They'],
          },
          {
            label: 'Can (affirmatif) / Can’t (négatif)',
            accent: 'coral',
            rows: ['**Can**', '**Can’t**'],
          },
        ],
        examples: [
          { en: '**She can sleep** anywhere.', fr: 'Elle peut dormir n’importe où.' },
          { en: '**You can’t speak** Korean.', fr: 'Tu ne peux pas parler coréen.' },
        ],
      },
      {
        eyebrow: 'Be able to + base verbale',
        paragraph: 'On peut également utiliser be able to + base verbale.',
        columns: [
          {
            label: 'Be able to (selon le sujet)',
            accent: 'amber',
            rows: [
              'I **am** (not) able to',
              'You **are** (not) able to',
              'He / She / It **is** (not) able to',
              'We **are** (not) able to',
              'They **are** (not) able to',
            ],
          },
        ],
        examples: [
          { en: '**She is able to see** ghosts.', fr: 'Elle est capable de voir des fantômes.' },
          { en: '**You aren’t able to go** there.', fr: 'Tu n’es pas capable d’y aller.' },
        ],
      },
    ],
  },
translateExercises: [
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Je peux nager.",
    answer: "I can swim.",
    wordBank: ["I", "can", "can't", "swim."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Il peut chanter.",
    answer: "He can sing.",
    wordBank: ["He", "can", "can't", "sing."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Elle peut lire.",
    answer: "She can read.",
    wordBank: ["She", "can", "can't", "read."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Ils peuvent jouer.",
    answer: "They can play.",
    wordBank: ["They", "can", "can't", "play."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Nous pouvons cuisiner.",
    answer: "We can cook.",
    wordBank: ["We", "can", "can't", "cook."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Tu peux aider.",
    answer: "You can help.",
    wordBank: ["You", "can", "can't", "help."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Mon chat peut sauter.",
    answer: "My cat can jump.",
    wordBank: ["My cat", "can", "can't", "jump."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Papa est capable de le réparer.",
    answer: "Dad is able to fix it.",
    wordBank: ["Dad", "is", "isn't", "able", "to", "fix", "it."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Les enfants sont capables de grimper.",
    answer: "The children are able to climb.",
    wordBank: ["The children", "are", "aren't", "able", "to", "climb."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Je suis capable de le porter.",
    answer: "I am able to carry it.",
    wordBank: ["I", "am", "am not", "able", "to", "carry", "it."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Elle est capable de commencer.",
    answer: "She is able to start.",
    wordBank: ["She", "is", "isn't", "able", "to", "start."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Bob peut dessiner.",
    answer: "Bob can draw.",
    wordBank: ["Bob", "can", "can't", "draw."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Le chien est capable d’apprendre des tours.",
    answer: "The dog is able to learn tricks.",
    wordBank: ["The dog", "is", "isn't", "able", "to", "learn", "tricks."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Anna peut compter.",
    answer: "Anna can count.",
    wordBank: ["Anna", "can", "can't", "count."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Tom est capable d’ouvrir la porte.",
    answer: "Tom is able to open the door.",
    wordBank: ["Tom", "is", "isn't", "able", "to", "open", "the door."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Je ne peux pas courir vite.",
    answer: "I can't run fast.",
    wordBank: ["I", "can", "can't", "run", "fast."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Elle ne peut pas venir aujourd’hui.",
    answer: "She can't come today.",
    wordBank: ["She", "can", "can't", "come", "today."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Nous ne pouvons pas entrer.",
    answer: "We can't enter.",
    wordBank: ["We", "can", "can't", "enter."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Il n’est pas capable de conduire.",
    answer: "He isn't able to drive.",
    wordBank: ["He", "is", "isn't", "able", "to", "drive."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Les enfants ne sont pas capables de finir.",
    answer: "The children aren't able to finish.",
    wordBank: ["The children", "are", "aren't", "able", "to", "finish."]
  }
],

  exercises: [
    { question: 'I can swim.', answer: true, explanation: "Correct: 'can' + base verb." },
    { question: 'He can sing.', answer: true, explanation: "Correct: 'can' + base verb." },
    { question: 'She can read.', answer: true, explanation: "Correct: 'can' + base verb." },
    { question: 'They can play.', answer: true, explanation: "Correct: 'can' + base verb." },
    { question: 'We can cook.', answer: true, explanation: "Correct: 'can' + base verb." },
    { question: 'You can help.', answer: true, explanation: "Correct: 'can' + base verb." },
    { question: 'My cat can jump.', answer: true, explanation: "Correct: 'can' + base verb." },
    { question: 'Dad is able to fix it.', answer: true, explanation: "Correct: 'is able to' + base verb." },
    { question: 'The children are able to climb.', answer: true, explanation: "Correct: 'are able to' + base verb." },
    { question: 'I am able to carry it.', answer: true, explanation: "Correct: 'am able to' + base verb." },
    { question: 'She is able to start.', answer: true, explanation: "Correct: 'is able to' + base verb." },
    { question: 'Bob can draw.', answer: true, explanation: "Correct: 'can' + base verb." },
    { question: 'The dog is able to learn tricks.', answer: true, explanation: "Correct: 'is able to' + base verb." },
    { question: 'Anna can count.', answer: true, explanation: "Correct: 'can' + base verb." },
    { question: 'Tom is able to open the door.', answer: true, explanation: "Correct: 'is able to' + base verb." },

    { question: 'I can to dance.', answer: false, explanation: "Incorrect: do not use 'to' after 'can'." },
    { question: 'She cans write.', answer: false, explanation: "Incorrect: 'can' has no -s." },
    { question: 'They caned lift.', answer: false, explanation: "Incorrect: 'can' does not take -ed." },
    { question: 'We are able dance.', answer: false, explanation: "Incorrect: need 'to' after 'able'." },
    { question: 'You can running.', answer: false, explanation: "Incorrect: use base verb, not -ing after 'can'." },
    { question: 'My sister is able to sings.', answer: false, explanation: "Incorrect: use base verb after 'to'." },
    { question: 'Mark canes drive.', answer: false, explanation: "Incorrect: 'can' has no -es." },
    { question: 'Grandma able to eat.', answer: false, explanation: "Incorrect: missing auxiliary 'is'." },
    { question: 'Kids is able to sleep.', answer: false, explanation: "Incorrect: subject-verb agreement error with 'is'." },
    { question: 'I am able to lifts it.', answer: false, explanation: "Incorrect: use base verb after 'to'." },
    { question: 'She able to walk.', answer: false, explanation: "Incorrect: missing auxiliary 'is'." },
    { question: 'Sam can to speak.', answer: false, explanation: "Incorrect: drop 'to' after 'can'." },
    { question: 'They able see.', answer: false, explanation: "Incorrect: missing 'to' and auxiliary 'are'." },
    { question: 'Peter can cooking.', answer: false, explanation: "Incorrect: use base verb after 'can', not -ing." },
    { question: 'Lucy is able open.', answer: false, explanation: "Incorrect: need 'to' after 'able'." }
  ]
};

export default CanBeAbleToGrammar;
