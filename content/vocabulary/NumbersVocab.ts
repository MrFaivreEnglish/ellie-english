// The French side is the number written in digits, so students match the
// English word to the figure rather than to a French spelling.
const NumbersVocab = {
  id: '320',
  title: 'Numbers',
  description: 'Numbers from zero to twenty, the tens, one hundred and one thousand',
  imageUrl:
    'https://wretggbpaejzjdilemit.supabase.co/storage/v1/object/public/lesson-images/15274719ab/Numbers.webp',
  thumbnail: require('../../assets/thumbnails/numbers-thumbnail.png'),
  flashcards: [
    {
      category: '0 to 10 🔢',
      words: [
        { english: 'Zero', french: '0' },
        { english: 'One', french: '1' },
        { english: 'Two', french: '2' },
        { english: 'Three', french: '3' },
        { english: 'Four', french: '4' },
        { english: 'Five', french: '5' },
        { english: 'Six', french: '6' },
        { english: 'Seven', french: '7' },
        { english: 'Eight', french: '8' },
        { english: 'Nine', french: '9' },
        { english: 'Ten', french: '10' },
      ],
    },
    {
      category: '11 to 20 🔢',
      words: [
        { english: 'Eleven', french: '11' },
        { english: 'Twelve', french: '12' },
        { english: 'Thirteen', french: '13' },
        { english: 'Fourteen', french: '14' },
        { english: 'Fifteen', french: '15' },
        { english: 'Sixteen', french: '16' },
        { english: 'Seventeen', french: '17' },
        { english: 'Eighteen', french: '18' },
        { english: 'Nineteen', french: '19' },
        { english: 'Twenty', french: '20' },
      ],
    },
    {
      category: 'Tens 💯',
      words: [
        { english: 'Thirty', french: '30' },
        { english: 'Forty', french: '40' },
        { english: 'Fifty', french: '50' },
        { english: 'Sixty', french: '60' },
        { english: 'Seventy', french: '70' },
        { english: 'Eighty', french: '80' },
        { english: 'Ninety', french: '90' },
        { english: 'One hundred', french: '100' },
        { english: 'One thousand', french: '1000' },
      ],
    },
  ],
};

export default NumbersVocab;
