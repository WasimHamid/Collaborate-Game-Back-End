var app = require("express")();
var http = require("http").Server(app);
var io = require("socket.io")(http);

const testQuestions = require("./data3");

let users = [];

let rooms = [];
let userIds = {};

function getNewRoomId() {
  return Math.floor(Math.random() * 9000 + 1000);
}

// this calls onConnection when user connects
io.on("connection", onConnection);

// this sets op socket to listen and calls each function when it hears the socket id
function onConnection(socket) {
  console.log("a user connected");
  users.push({ id: socket.id, connected: true });
  socket.on("disconnect", () => {
    var usersIndex = users.findIndex(user => user.id === socket.id);
    users[usersIndex] = { ...users[usersIndex], id: "", connected: false };
    console.log("user disconnected");
  });
  // socket.on("login", name => console.log(name));
  socket.on("makeGameRoom", teams => makeGameRoom(socket, teams));
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

function makeGameRoom(socket, teams) {
  let teamColors = ["#EB4511", "#23C9FF", "#D2FF28", "#FFAD05"];

  let newRoom = {};
  newRoom.id = getNewRoomId();
  newRoom.name = `room ${rooms.length + 1}`;
  newRoom.teams = {};
  newRoom.scores = {};
  newRoom.roundScores = {};
  newRoom.players = [];
  newRoom.questionNumber = 0;
  newRoom.host = socket.id;
  newRoom.currentChoice = {};
  newRoom.currentChoiceCopy = {};

  for (var i = 0; i < teams; i++) {
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

  rooms.push(newRoom);
  socket.emit("makeGameRoom", newRoom);
  socket.join(newRoom.id);
  userIds = { ...userIds, ["host" + newRoom.id]: socket.id };
  console.log(`new room ${newRoom.id} has been created`);
}

function enterGameRoom(socket, data) {
  let room = rooms.find(obj => obj.id === parseInt(data.room));
  let roomIndex = rooms.findIndex(obj => obj.id === parseInt(data.room));

  if (roomIndex !== -1) {
    rooms = [
      ...rooms.slice(0, roomIndex),
      {
        ...rooms[roomIndex],
        players: [...rooms[roomIndex].players, { id: socket.id }]
      },
      ...rooms.slice(roomIndex + 1)
    ];
    socket.emit("enterGameRoom", room);
    socket.emit(
      "gameMessage",
      `Welcome to ${room.id}! please enter your name and join a team`
    );
    socket.join(room.id);
    console.log(socket.id + " has joined " + room.id);
  } else {
    socket.emit(
      "gameMessage",
      `Sorry we couldn't find ${data.room}, please try again`
    );
  }
}

function joinTeam(socket, data) {
  const { joinedRoom, team, name } = data;
  let roomIndex = rooms.findIndex(obj => obj.id === joinedRoom);

  let playerAlreadyInSpecificTeam =
    rooms[roomIndex].teams[team].findIndex(obj => obj.id === socket.id) !== -1;

  let arrayOfTeamsInRoom = Object.keys(rooms[roomIndex].teams);

  let haveJoinedAnyTeam = arrayOfTeamsInRoom
    .map(teamInArr =>
      rooms[roomIndex].teams[teamInArr]
        .map(player => player.id === socket.id)
        .includes(true)
    )
    .includes(true);

  if (!playerAlreadyInSpecificTeam && !haveJoinedAnyTeam) {
    rooms = [
      ...rooms.slice(0, roomIndex),
      {
        ...rooms[roomIndex],
        teams: {
          ...rooms[roomIndex].teams,
          [team]: [...rooms[roomIndex].teams[team], { id: socket.id, name }]
        }
      },
      ...rooms.slice(roomIndex + 1)
    ];
    socket.emit(
      "gameMessage",
      `you are in the ${team} team in room ${joinedRoom}`
    );
    socket.emit("teamColor", team);
    socket.to(rooms[roomIndex].host).emit("updateHostRoom", rooms[roomIndex]);
    console.log(`${name} has joined ${roomIndex}`);
  } else {
    socket.emit(
      "gameMessage",
      `whoops, you are already in a team in room ${joinedRoom}`
    );
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

function sendConsecutiveQuestions(socket, roomNumber) {
  let roomIndex = rooms.findIndex(obj => obj.id === roomNumber);

  if (rooms[roomIndex].questionNumber < testQuestions.length) {
    //map over teams
    // send round score
    // add roundscore to gamescore
    // clear round score

    sendQuestion(socket, roomNumber, rooms[roomIndex].questionNumber);
    rooms = [
      ...rooms.slice(0, roomIndex),
      {
        ...rooms[roomIndex],
        questionNumber: rooms[roomIndex].questionNumber + 1
      },
      ...rooms.slice(roomIndex + 1)
    ];
  } else {
    io.in(roomNumber).emit("gameMessage", `no more questions`);
  }
}

function sendQuestion(socket, roomNumber, questionNumber = 0) {
  let room = rooms.find(obj => obj.id === roomNumber);
  let roomIndex = rooms.findIndex(obj => obj.id === roomNumber);

  let teams = Object.keys(room.teams);
  let randomArray = shuffle([0, 1, 2, 3]);

  rooms[roomIndex].currentChoice = rooms[roomIndex].currentChoiceCopy;

  teams.map(team => {
    room.teams[team].map((player, i) => {
      socket.to(player.id).emit("cardMessage", {
        ...testQuestions[questionNumber].cards[randomArray[i]],
        instruction: testQuestions[questionNumber].instruction
      });
    });
  });

  io.in(room.host).emit("gameMessage", testQuestions[questionNumber].question);
  io.in(room.host).emit("tidbit", testQuestions[questionNumber].tidbit);

  console.log(`question has been sent to ${room.id}`);
}

function deleteGameRoom(socket, roomNumber) {
  let roomIndex = rooms.findIndex(obj => obj.id === roomNumber);
  rooms = [...rooms.slice(0, roomIndex), ...rooms.slice(roomIndex + 1)];
  console.log(`room ${roomNumber} has been deleted`);
}

function updateCardOptions(socket, info) {
  const { roomNumber, team, answer, cardText } = info;
  let room = rooms.find(obj => obj.id === parseInt(roomNumber));
  let roomIndex = rooms.findIndex(obj => obj.id === parseInt(roomNumber));

  let arrayOfAnswerIndex = [1, 2, 3, 4].map(answer =>
    rooms[roomIndex].currentChoice[team][answer].findIndex(
      obj => obj.id === socket.id
    )
  );

  let indexOfOldAnswer = arrayOfAnswerIndex.findIndex(i => i !== -1);
  let oldAnswerKey = indexOfOldAnswer + 1;

  console.log("indexOfOldAnswer", indexOfOldAnswer);
  console.log("arrayOfAnswerIndex", arrayOfAnswerIndex);
  console.log("oldAnswerboth", arrayOfAnswerIndex[indexOfOldAnswer]);
  console.log("oldAnswerKey", oldAnswerKey);

  if (rooms[roomIndex].currentChoice[team][answer].length < 1) {
    if (indexOfOldAnswer !== -1) {
      rooms[roomIndex].currentChoice[team][oldAnswerKey].splice(
        arrayOfAnswerIndex[indexOfOldAnswer],
        1
      );
    }
    rooms = [
      ...rooms.slice(0, roomIndex),
      {
        ...room,
        currentChoice: {
          ...room.currentChoice,
          [team]: {
            ...room.currentChoice[team],
            [answer]: [
              ...room.currentChoice[team][answer],
              { cardText, id: socket.id }
            ]
          }
        }
      },
      ...rooms.slice(roomIndex + 1)
    ];
  }

  if (oldAnswerKey === answer) {
    rooms[roomIndex].currentChoice[team][oldAnswerKey].splice(
      arrayOfAnswerIndex[indexOfOldAnswer],
      1
    );
  }

  console.log(
    "rooms[roomIndex].currentChoice[team]",
    rooms[roomIndex].currentChoice[team]
  );

  room.teams[team].map(player => {
    io.in(player.id).emit(
      "updateCardOptions",
      rooms[roomIndex].currentChoice[team]
    );
  });
}

function recordPlayerAnswer(
  socket,
  { roomNumber, team, playersAnswer, correctAnswer }
) {
  let roomIndex = rooms.findIndex(obj => obj.id === parseInt(roomNumber));

  if (playersAnswer === correctAnswer) {
    // give points to players team
    rooms = [
      ...rooms.slice(0, roomIndex),
      {
        ...rooms[roomIndex],
        roundScores: {
          ...rooms[roomIndex].roundScores,
          [team]: rooms[roomIndex].roundScores[team] + 1
        }
      },
      ...rooms.slice(roomIndex + 1)
    ];
    console.log("recordPlayerAnswer correct");

    // socket.emit("showScore", "" + rooms[roomIndex].scores[team]);
    socket.emit("gameMessage", "correct");
  } else {
    // tell them they are shit
    socket.emit("gameMessage", "incorrect");
  }
  console.log("team score", rooms[roomIndex].scores[team]);
  // need to send back room data to all people in room including host
  socket.to(roomNumber).emit("updateHostRoom", rooms[roomIndex]);
}

function sendRoundScore(socket, roomNumber) {
  let roomIndex = rooms.findIndex(obj => obj.id === roomNumber);

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

function startGame(socket, roomNumber) {
  io.in(roomNumber).emit("gameMessage", `game has started in ${roomNumber}`);

  let roomIndex = rooms.findIndex(obj => obj.id === roomNumber);
  rooms = [
    ...rooms.slice(0, roomIndex),
    { ...rooms[roomIndex], questionNumber: 0 },
    ...rooms.slice(roomIndex + 1)
  ];
}

http.listen(6001, () => {
  console.log("listening on *:6001");
});
