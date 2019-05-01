var app = require("express")();
var http = require("http").Server(app);
var io = require("socket.io")(http);

let rooms = [];

function getNewRoomId() {
  return Math.floor(Math.random() * 9000 + 1000);
}

io.on("connection", socket => {
  console.log("a user connected");

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
});

http.listen(6001, function() {
  console.log("listening on *:6001");
});
