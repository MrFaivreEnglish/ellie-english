const PassivePastGrammar = {
  id: '38',
  title: 'Voix passive passée',
  description: 'Learn how to use the passive voice in past tense',
  category: 'Voix passive',
  imageUrl: 'https://wretggbpaejzjdilemit.supabase.co/storage/v1/object/public/lesson-images/15274719ab/voix-passive-passee.webp',
  textContent: {
    cards: [
      {
        eyebrow: 'À quoi ça sert',
        paragraph: 'Je parle de ce qui était subi (être disputé, être construit...).',
        tip: 'Formule : sujet + be au prétérit + participe passé.',
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
            label: '3/ Je trouve le participe passé du verbe',
            accent: 'teal',
            rows: ['Verbe régulier : **+ED**', 'Verbe irrégulier : **par cœur**'],
          },
        ],
        examples: [
          { en: 'The dog **was taken** to the zoo.', fr: 'Le chien a été emmené au zoo.' },
          { en: 'Sharks **were fished**.', fr: 'Les requins étaient pêchés.' },
        ],
      },
      {
        eyebrow: 'La forme négative',
        paragraph: "On utilise **wasn't** ou **weren't** + participe passé.",
        examples: [
          { en: "We **weren't informed** of it.", fr: "Nous n'avons pas été informés de ça." },
          { en: "The text **wasn't written** by AI.", fr: "Le texte n'a pas été écrit par IA." },
        ],
      },
    ],
  },
translateExercises: [
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Le livre était écrit en français.",
    answer: "The book was written in French.",
    wordBank: ["The", "book", "was", "written", "in", "French.", "were"]
  },
  {
  type: 'translate',
  question: 'Translate into English.',
  prompt: "Le mur n'a pas été peint en bleu.",
  answer: "The wall was not painted blue.",
  wordBank: ["The", "wall", "was", "not", "painted", "blue.", "were"]
},
{
  type: 'translate',
  question: 'Translate into English.',
  prompt: "Les clés n'ont pas été trouvées.",
  answer: "The keys were not found.",
  wordBank: ["The", "keys", "were", "not", "found.", "was"]
},
{
  type: 'translate',
  question: 'Translate into English.',
  prompt: "La chanson n'a pas été chantée par la classe.",
  answer: "The song was not sung by the class.",
  wordBank: ["The", "song", "was", "not", "sung", "by", "the", "class.", "were"]
},
{
  type: 'translate',
  question: 'Translate into English.',
  prompt: "Les cartes n'ont pas été perdues.",
  answer: "The cards were not lost.",
  wordBank: ["The", "cards", "were", "not", "lost.", "was"]
},
{
  type: 'translate',
  question: 'Translate into English.',
  prompt: "Le repas n'a pas été préparé hier.",
  answer: "The meal was not prepared yesterday.",
  wordBank: ["The", "meal", "was", "not", "prepared", "yesterday.", "were"]
},
{
  type: 'translate',
  question: 'Translate into English.',
  prompt: "Les photos n'ont pas été prises au parc.",
  answer: "The photos were not taken at the park.",
  wordBank: ["The", "photos", "were", "not", "taken", "at", "the", "park.", "was"]
},
{
  type: 'translate',
  question: 'Translate into English.',
  prompt: "La porte n'a pas été ouverte.",
  answer: "The door was not opened.",
  wordBank: ["The", "door", "was", "not", "opened.", "were"]
},
{
  type: 'translate',
  question: 'Translate into English.',
  prompt: "Les devoirs n'ont pas été corrigés.",
  answer: "The homework was not corrected.",
  wordBank: ["The", "homework", "were", "not", "corrected.", "was"]
},
{
  type: 'translate',
  question: 'Translate into English.',
  prompt: "Le gâteau n'a pas été coupé.",
  answer: "The cake was not cut.",
  wordBank: ["The", "cake", "was", "not", "cut.", "were"]
},
{
  type: 'translate',
  question: 'Translate into English.',
  prompt: "Les fleurs n'étaient pas arrosées.",
  answer: "The flowers were not watered.",
  wordBank: ["The", "flowers", "were", "not", "watered.", "was"]
},
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Les bus étaient séparés.",
    answer: "The buses were segregated.",
    wordBank: ["The", "buses", "were", "segregated.", "was"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Le film a été réalisé par une femme.",
    answer: "The movie was directed by a woman.",
    wordBank: ["The", "movie", "was", "directed", "by", "a", "woman.", "were"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Les écoles étaient fermées.",
    answer: "The schools were closed.",
    wordBank: ["The", "schools", "were", "closed.", "was"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "La voiture a été réparée.",
    answer: "The car was fixed.",
    wordBank: ["The", "car", "was", "fixed.", "were"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Les élèves noirs étaient exclus.",
    answer: "Black students were excluded.",
    wordBank: ["Black", "students", "were", "excluded.", "was"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Le pont était construit en pierre.",
    answer: "The bridge was built with stone.",
    wordBank: ["The", "bridge", "was", "built", "with", "stone.", "were"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Les fontaines ont été surveillées.",
    answer: "The water fountains were watched.",
    wordBank: ["The", "water", "fountains", "were", "watched.", "was"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Le concert était annulé.",
    answer: "The concert was canceled.",
    wordBank: ["The", "concert", "was", "canceled.", "were"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Les familles noires ont été déplacées.",
    answer: "Black families were moved.",
    wordBank: ["Black", "families", "were", "moved.", "was"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Les documents étaient signés.",
    answer: "The documents were signed.",
    wordBank: ["The", "documents", "were", "signed.", "was"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Le restaurant a été boycotté.",
    answer: "The restaurant was boycotted.",
    wordBank: ["The", "restaurant", "was", "boycotted.", "were"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "La fenêtre était cassée.",
    answer: "The window was broken.",
    wordBank: ["The", "window", "was", "broken.", "were"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Les lois ont été changées.",
    answer: "The laws were changed.",
    wordBank: ["The", "laws", "were", "changed.", "was"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Les arbres étaient plantés.",
    answer: "The trees were planted.",
    wordBank: ["The", "trees", "were", "planted.", "was"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Le parc a été interdit.",
    answer: "The park was banned.",
    wordBank: ["The", "park", "was", "banned.", "were"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "L'article était publié.",
    answer: "The article was published.",
    wordBank: ["The", "article", "was", "published.", "were"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Les droits ont été refusés.",
    answer: "Rights were denied.",
    wordBank: ["Rights", "were", "denied.", "was"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Les règles étaient expliquées.",
    answer: "The rules were explained.",
    wordBank: ["The", "rules", "were", "explained.", "was"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Les quartiers ont été divisés.",
    answer: "The neighborhoods were divided.",
    wordBank: ["The", "neighborhoods", "were", "divided.", "was"]
  }
],

  exercises: [
  { "question": "The letter ___ (write) yesterday.", "answer": "was written", "options": ["is written", "was written", "are written", "were written"] },
  { "question": "The dishes ___ (wash) after dinner.", "answer": "were washed", "options": ["is washed", "was washed", "are washed", "were washed"] },
  { "question": "The movie ___ (direct) by Spielberg.", "answer": "was directed", "options": ["is directed", "was directed", "are directed", "were directed"] },
  { "question": "The books ___ (sell) at auction.", "answer": "were sold", "options": ["is sold", "was sold", "are sold", "were sold"] },
  { "question": "The car ___ (fix) last week.", "answer": "was fixed", "options": ["is fixed", "was fixed", "are fixed", "were fixed"] },
  { "question": "The house ___ (build) in 1990.", "answer": "was built", "options": ["is built", "was built", "are built", "were built"] },
  { "question": "The paintings ___ (display) in the museum.", "answer": "were displayed", "options": ["is displayed", "was displayed", "are displayed", "were displayed"] },
  { "question": "The game ___ (cancel) due to rain.", "answer": "was canceled", "options": ["is canceled", "was canceled", "are canceled", "were canceled"] },
  { "question": "The documents ___ (sign) by the manager.", "answer": "were signed", "options": ["is signed", "was signed", "are signed", "were signed"] },
  { "question": "The window ___ (break) by the storm.", "answer": "was broken", "options": ["is broken", "was broken", "are broken", "were broken"] },
  { "question": "The flowers ___ (plant) in spring.", "answer": "were planted", "options": ["is planted", "was planted", "are planted", "were planted"] },
  { "question": "The story ___ (publish) last month.", "answer": "was published", "options": ["is published", "was published", "are published", "were published"] },
  { "question": "The rules ___ (explain) to everyone.", "answer": "were explained", "options": ["is explained", "was explained", "are explained", "were explained"] },
 { "question": "I ___ (call) by my teacher yesterday.", "answer": "was called", "options": ["is called", "was called", "are called", "were called"] },
  { "question": "You ___ (invite) to the party last week.", "answer": "were invited", "options": ["is invited", "was invited", "are invited", "were invited"] },
  { "question": "He ___ (remind) about the meeting.", "answer": "was reminded", "options": ["is reminded", "was reminded", "are reminded", "were reminded"] },
  { "question": "She ___ (give) a gift on her birthday.", "answer": "was given", "options": ["is given", "was given", "are given", "were given"] },
  { "question": "We ___ (inform) about the schedule changes.", "answer": "were informed", "options": ["is informed", "was informed", "are informed", "were informed"] },
  { "question": "They ___ (ask) to leave the room.", "answer": "were asked", "options": ["is asked", "was asked", "are asked", "were asked"] },
  { "question": "It ___ (fix) by the mechanic yesterday.", "answer": "was fixed", "options": ["is fixed", "was fixed", "are fixed", "were fixed"] },
  { "question": "I ___ (teach) new grammar rules last week.", "answer": "was taught", "options": ["is taught", "was taught", "are taught", "were taught"] },
  { "question": "You ___ (show) the new office yesterday.", "answer": "were shown", "options": ["is shown", "was shown", "are shown", "were shown"] },
  { "question": "He ___ (invite) to join the team.", "answer": "was invited", "options": ["is invited", "was invited", "are invited", "were invited"] },
  { "question": "She ___ (help) with the project.", "answer": "was helped", "options": ["is helped", "was helped", "are helped", "were helped"] },
  { "question": "We ___ (ask) to complete the form.", "answer": "were asked", "options": ["is asked", "was asked", "are asked", "were asked"] },
  { "question": "They ___ (inform) about the decision.", "answer": "were informed", "options": ["is informed", "was informed", "are informed", "were informed"] },
  { "question": "It ___ (repair) last week.", "answer": "was repaired", "options": ["is repaired", "was repaired", "are repaired", "were repaired"] },
  { "question": "The awards ___ (give) last month.", "answer": "were given", "options": ["is given", "was given", "are given", "were given"] },
  { "question": "The homework ___ (finish) by the students before class.", "answer": "was finished", "options": ["is finished", "was finished", "are finished", "were finished"] },
  { "question": "The emails ___ (check) by the assistant yesterday.", "answer": "were checked", "options": ["is checked", "was checked", "are checked", "were checked"] },
  { "question": "The lights ___ (turn off) after the meeting.", "answer": "were turned off", "options": ["is turned off", "was turned off", "are turned off", "were turned off"] },
  { "question": "The message ___ (send) to all employees.", "answer": "was sent", "options": ["is sent", "was sent", "are sent", "were sent"] },
  { "question": "The room ___ (decorate) for the party.", "answer": "was decorated", "options": ["is decorated", "was decorated", "are decorated", "were decorated"] }
]
};

export default PassivePastGrammar;
