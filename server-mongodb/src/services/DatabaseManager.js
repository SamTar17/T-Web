const mongoose = require('mongoose');

class DatabaseManager {
  constructor() {
    // Riferimento alle collezioni del database
    this.connection = null;  
    this.isConnected = false
    
    this.connectionAttempts = 0;
    this.maxRetryAttempts = 5;
    this.retryDelay = 10000; //connettiti ogni 10s 
  }

  /**
   * connessione con il database mongo 
   */
  async connect() {
    const uri = process.env.MONGODB_URI;
    
    try {

          if (this.isConnected){
            console.log('gia connesso al db mongo')
            return this.connection 
          }

          console.log('🔌 Connessione database film_mongo collection MESSAGES...');
      
      // CREA CONNESSIONE SPECIFICA per database "messages"
      this.connection = await mongoose.createConnection(`${uri}/messages`, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        retryWrites: true,
        retryReads: true
      });
      
      // Event listeners per questa connessione
      this.connection.on('connected', () => {
        this.isConnected = true;
        console.log('✅ Database mongo connesso!');
      });
      
      this.connection.on('error', (error) => {
        this.isConnected.messages = false;
        console.error('❌ Errore db mongo:', error.message);
      });
      
    } catch (error) {
      console.error('❌ Errore di  connessione db mongo -> DatabseManager -> connect:', error.message);
      throw error;
    }
  }


  getReviewsCollection() {
    if (!this.isConnected || !this.connection) {
      throw new Error('Database non connesso. Chiamare connect() prima di accedere alle collezioni.');
    }

    return this.connection.db.collection('reviews');
  }


  getMessagesCollection() {
    if (!this.isConnected || !this.connection) {
      throw new Error('Database non connesso. Chiamare connect() prima di accedere alle collezioni.');
    }
    
    return this.connection.db.collection('messages');
  }

 
  getConnection() {
    if (!this.isConnected || !this.connection) {
      throw new Error('Database non connesso. Chiamare connect() prima di accedere alla connessione.');
    }
    
    return this.connection;
  }

  async disconnect() {
    try {
      if (this.connection) {
        await this.connection.close();
        console.log('🔌 Connessione database chiusa correttamente');
      }
      
      this.isConnected = false;
      this.connection = null;
      
    } catch (error) {
      console.error('❌ Errore durante chiusura connessione:', error.message);
      throw error;
    }
  }

  /**
   * INFORMAZIONI DI STATO (utile per debugging e monitoring)
   */
  getStatus() {
    return {
      isConnected: this.isConnected,
      readyState: this.connection ? this.connection.readyState : 'disconnected',
      host: this.dbConfig.host,
      port: this.dbConfig.port,
      database: this.dbConfig.database,
      connectionsInPool: this.connection ? this.connection.db.serverConfig.connections().length : 0
    };
  }
}

//  singleton
module.exports = new DatabaseManager();