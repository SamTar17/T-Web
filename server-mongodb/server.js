require('dotenv').config();

// Import dell'app configurata + database manager
const { app, databaseManager } = require('./src/app');

const PORT = process.env.PORT;

async function startServer() {
  try {
    console.log('🎬 === FILM DATABASE - SERVER MONGODB ===');
    console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
    
    // STEP 1: CONNESSIONE AL DATABASE
    console.log('🔌 Connessione al database...');
    await databaseManager.connectAll();
    console.log('✅ Database connesso!');
    
    // STEP 2: AVVIO SERVER HTTP
    const server = app.listen(PORT, () => {
      console.log('🚀 MongoDB Server avviato con successo!');
      console.log(`📡 Server in ascolto su http://localhost:${PORT}`);
      console.log('📊 Endpoints disponibili:');
      console.log('   - GET /api/health (Health check)');
      console.log('   - [TODO] POST/GET /api/messages (Gestione messaggi)');
      console.log('=====================================\n');
    });

    // STEP 3: Setup gestione shutdown graceful
    setupGracefulShutdown(server);
    
  } catch (error) {
    console.error('💥 Errore critico durante avvio server:', error.message);
    console.error('🔍 Possibili cause:');
    console.error('   - MongoDB non è in esecuzione');
    console.error('   - Porta già in uso');
    console.error('   - Errore di configurazione');
    process.exit(1);
  }
}

/**
 * Gestione spegnimento pulito del server
 */
function setupGracefulShutdown(server) {
  
  function shutdownHandler(signal) {
    console.log(`\n${signal} ricevuto, spegnimento server...`);
    
    // 1. Prima chiudi il server HTTP (non accetta più richieste)
    server.close(async () => {
      console.log('✅ Server HTTP chiuso correttamente');
      
      try {
        // 2. POI disconnetti il database
        await databaseManager.disconnect();
        console.log('✅ Database disconnesso correttamente');
        
        console.log('👋 Spegnimento completato');
        process.exit(0);
        
      } catch (error) {
        console.error('❌ Errore durante chiusura database:', error.message);
        process.exit(1);
      }
    });
  }

  // Listeners per segnali di sistema
  process.on('SIGTERM', () => shutdownHandler('SIGTERM'));
  process.on('SIGINT', () => shutdownHandler('SIGINT'));
}

// AVVIO DELL'APPLICAZIONE
startServer();