const ComparativeGrammar = {
  id: '7',
  title: 'Comparatif',
  description: 'Learn how to make comparisons in English',
  imageUrl: 'https://i.ibb.co/q3NwPRgG/Comparatif-sup-riorit.png',
  translateExercises: [
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Ce livre est aussi intéressant que l’autre.",
    answer: "This book is as interesting as the other one.",
    wordBank: ["This book", "is", "as interesting as", "more interesting than", "the other", "one."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Paul est moins grand que Marc.",
    answer: "Paul is less tall than Marc.",
    wordBank: ["Paul", "is", "less tall than", "taller than", "Marc."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Cette voiture est aussi chère que celle-là.",
    answer: "This car is as expensive as that one.",
    wordBank: ["This car", "is", "as expensive as", "more expensive than", "that one."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Aujourd’hui est moins chaud qu’hier.",
    answer: "Today is less hot than yesterday.",
    wordBank: ["Today", "is", "less hot than", "hotter than", "yesterday."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Ce test est aussi difficile que l’autre.",
    answer: "This test is as difficult as the other one.",
    wordBank: ["This test", "is", "as difficult as", "more difficult than", "the other", "one."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Le vélo est moins rapide que la moto.",
    answer: "The bike is less fast than the motorcycle.",
    wordBank: ["The bike", "is", "less fast than", "faster than", "the motorcycle."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Cette robe est aussi jolie que la bleue.",
    answer: "This dress is as pretty as the blue one.",
    wordBank: ["This dress", "is", "as pretty as", "prettier than", "the blue", "one."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Ce restaurant est moins cher que l’autre.",
    answer: "This restaurant is less expensive than the other one.",
    wordBank: ["This restaurant", "is", "less expensive than", "cheaper than", "the other", "one."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Sa voiture est aussi récente que la mienne.",
    answer: "His car is as new as mine.",
    wordBank: ["His car", "is", "as new as", "newer than", "mine."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Le film est moins mauvais que la série.",
    answer: "The movie is less bad than the series.",
    wordBank: ["The movie", "is", "less bad than", "worse than", "the series."]
  },

  // SHORTER SENTENCES

  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Cette plage est aussi calme.",
    answer: "This beach is as quiet.",
    wordBank: ["This beach", "is", "as quiet", "quieter"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Ce pantalon est moins élégant.",
    answer: "These pants are less elegant.",
    wordBank: ["These pants", "are", "less elegant", "more elegant"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Le café est aussi fort.",
    answer: "The coffee is as strong.",
    wordBank: ["The coffee", "is", "as strong", "stronger"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Cette valise est moins lourde.",
    answer: "This suitcase is less heavy.",
    wordBank: ["This suitcase", "is", "less heavy", "heavier"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Paris est aussi grand.",
    answer: "Paris is as big.",
    wordBank: ["Paris", "is", "as big", "bigger"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Le train est moins rapide.",
    answer: "The train is less fast.",
    wordBank: ["The train", "is", "less fast", "faster"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Cette chambre est aussi propre.",
    answer: "This room is as clean.",
    wordBank: ["This room", "is", "as clean", "cleaner"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Ces chaussures sont moins confortables.",
    answer: "These shoes are less comfortable.",
    wordBank: ["These shoes", "are", "less comfortable", "more comfortable"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Le musée est aussi loin que le parc.",
    answer: "The museum is as far as the park.",
    wordBank: ["The museum", "is", "as far as", "farther than", "the park."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Mon sac est moins lourd que le tien.",
    answer: "My bag is less heavy than yours.",
    wordBank: ["My bag", "is", "less heavy than", "heavier than", "yours."]
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
