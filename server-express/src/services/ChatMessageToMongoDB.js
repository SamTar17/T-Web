const axios = require('axios');
/**
 * MessagePersistenceService
 * 
 * Responsabilità:
 * - Salvataggio messaggi a MongoDB
 * - Recovery automatico quando MongoDB è down
 * - Queue management con retry logic
 * - Status monitoring del sistema di persistenza
 * - normal, recovery,flushing mode
*/
class ChatMessageToMongoBD {
  constructor() {
    // Configuration
    this.mongoUrl = process.env.MONGO_SERVER_URL;
    
    // === PERSISTENCE STATE ===
    this.mode = 'normal';              // 'normal' | 'recovery'
    this.messageQueue = [];            // Queue per messaggi in recovery
    this.recoveryTimer = null;         // Timer per tentare riconnessione
    this.recoveryInterval = 30000;     // Prova recovery ogni 30s
    this.requestTimeout = 5000;        // “Se il server non risponde entro 5 secondi, considera la richiesta fallita e lancia un errore.”
    this.maxQueueSize = 1000;          // Limite queue per safety
    
    console.log('💾 MessagePersistenceService inizializzato');
    console.log(`📍 MongoDB URL: ${this.mongoUrl}`);
  }

  /**
   * MAIN PUBLIC API: Salva un messaggio
   * Gestisce automaticamente normal/recovery mode
   */
  async saveMessage(messageData) {
    
    if (this.mode === 'normal' || this.mode === 'flushing' ) {
      await this._saveDirectToMongoDB(messageData);
    } else {
      console.log(`📦 Recovery mode attivo - messaggio aggiunto alla queue`);
      this._addToQueue(messageData);
    }
  }

  /**
   * Salvataggio diretto a MongoDB (Normal Mode)
   */
  async _saveDirectToMongoDB(messageData) {
    try {
      const response = await axios.post(`${this.mongoUrl}/api/messages`, messageData, {
        timeout: this.requestTimeout
      });
      
      console.log(`💾 Messaggio ${messageData.uniqueTimestamp} salvato direttamente`);
      
    } catch (error) {
      console.error(`❌ Errore salvataggio diretto: ${error.message}`);
      
      // CRITICAL: Switch to recovery mode
      this._activateRecoveryMode();
      this._addToQueue(messageData);
      console.log(`📦 Messaggio ${messageData.uniqueTimestamp} aggiunto alla queue dopo fallimento`);
    }
  }

  /**
   * Attiva modalità recovery
   */
  _activateRecoveryMode() {
    if (this.mode === 'recovery') {
      return; // Già in recovery mode
    }
    
    console.log('🚨 ATTIVAZIONE MODALITÀ RECOVERY PERSISTENCE');
    console.log('📦 Tutti i nuovi messaggi andranno in queue locale');
    
    this.mode = 'recovery';
    this._startRecoveryTimer();
  }

  /**
   * Avvia timer per tentare recovery
   */
  _startRecoveryTimer() {
    if (this.recoveryTimer) {
      return; // Timer già attivo
    }
    
    console.log(`🔄 Avvio persistence recovery timer (ogni ${this.recoveryInterval/1000}s)`);
    
    this.recoveryTimer = setInterval(async () => {
      await this._attemptRecovery();
    }, this.recoveryInterval);
  }

  /**
   * Tenta recovery della connessione MongoDB
   */
  async _attemptRecovery() {
    console.log('🔍 Persistence: tentativo recovery MongoDB...');
    
    try {
      // Test con health check
      const response = await axios.get(`${this.mongoUrl}/api/health`, {
        timeout: this.requestTimeout
      });
      
      if (response.status === 200) {
        console.log('✅ MongoDB disponibile - avvio flush queue');
        await this._executeRecovery();
      } else {
        console.log('⚠️ MongoDB health check non OK - continuo recovery mode');
      }
      
    } catch (error) {
      console.log(`❌ Recovery attempt failed: ${error.message} - riprovo tra ${this.recoveryInterval/1000}s`);
    }
  }

  /**
   * Esegue recovery: svuota queue e torna a normal mode
   */
  async _executeRecovery() {

    //QUI DEVO SETTARE SUBITO CHE SONO USCITO DALLA RECOVERY TO DO TO DO TOD O
    console.log('sono in modalità flushing +++')
    this.mode = 'flushing';
    const queueSize = this.messageQueue.length;
    console.log(`🔄 Iniziando flush di ${queueSize} messaggi dalla queue...`);
    
    let successCount = 0;
    let failCount = 0;
    
    // Processo la queue in modo sequenziale per evitare overload
    for (const queuedMessage of this.messageQueue) {
      try {
        await axios.post(`${this.mongoUrl}/api/messages`, queuedMessage.messageData, {
          timeout: this.requestTimeout
        });
        
        successCount++;

        console.log(`💾 Queue flush: salvato ${queuedMessage.messageData.uniqueTimestamp}`);
        
      } catch (error) {
        failCount++;
        this.stats.failedMessages++;
        console.error(`❌ Queue flush: fallito ${queuedMessage.messageData.uniqueTimestamp} - ${error.message}`);
        this.mode = 'recovery'
        // Se anche il flush fallisce, rimani in recovery mode
        console.log('❌ Flush fallito - rimango in recovery mode');
        return;
      }
    }
    
    // SUCCESS: svuota queue e torna normale
    console.log(`✅ Persistence recovery completato: ${successCount} successi, ${failCount} fallimenti`);
    this.mode = 'normal';             // Torna normal mode
    this._stopRecoveryTimer();        // Ferma timer
    this.messageQueue = [];           // Svuota queue

    
    console.log('🟢 PERSISTENCE MODALITÀ NORMAL RIPRISTINATA');
  }

  /**
   * Ferma recovery timer
   */
  _stopRecoveryTimer() {
    if (this.recoveryTimer) {
      clearInterval(this.recoveryTimer);
      this.recoveryTimer = null;
      console.log('🛑 Persistence recovery timer fermato');
    }
  }

  /**
   * Aggiunge messaggio alla queue con metadata
   */
  _addToQueue(messageData) {
    const queueEntry = {
      messageData: messageData,
      queuedAt: new Date().toISOString(),
      attempts: 0
    };
    
    this.messageQueue.push(queueEntry);
    
    console.log(`📦 Persistence queue size: ${this.messageQueue.length} messaggi`);
    
    // Safety: limite queue per evitare memory leak
    if (this.messageQueue.length > this.maxQueueSize) {
      const removed = this.messageQueue.shift(); // FIFO: rimuovi il più vecchio
      console.warn(`⚠️ Persistence queue overflow - rimosso messaggio ${removed.messageData.uniqueTimestamp}`);
    }
  }

  /**
   * PUBLIC API: Clear queue (DANGEROUS - solo per emergenze)
   */
  clearQueue() {
    const clearedCount = this.messageQueue.length;
    this.messageQueue = [];
    console.warn(`🗑️ QUEUE CLEARED: ${clearedCount} messaggi rimossi PERMANENTEMENTE`);
    return clearedCount;
  }

  /**
   * Cleanup per graceful shutdown
   */
  shutdown() {
    console.log('🛑 MessagePersistenceService shutdown...');
    this._stopRecoveryTimer();
    
    if (this.messageQueue.length > 0) {
      console.warn(`⚠️ Shutdown con ${this.messageQueue.length} messaggi in queue non ancora salvati`);
      console.log('💡 Considera di implementare persistence queue su disco per recovery completo');
    }
  }
}

module.exports = ChatMessageToMongoBD;