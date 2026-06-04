const DailyRoutineVocab = {
  id: '302',
  title: 'Daily Routine',
  description: 'Common verbs and phrases for daily routine',
  imageUrl: 'https://i.ibb.co/pr6b7j1N/daily-routine.webp',
  thumbnail: require('../../assets/thumbnails/daily-routine-thumbnail.png'),
  categoryPickerTitle: 'Choose a daily routine category',
  categoryPickerLabel: 'Routine category',
  categoryPickerAllLabel: 'All routine words',
  allowMultiCategorySelection: true,
  flashcards: [
    {
      category: 'Morning',
      words: [
        { english: 'To wake up', french: 'Se r\u00e9veiller' },
        { english: 'To get up', french: 'Se lever' },
        { english: 'To have a shower', french: 'Prendre une douche' },
        { english: 'To brush hair', french: 'Se brosser les cheveux' },
        { english: 'To brush teeth', french: 'Se brosser les dents' },
        { english: 'To get dressed', french: "S'habiller" },
        { english: 'To wash your face', french: 'Se laver le visage' },
        { english: 'To have breakfast', french: 'Prendre le petit-d\u00e9jeuner' },
      ],
    },
    {
      category: 'School Day',
      words: [
        { english: 'To pack your bag', french: 'Pr\u00e9parer son sac' },
        { english: 'To go to school', french: "Aller \u00e0 l'\u00e9cole" },
        { english: 'To take the bus', french: 'Prendre le bus' },
        { english: 'To eat at the cafeteria', french: 'Manger \u00e0 la cantine' },
        { english: 'To do your homework', french: 'Faire ses devoirs' },
      ],
    },
    {
      category: 'Meals',
      words: [
        { english: 'To eat', french: 'Manger' },
        { english: 'To have lunch', french: 'D\u00e9jeuner' },
        { english: 'To have a snack', french: 'Prendre un go\u00fbter' },
        { english: 'To have dinner', french: 'D\u00eener' },
        { english: 'To cook', french: 'Cuisiner' },
      ],
    },
    {
      category: 'House Chores',
      words: [
        { english: 'To lay the table', french: 'Mettre la table' },
        { english: 'To wash the dishes', french: 'Faire la vaisselle' },
        { english: 'To clean the house', french: 'Nettoyer la maison' },
        { english: 'To tidy the room', french: 'Ranger la chambre' },
        { english: 'To walk the dog', french: 'Promener le chien' },
        { english: 'To take out the bin', french: 'Sortir la poubelle' },
        { english: 'To wash clothes', french: 'Laver les vêtements' },
      ],
    },
    {
      category: 'Evening',
      words: [
        { english: 'To go to bed', french: 'Se coucher' },
        { english: 'To sleep', french: 'Dormir' },
      ],
    },
  ],
};

export default DailyRoutineVocab;
