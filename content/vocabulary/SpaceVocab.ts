const SpaceVocab = {
  id: '41',
  title: 'Space',
  description: 'Learn vocabulary related to astronomy and space exploration',  imageUrl: 'https://wretggbpaejzjdilemit.supabase.co/storage/v1/object/public/lesson-images/15274719ab/space.webp',
  thumbnail: require('../../assets/thumbnails/space-thumbnail.png'),
  flashcards: [
    {
      category: 'Space objects 🌌',
      words: [
        { english: 'An asteroid', french: 'Un astéroïde' },
        { english: 'Stars', french: 'Des étoiles' },
        { english: 'Space', french: "L'espace" },
        { english: 'A planet', french: 'Une planète' },
        { english: 'A meteorite', french: 'Une météorite' },
        { english: 'The Earth', french: 'La Terre' },
        { english: 'The Moon', french: 'La Lune' },
        { english: 'The Sun', french: 'Le Soleil' }
      ]
    },
    {
      // Orbit, gravity and weightlessness sit in this block on the sheet, next to the
      // hardware, rather than in a concepts block of their own.
      category: 'Science and inventions 🚀',
      words: [
        { english: 'A rocket', french: 'Une fusée' },
        { english: 'A spaceship', french: 'Un vaisseau spatial' },
        { english: 'A space station', french: 'Une station spatiale' },
        { english: 'A spacesuit', french: 'Une combinaison spatiale' },
        { english: 'A satellite', french: 'Un satellite' },
        { english: 'Orbit', french: 'Une orbite' },
        { english: 'Gravity', french: 'La gravité' },
        { english: 'Weightlessness', french: "L'apesanteur" }
      ]
    },
    {
      category: 'Actions 🛰️',
      words: [
        { english: 'To launch', french: 'Lancer' },
        { english: 'To take off', french: 'Décoller' },
        { english: 'To land', french: 'Atterrir' },
        { english: 'To observe', french: 'Observer' },
        { english: 'To explore', french: 'Explorer' }
      ]
    },
    {
      category: 'People 👨‍🚀',
      words: [
        { english: 'An astronaut', french: 'Un astronaute' },
        { english: 'A crew', french: 'Un équipage' }
      ]
    },
    {
      category: 'Science-Fiction 🛸',
      words: [
        { english: 'A UFO', french: 'Un OVNI' },
        { english: 'An alien', french: 'Un extraterrestre' }
      ]
    }
  ]
};

export default SpaceVocab;
