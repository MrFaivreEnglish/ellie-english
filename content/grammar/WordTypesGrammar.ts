const WordTypesGrammar = {
  id: '41',
  title: 'Les groupes de mots',
  description: 'Identify common word types: nouns, verbs, adjectives, pronouns',
  imageUrl: 'https://i.ibb.co/wNYxhH6t/Groupes-de-mots.png',
  textContent: {
    cards: [
      {
        eyebrow: 'Nom et pronom',
        paragraph: "Dans une phrase, ils montrent qui fait l'action : ce sont des sujets.",
        columns: [
          {
            label: 'NOM · Désigne une personne, un animal, un objet',
            accent: 'blue',
            rows: ['Girl', 'John', 'Dog', 'Table'],
          },
          {
            label: 'PRONOM · Remplace un nom dans une phrase',
            accent: 'teal',
            rows: ['I', 'You', 'He, She, It', 'We', 'You', 'They'],
          },
        ],
      },
      {
        eyebrow: 'Article, verbe, adjectif et adverbe',
        tip: 'Exemple : "She quickly reads the big book." → Pronom, adverbe, verbe, article, adjectif, nom.',
        columns: [
          {
            label: 'ARTICLE · Se place devant un nom pour le préciser',
            accent: 'amber',
            rows: ['A', 'The', 'My', 'This'],
          },
          {
            label: 'VERBE · Décrit une action',
            accent: 'coral',
            rows: ['Eat', 'Drink', 'Speak'],
          },
          {
            label: "ADJECTIF · Décrit quelqu'un ou quelque chose",
            accent: 'teal',
            rows: ['Nice', 'Blue', 'Incredible'],
          },
          {
            label: "ADVERBE · Modifie le sens d'un verbe, d'un adjectif",
            accent: 'blue',
            rows: ['Slowly', 'Very', 'Loudly'],
          },
        ],
      },
    ],
  },

  exercises: [
    { question: 'Dog est un _____ :', answer: 'nom', options: ['nom', 'verbe', 'adjectif'] },
    { question: 'Cat est un _____ :', answer: 'nom', options: ['nom', 'verbe', 'adjectif'] },
    { question: 'Run est un _____ :', answer: 'verbe', options: ['verbe', 'nom', 'adjectif'] },
    { question: 'Eat est un _____ :', answer: 'verbe', options: ['verbe', 'nom', 'adjectif'] },
    { question: 'Big est un _____ :', answer: 'adjectif', options: ['adjectif', 'nom', 'verbe'] },
    { question: 'Small est un _____ :', answer: 'adjectif', options: ['adjectif', 'nom', 'verbe'] },
    { question: 'He est un _____ :', answer: 'pronom', options: ['pronom', 'nom', 'adjectif'] },
    { question: 'She est un _____ :', answer: 'pronom', options: ['pronom', 'nom', 'adjectif'] },
    { question: 'It est un _____ :', answer: 'pronom', options: ['pronom', 'nom', 'adjectif'] },
    { question: 'Book est un _____ :', answer: 'nom', options: ['nom', 'verbe', 'adjectif'] },
    { question: 'Play est un _____ :', answer: 'verbe', options: ['verbe', 'nom', 'adjectif'] },
    { question: 'Happy est un _____ :', answer: 'adjectif', options: ['adjectif', 'nom', 'verbe'] },
    { question: 'Sad est un _____ :', answer: 'adjectif', options: ['adjectif', 'nom', 'verbe'] },
    { question: 'Walk est un _____ :', answer: 'verbe', options: ['verbe', 'nom', 'adjectif'] },
    { question: 'Jump est un _____ :', answer: 'verbe', options: ['verbe', 'nom', 'adjectif'] },
    { question: 'House est un _____ :', answer: 'nom', options: ['nom', 'verbe', 'adjectif'] },
    { question: 'Car est un _____ :', answer: 'nom', options: ['nom', 'verbe', 'adjectif'] },
    { question: 'Apple est un _____ :', answer: 'nom', options: ['nom', 'verbe', 'adjectif'] },
    { question: 'Banana est un _____ :', answer: 'nom', options: ['nom', 'verbe', 'adjectif'] },
    { question: 'Friend est un _____ :', answer: 'nom', options: ['nom', 'adjectif', 'verbe'] },
    { question: 'School est un _____ :', answer: 'nom', options: ['nom', 'verbe', 'adjectif'] },
    { question: 'Teacher est un _____ :', answer: 'nom', options: ['nom', 'verbe', 'adjectif'] },
    { question: 'Under est un _____ :', answer: 'préposition', options: ['préposition', 'conjonction', 'adverbe'] },
    { question: 'On est un _____ :', answer: 'préposition', options: ['préposition', 'conjonction', 'adverbe'] },
    { question: 'In est un _____ :', answer: 'préposition', options: ['préposition', 'conjonction', 'adverbe'] },
    { question: 'And est un _____ :', answer: 'conjonction', options: ['conjonction', 'préposition', 'adverbe'] },
    { question: 'But est un _____ :', answer: 'conjonction', options: ['conjonction', 'préposition', 'adverbe'] },
    { question: 'We est un _____ :', answer: 'pronom', options: ['pronom', 'nom', 'adjectif'] },
    { question: 'They est un _____ :', answer: 'pronom', options: ['pronom', 'nom', 'adjectif'] },
    { question: 'Fast est un _____ :', answer: 'adverbe', options: ['adverbe', 'adjectif', 'verbe'] }
  ]
};

export default WordTypesGrammar;
