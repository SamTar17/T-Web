require('dotenv').config();
const { app, databaseManager } = require('./src/app');
const { startCleanupInterval } = require('./src/services/CleanupInactiveRooms');
const PORT = process.env.PORT;

async function startServer() {
  try {
    console.log('🎬 === FILM DATABASE - SERVER MONGODB ===');
    
    console.log('🔌 Connessione al database...');
    await databaseManager.connect();
    console.log('✅ Database connesso!');
    
    startCleanupInterval();
    
    // Avvia server
    const server = app.listen(PORT, () => {
      console.log('🚀 MongoDB Server avviato con successo!');
      console.log(`📡 Server in ascolto su http://localhost:${PORT}`);
    });

    process.on('SIGINT', async () => {
      console.log('\n🛑 Spegnimento server...');
      server.close();
      await databaseManager.disconnect();
      console.log('👋 Spegnimento completato');
      process.exit(0);
    });
    
  } catch (error) {
    console.error('💥 Errore critico:', error.message);
    process.exit(1);
  }
}

startServer();