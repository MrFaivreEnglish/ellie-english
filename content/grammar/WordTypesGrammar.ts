const WordTypesGrammar = {
  id: '41',
  title: 'Les groupes de mots',
  description: 'Identify common word types: nouns, verbs, adjectives, pronouns',
  imageUrl: 'https://wretggbpaejzjdilemit.supabase.co/storage/v1/object/public/lesson-images/15274719ab/les-groupes-de-mots.webp',
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
    { question: '"Dog" est :', answer: 'un nom', options: ['un nom', 'un verbe', 'un adjectif'] },
    { question: '"Cat" est :', answer: 'un nom', options: ['un nom', 'un verbe', 'un adjectif'] },
    { question: '"Run" est :', answer: 'un verbe', options: ['un verbe', 'un nom', 'un adjectif'] },
    { question: '"Eat" est :', answer: 'un verbe', options: ['un verbe', 'un nom', 'un adjectif'] },
    { question: '"Big" est :', answer: 'un adjectif', options: ['un adjectif', 'un nom', 'un verbe'] },
    { question: '"Small" est :', answer: 'un adjectif', options: ['un adjectif', 'un nom', 'un verbe'] },
    { question: '"He" est :', answer: 'un pronom', options: ['un pronom', 'un nom', 'un adjectif'] },
    { question: '"She" est :', answer: 'un pronom', options: ['un pronom', 'un nom', 'un adjectif'] },
    { question: '"It" est :', answer: 'un pronom', options: ['un pronom', 'un nom', 'un adjectif'] },
    { question: '"Book" est :', answer: 'un nom', options: ['un nom', 'un verbe', 'un adjectif'] },
    { question: '"Play" est :', answer: 'un verbe', options: ['un verbe', 'un nom', 'un adjectif'] },
    { question: '"Happy" est :', answer: 'un adjectif', options: ['un adjectif', 'un nom', 'un verbe'] },
    { question: '"Sad" est :', answer: 'un adjectif', options: ['un adjectif', 'un nom', 'un verbe'] },
    { question: '"Walk" est :', answer: 'un verbe', options: ['un verbe', 'un nom', 'un adjectif'] },
    { question: '"Jump" est :', answer: 'un verbe', options: ['un verbe', 'un nom', 'un adjectif'] },
    { question: '"House" est :', answer: 'un nom', options: ['un nom', 'un verbe', 'un adjectif'] },
    { question: '"Car" est :', answer: 'un nom', options: ['un nom', 'un verbe', 'un adjectif'] },
    { question: '"Apple" est :', answer: 'un nom', options: ['un nom', 'un verbe', 'un adjectif'] },
    { question: '"Banana" est :', answer: 'un nom', options: ['un nom', 'un verbe', 'un adjectif'] },
    { question: '"Friend" est :', answer: 'un nom', options: ['un nom', 'un adjectif', 'un verbe'] },
    { question: '"School" est :', answer: 'un nom', options: ['un nom', 'un verbe', 'un adjectif'] },
    { question: '"Teacher" est :', answer: 'un nom', options: ['un nom', 'un verbe', 'un adjectif'] },
    // Articles and adverbs instead of prépositions/conjonctions: those two are never
    // introduced in the lesson's cards above, so they were testing untaught material.
    // Articles are taught (A, The, My, This) and had no exercises until now.
    { question: '"The" est :', answer: 'un article', options: ['un article', 'un nom', 'un verbe'] },
    { question: '"A" est :', answer: 'un article', options: ['un article', 'un nom', 'un adjectif'] },
    { question: '"My" est :', answer: 'un article', options: ['un article', 'un verbe', 'un adverbe'] },
    { question: '"This" est :', answer: 'un article', options: ['un article', 'un nom', 'un verbe'] },
    { question: '"Loudly" est :', answer: 'un adverbe', options: ['un adverbe', 'un adjectif', 'un nom'] },
    { question: '"We" est :', answer: 'un pronom', options: ['un pronom', 'un nom', 'un adjectif'] },
    { question: '"They" est :', answer: 'un pronom', options: ['un pronom', 'un nom', 'un adjectif'] },
    // Was "Fast", which is both an adjective and an adverb in English — no defensible
    // single answer. "Slowly" is unambiguous, and it's one of the lesson's own examples.
    { question: '"Slowly" est :', answer: 'un adverbe', options: ['un adverbe', 'un adjectif', 'un verbe'] }
  ]
};

export default WordTypesGrammar;
