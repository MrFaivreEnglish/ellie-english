const MustGrammar = {
  id: '9',
  title: 'Must',
  description: 'Learn how to use the modal verb must - Evaluate if these sentences are grammatically correct',  imageUrl: 'https://i.ibb.co/gLCNmjj6/Must.png',
  textContent: {
    cards: [
      {
        eyebrow: 'Ce que je dois faire',
        paragraph: 'Je parle de ce que je dois faire.',
        tip: "Formule : sujet + must + base verbale. Must ne change jamais (pas de -s, pas de \"to\").",
        columns: [
          {
            label: 'Sujet + MUST (invariable) + base verbale',
            accent: 'blue',
            rows: ['I', 'You', 'He / She / It', 'We', 'They'],
          },
        ],
        examples: [
          { en: 'In the game, **you must fight**.', fr: 'Dans le jeu, tu dois te battre.' },
          { en: '**Eva must revise** for the test.', fr: 'Eva doit réviser pour le test.' },
        ],
      },
      {
        eyebrow: 'Ce que je ne dois pas faire',
        paragraph: 'Formule : sujet + mustn\'t + base verbale.',
        examples: [
          { en: "No, **we mustn't laugh**.", fr: 'Non, nous ne devons pas rire.' },
          { en: "**I mustn't be** jealous of her.", fr: "Je ne dois pas être jalouse d'elle." },
        ],
      },
    ],
  },
  translateExercises: [
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Je dois aller à l'école.",
    answer: "I must go to school.",
    wordBank: ["I", "must", "go", "to", "school."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Tu ne dois pas manger ici.",
    answer: "You must not eat here.",
    wordBank: ["You", "must", "not", "eat", "here."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Nous devons finir nos devoirs.",
    answer: "We must finish our homework.",
    wordBank: ["We", "must", "finish", "our homework."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Les enfants doivent être calmes.",
    answer: "The children must be quiet.",
    wordBank: ["The children", "must", "be", "quiet."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Ils doivent écouter le professeur.",
    answer: "They must listen to the teacher.",
    wordBank: ["They", "must", "listen", "to", "the teacher."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Tu ne dois pas courir dans le couloir.",
    answer: "You must not run in the hall.",
    wordBank: ["You", "must", "not", "run", "in", "the hall."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Il doit être heureux.",
    answer: "He must be happy.",
    wordBank: ["He", "must", "be", "happy."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Nous devons prendre le petit déjeuner.",
    answer: "We must eat breakfast.",
    wordBank: ["We", "must", "eat", "breakfast."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Ils doivent faire leurs devoirs.",
    answer: "They must do their homework.",
    wordBank: ["They", "must", "do", "their homework."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Tu ne dois pas crier.",
    answer: "You must not shout.",
    wordBank: ["You", "must", "not", "shout."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Nous devons faire attention.",
    answer: "We must be careful.",
    wordBank: ["We", "must", "be", "careful."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Je dois porter un chapeau.",
    answer: "I must wear a hat.",
    wordBank: ["I", "must", "wear", "a hat."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Tu dois suivre les règles.",
    answer: "You must follow the rules.",
    wordBank: ["You", "must", "follow", "the rules."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Il ne doit pas ouvrir la porte.",
    answer: "He must not open the door.",
    wordBank: ["He", "must", "not", "open", "the door."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Elle doit aider son amie.",
    answer: "She must help her friend.",
    wordBank: ["She", "must", "help", "her friend."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Ils doivent arriver à l'heure.",
    answer: "They must arrive on time.",
    wordBank: ["They", "must", "arrive", "on", "time."]
  }
],

  exercises:[
  { "question": "I must go to school.", "answer": true, "explanation": "Correct: 'must' + base verb." },
  { "question": "You must not eat here.", "answer": true, "explanation": "Correct: 'must not' for prohibition." },
  { "question": "He must plays football.", "answer": false, "explanation": "Incorrect: After 'must' use base verb. Correct: 'must play'." },
  { "question": "We must finish our homework.", "answer": true, "explanation": "Correct: 'must' + base verb for obligation." },
  { "question": "She must to clean her room.", "answer": false, "explanation": "Incorrect: 'must' should not be followed by 'to'. Correct: 'must clean'." },
  { "question": "The children must be quiet.", "answer": true, "explanation": "Correct: 'must' + base verb 'be' for obligation." },
  { "question": "I must studying now.", "answer": false, "explanation": "Incorrect: After 'must' use base verb. Correct: 'must study'." },
  { "question": "They must listen to the teacher.", "answer": true, "explanation": "Correct: 'must' + base verb." },
  { "question": "You must not run in the hall.", "answer": true, "explanation": "Correct: 'must not' for prohibition." },
  { "question": "He must be happy.", "answer": true, "explanation": "Correct: 'must' + base verb 'be'." },
  { "question": "She must speaks English.", "answer": false, "explanation": "Incorrect: After 'must' use base verb. Correct: 'must speak'." },
  { "question": "We must eat breakfast.", "answer": true, "explanation": "Correct: 'must' + base verb." },
  { "question": "I must to wash my hands.", "answer": false, "explanation": "Incorrect: 'must' should not be followed by 'to'. Correct: 'must wash'." },
  { "question": "They must do their homework.", "answer": true, "explanation": "Correct: 'must' + base verb." },
  { "question": "You must not shout.", "answer": true, "explanation": "Correct: 'must not' for prohibition." },
  { "question": "He must goes to the park.", "answer": false, "explanation": "Incorrect: After 'must' use base verb. Correct: 'must go'." },
  { "question": "We must be careful.", "answer": true, "explanation": "Correct: 'must' + base verb 'be'." },
  { "question": "She must to drink water.", "answer": false, "explanation": "Incorrect: 'must' should not be followed by 'to'. Correct: 'must drink'." },
  { "question": "I must wear a hat.", "answer": true, "explanation": "Correct: 'must' + base verb." },
  { "question": "They must studying hard.", "answer": false, "explanation": "Incorrect: After 'must' use base verb. Correct: 'must study'." },
  { "question": "You must follow the rules.", "answer": true, "explanation": "Correct: 'must' + base verb for obligation." },
  { "question": "He must not open the door.", "answer": true, "explanation": "Correct: 'must not' for prohibition." },
  { "question": "We must to leave now.", "answer": false, "explanation": "Incorrect: 'must' should not be followed by 'to'. Correct: 'must leave'." },
  { "question": "She must help her friend.", "answer": true, "explanation": "Correct: 'must' + base verb." },
  { "question": "I must to finish this.", "answer": false, "explanation": "Incorrect: 'must' should not be followed by 'to'. Correct: 'must finish'." },
  { "question": "They must arrive on time.", "answer": true, "explanation": "Correct: 'must' + base verb for obligation." }
]
};

export default MustGrammar;
