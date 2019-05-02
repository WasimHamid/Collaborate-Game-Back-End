var app = require("express")();
var http = require("http").Server(app);
var io = require("socket.io")(http);

let rooms = [];

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
  socket.on("enterGameRoom", data => enterGameRoom(data, socket));
  socket.on("joinTeam", data => joinTeam(data, socket));
  socket.on("startGame", joinedRoom => {
    io.in(`${joinedRoom}`).emit(
      "gameMessage",
      `game has started in ${joinedRoom}`
    );
  });
}

function makeGameRoom(socket, teams) {
  let teamColors = ["red", "blue", "yellow", "green"];
  let newRoom = {};
  newRoom.id = getNewRoomId();
  newRoom.name = `room ${rooms.length + 1}`;
  newRoom.teams = {};

  for (var i = 0; i < teams; i++) {
    newRoom.teams = { ...newRoom.teams, [teamColors[i]]: [] };
  }
  console.log(newRoom);
  rooms.push(newRoom);
  socket.emit("makeGameRoom", newRoom);
  socket.join(`${newRoom.id}`);
}

function enterGameRoom(data, socket) {
  console.log(data);
  let room = rooms.find(obj => obj.id == data);
  socket.emit("enterGameRoom", room);
  socket.emit("gameMessage", `you have entered room ${room.id}`);
  socket.join(`${room.id}`);
  socket.broadcast
    .to(`${room.id}`)
    .emit("gameMessage", "a new player has joined");
}

function joinTeam(data, socket) {
  const { joinedRoom, team } = data;
  let roomIndex = rooms.findIndex(obj => obj.id === joinedRoom);

  let playerIndex = rooms[roomIndex].teams[team].findIndex(
    obj => obj.id === socket.id
  );

  console.log("playerindex", playerIndex);

  if (playerIndex === -1) {
    rooms = [
      ...rooms.slice(0, roomIndex),
      {
        ...rooms[roomIndex],
        teams: {
          ...rooms[roomIndex].teams,
          [team]: [...rooms[roomIndex].teams[team], { id: socket.id }]
        }
      },
      ...rooms.slice(roomIndex + 1)
    ];
    socket.emit(
      "gameMessage",
      `you are in the ${team} team in room ${joinedRoom}`
    );
  } else {
    socket.emit(
      "gameMessage",
      `whoops, you are already in a team in room ${joinedRoom}`
    );
  }
  // console.log(rooms[0].players);
}

http.listen(6001, function() {
  console.log("listening on *:6001");
});
