const FoodVocab = {
  id: '35',
  title: 'American Dishes',
  description: 'Learn American food vocabulary: side dishes, meat-based dishes, desserts, and drinks',
  imageUrl: 'https://wretggbpaejzjdilemit.supabase.co/storage/v1/object/public/lesson-images/15274719ab/american-dishes.webp',
  thumbnail: require('../../assets/thumbnails/american-dishes-thumbnail.png'),
  flashcards: [
    {
      category: 'Vegetables and side dishes 🥗',
      words: [
        { english: 'French fries', french: 'Frites' },
        { english: 'Sweet potato', french: 'Patate douce' },
        { english: 'Mac and cheese', french: 'Macaronis au fromage' },
        { english: 'Mashed potatoes', french: 'Purée de pommes de terre' },
        { english: 'Baked beans', french: 'Haricots blancs à la sauce tomate' },
      ],
    },
    {
      category: 'Meat-based dishes 🍗',
      words: [
        { english: 'Crab', french: 'Crabe' },
        { english: 'Chicken pot pie', french: 'Tourte au poulet' },
        { english: 'Meatloaf', french: 'Pain de viande' },
        { english: 'Shrimp / Prawn', french: 'Crevette' },
        { english: 'BBQ ribs', french: 'Travers de porc barbecue' },
      ],
    },
    {
      category: 'Desserts 🍰',
      words: [
        { english: 'Milkshake', french: 'Milk-shake' },
        { english: 'Apple pie', french: 'Tarte aux pommes' },
        { english: 'Carrot cake', french: 'Gâteau aux carottes' },
        { english: 'Cheesecake', french: 'Cheesecake' },
        { english: 'Walnut brownie', french: 'Brownie aux noix' },
        { english: 'Pumpkin pie', french: 'Tarte à la citrouille' },
        { english: 'Cupcake', french: 'Cupcake' },
        { english: 'Doughnut / Donut', french: 'Beignet' },
      ],
    },
    {
      category: 'Drinks 🥤',
      words: [
        { english: 'Lemonade', french: 'Citronnade' },
        { english: 'Iced tea', french: 'Thé glacé' },
        { english: 'Soda', french: 'Soda' },
        { english: 'Cranberry juice', french: 'Jus de canneberge' },
      ],
    },
  ],
};

export default FoodVocab;
