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
    if (validationError) return next(validationError);

    const Message = getMessageModel();
    await Message.saveMessage(req.body);

    console.log(`✅ Messaggio salvato`);

    res.status(201).json({
      success: true,
      messageId: req.body.uniqueTimestamp,
    });
  } catch (err) {
    err.myMessage = "errore in chatController -> saveMessage";
    err.statusCode = 500;
    err.code = "MODEL_ERROR";
    return next(err);
  }
}

/**
 * Recupera gli ultimi messaggi di una room
 * ASSUME: roomName valido dal URL params
 * @param {Object} req - Express request con roomName nei params
 * @param {Object} res - Express response
 */
async function getLatestMessages(req, res,next) {
  try {
    if (typeof req.params.roomName !== "string") {
      const err = new Error("RoomName non valido");
      err.status = 400;
      err.code = "INVALID_INPUT";
      return next(err);
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

    res.status(200).json({
      success: true,
      roomName: roomName,
      message: results.messages,
      count: results.messages.length,
      beforeUniqueTimestamp: results.pagination.beforeUniqueTimestamp,
      page: results.pagination.page,
    });
  } catch (err) {
    err.myMessage = "errore in chatController -> getLatestMessages";
    err.statusCode = 500;
    err.code = "MODEL_ERROR";
    return next(err);
  }
}

/**
 * Recupera messaggi precedenti per paginazione
 * ASSUME: roomName e timestamp validi dai URL params
 * @param {Object} req - Express request con roomName e timestamp nei params
 * @param {Object} res - Express response
 */
async function getMessagesBefore(req, res,next) {
  try {
    const validationError = _validatebeforeMessageParams(req);
    if (validationError) return next(validationError);

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
    err.myMessage = "errore in chatController -> getMessagesBefore";
    err.statusCode = 500;
    err.code = "MODEL_ERROR";
    return next(err);
  }
}

async function saveRoom(req, res,next) {
  try {
    const validationError = _validateRoomData(req.body);
    if (validationError) return next(validationError);

    const Room = getRoomModel();
    await Room.saveRoom(req.body);

    console.log(`✅ room salvato`);

    res.status(201).json({
      success: true,
      room: req.body.roomName,
    });
  } catch (err) {
    err.myMessage = "errore in chatController -> saveRoom";
    err.statusCode = 500;
    err.code = "MODEL_ERROR";
    return next(err);
  }
}

async function getAllRooms(req, res,next) {
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

    res.status(200).json({
      success: true,
      roomName: roomName,
      rooms: rooms,
    });
  } catch (err) {
    err.myMessage = "errore in chatController -> getAllRooms";
    err.statusCode = 500;
    err.code = "MODEL_ERROR";
    return next(err);
  }
}

async function updateActivity(req, res,next) {
  try {
    if (
      typeof req.params.roomName !== "string" ||
      req.params.roomName.trim() === ""
    ) {
      const err = new Error("roomName non valido o mancante");
      err.status = 400;
      err.code = "INVALID_INPUT";
      return next(err);
    }

    const Room = getRoomModel();
    const activeRoom = req.params.roomName;

    await Room.updateActivity(activeRoom);

    return res.json({ message: "Attività stanza aggiornata" });
  } catch (err) {
    err.myMessage = "errore in chatController -> updateActivity";
    err.statusCode = 500;
    err.code = "MODEL_ERROR";
    return next(err);
  }
}

function _validateMessageBody(body) {
  if (!body) {
    const err = new Error("Corpo della richiesta mancante");
    err.status = 400;
    err.code = "INVALID_INPUT";
    return err;
  }

  if (
    typeof body.uniqueTimestamp !== "string" ||
    body.uniqueTimestamp.trim() === ""
  ) {
    const err = new Error("uniqueTimestamp mancante o non valido");
    err.status = 400;
    err.code = "INVALID_INPUT";
    return err;
  }

  const timestampPattern = /^\d+_\d{3}$/;
  if (!timestampPattern.test(body.uniqueTimestamp)) {
    const err = new Error("Formato uniqueTimestamp non valido");
    err.status = 400;
    err.code = "INVALID_INPUT";
    return err;
  }

  if (typeof body.text !== "string" || body.text.trim() === "") {
    const err = new Error("Testo del messaggio mancante o non valido");
    err.status = 400;
    err.code = "INVALID_INPUT";
    return err;
  }

  if (typeof body.author !== "string" || body.author.trim() === "") {
    const err = new Error("Autore mancante o non valido");
    err.status = 400;
    err.code = "INVALID_INPUT";
    return err;
  }

  return null; // Nessun errore
}
function _validatebeforeMessageParams(req) {
  const { roomName, uniqueTimestamp } = req.params;

  if (typeof roomName !== "string" || roomName.trim() === "") {
    const err = new Error("roomName non valido o mancante");
    err.status = 400;
    err.code = "INVALID_INPUT";
    return err;
  }

  if (typeof uniqueTimestamp !== "string" || uniqueTimestamp.trim() === "") {
    const err = new Error("uniqueTimestamp mancante o non valido");
    err.status = 400;
    err.code = "INVALID_INPUT";
    return err;
  }

  const timestampPattern = /^\d+_\d{3}$/;
  if (!timestampPattern.test(uniqueTimestamp)) {
    const err = new Error("Formato uniqueTimestamp non valido");
    err.status = 400;
    err.code = "INVALID_INPUT";
    return err;
  }

  return null; // Nessun errore
}
function _validateRoomData(roomData) {

  if (typeof roomData.roomName !== "string" || roomData.roomName.trim() === "") {
    const err = new Error("roomName mancante o non valido");
    err.status = 400;
    err.code = "INVALID_INPUT";
    return err;
  }

  if (typeof roomData.creator !== "string" || roomData.creator.trim() === "") {
    const err = new Error("creator mancante o non valido");
    err.status = 400;
    err.code = "INVALID_INPUT";
    return err;
  }

  if (typeof roomData.topic !== "string" || roomData.topic.trim() === "") {
    const err = new Error("topic mancante o non valido");
    err.status = 400;
    err.code = "INVALID_INPUT";
    return err;
  }

  if (
    !roomData.last_activity ||
    isNaN(new Date(roomData.last_activity).getTime())
  ) {
    const err = new Error("last_activity mancante o non è una data valida");
    err.status = 400;
    err.code = "INVALID_INPUT";
    return err;
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
