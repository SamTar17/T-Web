const { getRoomModel } = require("../modules/chat/models/roomsModel");
const { getMessageModel } = require("../modules/chat/models/messageModel");

const ThreeDays = 3 * 24 * 60 * 60 * 1000;

async function cleanInactiveRooms() {
  try {
    const Room = getRoomModel();
    const Message = getMessageModel();

    const inactiveRoomNames = await Room.findInactiveRoomNames(ThreeDays);

    if (inactiveRoomNames.length === 0) {
      console.log("Nessuna stanza inattiva da cancellare");
      return;
    }

    console.log(
      `Stanze inattive da eliminare: ${inactiveRoomNames.join(", ")}`
    );

    for (const roomName of inactiveRoomNames) {
      await Room.deleteRoom(roomName);
      await Message.deleteMessages(roomName);

      console.log(`Eliminata stanza e messaggi per: ${roomName}`);
    }
  } catch (error) {
    console.error("Errore nel ciclo di pulizia stanze inattive:", error);
  }
}

function startCleanupInterval() {
  cleanInactiveRooms();
  setInterval(cleanInactiveRooms, ThreeDays);
}

module.exports = { startCleanupInterval };
