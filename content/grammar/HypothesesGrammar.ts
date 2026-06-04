const HypothesesGrammar = {
  id: '26',
  title: 'Hypothèses',
  description: 'Form hypotheses using may, might, and must',
  imageUrl: 'https://i.ibb.co/B7g41zK/Hypoth-ses.png',
  translateExercises: [
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Il se peut qu'il pleuve.",
    answer: "It may rain.",
    wordBank: ["It", "may", "rain."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Elle appellera peut-être.",
    answer: "She might call.",
    wordBank: ["She", "might", "call."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Il doit savoir.",
    answer: "He must know.",
    wordBank: ["He", "must", "know."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "J'irai peut-être demain.",
    answer: "I might go tomorrow.",
    wordBank: ["I", "might", "go", "tomorrow."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Il se peut qu'il ne réponde pas.",
    answer: "He may not answer.",
    wordBank: ["He", "may", "not", "answer."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Il doit dormir.",
    answer: "He must be sleeping.",
    wordBank: ["He", "must", "be", "sleeping."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Il se peut qu'il travaille.",
    answer: "He may work.",
    wordBank: ["He", "may", "work."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Elle doit savoir.",
    answer: "She must know.",
    wordBank: ["She", "must", "know."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Ça peut marcher.",
    answer: "It may work.",
    wordBank: ["It", "may", "work."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Il viendra peut-être.",
    answer: "He might come.",
    wordBank: ["He", "might", "come."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Il se peut que nous ne sachions pas encore.",
    answer: "We may not know yet.",
    wordBank: ["We", "may", "not", "know", "yet."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Tu as peut-être raison.",
    answer: "You might be right.",
    wordBank: ["You", "might", "be", "right."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Il est peut-être parti.",
    answer: "He may have left.",
    wordBank: ["He", "may", "have", "left."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Elle est peut-être partie.",
    answer: "She might have left.",
    wordBank: ["She", "might", "have", "left."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Il se peut que ce ne soit pas vrai.",
    answer: "It may not be true.",
    wordBank: ["It", "may", "not", "be", "true."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Il ne viendra peut-être pas.",
    answer: "He might not come.",
    wordBank: ["He", "might", "not", "come."]
  }
],

  exercises: [
    { question: "It may rain.", answer: true, explanation: "Correct — 'may' expresses possibility." },
    { question: "She might call.", answer: true, explanation: "Correct — 'might' + base verb expresses possibility." },
    { question: "He must know.", answer: true, explanation: "Correct — 'must' + base verb expresses a strong guess." },
    { question: "They may can come.", answer: false, explanation: "Wrong structure — use 'may come' or 'can come', not both." },
    { question: "I might go tomorrow.", answer: true, explanation: "Correct — 'might' for uncertain future." },
    { question: "She must to be busy.", answer: false, explanation: "Wrong structure — say 'She must be busy.'" },
    { question: "He may not answer.", answer: true, explanation: "Correct — 'may not' + base verb expresses a possible negative." },
    { question: "They might not knows.", answer: false, explanation: "Wrong verb form — say 'They might not know.'" },
    { question: "He must be sleeping.", answer: true, explanation: "Correct — 'must be' + -ing expresses a strong guess about now." },
    { question: "You might has left.", answer: false, explanation: "Wrong verb form — say 'You might have left.'" },
    { question: "He may work.", answer: true, explanation: "Correct — 'may' + base verb expresses possibility." },
    { question: "She must know.", answer: true, explanation: "Correct — 'must' + base verb expresses a strong guess." },
    { question: "I may eats later.", answer: false, explanation: "Wrong verb form — say 'I may eat later.'" },
    { question: "They might come to the party.", answer: true, explanation: "Correct — 'might' + base verb expresses possibility." },
    { question: "It may work.", answer: true, explanation: "Correct — 'may' + base verb expresses possibility." },
    { question: "He might come.", answer: true, explanation: "Correct — 'might' + base verb expresses an uncertain future action." },
    { question: "She must to sleep.", answer: false, explanation: "Wrong structure — say 'She must sleep.'" },
    { question: "We may not know yet.", answer: true, explanation: "Correct — 'may not' expresses possible negative." },
    { question: "You might be right.", answer: true, explanation: "Correct — 'might be' expresses possibility." },
    { question: "They must to work now.", answer: false, explanation: "Wrong structure — say 'They must work now.'" },
    { question: "He may have left.", answer: true, explanation: "Correct — 'may have' for past possibility." },
    { question: "She might have left.", answer: true, explanation: "Correct — past possibility with 'might have'." },
    { question: "I must to tell you.", answer: false, explanation: "Wrong structure — say 'I must tell you.'" },
    { question: "It may not be true.", answer: true, explanation: "Correct — possible negative using 'may not'." },
    { question: "He might not come.", answer: true, explanation: "Correct — 'might not' for a possible negative future." }
  ]
};

export default HypothesesGrammar;
