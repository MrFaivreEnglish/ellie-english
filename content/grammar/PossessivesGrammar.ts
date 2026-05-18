const PossessivesGrammar = {
  id: '42',
  title: 'Les pronoms possessifs',
  description: 'Use possessive adjectives and possessive pronouns (my, your, his, hers, mine, yours)',
  imageUrl: 'https://i.ibb.co/zhsFKsfS/Possessifs.png',
translateExercises: [
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "C'est mon chat.",
    answer: "This is my cat.",
    wordBank: ["This", "is", "my", "cat.", "mine"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Il a son ballon.",
    answer: "He has his ball.",
    wordBank: ["He", "has", "his", "ball.", "her"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Elle a son sac.",
    answer: "She has her bag.",
    wordBank: ["She", "has", "her", "bag.", "his"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Est-ce ton chien ?",
    answer: "Is this your dog?",
    wordBank: ["Is", "this", "your", "dog?", "yours"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Nous aimons notre maison.",
    answer: "We like our house.",
    wordBank: ["We", "like", "our", "house.", "ours"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Il cherche son livre.",
    answer: "He is looking for his book.",
    wordBank: ["He", "is", "looking", "for", "his", "book.", "her"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Elle porte son chapeau.",
    answer: "She is wearing her hat.",
    wordBank: ["She", "is", "wearing", "her", "hat.", "his"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Ils cachent leurs bonbons.",
    answer: "They hide their candy.",
    wordBank: ["They", "hide", "their", "candy.", "theirs"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Mon chat mange mon gâteau.",
    answer: "My cat eats my cake.",
    wordBank: ["My", "cat", "eats", "my", "cake.", "mine"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Elle trouve sa clé.",
    answer: "She finds her key.",
    wordBank: ["She", "finds", "her", "key.", "his"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Il répare son vélo.",
    answer: "He fixes his bike.",
    wordBank: ["He", "fixes", "his", "bike.", "her"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Ton chien porte ton chapeau.",
    answer: "Your dog is wearing your hat.",
    wordBank: ["Your", "dog", "is", "wearing", "your", "hat.", "yours"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Notre chat mange notre pizza.",
    answer: "Our cat eats our pizza.",
    wordBank: ["Our", "cat", "eats", "our", "pizza.", "ours"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Leur chien aime leur balle.",
    answer: "Their dog likes their ball.",
    wordBank: ["Their", "dog", "likes", "their", "ball.", "theirs"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Il ouvre son sac.",
    answer: "He opens his bag.",
    wordBank: ["He", "opens", "his", "bag.", "her"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Elle lance sa balle.",
    answer: "She throws her ball.",
    wordBank: ["She", "throws", "her", "ball.", "his"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Je trouve mon stylo.",
    answer: "I find my pen.",
    wordBank: ["I", "find", "my", "pen.", "mine"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Tu perds ton sac.",
    answer: "You lose your bag.",
    wordBank: ["You", "lose", "your", "bag.", "yours"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Elle dessine sa maison.",
    answer: "She draws her house.",
    wordBank: ["She", "draws", "her", "house.", "his"]
  },
  {
    type: 'translate',
    question: 'Translate into English.',
    prompt: "Il nourrit son chien.",
    answer: "He feeds his dog.",
    wordBank: ["He", "feeds", "his", "dog.", "her"]
  }
],

  exercises: [
    { question: 'This is ___ book. (my/mine)', answer: 'my', options: ['my', 'mine', 'me'] },
    { question: 'The blue bag is ___. (hers/her)', answer: 'hers', options: ['hers', 'her', 'she'] },
    { question: 'Is this car ___? (yours/your)', answer: 'yours', options: ['your', 'yours', 'you'] },
    { question: 'He lost ___ keys. (his/him)', answer: 'his', options: ['his', 'him', 'he'] },
    { question: 'These shoes are ___. (mine/my)', answer: 'mine', options: ['mine', 'my', 'me'] },
    { question: 'She gave ___ mother a call. (her/hers)', answer: 'her', options: ['her', 'hers', 'she'] },
    { question: 'Is that ___ dog? (their/theirs)', answer: 'their', options: ['their', 'theirs', 'they'] },
    { question: 'The decision is ___. (yours/your)', answer: 'yours', options: ['your', 'yours', 'you'] },
    { question: 'This table is ___. (ours/our)', answer: 'ours', options: ['ours', 'our', 'we'] },
    { question: 'I want ___ pencil. (my/mine)', answer: 'my', options: ['my', 'mine', 'me'] },
    { question: 'Is this umbrella ___? (hers/her)', answer: 'hers', options: ['her', 'hers', 'she'] },
    { question: 'Those seats are ___. (theirs/their)', answer: 'theirs', options: ['theirs', 'their', 'they'] },
    { question: 'She called ___ sister. (her/hers)', answer: 'her', options: ['her', 'hers', 'she'] },
    { question: 'This is not ___ problem. (my/mine)', answer: 'my', options: ['my', 'mine', 'me'] },
    { question: 'The responsibility is ___. (yours/your)', answer: 'yours', options: ['your', 'yours', 'you'] },
    { question: 'I prefer ___ choice. (their/theirs)', answer: 'their', options: ['their', 'theirs', 'they'] },
    { question: 'That house is ___. (hers/her)', answer: 'hers', options: ['hers', 'her', 'she'] },
    { question: 'The cat is ___ (owner/owners).', answer: 'theirs', options: ['its', 'theirs', 'her'] },
    { question: 'This pen is ___. (mine/my)', answer: 'mine', options: ['mine', 'my', 'me'] },
    { question: 'Are these tickets ___? (your/yours)', answer: 'yours', options: ['your', 'yours', 'you'] },
    { question: 'He brought ___ laptop. (his/him)', answer: 'his', options: ['his', 'him', 'he'] },
    { question: 'The keys on the table are ___. (ours/our)', answer: 'ours', options: ['ours', 'our', 'we'] },
    { question: 'That coat is ___. (hers/her)', answer: 'hers', options: ['hers', 'her', 'she'] },
    { question: 'She said the victory was ___. (their/theirs)', answer: 'theirs', options: ['their', 'theirs', 'they'] },
    { question: 'Is this ___ book or mine?', answer: 'your', options: ['your', 'yours', 'you'] }
  ]
};

export default PossessivesGrammar;
