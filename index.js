var express = require("express");
var http = require("http").Server(app);
var io = require("socket.io")(http);
var app = express();

const testQuestions = require("./libs/Questions/data7");
const Room = require("./libs/Room");
const Utils = require("./libs/Utils");
let rooms = {};
let userIds = {};

const scoreBoardTimeout = 9500;
const roundCardTimeout = 6000;
const questionSeconds = 3;
const answerSeconds = 30;
const hostAnswerTimeout = 7000;
const pauseFactor = 1500;
const findTeammatesTimout = 15000;

let isGamePaused = false;

// this calls onConnection when user connects
io.on("connection", onConnection);

// this sets op socket to listen and calls each function when it hears the socket id
console.log("when");
function onConnection(socket) {
  console.log("onConnection");
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
  socket.on("pauseGame", () => (isGamePaused = !isGamePaused));
  socket.on("removeUser", data => catchError(socket, data, removeUser));
  socket.on("makeGameRoom", data => catchError(socket, data, makeGameRoom));
  socket.on("enterGameRoom", data =>
    catchError(socket, data, newEnterGameRoom)
  );
  socket.on("joinTeam", data => catchError(socket, data, joinTeam));
  socket.on("startGame", roomNumber =>
    catchError(socket, roomNumber, startGameFirstTime)
  );
  socket.on("deleteGameRoom", room => catchError(socket, room, deleteGameRoom));

  socket.on("updateCardOptions", info =>
    catchError(socket, info, updateCardOptions)
  );
  socket.on("sendNextQuestion", roomNumber =>
    catchError(socket, roomNumber, sendConsecutiveQuestions)
  );
  socket.on("submitTeamAnswer", data => catchError(socket, data, onTeamSubmit));
  socket.on("submitPictureAnswer", data =>
    catchError(socket, data, onTeamSubmit)
  );
  socket.on("getCurrentScore", roomId =>
    catchError(socket, roomId, sendUpdatedScore)
  );
  socket.on("livePictureAnswer", data =>
    catchError(socket, data, onLivePictureTextInput)
  );
}

function catchError(socket, data, action) {
  console.log("catchError");
  try {
    action(socket, data);
    console.log("action has been performed");
  } catch (err) {
    console.log(err);
    socket.emit("gameMessage", "sorry something has gone wrong");
  }
}

function login(socket, uid) {
  console.log("login");
  socket.uid = uid;
  userIds[uid] = { connected: true, currentSocket: socket.id };
  socket.join(uid);
  console.log("user logged in: ", uid);

  // if host then push game room
  Object.keys(rooms).map(roomId => {
    if (rooms[roomId].host === uid) {
      console.log("a host has appeard");

      io.in(uid).emit(
        "makeGameRoom",
        Utils.getRoomReadyForSending(rooms[roomId])
      );
    } else if (rooms[roomId].isPlayerInPlayersArray(uid)) {
      console.log("player rejoins");
      socket.join(uid);
      if (rooms[roomId].isGameLive) {
        let team = rooms[roomId].getPlayersTeam(uid);

        io.to(userIds[uid].currentSocket).emit("messageAndNav", {
          message: `you are still in the ${team} team. The game is live!`,
          path: "/play/message"
        });
        io.to(userIds[uid].currentSocket).emit("teamColor", team);
        io.to(userIds[uid].currentSocket).emit("roomNumber", roomId);
        if (rooms[roomId].isPlayerATeamCaptain(uid)) {
          io.to(userIds[uid].currentSocket).emit("teamCaptain");
        }
      }
    }
  });
}

function removeUser(socket, { roomId, team, uid, i }) {
  console.log("removeUser");
  console.log("user removed");
  // rooms[roomId].teams[team].splice(i, 1);

  let playerUid = rooms[roomId].removePlayerFromTeamAndGetUid(team, i);
  io.in(userIds[playerUid].currentSocket).emit("messageAndNav", {
    message: ``,
    path: "/play"
  });
  socket.emit("updateHostRoom", Utils.getRoomReadyForSending(rooms[roomId]));
}

function makeGameRoom(socket, { numberOfTeams, uid }) {
  console.log("makeGameRoom");
  let newRoom = new Room(Utils.getNewRoomId(), uid);

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

function newEnterGameRoom(socket, { roomId, uid, name = "anon" }) {
  console.log("newEnterGameRoom");
  // is player in room ?
  // join to list of players ready to be put in team
  if (rooms[roomId]) {
    if (!rooms[roomId].isPlayerInPlayersArray(uid)) {
      rooms[roomId].players.push({ name, id: uid });
      console.log("new player has joined", name, uid);
      socket.join(uid);
      socket.emit("messageAndNav", {
        path: "/play/message",
        message: `Well Done ${name}! You have joined room ${roomId}, now sit back and relax, or maybe help a friend type in the code if they are struggling...`
      });
      io.in(userIds[rooms[roomId].host].currentSocket).emit(
        "updateHostRoom",
        Utils.getRoomReadyForSending(rooms[roomId])
      );
    } else {
      console.log("old player has joined");
      socket.emit("messageAndNav", {
        path: "/play/message",
        message: `Cheeky! Trying to join twice are you? You are in room ${roomId} so just chill for a second.`
      });
    }
  } else {
    // tell them they got it wrong
  }
}

function putPlayersInTeamsAndSendMessage(socket, roomId) {
  console.log("putPlayersInTeamsAndSendMessage");

  const currentRoom = rooms[roomId];
  currentRoom.putPlayersInTeams();

  currentRoom.teamsArray.map(team =>
    currentRoom.teams[team].map(player => {
      io.to(userIds[player.id].currentSocket).emit("messageAndNav", {
        message: `you are in the ${team} team. Go and find your team mates`,
        path: "/play/message"
      });
      io.to(userIds[player.id].currentSocket).emit("teamColor", team);
    })
  );

  currentRoom.teamsArray.map(team => {
    io.to(userIds[currentRoom.teams[team][0].id].currentSocket).emit(
      "teamCaptain"
    );
  });

  const host = userIds[currentRoom.host];
  io.in(host.currentSocket).emit(
    "updateHostRoom",
    Utils.getRoomReadyForSending(currentRoom)
  );

  io.to(host.currentSocket).emit("messageAndNav", {
    message: ``,
    path: "/host/gofindteam"
  });
}

function startGameFirstTime(socket, roomId) {
  console.log("startGameFirstTime");
  if (rooms[roomId].isGameLive) {
    return;
  }
  putPlayersInTeamsAndSendMessage(socket, roomId);
  setTimeout(() => startGameLoop(socket, roomId), findTeammatesTimout);
  rooms[roomId].isGameLive = true;
}

function startGameLoop(socket, roomId) {
  console.log("startGameLoop");
  if (isGamePaused) {
    return;
  }
  console.log("game loop started");
  rooms[roomId].resetAtBegginingOfRound();

  if (rooms[roomId].questionNumber < testQuestions.length) {
    io.in(userIds[rooms[roomId].host].currentSocket).emit("messageAndNav", {
      message: testQuestions[rooms[roomId].questionNumber].roundinfo,
      roundNumber: rooms[roomId].questionNumber + 1,
      path: "/host/roundcard"
    });

    rooms[roomId].teamsArray.map(team => {
      rooms[roomId].teams[team].map((player, i) => {
        io.in(userIds[player.id].currentSocket).emit("messageAndNav", {
          message: testQuestions[rooms[roomId].questionNumber].roundinfo,
          roundNumber: rooms[roomId].questionNumber + 1,
          path: "/play/round"
        });
      });
    });

    setTimeout(
      () => sendQuestionToHostWithCountdown(socket, roomId),
      roundCardTimeout
    );
  } else {
    // finish game here
    console.log("game finished");
    io.in(userIds[rooms[roomId].host].currentSocket).emit("messageAndNav", {
      path: "/host/endpage"
    });
  }
}

function endGamePrematurely(socket, roomId) {
  console.log("endGamePrematurely");
  clearInterval(rooms[roomId].intervalIdCountdown);
  clearInterval(rooms[roomId].intervalIdRound);
}

function sendQuestionToHostWithCountdown(socket, roomId) {
  console.log("sendQuestionToHostWithCountdown");
  io.in(userIds[rooms[roomId].host].currentSocket).emit("messageAndNav", {
    message: testQuestions[rooms[roomId].questionNumber].question,
    path: "/host/question"
  });

  countDownWhileQuestionShown(socket, roomId);
}

function countDownWhileQuestionShown(socket, roomId) {
  console.log("countDownWhileQuestionShown");
  let count = questionSeconds;

  io.in(userIds[rooms[roomId].host].currentSocket).emit("updateCounter", {
    question: count
  });
  count--;

  rooms[roomId].intervalIdCountdown = setInterval(() => {
    if (count > 0) {
      if (isGamePaused) {
        return;
      }
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
  }, pauseFactor);
}
function sendConsecutiveQuestions(socket, roomId) {
  console.log("sendConsecutiveQuestions");
  if (rooms[roomId].questionNumber < testQuestions.length) {
    sendQuestion(socket, roomId, rooms[roomId].questionNumber);
    roundTimer(socket, roomId);
    // rooms[roomId].addToQuestionNumber();
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
  console.log("sendQuestion");
  let randomArray = Utils.getShuffledArray();

  if (testQuestions[questionNumber].questionType === "order") {
    console.log("question type order");
    rooms[roomId].keepReferenceOfCurrentCards(
      testQuestions[questionNumber].cards
    );

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
  } else if (testQuestions[questionNumber].questionType === "picture") {
    rooms[roomId].teamsArray.map(team => {
      rooms[roomId].teams[team].map((player, i) => {
        io.in(userIds[player.id].currentSocket).emit(
          "pictureMessage",
          testQuestions[questionNumber].cards[randomArray[i]]
        );
      });
    });
  }

  io.in(userIds[rooms[roomId].host].currentSocket).emit(
    "updateHostRoom",
    Utils.getRoomReadyForSending(rooms[roomId])
  );

  console.log(`question has been sent to ${roomId}`);
}

function roundTimer(socket, roomId) {
  console.log("roundTimer");
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
      if (isGamePaused) {
        return;
      }
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
    } else if (!rooms[roomId].haveAllTeamsSubmitted()) {
      // go to score page
      endRoundAndShowAnswer(socket, roomId);
    }
  }, 1000);
}

function endRoundAndShowAnswer(socket, roomId) {
  console.log("endRoundAndShowAnswer");
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

  switch (testQuestions[rooms[roomId].questionNumber].questionType) {
    case "order":
      io.in(rooms[roomId].host).emit("messageAndNav", {
        path: "/host/answer"
      });
      break;
    case "picture":
      io.in(rooms[roomId].host).emit("pictureAnswerNav", {
        path: "/host/pictureAnswer",
        message: `It was ${
          testQuestions[rooms[roomId].questionNumber].answer
        } of course!`,
        url: testQuestions[rooms[roomId].questionNumber].answerURL
      });
      break;
    default:
      console.log("switch has not recieved valid question type");
  }

  setTimeout(() => showScore(socket, roomId), hostAnswerTimeout);
}

function showScore(socket, roomId) {
  console.log("showScore");
  sendUpdatedScore(socket, roomId);
  io.in(rooms[roomId].host).emit("messageAndNav", {
    path: "/host/score"
  });
  rooms[roomId].addToQuestionNumber();
  setTimeout(() => startGameLoop(socket, roomId), scoreBoardTimeout);
}

function sendUpdatedScore(socket, roomId) {
  console.log("sendUpdatedScore");
  rooms[roomId].updateScoresAtEndOfRound();

  io.in(userIds[rooms[roomId].host].currentSocket).emit(
    "updateHostRoom",
    Utils.getRoomReadyForSending(rooms[roomId])
  );
}

function deleteGameRoom(socket, roomId) {
  console.log("deleteGameRoom");
  delete rooms[roomId];
  console.log(`room ${roomId} has been deleted`);
}

function updateCardOptions(
  socket,
  { roomId, team, answer, cardText, correctAnswer }
) {
  console.log("updateCardOptions");
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

function onTeamSubmit(socket, { roomId, team, answer }) {
  console.log("onTeamSubmit");
  if (rooms[roomId].teamsThatHaveSubmitted.includes(team)) {
    return;
  }
  rooms[roomId].teamsThatHaveSubmitted.push(team);

  io.in(userIds[rooms[roomId].host].currentSocket).emit(
    "liveTeamSubmitUpdate",
    rooms[roomId].teamsThatHaveSubmitted
  );

  if (rooms[roomId].haveAllTeamsSubmitted()) {
    // trigger next thing
    setTimeout(() => endRoundAndShowAnswer(socket, roomId), 2000);
  }

  switch (testQuestions[rooms[roomId].questionNumber].questionType) {
    case "order":
      checkAnswersForOrderRound(roomId, team);
      break;
    case "picture":
      checkAnswersForPictureRound(roomId, team, answer);
      break;
    default:
      console.log("switch has not recieved valid question type");
  }
}

function checkAnswersForPictureRound(roomId, team, answer) {
  console.log("checkAnswersForPictureRound");
  if (rooms[roomId].markPictureQuestion(team, answer)) {
    rooms[roomId].teams[team].map(player => {
      io.in(userIds[player.id].currentSocket).emit(
        "pictureAnswerFeedback",
        "CORRECT"
      );
    });
  } else {
    rooms[roomId].teams[team].map(player => {
      io.in(userIds[player.id].currentSocket).emit(
        "pictureAnswerFeedback",
        "WRONG"
      );
    });
  }
}

function checkAnswersForOrderRound(roomId, team) {
  console.log("checkAnswersForOrderRound");
  rooms[roomId].markOrderQuestion(team);

  console.log("answer feedback in app", rooms[roomId].getAnswerFeedback(team));

  rooms[roomId].teams[team].map(player => {
    io.in(userIds[player.id].currentSocket).emit("answerFeedback", {
      feedback: rooms[roomId].getAnswerFeedback(team)
    });
  });
}

http.listen(process.env.PORT || 6001, () => {
  console.log("listening on *:6001");
});
