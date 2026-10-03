const ComparativeInferiorityEqualityGrammar = {
  id: '32',
  title: "Comparatif d'infériorité et d'égalité",
  description: "Practice making comparisons of inferiority (less...than) and equality (as...as)",
  imageUrl: 'https://wretggbpaejzjdilemit.supabase.co/storage/v1/object/public/lesson-images/15274719ab/comparatif-d-inferiorite-et-d-egalite.webp',
  textContent: {
    cards: [
      {
        eyebrow: "Le comparatif d'infériorité",
        paragraph: 'Pour comparer des choses entre elles (moins grande, moins intelligent...).',
        tip: "Ici, on ne se préoccupe pas des syllabes, c'est toujours less + adjectif + than.",
        columns: [
          {
            label: 'LESS + adjectif + THAN (peu importe les syllabes)',
            accent: 'coral',
            rows: ['Old → **Less old** than', 'Pretty → **Less pretty** than', 'Perfect → **Less perfect** than', 'Beautiful → **Less beautiful** than'],
          },
        ],
      },
      {
        eyebrow: "Le comparatif d'égalité",
        paragraph: "Pour dire que deux choses sont aussi grandes, petites, etc. l'une que l'autre.",
        columns: [
          {
            label: 'AS + adjectif + AS (peu importe les syllabes)',
            accent: 'blue',
            rows: ['Old → **As old as**', 'Pretty → **As pretty as**', 'Perfect → **As perfect as**', 'Beautiful → **As beautiful as**'],
          },
        ],
      },
    ],
  },
translateExercises: [
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Ce sac est moins cher.",
    answer: "This bag is less expensive.",
    wordBank: ["This", "bag", "is", "less", "expensive.", "more"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Cette boîte est aussi lourde.",
    answer: "This box is as heavy.",
    wordBank: ["This", "box", "is", "as", "heavy.", "than"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Ce travail est moins fatigant.",
    answer: "This work is less tiring.",
    wordBank: ["This", "work", "is", "less", "tiring.", "more"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Ce film est aussi intéressant.",
    answer: "This movie is as interesting.",
    wordBank: ["This", "movie", "is", "as", "interesting.", "than"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Ce test est plus difficile.",
    answer: "This test is more difficult.",
    wordBank: ["This", "test", "is", "more", "difficult.", "less"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Le train est aussi rapide.",
    answer: "The train is as fast.",
    wordBank: ["The", "train", "is", "as", "fast.", "than"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Cette soupe est moins chaude.",
    answer: "This soup is less hot.",
    wordBank: ["This", "soup", "is", "less", "hot.", "more"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Cette chaise est plus confortable.",
    answer: "This chair is more comfortable.",
    wordBank: ["This", "chair", "is", "more", "comfortable.", "less"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Ce chien est moins petit.",
    answer: "This dog is less small.",
    wordBank: ["This", "dog", "is", "less", "small.", "more"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Ce gâteau est moins sucré.",
    answer: "This cake is less sweet.",
    wordBank: ["This", "cake", "is", "less", "sweet.", "more"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Cette image est aussi claire.",
    answer: "This picture is as clear.",
    wordBank: ["This", "picture", "is", "as", "clear.", "than"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Cette rue est moins sûre.",
    answer: "This street is less safe.",
    wordBank: ["This", "street", "is", "less", "safe.", "more"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Ce jeu est aussi populaire.",
    answer: "This game is as popular.",
    wordBank: ["This", "game", "is", "as", "popular.", "than"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Ce chemin est moins long.",
    answer: "This path is less long.",
    wordBank: ["This", "path", "is", "less", "long.", "more"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Le bus est plus bondé.",
    answer: "The bus is more crowded.",
    wordBank: ["The", "bus", "is", "more", "crowded.", "less"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "L'eau est aussi froide.",
    answer: "The water is as cold.",
    wordBank: ["The", "water", "is", "as", "cold.", "than"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Cette lampe est moins lumineuse.",
    answer: "This lamp is less bright.",
    wordBank: ["This", "lamp", "is", "less", "bright.", "more"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Cette table est plus lourde.",
    answer: "This table is heavier.",
    wordBank: ["This", "table", "is", "heavier.", "more"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Cette porte est moins étroite.",
    answer: "This door is less narrow.",
    wordBank: ["This", "door", "is", "less", "narrow.", "more"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Son bureau est aussi soigné.",
    answer: "His desk is as neat.",
    wordBank: ["His", "desk", "is", "as", "neat.", "than"]
  }
],

  exercises: [
    { question: "This phone is ___ that one. (- expensive)", answer: "less expensive than", options: ["less expensive than", "more expensive than", "as expensive as", "expensive"] },
    { question: "Her bag is ___ mine. (= heavy)", answer: "as heavy as", options: ["less heavy than", "heavier than", "as heavy as", "heavy"] },
    { question: "The journey was ___ I expected. (- tiring)", answer: "less tiring than", options: ["less tiring than", "more tiring than", "as tiring as", "tiring"] },
    { question: "This book is ___ the movie. (= interesting)", answer: "as interesting as", options: ["less interesting than", "more interesting than", "as interesting as", "interesting"] },
    { question: "Today's test was ___ yesterday's. (+ difficult)", answer: "more difficult than", options: ["less difficult than", "more difficult than", "as difficult as", "difficult"] },
    { question: "My car is ___ yours. (= fast)", answer: "as fast as", options: ["less fast than", "faster than", "as fast as", "fast"] },
    { question: "Summer is ___ I thought. (- hot)", answer: "less hot than", options: ["less hot than", "hotter than", "as hot as", "hot"] },
    { question: "This sofa is ___ the old one. (+ comfortable)", answer: "more comfortable than", options: ["less comfortable than", "more comfortable than", "as comfortable as", "comfortable"] },
    { question: "Her room is ___ mine. (- small)", answer: "less small than", options: ["less small than", "smaller than", "as small as", "small"] },
    { question: "The cake was ___ I expected. (- sweet)", answer: "less sweet than", options: ["less sweet than", "sweeter than", "as sweet as", "sweet"] },
    { question: "His answer was ___ hers. (= clear)", answer: "as clear as", options: ["less clear than", "clearer than", "as clear as", "clear"] },
    { question: "This route is ___ the other. (- safe)", answer: "less safe than", options: ["less safe than", "safer than", "as safe as", "safe"] },
    { question: "Chocolate is ___ vanilla. (= popular)", answer: "as popular as", options: ["less popular than", "more popular than", "as popular as", "popular"] },
    { question: "His speech was ___ yours. (- long)", answer: "less long than", options: ["less long than", "longer than", "as long as", "long"] },
    { question: "The city is ___ I remembered. (+ crowded)", answer: "more crowded than", options: ["less crowded than", "more crowded than", "as crowded as", "crowded"] },
    { question: "Winter is ___ summer. (= cold)", answer: "as cold as", options: ["less cold than", "colder than", "as cold as", "cold"] },
    { question: "This room is ___ that one. (- bright)", answer: "less bright than", options: ["less bright than", "brighter than", "as bright as", "bright"] },
    { question: "My suitcase is ___ yours. (- heavy)", answer: "less heavy than", options: ["less heavy than", "heavier than", "as heavy as", "heavy"] },
    { question: "Her phone is ___ his. (- expensive)", answer: "less expensive than", options: ["less expensive than", "more expensive than", "as expensive as", "expensive"] },
    { question: "This path is ___ the main road. (- narrow)", answer: "less narrow than", options: ["less narrow than", "narrower than", "as narrow as", "narrow"] },
    { question: "His handwriting is ___ hers. (= neat)", answer: "as neat as", options: ["less neat than", "neater than", "as neat as", "neat"] },
    { question: "Today is ___ yesterday. (= windy)", answer: "as windy as", options: ["less windy than", "windier than", "as windy as", "windy"] },
    { question: "My coffee is ___ yours. (= hot)", answer: "as hot as", options: ["less hot than", "hotter than", "as hot as", "hot"] },
    { question: "The hill is ___ I thought. (- steep)", answer: "less steep than", options: ["less steep than", "steeper than", "as steep as", "steep"] }
  ]
};

export default ComparativeInferiorityEqualityGrammar;
