var app = require("express")();
var http = require("http").Server(app);
var io = require("socket.io")(http);

let rooms = [];

function getNewRoomId() {
  return Math.floor(Math.random() * 9000 + 1000);
}

io.on("connection", onConnection(socket));

function onConnection(socket) {
  console.log("a user connected");
  socket.on("disconnect", () => {
    console.log("user disconnected");
  });

  socket.on("makeGameRoom", () => {
    let newRoom = {};
    newRoom.id = getNewRoomId();
    newRoom.name = `room ${rooms.length + 1}`;
    newRoom.players = [];

    console.log(newRoom);
    rooms.push(newRoom);
    socket.emit("makeGameRoom", newRoom);
  });

  socket.on("enterGameRoom", data => {
    console.log(data);
    let room = rooms.find(obj => obj.id == data);
    socket.emit("enterGameRoom", room);
    socket.emit("gameMessage", `you have entered room ${room.id}`);

    socket.join(`${room.id}`);
    socket.broadcast
      .to(`${room.id}`)
      .emit("gameMessage", "a new player has joined");
  });

  socket.on("joinTeam", data => {
    const { joinedRoom, team } = data;
    let roomIndex = rooms.findIndex(obj => obj.id === joinedRoom);
    let playerIndex = rooms[roomIndex].players.findIndex(
      obj => obj.id === socket.id
    );
    if (playerIndex === -1) {
      rooms = [
        ...rooms.slice(0, roomIndex),
        {
          ...rooms[roomIndex],
          players: [...rooms[roomIndex].players, { id: socket.id, team }]
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
        `whoops, you are already on the ${
          rooms[roomIndex].players[playerIndex].team
        } team in room ${joinedRoom}`
      );
    }
    console.log(rooms[0].players);
  });

  socket.on("startGame", () => {
    socket.emit("gameMessage", `you are`);
  });
}

http.listen(6001, function() {
  console.log("listening on *:6001");
});
