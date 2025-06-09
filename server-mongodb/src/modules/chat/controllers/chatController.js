const { getMessageModel } = require('../models/Message');

/**
 * Salva un nuovo messaggio nel database
 * ASSUME: Dati già validati e formattati dal server Express centrale
 * @param {Object} req - Express request con messageData in body
 * @param {Object} res - Express response
 */
async function saveMessage(req, res) {
  try {
    console.log(`💾 Salvando messaggio ${req.body.messageId}`);
    
    // Salvataggio diretto - i dati sono già validati dal main server
    const Message = getMessageModel();
    await Message.saveMessage(req.body);
    
    console.log(`✅ Messaggio salvato`);
    
    // Response minimale
    res.status(201).json({
      success: true,
      messageId: req.body.messageId
    });
    
  } catch (error) {
    console.error(`❌ Errore salvataggio:`, error.message);
    
    // Gestione solo errori MongoDB
    if (error.code === 11000) {
      // Duplicato messageId (caso raro ma possibile)
      return res.status(409).json({
        success: false,
        error: "Messaggio duplicato",
        code: "DUPLICATE_MESSAGE"
      });
    }
    
    // Errore generico del database
    res.status(500).json({
      success: false,
      error: "Errore database",
      code: "DATABASE_ERROR"
    });
  }
}

/**
 * Recupera gli ultimi messaggi di una room
 * ASSUME: roomName valido dal URL params
 * @param {Object} req - Express request con roomName nei params
 * @param {Object} res - Express response
 */
async function getLatestMessages(req, res) {
  try {
    const { roomName } = req.params;
    const limit = parseInt(req.query.limit) || 100; // Default 100
    
    console.log(`📥 Recupero ultimi ${limit} messaggi da ${roomName}`);
    
    // Recupera messaggi dal database
    const Message = getMessageModel();
    const messages = await Message.getLatestMessages(roomName, limit);
    
    console.log(`✅ Trovati ${messages.length} messaggi`);
    
    // Response minimale
    res.status(200).json({
      success: true,
      messages: messages,
      count: messages.length
    });
    
  } catch (error) {
    console.error(`❌ Errore recupero messaggi:`, error.message);
    
    // Errore generico
    res.status(500).json({
      success: false,
      error: "Errore recupero messaggi",
      code: "DATABASE_ERROR"
    });
  }
}

/**
 * Recupera messaggi precedenti per paginazione
 * ASSUME: roomName e timestamp validi dai URL params
 * @param {Object} req - Express request con roomName e timestamp nei params
 * @param {Object} res - Express response
 */
async function getMessagesBefore(req, res) {
  try {
    const { roomName, timestamp } = req.params;
    const limit = parseInt(req.query.limit) || 100; // Default 100
    
    console.log(`📥 Recupero ${limit} messaggi da ${roomName} prima di ${timestamp}`);
    
    // Recupera messaggi precedenti dal database
    const Message = getMessageModel();
    const messages = await Message.getMessagesBefore(roomName, timestamp, limit);
    
    console.log(`✅ Trovati ${messages.length} messaggi precedenti`);
    
    // Response minimale
    res.status(200).json({
      success: true,
      messages: messages,
      count: messages.length,
      hasMore: messages.length === limit // Se ha trovato esattamente 'limit' messaggi, potrebbero essercene altri
    });
    
  } catch (error) {
    console.error(`❌ Errore recupero messaggi precedenti:`, error.message);
    
    // Errore generico
    res.status(500).json({
      success: false,
      error: "Errore recupero messaggi precedenti",
      code: "DATABASE_ERROR"
    });
  }
}

module.exports = {
  saveMessage,
  getLatestMessages,
  getMessagesBefore
};