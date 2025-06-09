const socketIo = require("socket.io");

function createSocketServer(httpServer, options = {}) {
  const default_options = {
    cors: {
      origin: [
        "http://localhost:5001", // chat server
        "http://localhost:5000", // flask server
        "http://127.0.0.1:5500", // frontend
      ],
      methods: ["GET", "POST"],
      credentials: true,
    },
  };

  const serverOptions = {
    ...default_options,
    ...options,
  };

  const io = socketIo(httpServer, serverOptions);
  console.log("🔧 Server Socket.io configurato con opzioni:", serverOptions);

  return io;
}

module.exports = createSocketServer ;
