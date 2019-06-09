module.exports = [
	{
		question:
			"List these supermarkets according to their percentage share of the UK grocery market.  Order from the highest percentage share to the lowest percentage share.",
		roundinfo: "Trolly dash madness!",
		cards: [
			{ text: "Lidl", order: 4 },
			{ text: "Aldi", order: 2 },
			{ text: "Waitrose", order: 3 },
			{ text: "Sainsburys", order: 1 }
		],
		instruction: ["Highest Market Share", "Lowest Market Share"],
		questionType: "order"
	},

	{
		question:
			"On a typical crime fighting day, order these superheroes by the number of items of clothing they wear.  Start with the lowest number of items worn.",
		roundinfo: "It's a bit chilly out, you'll need a jumper!",
		cards: [
			{ text: "Hulk", order: 1 },
			{ text: "Spiderman", order: 2 },
			{ text: "Wonder Woman", order: 3 },
			{ text: "Batman", order: 1 }
		],
		instruction: ["Least Clothing", "Most Clothing"],
		questionType: "order"
	},
	{
		question: "What is this persons first name?",
		roundinfo: "Jigsaw Pictionary",
		cards: [
			{ url: "https://i.imgur.com/2vVvmOz.jpg" },
			{ url: "https://i.imgur.com/UlM1UEh.jpg" },
			{ url: "https://i.imgur.com/yG5Z7KJ.jpg" },
			{ url: "https://i.imgur.com/VC91LQp.jpg" }
		],
		answer: "ALEX",
		answerURL:
			"https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&w=1000&q=80",
		questionType: "picture"
	},

	{
		question:
			"Order these top trending worldwide Google searches from 2018.  Begin with the least searched for.",
		roundinfo: "Just Google it!",
		cards: [
			{ text: "World Cup", order: 4 },
			{ text: "Hurricane Florence", order: 3 },
			{ text: "Stan Lee", order: 1 },
			{ text: "Black panther", order: 2 }
		],
		instruction: ["Least Searches", "Most Searches"],
		questionType: "order"
	},
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
		question: "What is this person's first name?",
		roundinfo: "Jigtionary... Y Not?",
		cards: [
			{ url: "https://i.imgur.com/jsorCzo.jpg" },
			{ url: "https://i.imgur.com/PowPXCp.jpg" },
			{ url: "https://i.imgur.com/gS0LOYY.jpg" },
			{ url: "https://i.imgur.com/naLAgDX.jpg" }
		],
		answer: "HARRY",
		answerURL:
			"https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&w=1000&q=80",
		questionType: "picture"
	},
	{
		question:
			"Arrange these Household Tenures according to thier percentage market share.  Begin with the lowest market share.",
		roundinfo: "Wherever I lay may hat...",
		cards: [
			{ text: "Social Rented", order: 1 },
			{ text: "Private Rented", order: 2 },
			{ text: "Morgage", order: 3 },
			{ text: "Owned Outright", order: 4 }
		],
		instruction: ["Lowest Market Share", "Highest Market Share"],
		questionType: "order"
	},
	{
		question:
			"Solve these mathematical problems, and order the answers from lowest to highest.",
		roundinfo: "KS2 Arithmatic Test",
		cards: [
			{ text: "2(10+80)", order: 3 },
			{ text: "4 Cubed", order: 1 },
			{ text: "9 X 14", order: 2 },
			{ text: "521 - 299", order: 4 }
		],
		instruction: ["Lowest Value", "Highest Value"],
		questionType: "order"
	}
];
