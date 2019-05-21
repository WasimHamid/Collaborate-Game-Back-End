var app = require("express")();
var http = require("http").Server(app);
var io = require("socket.io")(http);

const testQuestions = require("./data4");
const Room = require("./roomobject");
let rooms = {};
let userIds = {};

const scoreBoardTimeout = 9000;
const roundCardTimeout = 6000;
const questionSeconds = 3;
const answerSeconds = 30;
const hostAnswerTimeout = 5000;

const points = 100;

function getNewRoomId() {
  return Math.floor(Math.random() * 9000 + 1000);
}

// this calls onConnection when user connects
io.on("connection", onConnection);

// this sets op socket to listen and calls each function when it hears the socket id
function onConnection(socket) {
  console.log("a user connected");
  socket.emit("whoAreYou");

  socket.on("disconnect", () => {
    userIds[socket.uid] = { connected: false, currentsocket: "" };
    console.log("user disconnected");
  });

  socket.on("testNav", () => socket.emit("pageNavigation", "/hostrouter/123"));

  socket.on("login", uid => catchError(socket, uid, login));

  socket.on("notGotIdYet", () =>
    catchError(socket, null, () =>
      setTimeout(() => socket.emit("whoAreYou"), 1000)
    )
  );
  socket.on("abort", roomId => catchError(socket, roomId, endGamePrematurely));
  socket.on("removeUser", data => catchError(socket, data, removeUser));
  socket.on("makeGameRoom", data => catchError(socket, data, makeGameRoom));
  socket.on("enterGameRoom", data => catchError(socket, data, enterGameRoom));
  socket.on("joinTeam", data => catchError(socket, data, joinTeam));
  socket.on("startGame", roomNumber =>
    catchError(socket, roomNumber, startGameLoop)
  );
  socket.on("deleteGameRoom", room => catchError(socket, room, deleteGameRoom));

  socket.on("updateCardOptions", info =>
    catchError(socket, info, updateCardOptions)
  );
  socket.on("sendNextQuestion", roomNumber =>
    catchError(socket, roomNumber, sendConsecutiveQuestions)
  );
  socket.on("submitTeamAnswer", data => catchError(socket, data, onTeamSubmit));
  socket.on("getCurrentScore", roomId =>
    catchError(socket, roomId, sendUpdatedScore)
  );
}

function catchError(socket, data, action) {
  try {
    action(socket, data);
    console.log("action has been performed");
  } catch (err) {
    console.log(err);
    socket.emit("gameMessage", "sorry something has gone wrong");
  }
}

function login(socket, uid) {
  socket.uid = uid;
  userIds[uid] = { connected: true, currentSocket: socket.id };
  socket.join(uid);
  console.log("user logged in: ", uid);

  // if host then push game room
  Object.keys(rooms).map(room => {
    if (rooms[room].host === uid) {
      console.log("a host has appeard");
      io.in(uid).emit("makeGameRoom", rooms[room]);
    }
  });
}

function removeUser(socket, { roomId, team, uid, i }) {
  console.log("user removed");
  rooms[roomId].teams[team].splice(i, 1);
  socket.emit("updateHostRoom", rooms[roomId]);
}

function makeGameRoom(socket, { numberOfTeams, uid }) {
  let newRoom = new Room(numberOfTeams, getNewRoomId(), uid);

  rooms[newRoom.id] = newRoom;

  if (userIds[uid].connected) {
    io.to(userIds[uid].currentSocket).emit("makeGameRoom", newRoom);
  } else {
    console.log("message to host failed");
  }
  socket.join(uid);
  socket.join(newRoom.id);
  console.log(`new room ${newRoom.id} has been created`);
}

function enterGameRoom(socket, { roomId, uid }) {
  console.log("user id object", { roomId, uid });
  console.log("is player in room", rooms[roomId].isPlayerInRoom(uid));

  if (rooms[roomId]) {
    if (rooms[roomId].isPlayerInRoom(uid)) {
      socket.emit("enterGameRoom", rooms[roomId]);
      socket.emit("messageAndNav", {
        message: `you are in the ${team} team in room ${roomId}`,
        path: "/play/holding"
      });
      socket.emit("teamColor", team);
      socket.join(roomId);
    } else {
      socket.emit("enterGameRoom", rooms[roomId]);
      socket.emit(
        "gameMessage",
        `Welcome to ${roomId}! please enter your name and join a team`
      );
      socket.join(roomId);
      console.log(socket.uid + " has joined " + roomId);
    }
  } else {
    socket.emit(
      "gameMessage",
      `Sorry we couldn't find ${roomId}, please try again`
    );
  }
}

function joinTeam(socket, { roomId, team, name, uid }) {
  if (!rooms[roomId].isPlayerInRoom()) {
    rooms[roomId].addPlayerToTeam(team, name, uid);
    socket.join(uid);
    socket.emit("gameMessage", `you are in the ${team} team in room ${roomId}`);
    socket.emit("teamColor", team);
    io.in(userIds[rooms[roomId].host].currentSocket).emit(
      "updateHostRoom",
      rooms[roomId]
    );
    console.log(`${name} has joined ${roomId}`);
    console.log(rooms[roomId].teams);
  }
}

function startGameLoop(socket, roomId) {
  console.log("game loop started");
  if (rooms[roomId].questionNumber < testQuestions.length) {
    io.in(userIds[rooms[roomId].host].currentSocket).emit("messageAndNav", {
      message: testQuestions[rooms[roomId].questionNumber].roundinfo,
      roundNumber: rooms[roomId].questionNumber + 1,
      path: "/host/roundcard"
    });

    setTimeout(
      () => sendQuestionToHostWithCountdown(socket, roomId),
      roundCardTimeout
    );
  } else {
    // finish game here
    clearInterval(rooms[roomId].intervalIdCountdown);
    clearInterval(rooms[roomId].intervalIdRound);
    io.in(userIds[rooms[roomId].host].currentSocket).emit("messageAndNav", {
      path: "/host/scores"
    });
  }
}

function endGamePrematurely(socket, roomId) {
  clearInterval(rooms[roomId].intervalIdCountdown);
  clearInterval(rooms[roomId].intervalIdRound);
}

function sendQuestionToHostWithCountdown(socket, roomId) {
  io.in(userIds[rooms[roomId].host].currentSocket).emit("messageAndNav", {
    message: testQuestions[rooms[roomId].questionNumber].question,
    path: "/host/question"
  });

  countDownWhileQuestionShown(socket, roomId);
}

function countDownWhileQuestionShown(socket, roomId) {
  let count = questionSeconds;

  io.in(userIds[rooms[roomId].host].currentSocket).emit("updateCounter", {
    question: count
  });
  count--;

  rooms[roomId].intervalIdCountdown = setInterval(() => {
    if (count > 0) {
      io.in(userIds[rooms[roomId].host].currentSocket).emit("updateCounter", {
        question: count
      });
      count--;
    } else {
      clearInterval(rooms[roomId].intervalIdCountdown);
      io.in(userIds[rooms[roomId].host].currentSocket).emit("updateCounter", {
        question: 0
      });
      sendConsecutiveQuestions(socket, roomId);
    }
  }, 1500);
}

function roundTimer(socket, roomId) {
  let count = answerSeconds;

  rooms[roomId].teamsArray.map(team => {
    rooms[roomId].teams[team].map((player, i) => {
      io.in(userIds[player.id].currentSocket).emit("updateCounter", {
        round: count
      });
    });
  });
  io.in(rooms[roomId].host).emit("updateCounter", {
    round: count
  });

  count--;

  rooms[roomId].intervalIdRound = setInterval(() => {
    if (count > 0) {
      // send counter to players
      rooms[roomId].teamsArray.map(team => {
        rooms[roomId].teams[team].map((player, i) => {
          io.in(userIds[player.id].currentSocket).emit("updateCounter", {
            round: count
          });
        });
      });
      io.in(rooms[roomId].host).emit("updateCounter", {
        round: count
      });

      count--;
    } else {
      // go to score page
      endRoundAndShowAnswer(socket, roomId);
    }
  }, 1000);
}

function endRoundAndShowAnswer(socket, roomId) {
  clearInterval(rooms[roomId].intervalIdRound);

  rooms[roomId].teamsArray.map(team => {
    rooms[roomId].teams[team].map((player, i) => {
      if (rooms[roomId].getCurrentScore(team) > 0) {
        io.in(userIds[player.id].currentSocket).emit("roundHasFinished", {
          message: `well done! you scored ${rooms[roomId].getCurrentScore(
            team
          )}`
        });
      } else {
        io.in(userIds[player.id].currentSocket).emit("roundHasFinished", {
          message: `uh oh, you scored NOTHING!!`
        });
      }
    });
  });

  io.in(rooms[roomId].host).emit("messageAndNav", {
    path: "/host/answer"
  });
  setTimeout(() => showScore(socket, roomId), hostAnswerTimeout);
}

function showScore(socket, roomId) {
  sendUpdatedScore(socket, roomId);
  io.in(rooms[roomId].host).emit("messageAndNav", {
    path: "/host/score"
  });
  setTimeout(() => startGameLoop(socket, roomId), scoreBoardTimeout);
}

function sendUpdatedScore(socket, roomId) {
  rooms[roomId].updateScoresAtEndOfRound();

  io.in(userIds[rooms[roomId].host].currentSocket).emit(
    "updateHostRoom",
    rooms[roomId]
  );
}

function shuffle(array) {
  var currentIndex = array.length,
    temporaryValue,
    randomIndex;
  // While there remain elements to shuffle...
  while (0 !== currentIndex) {
    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;
    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }
  return array;
}

function sendConsecutiveQuestions(socket, roomId) {
  if (rooms[roomId].questionNumber < testQuestions.length) {
    sendQuestion(socket, roomId, rooms[roomId].questionNumber);
    roundTimer(socket, roomId);
    rooms[roomId].addToQuestionNumber();
  } else {
    io.in(roomId).emit("gameMessage", `no more questions`);
    sendUpdatedScore(socket, roomId);
    io.in(rooms[roomId].host).emit("messageAndNav", {
      message: "",
      path: "/host/score"
    });
  }
}

function sendQuestion(socket, roomId, questionNumber = 0) {
  rooms[roomId].resetTeamsThatHaveSubmitted();
  rooms[roomId].resetCurrentChoice();
  rooms[roomId].addToCurrentQuestion(testQuestions[questionNumber].cards);
  let randomArray = shuffle([0, 1, 2, 3]);

  rooms[roomId].teamsArray.map(team => {
    rooms[roomId].teams[team].map((player, i) => {
      io.in(userIds[player.id].currentSocket).emit("cardMessage", {
        ...testQuestions[questionNumber].cards[randomArray[i]],
        instruction: testQuestions[questionNumber].instruction
      });
    });
  });

  io.in(userIds[rooms[roomId].host].currentSocket).emit(
    "gameMessage",
    testQuestions[questionNumber].question
  );
  io.in(userIds[rooms[roomId].host].currentSocket).emit(
    "tidbit",
    testQuestions[questionNumber].tidbit
  );

  io.in(userIds[rooms[roomId].host].currentSocket).emit(
    "updateHostRoom",
    rooms[roomId]
  );

  console.log(`question has been sent to ${roomId}`);
}

function deleteGameRoom(socket, roomId) {
  delete rooms[roomId];
  console.log(`room ${roomId} has been deleted`);
}

function updateCardOptions(
  socket,
  { roomId, team, answer, cardText, correctAnswer }
) {
  rooms[roomId].updateCardOptions(
    socket.uid,
    team,
    answer,
    correctAnswer,
    cardText
  );
  // send updated options to team
  rooms[roomId].teams[team].map(player => {
    io.in(userIds[player.id].currentSocket).emit(
      "updateCardOptions",
      rooms[roomId].currentChoice[team]
    );
  });

  if (rooms[roomId].hasTeamSubmitted(team)) {
    // send message to allow submit
    rooms[roomId].teams[team].map(player => {
      io.in(userIds[player.id].currentSocket).emit("submitAllowed", true);
    });
  } else {
    rooms[roomId].teams[team].map(player => {
      io.in(userIds[player.id].currentSocket).emit("submitAllowed", false);
    });
  }
}

function onTeamSubmit(socket, { roomId, team }) {
  rooms[roomId].teamsThatHaveSubmitted.push(team);

  io.in(userIds[rooms[roomId].host].currentSocket).emit(
    "liveTeamSubmitUpdate",
    rooms[roomId].teamsThatHaveSubmitted
  );

  rooms[roomId].teams[team].map(player => {
    io.in(userIds[player.id].currentSocket).emit("submitAllowed", false);
  });

  if (rooms[roomId].haveAllTeamsSubmitted()) {
    // trigger next thing
    setTimeout(() => endRoundAndShowAnswer(socket, roomId), 2000);
  }

  let answerKeyArray = [1, 2, 3, 4];
  let answerFeedback = [];

  answerKeyArray.map(answerKey => {
    if (
      rooms[roomId].currentChoice[team][answerKey][0].answer ===
      rooms[roomId].currentChoice[team][answerKey][0].correctAnswer
    ) {
      rooms[roomId].addToCurrentScore(team, points);
      rooms[roomId].roundScores[team] += points;
      answerFeedback.push({ color: "lightgreen", points });
    } else {
      answerFeedback.push({ color: "red", points: 0 });
    }
  });

  rooms[roomId].teams[team].map(player => {
    io.in(userIds[player.id].currentSocket).emit("answerFeedback", {
      feedback: answerFeedback
    });
  });
}

http.listen(process.env.PORT || 6001, () => {
  console.log("listening on *:6001");
});
