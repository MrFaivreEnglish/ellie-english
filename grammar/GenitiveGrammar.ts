const GenitiveGrammar = {
  id: '44',
  title: 'Le génitif',
  description: 'Use of the genitive (possessive) in English: "\'s" and "of" constructions',
  imageUrl: 'https://i.ibb.co/sJt3XjB8/G-nitif.png',
  exercises: [
    { question: "John is father's Tom.", answer: false, explanation: "Wrong order; say: John is Tom's father." },
    { question: "Albert's dog is happy.", answer: true, explanation: "Correct — shows possession." },
    { question: "Sara's book is red.", answer: true, explanation: "Correct — Sara owns the book." },
    { question: "The book Sara is red.", answer: false, explanation: "Wrong order; say: Sara's book is red." },
    { question: "My mother's hat is new.", answer: true, explanation: "Correct — mother's shows possession." },
    { question: "My mother hat is new.", answer: false, explanation: "Missing 's; say: my mother's hat." },
    { question: "The cat's tail is long.", answer: true, explanation: "Correct — cat's shows possession." },
    { question: "The tail cat is long.", answer: false, explanation: "Wrong order; say: The cat's tail is long." },
    { question: "Tom's car is blue.", answer: true, explanation: "Correct — Tom owns the car." },
    { question: "Tom car is blue.", answer: false, explanation: "Missing 's; say: Tom's car is blue." },
    { question: "Anna's pen is black.", answer: true, explanation: "Correct — Anna owns the pen." },
    { question: "Anna pen is black.", answer: false, explanation: "Missing 's; say: Anna's pen is black." },
    { question: "The boys' ball is lost.", answer: true, explanation: "Correct — plural possessive for boys." },
    { question: "The boys's ball is lost.", answer: false, explanation: "Wrong apostrophe; use boys'." },
    { question: "The girl's name is May.", answer: true, explanation: "Correct — girl's shows one girl's name." },
    { question: "The girls' name is May.", answer: false, explanation: "Use girl's for one girl; girls' is plural." },
    { question: "Dad's car is new.", answer: true, explanation: "Correct — Dad's shows possession." },
    { question: "Dads car is new.", answer: false, explanation: "Missing apostrophe; say: Dad's car." },
    { question: "My friend's house is big.", answer: true, explanation: "Correct — friend's shows one friend." },
    { question: "My friends house is big.", answer: false, explanation: "Missing apostrophe; say: my friend's house." },
    { question: "The baby's toy is small.", answer: true, explanation: "Correct — baby's shows possession." },
    { question: "The baby toy is small.", answer: false, explanation: "Missing 's; say: The baby's toy." },
    { question: "The teacher's bag is black.", answer: true, explanation: "Correct — teacher's shows possession." },
    { question: "The teachers bag is black.", answer: false, explanation: "Missing apostrophe; say: The teacher's bag." },
    { question: "The dog's bed is soft.", answer: true, explanation: "Correct — dog's shows possession." }
  ]
};

export default GenitiveGrammar;