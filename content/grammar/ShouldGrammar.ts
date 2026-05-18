const ShouldGrammar = {
  id: '10',
  title: 'Should',
  description: 'Learn how to use the modal verb should - Evaluate if these sentences are grammatically correct',  imageUrl: 'https://i.ibb.co/7tN4Cfgb/Should.png',
translateExercises: [
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Tu devrais manger plus de fruits.",
    answer: "You should eat more fruit.",
    wordBank: ["You", "should", "eat", "more", "fruit.", "eats", "must"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Ils devraient arriver à l'heure.",
    answer: "They should arrive on time.",
    wordBank: ["They", "should", "arrive", "on", "time.", "arrives", "must"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Les élèves devraient être calmes.",
    answer: "The students should be quiet.",
    wordBank: ["The", "students", "should", "be", "quiet.", "are", "must"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Les parents devraient lire tous les jours.",
    answer: "Parents should read every day.",
    wordBank: ["Parents", "should", "read", "every", "day.", "reads", "must"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "L'entreprise devrait aider les employés.",
    answer: "The company should help the workers.",
    wordBank: ["The", "company", "should", "help", "the", "workers.", "helps", "must"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Le responsable devrait écouter.",
    answer: "The manager should listen.",
    wordBank: ["The", "manager", "should", "listen.", "listens", "must"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Tout le monde devrait se laver les mains.",
    answer: "Everyone should wash their hands.",
    wordBank: ["Everyone", "should", "wash", "their", "hands.", "washes", "must"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Les élèves devraient suivre les règles.",
    answer: "The students should follow the rules.",
    wordBank: ["The", "students", "should", "follow", "the", "rules.", "follows", "must"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Tu devrais dormir maintenant.",
    answer: "You should sleep now.",
    wordBank: ["You", "should", "sleep", "now.", "sleeps", "must"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Il devrait boire de l'eau.",
    answer: "He should drink water.",
    wordBank: ["He", "should", "drink", "water.", "drinks", "must"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Nous devrions partir bientôt.",
    answer: "We should leave soon.",
    wordBank: ["We", "should", "leave", "soon.", "leaves", "must"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Elle devrait appeler sa mère.",
    answer: "She should call her mother.",
    wordBank: ["She", "should", "call", "her", "mother.", "calls", "must"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Il devrait travailler maintenant.",
    answer: "He should work now.",
    wordBank: ["He", "should", "work", "now.", "works", "must"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Elle devrait être à l'école.",
    answer: "She should be at school.",
    wordBank: ["She", "should", "be", "at", "school.", "is", "must"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Ils devraient rentrer à la maison.",
    answer: "They should go home.",
    wordBank: ["They", "should", "go", "home.", "goes", "must"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Tu devrais écouter le professeur.",
    answer: "You should listen to the teacher.",
    wordBank: ["You", "should", "listen", "to", "the", "teacher.", "listens", "must"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Nous devrions aider nos amis.",
    answer: "We should help our friends.",
    wordBank: ["We", "should", "help", "our", "friends.", "helps", "must"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Elle devrait lire ce livre.",
    answer: "She should read this book.",
    wordBank: ["She", "should", "read", "this", "book.", "reads", "must"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Il devrait fermer la porte.",
    answer: "He should close the door.",
    wordBank: ["He", "should", "close", "the", "door.", "closes", "must"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Ils devraient jouer dehors.",
    answer: "They should play outside.",
    wordBank: ["They", "should", "play", "outside.", "plays", "must"]
  }
],

  exercises: [
    { question: "Students should to study harder for exams.", answer: false, explanation: "Incorrect: 'Should' should not be followed by 'to'. Correct: 'Students should study...'" },
    { question: "You should eat more vegetables and fruits.", answer: true, explanation: "Correct: 'Should' is properly followed by the base form of the verb" },
    { question: "We should helping our neighbors whenever possible.", answer: false, explanation: "Incorrect: After 'should' use base form, not -ing. Correct: 'should help'" },
    { question: "They should arrive at the meeting on time.", answer: true, explanation: "Correct: 'Should' is followed by the base form of the verb" },
    { question: "She should practicing piano every day.", answer: false, explanation: "Incorrect: After 'should' use base form. Correct: 'should practice'" },
    { question: "The students should be quiet in the library.", answer: true, explanation: "Correct: 'Should' is properly used with 'be'" },
    { question: "He should to go to the doctor soon.", answer: false, explanation: "Incorrect: 'Should' should not be followed by 'to'. Correct: 'should go'" },
    { question: "You should gets more sleep at night.", answer: false, explanation: "Incorrect: After 'should' use base form. Correct: 'should get'" },
    { question: "Parents should read to their children every day.", answer: true, explanation: "Correct: 'Should' is followed by the base form of the verb" },
    { question: "We should drinking more water.", answer: false, explanation: "Incorrect: After 'should' use base form. Correct: 'should drink'" },
    { question: "They should have finished the project yesterday.", answer: true, explanation: "Correct: Proper use of 'should have' + past participle" },
    { question: "She should speaks more clearly.", answer: false, explanation: "Incorrect: After 'should' use base form without 's'. Correct: 'should speak'" },
    { question: "I should been more careful.", answer: false, explanation: "Incorrect: Missing 'have' after 'should'. Correct: 'should have been'" },
    { question: "The company should provide better training.", answer: true, explanation: "Correct: 'Should' is properly used with the base form of the verb" },
    { question: "You should to listening to the teacher.", answer: false, explanation: "Incorrect: Double error - 'to' and -ing form. Correct: 'should listen'" },
    { question: "They should be studying for their test.", answer: true, explanation: "Correct: Proper use of 'should be' + -ing form" },
    { question: "He should taking the medicine regularly.", answer: false, explanation: "Incorrect: Missing 'be' after 'should'. Correct: 'should be taking' or 'should take'" },
    { question: "We should has completed this by now.", answer: false, explanation: "Incorrect: After 'should' use 'have', not 'has'. Correct: 'should have completed'" },
    { question: "The manager should consider all options.", answer: true, explanation: "Correct: 'Should' is properly followed by the base form of the verb" },
    { question: "You should brought your umbrella.", answer: false, explanation: "Incorrect: Missing 'have' after 'should'. Correct: 'should have brought'" },
    { question: "Everyone should wash their hands regularly.", answer: true, explanation: "Correct: 'Should' is properly used with the base form of the verb" },
    { question: "She should have been here by now.", answer: true, explanation: "Correct: Proper use of 'should have' + been" },
    { question: "They should working harder.", answer: false, explanation: "Incorrect: Missing 'be' after 'should'. Correct: 'should be working'" },
    { question: "We should to be more careful.", answer: false, explanation: "Incorrect: 'Should' should not be followed by 'to'. Correct: 'should be'" },
    { question: "The students should follow the rules.", answer: true, explanation: "Correct: 'Should' is properly used with the base form of the verb" }
  ]
};

export default ShouldGrammar;
