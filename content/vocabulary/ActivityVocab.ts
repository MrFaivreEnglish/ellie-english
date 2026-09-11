const ActivityVocab = {
  id: '31',
  title: 'Activities',
  description: 'Learn vocabulary related to various activities and hobbies',  imageUrl: 'https://wretggbpaejzjdilemit.supabase.co/storage/v1/object/public/lesson-images/15274719ab/activities.webp',
  thumbnail: require('../../assets/thumbnails/activities-thumbnail.png'),
  flashcards: [
    {
      category: 'Sports & Fitness 🏃‍♂️',
      words: [
        { english: 'To play football', french: 'Jouer au football' },
        { english: 'To do sports', french: 'Faire du sport' },
        { english: 'To do karate', french: 'Faire du karaté' },
        { english: 'To surf', french: 'Surfer' },
        { english: 'To skate', french: 'Faire du skate' },
        { english: 'To swim', french: 'Nager' },
        { english: 'To ice skate', french: 'Faire du patin à glace' }
      ]
    },
    {
      category: 'Arts & Media 🎨',
      words: [
        { english: 'To dance', french: 'Danser' },
        { english: 'To draw', french: 'Dessiner' },
        { english: 'To take photos', french: 'Prendre des photos' },
        { english: 'To shoot a video', french: 'Tourner une vidéo' },
        { english: 'To go to the cinema', french: 'Aller au cinéma' },
        { english: 'To watch films', french: 'Regarder des films' },
        { english: 'To listen to music', french: 'Écouter de la musique' },
        { english: 'To sing', french: 'Chanter' },
        { english: 'To look at paintings', french: 'Regarder des peintures' }
      ]
    },
    {
      category: 'Food & Leisure 🍽️',
      words: [
        { english: 'To eat', french: 'Manger' },
        { english: 'To go to the restaurant', french: 'Aller au restaurant' },
        { english: 'To have a barbecue', french: 'Faire un barbecue' },
        { english: 'To shop', french: 'Faire du shopping' },
        { english: 'To hang out with friends', french: 'Sortir avec des amis' }
      ]
    },
    {
      category: 'Travel & Outdoors ✈️',
      words: [
        { english: 'To take the plane', french: "Prendre l'avion" },
        { english: 'To go to the beach', french: 'Aller à la plage' },
        { english: 'To visit', french: 'Visiter' },
        { english: 'To travel', french: 'Voyager' },
        { english: 'To take a walk', french: 'Faire une promenade' }
      ]
    }
  ]
};

export default ActivityVocab;