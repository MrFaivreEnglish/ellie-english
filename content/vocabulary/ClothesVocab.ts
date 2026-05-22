const ClothesVocab = {
  id: '37',
  title: 'Clothes',
  description: 'Learn vocabulary related to clothing and fashion',  imageUrl: 'https://i.ibb.co/7tD3k6Gk/clothes-vocab.webp', // Updated inside image
  thumbnail: require('../../assets/thumbnails/clothes-thumbnail.png'),
  flashcards: [
    {
      category: 'Tops & Outerwear 🧥',
      words: [
        { english: 'A jumper / A sweater', french: 'Un pull' },
        { english: 'A shirt', french: 'Une chemise' },
        { english: 'A blouse', french: 'Un chemisier' },
        { english: 'A t-shirt', french: 'Un tee-shirt' },
        { english: 'A coat', french: 'Un manteau' },
        { english: 'A jacket', french: 'Une veste' },
        { english: 'A blazer', french: 'Un blazer' }
      ]
    },
    {
      category: 'Bottoms 👖',
      words: [
        { english: 'Trousers', french: 'Un pantalon' },
        { english: 'Jeans', french: 'Un jean' },
        { english: 'A skirt', french: 'Une jupe' },
        { english: 'Shorts', french: 'Un short' },
        { english: 'Tights', french: 'Des collants' }
      ]
    },
    {
      category: 'Footwear & Accessories 👟',
      words: [
        { english: 'A hat', french: 'Un chapeau' },
        { english: 'Glasses', french: 'Des lunettes' },
        { english: 'A tie', french: 'Une cravate' },
        { english: 'A scarf', french: 'Une écharpe' },
        { english: 'A belt', french: 'Une ceinture' },
        { english: 'Gloves', french: 'Des gants' },
        { english: 'Socks', french: 'Des chaussettes' },
        { english: 'Shoes', french: 'Des chaussures' },
        { english: 'Sneakers', french: 'Des baskets' }
      ]
    }
  ]
};

export default ClothesVocab;