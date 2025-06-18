const { getMessageModel } = require("../models/messageModel");
const { getRoomModel } = require("../models/roomsModel");
/**
 * Salva un nuovo messaggio nel database
 * ASSUME: Dati già validati e formattati dal server Express centrale
 * @param {Object} req - Express request con messageData in body
 * @param {Object} res - Express response
 */
async function saveMessage(req, res) {
  try {
    //=== VALIDAZIONE MESSAGGIO
    const validationError = _validateMessageBody(req.body);
    if (validationError) {
      return res.status(400).json(validationError);
    }

    const Message = getMessageModel();
    await Message.saveMessage(req.body);

    console.log(`✅ Messaggio salvato`);

    return res.status(201).json({
      success: true,
      messageId: req.body.uniqueTimestamp,
    });
  } catch (err) {
    console.error("errore in chatController -> saveMessage");
    return res.status(500).json({
      success: false,
      error: err.message,
      message: "errore in chatController -> saveMessage",
    });
  }
}

/**
 * Recupera gli ultimi messaggi di una room
 * ASSUME: roomName valido dal URL params
 * @param {Object} req - Express request con roomName nei params
 * @param {Object} res - Express response
 */
async function getLatestMessages(req, res, next) {
  try {
    if (typeof req.params.roomName !== "string") {
      console.error("errore in getLatestMessages, roomName non valido");
      return res.status(400).json({
        success: false,
        error: "RoomName non valido",
        message: "errore in getLatestMessages, roomName non valido",
        roomName: req.params.roomName,
      });
    }

    const roomName = req.params.roomName;
    const parsedPage = parseInt(req.query.page);
    const page = !isNaN(parsedPage) && parsedPage > 0 ? parsedPage : 1;

    const Message = getMessageModel();
    const results = await Message.getLatestMessages(roomName, page);

    if (results.messages.length === 0) {
      return res.status(200).json({
        success: true,
        message: "Nessuna messaggio disponibile",
        roomName: roomName,
        message: [],
        count: 0,
        pagination: results.pagination.page,
      });
    }

    return res.status(200).json({
      success: true,
      roomName: roomName,
      message: results.messages,
      count: results.messages.length,
      beforeUniqueTimestamp: results.pagination.beforeUniqueTimestamp,
      page: results.pagination.page,
    });
    
  } catch (err) {
    console.error("errore in chatController -> getLatestMessages");
    return res.status(500).json({
      success: false,
      error: err.message,
      message: "errore in chatController -> getLatestMessages",
    });
  }
}

/**
 * Recupera messaggi precedenti per paginazione
 * ASSUME: roomName e timestamp validi dai URL params
 * @param {Object} req - Express request con roomName e timestamp nei params
 * @param {Object} res - Express response
 */
async function getMessagesBefore(req, res, next) {
  try {
    const validationError = _validatebeforeMessageParams(req);
    if (validationError) return res(400).json(validationError);

    const { roomName, timestamp } = req.params;
    const Message = getMessageModel();
    const messages = await Message.getMessagesBefore(roomName, timestamp);

    console.log(`✅ Trovati ${messages.length} messaggi precedenti`);

    if (messages.length === 0) {
      return res.status(200).json({
        success: true,
        message: "Nessuna messaggio precedente disponibile",
        roomName: roomName,
        messages: [],
        count: 0,
      });
    }
    res.status(200).json({
      success: true,
      roomName: roomName,
      message: messages,
      count: messages.length,
    });
  } catch (err) {
    console.error("errore in chatController -> getMessagesBefore");
    return res.status(500).json({
      success: false,
      error: err.message,
      message: "errore in chatController -> getMessagesBefore",
    });
  }
}

async function saveRoom(req, res, next) {
  try {
    const validationError = _validateRoomData(req.body);

    if (validationError) return res.status(400).json(validationError);

    const Room = getRoomModel();
    await Room.saveRoom(req.body);

    console.log(`✅ room salvato`);

    res.status(201).json({
      success: true,
      room: req.body.roomName,
    });
  } catch (err) {
    console.error("errore in chatController -> getLatestMessages");
    return res.status(500).json({
      success: false,
      error: err.message,
      message: "errore in chatController -> getLatestMessages",
    });
  }
}

async function getAllRooms(req, res, next) {
  try {
    const Room = getRoomModel();
    const rooms = await Room.getAllRooms();

    if (rooms.length === 0) {
      return res.status(200).json({
        success: true,
        message: "Nessuna stanza disponibile",
        rooms: [],
      });
    }
    console.log(rooms);
    res.status(200).json({
      success: true,
      rooms: rooms,
    });
  } catch (err) {
    console.error("errore in chatController -> getAllRooms");
    return res.status(500).json({
      success: false,
      error: err.message,
      message: "errore in chatController -> getAllRooms",
    });
  }
}

async function updateActivity(req, res, next) {
  try {
    if (
      typeof req.params.roomName !== "string" ||
      req.params.roomName.trim() === ""
    ) {
      return res.status(400).json({
        success: false,
        error: "RoomName non valido",
        message: "errore in getLatestMessages, roomName non valido",
        roomName: req.params.roomName,
      });
    }

    const Room = getRoomModel();
    const activeRoom = req.params.roomName;

    const response = await Room.updateActivity(activeRoom);
    if (response === null) {
      return res.status(404).json({
        success: false,
        error: "RoomName non trovato",
        message: "Attività stanza non aggiornata",
        roomName: req.params.roomName,
      });
    }

    return res.json({ message: "Attività stanza aggiornata" });
  } catch (err) {
    console.error("errore in chatController -> updateActivity");
    return res.status(500).json({
      success: false,
      error: err.message,
      message: "errore in chatController -> updateActivity",
    });
  }
}

function _validateMessageBody(body) {
  if (!body) {
    const errorResponse = {
      status: 400,
      code: "INVALID_INPUT",
      message: "Corpo della richiesta mancante",
    };

    return errorResponse;
  }

  if (
    typeof body.uniqueTimestamp !== "string" ||
    body.uniqueTimestamp.trim() === ""
  ) {
    const errorResponse = {
      status: 400,
      code: "INVALID_INPUT",
      message: "uniqueTimestamp mancante o non valido",
    };

    return errorResponse;
  }

  const timestampPattern = /^\d+_\d{3}$/;
  if (!timestampPattern.test(body.uniqueTimestamp)) {
    const errorResponse = {
      status: 400,
      code: "INVALID_INPUT",
      message: "Formato uniqueTimestamp non valido",
    };

    return errorResponse;
  }

  if (typeof body.text !== "string" || body.text.trim() === "") {
    const errorResponse = {
      status: 400,
      code: "INVALID_INPUT",
      message: "Testo del messaggio mancante o non valido",
    };

    return errorResponse;
  }

  if (typeof body.author !== "string" || body.author.trim() === "") {
    const errorResponse = {
      status: 400,
      code: "INVALID_INPUT",
      message: "Autore mancante o non valido",
    };

    return errorResponse;
  }

  return null; // Nessun errore
}

function _validatebeforeMessageParams(req) {
  const { roomName, uniqueTimestamp } = req.params;

  if (typeof roomName !== "string" || roomName.trim() === "") {
    const errorResponse = {
      status: 400,
      code: "INVALID_INPUT",
      message: "roomName non valido o mancante",
    };

    return errorResponse;
  }

  if (typeof uniqueTimestamp !== "string" || uniqueTimestamp.trim() === "") {
    const errorResponse = {
      status: 400,
      code: "INVALID_INPUT",
      message: "uniqueTimestamp mancante o non valido",
    };

    return errorResponse;
  }

  const timestampPattern = /^\d+_\d{3}$/;
  if (!timestampPattern.test(uniqueTimestamp)) {
    ù;

    const errorResponse = {
      status: 400,
      code: "INVALID_INPUT",
      message: "Formato uniqueTimestamp non valido",
    };

    return errorResponse;
  }

  return null; // Nessun errore
}

function _validateRoomData(roomData) {
  if (
    typeof roomData.roomName !== "string" ||
    roomData.roomName.trim() === ""
  ) {
    const errorResponse = {
      status: 400,
      code: "INVALID_INPUT",
      message: "roomName mancante o non valido",
    };

    return errorResponse;
  }

  if (typeof roomData.creator !== "string" || roomData.creator.trim() === "") {
    const errorResponse = {
      status: 400,
      code: "INVALID_INPUT",
      message: "creator mancante o non valido",
    };

    return errorResponse;
  }

  if (typeof roomData.topic !== "string" || roomData.topic.trim() === "") {
    const errorResponse = {
      status: 400,
      code: "INVALID_INPUT",
      message: "topic mancante o non valido",
    };

    return errorResponse;
  }

  if (
    !roomData.last_activity ||
    isNaN(new Date(roomData.last_activity).getTime())
  ) {
    const errorResponse = {
      status: 400,
      code: "INVALID_INPUT",
      message: "last_activity mancante o non è una data valida",
    };

    return errorResponse;
  }

  return null; // Tutto ok
}

module.exports = {
  saveMessage,
  getLatestMessages,
  getMessagesBefore,
  saveRoom,
  getAllRooms,
  updateActivity,
};
