class MessageService {
  constructor(proxyService, UniqueTimestampGenerator) {
    this.proxyService = proxyService;
    this.uniqueTimestampGenerator = UniqueTimestampGenerator;

    // === RECOVERY ATTRIBUTI ===
    
    this.mode = "normal"; // 'normal' | 'recovery' | 'flushing'
    this.messageQueue = []; // Queue per messaggi in recovery
    this.recoveryTimer = null; // Timer per tentare riconnessione
    this.recoveryInterval = 30000; // Prova recovery ogni 30s
    this.requestTimeout = 5000; // “Se il server non risponde entro 5 secondi, considera la richiesta fallita e lancia un errore.”
    this.maxQueueSize = 1000;
  }

  async saveMessage(messageData) {
    try {
      //validazione di messageData
      const isValidMessageData = this._validateMessageData(messageData);

      if (!isValidMessageData.isValid) {
        //fallisce per qualche ragione la validazione del messaggio
        // devo costruire un errore che verrà passato al middleware

        error = {
          name: "ValidationError",
          status: 400,
          message: "Errore nella validazione messageData in saveMessage",
          additionalDetails: isValidMessageData.errors,
        };

        throw error;
      }

      //formatto il messaggio per il salvataggio

      const formattedMessage = this._formatMessage(messageData);

      if (this.mode == "normal" || this.mode === "flushing") {
        await this._saveDirectToMongoDB(formattedMessage);
      } else {
        console.warn(
          `+++ Recovery mode attivo -> mess aggiunto alla queue +++`
        );
        this._addToQueue(formattedMessage);
      }
    } catch (error) {
      console.error("errore in message services -> saveMessage");
      throw error;
    }
  }

  async getMessagesRoom(roomName) {
    try {
      console.log(`📥 Recupero messaggi room ${roomName} da MongoDB...`);

      const response = await this.proxyService.callMongoDB(
        `/api/messages/${roomName}`,
        "GET"
      );

      return response.data;

    } catch (error) {
      console.error(
        `--- Errore getMessagesFromMongoDB room ${roomName}: --- `,
        error.message
      );

      throw error;
    }
  }

  async getMessagesRoomBefore(roomName, beforeTimestamp) {
    try {
      console.log(`--- Recupero precedenti messaggi room ${roomName} da MongoDB... ---`);

      const response = await this.proxyService.callMongoDB(
        `/api/messages/${roomName}/before/${beforeTimestamp}`,
        "GET"
      );

      return response.data;

    } catch (error) {
      console.error(
        `-- Errore getMessagesRoomBefore room ${roomName} uts ${beforeTimestamp}:`,
        error.message
      );
     throw error;
    }
  }

  _formatMessage(messageData) {
    try {
      const formattedMessage = {
        uniqueTimestamp: this.uniqueTimestampGenerator.generateId(),
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

  _validateMessageData(messageData) {
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

      this._activateRecoveryMode();
      this._addToQueue(messageData);
      console.log(
        `📦 Messaggio ${messageData.uniqueTimestamp} aggiunto alla queue dopo fallimento`
      );
    }
  }

//======== RECOVERY LOGICA ============

  _activateRecoveryMode() {
    if (this.mode === "recovery") {
      return; //già in recovery mode
    }

    console.warn("🚨 ATTIVAZIONE MODALITÀ RECOVERY PERSISTENCE");
    console.warn("📦 Tutti i nuovi messaggi andranno in queue locale");

    this.mode = "recovery";
    this._startRecoveryTimer();
  }

  _startRecoveryTimer() {
    if (this.recoveryTimer) {
      return;
    }

    this.recoveryTimer = setInterval(async () => {
      await this._attemptRecovery();
    }, this.recoveryInterval);
  }

  async _attemptRecovery() {
    console.log("++++ tentativo recovery MongoDB... +++");
    try {
      // Test con health check
      const response = await this.proxyService.callMongoDB(
        "/api/health",
        "GET"
      );

      if (response.status === 200) {
        console.log("+++ MongoDB disponibile - avvio flush queue");
        await this._executeRecovery();
      } else {
        console.log("⚠️ continuo recovery mode");
      }
    } catch (error) {
      console.log(
        `Recovery fallita: ${error.message} - riprovo tra ${
          this.recoveryInterval / 1000
        }s`
      );
      //credo non serva far risalire l erroe uqi
    }
  }

  async _executeRecovery() {
    console.log("+++ sono in modalità flushing +++");
    this.mode = "flushing";
    const queueSize = this.messageQueue.length;
    console.log(
      `+++ Iniziando flush di ${queueSize} messaggi dalla queue... +++ \n`
    );
    let successCount = 0;

    // Processo la queue in modo sequenziale per evitare overload

    while (this.messageQueue.length > 0) {
      const queuedMessage = this.messageQueue[0];
      try {
        await _saveDirectToMongoDB(queuedMessage);
        successCount++;
        this.messageQueue.shift(); // FIFO
      } catch (error) {
        console.error(
          `---- Queue flush: fallito ${queuedMessage.messageData.uniqueTimestamp} - ${error.message} ---- \n`
        );
        this.mode = "recovery";
        console.log(" Flush fallito -switcho da flushing a recovery");
        return; //esco dal while loop e dalla funzione
      }
    }

    console.log(`✅ Persistence recovery completato: ${successCount} successi`);

    this.mode = "normal"; // Torna normal mode
    this._stopRecoveryTimer(); // Ferma timer
    this.messageQueue = []; // Svuota queue

    console.log("🟢 MODALITÀ NORMAL RIPRISTINATA 🟢");
  }

  _stopRecoveryTimer() {
    if (this.recoveryTimer) {
      clearInterval(this.recoveryTimer);
      this.recoveryTimer = null;
    }
  }

  _addToQueue(messageData) {
    this.messageQueue.push(messageData);

    //evitare memory leak
    if (this.messageQueue.length > this.maxQueueSize) {
      const removed = this.messageQueue.shift(); // FIFO: rimuovi il più vecchio
      console.warn(
        `⚠️ Persistence queue overflow - rimosso messaggio ${removed.messageData.uniqueTimestamp}`
      );
    }
  }
}

module.exports = MessageService;
