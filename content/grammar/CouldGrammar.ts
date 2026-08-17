const CouldGrammar = {
  id: '33',
  title: 'Could / Was able to',
  description: 'Practice past ability with could and was able to',
  imageUrl: 'https://i.ibb.co/PsDv5rG6/Could-Was-able-to.png',
  textContent: {
    cards: [
      {
        eyebrow: 'Could + base verbale',
        paragraph: 'Je parle de ce qui était possible.',
        tip: 'Formule : sujet + could (ou couldn’t) + base verbale. Could ne change jamais.',
        columns: [
          {
            label: 'Sujet',
            accent: 'blue',
            rows: ['I', 'You', 'He / She / It', 'We', 'They'],
          },
          {
            label: 'Could (affirmatif) / Couldn’t (négatif)',
            accent: 'coral',
            rows: ['**Could**', '**Couldn’t**'],
          },
        ],
        examples: [
          { en: '**She could sleep** anywhere.', fr: 'Elle pouvait dormir n’importe où.' },
          { en: '**You couldn’t speak** Korean.', fr: 'Tu ne pouvais pas parler coréen.' },
        ],
      },
      {
        eyebrow: 'Be able to + base verbale',
        paragraph: 'On peut également utiliser was / were (not) able to + base verbale.',
        columns: [
          {
            label: 'Be able to (selon le sujet, au passé)',
            accent: 'amber',
            rows: [
              'I **was** (not) able to',
              'You **were** (not) able to',
              'He / She / It **was** (not) able to',
              'We **were** (not) able to',
              'They **were** (not) able to',
            ],
          },
        ],
        examples: [
          { en: '**She was able to see** ghosts.', fr: 'Elle a été capable de voir des fantômes.' },
          { en: '**You weren’t able to go** there.', fr: 'Tu n’as pas été capable d’y aller.' },
        ],
      },
    ],
  },
  translateExercises: [
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Je pouvais nager quand j'avais cinq ans.",
    answer: "I could swim when I was five.",
    wordBank: ["I", "could", "swim", "when", "I", "was", "five."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Il a pu le reparer.",
    answer: "He was able to fix it.",
    wordBank: ["He", "was", "able", "to", "fix", "it."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Ils pouvaient courir vite.",
    answer: "They could run fast.",
    wordBank: ["They", "could", "run", "fast."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Elle savait lire a six ans.",
    answer: "She could read at six.",
    wordBank: ["She", "could", "read", "at", "six."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "J'ai pu l'ouvrir.",
    answer: "I was able to open it.",
    wordBank: ["I", "was", "able", "to", "open", "it."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Nous pouvions gravir la colline.",
    answer: "We could climb the hill.",
    wordBank: ["We", "could", "climb", "the hill."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Tom a pu m'aider.",
    answer: "Tom was able to help me.",
    wordBank: ["Tom", "was", "able", "to", "help", "me."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Je pouvais voir la lune.",
    answer: "I could see the moon.",
    wordBank: ["I", "could", "see", "the moon."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Elle a pu ouvrir la boite.",
    answer: "She was able to open the box.",
    wordBank: ["She", "was", "able", "to", "open", "the box."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Ils pouvaient trouver la cle.",
    answer: "They could find the key.",
    wordBank: ["They", "could", "find", "the key."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Nous avons pu finir.",
    answer: "We were able to finish.",
    wordBank: ["We", "were", "able", "to", "finish."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Il savait faire du velo.",
    answer: "He could ride a bike.",
    wordBank: ["He", "could", "ride", "a bike."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "J'ai pu ouvrir la porte.",
    answer: "I was able to open the door.",
    wordBank: ["I", "was", "able", "to", "open", "the door."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Elle savait bien chanter.",
    answer: "She could sing well.",
    wordBank: ["She", "could", "sing", "well."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Ils ont pu aider.",
    answer: "They were able to help.",
    wordBank: ["They", "were", "able", "to", "help."]
  }
],

  exercises: [
    { question: 'I could swim when I was five.', answer: true, explanation: "Correct: 'could' for past ability." },
    { question: 'I could to swim when I was five.', answer: false, explanation: "Incorrect: do not use 'to' after 'could'." },
    { question: 'He was able to fix it.', answer: true, explanation: "Correct: 'was able to' + base verb." },
    { question: 'He was able fix it.', answer: false, explanation: "Incorrect: need 'to' after 'able'." },
    { question: 'They could run fast.', answer: true, explanation: "Correct: 'could' + base verb." },
    { question: 'They could running fast.', answer: false, explanation: "Incorrect: use base form 'run'." },
    { question: 'She could read at six.', answer: true, explanation: "Correct: 'could' for past ability." },
    { question: 'She could to read at six.', answer: false, explanation: "Incorrect: drop 'to'." },
    { question: 'I was able to open it.', answer: true, explanation: "Correct: 'was able to' + base verb." },
    { question: 'I was able open it.', answer: false, explanation: "Incorrect: needs 'to'." },
    { question: 'We could climb the hill.', answer: true, explanation: "Correct: 'could' + base verb." },
    { question: 'We could to climb the hill.', answer: false, explanation: "Incorrect: remove 'to'." },
    { question: 'Tom was able to help me.', answer: true, explanation: "Correct: 'was able to' + base verb." },
    { question: 'Tom was able helping me.', answer: false, explanation: "Incorrect: use base verb 'help'." },
    { question: 'I could see the moon.', answer: true, explanation: "Correct: 'could' + base verb." },
    { question: 'I could to see the moon.', answer: false, explanation: "Incorrect: drop 'to'." },
    { question: 'She was able to open the box.', answer: true, explanation: "Correct: 'was able to' + base verb." },
    { question: 'She was able open the box.', answer: false, explanation: "Incorrect: missing 'to'." },
    { question: 'They could find the key.', answer: true, explanation: "Correct: 'could' + base verb." },
    { question: 'They could finding the key.', answer: false, explanation: "Incorrect: use base form 'find'." },
    { question: 'We were able to finish.', answer: true, explanation: "Correct: 'were able to' + base verb." },
    { question: 'We were able finish.', answer: false, explanation: "Incorrect: needs 'to'." },
    { question: 'He could ride a bike.', answer: true, explanation: "Correct: 'could' + base verb." },
    { question: 'He could to ride a bike.', answer: false, explanation: "Incorrect: drop 'to'." },
    { question: 'I was able to open the door.', answer: true, explanation: "Correct: 'was able to' + base verb." },
    { question: 'I was able opening the door.', answer: false, explanation: "Incorrect: use base verb 'open'." },
    { question: 'She could sing well.', answer: true, explanation: "Correct: 'could' + base verb." },
    { question: 'She could to sing well.', answer: false, explanation: "Incorrect: no 'to' after 'could'." },
    { question: 'They were able to help.', answer: true, explanation: "Correct: 'were able to' + base verb." },
    { question: 'They were able helping.', answer: false, explanation: "Incorrect: use base verb 'help'." }
  ]
};

export default CouldGrammar;
