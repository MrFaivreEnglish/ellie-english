const LikeGrammar = {
  id: '17',
  title: 'Like',
  description: 'Learn how to express likes and preferences',
  category: 'Verbs',
  imageUrl: 'https://i.ibb.co/KxkTWKBq/Like.png',
  textContent: {
    cards: [
      {
        eyebrow: 'Quand on aime un objet, une personne',
        tip: 'Formule : sujet + verbe de goût + groupe nominal.',
        columns: [
          {
            label: 'Sujet',
            accent: 'blue',
            rows: ['I', 'You', 'He / She / It', 'We', 'They'],
          },
          {
            label: 'Verbe de goût',
            accent: 'coral',
            rows: ["Like(s)", "Hate(s)", "Do(es)n't like"],
          },
          {
            label: 'Groupe nominal',
            accent: 'teal',
            rows: ['Speak', 'Love', 'Be', 'Etc.'],
          },
        ],
        examples: [
          { en: 'I **like** books.', fr: "J'aime les livres." },
          { en: "He **doesn't like** fish.", fr: "Il n'aime pas les poissons." },
        ],
      },
      {
        eyebrow: 'Quand on aime faire quelque chose',
        tip: 'Formule : sujet + verbe de goût + verbe +ING.',
        columns: [
          {
            label: 'Sujet',
            accent: 'blue',
            rows: ['I', 'You', 'He / She / It', 'We', 'They'],
          },
          {
            label: 'Verbe de goût',
            accent: 'coral',
            rows: ["Like(s)", "Hate(s)", "Do(es)n't like"],
          },
          {
            label: 'Verbe +ING',
            accent: 'teal',
            rows: ['Dancing.', 'Singing.', 'Playing.', 'Etc.'],
          },
        ],
        examples: [
          { en: 'I **like reading** books.', fr: "J'aime lire des livres." },
          { en: "He **doesn't like eating** fish.", fr: "Il n'aime pas manger de poisson." },
        ],
      },
    ],
  },
translateExercises: [
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "J'aime les jeux.",
    answer: "I like games.",
    wordBank: ["I", "like", "games.", "likes", "play", "playing"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Elle aime la glace.",
    answer: "She likes ice cream.",
    wordBank: ["She", "likes", "ice", "cream.", "like", "eat", "eating"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "J'aime regarder la télé.",
    answer: "I like watching TV.",
    wordBank: ["I", "like", "watching", "TV.", "likes", "watch", "watches"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Elle aime les livres.",
    answer: "She likes books.",
    wordBank: ["She", "likes", "books.", "like", "read", "reading"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Nous aimons aller au parc.",
    answer: "We like going to the park.",
    wordBank: ["We", "like", "going", "to", "the", "park.", "likes", "go", "goes"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Tu aimes les jeux video.",
    answer: "You like video games.",
    wordBank: ["You", "like", "video", "games.", "likes", "play", "playing"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Il aime dormir.",
    answer: "He likes sleeping.",
    wordBank: ["He", "likes", "sleeping.", "like", "sleep", "sleeps"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Mes amis aiment voyager.",
    answer: "My friends like traveling.",
    wordBank: ["My friends", "like", "traveling.", "likes", "travel", "travels"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "J'aime apprendre.",
    answer: "I like learning.",
    wordBank: ["I", "like", "learning.", "likes", "learn", "learns"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Ils aiment la pizza.",
    answer: "They like pizza.",
    wordBank: ["They", "like", "pizza.", "likes", "eat", "eating"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Elle aime peindre.",
    answer: "She likes painting.",
    wordBank: ["She", "likes", "painting.", "like", "paint", "paints"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Il aime le football.",
    answer: "He likes football.",
    wordBank: ["He", "likes", "football.", "like", "play", "playing"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Nous aimons nager.",
    answer: "We like swimming.",
    wordBank: ["We", "like", "swimming.", "likes", "swim", "swims"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Elle aime chanter.",
    answer: "She likes singing.",
    wordBank: ["She", "likes", "singing.", "like", "sing", "sings"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Nous aimons la glace.",
    answer: "We like ice cream.",
    wordBank: ["We", "like", "ice", "cream.", "likes", "eat", "eating"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Le chien aime courir.",
    answer: "The dog likes running.",
    wordBank: ["The", "dog", "likes", "running.", "like", "run", "runs"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "J'aime la cuisine française.",
    answer: "I like French food.",
    wordBank: ["I", "like", "French", "food.", "likes", "cook", "cooking"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Il aime le basket.",
    answer: "He likes basketball.",
    wordBank: ["He", "likes", "basketball.", "like", "play", "playing"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "J'aime le gateau.",
    answer: "I like cake.",
    wordBank: ["I", "like", "cake.", "likes", "bake", "baking"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Ils aiment travailler.",
    answer: "They like working.",
    wordBank: ["They", "like", "working.", "likes", "work", "works"]
  }
],

  exercises: [
  { "question": "I ___ (play) tennis every weekend.", "answer": "like playing", "options": ["like playing", "likes playing", "like play", "likes play"] },
  { "question": "She ___ chocolate ice cream.", "answer": "likes", "options": ["likes", "like", "like eating", "likes eating"] },
  { "question": "They ___ (watch) movies on Fridays.", "answer": "like watching", "options": ["like watching", "likes watching", "like watch", "likes watch"] },
  { "question": "He ___ (read) books before bed.", "answer": "likes reading", "options": ["likes reading", "like reading", "likes read", "like read"] },
  { "question": "We ___ (go) to the beach in summer.", "answer": "like going", "options": ["like going", "likes going", "like go", "likes go"] },
  { "question": "You ___ video games.", "answer": "like", "options": ["like", "likes", "like playing", "likes playing"] },
  { "question": "The cat ___ (sleep) on the sofa.", "answer": "likes sleeping", "options": ["likes sleeping", "like sleeping", "likes sleep", "like sleep"] },
  { "question": "My friends ___ traveling.", "answer": "like", "options": ["like", "likes", "like traveling", "likes traveling"] },
  { "question": "The teacher ___ (read) stories to the class.", "answer": "likes reading", "options": ["likes reading", "like reading", "likes read", "like read"] },
  { "question": "I ___ (learn) new things.", "answer": "like learning", "options": ["like learning", "likes learning", "like learn", "likes learn"] },
  { "question": "They ___ pizza.", "answer": "like", "options": ["like", "likes", "like eating", "likes eating"] },
  { "question": "She ___ (paint) pictures.", "answer": "likes painting", "options": ["likes painting", "like painting", "likes paint", "like paint"] },
  { "question": "The children ___ (play) outside.", "answer": "like playing", "options": ["like playing", "likes playing", "like play", "likes play"] },
  { "question": "He ___ football.", "answer": "likes", "options": ["likes", "like", "like playing", "likes playing"] },
  { "question": "I ___ (swim) in the pool.", "answer": "like swimming", "options": ["like swimming", "likes swimming", "like swim", "likes swim"] },
  { "question": "She ___ (sing) in the choir.", "answer": "likes singing", "options": ["likes singing", "like singing", "likes sing", "like sing"] },
  { "question": "We ___ ice cream on hot days.", "answer": "like", "options": ["like", "likes", "like eating", "likes eating"] },
  { "question": "The dog ___ (chase) the ball.", "answer": "likes chasing", "options": ["likes chasing", "like chasing", "likes chase", "like chase"] },
  { "question": "My brother ___ (read) comics.", "answer": "likes reading", "options": ["likes reading", "like reading", "likes read", "like read"] },
  { "question": "I ___ (cook) Italian food.", "answer": "like cooking", "options": ["like cooking", "likes cooking", "like cook", "likes cook"] },
  { "question": "They ___ (watch) TV.", "answer": "like watching", "options": ["like watching", "likes watching", "like watch", "likes watch"] },
  { "question": "He ___ basketball.", "answer": "likes", "options": ["likes", "like", "like playing", "likes playing"] },
  { "question": "She ___ (read) magazines.", "answer": "likes reading", "options": ["likes reading", "like reading", "likes read", "like read"] },
  { "question": "I ___ chocolate cake.", "answer": "like", "options": ["like", "likes", "like eating", "likes eating"] },
  { "question": "The students ___ (work) in pairs.", "answer": "like working", "options": ["like working", "likes working", "like work", "likes work"] },
  { "question": "My sister ___ (dance) every weekend.", "answer": "likes dancing", "options": ["likes dancing", "like dancing", "likes dance", "like dance"] },
  { "question": "We ___ (play) board games.", "answer": "like playing", "options": ["like playing", "likes playing", "like play", "likes play"] },
  { "question": "He ___ ice hockey.", "answer": "likes", "options": ["likes", "like", "like playing", "likes playing"] },
  { "question": "I ___ (listen) to music in the morning.", "answer": "like listening", "options": ["like listening", "likes listening", "like listen", "likes listen"] },
  { "question": "They ___ (go) to concerts.", "answer": "like going", "options": ["like going", "likes going", "like go", "likes go"] }
]

};

export default LikeGrammar;
