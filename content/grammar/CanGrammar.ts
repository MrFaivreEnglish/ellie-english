const CanGrammar = {
  id: '21',
  title: 'Can',
  description: 'Learn how to use the modal verb can.',
  imageUrl: 'https://wretggbpaejzjdilemit.supabase.co/storage/v1/object/public/lesson-images/15274719ab/can.webp',
  textContent: {
    cards: [
      {
        eyebrow: 'Ce que je peux (ou sais) faire',
        paragraph: 'Je parle de ce que je peux (ou sais) faire.',
        tip: 'Formule : sujet + can + base verbale. Can ne change jamais (pas de -s, pas de "to").',
        columns: [
          {
            label: 'Sujet + CAN (invariable) + base verbale',
            accent: 'blue',
            rows: ['I', 'You', 'He / She / It', 'We', 'They'],
          },
        ],
        examples: [
          { en: 'Yes, **I can speak** English well.', fr: 'Oui, je sais bien parler anglais.' },
          { en: '**We can be** friends.', fr: 'Nous pouvons être amis.' },
        ],
      },
      {
        eyebrow: 'Ce que je ne peux (ou ne sais) pas faire',
        paragraph: "Formule : sujet + can't + base verbale.",
        examples: [
          { en: "No, **Lyra can't swim**.", fr: 'Non, Lyra ne sait pas nager.' },
          { en: "**They can't speak**.", fr: 'Ils ne peuvent pas se parler.' },
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
      wordBank: ["I", "can", "swim.", "can't", "swimming"]
    },
    {
      type: 'translate',
      question: 'Translate into English.',
      prompt: "Ils peuvent parler français.",
      answer: "They can speak French.",
      wordBank: ["They", "can", "speak", "French.", "can't", "speaking"]
    },
    {
      type: 'translate',
      question: 'Translate into English.',
      prompt: "Il ne sait pas faire du vélo.",
      answer: "He can't ride a bike.",
      wordBank: ["He", "can't", "ride", "a", "bike.", "can", "riding"]
    },
    {
      type: 'translate',
      question: 'Translate into English.',
      prompt: "Tu peux bien chanter.",
      answer: "You can sing well.",
      wordBank: ["You", "can", "sing", "well.", "can't", "sings"]
    },
    {
      type: 'translate',
      question: 'Translate into English.',
      prompt: "Elle peut être en avance.",
      answer: "She can be early.",
      wordBank: ["She", "can", "be", "early.", "can't", "is"]
    },
    {
      type: 'translate',
      question: 'Translate into English.',
      prompt: "Ils ne peuvent pas comprendre les consignes.",
      answer: "They can't understand the instructions.",
      wordBank: ["They", "can't", "understand", "the", "instructions.", "can", "understanding"]
    },
    {
      type: 'translate',
      question: 'Translate into English.',
      prompt: "Nous pouvons apprécier ce film.",
      answer: "We can enjoy this movie.",
      wordBank: ["We", "can", "enjoy", "this", "movie.", "can't", "enjoying"]
    },
    {
      type: 'translate',
      question: 'Translate into English.',
      prompt: "Il peut devenir médecin.",
      answer: "He can become a doctor.",
      wordBank: ["He", "can", "become", "a", "doctor.", "can't", "becomes"]
    },
    {
      type: 'translate',
      question: 'Translate into English.',
      prompt: "Les élèves peuvent arriver en retard.",
      answer: "Students can arrive late.",
      wordBank: ["Students", "can", "arrive", "late.", "can't", "arrives"]
    },
    {
      type: 'translate',
      question: 'Translate into English.',
      prompt: "Elle peut voir le problème.",
      answer: "She can see the problem.",
      wordBank: ["She", "can", "see", "the", "problem.", "can't", "seen"]
    },
    {
      type: 'translate',
      question: 'Translate into English.',
      prompt: "Ils peuvent travailler ensemble.",
      answer: "They can work together.",
      wordBank: ["They", "can", "work", "together.", "can't", "working"]
    },
    {
      type: 'translate',
      question: 'Translate into English.',
      prompt: "Nous pouvons jouer dehors.",
      answer: "We can play outside.",
      wordBank: ["We", "can", "play", "outside.", "can't", "plays"]
    },
    {
      type: 'translate',
      question: 'Translate into English.',
      prompt: "Tu peux lire ce livre.",
      answer: "You can read this book.",
      wordBank: ["You", "can", "read", "this", "book.", "can't", "reading"]
    },
    {
      type: 'translate',
      question: 'Translate into English.',
      prompt: "Je peux ouvrir la fenêtre.",
      answer: "I can open the window.",
      wordBank: ["I", "can", "open", "the", "window.", "can't", "opens"]
    },
    {
      type: 'translate',
      question: 'Translate into English.',
      prompt: "Elle peut conduire une voiture.",
      answer: "She can drive a car.",
      wordBank: ["She", "can", "drive", "a", "car.", "can't", "drives"]
    },
    {
      type: 'translate',
      question: 'Translate into English.',
      prompt: "Nous ne pouvons pas entrer ici.",
      answer: "We can't enter here.",
      wordBank: ["We", "can't", "enter", "here.", "can", "entering"]
    },
    {
      type: 'translate',
      question: 'Translate into English.',
      prompt: "Ils peuvent courir vite.",
      answer: "They can run fast.",
      wordBank: ["They", "can", "run", "fast.", "can't", "runs"]
    },
    {
      type: 'translate',
      question: 'Translate into English.',
      prompt: "Tu ne peux pas utiliser mon téléphone.",
      answer: "You can't use my phone.",
      wordBank: ["You", "can't", "use", "my", "phone.", "can", "using"]
    },
    {
      type: 'translate',
      question: 'Translate into English.',
      prompt: "Le chien peut nager.",
      answer: "The dog can swim.",
      wordBank: ["The", "dog", "can", "swim.", "can't", "swims"]
    },
    {
      type: 'translate',
      question: 'Translate into English.',
      prompt: "Je peux entendre la musique.",
      answer: "I can hear the music.",
      wordBank: ["I", "can", "hear", "the", "music.", "can't", "hearing"]
    },
    {
      type: 'translate',
      question: 'Translate into English.',
      prompt: "Elle ne peut pas venir demain.",
      answer: "She can't come tomorrow.",
      wordBank: ["She", "can't", "come", "tomorrow.", "can", "comes"]
    }
  ],

  exercises: [
    {
      question: "I can swim.",
      answer: true,
      explanation: "Correct: 'can' is followed by the base verb."
    },
    {
      question: "She can to drive a car.",
      answer: false,
      explanation: "Incorrect: do not use 'to' after 'can'. Correct: 'She can drive a car.'"
    },
    {
      question: "They can speak French.",
      answer: true,
      explanation: "Correct: 'can' + base verb expresses ability."
    },
    {
      question: "We can cooking dinner.",
      answer: false,
      explanation: "Incorrect: after 'can', use the base verb. Correct: 'We can cook dinner.'"
    },
    {
      question: "He can't ride a bike.",
      answer: true,
      explanation: "Correct: 'can't' + base verb expresses inability."
    },
    {
      question: "He can't to ride a bike.",
      answer: false,
      explanation: "Incorrect: do not use 'to' after 'can't'. Correct: 'He can't ride a bike.'"
    },
    {
      question: "You can sing well.",
      answer: true,
      explanation: "Correct: 'can' does not change with the subject."
    },
    {
      question: "You cans sing well.",
      answer: false,
      explanation: "Incorrect: never add -s to 'can'. Correct: 'You can sing well.'"
    },
    {
      question: "She can be early.",
      answer: true,
      explanation: "Correct: use the base verb 'be' after 'can'."
    },
    {
      question: "She can being early.",
      answer: false,
      explanation: "Incorrect: use 'be', not 'being'. Correct: 'She can be early.'"
    },
    {
      question: "They can't understand the instructions.",
      answer: true,
      explanation: "Correct: 'can't' is followed by the base verb."
    },
    {
      question: "They can't to understand the instructions.",
      answer: false,
      explanation: "Incorrect: do not use 'to' after 'can't'. Correct: 'They can't understand the instructions.'"
    },
    {
      question: "We can enjoy this movie.",
      answer: true,
      explanation: "Correct: 'can' + base verb."
    },
    {
      question: "We can enjoys this movie.",
      answer: false,
      explanation: "Incorrect: after 'can', use the base verb. Correct: 'We can enjoy this movie.'"
    },
    {
      question: "He can become a doctor.",
      answer: true,
      explanation: "Correct: 'can' + base verb expresses possibility or ability."
    },
    {
      question: "He can becomes a doctor.",
      answer: false,
      explanation: "Incorrect: do not add -s to the verb after 'can'. Correct: 'He can become a doctor.'"
    },
    {
      question: "Students can arrive late.",
      answer: true,
      explanation: "Correct: 'can' + base verb."
    },
    {
      question: "Students can arriving late.",
      answer: false,
      explanation: "Incorrect: use the base verb 'arrive', not 'arriving'."
    },
    {
      question: "She can see the problem.",
      answer: true,
      explanation: "Correct: 'can' + base verb."
    },
    {
      question: "She can seen the problem.",
      answer: false,
      explanation: "Incorrect: use 'see', not 'seen'. Correct: 'She can see the problem.'"
    },
    {
      question: "They can work together.",
      answer: true,
      explanation: "Correct: 'can' + base verb."
    },
    {
      question: "I can to write a letter.",
      answer: false,
      explanation: "Incorrect: do not use 'to' after 'can'. Correct: 'I can write a letter.'"
    },
    {
      question: "We can play outside.",
      answer: true,
      explanation: "Correct: 'can' + base verb."
    },
    {
      question: "He can dances very well.",
      answer: false,
      explanation: "Incorrect: use the base verb after 'can'. Correct: 'He can dance very well.'"
    },
    {
      question: "You can read this book.",
      answer: true,
      explanation: "Correct: 'can' + base verb."
    },
    {
      question: "They can to study together.",
      answer: false,
      explanation: "Incorrect: do not use 'to' after 'can'. Correct: 'They can study together.'"
    }
  ]
};

export default CanGrammar;
