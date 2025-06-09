const mongoose = require('mongoose');
const databaseManager = require('../../../services/DatabaseManager')
/**
 * Schema per i messaggi della chat
 * Ogni documento rappresenta un singolo messaggio in una room
 */
const messageSchema = new mongoose.Schema({
  // ID univoco generato dal nostro IdGenerator (timestamp_counter)
  messageId: {
    type: String,
    required: true,
    unique: true,
    index: true  // Index per query veloci by messageId forse da levare 
  },
  
  // Nome della room dove è stato inviato il messaggio
  roomName: {
    type: String,
    required: true,
    trim: true,        // Rimuove spazi all'inizio/fine
    lowercase: true,   // Normalizza in lowercase
    index: true        // Index per query per room
  },
  
  // Username dell'utente (anonimo, non collegato ad account)
  userName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50     // Limitiamo lunghezza username da limitare anche in fase di ''login''
  },
  
  // Contenuto del messaggio
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100000   // Limitiamo lunghezza messaggio stessa cosa di sopra 
  },
  
  // Timestamp del messaggio (per ordinamento cronologico)
  timestamp: {
    type: Date,
    required: true,
    index: true       // Index per ordinamento temporale
  }
}, {
  // Opzioni dello schema
  timestamps: true,   // Aggiunge automaticamente createdAt e updatedAt
  collection: 'messages'  // Nome esplicito della collezione
});

/**
 * INDEX COMPOSTO OTTIMIZZATO
 * roomName + timestamp (decrescente) per query:
 * "Ultimi N messaggi della room X ordinati dal più recente"
 */
messageSchema.index({ roomName: 1, timestamp: -1 });

/**
 * METODO STATICO: Recupera ultimi messaggi di una room
 * @param {string} roomName - Nome della room
 * @param {number} limit - Numero massimo di messaggi (default: 100)
 * @returns {Promise<Array>} Array di messaggi ordinati dal più recente
 */
messageSchema.statics.getLatestMessages = function(roomName, limit = 100) {
  return this.find({ roomName })
    .sort({ timestamp: -1 })    // Dal più recente al più vecchio
    .limit(limit)
    .select('-__v')             // Escludi versioning field
    .lean();                    // Ritorna plain objects (più veloce)
};

/**
 * METODO STATICO: Recupera messaggi precedenti (paginazione)
 * @param {string} roomName - Nome della room  
 * @param {Date} beforeTimestamp - Timestamp limite
 * @param {number} limit - Numero massimo di messaggi (default: 100)
 * @returns {Promise<Array>} Array di messaggi più vecchi del timestamp
 */
messageSchema.statics.getMessagesBefore = function(roomName, beforeTimestamp, limit = 100) {
  return this.find({ 
    roomName, 
    timestamp: { $lt: new Date(beforeTimestamp) } //$less then operatore moongoose
  })
    .sort({ timestamp: -1 })
    .limit(limit)
    .select('-__v')
    .lean();
};

/**
 * METODO STATICO: Salva nuovo messaggio
 * @param {Object} messageData - Dati del messaggio dal ChatHandler
 * @returns {Promise<Object>} Messaggio salvato
 */
messageSchema.statics.saveMessage = async function(messageData) {
  const message = new this({
    messageId: messageData.messageId,
    roomName: messageData.roomName.toLowerCase(),  // Normalizza
    userName: messageData.userName,
    message: messageData.message,
    timestamp: new Date(messageData.timestamp)
  });
  
  return await message.save();
};

function getMessageModel() {
  const messagesConnection = databaseManager.getMessagesConnection();
  return messagesConnection.model('Message', messageSchema);
}

module.exports = { getMessageModel };