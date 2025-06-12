const mongoose = require("mongoose");
const databaseManager = require("../../../services/DatabaseManager");

const messageSchema = new mongoose.Schema(
  {
    uniqueTimestamp: {
      type: String,
      required: true,
      index: true,
    },
    roomName: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },

    userName: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 50,
    },

    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100000,
    },
  },
  {
    timestamps: true,
    collection: "messages",
  }
);

messageSchema.index({ roomName: 1, uniqueTimestamp: -1 });

/**
 * METODO STATICO: Recupera ultimi messaggi di una room
 * @param {string} roomName - Nome della room
 * @param {number} limit - Numero massimo di messaggi (default: 100)
 * @returns {Promise<Array>} Array di messaggi ordinati dal più recente
 */
messageSchema.statics.getLatestMessages = async function (
  roomName,
  page = 1,
  limit = 100
) {
  try {
    const skip = (page - 1) * limit;
    const messages = await this.find({ roomName: roomName.toLowerCase() })
      .sort({ uniqueTimestamp: -1 })
      .limit(limit)
      .skip(skip)
      .lean();

    const beforeUniqueTimestamp =
      messages.length > 0
        ? messages[messages.length - 1].uniqueTimestamp
        : null;

    return {
      messages,
      pagination: { page: page, beforeUniqueTimestamp: beforeUniqueTimestamp },
    };
  } catch (error) {
    console.error(
      `❌ messageModel -> getLatestMessages: ${roomName}:`,
      error.message
    );
    throw error;
  }
};

/**
 * METODO STATICO: Recupera messaggi precedenti (paginazione)
 * @param {string} roomName - Nome della room
 * @param {Date} beforeTimestamp - Timestamp limite
 * @param {number} limit - Numero massimo di messaggi (default: 100)
 * @returns {Promise<Array>} Array di messaggi più vecchi del timestamp
 */
messageSchema.statics.getMessagesBefore = function (
  roomName,
  beforeUniqueTimestamp,
  limit = 100
) {
  try {
    const result = this.find({
      roomName: roomName.toLowerCase(),
      uniqueTimestamp: { $lt: beforeUniqueTimestamp }, //$less then operatore moongoose
    })
      .sort({ uniqueTimestamp: -1 })
      .limit(limit)
      .lean();

    return result;
  } catch (error) {
    console.error(
      `❌ messageModtel -> getMessagesBefore: ${roomName} ${beforeUniqueTimestamp}:`,
      error.message
    );
    throw error;
  }
};

/**
 * METODO STATICO: Salva nuovo messaggio
 * @param {Object} messageData - Dati del messaggio dal ChatHandler
 * @returns {Promise<Object>} Messaggio salvato
 */
messageSchema.statics.saveMessage = async function (messageData) {
  try {
    const message = new this({
      uniqueTimestamp: messageData.uniqueTimestamp,
      roomName: messageData.roomName.toLowerCase(),
      userName: messageData.userName,
      message: messageData.message,
    });

    await message.save();

  } catch (error) {
    console.error("❌ messageModtel nel saveMessage:", error);
    throw error;
  }
};

messageSchema.statics.deleteMessages = async function (roomName) {
  try {
    const result = await this.deleteMany({ roomName: roomName.toLowerCase() });

    if (result.deletedCount === 0) {
      console.warn(`⚠️ Nessuna messaggio in: ${roomName}`);
    } else {
      console.log(`messaggi eliminati: ${roomName}`);
    }
    return result;
  } catch (error) {
    console.error("❌ Errore in deleteRoom:", error);
    throw error;
  }
};

function getMessageModel() {
  const messagesConnection = databaseManager.getConnection();
  return messagesConnection.model("Message", messageSchema);
}

module.exports = { getMessageModel };
