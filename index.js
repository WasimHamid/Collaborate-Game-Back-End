var app = require("express")();
var http = require("http").Server(app);
var io = require("socket.io")(http);

let rooms = [];

const testQuestions = require("./data3");

function getNewRoomId() {
  return Math.floor(Math.random() * 9000 + 1000);
}

// this calls onConnection when user connects
io.on("connection", onConnection);

// this sets op socket to listen and calls each function when it hears the socket id
function onConnection(socket) {
  console.log("a user connected");
  socket.on("disconnect", () => {
    console.log("user disconnected");
  });

  socket.on("makeGameRoom", teams => makeGameRoom(socket, teams));
  socket.on("enterGameRoom", data => enterGameRoom(socket, data));
  socket.on("joinTeam", data => joinTeam(socket, data));
  socket.on("startGame", roomNumber => startGame(socket, roomNumber));
  socket.on("deleteGameRoom", room => deleteGameRoom(socket, room));
  socket.on("sendAnswer", answer => recordPlayerAnswer(socket, answer));
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
  newRoom.players = [];
  newRoom.questionNumber = 0;
  newRoom.host = socket.id;

  for (var i = 0; i < teams; i++) {
    newRoom.teams = { ...newRoom.teams, [teamColors[i]]: [] };
    newRoom.scores = { ...newRoom.scores, [teamColors[i]]: 0 };
  }

  rooms.push(newRoom);
  socket.emit("makeGameRoom", newRoom);
  socket.join(newRoom.id);
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
    socket.join(`${room.id}`);
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
  let teams = Object.keys(room.teams);
  let randomArray = shuffle([0, 1, 2, 3]);

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

function recordPlayerAnswer(
  socket,
  { roomId, team, playersAnswer, correctAnswer }
) {
  let roomIndex = rooms.findIndex(obj => obj.id === parseInt(roomId));

  rooms[roomIndex].teams[team].forEach(player => {
    io.in(player.id).emit("updateCardOptions", playersAnswer);
  });

  if (playersAnswer === correctAnswer) {
    // give points to players team
    rooms = [
      ...rooms.slice(0, roomIndex),
      {
        ...rooms[roomIndex],
        scores: {
          ...rooms[roomIndex].scores,
          [team]: rooms[roomIndex].scores[team] + 1
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
  socket.to(roomId).emit("updateHostRoom", rooms[roomIndex]);
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
