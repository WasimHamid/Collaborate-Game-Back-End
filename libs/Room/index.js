let teamColors = ["dodgerblue", "Fuchsia", "palegoldenrod", "lime"];
let testQuestions = require("../../pictureRound");

// Polyfill for Array.flat()
if (!Array.prototype.flat) {
  Array.prototype.flat = function(depth) {
    var flattend = [];
    (function flat(array, depth) {
      for (let el of array) {
        if (Array.isArray(el) && depth > 0) {
          flat(el, depth - 1);
        } else {
          flattend.push(el);
        }
      }
    })(this, Math.floor(depth) || 1);
    return flattend;
  };
}

function Room(numberOfTeams, roomId, uid) {
  this.id = roomId;
  this.name = `room name`;
  this.host = uid;

  this.teams = {};
  this.teamsArray = [];
  this.players = [];

  this.scoresTotal = {};
  this.scoresArray = {};

  this.teamsThatHaveSubmitted = [];

  this.questionNumber = 0;
  this.currentQuestionCards = [];
  this.currentChoice = {};
  this.currentChoiceCopy = {};
  this.pictureAnswerStrings = {};
  this.pictureAnswerStringsCopy = {};
  this.answerFeedback = {};
  this.answerFeedbackCopy = {};

  for (var i = 0; i < numberOfTeams; i++) {
    this.teams = { ...this.teams, [teamColors[i]]: [] };
    this.pictureAnswerStrings = {
      ...this.pictureAnswerStrings,
      [teamColors[i]]: ""
    };
    this.pictureAnswerStringsCopy = {
      ...this.pictureAnswerStringsCopy,
      [teamColors[i]]: ""
    };

    this.currentScore = { ...this.currentScore, [teamColors[i]]: 0 };
    this.scoresArray = { ...this.scoresArray, [teamColors[i]]: [] };
    this.answerFeedback = { ...this.answerFeedback, [teamColors[i]]: [] };
    this.answerFeedbackCopy = {
      ...this.answerFeedbackCopy,
      [teamColors[i]]: []
    };

    this.teamsArray.push(teamColors[i]);

    this.scoresTotal = { ...this.scoresTotal, [teamColors[i]]: 0 };

    this.currentChoice = {
      ...this.currentChoice,
      [teamColors[i]]: { 1: [], 2: [], 3: [], 4: [] }
    };
    this.currentChoiceCopy = {
      ...this.currentChoice,
      [teamColors[i]]: { 1: [], 2: [], 3: [], 4: [] }
    };
  }
}

// test started
Room.prototype.resetAtBegginingOfRound = function() {
  this.teamsThatHaveSubmitted = [];
  this.currentQuestionCards = [];
  this.answerFeedback = this.answerFeedbackCopy;
  this.currentChoice = this.currentChoiceCopy;
  this.pictureAnswerStrings = this.pictureAnswerStringsCopy;
};

Room.prototype.getAnswerFeedback = function(team) {
  return this.answerFeedback[team];
};

Room.prototype.markPictureQuestion = function(team) {
  let points = 400 * (this.questionNumber + 1);
  if (
    this.pictureAnswerStrings[team] ===
    testQuestions[this.questionNumber].answer
  ) {
    this.addToCurrentScore(team, points);
  }

  return (
    this.pictureAnswerStrings[team] ===
    testQuestions[this.questionNumber].answer
  );
};

Room.prototype.markOrderQuestion = function(team) {
  let points = 100 * (this.questionNumber + 1);
  let answerKeyArray = [1, 2, 3, 4];

  answerKeyArray.map(answerKey => {
    if (
      this.currentChoice[team][answerKey][0].answer ===
      this.currentChoice[team][answerKey][0].correctAnswer
    ) {
      this.addToCurrentScore(team, points);
      this.answerFeedback[team].push({ color: "lightgreen", points });
    } else {
      this.answerFeedback[team].push({ color: "red", points: 0 });
    }
  });
};

Room.prototype.updatePictureAnswerStrings = function(team, text) {
  this.pictureAnswerStrings[team] = `${text.toUpperCase()}`;
};

// test in place
Room.prototype.updateScoresAtEndOfRound = function() {
  this.addCurrentScoresToScoresArray();
  this.addScoresArrayTotalToScore();
};

// test in place
Room.prototype.addCurrentScoresToScoresArray = function() {
  this.teamsArray.map(team => {
    console.log("addCurrentScoresToScoresArray", this.scoresArray[team]);
    this.scoresArray[team].push({ score: this.currentScore[team] });
    this.currentScore[team] = 0;
  });
};

//test in place
Room.prototype.addScoresArrayTotalToScore = function() {
  this.teamsArray.map(team => {
    this.scoresTotal[team] = this.getTotalScoreForTeam(team).score;
  });
};

//test in place
Room.prototype.addToCurrentScore = function(team, score) {
  this.currentScore[team] += score;
};

// test in place ish
Room.prototype.getCurrentScore = function(team) {
  return this.currentScore[team];
};

// Room.prototype.getScoreForCurrentRound = function(team) {
//   return this.scoresArray[team][this.questionNumber].score;
// };

Room.prototype.getTotalScoreForTeam = function(team) {
  return this.scoresArray[team].slice().reduce((a, b) => ({
    score: a.score + b.score
  }));
};

// Room.prototype.addBonusForFastestCorrect = function(team, bonus) {
// };

// test in place
Room.prototype.addPlayerToTeam = function(team, name, uid) {
  this.teams = {
    ...this.teams,
    [team]: [...this.teams[team], { id: uid, name }]
  };
};

Room.prototype.removePlayerFromTeamAndGetUid = function(team, i) {
  let uid = this.teams[team][i].id;
  this.teams[team].splice(i, 1);
  return uid;
};

// test in place
Room.prototype.addToQuestionNumber = function() {
  this.questionNumber += 1;
};

Room.prototype.addAnswer = function(
  team,
  uid,
  cardText,
  answer,
  correctAnswer
) {
  this.currentChoice = {
    ...this.currentChoice,
    [team]: {
      ...this.currentChoice[team],
      [answer]: [
        ...this.currentChoice[team][answer],
        { cardText, answer, correctAnswer, id: uid }
      ]
    }
  };
};

Room.prototype.isPlayerInRoom = function(uid) {
  console.log("obj val", Object.values(this.teams).flat());
  console.log("uid", uid);
  return Object.values(this.teams)
    .flat()
    .some(({ id }) => id === uid);
};

Room.prototype.getPlayersTeam = function(uid) {
  let teamPlayerIsOn;
  this.teamsArray.map(team => {
    this.teams[team].map(player => {
      if (player.id === uid) {
        teamPlayerIsOn = team;
      }
    });
  });
  return teamPlayerIsOn;
};

Room.prototype.haveAllTeamsSubmitted = function() {
  return this.teamsThatHaveSubmitted.length === this.teamsArray.length;
};

Room.prototype.hasTeamSubmitted = function(team) {
  return (
    this.currentChoice[team][1].length === 1 &&
    this.currentChoice[team][2].length === 1 &&
    this.currentChoice[team][3].length === 1 &&
    this.currentChoice[team][4].length === 1
  );
};
Room.prototype.updateCardOptions = function(
  uid,
  team,
  answer,
  correctAnswer,
  cardText
) {
  let arrayOfAnswerIndex = [1, 2, 3, 4].map(answerKey =>
    this.currentChoice[team][answerKey].findIndex(obj => obj.id === uid)
  );

  let indexOfOldAnswer = arrayOfAnswerIndex.findIndex(i => i !== -1);
  let oldAnswerKey = indexOfOldAnswer + 1;

  if (this.currentChoice[team][answer].length < 1) {
    if (indexOfOldAnswer !== -1) {
      //delete previous answer
      this.currentChoice[team][oldAnswerKey].splice(
        arrayOfAnswerIndex[indexOfOldAnswer],
        1
      );
    }
    // add new answer
    this.addAnswer(team, uid, cardText, answer, correctAnswer);
  }
  // if answer same then remove it
  if (oldAnswerKey === answer) {
    this.currentChoice[team][oldAnswerKey].splice(
      arrayOfAnswerIndex[indexOfOldAnswer],
      1
    );
  }
};

Room.prototype.keepReferenceOfCurrentCards = function(cards) {
  this.currentQuestionCards = cards;
};

module.exports = Room;
