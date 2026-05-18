const ArticlesGrammar = {
  id: '40',
  title: 'Les articles',
  description: 'Definite and indefinite articles: a, an, the and when to omit them',
  imageUrl: 'https://i.ibb.co/6RKTZVzq/Articles.png',
translateExercises: [
  // --- A / AN (6) ---
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "J’ai un chien.",
    answer: "I have a dog.",
    wordBank: ["I", "have", "a", "an", "the", "dog"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Elle mange une pomme.",
    answer: "She eats an apple.",
    wordBank: ["She", "eats", "a", "an", "the", "apple"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Je lis un livre.",
    answer: "I read a book.",
    wordBank: ["I", "read", "a", "an", "the", "book"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Il voit un oiseau.",
    answer: "He sees a bird.",
    wordBank: ["He", "sees", "a", "an", "the", "bird"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Nous avons une maison.",
    answer: "We have a house.",
    wordBank: ["We", "have", "a", "an", "the", "house"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Tu as une idée.",
    answer: "You have an idea.",
    wordBank: ["You", "have", "a", "an", "the", "idea"]
  },

  // --- THE (6) ---
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Le chat dort.",
    answer: "The cat sleeps.",
    wordBank: ["The", "a", "cat", "sleeps"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Le soleil brille.",
    answer: "The sun shines.",
    wordBank: ["The", "a", "sun", "shines"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "La porte est ouverte.",
    answer: "The door is open.",
    wordBank: ["The", "a", "door", "is", "open"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Le café est chaud.",
    answer: "The coffee is hot.",
    wordBank: ["The", "a", "coffee", "is", "hot"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Le téléphone sonne.",
    answer: "The phone rings.",
    wordBank: ["The", "a", "phone", "rings"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "La musique est belle.",
    answer: "The music is beautiful.",
    wordBank: ["The", "a", "music", "is", "beautiful"]
  },

  // --- MIXED (8) ---
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Le chien a un jouet.",
    answer: "The dog has a toy.",
    wordBank: ["The", "dog", "has", "a", "an", "the", "toy"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Le chat mange une souris.",
    answer: "The cat eats a mouse.",
    wordBank: ["The", "cat", "eats", "a", "an", "the", "mouse"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "La fille a un vélo.",
    answer: "The girl has a bike.",
    wordBank: ["The", "girl", "has", "a", "an", "the", "bike"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Le garçon lit un livre.",
    answer: "The boy reads a book.",
    wordBank: ["The", "boy", "reads", "a", "an", "the", "book"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Le professeur a une classe.",
    answer: "The teacher has a class.",
    wordBank: ["The", "teacher", "has", "a", "an", "the", "class"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "La femme boit un café.",
    answer: "The woman drinks a coffee.",
    wordBank: ["The", "woman", "drinks", "a", "an", "the", "coffee"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Le bébé a un jouet.",
    answer: "The baby has a toy.",
    wordBank: ["The", "baby", "has", "a", "an", "the", "toy"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "L’homme mange une pomme.",
    answer: "The man eats an apple.",
    wordBank: ["The", "man", "eats", "a", "an", "the", "apple"]
  }
],

  exercises: [
    { question: 'I saw ___ dog in the park.', answer: 'a', options: ['a', 'the', 'an'] },
    { question: '___ sun rises in the east.', answer: 'The', options: ['A', 'The', 'An'] },
    { question: 'She is ___ honest person.', answer: 'an', options: ['a', 'the', 'an'] },
    { question: 'He went to ___ university last year.', answer: 'the', options: ['a', 'the', ''] },
    { question: 'I need ___ umbrella.', answer: 'an', options: ['a', 'an', 'the'] },
    { question: 'They live in ___ small village.', answer: 'a', options: ['the', 'a', 'an'] },
    { question: '___ Mount Everest is high.', answer: 'Mount Everest', options: ['The', 'A', ''] },
    { question: 'She has ___ apple.', answer: 'an', options: ['a', 'an', 'the'] },
    { question: '___ Pacific Ocean is vast.', answer: 'The', options: ['A', 'The', ''] },
    { question: 'He is ___ engineer.', answer: 'an', options: ['a', 'an', 'the'] },
    { question: 'I bought ___ new car yesterday.', answer: 'a', options: ['a', 'an', 'the'] },
    { question: '___ moon looks beautiful tonight.', answer: 'The', options: ['A', 'The', 'An'] },
    { question: 'She wants to be ___ artist.', answer: 'an', options: ['a', 'an', 'the'] },
    { question: 'Is there ___ supermarket near here?', answer: 'a', options: ['a', 'the', 'an'] },
    { question: 'They went to ___ cinema to watch a movie.', answer: 'the', options: ['a', 'the', 'an'] },
    { question: '___ honesty is important.', answer: '', options: ['a', 'the', ''] },
    { question: 'He is ___ only person who knew the truth.', answer: 'the', options: ['a', 'the', ''] },
    { question: 'She ordered ___ egg for breakfast.', answer: 'an', options: ['a', 'an', 'the'] },
    { question: 'We visited ___ Louvre museum in Paris.', answer: 'the', options: ['the', 'a', ''] },
    { question: 'Do you have ___ pen I can borrow?', answer: 'a', options: ['a', 'an', 'the'] },
    { question: '___ Alps are in Europe.', answer: 'The', options: ['A', 'The', ''] },
    { question: 'He became ___ doctor last year.', answer: 'a', options: ['a', 'the', 'an'] },
    { question: 'She is ___ best student in the class.', answer: 'the', options: ['a', 'the', 'an'] },
    { question: 'I would like ___ orange please.', answer: 'an', options: ['a', 'an', 'the'] },
    { question: 'They live by ___ sea.', answer: 'the', options: ['a', 'the', ''] }
  ]
};

export default ArticlesGrammar;
