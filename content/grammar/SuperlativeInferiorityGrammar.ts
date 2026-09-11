const SuperlativeInferiorityGrammar = {
  id: '22',
  title: "Superlatif d'infériorité",
  description: 'Learn how to use superlatives of inferiority in English',
  imageUrl: 'https://wretggbpaejzjdilemit.supabase.co/storage/v1/object/public/lesson-images/15274719ab/superlatif-d-inferiorite.webp',
  textContent: {
    cards: [
      {
        eyebrow: 'À quoi ça sert',
        paragraph: 'Décrire ce qui est « le moins » (le moins beau, la moins gentille...).',
        tip: 'Formule : the + least + adjectif. Ici, on ne se préoccupe pas des syllabes, c\'est toujours the least + adjectif.',
        columns: [
          {
            label: '1 syllabe',
            accent: 'coral',
            rows: ['Old → **The least old**', 'Small → **The least small**'],
          },
          {
            label: '2 syllabes + Y',
            accent: 'coral',
            rows: ['Pretty → **The least pretty**', 'Funny → **The least funny**'],
          },
          {
            label: '2 syllabes',
            accent: 'blue',
            rows: ['Perfect → **The least perfect**', 'Awful → **The least awful**'],
          },
          {
            label: '3 syllabes et +',
            accent: 'blue',
            rows: ['Beautiful → **The least beautiful**', 'Incredible → **The least incredible**'],
          },
        ],
      },
    ],
  },
translateExercises: [
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Ce livre est le moins intéressant.",
    answer: "This book is the least interesting.",
    wordBank: ["This", "book", "is", "the", "least", "interesting."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Ce sac est le moins cher.",
    answer: "This bag is the least expensive.",
    wordBank: ["This", "bag", "is", "the", "least", "expensive."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Il est le moins grand.",
    answer: "He is the least tall.",
    wordBank: ["He", "is", "the", "least", "tall."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Cette méthode est la moins efficace.",
    answer: "This method is the least effective.",
    wordBank: ["This", "method", "is", "the", "least", "effective."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Cette règle est la moins utile.",
    answer: "This rule is the least useful.",
    wordBank: ["This", "rule", "is", "the", "least", "useful."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Ce jeu est le moins passionnant.",
    answer: "This game is the least exciting.",
    wordBank: ["This", "game", "is", "the", "least", "exciting."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Cet exercice est le moins difficile.",
    answer: "This exercise is the least difficult.",
    wordBank: ["This", "exercise", "is", "the", "least", "difficult."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Cette classe est la moins bruyante.",
    answer: "This class is the least noisy.",
    wordBank: ["This", "class", "is", "the", "least", "noisy."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Ce test est le moins difficile.",
    answer: "This test is the least challenging.",
    wordBank: ["This", "test", "is", "the", "least", "challenging."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Ce voyage est le moins agréable.",
    answer: "This trip is the least pleasant.",
    wordBank: ["This", "trip", "is", "the", "least", "pleasant."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Ce voisin est le moins amical.",
    answer: "This neighbor is the least friendly.",
    wordBank: ["This", "neighbor", "is", "the", "least", "friendly."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Ce parc est le moins bondé.",
    answer: "This park is the least crowded.",
    wordBank: ["This", "park", "is", "the", "least", "crowded."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Ce jour est le moins productif.",
    answer: "This day is the least productive.",
    wordBank: ["This", "day", "is", "the", "least", "productive."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Cette décision est la moins juste.",
    answer: "This decision is the least fair.",
    wordBank: ["This", "decision", "is", "the", "least", "fair."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Ce repas est le moins savoureux.",
    answer: "This meal is the least tasty.",
    wordBank: ["This", "meal", "is", "the", "least", "tasty."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Cette fête est la moins mémorable.",
    answer: "This party is the least memorable.",
    wordBank: ["This", "party", "is", "the", "least", "memorable."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Cette réponse est la moins précise.",
    answer: "This answer is the least accurate.",
    wordBank: ["This", "answer", "is", "the", "least", "accurate."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Ce problème est le moins urgent.",
    answer: "This problem is the least urgent.",
    wordBank: ["This", "problem", "is", "the", "least", "urgent."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Ce mot est le moins courant.",
    answer: "This word is the least common.",
    wordBank: ["This", "word", "is", "the", "least", "common."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Cet élève est le moins coopératif.",
    answer: "This student is the least cooperative.",
    wordBank: ["This", "student", "is", "the", "least", "cooperative."]
  }
],

  exercises: [
    { question: "This is ___ interesting book I have ever read. (interesting)", answer: "the least interesting", options: ["the least interesting", "less interesting", "the most interesting", "most interesting"] },
    { question: "It was ___ expensive restaurant in town. (expensive)", answer: "the least expensive", options: ["the least expensive", "less expensive", "the most expensive", "most expensive"] },
    { question: "She is ___ tall player on the team. (tall)", answer: "the least tall", options: ["the least tall", "less tall", "the most tall", "most tall"] },
    { question: "This is ___ effective solution to the problem. (effective)", answer: "the least effective", options: ["the least effective", "less effective", "the most effective", "most effective"] },
    { question: "He gave ___ useful advice today. (useful)", answer: "the least useful", options: ["the least useful", "less useful", "the most useful", "most useful"] },
    { question: "That was ___ exciting movie I've ever seen. (exciting)", answer: "the least exciting", options: ["the least exciting", "less exciting", "the most exciting", "most exciting"] },
    { question: "This task is ___ difficult of all. (difficult)", answer: "the least difficult", options: ["the least difficult", "less difficult", "the most difficult", "most difficult"] },
    { question: "It is ___ noisy place in the city. (noisy)", answer: "the least noisy", options: ["the least noisy", "less noisy", "the most noisy", "most noisy"] },
    { question: "These tests were ___ challenging. (challenging)", answer: "the least challenging", options: ["the least challenging", "less challenging", "the most challenging", "most challenging"] },
    { question: "That was ___ pleasant experience of my life. (pleasant)", answer: "the least pleasant", options: ["the least pleasant", "less pleasant", "the most pleasant", "most pleasant"] },
    { question: "He is ___ friendly person in the office. (friendly)", answer: "the least friendly", options: ["the least friendly", "less friendly", "the most friendly", "most friendly"] },
    { question: "This road is ___ crowded route at night. (crowded)", answer: "the least crowded", options: ["the least crowded", "less crowded", "the most crowded", "most crowded"] },
    { question: "It was ___ productive day I've had. (productive)", answer: "the least productive", options: ["the least productive", "less productive", "the most productive", "most productive"] },
    { question: "That exam was ___ fair of all. (fair)", answer: "the least fair", options: ["the least fair", "less fair", "the most fair", "most fair"] },
    { question: "This cake is ___ tasty I've ever eaten. (tasty)", answer: "the least tasty", options: ["the least tasty", "less tasty", "the most tasty", "most tasty"] },
    { question: "It was ___ memorable trip of my life. (memorable)", answer: "the least memorable", options: ["the least memorable", "less memorable", "the most memorable", "most memorable"] },
    { question: "She made ___ accurate prediction. (accurate)", answer: "the least accurate", options: ["the least accurate", "less accurate", "the most accurate", "most accurate"] },
    { question: "This assignment was ___ urgent task. (urgent)", answer: "the least urgent", options: ["the least urgent", "less urgent", "the most urgent", "most urgent"] },
    { question: "It is ___ common mistake students make. (common)", answer: "the least common", options: ["the least common", "less common", "the most common", "most common"] },
    { question: "They were ___ cooperative team ever. (cooperative)", answer: "the least cooperative", options: ["the least cooperative", "less cooperative", "the most cooperative", "most cooperative"] },
    { question: "That was ___ successful launch so far. (successful)", answer: "the least successful", options: ["the least successful", "less successful", "the most successful", "most successful"] },
    { question: "It was ___ affordable option available. (affordable)", answer: "the least affordable", options: ["the least affordable", "less affordable", "the most affordable", "most affordable"] },
    { question: "This model is ___ reliable than the others. (reliable)", answer: "the least reliable", options: ["the least reliable", "less reliable", "the most reliable", "most reliable"] }
  ]
};

export default SuperlativeInferiorityGrammar;
