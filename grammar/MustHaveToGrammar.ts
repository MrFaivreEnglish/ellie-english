const MustHaveToGrammar = {
  id: '27',
  title: 'Must et Have to',
  description: 'Comprendre la différence entre must et have to',
  imageUrl: 'https://i.ibb.co/CxF44qn/Must-et-have-to.png',
  exercises: [
    { question: 'You must stop.', answer: true, explanation: "Correct: 'must' + base verb for obligation." },
    { question: 'I have to go.', answer: true, explanation: "Correct: 'have to' + base verb for necessity." },
    { question: 'She must be quiet.', answer: true, explanation: "Correct: 'must' + base verb." },
    { question: 'We have to eat now.', answer: true, explanation: "Correct: 'have to' + base verb." },
    { question: 'He must wear a hat.', answer: true, explanation: "Correct: 'must' + base verb." },
    { question: 'They have to wait.', answer: true, explanation: "Correct: 'have to' + base verb." },
    { question: 'I must study.', answer: true, explanation: "Correct: 'must' + base verb." },
    { question: 'Tom has to work.', answer: true, explanation: "Correct: third person 'has to' + base verb." },
    { question: 'You must call.', answer: true, explanation: "Correct: 'must' + base verb." },
    { question: 'She has to sleep.', answer: true, explanation: "Correct: 'has to' + base verb." },
    { question: 'We must listen.', answer: true, explanation: "Correct: 'must' + base verb." },
    { question: 'I have to clean.', answer: true, explanation: "Correct: 'have to' + base verb." },
    { question: 'They must hurry.', answer: true, explanation: "Correct: 'must' + base verb." },
    { question: 'Dad has to cook.', answer: true, explanation: "Correct: 'has to' + base verb." },
    { question: 'Kids have to go to bed.', answer: true, explanation: "Correct: 'have to' + base verb." },

    { question: 'You must to leave.', answer: false, explanation: "Incorrect: do not use 'to' after 'must'." },
    { question: 'I have to going.', answer: false, explanation: "Incorrect: use base verb after 'have to'." },
    { question: 'She musts run.', answer: false, explanation: "Incorrect: 'must' has no -s in third person." },
    { question: 'We has to eat.', answer: false, explanation: "Incorrect: use 'have to' with 'we'." },
    { question: 'He musts be quiet.', answer: false, explanation: "Incorrect: 'must' has no -s." },
    { question: 'They have eats.', answer: false, explanation: "Incorrect: use base verb after 'have to'." },
    { question: 'I must to study.', answer: false, explanation: "Incorrect: drop 'to' after 'must'." },
    { question: 'Tom have to work.', answer: false, explanation: "Incorrect: use 'has to' for third person." },
    { question: 'You have to called.', answer: false, explanation: "Incorrect: use base verb after 'have to'." },
    { question: 'She must be quieting.', answer: false, explanation: "Incorrect: use base verb after modal 'must'." },
    { question: 'We musts listen.', answer: false, explanation: "Incorrect: 'must' has no -s." },
    { question: 'I have clean.', answer: false, explanation: "Incorrect: use 'have to' + base verb." },
    { question: 'They musted hurry.', answer: false, explanation: "Incorrect: 'must' does not take -ed." },
    { question: 'Dad have to cook.', answer: false, explanation: "Incorrect: use 'has to' for third person.'" },
    { question: 'Kids must to go to bed.', answer: false, explanation: "Incorrect: drop 'to' after 'must'." }
  ]
};

export default MustHaveToGrammar;