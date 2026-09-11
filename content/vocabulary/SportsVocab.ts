const SportsVocab = {
  id: '408',
  title: 'Sports',
  description: 'Sports vocabulary and categories',
  imageUrl: 'https://wretggbpaejzjdilemit.supabase.co/storage/v1/object/public/lesson-images/15274719ab/sports.webp',
  thumbnail: require('../../assets/thumbnails/sports-thumbnail.png'),
  flashcards: [
    {
      category: 'People 👥',
      words: [
        { english: 'An athlete', french: 'Un athlète' },
        { english: 'A player', french: 'Un joueur' },
        { english: 'An opponent', french: 'Un adversaire' },
        { english: 'A team', french: 'Une équipe' },
        { english: 'A coach', french: 'Un entraîneur' },
        { english: 'A referee', french: 'Un arbitre' },
      ],
    },
    {
      category: 'Actions 🏃',
      // Ordered to follow the printed sheet, so a student can read down the lesson image and
      // find the same words in the same order here.
      words: [
        { english: '(to) play', french: 'Jouer' },
        { english: '(to) train', french: "S'entraîner" },
        { english: '(to) practice', french: "S'exercer" },
        { english: '(to) compete', french: 'Participer à une compétition' },
        // One entry, not two, exactly as the sheet gives them in a single cell. Splitting
        // them would put two identical "Participer à" cards on the matching board.
        {
          english: '(to) take part in',
          alternatives: ['(to) participate in', '(to) participate'],
          french: 'Participer à',
        },
        { english: '(to) win', french: 'Gagner' },
        { english: '(to) lose', french: 'Perdre' },
        { english: '(to) achieve', french: 'Atteindre' },
        { english: '(to) accomplish', french: 'Accomplir' },
        { english: '(to) support', french: 'Soutenir' },
        { english: '(to) overcome obstacles', french: 'Surmonter des obstacles' },
        { english: '(to) encourage', french: 'Encourager' },
        { english: '(to) cooperate', french: 'Coopérer' },
      ],
    },
    {
      category: 'Events, Places, Results 🏆',
      words: [
        { english: 'A stadium', french: 'Un stade' },
        { english: 'A tournament', french: 'Un tournoi' },
        { english: 'A ceremony', french: 'Une cérémonie' },
        { english: 'A medal', french: 'Une médaille' },
        { english: 'A trophy', french: 'Un trophée' },
      ],
    },
    {
      category: 'Values 💪',
      words: [
        { english: 'Strong', french: 'Fort' },
        { english: 'Confident', french: 'Confiant' },
        { english: 'Determined', french: 'Déterminé' },
        { english: 'Fair', french: 'Juste' },
        { english: 'Courageous', french: 'Courageux' },
      ],
    },
  ],
};

export default SportsVocab;
