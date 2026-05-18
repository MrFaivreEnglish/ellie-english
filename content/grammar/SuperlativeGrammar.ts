const SuperlativeGrammar = {
  id: '8',
  title: 'Superlatif',
  description: 'Learn how to use superlatives in English',
  imageUrl: 'https://i.ibb.co/1fSC9tpR/Superlatif-sup-riorit.png',
translateExercises: [
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Il est le plus grand de la classe.",
    answer: "He is the tallest in the class.",
    wordBank: ["He", "is", "the", "tallest", "in", "the", "class.", "most"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "C'est le meilleur gâteau.",
    answer: "This is the best cake.",
    wordBank: ["This", "is", "the", "best", "cake.", "goodest"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Ce livre est le plus intéressant.",
    answer: "This book is the most interesting.",
    wordBank: ["This", "book", "is", "the", "most", "interesting.", "interestest"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Cette montagne est la plus haute.",
    answer: "This mountain is the highest.",
    wordBank: ["This", "mountain", "is", "the", "highest.", "most"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "C'est le pire film.",
    answer: "This is the worst movie.",
    wordBank: ["This", "is", "the", "worst", "movie.", "baddest"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Ce jeu est le plus passionnant.",
    answer: "This game is the most exciting.",
    wordBank: ["This", "game", "is", "the", "most", "exciting.", "excitingest"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Elle a la plus jolie robe.",
    answer: "She has the prettiest dress.",
    wordBank: ["She", "has", "the", "prettiest", "dress.", "most"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "C'est le sac le plus cher.",
    answer: "This is the most expensive bag.",
    wordBank: ["This", "is", "the", "most", "expensive", "bag.", "expensivest"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Il est le plus drôle.",
    answer: "He is the funniest.",
    wordBank: ["He", "is", "the", "funniest.", "most"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Le train est le plus rapide.",
    answer: "The train is the fastest.",
    wordBank: ["The", "train", "is", "the", "fastest.", "most"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Elle est la plus talentueuse.",
    answer: "She is the most talented.",
    wordBank: ["She", "is", "the", "most", "talented.", "talentedest"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Mon grand-père est le plus vieux.",
    answer: "My grandfather is the oldest.",
    wordBank: ["My", "grandfather", "is", "the", "oldest.", "most"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Aujourd'hui est le jour le plus chaud.",
    answer: "Today is the hottest day.",
    wordBank: ["Today", "is", "the", "hottest", "day.", "most"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Elle est la plus intelligente.",
    answer: "She is the smartest.",
    wordBank: ["She", "is", "the", "smartest.", "most"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "C'est la plus belle fleur.",
    answer: "This is the most beautiful flower.",
    wordBank: ["This", "is", "the", "most", "beautiful", "flower.", "beautifulest"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Il est le plus gentil.",
    answer: "He is the nicest.",
    wordBank: ["He", "is", "the", "nicest.", "most"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "C'est le jeu le plus simple.",
    answer: "This is the simplest game.",
    wordBank: ["This", "is", "the", "simplest", "game.", "most"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Elle est la plus heureuse.",
    answer: "She is the happiest.",
    wordBank: ["She", "is", "the", "happiest.", "most"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "C'est le plus grand héros.",
    answer: "This is the greatest hero.",
    wordBank: ["This", "is", "the", "greatest", "hero.", "most"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Ce serpent est le plus dangereux.",
    answer: "This snake is the most dangerous.",
    wordBank: ["This", "snake", "is", "the", "most", "dangerous.", "dangerousest"]
  }
],

  exercises: [
    { question: "This is ___ building in the city. (tall)", answer: "the tallest", options: ["the tallest", "the most tall", "taller", "more tall"] },
    { question: "She is ___ student in the class. (good)", answer: "the best", options: ["the best", "the better", "the goodest", "the most good"] },
    { question: "This is ___ movie I've ever seen. (interesting)", answer: "the most interesting", options: ["the most interesting", "the interestingest", "more interesting", "interesting"] },
    { question: "Mount Everest is ___ mountain in the world. (high)", answer: "the highest", options: ["the highest", "the most high", "higher", "more high"] },
    { question: "This was ___ day of my life. (bad)", answer: "the worst", options: ["the worst", "the baddest", "the most bad", "badder"] },
    { question: "He is ___ player on the team. (good)", answer: "the best", options: ["the best", "the better", "the goodest", "the most good"] },
    { question: "This is ___ book I've ever read. (exciting)", answer: "the most exciting", options: ["the most exciting", "the excitingest", "more exciting", "exciting"] },
    { question: "She's ___ girl in her class. (pretty)", answer: "the prettiest", options: ["the prettiest", "the most pretty", "prettier", "more pretty"] },
    { question: "That was ___ movie ever. (bad)", answer: "the worst", options: ["the worst", "the baddest", "the most bad", "worse"] },
    { question: "This is ___ restaurant in town. (expensive)", answer: "the most expensive", options: ["the most expensive", "the expensivest", "more expensive", "expensive"] },
    { question: "He's ___ person I know. (funny)", answer: "the funniest", options: ["the funniest", "the most funny", "funnier", "more funny"] },
    { question: "This is ___ car in the showroom. (fast)", answer: "the fastest", options: ["the fastest", "the most fast", "faster", "more fast"] },
    { question: "She's ___ athlete in the school. (talented)", answer: "the most talented", options: ["the most talented", "the talentedest", "more talented", "talented"] },
    { question: "That's ___ building I've seen. (old)", answer: "the oldest", options: ["the oldest", "the most old", "older", "more old"] },
    { question: "This is ___ day of the year. (hot)", answer: "the hottest", options: ["the hottest", "the most hot", "hotter", "more hot"] },
    { question: "He's ___ student in the class. (smart)", answer: "the smartest", options: ["the smartest", "the most smart", "smarter", "more smart"] },
    { question: "This is ___ place on Earth. (beautiful)", answer: "the most beautiful", options: ["the most beautiful", "the beautifulest", "more beautiful", "beautiful"] },
    { question: "She's ___ person I've met. (nice)", answer: "the nicest", options: ["the nicest", "the most nice", "nicer", "more nice"] },
    { question: "That's ___ solution to the problem. (simple)", answer: "the simplest", options: ["the simplest", "the most simple", "simpler", "more simple"] },
    { question: "This is ___ time of my life. (happy)", answer: "the happiest", options: ["the happiest", "the most happy", "happier", "more happy"] },
    { question: "He's ___ player in history. (great)", answer: "the greatest", options: ["the greatest", "the most great", "greater", "more great"] },
    { question: "This is ___ road in the country. (dangerous)", answer: "the most dangerous", options: ["the most dangerous", "the dangerousest", "more dangerous", "dangerous"] },
    { question: "She's ___ runner on the team. (fast)", answer: "the fastest", options: ["the fastest", "the most fast", "faster", "more fast"] },
    { question: "That's ___ mistake you can make. (big)", answer: "the biggest", options: ["the biggest", "the most big", "bigger", "more big"] },
    { question: "This is ___ food I've ever tasted. (delicious)", answer: "the most delicious", options: ["the most delicious", "the deliciousest", "more delicious", "delicious"] }
  ]
};

export default SuperlativeGrammar;
