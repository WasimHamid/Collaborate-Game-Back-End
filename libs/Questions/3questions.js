module.exports = [
  {
    question:
      "Rearrange these words into a famous phrase from the Bruce Willis film, 'The Sixth Sense'.",
    roundinfo: "Aaaaahhh, what was that!",
    cards: [
      { text: "I", order: 1 },
      { text: "See", order: 2 },
      { text: "Dead", order: 3 },
      { text: "People", order: 4 }
    ],
    instruction: ["First Word", "Last Word"],
    questionType: "order"
  },
  {
    question: "What is the name of this flower?",
    roundinfo: "Jigsaw Pictionary",
    cards: [
      { url: "https://i.imgur.com/9SALG7e.png" },
      { url: "https://i.imgur.com/9SzWZo0.png" },
      { url: "https://i.imgur.com/RFbLipt.png" },
      { url: "https://i.imgur.com/ytoJUdD.png" }
    ],
    answer: "DAFFODIL",
    answerURL: "https://i.imgur.com/zgzidIf.jpg",
    questionType: "picture"
  },

  {
    question:
      "Order these superheroes by the number of items of clothing they wear on a typical crime fighting day. Start with the lowest number of items worn.",
    roundinfo: "It's a bit chilly out...",
    cards: [
      { text: "Hulk", order: 1 },
      { text: "Spiderman", order: 2 },
      { text: "Wonder Woman", order: 3 },
      { text: "Batman", order: 4 }
    ],
    instruction: ["Least Clothing", "Most Clothing"],
    questionType: "order"
  }
];
