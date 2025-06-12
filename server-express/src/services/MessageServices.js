/**
 * MESSAGE SERVICE - Gestione messaggi (estratto da ChatHandler)
 */
const { uniqueTimestampGenerator } = require("../utils/UniqueTimestampGenerator");

class MessageService {
  constructor(proxyService) {
    this.proxyService = proxyService;

    // === PERSISTENCE STATE ===
    this.mode = "normal"; // 'normal' | 'recovery' | 'flushing'
    this.messageQueue = []; // Queue per messaggi in recovery
    this.recoveryTimer = null; // Timer per tentare riconnessione
    this.recoveryInterval = 30000; // Prova recovery ogni 30s
    this.requestTimeout = 5000; // “Se il server non risponde entro 5 secondi, considera la richiesta fallita e lancia un errore.”
    this.maxQueueSize = 1000;
  }

  async saveMessage(messageData) {
    const formattedMessage = this._formatMessage(messageData);
    const isValid = this._validateMessage(formattedMessage);
    if (isValid.isValid) {
      if (this.mode === "normal" || this.mode === "flushing") {
        await this._saveDirectToMongoDB(formattedMessage);
      } else {
        console.warn(`+++ Recovery mode attivo ! mess aggiunto alla queue +++`);
        this._addToQueue(formattedMessage);
      }
    } else {
      console.error(
        "++ ERRORE NEL SALVATAGGIO MESSAGGIO, FORMATO NON VALIDO",
        isValid.errors
      );
      return;
    }
  }

  async getMessagesRoom(roomName) {
    try {
      console.log(`📥 Recupero messaggi room ${roomName} da MongoDB...`);

      const response = await this.proxyService.callMongoDB(
        `/api/messages/${roomName}`,
        "GET"
      );

      return response.data

    } catch (error) {
      console.error(
        `❌ Errore getMessagesFromMongoDB room ${roomName}:`,
        error.message
      );
      return { success: false, error: error.message, messages: [] };
    }
  }

  async getMessagesRoomBefore(roomName,beforeTimestamp) {
    try {
      console.log(`📥 Recupero messaggi room ${roomName} da MongoDB...`);

      const response = await this.proxyService.callMongoDB(
        `/api/messages/${roomName}/before/${beforeTimestamp}`,
        "GET"
      );

      return response.data

    } catch (error) {
      console.error(
        `❌ Errore getMessagesRoomBefore room ${roomName} uts ${beforeTimestamp}:`,
        error.message
      );
      return { success: false, error: error.message, message: []};
    }
  }  

  _formatMessage(messageData) {
    try {
      const formattedMessage = {
        uniqueTimestamp: new uniqueTimestampGenerator(),
        roomName: messageData.roomName,
        userName: messageData.userName,
        message: messageData.message.trim(),
      };
      return formattedMessage;
    } catch (error) {
      console.error(`ERRORE FORMATTAZIONE MESSAGGIO -> ${messageData}`, error);
      throw error;
    }
  }

  _validateMessage(messageData) {
    const errors = [];

    if (!messageData.roomName || messageData.roomName.trim().length === 0) {
      errors.push("roomName è obbligatorio");
    }

    if (!messageData.userName || messageData.userName.trim().length === 0) {
      errors.push("userName è obbligatorio");
    }

    if (!messageData.message || messageData.message.trim().length === 0) {
      errors.push("message è obbligatorio");
    }

    if (messageData.message && messageData.message.length > 1000) {
      errors.push("message troppo lungo (max 1000 caratteri)");
    }

    const isValid = errors.length === 0;

    if (!isValid) {
      console.warn(`⚠️ Messaggio non valido:`, errors);
    }

    return { isValid, errors };
  }

  async _saveDirectToMongoDB(messageData) {
    try {
      const response = await this.proxyService.callMongoDB(
        "/api/messages",
        "POST",
        messageData
      );

      console.log(
        `${response.status} 💾 Messaggio ${messageData.uniqueTimestamp} salvato direttamente`
      );
    } catch (error) {
      console.error(`❌ Errore salvataggio diretto: ${error.message}`);

      // switcho alla recovery mode
      this._activateRecoveryMode();
      this._addToQueue(messageData);
      console.log(
        `📦 Messaggio ${messageData.uniqueTimestamp} aggiunto alla queue dopo fallimento`
      );
    }
  }

  _activateRecoveryMode() {
    if (this.mode === "recovery") {
      return; // Già in recovery mode
    }

    console.log("🚨 ATTIVAZIONE MODALITÀ RECOVERY PERSISTENCE");
    console.log("📦 Tutti i nuovi messaggi andranno in queue locale");

    this.mode = "recovery";
    this._startRecoveryTimer();
  }

  _startRecoveryTimer() {
    if (this.recoveryTimer) {
      return;
    }
    console.log(
      `🔄 Avvio persistence recovery timer (ogni ${
        this.recoveryInterval / 1000
      }s)`
    );

    this.recoveryTimer = setInterval(async () => {
      await this._attemptRecovery();
    }, this.recoveryInterval);
  }

  async _attemptRecovery() {
    console.log("🔍 Persistence: tentativo recovery MongoDB...");

    try {
      // Test con health check
      const response = await this.proxyService.callMongoDB(
        "/api/health",
        "GET");

      if (response.status === 200) {
        console.log("✅ MongoDB disponibile - avvio flush queue");
        await this._executeRecovery();
      } else {
        console.log("⚠️ MongoDB health check non OK - continuo recovery mode");
      }
    } catch (error) {
      console.log(
        `❌ Recovery attempt failed: ${error.message} - riprovo tra ${
          this.recoveryInterval / 1000
        }s`
      );
    }
  }

  async _executeRecovery() {
    console.log("sono in modalità flushing +++");
    this.mode = "flushing";
    const queueSize = this.messageQueue.length;
    console.log(`🔄 Iniziando flush di ${queueSize} messaggi dalla queue...`);
    let successCount = 0;
    let failCount = 0;

    // Processo la queue in modo sequenziale per evitare overload
    for (const queuedMessage of this.messageQueue) {
      try {
        await _saveDirectToMongoDB(queuedMessage)
        successCount++;
        console.log(
          `💾 Queue flush: salvato ${queuedMessage.messageData.uniqueTimestamp}`
        );
      } catch (error) {
        failCount++;
        this.stats.failedMessages++;
        console.error(
          `❌ Queue flush: fallito ${queuedMessage.messageData.uniqueTimestamp} - ${error.message}`
        );
        this.mode = "recovery";
        console.log("❌ Flush fallito - rimango in recovery mode");
        return;
      }
    }

    console.log(
      `✅ Persistence recovery completato: ${successCount} successi, ${failCount} fallimenti`
    );
    this.mode = "normal"; // Torna normal mode
    this._stopRecoveryTimer(); // Ferma timer
    this.messageQueue = []; // Svuota queue

    console.log("🟢 PERSISTENCE MODALITÀ NORMAL RIPRISTINATA");
  }

  _stopRecoveryTimer() {
    if (this.recoveryTimer) {
      clearInterval(this.recoveryTimer);
      this.recoveryTimer = null;
      console.log("🛑 Persistence recovery timer fermato");
    }
  }

  _addToQueue(messageData) {
    const queueEntry = {
      messageData: messageData,
      queuedAt: new Date().toISOString(),
      attempts: 0,
    };

    this.messageQueue.push(queueEntry);

    console.log(
      `📦 Persistence queue size: ${this.messageQueue.length} messaggi`
    );

    // Safety: limite queue per evitare memory leak
    if (this.messageQueue.length > this.maxQueueSize) {
      const removed = this.messageQueue.shift(); // FIFO: rimuovi il più vecchio
      console.warn(
        `⚠️ Persistence queue overflow - rimosso messaggio ${removed.messageData.uniqueTimestamp}`
      );
    }
  }
}

module.exports = MessageService;
