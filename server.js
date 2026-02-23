const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

const rooms = {};

function generateCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789$";
  let code = "";
  for (let i = 0; i < 5; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

io.on("connection", (socket) => {

  socket.on("createRoom", () => {
    const code = generateCode();
    rooms[code] = { players: {} };

    rooms[code].players[socket.id] = { x: 100, y: 100 };

    socket.join(code);
    socket.emit("roomCreated", code);
    socket.emit("updatePlayers", rooms[code].players);
  });

  socket.on("joinRoom", (code) => {
    if (!rooms[code] || Object.keys(rooms[code].players).length >= 4) {
      socket.emit("errorRoom");
      return;
    }

    rooms[code].players[socket.id] = { x: 200, y: 200 };

    socket.join(code);
    io.to(code).emit("updatePlayers", rooms[code].players);
  });

  socket.on("move", ({ code, x, y }) => {
    if (rooms[code] && rooms[code].players[socket.id]) {
      rooms[code].players[socket.id] = { x, y };
      io.to(code).emit("updatePlayers", rooms[code].players);
    }
  });

  socket.on("disconnect", () => {
    for (let code in rooms) {
      if (rooms[code].players[socket.id]) {
        delete rooms[code].players[socket.id];
        io.to(code).emit("updatePlayers", rooms[code].players);
      }
    }
  });

});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log("Server running on", PORT);
});
