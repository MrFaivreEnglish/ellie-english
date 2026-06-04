const MustHaveToGrammar = {
  id: '27',
  title: 'Must et Have to',
  description: 'Comprendre la différence entre must et have to',
  imageUrl: 'https://i.ibb.co/FbpBmQ8H/Must-Have-to.png',
  translateExercises: [
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Tu dois t'arrêter.",
    answer: "You must stop.",
    wordBank: ["You", "must", "stop."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Je dois aller.",
    answer: "I have to go.",
    wordBank: ["I", "have", "to", "go."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Elle doit être calme.",
    answer: "She must be quiet.",
    wordBank: ["She", "must", "be", "quiet."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Nous devons manger maintenant.",
    answer: "We have to eat now.",
    wordBank: ["We", "have", "to", "eat", "now."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Il doit porter un chapeau.",
    answer: "He must wear a hat.",
    wordBank: ["He", "must", "wear", "a hat."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Ils doivent attendre.",
    answer: "They have to wait.",
    wordBank: ["They", "have", "to", "wait."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Je dois étudier.",
    answer: "I must study.",
    wordBank: ["I", "must", "study."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Tom doit travailler.",
    answer: "Tom has to work.",
    wordBank: ["Tom", "has", "to", "work."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Tu dois appeler.",
    answer: "You must call.",
    wordBank: ["You", "must", "call."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Elle doit dormir.",
    answer: "She has to sleep.",
    wordBank: ["She", "has", "to", "sleep."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Nous devons écouter.",
    answer: "We must listen.",
    wordBank: ["We", "must", "listen."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Je dois nettoyer.",
    answer: "I have to clean.",
    wordBank: ["I", "have", "to", "clean."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Ils doivent se dépêcher.",
    answer: "They must hurry.",
    wordBank: ["They", "must", "hurry."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Papa doit cuisiner.",
    answer: "Dad has to cook.",
    wordBank: ["Dad", "has", "to", "cook."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Les enfants doivent aller au lit.",
    answer: "Kids have to go to bed.",
    wordBank: ["Kids", "have", "to", "go", "to", "bed."]
  }
],

  exercises: [
    { question: 'You must stop.', answer: true, explanation: "Correct: 'must' + base verb for obligation." },
    { question: 'I have to go.', answer: true, explanation: "Correct: 'have to' + base verb for necessity." },
    { question: 'She must be quiet.', answer: true, explanation: "Correct: 'must' + base verb." },
    { question: 'We have to eat now.', answer: true, explanation: "Correct: 'have to' + base verb." },
    { question: 'He must wear a hat.', answer: true, explanation: "Correct: 'must' + base verb." },
    { question: 'They have to wait.', answer: true, explanation: "Correct: 'have to' + base verb." },
    { question: 'I must study.', answer: true, explanation: "Correct: 'must' + base verb." },
    { question: 'Tom has to work.', answer: true, explanation: "Correct: third person 'has to' + base verb." },
    { question: 'You must call.', answer: true, explanation: "Correct: 'must' + base verb." },
    { question: 'She has to sleep.', answer: true, explanation: "Correct: 'has to' + base verb." },
    { question: 'We must listen.', answer: true, explanation: "Correct: 'must' + base verb." },
    { question: 'I have to clean.', answer: true, explanation: "Correct: 'have to' + base verb." },
    { question: 'They must hurry.', answer: true, explanation: "Correct: 'must' + base verb." },
    { question: 'Dad has to cook.', answer: true, explanation: "Correct: 'has to' + base verb." },
    { question: 'Kids have to go to bed.', answer: true, explanation: "Correct: 'have to' + base verb." },

    { question: 'You must to leave.', answer: false, explanation: "Incorrect: do not use 'to' after 'must'." },
    { question: 'I have to going.', answer: false, explanation: "Incorrect: use base verb after 'have to'." },
    { question: 'She musts run.', answer: false, explanation: "Incorrect: 'must' has no -s in third person." },
    { question: 'We has to eat.', answer: false, explanation: "Incorrect: use 'have to' with 'we'." },
    { question: 'He musts be quiet.', answer: false, explanation: "Incorrect: 'must' has no -s." },
    { question: 'They have eats.', answer: false, explanation: "Incorrect: use base verb after 'have to'." },
    { question: 'I must to study.', answer: false, explanation: "Incorrect: drop 'to' after 'must'." },
    { question: 'Tom have to work.', answer: false, explanation: "Incorrect: use 'has to' for third person." },
    { question: 'You have to called.', answer: false, explanation: "Incorrect: use base verb after 'have to'." },
    { question: 'She must be quieting.', answer: false, explanation: "Incorrect: use base verb after modal 'must'." },
    { question: 'We musts listen.', answer: false, explanation: "Incorrect: 'must' has no -s." },
    { question: 'I have clean.', answer: false, explanation: "Incorrect: use 'have to' + base verb." },
    { question: 'They musted hurry.', answer: false, explanation: "Incorrect: 'must' does not take -ed." },
    { question: 'Dad have to cook.', answer: false, explanation: "Incorrect: use 'has to' for third person.'" },
    { question: 'Kids must to go to bed.', answer: false, explanation: "Incorrect: drop 'to' after 'must'." }
  ]
};

export default MustHaveToGrammar;
