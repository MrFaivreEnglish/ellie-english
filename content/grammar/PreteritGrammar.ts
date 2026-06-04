const PreteritGrammar = {
  id: '3',
  title: 'Prétérit',
  description: 'Learn how to use the past simple tense',
  imageUrl: 'https://i.ibb.co/7hwDYYS/Pr-t-rit-simple.png',
  translateExercises: [
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Hier, je suis allé au parc.",
    answer: "Yesterday, I went to the park.",
    wordBank: ["Yesterday,", "I", "went", "to", "the park."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Elle a mangé son déjeuner à midi.",
    answer: "She ate her lunch at noon.",
    wordBank: ["She", "ate", "her lunch", "at", "noon."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Ils ont joué au football le week-end dernier.",
    answer: "They played football last weekend.",
    wordBank: ["They", "played", "football", "last", "weekend."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Il a regardé le film hier soir.",
    answer: "He watched the movie last night.",
    wordBank: ["He", "watched", "the movie", "last", "night."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Nous avons habité à Paris l'été dernier.",
    answer: "We lived in Paris last summer.",
    wordBank: ["We", "lived", "in", "Paris", "last", "summer."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "La semaine dernière, elle a acheté une nouvelle voiture.",
    answer: "Last week, she bought a new car.",
    wordBank: ["Last", "week,", "she", "bought", "a new", "car."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Les enfants ont joué dans le jardin hier.",
    answer: "The children played in the garden yesterday.",
    wordBank: ["The children", "played", "in", "the garden", "yesterday."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "J'ai rendu visite à ma grand-mère le mois dernier.",
    answer: "I visited my grandmother last month.",
    wordBank: ["I", "visited", "my grandmother", "last", "month."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Ils ont pris l'avion pour Londres l'année dernière.",
    answer: "They flew to London last year.",
    wordBank: ["They", "flew", "to", "London", "last", "year."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Il a étudié l'anglais à l'école.",
    answer: "He studied English at school.",
    wordBank: ["He", "studied", "English", "at", "school."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Nous sommes allés à la plage l'été dernier.",
    answer: "We went to the beach last summer.",
    wordBank: ["We", "went", "to", "the beach", "last", "summer."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Elle portait une belle robe hier.",
    answer: "She wore a beautiful dress yesterday.",
    wordBank: ["She", "wore", "a beautiful", "dress", "yesterday."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "J'ai rencontré mon ami à la fête.",
    answer: "I met my friend at the party.",
    wordBank: ["I", "met", "my friend", "at", "the party."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Ils se sont bien amusés au concert.",
    answer: "They had a great time at the concert.",
    wordBank: ["They", "had", "a great", "time", "at", "the concert."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Il a lu le livre en un jour.",
    answer: "He read the book in one day.",
    wordBank: ["He", "read", "the book", "in", "one", "day."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Le chien a dormi toute la journée.",
    answer: "The dog slept all day.",
    wordBank: ["The dog", "slept", "all", "day."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Nous nous sommes bien amusés à la fête.",
    answer: "We had a great time at the party.",
    wordBank: ["We", "had", "a great", "time", "at", "the party."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Elle a perdu ses clés ce matin.",
    answer: "She lost her keys this morning.",
    wordBank: ["She", "lost", "her keys", "this morning."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Le professeur nous a raconté une histoire.",
    answer: "The teacher told us a story.",
    wordBank: ["The teacher", "told", "us", "a story."]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "J'ai fait mes devoirs hier soir.",
    answer: "I did my homework last night.",
    wordBank: ["I", "did", "my homework", "last", "night."]
  }
],

  exercises: [
    { question: "Yesterday, I ___ to the park. (go)", answer: "went", options: ["go", "gone", "went", "going"] },
    { question: "She ___ her lunch at noon. (eat)", answer: "ate", options: ["eat", "ate", "eaten", "eating"] },
    { question: "They ___ football last weekend. (play)", answer: "played", options: ["play", "played", "playing", "plays"] },
    { question: "He ___ the movie last night. (watch)", answer: "watched", options: ["watch", "watched", "watching", "watches"] },
    { question: "We ___ in Paris last summer. (live)", answer: "lived", options: ["live", "lived", "living", "lives"] },
    { question: "Last week, she ___ a new car. (buy)", answer: "bought", options: ["buy", "bought", "buyed", "buying"] },
    { question: "The children ___ in the garden yesterday. (play)", answer: "played", options: ["play", "played", "playing", "plays"] },
    { question: "I ___ my grandmother last month. (visit)", answer: "visited", options: ["visit", "visited", "visiting", "visits"] },
    { question: "They ___ to London last year. (fly)", answer: "flew", options: ["fly", "flew", "flown", "flying"] },
    { question: "He ___ English at school. (study)", answer: "studied", options: ["study", "studied", "studying", "studies"] },
    { question: "We ___ to the beach last summer. (go)", answer: "went", options: ["go", "went", "gone", "going"] },
    { question: "She ___ a beautiful dress yesterday. (wear)", answer: "wore", options: ["wear", "wore", "worn", "wearing"] },
    { question: "I ___ my friend at the party. (meet)", answer: "met", options: ["meet", "met", "meeting", "meets"] },
    { question: "They ___ a great time at the concert. (have)", answer: "had", options: ["have", "had", "having", "has"] },
    { question: "He ___ the book in one day. (read)", answer: "read", options: ["read", "reads", "reading", "readed"] },
    { question: "The dog ___ all day. (sleep)", answer: "slept", options: ["sleep", "slept", "sleeping", "sleeps"] },
    { question: "We ___ a great time at the party. (have)", answer: "had", options: ["have", "had", "having", "has"] },
    { question: "She ___ her keys this morning. (lose)", answer: "lost", options: ["lose", "lost", "losing", "loses"] },
    { question: "The teacher ___ us a story. (tell)", answer: "told", options: ["tell", "told", "telling", "tells"] },
    { question: "I ___ my homework last night. (do)", answer: "did", options: ["do", "did", "doing", "does"] },
    { question: "They ___ late to class. (arrive)", answer: "arrived", options: ["arrive", "arrived", "arriving", "arrives"] },
    { question: "He ___ his bike yesterday. (ride)", answer: "rode", options: ["ride", "rode", "ridden", "riding"] },
    { question: "We ___ dinner at 7pm. (eat)", answer: "ate", options: ["eat", "ate", "eaten", "eating"] },
    { question: "She ___ her essay last week. (write)", answer: "wrote", options: ["write", "wrote", "written", "writing"] },
    { question: "They ___ to music all night. (listen)", answer: "listened", options: ["listen", "listened", "listening", "listens"] },
    { question: "Yesterday, I ___ at home. (be)", answer: "was", options: ["is", "was", "are", "were"] },
    { question: "Last week, they ___ at school. (be)", answer: "were", options: ["is", "was", "are", "were"] },
    { question: "She ___ happy yesterday. (be)", answer: "was", options: ["is", "was", "are", "were"] },
    { question: "We ___ late for class. (be)", answer: "were", options: ["is", "was", "are", "were"] },
    { question: "He ___ my friend last year. (be)", answer: "was", options: ["is", "was", "are", "were"] },
    { question: "The dogs ___ noisy last night. (be)", answer: "were", options: ["is", "was", "are", "were"] },
    { question: "It ___ cold yesterday. (be)", answer: "was", options: ["is", "was", "are", "were"] },
    { question: "You ___ at the party. (be)", answer: "were", options: ["is", "was", "are", "were"] },
    { question: "The shop ___ closed yesterday. (be)", answer: "was", options: ["is", "was", "are", "were"] },
    { question: "My parents ___ tired last night. (be)", answer: "were", options: ["is", "was", "are", "were"] }
  ]
};

export default PreteritGrammar;
