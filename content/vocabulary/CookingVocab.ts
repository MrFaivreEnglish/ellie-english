const CookingVocab = {
  id: '208',
  title: 'Cooking',
  description: 'Learn common cooking verbs, utensils and techniques',
  imageUrl: 'https://i.ibb.co/5WXq9bjy/Cooking.webp',
  thumbnail: require('../../assets/thumbnails/cooking-thumbnail.png'),
  flashcards: [
    {
      category: 'Utensils & Tableware 🍽️',
      words: [
        { english: 'a fork', french: 'une fourchette' },
        { english: 'a knife', french: 'un couteau' },
        { english: 'a spoon', french: 'une cuillère' },
        { english: 'a plate', french: 'une assiette' },
        { english: 'a bowl', french: 'un bol' },
        { english: 'a mug', french: 'une tasse (grande)' },
        { english: 'a cup', french: 'une tasse' },
        { english: 'a bottle', french: 'une bouteille' },
        { english: 'a glass', french: 'un verre' },
        { english: 'a pan', french: 'une poêle' },
        { english: 'a pot', french: 'une casserole' }
      ]
    },
    {
      category: 'Verbs 👩‍🍳',
      words: [
        { english: 'to stir', french: 'remuer' },
        { english: 'to mix', french: 'mélanger' },
        { english: 'to cut', french: 'couper' },
        { english: 'to pour', french: 'verser' },
        { english: 'to add', french: 'ajouter' },
        { english: 'to bake', french: 'cuire au four' },
        { english: 'to cook', french: 'cuisiner' },
        { english: 'to fry', french: 'frire' },
        { english: 'to serve', french: 'servir' }
      ]
    },
    {
      category: 'Appliances 🔌',
      words: [
        { english: 'an oven', french: 'un four' },
        { english: 'a fridge', french: 'un frigo / un réfrigérateur' },
        { english: 'a microwave', french: 'un micro-ondes' },
        { english: 'a stovetop', french: 'une plaque de cuisson' }
      ]
    }
  ]
};

export default CookingVocab;