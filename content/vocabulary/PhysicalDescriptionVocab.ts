const PhysicalDescriptionVocab = {
  id: '311',
  title: 'Physical Description',
  description: "Words to describe people's appearance",
  imageUrl: 'https://wretggbpaejzjdilemit.supabase.co/storage/v1/object/public/lesson-images/15274719ab/physical-description.webp',
  thumbnail: require('../../assets/thumbnails/physical-description-thumbnail.png'),
  flashcards: [
    {
      // The sheet runs hair and face together in one block, beard and freckles included.
      category: 'Hair and face 💇‍♂️',
      words: [
        { english: 'Blond hair', french: 'Cheveux blonds' },
        { english: 'Brown hair', french: 'Cheveux bruns' },
        { english: 'Red hair', french: 'Cheveux roux' },
        { english: 'Black hair', french: 'Cheveux noirs' },
        { english: 'Grey hair', french: 'Cheveux gris' },
        { english: 'Long hair', french: 'Cheveux longs' },
        { english: 'Short hair', french: 'Cheveux courts' },
        { english: 'Straight hair', french: 'Cheveux raides' },
        { english: 'Curly hair', french: 'Cheveux bouclés' },
        { english: 'Bald', french: 'Chauve' },
        { english: 'A ponytail', french: 'Une queue de cheval' },
        { english: 'A beard', french: 'Une barbe' },
        { english: 'A moustache', french: 'Une moustache' },
        { english: 'Freckles', french: 'Des taches de rousseur' },
        { english: 'Some make-up', french: 'Du maquillage' }
      ]
    },
    {
      category: 'Physical characteristics 📏',
      words: [
        { english: 'Tall', french: 'Grand' },
        { english: 'Short', french: 'Petit' },
        { english: 'Thin', french: 'Mince' },
        { english: 'Slim', french: 'Svelte' },
        { english: 'Big', french: 'Gros' },
        { english: 'Beautiful', french: 'Beau / belle' },
        { english: 'Pretty', french: 'Joli' },
        { english: 'Handsome', french: 'Beau' },
        { english: 'Elegant', french: 'Élégant' },
        { english: 'Classy', french: 'Chic' },
        { english: 'Cute', french: 'Mignon' },
        { english: 'Strong', french: 'Fort' },
        { english: 'Athletic', french: 'Athlétique' },
        { english: 'Ugly', french: 'Laid' }
      ]
    }
  ]
};

export default PhysicalDescriptionVocab;
