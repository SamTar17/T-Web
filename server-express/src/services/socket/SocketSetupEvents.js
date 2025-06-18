const connectionManager  = require('./services/ConnectionManager');
const SocketController = require('./controllers/SocketController');

function setupSocketEvents(io) {
  console.log('🔌 Configurazione eventi Socket.io...');
  
  const socketController = new SocketController(connectionManager, io);
  
  io.on('connection', (socket) => {
    console.log(`🔗 Nuova connessione: ${socket.id}`);
    socketController.handleConnection(socket);
    
    socket.on('send_message', (data) => {
      socketController.handleSendMessage(socket, data);
    });
    
    socket.on('join_room', (data) => {
      socketController.handleJoinRoom(socket, data);
    });
    
    socket.on('leave_room', (data) => {
      socketController.handleLeaveRoom(socket, data);
    });
    
    socket.on('create_room', (data) => {
      socketController.handleCreateRoom(socket, data);
    });
    
    socket.on('get_room_list', (data) => {
      socketController.handleGetRoomList(socket, data);
    });
    
    // === EVENTI DI SISTEMA ===
    socket.on('disconnect', (reason) => {
      socketController.handleDisconnection(socket, reason);
    });
    
    socket.on('error', (error) => {
      console.error(`🚨 Errore socket ${socket.id}:`, error);
      socketController.handleError(socket, error);
    });
  });
  
  return io;
}

module.exports = setupSocketEvents;