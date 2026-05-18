const PresentIngGrammar = {
  id: '4',
  title: 'Present ING',
  description: 'Learn how to use the present continuous tense',
  imageUrl: 'https://i.ibb.co/hxp1J2W9/Pr-sent-ING.png',
translateExercises: [
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Ils prennent le petit déjeuner.",
    answer: "They are having breakfast.",
    wordBank: ["They", "are", "having", "breakfast.", "is", "not"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Elle fait ses devoirs.",
    answer: "She is doing her homework.",
    wordBank: ["She", "is", "doing", "her", "homework.", "are", "not"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "J'écoute de la musique.",
    answer: "I am listening to music.",
    wordBank: ["I", "am", "listening", "to", "music.", "is", "not"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Il lit un livre.",
    answer: "He is reading a book.",
    wordBank: ["He", "is", "reading", "a", "book.", "are", "not"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Nous apprenons l'anglais.",
    answer: "We are learning English.",
    wordBank: ["We", "are", "learning", "English.", "is", "not"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Les enfants jouent dehors.",
    answer: "The children are playing outside.",
    wordBank: ["The", "children", "are", "playing", "outside.", "is", "not"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Il pleut.",
    answer: "It is raining.",
    wordBank: ["It", "is", "raining.", "are", "not"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Le soleil brille.",
    answer: "The sun is shining.",
    wordBank: ["The", "sun", "is", "shining.", "are", "not"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Ils construisent une maison.",
    answer: "They are building a house.",
    wordBank: ["They", "are", "building", "a", "house.", "is", "not"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Elle étudie.",
    answer: "She is studying.",
    wordBank: ["She", "is", "studying.", "are", "not"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Vous écoutez le professeur.",
    answer: "You are listening to the teacher.",
    wordBank: ["You", "are", "listening", "to", "the", "teacher.", "is", "not"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Le bébé dort.",
    answer: "The baby is sleeping.",
    wordBank: ["The", "baby", "is", "sleeping.", "are", "not"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Il lave la voiture.",
    answer: "He is washing the car.",
    wordBank: ["He", "is", "washing", "the", "car.", "are", "not"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Nous cuisinons le dîner.",
    answer: "We are cooking dinner.",
    wordBank: ["We", "are", "cooking", "dinner.", "is", "not"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "J'écris une lettre.",
    answer: "I am writing a letter.",
    wordBank: ["I", "am", "writing", "a", "letter.", "is", "not"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Elle attend le bus.",
    answer: "She is waiting for the bus.",
    wordBank: ["She", "is", "waiting", "for", "the", "bus.", "are", "not"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Les oiseaux volent.",
    answer: "The birds are flying.",
    wordBank: ["The", "birds", "are", "flying.", "is", "not"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Le professeur explique la leçon.",
    answer: "The teacher is explaining the lesson.",
    wordBank: ["The", "teacher", "is", "explaining", "the", "lesson.", "are", "not"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Mon père répare le vélo.",
    answer: "My father is repairing the bike.",
    wordBank: ["My", "father", "is", "repairing", "the", "bike.", "are", "not"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Les élèves chantent ensemble.",
    answer: "The students are singing together.",
    wordBank: ["The", "students", "are", "singing", "together.", "is", "not"]
  }
],

  exercises: [
    { question: "They ___ dinner right now.", answer: "are having", options: ["having", "are having", "have", "has"] },
    { question: "She ___ her homework.", answer: "is doing", options: ["doing", "is doing", "does", "do"] },
    { question: "I ___ to music.", answer: "am listening", options: ["listening", "am listening", "listen", "listens"] },
    { question: "He ___ a book.", answer: "is reading", options: ["reading", "is reading", "reads", "read"] },
    { question: "We ___ English.", answer: "are learning", options: ["learning", "are learning", "learn", "learns"] },
    { question: "The children ___ in the garden.", answer: "are playing", options: ["playing", "are playing", "play", "plays"] },
    { question: "It ___ outside.", answer: "is raining", options: ["raining", "is raining", "rain", "rains"] },
    { question: "The sun ___ brightly.", answer: "is shining", options: ["shining", "is shining", "shine", "shines"] },
    { question: "They ___ a new house.", answer: "are building", options: ["building", "are building", "build", "builds"] },
    { question: "She ___ for her exam.", answer: "is studying", options: ["studying", "is studying", "study", "studies"] },
    { question: "We ___ to the radio.", answer: "are listening", options: ["listening", "are listening", "listen", "listens"] },
    { question: "The cat ___ on the sofa.", answer: "is sleeping", options: ["sleeping", "is sleeping", "sleep", "sleeps"] },
    { question: "He ___ his car.", answer: "is washing", options: ["washing", "is washing", "wash", "washes"] },
    { question: "They ___ dinner.", answer: "are cooking", options: ["cooking", "are cooking", "cook", "cooks"] },
    { question: "I ___ a letter.", answer: "am writing", options: ["writing", "am writing", "write", "writes"] },
    { question: "The baby ___ peacefully.", answer: "is sleeping", options: ["sleeping", "is sleeping", "sleep", "sleeps"] },
    { question: "They ___ football in the park.", answer: "are playing", options: ["playing", "are playing", "play", "plays"] },
    { question: "She ___ for the bus.", answer: "is waiting", options: ["waiting", "is waiting", "wait", "waits"] },
    { question: "We ___ to Paris tomorrow.", answer: "are flying", options: ["flying", "are flying", "fly", "flies"] },
    { question: "The teacher ___ the lesson.", answer: "is explaining", options: ["explaining", "is explaining", "explain", "explains"] },
    { question: "He ___ his bike.", answer: "is repairing", options: ["repairing", "is repairing", "repair", "repairs"] },
    { question: "The birds ___ in the trees.", answer: "are singing", options: ["singing", "are singing", "sing", "sings"] },
    { question: "I ___ my room.", answer: "am cleaning", options: ["cleaning", "am cleaning", "clean", "cleans"] },
    { question: "The dog ___ in the garden.", answer: "is barking", options: ["barking", "is barking", "bark", "barks"] },
    { question: "You ___ very hard today.", answer: "are working", options: ["working", "are working", "work", "works"] },
   { question: "They ___ (play) football.", answer: "are playing", options: ["are playing", "is playing", "am playing", "be playing"] },
  { question: "She ___ (read) a book.", answer: "is reading", options: ["is reading", "are reading", "am reading", "be reading"] },
  { question: "I ___ (watch) TV.", answer: "am watching", options: ["am watching", "is watching", "are watching", "be watching"] },
  { question: "We ___ (eat) lunch.", answer: "are eating", options: ["are eating", "is eating", "am eating", "be eating"] },
  { question: "He ___ (write) a letter.", answer: "is writing", options: ["is writing", "are writing", "am writing", "be writing"] },
  { question: "They ___ (run) in the park.", answer: "are running", options: ["are running", "is running", "am running", "be running"] },
  { question: "She ___ (draw) a picture.", answer: "is drawing", options: ["is drawing", "are drawing", "am drawing", "be drawing"] },
  { question: "I ___ (play) the guitar.", answer: "am playing", options: ["am playing", "is playing", "are playing", "be playing"] },
  { question: "We ___ (sing) a song.", answer: "are singing", options: ["are singing", "is singing", "am singing", "be singing"] },
  { question: "He ___ (cook) dinner.", answer: "is cooking", options: ["is cooking", "are cooking", "am cooking", "be cooking"] },
  { question: "They ___ (dance) together.", answer: "are dancing", options: ["are dancing", "is dancing", "am dancing", "be dancing"] },
  { question: "She ___ (swim) in the pool.", answer: "is swimming", options: ["is swimming", "are swimming", "am swimming", "be swimming"] },
  { question: "I ___ (write) in my notebook.", answer: "am writing", options: ["am writing", "is writing", "are writing", "be writing"] },
  { question: "We ___ (listen) to music.", answer: "are listening", options: ["are listening", "is listening", "am listening", "be listening"] },
  { question: "He ___ (clean) his room.", answer: "is cleaning", options: ["is cleaning", "are cleaning", "am cleaning", "be cleaning"] },
  ]
};

export default PresentIngGrammar;
