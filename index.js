var app = require("express")();
var http = require("http").Server(app);
var io = require("socket.io")(http);

const testQuestions = require("./data3");

let rooms = {};
let hostIds = {};
let userIds = {};

function getNewRoomId() {
  return Math.floor(Math.random() * 9000 + 1000);
}

// this calls onConnection when user connects
io.on("connection", onConnection);

// this sets op socket to listen and calls each function when it hears the socket id
function onConnection(socket) {
  console.log("a user connected");

  socket.on("disconnect", () => {
    userIds[socket.uid] = { connected: false };
    console.log("user disconnected");
  });

  socket.on("login", uid => login(socket, uid));

  socket.on("makeGameRoom", data => makeGameRoom(socket, data));
  socket.on("enterGameRoom", data => enterGameRoom(socket, data));
  socket.on("joinTeam", data => joinTeam(socket, data));
  socket.on("startGame", roomNumber => startGame(socket, roomNumber));
  socket.on("deleteGameRoom", room => deleteGameRoom(socket, room));
  socket.on("sendAnswer", answer => recordPlayerAnswer(socket, answer));
  socket.on("updateCardOptions", info => updateCardOptions(socket, info));
  socket.on("getRoundScore", roomNumber => sendRoundScore(socket, roomNumber));
  socket.on("sendNextQuestion", roomNumber =>
    sendConsecutiveQuestions(socket, roomNumber)
  );
}

function login(socket, uid) {
  socket.uid = uid;
  userIds[uid] = { connected: true };
  socket.join(uid);
}

function makeGameRoom(socket, { numberOfTeams, uid }) {
  let teamColors = ["#EB4511", "#23C9FF", "#D2FF28", "#FFAD05"];
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

  hostIds = {
    ...hostIds,
    [uid]: { socket: socket.id, room: newRoom.id }
  };

  rooms[newRoom.id] = newRoom;
  socket.emit("makeGameRoom", newRoom);
  socket.join(socket.uid);
  socket.join(newRoom.id);
  console.log(`new room ${newRoom.id} has been created`);
}

function enterGameRoom(socket, data) {
  const { roomId, uid } = data;
  console.log("user id object", userIds[uid]);

  if (rooms[roomId]) {
    socket.emit("enterGameRoom", rooms[roomId]);
    socket.emit(
      "gameMessage",
      `Welcome to ${roomId}! please enter your name and join a team`
    );
    socket.join(roomId);
    console.log(socket.uid + " has joined " + roomId);
  } else {
    socket.emit(
      "gameMessage",
      `Sorry we couldn't find ${roomId}, please try again`
    );
  }
}

function joinTeam(socket, data) {
  const { roomId, team, name, uid } = data;

  let arrayOfTeamsInRoom = Object.keys(rooms[roomId].teams);

  let isOnTeamInRoom = arrayOfTeamsInRoom
    .map(teamInArr =>
      rooms[roomId].teams[teamInArr]
        .map(player => player.id === uid)
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
    socket.to(rooms[roomId].host).emit("updateHostRoom", rooms[roomId]);
    console.log(`${name} has joined ${roomId}`);
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
  rooms[roomId].currentChoice = rooms[roomId].currentChoiceCopy;
  let teams = Object.keys(rooms[roomId].teams);

  let randomArray = shuffle([0, 1, 2, 3]);

  teams.map(team => {
    rooms[roomId].teams[team].map((player, i) => {
      socket.to(player.id).emit("cardMessage", {
        ...testQuestions[questionNumber].cards[randomArray[i]],
        instruction: testQuestions[questionNumber].instruction
      });
    });
  });

  io.in(rooms[roomId].host).emit(
    "gameMessage",
    testQuestions[questionNumber].question
  );
  io.in(rooms[roomId].host).emit(
    "tidbit",
    testQuestions[questionNumber].tidbit
  );
  console.log(`question has been sent to ${roomId}`);
}

function deleteGameRoom(socket, roomNumber) {
  // let roomIndex = rooms.findIndex(obj => obj.id === roomNumber);
  // rooms = [...rooms.slice(0, roomIndex), ...rooms.slice(roomIndex + 1)];
  // console.log(`room ${roomNumber} has been deleted`);
}

function updateCardOptions(socket, info) {
  const { roomId, team, answer, cardText } = info;

  let arrayOfAnswerIndex = [1, 2, 3, 4].map(answer =>
    rooms[roomId].currentChoice[team][answer].findIndex(
      obj => obj.id === socket.uid
    )
  );

  let indexOfOldAnswer = arrayOfAnswerIndex.findIndex(i => i !== -1);
  let oldAnswerKey = indexOfOldAnswer + 1;

  console.log("indexOfOldAnswer", indexOfOldAnswer);
  console.log("arrayOfAnswerIndex", arrayOfAnswerIndex);
  console.log("oldAnswerboth", arrayOfAnswerIndex[indexOfOldAnswer]);
  console.log("oldAnswerKey", oldAnswerKey);

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
            { cardText, id: socket.uid }
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

  console.log(
    "rooms[roomIndex].currentChoice[team]",
    rooms[roomId].currentChoice[team]
  );
  // send updated options to team
  rooms[roomId].teams[team].map(player => {
    io.in(player.id).emit(
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
      io.in(player.id).emit("submitAllowed");
    });
  }
}

function recordPlayerAnswer(
  socket,
  { roomId, team, playersAnswer, correctAnswer }
) {
  if (playersAnswer === correctAnswer) {
    // give points to players team
    rooms[roomId] = {
      ...rooms[roomId],
      roundScores: {
        ...rooms[roomId].roundScores,
        [team]: rooms[roomId].roundScores[team] + 1
      }
    };
    console.log("recordPlayerAnswer correct");

    // socket.emit("showScore", "" + rooms[roomIndex].scores[team]);
    socket.emit("gameMessage", "correct");
  } else {
    // tell them they are shit
    socket.emit("gameMessage", "incorrect");
  }
  console.log("team score", rooms[roomId].scores[team]);
  // need to send back room data to all people in room including host
  socket.to(rooms[roomId].host).emit("updateHostRoom", rooms[roomId]);
}

function sendRoundScore(socket, roomNumber) {
  // let roomIndex = rooms.findIndex(obj => obj.id === roomNumber);
  //map over teams
  // send round score
  // add roundscore to gamescore
  // clear round score
  // Object.keys(rooms[roomIndex].roundScores).map(team =>
  //   rooms[roomIndex].teams[team].map(player =>
  //     socket
  //       .to(player.id)
  //       .emit("scoreMessage", rooms[roomIndex].roundScores[team])
  //   )
  // );
}

function startGame(socket, roomId) {
  io.in(roomId).emit("gameMessage", `game has started in ${roomId}`);

  rooms[roomId] = { ...rooms[roomId], questionNumber: 0 };
}

http.listen(process.env.PORT || 6001, () => {
  console.log("listening on *:6001");
});
