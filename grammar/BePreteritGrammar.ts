const BePreteritGrammar = {
  id: 'BePreterit',
  title: 'Be au prétérit',
  description: 'Questions au prétérit avec le verbe "to be" — complétez avec was / were.',
  imageUrl: 'https://i.ibb.co/PZMtd9vN/Pr-t-rit-1.png',
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

    // Interrogatives: students must pick both was/were and the correct word order.
    { question: "___ at the party yesterday?", answer: "Was he", options: ["Was he", "Were he", "He was", "He were"] },
    { question: "___ in the garden this morning?", answer: "Were they", options: ["Was they", "Were they", "They was", "They were"] },
    { question: "___ the manager then?", answer: "Was he", options: ["Was he", "Were he", "He was", "He were"] },
    { question: "___ at home on Sunday?", answer: "Were you", options: ["Was you", "Were you", "You was", "You were"] },
    { question: "___ born in France?", answer: "Was she", options: ["Was she", "Were she", "She was", "She were"] },
    { question: "___ on the bus when it started?", answer: "Were you", options: ["Was you", "Were you", "You was", "You were"] },
    { question: "___ ready on time?", answer: "Was it", options: ["Was it", "Were it", "It was", "It were"] },
    { question: "___ at the cinema last night?", answer: "Were they", options: ["Was they", "Were they", "They was", "They were"] },
    // Interrogative negatives (contracted)
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