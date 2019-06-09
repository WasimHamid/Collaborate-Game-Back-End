const Room = require("./index");
let teamColors = ["dodgerblue", "Fuchsia", "palegoldenrod", "lime"];
const testQuestions = require("../Questions/presentation");

let newRoom;

describe("Room Methods", () => {
	beforeEach(() => {
		newRoom = new Room(1234, "uniqueId");
		newRoom.makeTheTeams(4);
	});

	afterEach(() => {
		newRoom = null;
	});

	it("should be instance of class", () => {
		// const actual = new Room(3, 1234, "imauniqueuid123");
		expect(newRoom instanceof Room).toBe(true);
	});

	it("should have the number of teams given in", () => {
		const expected = 2;
		const testRoom = new Room(1234, "imauniqueuid123");
		testRoom.makeTheTeams(expected);
		expect(testRoom.teamsArray.length).toBe(expected);
	});

	it("should add player to team", () => {
		newRoom.addPlayerToTeam(teamColors[0], "ben", "imauniqueuid123");
		expect(newRoom.teams[teamColors[0]].length).toBe(1);
	});

	it("should add specific player to team", () => {
		const name = "ben";
		const id = "playerUnique";
		const newRoom = new Room(1234, "imauniqueuid123");
		newRoom.makeTheTeams(1);
		newRoom.addPlayerToTeam(teamColors[0], { name, id });
		expect(newRoom.teams[teamColors[0]][0]).toEqual({ id, name });
	});

	it("should return true if player in players array", () => {
		const name = "ben";
		const id = "playerUnique";
		const newRoom = new Room(1234, "imauniqueuid123");
		newRoom.makeTheTeams(1);
		newRoom.players.push({ name, id });
		expect(newRoom.isPlayerInPlayersArray(id)).toBe(true);
	});

	it("should return false if player not in room", () => {
		const name = "ben";
		const id = "playerUnique";
		newRoom.addPlayerToTeam(teamColors[0], name, id);
		expect(newRoom.isPlayerInRoom("nottherightid")).toBe(false);
	});

	it("should return the team a player is on", () => {
		const name = "ben";
		const id = "playerUnique";
		const team = teamColors[2];
		newRoom.addPlayerToTeam(team, { name, id });
		expect(newRoom.getPlayersTeam("playerUnique")).toBe(team);
	});

	it("should add one to question number every time called", () => {
		let numberOfQuestions = 9;
		for (let i = 0; i < numberOfQuestions; i++) {
			newRoom.addToQuestionNumber();
		}
		expect(newRoom.questionNumber).toEqual(numberOfQuestions);
	});

	it("should add given number to score", () => {
		const expectedScore = 100;
		const team = teamColors[0];
		newRoom.addToCurrentScore(team, expectedScore);
		expect(newRoom.getCurrentScore(team)).toEqual(expectedScore);
	});
	it("should add that score to the scores array", () => {
		const expectedScore = 100;
		const team = teamColors[0];
		newRoom.addToCurrentScore(team, expectedScore);
		newRoom.addCurrentScoresToScoresArray();
		expect(newRoom.scoresArray[team][0].score).toEqual(expectedScore);
	});

	it("should add the total points in scores array to scores", () => {
		const expectedScore = 100;
		const team = teamColors[0];
		newRoom.addToCurrentScore(team, expectedScore);
		newRoom.addCurrentScoresToScoresArray();
		newRoom.addScoresArrayTotalToScore();
		expect(newRoom.scoresTotal[team]).toEqual(expectedScore);
	});

	it("should add the total points in scores array to scoresTotal with one function", () => {
		const expectedScore = 100;
		const team = teamColors[0];
		newRoom.addToCurrentScore(team, expectedScore);
		newRoom.updateScoresAtEndOfRound();
		expect(newRoom.scoresTotal[team]).toEqual(expectedScore);
	});

	it("capitalise strings when inputed as answer", () => {
		const expected = "BEN";
		const team = teamColors[0];
		newRoom.updatePictureAnswerStrings(team, "ben");
		expect(newRoom.pictureAnswerStrings[team]).toBe(expected);
	});

	it("capitalise strings when inputed as answer", () => {
		const team = teamColors[0];
		newRoom.updatePictureAnswerStrings(team, "ben");
		expect(newRoom.pictureAnswerStrings[team] === "poo").toBe(false);
	});

	it("should push teams to array", () => {
		let testNumber = 3;
		for (let i = 0; i < testNumber; i++) {
			newRoom.teamsThatHaveSubmitted.push("team");
		}
		expect(newRoom.teamsThatHaveSubmitted.length).toEqual(testNumber);
	});

	it("should teams that have sumbitted reset At Beggining O Round", () => {
		newRoom.teamsThatHaveSubmitted.push("team");
		newRoom.teamsThatHaveSubmitted.push("team");
		newRoom.teamsThatHaveSubmitted.push("team");
		newRoom.resetAtBegginingOfRound();
		expect(newRoom.teamsThatHaveSubmitted.length).toEqual(0);
	});

	it("should add cards to cards", () => {
		let testCards = testQuestions[0].cards;
		newRoom.keepReferenceOfCurrentCards(testCards);

		expect(newRoom.currentQuestionCards).toEqual(testCards);
	});
	it("should clear cards at end of round", () => {
		let testCards = testQuestions[0].cards;
		newRoom.keepReferenceOfCurrentCards(testCards);
		newRoom.resetAtBegginingOfRound();

		expect(newRoom.currentQuestionCards).toEqual([]);
	});

	it("should return true if player is in players array", () => {
		newRoom.players.push({ id: "1234", name: "ben" });
		expect(newRoom.isPlayerInPlayersArray("1234")).toBe(true);
	});

	it("should return false if player is not in players array", () => {
		newRoom.players.push({ id: "1234", name: "ben" });
		expect(newRoom.isPlayerInPlayersArray("5678")).toBe(false);
	});
	it("should add to answer feedack array", () => {
		let testCards = testQuestions[0].cards;
		newRoom.keepReferenceOfCurrentCards(testCards);
		newRoom.markOrderQuestion(teamColors[0]);
		console.log("answer feedback", newRoom.answerFeedback[teamColors[0]]);
		expect(newRoom.answerFeedback[teamColors[0]].length).toBe(4);
	});
	it("should clear answer feedack array", () => {
		let testCards = testQuestions[0].cards;
		newRoom.keepReferenceOfCurrentCards(testCards);
		newRoom.markOrderQuestion(teamColors[0]);
		newRoom.resetAtBegginingOfRound();
		console.log(
			"answer feedback cleared",
			newRoom.answerFeedback[teamColors[0]]
		);
		expect(newRoom.answerFeedback[teamColors[0]].length).toBe(0);
	});
});

// describe("label", () => {
//   it("should", () => {
//     const expected = 0;
//     const actual = 0;
//     expect(expected).toBe(actual);
//   });
// });
