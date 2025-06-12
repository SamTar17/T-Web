function gracefulShutdown(server, io) {



  io.close(() => {
    console.log("Socket.io chiuso.");
  });
  server.close(() => {
    console.log("Server HTTP chiuso.");
    process.exit(0);
  });
}

module.exports = gracefulShutdown;
