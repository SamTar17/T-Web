const socketIo = require("socket.io");
const {socketConfig} =  require('../config/index')

function createSocketServer(httpServer, options = socketConfig) {

  const io = socketIo(httpServer, options);
  console.log("Server socket configurato");
  return io;
}
module.exports = createSocketServer ;
