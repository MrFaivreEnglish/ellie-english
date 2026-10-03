const ComparativeGrammar = {
  id: '7',
  title: 'Comparatif',
  description: 'Learn how to make comparisons in English',
  imageUrl: 'https://wretggbpaejzjdilemit.supabase.co/storage/v1/object/public/lesson-images/15274719ab/comparatif.webp',
  textContent: {
    cards: [
      {
        eyebrow: 'À quoi ça sert',
        paragraph: 'Comparer des choses entre elles (plus grand que, plus petit que...).',
        tip: 'Formule : adjectif + -er + than, ou more + adjectif + than.',
        columns: [
          {
            label: '-ER THAN · 1 syllabe',
            accent: 'coral',
            rows: ['Old → **Older** than', 'Small → **Smaller** than'],
          },
          {
            label: '-ER THAN · 2 syllabes + Y',
            accent: 'coral',
            rows: ['Pretty → **Prettier** than', 'Funny → **Funnier** than'],
          },
          {
            label: 'MORE THAN · 2 syllabes',
            accent: 'blue',
            rows: ['Perfect → **More perfect** than', 'Awful → **More awful** than'],
          },
          {
            label: 'MORE THAN · 3 syllabes et +',
            accent: 'blue',
            rows: ['Beautiful → **More beautiful** than', 'Incredible → **More incredible** than'],
          },
        ],
      },
      {
        eyebrow: 'Attention aux exceptions !',
        subsections: [
          {
            text: "On regarde le nombre de syllabes de l'adjectif de départ — mais il existe deux verbes irréguliers à connaître :",
            accent: 'amber',
            rows: ['Good → **Better** than', 'Bad → **Worse** than'],
          },
        ],
      },
    ],
  },
  translateExercises: [
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Ce livre est plus intéressant que l’autre.",
    answer: "This book is more interesting than the other one.",
    wordBank: ["This book", "is", "more interesting than", "interestinger than", "the other", "one."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Paul est plus grand que Marc.",
    answer: "Paul is taller than Marc.",
    wordBank: ["Paul", "is", "taller than", "more tall than", "Marc."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Cette voiture est plus chère que celle-là.",
    answer: "This car is more expensive than that one.",
    wordBank: ["This car", "is", "more expensive than", "expensiver than", "that one."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Aujourd’hui est plus chaud qu’hier.",
    answer: "Today is hotter than yesterday.",
    wordBank: ["Today", "is", "hotter than", "more hot than", "yesterday."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Ce test est plus difficile que l’autre.",
    answer: "This test is more difficult than the other one.",
    wordBank: ["This test", "is", "more difficult than", "difficulter than", "the other", "one."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Le vélo est plus rapide que la moto.",
    answer: "The bike is faster than the motorcycle.",
    wordBank: ["The bike", "is", "faster than", "more fast than", "the motorcycle."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Cette robe est plus jolie que la bleue.",
    answer: "This dress is prettier than the blue one.",
    wordBank: ["This dress", "is", "prettier than", "more pretty than", "the blue", "one."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Ce restaurant est plus cher que l’autre.",
    answer: "This restaurant is cheaper than the other one.",
    wordBank: ["This restaurant", "is", "cheaper than", "more cheap than", "the other", "one."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Mon nouveau téléphone est meilleur que l’ancien.",
    answer: "My new phone is better than the old one.",
    wordBank: ["My new phone", "is", "better than", "more good than", "the old", "one."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Le film est plus mauvais que la série.",
    answer: "The movie is worse than the series.",
    wordBank: ["The movie", "is", "worse than", "more bad than", "the series."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Cette plage est plus calme.",
    answer: "This beach is quieter.",
    wordBank: ["This beach", "is", "quieter", "more quiet"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Ce pantalon est plus élégant.",
    answer: "These pants are more elegant.",
    wordBank: ["These pants", "are", "more elegant", "eleganter"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Le café est plus fort.",
    answer: "The coffee is stronger.",
    wordBank: ["The coffee", "is", "stronger", "more strong"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Cette valise est plus lourde.",
    answer: "This suitcase is heavier.",
    wordBank: ["This suitcase", "is", "heavier", "more heavy"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Paris est plus grand.",
    answer: "Paris is bigger.",
    wordBank: ["Paris", "is", "bigger", "more big"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Le train est plus rapide.",
    answer: "The train is faster.",
    wordBank: ["The train", "is", "faster", "more fast"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Cette chambre est plus propre.",
    answer: "This room is cleaner.",
    wordBank: ["This room", "is", "cleaner", "more clean"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Ces chaussures sont plus confortables.",
    answer: "These shoes are more comfortable.",
    wordBank: ["These shoes", "are", "more comfortable", "comfortabler"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Le musée est plus loin que le parc.",
    answer: "The museum is farther than the park.",
    wordBank: ["The museum", "is", "farther than", "more far than", "the park."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Mon sac est plus lourd que le tien.",
    answer: "My bag is heavier than yours.",
    wordBank: ["My bag", "is", "heavier than", "more heavy than", "yours."]
  }
  ],

  exercises: [
    { question: "This book is ___ than that one. (interesting)", answer: "more interesting", options: ["more interesting", "interestinger", "most interesting", "interesting"] },
    { question: "My brother is ___ than me. (tall)", answer: "taller", options: ["taller", "more tall", "tallest", "most tall"] },
    { question: "The blue car is ___ than the red one. (expensive)", answer: "more expensive", options: ["more expensive", "expensiver", "most expensive", "expensive"] },
    { question: "Today is ___ than yesterday. (hot)", answer: "hotter", options: ["hotter", "more hot", "hottest", "most hot"] },
    { question: "Learning English is ___ than I thought. (easy)", answer: "easier", options: ["easier", "more easy", "easiest", "most easy"] },
    { question: "My new phone is ___ than my old one. (good)", answer: "better", options: ["better", "gooder", "more good", "best"] },
    { question: "This exercise is ___ than the last one. (difficult)", answer: "more difficult", options: ["more difficult", "difficulter", "most difficult", "difficult"] },
    { question: "She runs ___ than her sister. (fast)", answer: "faster", options: ["faster", "more fast", "fastest", "most fast"] },
    { question: "The red dress is ___ than the blue one. (pretty)", answer: "prettier", options: ["prettier", "more pretty", "prettiest", "most pretty"] },
    { question: "This restaurant is ___ than that one. (cheap)", answer: "cheaper", options: ["cheaper", "more cheap", "cheapest", "most cheap"] },
    { question: "His car is ___ than mine. (new)", answer: "newer", options: ["newer", "more new", "newest", "most new"] },
    { question: "The movie was ___ than the book. (bad)", answer: "worse", options: ["worse", "badder", "more bad", "worst"] },
    { question: "Summer is ___ than winter. (warm)", answer: "warmer", options: ["warmer", "more warm", "warmest", "most warm"] },
    { question: "This bag is ___ than that one. (heavy)", answer: "heavier", options: ["heavier", "more heavy", "heaviest", "most heavy"] },   
    { question: "The museum is ___ than the park. (far)", answer: "farther", options: ["farther", "more far", "farthest", "most far"] },
    { question: "The train is ___ than the bus. (fast)", answer: "faster", options: ["faster", "more fast", "fastest", "most fast"] },
    { question: "This coffee is ___ than tea. (strong)", answer: "stronger", options: ["stronger", "more strong", "strongest", "most strong"] },
    { question: "The exam was ___ than expected. (difficult)", answer: "more difficult", options: ["more difficult", "difficulter", "most difficult", "difficult"] },
    { question: "My brother is ___ than my sister. (young)", answer: "younger", options: ["younger", "more young", "youngest", "most young"] },
    { question: "This problem is ___ than that one. (complex)", answer: "more complex", options: ["more complex", "complexer", "most complex", "complex"] },
    { question: "Today's weather is ___ than yesterday's. (good)", answer: "better", options: ["better", "gooder", "more good", "best"] },
    { question: "Her story is ___ than his. (interesting)", answer: "more interesting", options: ["more interesting", "interestinger", "most interesting", "interesting"] },
    { question: "The new phone is ___ than the old one. (expensive)", answer: "more expensive", options: ["more expensive", "expensiver", "most expensive", "expensive"] },
    { question: "This chair is ___ than that one. (comfortable)", answer: "more comfortable", options: ["more comfortable", "comfortabler", "most comfortable", "comfortable"] }
  ]
};

export default ComparativeGrammar;
