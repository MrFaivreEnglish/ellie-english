const WouldLikeGrammar = {
  id: '11',
  title: 'Would Like',
  description: 'Learn how to use would like - Evaluate if these sentences are grammatically correct',  imageUrl: 'https://i.ibb.co/ZzXpFqXm/Would-like.png',
  textContent: {
    cards: [
      {
        eyebrow: "Dire ce qu'on voudrait (ou non)",
        tip: "Formule : sujet + would like (ou wouldn't like) + groupe nominal.",
        columns: [
          {
            label: "Sujet + WOULD LIKE / WOULDN'T LIKE + groupe nominal",
            accent: 'blue',
            rows: ['I', 'You', 'He / She / It', 'We', 'They'],
          },
        ],
        examples: [
          { en: '**I would like an apple**, please.', fr: 'Je voudrais une pomme.' },
          { en: "**We wouldn't like a black cat**.", fr: "Nous n'aimerions pas un chat noir." },
        ],
      },
      {
        eyebrow: "Dire ce qu'on voudrait faire (ou non)",
        paragraph: "Formule : sujet + would like to (ou wouldn't like to) + base verbale.",
        examples: [
          { en: '**He would like to eat** a scone.', fr: 'Il aimerait manger un scone.' },
          { en: "**They wouldn't like to be** vets.", fr: "Ils n'aimeraient pas être vétérinaires." },
        ],
      },
    ],
  },
translateExercises: [
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Ils aimeraient visiter Paris.",
    answer: "They would like to visit Paris.",
    wordBank: ["They", "would", "like", "to", "visit", "Paris.", "likes", "visiting"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Veux-tu de l'aide ?",
    answer: "Would you like some help?",
    wordBank: ["Would", "you", "like", "some", "help?", "Do", "want"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Nous aimerions faire une réservation.",
    answer: "We would like to make a reservation.",
    wordBank: ["We", "would", "like", "to", "make", "a", "reservation.", "makes", "making"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Aimerais-tu déjeuner avec nous ?",
    answer: "Would you like to have lunch with us?",
    wordBank: ["Would", "you", "like", "to", "have", "lunch", "with", "us?", "Do", "having"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "J'aimerais une tasse de thé.",
    answer: "I would like a cup of tea.",
    wordBank: ["I", "would", "like", "a", "cup", "of", "tea.", "likes", "want"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Les invités aimeraient du gâteau.",
    answer: "The guests would like some cake.",
    wordBank: ["The", "guests", "would", "like", "some", "cake.", "likes", "wants"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Aimerais-tu que j'ouvre la fenêtre ?",
    answer: "Would you like me to open the window?",
    wordBank: ["Would", "you", "like", "me", "to", "open", "the", "window?", "Do", "opens"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Nous aimerions des informations.",
    answer: "We would like some information.",
    wordBank: ["We", "would", "like", "some", "information.", "likes", "want"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Ton ami aimerait-il venir ?",
    answer: "Would your friend like to come?",
    wordBank: ["Would", "your", "friend", "like", "to", "come?", "Does", "comes"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "J'aimerais remercier tout le monde.",
    answer: "I would like to thank everyone.",
    wordBank: ["I", "would", "like", "to", "thank", "everyone.", "thanks", "thanking"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Voudrais-tu quelque chose à boire ?",
    answer: "Would you like something to drink?",
    wordBank: ["Would", "you", "like", "something", "to", "drink?", "Do", "drinking"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Aimerais-tu que je t'aide ?",
    answer: "Would you like me to help you?",
    wordBank: ["Would", "you", "like", "me", "to", "help", "you?", "Do", "helps"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Elle aimerait un sandwich.",
    answer: "She would like a sandwich.",
    wordBank: ["She", "would", "like", "a", "sandwich.", "likes", "wants"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Il aimerait jouer dehors.",
    answer: "He would like to play outside.",
    wordBank: ["He", "would", "like", "to", "play", "outside.", "plays", "playing"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Nous aimerions aller au parc.",
    answer: "We would like to go to the park.",
    wordBank: ["We", "would", "like", "to", "go", "to", "the", "park.", "goes", "going"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Aimeriez-vous du café ?",
    answer: "Would you like some coffee?",
    wordBank: ["Would", "you", "like", "some", "coffee?", "Do", "likes"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Ils aimeraient regarder un film.",
    answer: "They would like to watch a movie.",
    wordBank: ["They", "would", "like", "to", "watch", "a", "movie.", "watches", "watching"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "J'aimerais acheter ce livre.",
    answer: "I would like to buy this book.",
    wordBank: ["I", "would", "like", "to", "buy", "this", "book.", "buys", "buying"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Elle aimerait apprendre l'anglais.",
    answer: "She would like to learn English.",
    wordBank: ["She", "would", "like", "to", "learn", "English.", "learns", "learning"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Voudrais-tu venir avec moi ?",
    answer: "Would you like to come with me?",
    wordBank: ["Would", "you", "like", "to", "come", "with", "me?", "Do", "coming"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "J'aimerais du gâteau.",
    answer: "I would like some cake.",
    wordBank: ["I", "would", "like", "some", "cake.", "likes", "want"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Elle aimerait une pomme.",
    answer: "She would like an apple.",
    wordBank: ["She", "would", "like", "an", "apple.", "likes", "wants"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Il aimerait du jus.",
    answer: "He would like some juice.",
    wordBank: ["He", "would", "like", "some", "juice.", "likes", "wants"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Nous aimerions de la pizza.",
    answer: "We would like some pizza.",
    wordBank: ["We", "would", "like", "some", "pizza.", "likes", "want"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Ils aimeraient des biscuits.",
    answer: "They would like some cookies.",
    wordBank: ["They", "would", "like", "some", "cookies.", "likes", "wants"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Voudrais-tu du chocolat ?",
    answer: "Would you like some chocolate?",
    wordBank: ["Would", "you", "like", "some", "chocolate?", "Do", "likes"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Aimeriez-vous du café ?",
    answer: "Would you like some coffee?",
    wordBank: ["Would", "you", "like", "some", "coffee?", "Do", "likes"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Ton frère aimerait du lait.",
    answer: "Your brother would like some milk.",
    wordBank: ["Your", "brother", "would", "like", "some", "milk.", "likes", "wants"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Ma sœur aimerait une glace.",
    answer: "My sister would like an ice cream.",
    wordBank: ["My", "sister", "would", "like", "an", "ice", "cream.", "likes", "wants"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Les enfants aimeraient des bonbons.",
    answer: "The children would like some candy.",
    wordBank: ["The", "children", "would", "like", "some", "candy.", "likes", "want"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "J'aimerais un sandwich.",
    answer: "I would like a sandwich.",
    wordBank: ["I", "would", "like", "a", "sandwich.", "likes", "want"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Elle aimerait une banane.",
    answer: "She would like a banana.",
    wordBank: ["She", "would", "like", "a", "banana.", "likes", "wants"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Il aimerait de l'eau.",
    answer: "He would like some water.",
    wordBank: ["He", "would", "like", "some", "water.", "likes", "wants"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Nous aimerions des frites.",
    answer: "We would like some fries.",
    wordBank: ["We", "would", "like", "some", "fries.", "likes", "want"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Ils aimeraient du thé.",
    answer: "They would like some tea.",
    wordBank: ["They", "would", "like", "some", "tea.", "likes", "wants"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Voudrais-tu une orange ?",
    answer: "Would you like an orange?",
    wordBank: ["Would", "you", "like", "an", "orange?", "Do", "likes"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Aimeriez-vous du pain ?",
    answer: "Would you like some bread?",
    wordBank: ["Would", "you", "like", "some", "bread?", "Do", "likes"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Le garçon aimerait un hamburger.",
    answer: "The boy would like a hamburger.",
    wordBank: ["The", "boy", "would", "like", "a", "hamburger.", "likes", "wants"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "La fille aimerait une crêpe.",
    answer: "The girl would like a pancake.",
    wordBank: ["The", "girl", "would", "like", "a", "pancake.", "likes", "wants"]
  }
],

  exercises: [
    { question: "I would like having dinner at this restaurant.", answer: false, explanation: "Incorrect: After 'would like' use 'to' + base verb. Correct: 'would like to have'" },
    { question: "They would like to visit Paris next summer.", answer: true, explanation: "Correct: 'Would like' is properly followed by 'to' + base verb" },
    { question: "She would likes to order a coffee.", answer: false, explanation: "Incorrect: 'Would like' should not have 's'. It doesn't change form" },
    { question: "Would you like some help with your bags?", answer: true, explanation: "Correct: This is the proper way to offer help using 'would like'" },
    { question: "He would to like stay longer.", answer: false, explanation: "Incorrect word order. Correct: 'would like to stay'" },
    { question: "We would like to make a reservation.", answer: true, explanation: "Correct: 'Would like' is properly followed by 'to' + base verb" },
    { question: "The students would liking to ask questions.", answer: false, explanation: "Incorrect: 'Would like' should not be in -ing form" },
    { question: "Would you like to join us for lunch?", answer: true, explanation: "Correct: Proper formation of a question with 'would like'" },
    { question: "They would like watch the movie.", answer: false, explanation: "Incorrect: Missing 'to'. Correct: 'would like to watch'" },
    { question: "I would like to have a cup of tea.", answer: true, explanation: "Correct: 'Would like' is properly followed by 'to' + base verb" },
    { question: "She would to like going shopping.", answer: false, explanation: "Incorrect word order and verb form. Correct: 'would like to go'" },
    { question: "The guests would like some more cake.", answer: true, explanation: "Correct: 'Would like' can be directly followed by a noun phrase" },
    { question: "He would like helping in the garden.", answer: false, explanation: "Incorrect: After 'would like' use 'to' + base verb. Correct: 'would like to help'" },
    { question: "Would you like me to open the window?", answer: true, explanation: "Correct: Proper use of 'would like' with infinitive clause" },
    { question: "They would wanting to see the manager.", answer: false, explanation: "Incorrect: 'Would' should be followed by 'like'. Correct: 'would like to see'" },
    { question: "We would like some information about the tour.", answer: true, explanation: "Correct: 'Would like' followed by a noun phrase" },
    { question: "You would likes to travel abroad.", answer: false, explanation: "Incorrect: 'Would like' should not have 's'. Correct: 'would like to travel'" },
    { question: "Would your friend like to join us?", answer: true, explanation: "Correct: Proper formation of a question with 'would like'" },
    { question: "She would like going to the beach.", answer: false, explanation: "Incorrect: After 'would like' use 'to' + base verb. Correct: 'would like to go'" },
    { question: "I would like to thank everyone for coming.", answer: true, explanation: "Correct: 'Would like' properly followed by 'to' + base verb" },
    { question: "They would to like meeting you.", answer: false, explanation: "Incorrect word order and verb form. Correct: 'would like to meet'" },
    { question: "Would you like anything to drink?", answer: true, explanation: "Correct: Proper use of 'would like' in a question" },
    { question: "He would liking to visit his grandparents.", answer: false, explanation: "Incorrect: 'Would like' should not be in -ing form. Correct: 'would like to visit'" },
    { question: "We would like seeing the museum.", answer: false, explanation: "Incorrect: After 'would like' use 'to' + base verb. Correct: 'would like to see'" },
    { question: "Would you like me to help you with that?", answer: true, explanation: "Correct: Proper use of 'would like' with infinitive clause" }
  ]
};

export default WouldLikeGrammar;
