const FurnitureVocab = {
  id: '25',
  title: 'Furniture',
  description: 'Learn vocabulary related to home furniture and furnishings',  imageUrl: 'https://wretggbpaejzjdilemit.supabase.co/storage/v1/object/public/lesson-images/15274719ab/furniture.webp',
  thumbnail: require('../../assets/thumbnails/furniture-thumbnail.png'),
  flashcards: [
    {
      category: 'In the bedroom 🛏️',
      words: [
        { english: 'Bed', french: 'Lit' },
        { english: 'Lamp', french: 'Lampe' },
        { english: 'Wardrobe', french: 'Armoire' },
        { english: 'Desk', french: 'Bureau' }
      ]
    },
    {
      category: 'In the bathroom 🛁',
      words: [
        { english: 'Shower', french: 'Douche' },
        { english: 'Bathtub', french: 'Baignoire' },
        { english: 'Washing machine', french: 'Machine à laver' },
        { english: 'Mirror', french: 'Miroir' }
      ]
    },
    {
      category: 'In the kitchen 🍽️',
      words: [
        { english: 'Fridge', french: 'Réfrigérateur' },
        { english: 'Oven', french: 'Four' },
        { english: 'Cupboard', french: 'Placard' },
        { english: 'Table', french: 'Table' },
        { english: 'Chair', french: 'Chaise' }
      ]
    },
    {
      category: 'In the living room 🛋️',
      words: [
        { english: 'Sofa', french: 'Canapé' },
        { english: 'Armchair', french: 'Fauteuil' },
        { english: 'Carpet', french: 'Tapis' },
        { english: 'Bookcase', french: 'Bibliothèque' },
        { english: 'TV stand', french: 'Meuble TV' }
      ]
    },
    {
      category: 'Around the house 🏡',
      words: [
        { english: 'Swimming pool', french: 'Piscine' },
        { english: 'Garden', french: 'Jardin' },
        { english: 'Car', french: 'Voiture' }
      ]
    },
    {
      category: 'House elements 🚪',
      words: [
        { english: 'Staircase', french: 'Escalier' },
        { english: 'Door', french: 'Porte' },
        { english: 'Window', french: 'Fenêtre' }
      ]
    }
  ]
};

export default FurnitureVocab;
