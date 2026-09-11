const PresentIngInterrogativeGrammar = {
  id: '24',
  title: 'Présent ING Interrogatif',
  description: 'Learn how to form questions in the present continuous tense',
  imageUrl: 'https://wretggbpaejzjdilemit.supabase.co/storage/v1/object/public/lesson-images/15274719ab/present-ing-interrogatif.webp',
  textContent: {
    cards: [
      {
        eyebrow: 'Poser une question',
        paragraph: 'Je demande ce qui est en train de se passer.',
        tip: 'Formule : be au présent + sujet + verbe-ing ?',
        columns: [
          {
            label: '1/ Je repère le sujet',
            accent: 'blue',
            rows: ['I', 'You', 'He / She / It', 'We', 'They'],
          },
          {
            label: '2/ Je conjugue BE au présent avant le sujet',
            accent: 'coral',
            rows: ['**Am** I', '**Are** you', '**Is** he / she / it', '**Are** we', '**Are** they'],
          },
          {
            label: "3/ J'ajoute la terminaison -ING au verbe",
            accent: 'teal',
            rows: ['visiting', 'speaking', 'being', 'dancing', 'Etc.'],
          },
        ],
        examples: [
          { en: '**Is Owen eating** a bagel?', fr: 'Owen est-il en train de manger... ?' },
          { en: '**Are we talking**?', fr: 'Sommes-nous en train de parler ?' },
        ],
      },
      {
        eyebrow: 'Les mots interrogatifs',
        subsections: [
          {
            text: 'Les mots interrogatifs se placent avant le verbe be :',
            accent: 'amber',
            rows: ['What', 'When', 'Where', 'Why', 'Who'],
          },
          {
            text: 'Par exemple :',
            accent: 'teal',
            rows: [
              '**am** I seeing?',
              '**are** you coming?',
              '**is** he / she / it going?',
              '**are** we laughing?',
              '**are** they talking to?',
            ],
          },
        ],
      },
    ],
  },
  translateExercises: [
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Sont-ils en train d'étudier ?",
    answer: "Are they studying?",
    wordBank: ["Are", "they", "studying?"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Est-elle en train de préparer le dîner maintenant ?",
    answer: "Is she cooking dinner now?",
    wordBank: ["Is", "she", "cooking", "dinner", "now?"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Es-tu en train de regarder la télévision ?",
    answer: "Are you watching TV?",
    wordBank: ["Are", "you", "watching", "TV?"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Est-il en train de jouer au football ?",
    answer: "Is he playing football?",
    wordBank: ["Is", "he", "playing", "football?"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Allons-nous à la fête ce soir ?",
    answer: "Are we going to the party tonight?",
    wordBank: ["Are", "we", "going", "to", "the party", "tonight?"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Est-il en train de pleuvoir dehors ?",
    answer: "Is it raining outside?",
    wordBank: ["Is", "it", "raining", "outside?"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Les enfants jouent-ils dans le jardin ?",
    answer: "Are the children playing in the garden?",
    wordBank: ["Are", "the children", "playing", "in", "the garden?"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Est-ce que je fais cela correctement ?",
    answer: "Am I doing this correctly?",
    wordBank: ["Am", "I", "doing", "this correctly?"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Ton ami vient-il à la réunion ?",
    answer: "Is your friend coming to the meeting?",
    wordBank: ["Is", "your friend", "coming", "to", "the meeting?"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Sommes-nous en train d'apprendre du nouveau vocabulaire ?",
    answer: "Are we learning new vocabulary?",
    wordBank: ["Are", "we", "learning", "new", "vocabulary?"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Travaille-t-il tard ce soir ?",
    answer: "Is he working late tonight?",
    wordBank: ["Is", "he", "working", "late", "tonight?"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Sont-ils en train de construire une nouvelle maison ?",
    answer: "Are they building a new house?",
    wordBank: ["Are", "they", "building", "a new", "house?"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Es-tu en train d'apprécier le concert ?",
    answer: "Are you enjoying the concert?",
    wordBank: ["Are", "you", "enjoying", "the concert?"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Fait-il sombre dehors ?",
    answer: "Is it getting dark outside?",
    wordBank: ["Is", "it", "getting", "dark", "outside?"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Est-elle en train de s'entraîner au piano ?",
    answer: "Is she practicing the piano?",
    wordBank: ["Is", "she", "practicing", "the piano?"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Assistent-ils à la réunion ?",
    answer: "Are they attending the meeting?",
    wordBank: ["Are", "they", "attending", "the meeting?"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Sommes-nous en train de dîner maintenant ?",
    answer: "Are we having dinner now?",
    wordBank: ["Are", "we", "having", "dinner", "now?"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Les enfants regardent-ils des dessins animés ?",
    answer: "Are the kids watching cartoons?",
    wordBank: ["Are", "the kids", "watching", "cartoons?"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Est-ce que j'utilise le bon livre ?",
    answer: "Am I using the right book?",
    wordBank: ["Am", "I", "using", "the right", "book?"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Ton équipe est-elle en train de gagner le match ?",
    answer: "Is your team winning the match?",
    wordBank: ["Is", "your team", "winning", "the match?"]
  }
],

  exercises: [
    { question: "___ they ___ for the exam? (study)", answer: "Are they studying?", options: ["Do they studying?", "Are they studying?", "Is they studying?", "Are they study?"] },
    { question: "___ she ___ dinner now? (cook)", answer: "Is she cooking dinner now?", options: ["Is she cook dinner now?", "Are she cooking dinner now?", "Is she cooking dinner now?", "Does she cooking dinner now?"] },
    { question: "___ you ___ TV? (watch)", answer: "Are you watching TV?", options: ["Do you watching TV?", "Are you watching TV?", "Is you watching TV?", "Are you watch TV?"] },
    { question: "___ he ___ football? (play)", answer: "Is he playing football?", options: ["Is he playing football?", "Are he playing football?", "Does he playing football?", "Is he play football?"] },
    { question: "___ we ___ to the party tonight? (go)", answer: "Are we going to the party tonight?", options: ["Are we go to the party tonight?", "Is we going to the party tonight?", "Are we going to the party tonight?", "Do we going to the party tonight?"] },
    { question: "___ it ___ outside? (rain)", answer: "Is it raining outside?", options: ["Is it raining outside?", "Are it raining outside?", "Does it raining outside?", "Is it rain outside?"] },
    { question: "___ the children ___ in the garden? (play)", answer: "Are the children playing in the garden?", options: ["Are the children playing in the garden?", "Do the children playing in the garden?", "Is the children playing in the garden?", "Are the children play in the garden?"] },
    { question: "___ I ___ this correctly? (do)", answer: "Am I doing this correctly?", options: ["Am I doing this correctly?", "Do I doing this correctly?", "Is I doing this correctly?", "Are I doing this correctly?"] },
    { question: "___ your friend ___ to the meeting? (come)", answer: "Is your friend coming to the meeting?", options: ["Is your friend coming to the meeting?", "Are your friend coming to the meeting?", "Does your friend coming to the meeting?", "Is your friend come to the meeting?"] },
    { question: "___ we ___ new vocabulary? (learn)", answer: "Are we learning new vocabulary?", options: ["Are we learning new vocabulary?", "Do we learning new vocabulary?", "Is we learning new vocabulary?", "Are we learn new vocabulary?"] },
    { question: "___ he ___ late tonight? (work)", answer: "Is he working late tonight?", options: ["Do he working late tonight?", "Is he working late tonight?", "Are he working late tonight?", "Is he work late tonight?"] },
    { question: "___ they ___ a new house? (build)", answer: "Are they building a new house?", options: ["Are they build a new house?", "Do they building a new house?", "Are they building a new house?", "Is they building a new house?"] },
    { question: "___ you ___ the concert? (enjoy)", answer: "Are you enjoying the concert?", options: ["Is you enjoying the concert?", "Are you enjoy the concert?", "Are you enjoying the concert?", "Do you enjoying the concert?"] },
    { question: "___ it ___ dark outside? (get)", answer: "Is it getting dark outside?", options: ["Is it get dark outside?", "Does it getting dark outside?", "Is it getting dark outside?", "Are it getting dark outside?"] },
    { question: "___ she ___ the piano? (practice)", answer: "Is she practicing the piano?", options: ["Is she practice the piano?", "Does she practicing the piano?", "Is she practicing the piano?", "Are she practicing the piano?"] },
    { question: "___ they ___ the meeting? (attend)", answer: "Are they attending the meeting?", options: ["Are they attend the meeting?", "Are they attending the meeting?", "Do they attending the meeting?", "Is they attending the meeting?"] },
    { question: "___ we ___ dinner now? (have)", answer: "Are we having dinner now?", options: ["Are we have dinner now?", "Is we having dinner now?", "Are we having dinner now?", "Do we having dinner now?"] },
    { question: "___ the kids ___ cartoons? (watch)", answer: "Are the kids watching cartoons?", options: ["Do the kids watching cartoons?", "Are the kids watch cartoons?", "Are the kids watching cartoons?", "Is the kids watching cartoons?"] },
    { question: "___ I ___ the right book? (use)", answer: "Am I using the right book?", options: ["Do I using the right book?", "Am I using the right book?", "Is I using the right book?", "Are I using the right book?"] },
    { question: "___ your team ___ the match? (win)", answer: "Is your team winning the match?", options: ["Is your team win the match?", "Are your team winning the match?", "Is your team winning the match?", "Does your team winning the match?"] },
    { question: "___ she ___ the bus? (take)", answer: "Is she taking the bus?", options: ["Is she take the bus?", "Does she taking the bus?", "Is she taking the bus?", "Are she taking the bus?"] },
    { question: "___ they ___ a trip? (plan)", answer: "Are they planning a trip?", options: ["Are they plan a trip?", "Do they planning a trip?", "Are they planning a trip?", "Is they planning a trip?"] },
    { question: "___ you ___ here long? (stay)", answer: "Are you staying here long?", options: ["Do you staying here long?", "Is you staying here long?", "Are you staying here long?", "Are you stay here long?"] },
    { question: "___ it ___ like rain? (look)", answer: "Is it looking like rain?", options: ["Is it look like rain?", "Does it looking like rain?", "Is it looking like rain?", "Are it looking like rain?"] },
    { question: "___ he ___ already? (sleep)", answer: "Is he sleeping already?", options: ["Is he sleep already?", "Is he sleeping already?", "Does he sleeping already?", "Are he sleeping already?"] },
    { question: "___ they ___ next month? (move)", answer: "Are they moving next month?", options: ["Are they move next month?", "Do they moving next month?", "Are they moving next month?", "Is they moving next month?"] },
    { question: "___ you ___ well today? (feel)", answer: "Are you feeling well today?", options: ["Do you feeling well today?", "Are you feeling well today?", "Is you feeling well today?", "Are you feel well today?"] }
  ]
};

export default PresentIngInterrogativeGrammar;
