const DailyRoutineVocab = {
  id: '302',
  title: 'Daily Routine',
  description: 'Common verbs and phrases for daily routine',
  imageUrl: 'https://wretggbpaejzjdilemit.supabase.co/storage/v1/object/public/lesson-images/15274719ab/daily-routine.webp',
  thumbnail: require('../../assets/thumbnails/daily-routine-thumbnail.png'),
  categoryPickerTitle: 'Choose a daily routine category',
  categoryPickerLabel: 'Routine category',
  categoryPickerAllLabel: 'All routine words',
  allowMultiCategorySelection: true,
  flashcards: [
    {
      category: 'Morning 🌅',
      words: [
        { english: 'To wake up', french: 'Se réveiller' },
        { english: 'To get up', french: 'Se lever' },
        { english: 'To have a shower', french: 'Prendre une douche' },
        { english: 'To brush hair', french: 'Se brosser les cheveux' },
        { english: 'To brush teeth', french: 'Se brosser les dents' },
        { english: 'To get dressed', french: "S'habiller" },
        { english: 'To wash your face', french: 'Se laver le visage' },
        { english: 'To have breakfast', french: 'Prendre le petit-déjeuner' },
      ],
    },
    {
      category: 'School Day 🏫',
      words: [
        { english: 'To pack your bag', french: 'Préparer son sac' },
        { english: 'To go to school', french: "Aller à l'école" },
        { english: 'To take the bus', french: 'Prendre le bus' },
        { english: 'To eat at the cafeteria', french: 'Manger à la cantine' },
        { english: 'To do your homework', french: 'Faire ses devoirs' },
      ],
    },
    {
      category: 'Meals 🍽️',
      words: [
        { english: 'To eat', french: 'Manger' },
        { english: 'To have lunch', french: 'Déjeuner' },
        { english: 'To have a snack', french: 'Prendre un goûter' },
        { english: 'To have dinner', french: 'Dîner' },
        { english: 'To cook', french: 'Cuisiner' },
      ],
    },
    {
      category: 'House Chores 🧹',
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
      category: 'Evening 🌙',
      words: [
        { english: 'To go to bed', french: 'Se coucher' },
        { english: 'To sleep', french: 'Dormir' },
      ],
    },
  ],
};

export default DailyRoutineVocab;
