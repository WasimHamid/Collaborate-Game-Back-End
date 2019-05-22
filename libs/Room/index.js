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
  this.teams = {};
  this.teamsArray = [];
  this.scores = {};
  // this.roundScores = {};
  this.players = [];
  this.questionNumber = 0;
  this.host = uid;
  this.currentChoice = {};
  this.currentChoiceCopy = {};
  this.teamsThatHaveSubmitted = [];
  this.currentQuestion = [];
  this.scoresForEachRound = {};
  this.scoresArray = {};
  this.pictureAnswerStrings = {};
  this.answerFeedback = {};
  this.answerFeedbackCopy = {};

  for (var i = 0; i < numberOfTeams; i++) {
    this.teams = { ...this.teams, [teamColors[i]]: [] };
    this.pictureAnswerStrings = {
      ...this.pictureAnswerStrings,
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

    this.scores = { ...this.scores, [teamColors[i]]: 0 };
    // this.roundScores = { ...this.scores, [teamColors[i]]: 0 };

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

Room.prototype.resetAtBegginingOfRound = function() {
  this.resetTeamsThatHaveSubmitted();
  this.resetCurrentChoice();
  this.resetAnswerFeedback();
};

Room.prototype.resetCurrentChoice = function() {
  this.currentChoice = this.currentChoiceCopy;
};
Room.prototype.resetAnswerFeedback = function() {
  this.answerFeedback = this.answerFeedbackCopy;
};
Room.prototype.resetTeamsThatHaveSubmitted = function() {
  this.teamsThatHaveSubmitted = [];
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
  points = 100 * (this.questionNumber + 1);
  let answerKeyArray = [1, 2, 3, 4];

  answerKeyArray.map(answerKey => {
    if (
      this.currentChoice[team][answerKey][0].answer ===
      this.currentChoice[team][answerKey][0].correctAnswer
    ) {
      this.addToCurrentScore(team, points);
      // this.roundScores[team] += points;
      this.answerFeedback[team].push({ color: "lightgreen", points });
    } else {
      this.answerFeedback[team].push({ color: "red", points: 0 });
    }
  });
};

Room.prototype.updatePictureAnswerStrings = function(team, text) {
  this.pictureAnswerStrings[team] = `${text.toUpperCase()}`;
};

Room.prototype.updateScoresAtEndOfRound = function() {
  this.addCurrentScoresToScoresArray();
  this.addScoresArrayTotalToScore();
};

Room.prototype.addCurrentScoresToScoresArray = function() {
  this.teamsArray.map(team => {
    console.log("addCurrentScoresToScoresArray", this.scoresArray[team]);
    this.scoresArray[team].push({ score: this.currentScore[team] });
    this.currentScore[team] = 0;
  });
};

Room.prototype.addScoresArrayTotalToScore = function() {
  this.teamsArray.map(team => {
    this.scores[team] = this.getTotalScoreForTeam(team).score;
  });
};

Room.prototype.addToCurrentScore = function(team, score) {
  this.currentScore[team] += score;
};

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
//   this.scoresArray[team][this.questionNumber] = {
//     ...this.scoresArray[team][this.questionNumber],
//     score: this.scoresForEachRound[team][this.questionNumber] + bonus
//   };
// };

Room.prototype.addPlayerToTeam = function(team, name, uid) {
  this.teams = {
    ...this.teams,
    [team]: [...this.teams[team], { id: uid, name }]
  };
};
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
  // for (let i = 0; i < this.teamsArray.length; i++) {
  //   for (let j = 0; j < this.teams[this.teamsArray[i]].length; j++) {
  //     if (this.teams[this.teamsArray[i]][j].id === uid) {
  //       return true;
  //     }
  //   }
  // }
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

// Room.prototype.addRoundsToTotalAndResetForTeam = function(team) {
//   this.scores[team] += this.roundScores[team];
//   this.roundScores[team] = 0;
// };

Room.prototype.addToCurrentQuestion = function(cards) {
  this.currentQuestion = cards;
};

module.exports = Room;
