const FutureWillGrammar = {
  id: '15',
  title: 'Future Tense (Will)',
  description: 'Translate the sentences into English using "will" for future tense.',
  category: 'Main Tenses',
  imageUrl: 'https://wretggbpaejzjdilemit.supabase.co/storage/v1/object/public/lesson-images/15274719ab/future-tense-will.webp',
  textContent: {
    cards: [
      {
        eyebrow: 'Le futur (will)',
        paragraph: 'Pour parler de ce qui arrivera dans longtemps.',
        tip: 'Formule : sujet + will + base verbale.',
        columns: [
          {
            label: 'Sujet + WILL (invariable) + base verbale',
            accent: 'blue',
            rows: ['I', 'You', 'He / She / It', 'We', 'They'],
          },
        ],
        examples: [
          { en: '**I will confess** tomorrow.', fr: 'J’avouerai mes sentiments demain.' },
          { en: '**He will be** heartbroken.', fr: 'Il aura le coeur brisé.' },
        ],
      },
      {
        eyebrow: "Ce qui n'arrivera pas",
        paragraph: "Formule : sujet + won't + base verbale.",
        examples: [
          { en: "**I won't confess** tomorrow.", fr: 'Je n’avouerai pas mes sentiments demain.' },
          { en: "**He won't be** heartbroken.", fr: 'Il n’aura pas le coeur brisé.' },
        ],
      },
    ],
  },

translateExercises: [
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Le soleil se lèvera à 6 heures demain.",
    answer: "The sun will rise at 6 am tomorrow.",
    wordBank: ["The sun", "will", "rise", "at", "6 am", "tomorrow."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Le train arrivera à neuf heures.",
    answer: "The train will arrive at 9 o’clock.",
    wordBank: ["The train", "will", "arrive", "at", "9 o’clock."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Nous fêterons son anniversaire vendredi.",
    answer: "We will celebrate her birthday on Friday.",
    wordBank: ["We", "will", "celebrate", "her birthday", "on Friday."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Le chien aboiera si quelqu’un arrive.",
    answer: "The dog will bark if someone comes.",
    wordBank: ["The dog", "will", "bark", "if", "someone", "comes."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Demain, il pleuvra dans l’après-midi.",
    answer: "Tomorrow, it will rain in the afternoon.",
    wordBank: ["Tomorrow,", "it", "will", "rain", "in", "the afternoon."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Le professeur expliquera la leçon demain.",
    answer: "The teacher will explain the lesson tomorrow.",
    wordBank: ["The teacher", "will", "explain", "the lesson", "tomorrow."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "J’apporterai mon parapluie au cas où il pleuvrait.",
    answer: "I will bring my umbrella in case it rains.",
    wordBank: ["I", "will", "bring", "my umbrella", "in case", "it", "rains."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Le bus partira à 7 h 30.",
    answer: "The bus will leave at 7:30 am.",
    wordBank: ["The bus", "will", "leave", "at", "7:30 am."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Mes parents visiteront le musée la semaine prochaine.",
    answer: "My parents will visit the museum next week.",
    wordBank: ["My parents", "will", "visit", "the museum", "next week."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Elle rencontrera son ami au parc.",
    answer: "She will meet her friend at the park.",
    wordBank: ["She", "will", "meet", "her friend", "at", "the park."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Le chat dormira sur le canapé.",
    answer: "The cat will sleep on the sofa.",
    wordBank: ["The cat", "will", "sleep", "on", "the sofa."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Nous déjeunerons dans le nouveau restaurant.",
    answer: "We will have lunch at the new restaurant.",
    wordBank: ["We", "will", "have", "lunch", "at", "the new restaurant."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Tu aimeras le nouveau jeu.",
    answer: "You will enjoy the new game.",
    wordBank: ["You", "will", "enjoy", "the new game."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Ils regarderont un film ce soir.",
    answer: "They will watch a movie tonight.",
    wordBank: ["They", "will", "watch", "a movie", "tonight."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Je t’aiderai demain.",
    answer: "I will help you tomorrow.",
    wordBank: ["I", "will", "help", "you", "tomorrow."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Elle préparera le dîner ce soir.",
    answer: "She will prepare dinner tonight.",
    wordBank: ["She", "will", "prepare", "dinner", "tonight."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Nous arriverons tôt.",
    answer: "We will arrive early.",
    wordBank: ["We", "will", "arrive", "early."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Il achètera une nouvelle voiture.",
    answer: "He will buy a new car.",
    wordBank: ["He", "will", "buy", "a new car."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Tu verras tes amis demain.",
    answer: "You will see your friends tomorrow.",
    wordBank: ["You", "will", "see", "your friends", "tomorrow."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Nous jouerons au football après l’école.",
    answer: "We will play football after school.",
    wordBank: ["We", "will", "play", "football", "after school."]
  }
],

  exercises: [
  { "question": "The sun will rise at 6 am tomorrow.", "answer": true, "explanation": "'Will' + base verb expresses future fact." },
  { "question": "My friends will going to the cinema tonight.", "answer": false, "explanation": "Incorrect: after 'will' use base verb. Correct: 'will go'." },
  { "question": "The train will arrive at 9 o’clock.", "answer": true, "explanation": "'Will' + base verb expresses scheduled future action." },
  { "question": "She will watches TV after dinner.", "answer": false, "explanation": "Incorrect: after 'will' use base verb. Correct: 'will watch'." },
  { "question": "We will celebrate her birthday on Friday.", "answer": true, "explanation": "'Will' + base verb expresses future plan." },
  { "question": "He will not goes to school tomorrow.", "answer": false, "explanation": "Incorrect: after 'will not' use base verb. Correct: 'will not go'." },
  { "question": "The dog will bark if someone comes.", "answer": true, "explanation": "'Will' + base verb expresses future prediction." },
  { "question": "I wills help my brother with his homework.", "answer": false, "explanation": "Incorrect: no -s after 'will'. Correct: 'will help'." },
  { "question": "Tomorrow, it will rain in the afternoon.", "answer": true, "explanation": "'Will' + base verb expresses future prediction." },
  { "question": "She will to clean her room later.", "answer": false, "explanation": "Incorrect: 'will' should not be followed by 'to'. Correct: 'will clean'." },
  { "question": "The teacher will explain the lesson tomorrow.", "answer": true, "explanation": "'Will' + base verb expresses future action." },
  { "question": "They will sings at the school concert.", "answer": false, "explanation": "Incorrect: after 'will' use base verb. Correct: 'will sing'." },
  { "question": "I will bring my umbrella in case it rains.", "answer": true, "explanation": "'Will' + base verb expresses future intention." },
  { "question": "We will baking a cake for the party.", "answer": false, "explanation": "Incorrect: after 'will' use base verb. Correct: 'will bake'." },
  { "question": "The bus will leave at 7:30 am.", "answer": true, "explanation": "'Will' + base verb expresses scheduled action." },
  { "question": "He will not to eat the vegetables.", "answer": false, "explanation": "Incorrect: 'will not' should not be followed by 'to'. Correct: 'will not eat'." },
  { "question": "My parents will visit the museum next week.", "answer": true, "explanation": "'Will' + base verb expresses future plan." },
  { "question": "The children will running in the garden.", "answer": false, "explanation": "Incorrect: after 'will' use base verb. Correct: 'will run'." },
  { "question": "She will meet her friend at the park.", "answer": true, "explanation": "'Will' + base verb expresses future arrangement." },
  { "question": "I will to call the doctor in the morning.", "answer": false, "explanation": "Incorrect: 'will' should not be followed by 'to'. Correct: 'will call'." },
  { "question": "The cat will sleep on the sofa.", "answer": true, "explanation": "'Will' + base verb expresses future action." },
  { "question": "He will drives to work tomorrow.", "answer": false, "explanation": "Incorrect: after 'will' use base verb. Correct: 'will drive'." },
  { "question": "We will have lunch at the new restaurant.", "answer": true, "explanation": "'Will' + base verb expresses future plan." },
  { "question": "The flowers will grows quickly in spring.", "answer": false, "explanation": "Incorrect: after 'will' use base verb. Correct: 'will grow'." },
  { "question": "You will enjoy the new game.", "answer": true, "explanation": "'Will' + base verb expresses future prediction." },
  { "question": "She will to paint the wall blue.", "answer": false, "explanation": "Incorrect: 'will' should not be followed by 'to'. Correct: 'will paint'." }
]
};

export default FutureWillGrammar;
