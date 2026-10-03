const EcologyVocab = {
  id: '27',
  title: 'Ecology',
  description: 'Learn vocabulary related to environment and conservation',  imageUrl: 'https://wretggbpaejzjdilemit.supabase.co/storage/v1/object/public/lesson-images/15274719ab/ecology.webp',
  thumbnail: require('../../assets/thumbnails/ecology-thumbnail.png'),
  flashcards: [
    {
      category: 'Elements 🌿',
      words: [
        { english: 'Nature', french: 'La nature' },
        { english: 'Climate', french: 'Le climat' },
        { english: 'The environment', french: 'L\'environnement' },
        { english: 'Global warming', french: 'Le réchauffement climatique' },
        { english: 'Climate change', french: 'Le changement climatique' },
        { english: 'The Earth', french: 'La Terre' }
      ]
    },
    {
      // The sheet keeps the solar panel, the turbine, the litter and the pollution
      // together in one Objects block rather than splitting energy from waste.
      category: 'Objects ⚡️',
      words: [
        { english: 'A solar panel', french: 'Un panneau solaire' },
        { english: 'Garbage', french: 'Les ordures' },
        { english: 'Litter', french: 'Les détritus' },
        { english: 'A wind turbine', french: 'Une éolienne' },
        { english: 'Pollution', french: 'La pollution' }
      ]
    },
    {
      category: 'Adjectives 🏷️',
      words: [
        { english: 'Ecofriendly', french: 'Écologique' },
        { english: 'Endangered', french: 'En danger' },
        { english: 'Extinct', french: 'Disparu' },
        { english: 'Organic', french: 'Biologique' }
      ]
    },
    {
      category: 'Actions ♻️',
      words: [
        { english: 'To clean', french: 'Nettoyer' },
        { english: 'To preserve', french: 'Préserver' },
        { english: 'To save', french: 'Sauver' },
        { english: 'To recycle', french: 'Recycler' },
        { english: 'To reduce', french: 'Réduire' },
        { english: 'To decrease', french: 'Diminuer' },
        { english: 'To increase', french: 'Augmenter' },
        { english: 'To take care of', french: 'Prendre soin de' }
      ]
    }
  ]
};

export default EcologyVocab;
