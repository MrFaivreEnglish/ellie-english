const FashionVocab = {
  id: '314',
  title: 'Fashion',
  description: 'Learn vocabulary related to fashion and clothing trends',
  imageUrl: 'https://wretggbpaejzjdilemit.supabase.co/storage/v1/object/public/lesson-images/15274719ab/fashion.webp?v=2',
  thumbnail: require('../../assets/thumbnails/fashion-thumbnail.png'),
  flashcards: [
    {
      // The sheet runs every style adjective under one Defining style block, in this
      // order, so a student reading down the sheet finds the same words here.
      category: 'Defining style 🧥',
      words: [
        { english: 'Trendy, Stylish', french: 'Tendance, Stylé' },
        { english: 'Old-fashioned', french: 'Démodé' },
        { english: 'Casual, Relaxed', french: 'Décontracté, Détendu' },
        { english: 'Dressy, Fancy', french: 'Chic' },
        { english: 'Formal', french: 'Formel' },
        { english: 'Elegant', french: 'Élégant' },
        { english: 'Classic', french: 'Classique' },
        { english: 'Basic', french: 'Basique' },
        { english: 'Colourful', french: 'Coloré' },
        { english: 'Worn out', french: 'Usé' },
        { english: 'Slim, Tight', french: 'Ajusté, Serré' },
        { english: 'Loose, Baggy', french: 'Ample, Large' },
        { english: 'Comfortable', french: 'Confortable' },
        { english: 'Interesting', french: 'Intéressant' },
        { english: 'Boring', french: 'Ennuyeux' },
        { english: 'Playful, Fun', french: 'Amusant' },
        { english: 'Pretty', french: 'Joli' },
        { english: 'Cute', french: 'Mignon' }
      ]
    },
    {
      category: 'Ecology and fashion 🌱',
      words: [
        { english: 'Sustainable, Eco-friendly', french: 'Durable, Écologique' },
        { english: 'Organic', french: 'Bio' },
        { english: 'Second-hand', french: 'De seconde main' },
        { english: 'Natural', french: 'Naturel' },
        { english: 'Plastic', french: 'Plastique' },
        { english: 'Durable', french: 'Durable' },
        { english: 'Cheap', french: 'Pas cher' },
        { english: 'Expensive', french: 'Cher' }
      ]
    },
    {
      category: 'Actions 🛒',
      words: [
        { english: '(to) recycle', french: 'Recycler' },
        { english: '(to) repair', french: 'Réparer' },
        { english: '(to) mend', french: 'Raccommoder' },
        { english: '(to) take care of', french: 'Prendre soin de' },
        { english: '(to) wear', french: 'Porter' },
        { english: '(to) buy', french: 'Acheter' },
        { english: '(to) think', french: 'Réfléchir' },
        { english: '(to) choose carefully', french: 'Choisir avec soin' },
        { english: '(to) give', french: 'Donner' },
        { english: '(to) focus on quality', french: 'Se concentrer sur la qualité' },
        { english: '(to) follow trends', french: 'Suivre les tendances' },
        { english: '(to) throw away', french: 'Jeter' }
      ]
    }
  ]
};

export default FashionVocab;
