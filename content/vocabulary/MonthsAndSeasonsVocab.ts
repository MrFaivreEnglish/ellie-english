const MonthsAndSeasonsVocab = {
  id: '319',
  title: 'Months and Seasons',
  description: 'The twelve months and the four seasons',
  imageUrl:
    'https://wretggbpaejzjdilemit.supabase.co/storage/v1/object/public/lesson-images/15274719ab/Months%20and%20seasons.webp',
  thumbnail: require('../../assets/thumbnails/months-thumbnail.png'),
  flashcards: [
    {
      category: 'Months 📆',
      words: [
        { english: 'January', french: 'Janvier' },
        { english: 'February', french: 'Février' },
        { english: 'March', french: 'Mars' },
        { english: 'April', french: 'Avril' },
        { english: 'May', french: 'Mai' },
        { english: 'June', french: 'Juin' },
        { english: 'July', french: 'Juillet' },
        { english: 'August', french: 'Août' },
        { english: 'September', french: 'Septembre' },
        { english: 'October', french: 'Octobre' },
        { english: 'November', french: 'Novembre' },
        { english: 'December', french: 'Décembre' },
      ],
    },
    {
      // The sheet marks each season on the month it starts in: March, June,
      // September, December. Listed in that same order here.
      category: 'Seasons 🍂',
      words: [
        { english: 'Spring', french: 'Le printemps' },
        { english: 'Summer', french: "L'été" },
        { english: 'Autumn', french: "L'automne" },
        { english: 'Winter', french: "L'hiver" },
      ],
    },
  ],
};

export default MonthsAndSeasonsVocab;
