const BeGoingToGrammar = {
  id: '16',
  title: 'Futur Proche (Be Going To)',
  description: 'Learn how to use be going to for near future',
  category: 'Temps principaux',  imageUrl: 'https://i.ibb.co/6cxHGw3F/Be-Going-to.png',
  textContent: {
    cards: [
      {
        eyebrow: 'À quoi ça sert',
        paragraph: "Pour parler d'une action qui va arriver prochainement (ou non).",
        tip: 'Formule : sujet + be going to + base verbale.',
        columns: [
          {
            label: '1/ Je repère le sujet et / ou le pronom',
            accent: 'blue',
            rows: ['I', 'You', 'He / She / It', 'We', 'They'],
          },
          {
            label: '2/ Je conjugue BE au présent',
            accent: 'coral',
            rows: ['**am** (not) going to', '**are** (not) going to', '**is** (not) going to', '**are** (not) going to', '**are** (not) going to'],
          },
          {
            label: "3/ J'ajoute la base verbale",
            accent: 'teal',
            rows: ['Speak', 'Love', 'Be', 'Etc...'],
          },
        ],
        examples: [
          { en: "**I'm going to tell** her now!", fr: 'Je vais lui dire tout de suite !' },
          { en: '**We are going to date**.', fr: 'On va sortir ensemble.' },
        ],
      },
      {
        eyebrow: 'La forme négative',
        paragraph: "On ajoute **not** après be : am not / isn't / aren't + going to + base verbale.",
        examples: [
          { en: "**I'm not going to tell** her.", fr: 'Je ne vais pas lui dire.' },
          { en: '**We are not going to date**.', fr: 'On ne va pas sortir ensemble.' },
        ],
      },
    ],
  },
translateExercises: [
  // POSITIVE

  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Je vais manger une pomme.",
    answer: "I am going to eat an apple.",
    wordBank: ["I", "am", "is", "are", "going to", "eat", "an apple."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Elle va écrire un email.",
    answer: "She is going to write an email.",
    wordBank: ["She", "is", "am", "are", "going to", "write", "an email."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Nous allons regarder un film.",
    answer: "We are going to watch a movie.",
    wordBank: ["We", "are", "is", "am", "going to", "watch", "a movie."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Le chat va dormir sur le canapé.",
    answer: "The cat is going to sleep on the sofa.",
    wordBank: ["The cat", "is", "am", "are", "going to", "sleep", "on", "the sofa."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Ils vont jouer dans le parc.",
    answer: "They are going to play in the park.",
    wordBank: ["They", "are", "is", "am", "going to", "play", "in", "the park."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Je vais parler au téléphone.",
    answer: "I am going to talk on the phone.",
    wordBank: ["I", "am", "is", "are", "going to", "talk", "on", "the phone."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Le professeur va expliquer la leçon.",
    answer: "The teacher is going to explain the lesson.",
    wordBank: ["The teacher", "is", "am", "are", "going to", "explain", "the lesson."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Tu vas ouvrir la porte.",
    answer: "You are going to open the door.",
    wordBank: ["You", "are", "is", "am", "going to", "open", "the door."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Les enfants vont manger des bonbons.",
    answer: "The children are going to eat sweets.",
    wordBank: ["The children", "are", "is", "am", "going to", "eat", "sweets."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Il va lire le journal.",
    answer: "He is going to read the newspaper.",
    wordBank: ["He", "is", "am", "are", "going to", "read", "the newspaper."]
  },

  // NEGATIVE

  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Je ne vais pas acheter une voiture.",
    answer: "I am not going to buy a car.",
    wordBank: ["I", "am", "is", "are", "not", "going to", "buy", "a car."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Elle ne va pas regarder la télévision.",
    answer: "She is not going to watch television.",
    wordBank: ["She", "is", "am", "are", "not", "going to", "watch", "television."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Nous n’allons pas visiter le musée.",
    answer: "We are not going to visit the museum.",
    wordBank: ["We", "are", "is", "am", "not", "going to", "visit", "the museum."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Il ne va pas boire un café.",
    answer: "He is not going to drink a coffee.",
    wordBank: ["He", "is", "am", "are", "not", "going to", "drink", "a coffee."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Les enfants ne vont pas jouer dehors.",
    answer: "The children are not going to play outside.",
    wordBank: ["The children", "are", "is", "am", "not", "going to", "play", "outside."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Tu ne vas pas lire le livre.",
    answer: "You are not going to read the book.",
    wordBank: ["You", "are", "is", "am", "not", "going to", "read", "the book."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Le chien ne va pas courir dans le jardin.",
    answer: "The dog is not going to run in the garden.",
    wordBank: ["The dog", "is", "am", "are", "not", "going to", "run", "in", "the garden."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Je ne vais pas écouter la musique.",
    answer: "I am not going to listen to the music.",
    wordBank: ["I", "am", "is", "are", "not", "going to", "listen to", "the music."]
  },

  // QUESTIONS

  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Vas-tu manger une pomme ?",
    answer: "Are you going to eat an apple?",
    wordBank: ["Are", "Is", "Am", "you", "going to", "eat", "an apple?"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Va-t-elle écrire un email ?",
    answer: "Is she going to write an email?",
    wordBank: ["Is", "Are", "Am", "she", "going to", "write", "an email?"]
  }
],

  exercises: [
    { question: "I ___ ___ ___ study medicine.", answer: "am going to", options: ["am going to", "is going to", "are going to", "going to"] },
    { question: "She ___ ___ ___ travel next year.", answer: "is going to", options: ["is going to", "am going to", "are going to", "going to"] },
    { question: "They ___ ___ ___ move house.", answer: "are going to", options: ["are going to", "is going to", "am going to", "going to"] },
    { question: "He ___ ___ ___ buy a car.", answer: "is going to", options: ["is going to", "am going to", "are going to", "going to"] },
    { question: "We ___ ___ ___ have a party.", answer: "are going to", options: ["are going to", "is going to", "am going to", "going to"] },
    { question: "The weather ___ ___ ___ be nice tomorrow.", answer: "is going to", options: ["is going to", "am going to", "are going to", "going to"] },
    { question: "You ___ ___ ___ miss the train.", answer: "are going to", options: ["are going to", "is going to", "am going to", "going to"] },
    { question: "The students ___ ___ ___ take an exam.", answer: "are going to", options: ["are going to", "is going to", "am going to", "going to"] },
    { question: "My parents ___ ___ ___ visit us.", answer: "are going to", options: ["are going to", "is going to", "am going to", "going to"] },
    { question: "It ___ ___ ___ rain later.", answer: "is going to", options: ["is going to", "am going to", "are going to", "going to"] },
    { question: "We ___ ___ ___ be late.", answer: "are going to", options: ["are going to", "is going to", "am going to", "going to"] },
    { question: "The movie ___ ___ ___ start soon.", answer: "is going to", options: ["is going to", "am going to", "are going to", "going to"] },
    { question: "I ___ ___ ___ help you.", answer: "am going to", options: ["am going to", "is going to", "are going to", "going to"] },
    { question: "They ___ ___ ___ build a new house.", answer: "are going to", options: ["are going to", "is going to", "am going to", "going to"] },
    { question: "She ___ ___ ___ learn French.", answer: "is going to", options: ["is going to", "am going to", "are going to", "going to"] },
    { question: "The children ___ ___ ___ play in the park.", answer: "are going to", options: ["are going to", "is going to", "am going to", "going to"] },
    { question: "He ___ ___ ___ start a new job.", answer: "is going to", options: ["is going to", "am going to", "are going to", "going to"] },
    { question: "We ___ ___ ___ visit London.", answer: "are going to", options: ["are going to", "is going to", "am going to", "going to"] },
    { question: "The concert ___ ___ ___ begin at 8.", answer: "is going to", options: ["is going to", "am going to", "are going to", "going to"] },
    { question: "I ___ ___ ___ make dinner.", answer: "am going to", options: ["am going to", "is going to", "are going to", "going to"] },
    { question: "They ___ ___ ___ arrive tomorrow.", answer: "are going to", options: ["are going to", "is going to", "am going to", "going to"] },
    { question: "The sun ___ ___ ___ shine today.", answer: "is going to", options: ["is going to", "am going to", "are going to", "going to"] },
    { question: "You ___ ___ ___ love this book.", answer: "are going to", options: ["are going to", "is going to", "am going to", "going to"] },
    { question: "She ___ ___ ___ call her mom.", answer: "is going to", options: ["is going to", "am going to", "are going to", "going to"] },    
    { question: "We ___ ___ ___ win the game.", answer: "are going to", options: ["are going to", "is going to", "am going to", "going to"] },
    { question: "The weather ___ ___ ___ change soon.", answer: "is going to", options: ["is going to", "am going to", "are going to", "going to"] },
    { question: "I ___ ___ ___ miss this opportunity.", answer: "am going to", options: ["am going to", "is going to", "are going to", "going to"] },
    { question: "They ___ ___ ___ celebrate their anniversary.", answer: "are going to", options: ["are going to", "is going to", "am going to", "going to"] },
    { question: "She ___ ___ ___ graduate next year.", answer: "is going to", options: ["is going to", "am going to", "are going to", "going to"] }
  ]
};

export default BeGoingToGrammar;
