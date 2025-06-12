const mongoose = require("mongoose");
const databaseManager = require("../../../services/DatabaseManager");

const roomSchema = new mongoose.Schema(
  {
    roomName: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
      lowercase: true,
    },

    creator: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
      lowercase: true,
    },

    topic: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },

    last_activity: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
    collection: "rooms",
  }
);

roomSchema.statics.saveRoom = async function (roomData) {
  try {
    const room = new this({
      roomName: roomData.roomName.toLowerCase(),
      creator: roomData.creator,
      topic: roomData.topic,
      last_activity: roomData.last_activity,
    });

await room.save();

  } catch (error) {
    console.error("❌ roomModel -> roomSchema -> saveRoom:", error);
    throw error;
  }
};

roomSchema.statics.findInactiveRoomNames = async function (time) {
  const threeDaysAgo = new Date(Date.now() - time);
  const rooms = await this.find({ last_activity: { $lt: threeDaysAgo } });
  return rooms.map((room) => room.roomName);
};

roomSchema.statics.updateActivity = async function (roomName) {
  try {
    const updatedRoom = await this.updateOne(
      { roomName: roomName.toLowerCase() },
      { $set: { last_activity: new Date() } }
    );

    if (!updatedRoom) {
      console.warn(
        `updateActivity ->  Stanza non trovata con nome: ${roomName}`
      );
      return null;
    }

    return updatedRoom;
  } catch (error) {
    console.error("❌ Errore in updateActivity:", error);
    throw error;
  }
};

roomSchema.statics.deleteRoom = async function (roomName) {
  try {
    const result = await this.deleteOne({ roomName: roomName.toLowerCase() });

    if (result.deletedCount === 0) {
      console.warn(`⚠️ Nessuna stanza trovata con nome: ${roomName}`);
    } else {
      console.log(`🗑️ Stanza eliminata: ${roomName}`);
    }

    return result;
  } catch (error) {
    console.error("❌ Errore in deleteRoom:", error);
    throw error;
  }
};

roomSchema.statics.getAllRooms = async function (limit = 50) {
  try {
    rooms = await this.find({}).limit(limit).lean();
    return rooms;
  } catch (error) {
    console.error("❌ roomModel -> getAllRooms:", error);
    throw error;
  }
};

function getRoomModel() {
  const roomConnection = databaseManager.getConnection();
  return roomConnection.model("Room", roomSchema);
}

module.exports = { getRoomModel };
