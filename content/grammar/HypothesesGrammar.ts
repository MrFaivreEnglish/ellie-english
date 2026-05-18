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
    prompt: "Elle est peut-etre a la maison.",
    answer: "She might be at home.",
    wordBank: ["She", "might", "be", "at", "home."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Il doit etre fatigue.",
    answer: "He must be tired.",
    wordBank: ["He", "must", "be", "tired."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "J'irai peut-etre demain.",
    answer: "I might go tomorrow.",
    wordBank: ["I", "might", "go", "tomorrow."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Il se peut qu'il ne soit pas a la maison.",
    answer: "He may not be home.",
    wordBank: ["He", "may", "not", "be", "home."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Il doit neiger maintenant.",
    answer: "It must snow now.",
    wordBank: ["It", "must", "snow", "now."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Il se peut qu'il soit occupe maintenant.",
    answer: "He may be busy now.",
    wordBank: ["He", "may", "be", "busy", "now."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Elle doit etre a l'ecole.",
    answer: "She must be at school.",
    wordBank: ["She", "must", "be", "at", "school."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "C'est peut-etre un chat.",
    answer: "It may be a cat.",
    wordBank: ["It", "may", "be", "a cat."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Il est peut-etre malade.",
    answer: "He might be sick.",
    wordBank: ["He", "might", "be", "sick."]
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
    prompt: "Tu as peut-etre faim.",
    answer: "You might be hungry.",
    wordBank: ["You", "might", "be", "hungry."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Il se peut qu'il soit parti.",
    answer: "He may have gone.",
    wordBank: ["He", "may", "have", "gone."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Elle est peut-etre partie.",
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
    prompt: "Il se peut qu'il ne vienne pas demain.",
    answer: "He might not come tomorrow.",
    wordBank: ["He", "might", "not", "come", "tomorrow."]
  }
],

  exercises: [
    { question: "It may rain.", answer: true, explanation: "Correct — 'may' expresses possibility." },
    { question: "She might be at home.", answer: true, explanation: "Correct — 'might' shows a possible situation." },
    { question: "He must be tired.", answer: true, explanation: "Correct — 'must' expresses a strong guess." },
    { question: "They may can come.", answer: false, explanation: "Wrong structure — use 'may come' or 'can come', not both." },
    { question: "I might go tomorrow.", answer: true, explanation: "Correct — 'might' for uncertain future." },
    { question: "She must to be busy.", answer: false, explanation: "Wrong structure — say 'She must be busy.'" },
    { question: "He may not be home.", answer: true, explanation: "Correct — 'may not' indicates it is possible he is not home." },
    { question: "They might not knows.", answer: false, explanation: "Wrong verb form — say 'They might not know.'" },
    { question: "It must snow now.", answer: true, explanation: "Correct — 'must' for logical conclusion about now." },
    { question: "You might has left.", answer: false, explanation: "Wrong verb form — say 'You might have left.'" },
    { question: "He may be busy now.", answer: true, explanation: "Correct — short, simple example." },
    { question: "She must be at school.", answer: true, explanation: "Correct — 'must' expresses a strong guess." },
    { question: "I may eats later.", answer: false, explanation: "Wrong verb form — say 'I may eat later.'" },
    { question: "They might come to party.", answer: false, explanation: "Missing 'the' or 'the' not needed? Better: 'come to the party.'" },
    { question: "It may be a cat.", answer: true, explanation: "Correct — 'may' used for possibility." },
    { question: "He might be sick.", answer: true, explanation: "Correct — good basic example." },
    { question: "She must to sleep.", answer: false, explanation: "Wrong structure — say 'She must sleep.'" },
    { question: "We may not know yet.", answer: true, explanation: "Correct — 'may not' expresses possible negative." },
    { question: "You might be hungry.", answer: true, explanation: "Correct — simple and clear." },
    { question: "They must to work now.", answer: false, explanation: "Wrong structure — say 'They must work now.'" },
    { question: "He may have gone.", answer: true, explanation: "Correct — 'may have' for past possibility." },
    { question: "She might have left.", answer: true, explanation: "Correct — past possibility with 'might have'." },
    { question: "I must to tell you.", answer: false, explanation: "Wrong structure — say 'I must tell you.'" },
    { question: "It may not be true.", answer: true, explanation: "Correct — possible negative using 'may not'." },
    { question: "He might not come tomorrow.", answer: true, explanation: "Correct — 'might not' for a possible negative future." }
  ]
};

export default HypothesesGrammar;
