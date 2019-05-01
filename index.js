var app = require("express")();
var http = require("http").Server(app);
var io = require("socket.io")(http);

let rooms = [];

function getNewRoomId() {
  return Math.floor(Math.random() * 9000 + 1000);
}

io.on("connection", socket => {
  console.log("a user connected");
  socket.on("disconnect", () => {
    console.log("user disconnected");
  });

  socket.on("makeGameRoom", () => {
    let newRoom = {};
    newRoom.id = getNewRoomId();
    newRoom.name = `room ${rooms.length + 1}`;
    newRoom.teams = { red: [], blue: [], yellow: [], green: [] };

    console.log(newRoom);
    rooms.push(newRoom);
    socket.emit("makeGameRoom", newRoom);
  });

  socket.on("enterGameRoom", data => {
    console.log(data);
    let room = rooms.find(obj => obj.id == data);
    socket.emit("enterGameRoom", room);
  });

  socket.on("joinTeam", data => {
    const { joinedRoom, team } = data;
    let roomIndex = rooms.findIndex(obj => obj.id === joinedRoom);
    rooms = [
      ...rooms.slice(0, roomIndex),
      {
        ...rooms[roomIndex],
        teams: {
          ...rooms[roomIndex].teams,
          [team]: [...rooms[roomIndex].teams[team], socket.id]
        },
        ...rooms.slice(roomIndex + 1)
      }
    ];
    console.log(rooms);
  });
});

http.listen(6001, function() {
  console.log("listening on *:6001");
});
