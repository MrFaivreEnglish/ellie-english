const CookingVocab = {
  id: '208',
  title: 'Cooking',
  description: 'Learn common cooking verbs, utensils and techniques',
  imageUrl: 'https://wretggbpaejzjdilemit.supabase.co/storage/v1/object/public/lesson-images/15274719ab/cooking.webp',
  thumbnail: require('../../assets/thumbnails/cooking-thumbnail.png'),
  flashcards: [
    {
      category: 'Utensils 🍽️',
      words: [
        { english: 'A fork', french: 'Une fourchette' },
        { english: 'A knife', french: 'Un couteau' },
        { english: 'A spoon', french: 'Une cuillère' },
        { english: 'A plate', french: 'Une assiette' },
        { english: 'A bowl', french: 'Un bol' },
        { english: 'A mug', french: 'Une tasse (grande)' },
        { english: 'A cup', french: 'Une tasse' },
        { english: 'A bottle', french: 'Une bouteille' },
        { english: 'A glass', french: 'Un verre' },
        { english: 'A pan', french: 'Une poêle' },
        { english: 'A pot', french: 'Une casserole' }
      ]
    },
    {
      category: 'Actions 👩‍🍳',
      words: [
        { english: 'To stir', french: 'Remuer' },
        { english: 'To mix', french: 'Mélanger' },
        { english: 'To cut', french: 'Couper' },
        { english: 'To pour', french: 'Verser' },
        { english: 'To add', french: 'Ajouter' },
        { english: 'To bake', french: 'Cuire au four' },
        { english: 'To cook', french: 'Cuisiner' },
        { english: 'To fry', french: 'Frire' },
        { english: 'To serve', french: 'Servir' }
      ]
    },
    {
      category: 'Appliances 🔌',
      words: [
        { english: 'An oven', french: 'Un four' },
        { english: 'A fridge', french: 'Un frigo / un réfrigérateur' },
        { english: 'A microwave', french: 'Un micro-ondes' },
        { english: 'A stovetop', french: 'Une plaque de cuisson' }
      ]
    }
  ]
};

export default CookingVocab;