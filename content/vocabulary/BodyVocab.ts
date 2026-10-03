const BodyVocab = {
  id: '22',
  title: 'Body',  description: 'Learn vocabulary related to human body parts',  imageUrl: 'https://wretggbpaejzjdilemit.supabase.co/storage/v1/object/public/lesson-images/15274719ab/body.webp',
  thumbnail: require('../../assets/thumbnails/body-thumbnail.png'),
  flashcards:[
    {
      // The sheet labels the two diagrams "Spider-Man's body" and "Spider-Man's face",
      // so the head sits with the body here rather than with the face.
      category: 'Body 🧍',
      words: [
        { english: 'Head', french: 'Tête' },
        { english: 'Shoulders', french: 'Épaules' },
        { english: 'Arm', french: 'Bras' },
        { english: 'Elbow', french: 'Coude' },
        { english: 'Hand', french: 'Main' },
        { english: 'Fingers', french: 'Doigts' },
        { english: 'Back', french: 'Dos' },
        { english: 'Belly', french: 'Ventre' },
        { english: 'Leg', french: 'Jambe' },
        { english: 'Knee', french: 'Genou' },
        { english: 'Foot', french: 'Pied' }
      ]
    },
    {
      category: 'Face 🙂',
      words: [
        { english: 'Face', french: 'Visage' },
        { english: 'Eye', french: 'Œil' },
        { english: 'Ear', french: 'Oreille' },
        { english: 'Nose', french: 'Nez' },
        { english: 'Mouth', french: 'Bouche' },
        { english: 'Teeth', french: 'Dents' },
        { english: 'Tongue', french: 'Langue' },
        { english: 'Cheek', french: 'Joue' },
        { english: 'Chin', french: 'Menton' }
      ]
    },
  ]
};

export default BodyVocab;
