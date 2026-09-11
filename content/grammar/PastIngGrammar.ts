const PastIngGrammar = {
  id: '20',
  title: 'Prétérit en ING',
  description: 'Learn how to use the past continuous tense',
  category: 'Temps principaux',
  imageUrl: 'https://wretggbpaejzjdilemit.supabase.co/storage/v1/object/public/lesson-images/15274719ab/preterit-en-ing.webp',
  textContent: {
    cards: [
      {
        eyebrow: 'À quoi ça sert',
        paragraph: 'Je parle de ce qui était en train de se passer (ou non).',
        tip: 'Formule : sujet + be au prétérit + verbe +ING.',
        columns: [
          {
            label: '1/ Je repère le sujet et / ou le pronom',
            accent: 'blue',
            rows: ['I', 'You', 'He / She / It', 'We', 'They'],
          },
          {
            label: '2/ Je conjugue BE au prétérit',
            accent: 'coral',
            rows: ['**was** (not)', '**were** (not)', '**was** (not)', '**were** (not)', '**were** (not)'],
          },
          {
            label: "3/ J'ajoute la terminaison -ING au verbe",
            accent: 'teal',
            rows: ['visiting', 'speaking', 'being', 'dancing', 'Etc.'],
          },
        ],
        examples: [
          { en: 'I **was dancing** with her.', fr: "J'étais en train de danser avec elle." },
          { en: 'Anna **was visiting** London.', fr: 'Anna était en train de visiter Londres.' },
        ],
      },
      {
        eyebrow: 'La forme négative',
        examples: [
          { en: "We **weren't talking**.", fr: "Nous n'étions pas en train de parler." },
          { en: 'Owen **was not eating** a bagel.', fr: "Owen n'était pas en train de manger de bagel." },
        ],
      },
    ],
  },
translateExercises: [
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Je lisais un message.",
    answer: "I was reading a message.",
    wordBank: ["I", "was", "reading", "a", "message.", "were", "not"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Les enfants jouaient dehors.",
    answer: "The children were playing outside.",
    wordBank: ["The", "children", "were", "playing", "outside.", "was", "not"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Le suspect ne dormait pas.",
    answer: "The suspect was not sleeping.",
    wordBank: ["The", "suspect", "was", "not", "sleeping.", "were"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Les policiers regardaient la porte.",
    answer: "The police officers were watching the door.",
    wordBank: ["The", "police", "officers", "were", "watching", "the", "door.", "was", "not"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Elle étudiait.",
    answer: "She was studying.",
    wordBank: ["She", "was", "studying.", "were", "not"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Les témoins ne mentaient pas.",
    answer: "The witnesses were not lying.",
    wordBank: ["The", "witnesses", "were", "not", "lying.", "was"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Le chien aboyait fort.",
    answer: "The dog was barking loudly.",
    wordBank: ["The", "dog", "was", "barking", "loudly.", "were", "not"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Il ne pleuvait pas.",
    answer: "It was not raining.",
    wordBank: ["It", "was", "not", "raining.", "were"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Vous chantiez ensemble.",
    answer: "You were singing together.",
    wordBank: ["You", "were", "singing", "together.", "was", "not"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "L'inspecteur cherchait des indices.",
    answer: "The inspector was looking for clues.",
    wordBank: ["The", "inspector", "was", "looking", "for", "clues.", "were", "not"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Tu ne dansais pas.",
    answer: "You were not dancing.",
    wordBank: ["You", "were", "not", "dancing.", "was"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Le soleil brillait.",
    answer: "The sun was shining.",
    wordBank: ["The", "sun", "was", "shining.", "were", "not"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Les détectives attendaient dehors.",
    answer: "The detectives were waiting outside.",
    wordBank: ["The", "detectives", "were", "waiting", "outside.", "was", "not"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Il ne s'entraînait pas.",
    answer: "He was not practicing.",
    wordBank: ["He", "was", "not", "practicing.", "were"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Je dessinais une carte.",
    answer: "I was drawing a map.",
    wordBank: ["I", "was", "drawing", "a", "map.", "were", "not"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Les enquêteurs discutaient du plan.",
    answer: "The investigators were discussing the plan.",
    wordBank: ["The", "investigators", "were", "discussing", "the", "plan.", "was", "not"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Ils ne mangeaient pas.",
    answer: "They were not eating.",
    wordBank: ["They", "were", "not", "eating.", "was"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Elle réparait le moteur.",
    answer: "She was fixing the engine.",
    wordBank: ["She", "was", "fixing", "the", "engine.", "were", "not"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Il neigeait beaucoup.",
    answer: "It was snowing a lot.",
    wordBank: ["It", "was", "snowing", "a", "lot.", "were", "not"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Les agents ne travaillaient pas.",
    answer: "The agents were not working.",
    wordBank: ["The", "agents", "were", "not", "working.", "was"]
  }
],

  exercises: [
    { "question": "I ___ ___ when you called. (read)", "answer": "was reading", "options": ["was reading", "were reading", "am reading", "is reading"] },
    { "question": "They ___ ___ tennis at 3 PM yesterday. (play)", "answer": "were playing", "options": ["was playing", "were playing", "are playing", "is playing"] },
    { "question": "He ___ ___ when I arrived. (study)", "answer": "was studying", "options": ["was studying", "were studying", "am studying", "is studying"] },
    { "question": "We ___ ___ TV when the phone rang. (watch)", "answer": "were watching", "options": ["was watching", "were watching", "are watching", "is watching"] },
    { "question": "She ___ ___ when the alarm went off. (sleep)", "answer": "was sleeping", "options": ["was sleeping", "were sleeping", "am sleeping", "is sleeping"] },
    { "question": "You ___ ___ when I came home. (cook)", "answer": "were cooking", "options": ["was cooking", "were cooking", "are cooking", "is cooking"] },
    { "question": "The dog ___ ___ all night. (bark)", "answer": "was barking", "options": ["was barking", "were barking", "am barking", "is barking"] },
    { "question": "The children ___ ___ in the garden. (play)", "answer": "were playing", "options": ["was playing", "were playing", "are playing", "is playing"] },
    { "question": "It ___ ___ when we left. (rain)", "answer": "was raining", "options": ["was raining", "were raining", "am raining", "is raining"] },
    { "question": "The birds ___ ___ this morning. (sing)", "answer": "were singing", "options": ["was singing", "were singing", "are singing", "is singing"] },
    { "question": "I ___ ___ late last night. (work)", "answer": "was working", "options": ["was working", "were working", "am working", "is working"] },
    { "question": "They ___ ___ at the party. (dance)", "answer": "were dancing", "options": ["was dancing", "were dancing", "are dancing", "is dancing"] },
    { "question": "The sun ___ ___ all day. (shine)", "answer": "was shining", "options": ["was shining", "were shining", "am shining", "is shining"] },
    { "question": "We ___ ___ for the bus. (wait)", "answer": "were waiting", "options": ["was waiting", "were waiting", "are waiting", "is waiting"] },
    { "question": "She ___ ___ piano yesterday. (practice)", "answer": "was practicing", "options": ["was practicing", "were practicing", "am practicing", "is practicing"] },
    { "question": "I ___ ___ when you called. (draw)", "answer": "was drawing", "options": ["was drawing", "were drawing", "am drawing", "is drawing"] },
    { "question": "They ___ ___ the project. (discuss)", "answer": "were discussing", "options": ["was discussing", "were discussing", "are discussing", "is discussing"] },
    { "question": "She ___ ___ a book. (read)", "answer": "was reading", "options": ["was reading", "were reading", "am reading", "is reading"] },
    { "question": "We ___ ___ dinner. (have)", "answer": "were having", "options": ["was having", "were having", "are having", "is having"] },
    { "question": "He ___ ___ his bike. (fix)", "answer": "was fixing", "options": ["was fixing", "were fixing", "am fixing", "is fixing"] },
    { "question": "The children ___ ___ outside. (play)", "answer": "were playing", "options": ["was playing", "were playing", "are playing", "is playing"] },
    { "question": "It ___ ___ all day. (snow)", "answer": "was snowing", "options": ["was snowing", "were snowing", "am snowing", "is snowing"] },
    { "question": "You ___ ___ late. (work)", "answer": "were working", "options": ["was working", "were working", "are working", "is working"] },
    { "question": "The sun ___ ___. (set)", "answer": "was setting", "options": ["was setting", "were setting", "am setting", "is setting"] },
    { "question": "They ___ ___ at the bus stop. (wait)", "answer": "were waiting", "options": ["was waiting", "were waiting", "are waiting", "is waiting"] }
]

};

export default PastIngGrammar;
