const Conditional1Grammar = {
  id: '12',
  title: 'Conditionnel 1',
  description: 'Learn how to use the first conditional',  imageUrl: 'https://i.ibb.co/bRFdNdnS/Conditionnel-1.png',
  textContent: {
    cards: [
      {
        eyebrow: 'La formule',
        paragraph: 'Pour parler de ce qui pourra arriver si une condition est remplie.',
        tip: 'Formule : IF + présent, sujet + will + base verbale. La phrase est construite en deux temps.',
        columns: [
          {
            label: '1/ La subordonnée : si une condition est remplie...',
            accent: 'blue',
            rows: ['If **you go** with me,', 'If **Juliet’s family sees** Romeo,'],
          },
          {
            label: '2/ La principale : ... il y aura telle conséquence',
            accent: 'coral',
            rows: ['I **will be** very happy.', 'They **will kill** him.'],
          },
        ],
        examples: [
          { en: '**If you go** with me, **I will be** very happy.', fr: 'Si tu viens avec moi, je serai très heureux.' },
          { en: '**If Juliet’s family sees** Romeo, **they will kill** him.', fr: 'Si la famille de Juliette voit Roméo, ils le tueront.' },
        ],
      },
    ],
  },
  translateExercises: [

  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Si elle reste ici, Marie sera en sécurité.",
    answer: "If she stays here, Marie will be safe.",
    wordBank: ["If", "she", "stays", "here,", "Marie", "will", "be", "safe."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "S’il étudie, Paul réussira à l’examen.",
    answer: "If he studies, Paul will pass the exam.",
    wordBank: ["If", "he", "studies,", "Paul", "will", "pass", "the exam."]
  },
  {
  type: 'translate',
  question: 'Translate into English.',
  prompt: "Si elle sourit, Alex tombera amoureux.",
  answer: "If she smiles, Alex will fall in love.",
  wordBank: ["If she", "smiles,", "Alex", "will fall in love."]
},
{
  type: 'translate',
  question: 'Translate into English.',
  prompt: "Si Lucas l’invite, Emma dira oui.",
  answer: "If Lucas invites her, Emma will say yes.",
  wordBank: ["If Lucas", "invites her,", "Emma", "will say yes."]
},
{
  type: 'translate',
  question: 'Translate into English.',
  prompt: "S’ils vont au cinéma, ils seront heureux.",
  answer: "If they go to the cinema, they will be happy.",
  wordBank: ["If they", "go to the cinema,", "they", "will be", "happy."]
},
{
  type: 'translate',
  question: 'Translate into English.',
  prompt: "Si elle l’embrasse, Noah rougira.",
  answer: "If she kisses him, Noah will blush.",
  wordBank: ["If she", "kisses him,", "Noah", "will blush."]
},
{
  type: 'translate',
  question: 'Translate into English.',
  prompt: "Si Tom appelle Clara, elle répondra.",
  answer: "If Tom calls Clara, she will answer.",
  wordBank: ["If Tom", "calls Clara,", "she", "will answer."]
},
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Si elle part tôt, Léa attrapera le bus.",
    answer: "If she leaves early, Léa will catch the bus.",
    wordBank: ["If", "she", "leaves", "early,", "Léa", "will", "catch", "the bus."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "S’il gagne, Tom sera heureux.",
    answer: "If he wins, Tom will be happy.",
    wordBank: ["If", "he", "wins,", "Tom", "will", "be", "happy."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "S'il travaille plus dur, Marc réussira.",
    answer: "If he works harder, Marc will succeed.",
    wordBank: ["If", "he", "works", "harder,", "Marc", "will", "succeed."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "S’il pleut, Emma n’ira pas.",
    answer: "If it rains, Emma won't go.",
    wordBank: ["If", "it", "rains,", "Emma", "won't", "go."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Si tu pars maintenant, Julie attrapera le train.",
    answer: "If you leave now, Julie will catch the train.",
    wordBank: ["If", "you", "leave", "now,", "Julie", "will", "catch", "the train."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Si j’obtiens le travail, mon frère ira en ville.",
    answer: "If I get the job, my brother will go to town.",
    wordBank: ["If", "I", "get", "the job,", "my brother", "will", "go", "to", "town."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "S’il est gentil, Lucas aura un cadeau.",
    answer: "If he is nice, Lucas will have a gift.",
    wordBank: ["If", "he", "is", "nice,", "Lucas", "will", "have", "a gift."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Si tu étudies, Sarah réussira.",
    answer: "If you study, Sarah will succeed.",
    wordBank: ["If", "you", "study,", "Sarah", "will", "succeed."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Si elle obtient le poste, Anna déménagera.",
    answer: "If she gets the position, Anna will move.",
    wordBank: ["If", "she", "gets", "the position,", "Anna", "will", "move."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "S’il neige, la famille restera à la maison.",
    answer: "If it snows, the family will stay at home.",
    wordBank: ["If", "it", "snows,", "the family", "will", "stay", "at", "home."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Si tu arrives tôt, Max obtiendra une place.",
    answer: "If you arrive early, Max will get a seat.",
    wordBank: ["If", "you", "arrive", "early,", "Max", "will", "get", "a seat."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Si tu gagnes, Clara achètera une voiture.",
    answer: "If you win, Clara will buy a car.",
    wordBank: ["If", "you", "win,", "Clara", "will", "buy", "a car."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Si tu pars maintenant, Paul ne sera pas en retard.",
    answer: "If you leave now, Paul won't be late.",
    wordBank: ["If", "you", "leave", "now,", "Paul", "won't", "be", "late."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Si elle lui parle, Julien tombera amoureux.",
    answer: "If she talks to him, Julien will fall in love.",
    wordBank: ["If", "she", "talks", "to", "him,", "Julien", "will", "fall", "in love."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "S’ils passent du temps ensemble, Emma et Leo tomberont amoureux.",
    answer: "If they spend time together, Emma and Leo will fall in love.",
    wordBank: ["If", "they", "spend", "time", "together,", "Emma and Leo", "will", "fall", "in love."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Si tu lui écris, Marie sera heureuse.",
    answer: "If you write to her, Marie will be happy.",
    wordBank: ["If", "you", "write", "to", "her,", "Marie", "will", "be", "happy."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "S’il oublie son anniversaire, Sophie sera triste.",
    answer: "If he forgets her birthday, Sophie will be sad.",
    wordBank: ["If", "he", "forgets", "her birthday,", "Sophie", "will", "be", "sad."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Si elle accepte le rendez-vous, Nathan ira au restaurant.",
    answer: "If she accepts the date, Nathan will go to the restaurant.",
    wordBank: ["If", "she", "accepts", "the date,", "Nathan", "will", "go", "to", "the restaurant."]
  }
],

  exercises: [
    { question: "If it rains, I ___ at home. (stay)", answer: "will stay", options: ["will stay", "would stay", "stayed", "staying"] },
    { question: "If you study hard, you ___ the exam. (pass)", answer: "will pass", options: ["will pass", "would pass", "passed", "passing"] },   
    { question: "If she ___ early, she will catch the bus. (leave)", answer: "leaves", options: ["leaves", "left", "will leave", "leaving"] },
    { question: "They ___ happy if they win the match. (be)", answer: "will be", options: ["will be", "would be", "were", "being"] },
    { question: "If he ___ harder, he will succeed. (work)", answer: "works", options: ["works", "worked", "will work", "working"] },
    { question: "If it ___, we ___ to the beach. (rain/not go)", answer: "rains, won't go", options: ["rains, won't go", "rain, won't go", "will rain, not go", "rains, don't go"] },
    { question: "If she ___ the exam, she ___ to university. (pass/go)", answer: "passes, will go", options: ["passes, will go", "will pass, goes", "pass, will go", "passes, goes"] },
    { question: "If you ___ now, you ___ the train. (leave/catch)", answer: "leave, will catch", options: ["leave, will catch", "will leave, catch", "leaves, will catch", "leave, catch"] },
    { question: "If we ___ tickets, we ___ to the concert. (get/go)", answer: "get, will go", options: ["get, will go", "will get, go", "gets, will go", "get, go"] },
    { question: "If it ___ sunny tomorrow, we ___ a picnic. (be/have)", answer: "is, will have", options: ["is, will have", "will be, have", "be, will have", "is, have"] },
    { question: "If you ___ harder, you ___ better results. (study/achieve)", answer: "study, will achieve", options: ["study, will achieve", "will study, achieve", "studies, will achieve", "study, achieve"] },    { question: "If he ___ the job, he ___ to London. (get/move)", answer: "gets, will move", options: ["gets, will move", "will get, move", "get, will move", "gets, moves"] },
    { question: "If you ___ hard, you ___ your goals. (work/achieve)", answer: "work, will achieve", options: ["work, will achieve", "will work, achieve", "works, will achieve", "work, achieve"] },
    { question: "If it ___ tomorrow, we ___ inside. (snow/stay)", answer: "snows, will stay", options: ["snows, will stay", "will snow, stay", "snow, will stay", "snows, stay"] },
    { question: "If they ___ early, they ___ good seats. (arrive/get)", answer: "arrive, will get", options: ["arrive, will get", "will arrive, get", "arrives, will get", "arrive, get"] },
    { question: "If she ___ the exam, she ___ happy. (pass/be)", answer: "passes, will be", options: ["passes, will be", "will pass, be", "pass, will be", "passes, is"] },
    { question: "If I ___ the lottery, I ___ a house. (win/buy)", answer: "win, will buy", options: ["win, will buy", "will win, buy", "wins, will buy", "win, buy"] },
    { question: "If we ___ now, we ___ late. (leave/not be)", answer: "leave, won't be", options: ["leave, won't be", "will leave, not be", "leaves, won't be", "leave, not be"] },
    { question: "If you ___ me, I ___ you. (help/reward)", answer: "help, will reward", options: ["help, will reward", "will help, reward", "helps, will reward", "help, reward"] },
    { question: "If he ___ medicine, he ___ better. (take/feel)", answer: "takes, will feel", options: ["takes, will feel", "will take, feel", "take, will feel", "takes, feel"] },
    { question: "If it ___, we ___ tennis. (rain/not play)", answer: "rains, won't play", options: ["rains, won't play", "will rain, not play", "rain, won't play", "rains, not play"] },
    { question: "If they ___ the instructions, they ___ succeed. (follow/surely)", answer: "follow, will surely", options: ["follow, will surely", "will follow, surely", "follows, will surely", "follow, surely"] },
    { question: "If she ___ her best, she ___ the competition. (do/win)", answer: "does, will win", options: ["does, will win", "will do, win", "do, will win", "does, win"] },
    { question: "If you ___ this book, you ___ it. (read/enjoy)", answer: "read, will enjoy", options: ["read, will enjoy", "will read, enjoy", "reads, will enjoy", "read, enjoy"] }
  ]
};

export default Conditional1Grammar;
