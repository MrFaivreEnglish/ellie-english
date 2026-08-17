const HadToWasAllowedToGrammar = {
  id: '34',
  title: 'Had to / Was Allowed To',
  description: 'Practice past obligations and permissions using had to and was allowed to',
  imageUrl: 'https://i.ibb.co/hR1QLZJ3/Had-to-was-allowed-to.png',
  textContent: {
    cards: [
      {
        eyebrow: 'Ce qui était obligé, imposé',
        paragraph: 'Pour parler de ce qui était obligé, imposé, dans le passé.',
        tip: "Formule : sujet + had to / didn't have to + base verbale.",
        columns: [
          {
            label: "Sujet + HAD TO (ou DIDN'T HAVE TO) + base verbale",
            accent: 'blue',
            rows: ['I', 'You', 'He / She / It', 'We', 'They'],
          },
        ],
        examples: [
          { en: '**He had to leave** early.', fr: 'Il devait partir tôt.' },
          { en: "**They didn't have to wait**.", fr: 'Ils ne devaient pas attendre.' },
        ],
      },
      {
        eyebrow: 'Ce qui était autorisé',
        paragraph: 'Formule : sujet + was/were (not) allowed to + base verbale.',
        examples: [
          { en: '**He was allowed to play**.', fr: 'Il avait le droit de jouer à 22h.' },
          { en: "**They weren't allowed to enter**.", fr: 'Ils n’avaient pas le droit d’entrer.' },
        ],
      },
    ],
  },
translateExercises: [
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Je devais finir mes devoirs.",
    answer: "I had to finish my homework.",
    wordBank: ["I", "had", "to", "finish", "my homework."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Ils n’avaient pas à assister à la réunion.",
    answer: "They didn't have to attend the meeting.",
    wordBank: ["They", "didn't", "have", "to", "attend", "the meeting."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Elle n’avait pas le droit d’aller à la fête.",
    answer: "She wasn't allowed to go to the party.",
    wordBank: ["She", "wasn't", "allowed", "to", "go", "to", "the party."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Nous devions nettoyer la salle de classe.",
    answer: "We had to clean the classroom.",
    wordBank: ["We", "had", "to", "clean", "the classroom."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Il n’avait pas à porter un uniforme.",
    answer: "He didn't have to wear a uniform.",
    wordBank: ["He", "didn't", "have", "to", "wear", "a uniform."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Les enfants n’avaient pas le droit de jouer dehors.",
    answer: "The children weren't allowed to play outside.",
    wordBank: ["The children", "weren't", "allowed", "to", "play", "outside."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Tu devais être à l’heure.",
    answer: "You had to be on time.",
    wordBank: ["You", "had", "to", "be", "on time."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Je n’avais pas le droit d’utiliser mon téléphone.",
    answer: "I wasn't allowed to use my phone.",
    wordBank: ["I", "wasn't", "allowed", "to", "use", "my phone."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Elle devait préparer le dîner.",
    answer: "She had to cook dinner.",
    wordBank: ["She", "had", "to", "cook", "dinner."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Nous n’avions pas à rendre le projet hier.",
    answer: "We didn't have to submit the project yesterday.",
    wordBank: ["We", "didn't", "have", "to", "submit", "the project", "yesterday."]
  },

  // SEGREGATION EXAMPLES

  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Les élèves noirs devaient utiliser une autre entrée.",
    answer: "Black students had to use a different entrance.",
    wordBank: ["Black students", "had", "to", "use", "a different entrance."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Les familles noires n’avaient pas le droit d’habiter ici.",
    answer: "Black families weren't allowed to live here.",
    wordBank: ["Black families", "weren't", "allowed", "to", "live", "here."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Les enfants devaient aller dans des écoles séparées.",
    answer: "The children had to go to separate schools.",
    wordBank: ["The children", "had", "to", "go", "to", "separate schools."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Les passagers noirs n’avaient pas le droit de s’asseoir devant.",
    answer: "Black passengers weren't allowed to sit in the front.",
    wordBank: ["Black passengers", "weren't", "allowed", "to", "sit", "in the front."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Les gens devaient utiliser des toilettes différentes.",
    answer: "People had to use different bathrooms.",
    wordBank: ["People", "had", "to", "use", "different bathrooms."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Les enfants noirs n’avaient pas le droit de jouer dans ce parc.",
    answer: "Black children weren't allowed to play in this park.",
    wordBank: ["Black children", "weren't", "allowed", "to", "play", "in", "this park."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Les voyageurs devaient s’asseoir à l’arrière du bus.",
    answer: "The travelers had to sit at the back of the bus.",
    wordBank: ["The travelers", "had", "to", "sit", "at the back", "of the bus."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Les citoyens noirs n’avaient pas le droit d’utiliser cette bibliothèque.",
    answer: "Black citizens weren't allowed to use this library.",
    wordBank: ["Black citizens", "weren't", "allowed", "to", "use", "this library."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Les enfants devaient suivre des règles injustes.",
    answer: "The children had to follow unfair rules.",
    wordBank: ["The children", "had", "to", "follow", "unfair rules."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Les familles devaient vivre dans des quartiers séparés.",
    answer: "Families had to live in separate neighborhoods.",
    wordBank: ["Families", "had", "to", "live", "in", "separate neighborhoods."]
  }
],
  exercises: [
  { "question": "The students had to submit their projects on time.", "answer": true, "explanation": "'Had to' expresses past obligation." },
  { "question": "The children was allowed to eat ice cream after lunch.", "answer": false, "explanation": "Incorrect: 'children' is plural, so it should be 'were allowed to'." },
  { "question": "The employees had to attend the meeting yesterday.", "answer": true, "explanation": "'Had to' expresses past obligation." },
  { "question": "The teacher was allowed to to take a break.", "answer": false, "explanation": "Incorrect: 'was allowed to' should not be followed by 'to'. Correct: 'was allowed to take'." },
  { "question": "The kids had to clean the classroom after art class.", "answer": true, "explanation": "'Had to' expresses past obligation." },
  { "question": "The pets were allowed to plays in the garden.", "answer": false, "explanation": "Incorrect: after 'were allowed to' use base verb. Correct: 'were allowed to play'." },
  { "question": "The tourists had to buy tickets before entering the museum.", "answer": true, "explanation": "'Had to' expresses past obligation." },
  { "question": "The visitors was allowed to take photos inside the exhibition.", "answer": false, "explanation": "Incorrect: 'visitors' is plural, so use 'were allowed to'." },
  { "question": "The team had to practice every day last week.", "answer": true, "explanation": "'Had to' expresses past obligation." },
  { "question": "The children were allowed to watched cartoons after homework.", "answer": false, "explanation": "Incorrect: after 'were allowed to' use base verb. Correct: 'were allowed to watch'." },
  { "question": "The players had to wear helmets during the match.", "answer": true, "explanation": "'Had to' expresses past obligation." },
  { "question": "The students was allowed to leave early on Friday.", "answer": false, "explanation": "Incorrect: 'students' is plural, so it should be 'were allowed to'." },
  { "question": "The chef had to prepare all dishes before noon.", "answer": true, "explanation": "'Had to' expresses past obligation." },
  { "question": "I had to finish my homework before dinner.", "answer": true, "explanation": "'Had to' + base verb expresses past obligation." },
  { "question": "You was allowed to play outside yesterday.", "answer": false, "explanation": "Incorrect: 'you' with past permission uses 'were allowed to'. Correct: 'You were allowed to play'." },
  { "question": "He had to wake up early for the meeting.", "answer": true, "explanation": "'Had to' + base verb expresses past obligation." },
  { "question": "She were allowed to go to the cinema.", "answer": false, "explanation": "Incorrect: 'She' takes 'was allowed to', not 'were allowed to'." },
  { "question": "We had to clean the classroom after the lesson.", "answer": true, "explanation": "'Had to' + base verb expresses past obligation." },
  { "question": "They was allowed to eat ice cream after lunch.", "answer": false, "explanation": "Incorrect: 'They' takes 'were allowed to', not 'was allowed to'." },
  { "question": "It had to be repaired before the exhibition.", "answer": true, "explanation": "'Had to' + base verb expresses past necessity." },
  { "question": "I was allowed to to use the library computer.", "answer": false, "explanation": "Incorrect: 'was allowed to' should not be followed by 'to'. Correct: 'was allowed to use'." },
  { "question": "You had to wear a uniform at school yesterday.", "answer": true, "explanation": "'Had to' + base verb expresses past obligation." },
  { "question": "She were allowed to taking a break during class.", "answer": false, "explanation": "Incorrect: after 'was/were allowed to' use base verb. Correct: 'was allowed to take'." },
  { "question": "We had to submit our projects before the deadline.", "answer": true, "explanation": "'Had to' + base verb expresses past obligation." },
  { "question": "The athletes had to train in the morning.", "answer": true, "explanation": "'Had to' expresses past obligation." },
  { "question": "The employees was allowed to choose their own schedule.", "answer": false, "explanation": "Incorrect: 'employees' is plural, so use 'were allowed to'." },
  { "question": "The children had to wear uniforms at school.", "answer": true, "explanation": "'Had to' expresses past obligation." },
  { "question": "The tourists were allowed to took pictures on the bridge.", "answer": false, "explanation": "Incorrect: after 'were allowed to' use base verb. Correct: 'were allowed to take'." },
  { "question": "The drivers had to stop at the red light yesterday.", "answer": true, "explanation": "'Had to' expresses past obligation." },
  { "question": "The students were allowed to talking during lunch.", "answer": false, "explanation": "Incorrect: after 'were allowed to' use base verb. Correct: 'were allowed to talk'." },
  { "question": "The children had to finish their homework before playing.", "answer": true, "explanation": "'Had to' expresses past obligation." },
  { "question": "The staff were allowed to to leave early on Friday.", "answer": false, "explanation": "Incorrect: 'were allowed to' should not be followed by 'to'. Correct: 'were allowed to leave'." },
  { "question": "The students had to attend the assembly yesterday.", "answer": true, "explanation": "'Had to' expresses past obligation." },
  { "question": "The children were allowed to runs in the park.", "answer": false, "explanation": "Incorrect: after 'were allowed to' use base verb. Correct: 'were allowed to run'." }
]
};

export default HadToWasAllowedToGrammar;
