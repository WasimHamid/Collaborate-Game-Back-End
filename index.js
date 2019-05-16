var app = require("express")();
var http = require("http").Server(app);
var io = require("socket.io")(http);

const testQuestions = require("./energiser");

let rooms = {};
let userIds = {};

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

  socket.on("login", uid => catchError(socket, uid, login));

  socket.on("notGotIdYet", () =>
    setTimeout(() => socket.emit("whoAreYou"), 1000)
  );

  socket.on("removeUser", data => catchError(socket, data, removeUser));

  socket.on("makeGameRoom", data => catchError(socket, data, makeGameRoom));

  socket.on("enterGameRoom", data => catchError(socket, data, enterGameRoom));
  socket.on("joinTeam", data => catchError(socket, data, joinTeam));
  socket.on("startGame", roomNumber =>
    catchError(socket, roomNumber, startGame)
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
  console.log("login: ", uid);
}

function removeUser(socket, { roomId, team, uid, i }) {
  console.log("user removed");
  rooms[roomId].teams[team].splice(i, 1);
  socket.emit("updateHostRoom", rooms[roomId]);
}

function makeGameRoom(socket, { numberOfTeams, uid }) {
  // let teamColors = ["#EB4511", "#23C9FF", "#D2FF28", "#FFAD05"];
  let teamColors = ["dodgerblue", "Fuchsia", "palegoldenrod", "lime"];
  let newRoom = {};
  newRoom.id = getNewRoomId();
  newRoom.name = `room ${rooms.length + 1}`;
  newRoom.teams = {};
  newRoom.scores = {};
  newRoom.roundScores = {};
  newRoom.players = [];
  newRoom.questionNumber = 0;
  newRoom.host = uid;
  newRoom.currentChoice = {};
  newRoom.currentChoiceCopy = {};
  newRoom.teamsThatHaveSubmitted = [];

  for (var i = 0; i < numberOfTeams; i++) {
    newRoom.teams = { ...newRoom.teams, [teamColors[i]]: [] };
    newRoom.scores = { ...newRoom.scores, [teamColors[i]]: 0 };
    newRoom.roundScores = { ...newRoom.scores, [teamColors[i]]: 0 };
    newRoom.currentChoice = {
      ...newRoom.currentChoice,
      [teamColors[i]]: { 1: [], 2: [], 3: [], 4: [] }
    };
    newRoom.currentChoiceCopy = {
      ...newRoom.currentChoice,
      [teamColors[i]]: { 1: [], 2: [], 3: [], 4: [] }
    };
  }

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
  console.log("user id object", userIds[uid]);

  if (rooms[roomId]) {
    let arrayOfTeamsInRoom = Object.keys(rooms[roomId].teams);

    let isOnTeamInRoomAlready = arrayOfTeamsInRoom
      .map(team =>
        rooms[roomId].teams[team]
          .map(player => {
            if (player.id === uid) {
              //do something here
              socket.emit("enterGameRoom", rooms[roomId]);
              socket.emit(
                "gameMessage",
                `you are in the ${team} team in room ${roomId}`
              );
              socket.emit("teamColor", team);
              socket.emit("rejoinMidGame");
              socket.join(roomId);
              return true;
            }
          })
          .includes(true)
      )
      .includes(true);

    if (!isOnTeamInRoomAlready) {
      if (rooms[roomId]) {
        socket.emit("enterGameRoom", rooms[roomId]);
        socket.emit(
          "gameMessage",
          `Welcome to ${roomId}! please enter your name and join a team`
        );
        socket.join(roomId);
        console.log(socket.uid + " has joined " + roomId);
      }
    }
  } else {
    socket.emit(
      "gameMessage",
      `Sorry we couldn't find ${roomId}, please try again`
    );
  }
}

function joinTeam(socket, { roomId, team, name, uid }) {
  let arrayOfTeamsInRoom = Object.keys(rooms[roomId].teams);

  let isOnTeamInRoom = arrayOfTeamsInRoom
    .map(teamInArr =>
      rooms[roomId].teams[teamInArr]
        .map(player => {
          if (player.id === uid) {
            //do something here
            return true;
          }
        })
        .includes(true)
    )
    .includes(true);

  if (!isOnTeamInRoom) {
    rooms[roomId] = {
      ...rooms[roomId],
      teams: {
        ...rooms[roomId].teams,
        [team]: [...rooms[roomId].teams[team], { id: uid, name }]
      }
    };
    socket.join(uid);
    socket.emit("gameMessage", `you are in the ${team} team in room ${roomId}`);
    socket.emit("teamColor", team);
    io.in(userIds[rooms[roomId].host].currentSocket).emit(
      "updateHostRoom",
      rooms[roomId]
    );
    console.log(`${name} has joined ${roomId}`);
  } else {
  }
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
    //map over teams
    // send round score
    // add roundscore to gamescore
    // clear round score
    sendQuestion(socket, roomId, rooms[roomId].questionNumber);
    rooms[roomId] = {
      ...rooms[roomId],
      questionNumber: rooms[roomId].questionNumber + 1
    };
  } else {
    io.in(roomId).emit("gameMessage", `no more questions`);
  }
}

function sendQuestion(socket, roomId, questionNumber = 0) {
  rooms[roomId].teamsThatHaveSubmitted = [];
  rooms[roomId].currentChoice = rooms[roomId].currentChoiceCopy;

  let teams = Object.keys(rooms[roomId].teams);

  let randomArray = shuffle([0, 1, 2, 3]);

  teams.map(team => {
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
  console.log(info);

  let arrayOfAnswerIndex = [1, 2, 3, 4].map(answerKey =>
    rooms[roomId].currentChoice[team][answerKey].findIndex(
      obj => obj.id === socket.uid
    )
  );

  let indexOfOldAnswer = arrayOfAnswerIndex.findIndex(i => i !== -1);
  let oldAnswerKey = indexOfOldAnswer + 1;

  // console.log("indexOfOldAnswer", indexOfOldAnswer);
  // console.log("arrayOfAnswerIndex", arrayOfAnswerIndex);
  // console.log("oldAnswerboth", arrayOfAnswerIndex[indexOfOldAnswer]);
  // console.log("oldAnswerKey", oldAnswerKey);

  if (rooms[roomId].currentChoice[team][answer].length < 1) {
    if (indexOfOldAnswer !== -1) {
      //delete previous answer
      rooms[roomId].currentChoice[team][oldAnswerKey].splice(
        arrayOfAnswerIndex[indexOfOldAnswer],
        1
      );
    }
    // add new answer
    rooms[roomId] = {
      ...rooms[roomId],
      currentChoice: {
        ...rooms[roomId].currentChoice,
        [team]: {
          ...rooms[roomId].currentChoice[team],
          [answer]: [
            ...rooms[roomId].currentChoice[team][answer],
            { cardText, answer, correctAnswer, id: socket.uid }
          ]
        }
      }
    };
  }
  // if answer same then remove it
  if (oldAnswerKey === answer) {
    rooms[roomId].currentChoice[team][oldAnswerKey].splice(
      arrayOfAnswerIndex[indexOfOldAnswer],
      1
    );
  }
  // send updated options to team
  rooms[roomId].teams[team].map(player => {
    io.in(userIds[player.id].currentSocket).emit(
      "updateCardOptions",
      rooms[roomId].currentChoice[team]
    );
  });

  if (
    rooms[roomId].currentChoice[team][1].length === 1 &&
    rooms[roomId].currentChoice[team][2].length === 1 &&
    rooms[roomId].currentChoice[team][3].length === 1 &&
    rooms[roomId].currentChoice[team][4].length === 1
  ) {
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
    teamsThatHaveSubmitted
  );

  rooms[roomId].teams[team].map(player => {
    io.in(userIds[player.id].currentSocket).emit("teamHasSubmitted");
  });

  let answerKeyArray = [1, 2, 3, 4];

  answerKeyArray.map(answerKey => {
    if (
      rooms[roomId].currentChoice[team][answerKey][0].answer ===
      rooms[roomId].currentChoice[team][answerKey][0].correctAnswer
    ) {
      rooms[roomId].roundScores[team] += 1;
      io.in(
        userIds[rooms[roomId].currentChoice[team][answerKey].id].currentSocket
      ).emit("gameMessage", "CORRECT");
    } else {
      io.in(
        userIds[rooms[roomId].currentChoice[team][answerKey].id].currentSocket
      ).emit("gameMessage", "INCORRECT");
    }
  });

  rooms[roomId].teams[team].map(player => {
    io.in(userIds[player.id].currentSocket).emit(
      "scoreUpdateMessage",
      `well done, your team scored ${rooms[roomId].roundScores[team]}!`
    );
  });
}

function startGame(socket, roomId) {
  io.in(roomId).emit("gameMessage", `game has started in ${roomId}`);
  rooms[roomId] = { ...rooms[roomId], questionNumber: 0 };
}

function sendUpdatedScore(socket, roomId) {
  let teams = Object.keys(rooms[roomId].teams);

  // this needs to change for score to behave correctly

  teams.map(team => {
    console.log("round scores send update", rooms[roomId].roundScores[team]);
    rooms[roomId].scores[team] += rooms[roomId].roundScores[team];
    rooms[roomId].roundScores[team] = 0;
  });

  io.in(userIds[rooms[roomId].host].currentSocket).emit(
    "updateHostRoom",
    rooms[roomId]
  );
}

http.listen(process.env.PORT || 6001, () => {
  console.log("listening on *:6001");
});
