const PassivePresGrammar = {
  id: '18',
  title: 'Voix passive présent',
  description: 'Learn how to use the passive voice in present tense',
  category: 'Voix passive',
  imageUrl: 'https://i.ibb.co/mV0xzQRY/Voix-passive-pr-sent.png',
  textContent: {
    cards: [
      {
        eyebrow: 'À quoi ça sert',
        paragraph: 'Je parle de ce qui était subi (être disputé, être construit...).',
        tip: 'Formule : sujet + be au présent + participe passé.',
        columns: [
          {
            label: '1/ Je repère le sujet et / ou le pronom',
            accent: 'blue',
            rows: ['I', 'You', 'He / She / It', 'We', 'They'],
          },
          {
            label: '2/ Je conjugue BE au présent',
            accent: 'coral',
            rows: ['**am** (not)', '**are** (not)', '**is** (not)', '**are** (not)', '**are** (not)'],
          },
          {
            label: '3/ Je trouve le participe passé du verbe',
            accent: 'teal',
            rows: ['Verbe régulier : **+ED**', 'Verbe irrégulier : **par cœur**'],
          },
        ],
        examples: [
          { en: 'The dog **is taken** to the zoo.', fr: 'Le chien est emmené au zoo.' },
          { en: 'Pandas **are protected**.', fr: 'Les pandas sont protégés.' },
        ],
      },
      {
        eyebrow: 'La forme négative',
        examples: [
          { en: 'Cars **are not repaired** here.', fr: 'Les voitures ne sont pas réparées ici.' },
          { en: "The text **isn't written** by AI.", fr: "Le texte n'est pas écrit par IA." },
        ],
      },
    ],
  },
translateExercises: [
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "La lettre est écrite le matin.",
    answer: "The letter is written in the morning.",
    wordBank: ["The", "letter", "is", "written", "in", "the", "morning.", "are"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Les assiettes sont lavées après le dîner.",
    answer: "The plates are washed after dinner.",
    wordBank: ["The", "plates", "are", "washed", "after", "dinner.", "is"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Le film est montré en classe.",
    answer: "The movie is shown in class.",
    wordBank: ["The", "movie", "is", "shown", "in", "class.", "are"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Les colis sont livrés aujourd'hui.",
    answer: "The packages are delivered today.",
    wordBank: ["The", "packages", "are", "delivered", "today.", "is"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Le vélo est réparé par mon frère.",
    answer: "The bike is fixed by my brother.",
    wordBank: ["The", "bike", "is", "fixed", "by", "my", "brother.", "are"]
  },
  // 10 present passive sentences — negative form

{
  type: 'translate',
  question: 'Translate into English.',
  prompt: "La lettre n'est pas écrite aujourd'hui.",
  answer: "The letter is not written today.",
  wordBank: ["The", "letter", "is", "not", "written", "today.", "are"]
},
{
  type: 'translate',
  question: 'Translate into English.',
  prompt: "Les assiettes ne sont pas lavées.",
  answer: "The plates are not washed.",
  wordBank: ["The", "plates", "are", "not", "washed.", "is"]
},
{
  type: 'translate',
  question: 'Translate into English.',
  prompt: "Le vélo n'est pas réparé.",
  answer: "The bike is not fixed.",
  wordBank: ["The", "bike", "is", "not", "fixed.", "are"]
},
{
  type: 'translate',
  question: 'Translate into English.',
  prompt: "Les messages ne sont pas envoyés.",
  answer: "The messages are not sent.",
  wordBank: ["The", "messages", "are", "not", "sent.", "is"]
},
{
  type: 'translate',
  question: 'Translate into English.',
  prompt: "Le cadeau n'est pas donné.",
  answer: "The gift is not given.",
  wordBank: ["The", "gift", "is", "not", "given.", "are"]
},
{
  type: 'translate',
  question: 'Translate into English.',
  prompt: "Les enfants ne sont pas aidés.",
  answer: "The children are not helped.",
  wordBank: ["The", "children", "are", "not", "helped.", "is"]
},
{
  type: 'translate',
  question: 'Translate into English.',
  prompt: "La chambre n'est pas nettoyée.",
  answer: "The room is not cleaned.",
  wordBank: ["The", "room", "is", "not", "cleaned.", "are"]
},
{
  type: 'translate',
  question: 'Translate into English.',
  prompt: "Les questions ne sont pas demandées.",
  answer: "The questions are not asked.",
  wordBank: ["The", "questions", "are", "not", "asked.", "is"]
},
{
  type: 'translate',
  question: 'Translate into English.',
  prompt: "Le chien n'est pas nourri.",
  answer: "The dog is not fed.",
  wordBank: ["The", "dog", "is", "not", "fed.", "are"]
},
{
  type: 'translate',
  question: 'Translate into English.',
  prompt: "Les billets ne sont pas vendus.",
  answer: "The tickets are not sold.",
  wordBank: ["The", "tickets", "are", "not", "sold.", "is"]
},
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Les devoirs sont vérifiés par le professeur.",
    answer: "The homework assignments are checked by the teacher.",
    wordBank: ["The", "homework", "assignments", "are", "checked", "by", "the", "teacher.", "is"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Le cadeau est donné à Marie.",
    answer: "The gift is given to Marie.",
    wordBank: ["The", "gift", "is", "given", "to", "Marie.", "are"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Les enfants sont aidés à l'école.",
    answer: "The children are helped at school.",
    wordBank: ["The", "children", "are", "helped", "at", "school.", "is"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Le cours est enseigné par Mme Clarke.",
    answer: "The lesson is taught by Mrs. Clarke.",
    wordBank: ["The lesson", "am", "taught", "by", "Mrs.", "Clarke.", "is", "are"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Les messages sont envoyés le soir.",
    answer: "The messages are sent in the evening.",
    wordBank: ["The", "messages", "are", "sent", "in", "the", "evening.", "is"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Le joueur est invité au match.",
    answer: "The player is invited to the game.",
    wordBank: ["The", "player", "is", "invited", "to", "the", "game.", "are"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Les parents sont informés par email.",
    answer: "The parents are informed by email.",
    wordBank: ["The", "parents", "are", "informed", "by", "email.", "is"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "La chambre est nettoyée chaque semaine.",
    answer: "The room is cleaned every week.",
    wordBank: ["The", "room", "is", "cleaned", "every", "week.", "are"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Les questions sont demandées en classe.",
    answer: "The questions are asked in class.",
    wordBank: ["The", "questions", "are", "asked", "in", "class.", "is"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "On me le rappelle souvent.",
    answer: "I am reminded often.",
    wordBank: ["I", "am", "reminded", "often.", "is", "are"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Les fenêtres sont ouvertes le matin.",
    answer: "The windows are opened in the morning.",
    wordBank: ["The", "windows", "are", "opened", "in", "the", "morning.", "is"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Le repas est préparé par ma mère.",
    answer: "The meal is prepared by my mother.",
    wordBank: ["The", "meal", "is", "prepared", "by", "my", "mother.", "are"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Les photos sont prises au parc.",
    answer: "The photos are taken at the park.",
    wordBank: ["The", "photos", "are", "taken", "at", "the", "park.", "is"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Le chien est nourri le soir.",
    answer: "The dog is fed in the evening.",
    wordBank: ["The", "dog", "is", "fed", "in", "the", "evening.", "are"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Les leçons sont apprises rapidement.",
    answer: "The lessons are learned quickly.",
    wordBank: ["The", "lessons", "are", "learned", "quickly.", "is"]
  }
],

  exercises: [
  { "question": "The letter ___ (write) every day.", "answer": "is written", "options": ["is written", "are written"] },
  { "question": "The dishes ___ (wash) after every meal.", "answer": "are washed", "options": ["is washed", "are washed"] },
  { "question": "He ___ (remind) about his homework.", "answer": "is reminded", "options": ["is reminded", "are reminded"] },
  { "question": "She ___ (give) a lot of attention by her teacher.", "answer": "is given", "options": ["is given", "are given"] },
  { "question": "We ___ (inform) of any schedule changes.", "answer": "are informed", "options": ["is informed", "are informed"] },
  { "question": "The students ___ (ask) many questions in class.", "answer": "are asked", "options": ["is asked", "are asked"] },
  { "question": "It ___ (fix) quickly by the technician.", "answer": "is fixed", "options": ["is fixed", "are fixed"] },
  { "question": "I ___ (teach) new grammar rules every week.", "answer": "am taught", "options": ["am taught", "is taught", "are taught"] },
  { "question": "You ___ (show) the new office every morning.", "answer": "are shown", "options": ["is shown", "are shown"] },
  { "question": "The team ___ (invite) to participate in competitions.", "answer": "is invited", "options": ["is invited", "are invited"] },
  { "question": "She ___ (help) with her tasks every day.", "answer": "is helped", "options": ["is helped", "are helped"] },
  { "question": "We ___ (ask) to complete the form every week.", "answer": "are asked", "options": ["is asked", "are asked"] },
  { "question": "The documents ___ (check) carefully by the assistant.", "answer": "are checked", "options": ["is checked", "are checked"] },
  { "question": "It ___ (repair) immediately when broken.", "answer": "is repaired", "options": ["is repaired", "are repaired"] },
  { "question": "The emails ___ (send) every morning.", "answer": "are sent", "options": ["is sent", "are sent"] },
  { "question": "I ___ (remind) to submit my homework every day.", "answer": "am reminded", "options": ["am reminded", "is reminded", "are reminded"] },
  { "question": "You ___ (invite) to attend meetings every week.", "answer": "are invited", "options": ["is invited", "are invited"] },
  { "question": "The windows ___ (clean) regularly.", "answer": "are cleaned", "options": ["is cleaned", "are cleaned"] },
  { "question": "He ___ (inform) about the rules by his manager.", "answer": "is informed", "options": ["is informed", "are informed"] },
  { "question": "She ___ (remind) about the deadlines.", "answer": "is reminded", "options": ["is reminded", "are reminded"] },
  { "question": "The packages ___ (deliver) every afternoon.", "answer": "are delivered", "options": ["is delivered", "are delivered"] },
  { "question": "We ___ (teach) new vocabulary every lesson.", "answer": "are taught", "options": ["is taught", "are taught"] },
  { "question": "The letters ___ (send) to clients every week.", "answer": "are sent", "options": ["is sent", "are sent"] },
  { "question": "I ___ (show) new procedures by my manager.", "answer": "am shown", "options": ["am shown", "is shown", "are shown"] },
  { "question": "The students ___ (help) by the assistants in the library.", "answer": "are helped", "options": ["is helped", "are helped"] },
  { "question": "It ___ (check) before every presentation.", "answer": "is checked", "options": ["is checked", "are checked"] },
  { "question": "The homework ___ (collect) at the end of each lesson.", "answer": "is collected", "options": ["is collected", "are collected"] },
  { "question": "You ___ (remind) about meetings every Monday.", "answer": "are reminded", "options": ["is reminded", "are reminded"] },
  { "question": "The results ___ (announce) at the end of the week.", "answer": "are announced", "options": ["is announced", "are announced"] },
  { "question": "She ___ (show) the new program every semester.", "answer": "is shown", "options": ["is shown", "are shown"] }
]
};

export default PassivePresGrammar;
