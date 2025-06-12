/**
 *  Gestore delle connessioni Client connessioni
 * 
 */

class ConnectionService {
  constructor() {
    this.clientsData = new Map();
    this.stats = {
      totalConnections: 0,
      currentConnections: 0
    };
    
  }

  registerConnection(socketId, initialData = {}) {
    if (this.hasConnection(socketId)) {
      console.warn(`Connessione ${socketId} già registrata`);
      return false;
    }

    const connectionData = {
      socketId: socketId,
      connectedAt: new Date().toISOString(),
      username: initialData.username || null,
      lastActivity: new Date().toISOString(),
      ...initialData
    };

    this.clientsData.set(socketId, connectionData);
    this.stats.totalConnections += 1;
    this.stats.currentConnections += 1;

    console.log(`✅ Connessione registrata: ${socketId}`);
    console.log(`📊 Connessioni attuali: ${this.stats.currentConnections}`);

    return true;
  }

  /**
   * Rimuovi connessione
   */
  removeConnection(socketId) {
    const connection = this.getConnection(socketId);

    if (!connection) {
      console.warn(`⚠️ Tentativo di rimuovere connessione inesistente: ${socketId}`);
      return false;
    }

    this.clientsData.delete(socketId);
    this.stats.currentConnections -= 1;
    
    console.log(`❌ Connessione rimossa: ${socketId}`);
    console.log(`📊 Connessioni rimanenti: ${this.stats.currentConnections}`);
    
    return true;
  }

  /**
   * Ottieni dati connessione
   */
  getConnection(socketId) {
    return this.clientsData.get(socketId);
  }

  /**
   * Verifica se connessione esiste
   */
  hasConnection(socketId) {
    return this.clientsData.has(socketId);
  }

  /**
   * Ottieni tutte le connessioni
   */
  getAllConnections() {
    return Array.from(this.clientsData.values());
  }

  /**
   * Aggiorna dati connessione
   */
  updateConnection(socketId, updateData) {
    const connection = this.getConnection(socketId);
    
    if (!connection) {
      console.warn(`⚠️ Tentativo di aggiornare connessione inesistente: ${socketId}`);
      return false;
    }

    // Aggiorna dati
    Object.assign(connection, updateData);
    connection.lastActivity = new Date().toISOString();

    console.log(`🔄 Connessione aggiornata: ${socketId}`);
    return true;
  }

  /**
   * Ottieni statistiche
   */
  getStats() {
    return {
      ...this.stats,
      activeConnections: this.clientsData.size
    };
  }
}

module.exports = ConnectionService;