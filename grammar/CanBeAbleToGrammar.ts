const CanBeAbleToGrammar = {
  id: '31',
  title: 'Can & Be Able To',
  description: 'Express ability in present and past using can, be able to, could, and was able to',
  imageUrl: 'https://i.ibb.co/Hpnvgjv9/can-et-be-able-to.png',
  exercises: [
    { question: 'I can swim.', answer: true, explanation: "Correct: 'can' + base verb." },
    { question: 'He can sing.', answer: true, explanation: "Correct: 'can' + base verb." },
    { question: 'She can read.', answer: true, explanation: "Correct: 'can' + base verb." },
    { question: 'They can play.', answer: true, explanation: "Correct: 'can' + base verb." },
    { question: 'We can cook.', answer: true, explanation: "Correct: 'can' + base verb." },
    { question: 'You can help.', answer: true, explanation: "Correct: 'can' + base verb." },
    { question: 'My cat can jump.', answer: true, explanation: "Correct: 'can' + base verb." },
    { question: 'Dad is able to fix it.', answer: true, explanation: "Correct: 'is able to' + base verb." },
    { question: 'The children are able to climb.', answer: true, explanation: "Correct: 'are able to' + base verb." },
    { question: 'I am able to carry it.', answer: true, explanation: "Correct: 'am able to' + base verb." },
    { question: 'She is able to start.', answer: true, explanation: "Correct: 'is able to' + base verb." },
    { question: 'Bob can draw.', answer: true, explanation: "Correct: 'can' + base verb." },
    { question: 'The dog is able to learn tricks.', answer: true, explanation: "Correct: 'is able to' + base verb." },
    { question: 'Anna can count.', answer: true, explanation: "Correct: 'can' + base verb." },
    { question: 'Tom is able to open the door.', answer: true, explanation: "Correct: 'is able to' + base verb." },

    { question: 'I can to dance.', answer: false, explanation: "Incorrect: do not use 'to' after 'can'." },
    { question: 'She cans write.', answer: false, explanation: "Incorrect: 'can' has no -s." },
    { question: 'They caned lift.', answer: false, explanation: "Incorrect: 'can' does not take -ed." },
    { question: 'We are able dance.', answer: false, explanation: "Incorrect: need 'to' after 'able'." },
    { question: 'You can running.', answer: false, explanation: "Incorrect: use base verb, not -ing after 'can'." },
    { question: 'My sister is able to sings.', answer: false, explanation: "Incorrect: use base verb after 'to'." },
    { question: 'Mark canes drive.', answer: false, explanation: "Incorrect: 'can' has no -es." },
    { question: 'Grandma able to eat.', answer: false, explanation: "Incorrect: missing auxiliary 'is'." },
    { question: 'Kids is able to sleep.', answer: false, explanation: "Incorrect: subject-verb agreement error with 'is'." },
    { question: 'I am able to lifts it.', answer: false, explanation: "Incorrect: use base verb after 'to'." },
    { question: 'She able to walk.', answer: false, explanation: "Incorrect: missing auxiliary 'is'." },
    { question: 'Sam can to speak.', answer: false, explanation: "Incorrect: drop 'to' after 'can'." },
    { question: 'They able see.', answer: false, explanation: "Incorrect: missing 'to' and auxiliary 'are'." },
    { question: 'Peter can cooking.', answer: false, explanation: "Incorrect: use base verb after 'can', not -ing." },
    { question: 'Lucy is able open.', answer: false, explanation: "Incorrect: need 'to' after 'able'." }
  ]
};

export default CanBeAbleToGrammar;