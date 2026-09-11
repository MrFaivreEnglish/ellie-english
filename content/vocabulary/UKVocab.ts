const UKVocab = {
  id: '23',
  title: 'The UK',
  description: 'Learn the countries of the United Kingdom & Ireland and their capitals',
  imageUrl: 'https://wretggbpaejzjdilemit.supabase.co/storage/v1/object/public/lesson-images/15274719ab/the-uk.webp',
  thumbnail: require('../../assets/thumbnails/the-uk-and-ireland-thumbnail.png'),
  flashcards: [
    {
      category: 'Countries 🗺️',
      words: [
        { english: 'The United Kingdom', french: 'Le Royaume-Uni' },
        { english: 'Ireland', french: "L'Irlande" },
        { english: 'Wales', french: 'Le Pays de Galles' },
        { english: 'England', french: "L'Angleterre" },
        { english: 'Northern Ireland', french: "L'Irlande du Nord" },
        { english: 'Scotland', french: "L'Écosse" }
      ]
    },
    {
      category: 'Capitals 🏛️',
      words: [
        { english: 'London', french: "Capitale de l'Angleterre" },
        { english: 'Dublin', french: "Capitale de l'Irlande" },
        { english: 'Edinburgh', french: "Capitale de l'Écosse" },
        { english: 'Cardiff', french: 'Capitale du Pays de Galles' },
        { english: 'Belfast', french: "Capitale de l'Irlande du Nord" }
      ]
    }
  ]
};

export default UKVocab;
