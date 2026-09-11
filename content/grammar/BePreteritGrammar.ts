const BePreteritGrammar = {
  id: 'BePreterit',
  title: 'Be au prétérit',
  description: 'Questions au prétérit avec le verbe "to be" — complétez avec was / were.',
  imageUrl: 'https://wretggbpaejzjdilemit.supabase.co/storage/v1/object/public/lesson-images/15274719ab/be-au-preterit.webp',
  textContent: {
    cards: [
      {
        eyebrow: 'Formes du prétérit',
        paragraph: 'Be est le seul verbe à avoir deux formes au prétérit. Elles dépendent du pronom utilisé.',
        columns: [
          {
            label: '1/ Je repère le sujet',
            accent: 'blue',
            rows: ['I', 'You', 'He / She / It', 'We', 'They'],
          },
          {
            label: '2/ Je conjugue le verbe',
            accent: 'amber',
            rows: ['I **was**', 'You **were**', 'He / She / It **was**', 'We **were**', 'They **were**'],
          },
        ],
        examples: [
          { en: '**Molly was** a good singer.', fr: 'Molly était une bonne chanteuse.' },
          { en: '**They were** out yesterday.', fr: 'Ils étaient dehors hier.' },
        ],
      },
      {
        eyebrow: 'C’est vrai aussi pour le négatif et les questions',
        columns: [
          {
            label: 'Négatif',
            accent: 'coral',
            rows: ['I **wasn’t**', 'You **weren’t**', 'He / She / It **wasn’t**', 'We **weren’t**', 'They **weren’t**'],
          },
          {
            label: 'Questions',
            accent: 'teal',
            rows: ['**Was** I', '**Were** you', '**Was** he / she / it', '**Were** we', '**Were** they'],
          },
        ],
        examples: [
          { en: '**Harry wasn’t** happy.', fr: "Harry n'était pas heureux." },
          { en: '**Were** the Dursleys nice?', fr: 'Les Dursleys étaient-ils gentils ?' },
        ],
      },
    ],
  },
translateExercises: [
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "J’étais à la maison hier soir.",
    answer: "I was at home last night.",
    wordBank: ["I", "was", "were", "at", "home", "last", "night."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Je n’étais pas au concert.",
    answer: "I wasn't at the concert.",
    wordBank: ["I", "wasn't", "weren't", "at", "the concert."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Il était content du résultat.",
    answer: "He was happy with the result.",
    wordBank: ["He", "was", "were", "happy", "with", "the result."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Il n’était pas à la réunion.",
    answer: "He wasn't at the meeting.",
    wordBank: ["He", "wasn't", "weren't", "at", "the meeting."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Ils étaient à Londres en 2010.",
    answer: "They were in London in 2010.",
    wordBank: ["They", "was", "were", "in", "London", "in", "2010."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Ils n’étaient pas à l’école hier.",
    answer: "They weren't at school yesterday.",
    wordBank: ["They", "wasn't", "weren't", "at", "school", "yesterday."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Nous étions en avance pour le rendez-vous.",
    answer: "We were early for the appointment.",
    wordBank: ["We", "was", "were", "early", "for", "the appointment."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Nous n’étions pas invités à la fête.",
    answer: "We weren't invited to the party.",
    wordBank: ["We", "wasn't", "weren't", "invited", "to", "the party."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Le temps était terrible hier.",
    answer: "The weather was terrible yesterday.",
    wordBank: ["The weather", "was", "were", "terrible", "yesterday."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Les magasins étaient ouverts lundi.",
    answer: "The shops were open on Monday.",
    wordBank: ["The shops", "was", "were", "open", "on", "Monday."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Les enfants étaient enthousiastes à propos du voyage.",
    answer: "The children were excited about the trip.",
    wordBank: ["The children", "was", "were", "excited", "about", "the trip."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Les enfants n’étaient pas prêts pour l’école.",
    answer: "The children weren't ready for school.",
    wordBank: ["The children", "wasn't", "weren't", "ready", "for", "school."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Il y avait beaucoup de gens au concert.",
    answer: "There were many people at the concert.",
    wordBank: ["There", "was", "were", "many", "people", "at", "the concert."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Ma sœur était fatiguée après le voyage.",
    answer: "My sister was tired after the trip.",
    wordBank: ["My sister", "was", "were", "tired", "after", "the trip."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Les chiens étaient dans le jardin.",
    answer: "The dogs were in the garden.",
    wordBank: ["The dogs", "was", "were", "in", "the garden."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Le film n’était pas intéressant.",
    answer: "The movie wasn't interesting.",
    wordBank: ["The movie", "wasn't", "weren't", "interesting."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Nous étions très occupés hier.",
    answer: "We were very busy yesterday.",
    wordBank: ["We", "was", "were", "very", "busy", "yesterday."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "La porte était ouverte.",
    answer: "The door was open.",
    wordBank: ["The door", "was", "were", "open."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Les élèves n’étaient pas en classe.",
    answer: "The students weren't in class.",
    wordBank: ["The students", "wasn't", "weren't", "in", "class."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Mon père était à Paris la semaine dernière.",
    answer: "My father was in Paris last week.",
    wordBank: ["My father", "was", "were", "in", "Paris", "last", "week."]
  }
],

  exercises: [
    { question: "I ___ at home last night.", answer: "was", options: ["was", "were"] },
    { question: "I ___ at the concert.", answer: "wasn't", options: ["wasn't", "weren't"] },
    { question: "He ___ happy with the result.", answer: "was", options: ["was", "were"] },
    { question: "He ___ at the meeting.", answer: "wasn't", options: ["wasn't", "weren't"] },
    { question: "They ___ in London in 2010.", answer: "were", options: ["was", "were"] },
    { question: "They ___ at school yesterday.", answer: "weren't", options: ["wasn't", "weren't"] },
    { question: "We ___ early for the appointment.", answer: "were", options: ["was", "were"] },
    { question: "We ___ invited to the party.", answer: "weren't", options: ["wasn't", "weren't"] },
    { question: "The weather ___ terrible yesterday.", answer: "was", options: ["was", "were"] },
    { question: "The shops ___ open on Monday.", answer: "were", options: ["was", "were"] },

    { question: "___ at the party yesterday?", answer: "Was he", options: ["Was he", "Were he", "He was", "He were"] },
    { question: "___ in the garden this morning?", answer: "Were they", options: ["Was they", "Were they", "They was", "They were"] },
    { question: "___ the manager then?", answer: "Was he", options: ["Was he", "Were he", "He was", "He were"] },
    { question: "___ at home on Sunday?", answer: "Were you", options: ["Was you", "Were you", "You was", "You were"] },
    { question: "___ born in France?", answer: "Was she", options: ["Was she", "Were she", "She was", "She were"] },
    { question: "___ on the bus when it started?", answer: "Were you", options: ["Was you", "Were you", "You was", "You were"] },
    { question: "___ ready on time?", answer: "Was it", options: ["Was it", "Were it", "It was", "It were"] },
    { question: "___ at the cinema last night?", answer: "Were they", options: ["Was they", "Were they", "They was", "They were"] },
    { question: "___ at the meeting yesterday?", answer: "Wasn't she", options: ["Wasn't she", "Weren't she", "She wasn't", "She weren't"] },
    { question: "___ responsible for the mistake?", answer: "Weren't you", options: ["Wasn't you", "Weren't you", "You wasn't", "You weren't"] },

    { question: "The children ___ excited about the trip.", answer: "were", options: ["was", "were"] },
    { question: "The children ___ ready for school.", answer: "weren't", options: ["wasn't", "weren't"] },
    { question: "There ___ many people at the concert.", answer: "were", options: ["was", "were"] },
    { question: "There ___ a problem with the system.", answer: "was", options: ["was", "were"] },
    { question: "My phone ___ in my bag.", answer: "wasn't", options: ["wasn't", "weren't"] }
  ]
};

export default BePreteritGrammar;
