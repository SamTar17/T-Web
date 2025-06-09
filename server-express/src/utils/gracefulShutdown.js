function gracefulShutdown(server, io, healthMonitor) {
  console.log("🧹 Arresto del server in corso...");

  healthMonitor.stop();

  server.close(() => {
    console.log("🔌 Server HTTP chiuso.");
    process.exit(0);
  });

  io.close(() => {
    console.log("📴 Socket.io chiuso.");
  });
}

module.exports = gracefulShutdown;