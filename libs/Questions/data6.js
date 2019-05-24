module.exports = [
  {
    question: "Put these botcampers in age order",
    roundinfo: "old news",
    cards: [
      { text: "Aiden", order: 4 },
      { text: "Kathryn", order: 1 },
      { text: "Brendan", order: 2 },
      { text: "Stewart", order: 3 }
    ],
    instruction: ["Oldest", "Youngest"],
    questionType: "order"
  },

  {
    question: "Whos birthday is soonest",
    roundinfo: "Sing it, baby",
    cards: [
      { text: "Ben", order: 1 },
      { text: "Brendan", order: 2 },
      { text: "Kim", order: 3 },
      { text: "Wasim", order: 4 }
    ],
    instruction: ["soonest", "least soon"],
    questionType: "order"
  },

  {
    question:
      "Put your phones together to figure out what this image is, then type the answer in the text box",
    roundinfo: "Jigsaw pictionary, anyone?",
    cards: [
      { url: "https://i.imgur.com/2kKRCfA.jpg" },
      { url: "https://i.imgur.com/OlVIh9Q.jpg" },
      { url: "https://i.imgur.com/9xf086M.jpg?1" },
      { url: "https://i.imgur.com/YfC9trH.jpg" }
    ],
    answer: "DOG",
    questionType: "picture"
  },

  {
    question: "Which is fastest?",
    roundinfo: "run, baby, run",
    cards: [
      { text: "70 km per hour", order: 1 },
      { text: "55  miles per hour", order: 2 },
      { text: "100 knots", order: 3 },
      { text: "1 lightyear", order: 4 }
    ],
    instruction: ["slowest", "fastest"],
    questionType: "order"
  },

  {
    question:
      "Put your phones together to figure out what this image is, then type the answer in the text box",
    roundinfo: "I can't see, it's so dark in here!",
    cards: [
      { url: "https://i.imgur.com/jsorCzo.jpg" },
      { url: "https://i.imgur.com/PowPXCp.jpg" },
      { url: "https://i.imgur.com/gS0LOYY.jpg" },
      { url: "https://i.imgur.com/naLAgDX.jpg" }
    ],
    answer: "HARRY POTTER"
  },

  {
    question: "Order these UK counties by their populations",
    roundinfo: "Oi, get outta my way!",
    cards: [
      { text: "West Midlands", order: 1 },
      { text: "Greater Manchester", order: 2 },
      { text: "Merseyside", order: 3 },
      { text: "South Yorkshire", order: 4 }
    ],
    instruction: ["fewest people", "most people"],
    questionType: "order"
  },

  {
    question: "List the Top 5 Family Cars of the 1950s",
    roundinfo: "Beep! Beep! Toot! Toot!",
    cards: [
      { text: "Morris Minor", order: 1 },
      { text: "Standar Vanguard", order: 2 },
      { text: "Ford Popular and Anglia", order: 3 },
      { text: "Vauxhall PA Velox and Cresta", order: 4 }
    ],
    instruction: ["most sold", "fewest sold"],
    questionType: "order"
  },

  {
    question: "what is this a picture of?",
    roundinfo: "I spy with my little eye...",
    cards: [
      { url: "https://i.imgur.com/EDKgovy.png" },
      { url: "https://i.imgur.com/QgVov93.png" },
      { url: "https://i.imgur.com/UcMoyhn.png" },
      { url: "https://i.imgur.com/dDN8mQS.png" }
    ],
    answer: "ROBOT",
    questionType: "picture"
  },

  {
    question: "Who is the most timely bootcamper, and who shows up late?",
    roundinfo: "Class starts at 9 sharp!",
    cards: [
      { text: "Jonny", order: 1 },
      { text: "Olivia", order: 2 },
      { text: "Wasim", order: 3 },
      { text: "Jazz", order: 4 }
    ],
    instruction: ["earliest to class", "latest to class"],
    questionType: "order"
  }
];
