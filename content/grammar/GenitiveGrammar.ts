const GenitiveGrammar = {
  id: '44',
  title: 'Le génitif',
  description: 'Use of the genitive (possessive) in English: "\'s" and "of" constructions',
  imageUrl: 'https://wretggbpaejzjdilemit.supabase.co/storage/v1/object/public/lesson-images/15274719ab/le-genitif.webp',
  textContent: {
    cards: [
      {
        eyebrow: 'Ce que je montre',
        paragraph: 'Je montre à qui appartient quelque chose.',
        tip: "Formule : nom (possesseur) + 's + nom (possédé).",
        examples: [
          { en: '**John’s car** is electric.', fr: 'La voiture de John est électrique.' },
          { en: '**The teacher’s voice** is funny.', fr: 'La voix du professeur est drôle.' },
        ],
      },
      {
        eyebrow: 'Les liens de parenté',
        paragraph: "Le génitif montre aussi les liens de parenté : nom + 's + nom (lien de parenté).",
        tip: "Remarque : si le possesseur est au pluriel, on ajoute seulement une apostrophe, pas 's.",
        examples: [
          { en: 'Tom is **Tabitha’s brother**.', fr: 'Tom est le frère de Tabitha.' },
          { en: '**Ellie’s parents** are cool.', fr: 'Les parents d’Ellie sont cools.' },
          { en: 'I like **the neighbours’ house**.', fr: 'J’aime la maison des voisins.' },
        ],
      },
    ],
  },
translateExercises: [
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Le chien d'Albert est heureux.",
    answer: "Albert's dog is happy.",
    wordBank: ["Albert's", "dog", "is", "happy.", "Albert", "dog's"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Le livre de Sara est rouge.",
    answer: "Sara's book is red.",
    wordBank: ["Sara's", "book", "is", "red.", "Sara", "book's"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Le chapeau de ma mère est neuf.",
    answer: "My mother's hat is new.",
    wordBank: ["My", "mother's", "hat", "is", "new.", "mother", "hat's"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "La queue du chat est longue.",
    answer: "The cat's tail is long.",
    wordBank: ["The", "cat's", "tail", "is", "long.", "cat", "tail's"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "La voiture de Tom est bleue.",
    answer: "Tom's car is blue.",
    wordBank: ["Tom's", "car", "is", "blue.", "Tom", "car's"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Le stylo d'Anna est noir.",
    answer: "Anna's pen is black.",
    wordBank: ["Anna's", "pen", "is", "black.", "Anna", "pen's"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Le ballon des garçons est perdu.",
    answer: "The boys' ball is lost.",
    wordBank: ["The", "boys'", "ball", "is", "lost.", "boy's", "ball's"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Le nom de la fille est May.",
    answer: "The girl's name is May.",
    wordBank: ["The", "girl's", "name", "is", "May.", "girl", "name's"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "La voiture de papa est neuve.",
    answer: "Dad's car is new.",
    wordBank: ["Dad's", "car", "is", "new.", "Dad", "car's"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "La maison de mon ami est grande.",
    answer: "My friend's house is big.",
    wordBank: ["My", "friend's", "house", "is", "big.", "friend", "house's"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Le jouet du bébé est petit.",
    answer: "The baby's toy is small.",
    wordBank: ["The", "baby's", "toy", "is", "small.", "baby", "toy's"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Le sac du professeur est noir.",
    answer: "The teacher's bag is black.",
    wordBank: ["The", "teacher's", "bag", "is", "black.", "teacher", "bag's"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Le panier du chien est doux.",
    answer: "The dog's bed is soft.",
    wordBank: ["The", "dog's", "bed", "is", "soft.", "dog", "bed's"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Le téléphone de Julie est cassé.",
    answer: "Julie's phone is broken.",
    wordBank: ["Julie's", "phone", "is", "broken.", "Julie", "phone's"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Le vélo de mon frère est rapide.",
    answer: "My brother's bike is fast.",
    wordBank: ["My", "brother's", "bike", "is", "fast.", "brother", "bike's"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Le bureau du directeur est grand.",
    answer: "The principal's office is big.",
    wordBank: ["The", "principal's", "office", "is", "big.", "principal", "office's"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Les chaussures de Lisa sont blanches.",
    answer: "Lisa's shoes are white.",
    wordBank: ["Lisa's", "shoes", "are", "white.", "Lisa", "shoe's"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Le gâteau de maman est délicieux.",
    answer: "Mom's cake is delicious.",
    wordBank: ["Mom's", "cake", "is", "delicious.", "Mom", "cake's"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "La chambre des enfants est propre.",
    answer: "The children's room is clean.",
    wordBank: ["The", "children's", "room", "is", "clean.", "children", "room's"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "L'ordinateur de David est nouveau.",
    answer: "David's computer is new.",
    wordBank: ["David's", "computer", "is", "new.", "David", "computer's"]
  }
],

  exercises: [
    { question: "John is father's Tom.", answer: false, explanation: "Wrong order; say: John is Tom's father." },
    { question: "Albert's dog is happy.", answer: true, explanation: "Correct — shows possession." },
    { question: "Sara's book is red.", answer: true, explanation: "Correct — Sara owns the book." },
    { question: "The book Sara is red.", answer: false, explanation: "Wrong order; say: Sara's book is red." },
    { question: "My mother's hat is new.", answer: true, explanation: "Correct — mother's shows possession." },
    { question: "My mother hat is new.", answer: false, explanation: "Missing 's; say: my mother's hat." },
    { question: "The cat's tail is long.", answer: true, explanation: "Correct — cat's shows possession." },
    { question: "The tail cat is long.", answer: false, explanation: "Wrong order; say: The cat's tail is long." },
    { question: "Tom's car is blue.", answer: true, explanation: "Correct — Tom owns the car." },
    { question: "Tom car is blue.", answer: false, explanation: "Missing 's; say: Tom's car is blue." },
    { question: "Anna's pen is black.", answer: true, explanation: "Correct — Anna owns the pen." },
    { question: "Anna pen is black.", answer: false, explanation: "Missing 's; say: Anna's pen is black." },
    { question: "The boys' ball is lost.", answer: true, explanation: "Correct — plural possessive for boys." },
    { question: "The boys's ball is lost.", answer: false, explanation: "Wrong apostrophe; use boys'." },
    { question: "The girl's name is May.", answer: true, explanation: "Correct — girl's shows one girl's name." },
    { question: "The girls' name is May.", answer: false, explanation: "Use girl's for one girl; girls' is plural." },
    { question: "Dad's car is new.", answer: true, explanation: "Correct — Dad's shows possession." },
    { question: "Dads car is new.", answer: false, explanation: "Missing apostrophe; say: Dad's car." },
    { question: "My friend's house is big.", answer: true, explanation: "Correct — friend's shows one friend." },
    { question: "My friends house is big.", answer: false, explanation: "Missing apostrophe; say: my friend's house." },
    { question: "The baby's toy is small.", answer: true, explanation: "Correct — baby's shows possession." },
    { question: "The baby toy is small.", answer: false, explanation: "Missing 's; say: The baby's toy." },
    { question: "The teacher's bag is black.", answer: true, explanation: "Correct — teacher's shows possession." },
    { question: "The teachers bag is black.", answer: false, explanation: "Missing apostrophe; say: The teacher's bag." },
    { question: "The dog's bed is soft.", answer: true, explanation: "Correct — dog's shows possession." }
  ]
};

export default GenitiveGrammar;
