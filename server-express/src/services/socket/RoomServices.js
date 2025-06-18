/**
 * ROOM SERVICE - MongoDB adapter per room operations
 * (Stesso pattern di MessageService ma per room)
 */

class RoomService {
  constructor(proxyService) {
    this.proxyService = proxyService;

  }

  async createRoom(roomData) {
    try {
      console.log(`🎬 Creazione room: ${roomData.roomName}`);
      
      const response = await this.proxyService.callMongoDB('/api/rooms', 'POST', roomData);
      
      console.log(`✅ Room ${roomData.roomName} creata su MongoDB- status : ${response.status}`);
     
    } catch (error) {
      throw error;
    }
  }

  /**
   * Ottieni lista room dal MongoDB
   */
  async getRoomList() {
    try {
      console.log('📥 Recupero lista room da MongoDB...');
      
      const response = await this.proxyService.callMongoDB('/api/rooms', 'GET');
      
      console.log(`✅ Recuperate ${response.data.rooms?.length || 0} room`);

      return response.data;
      
    } catch (error) {
      throw error;
    }
  }

  /**
   * Controlla se room esiste (per validazione)
   */
  async validateRoomExists(roomName) {
    try {
      console.log(`🔍 Validazione esistenza room: ${roomName}`);
      
      const response = await this.proxyService.callMongoDB(`/api/rooms/${roomName}`, 'GET');
      
      console.log(`✅ Room ${roomName} validata`);
      return { exists: true, room: response.data };
      
    } catch (error) {
      throw error;
    }
  }

  /**
   * Ottieni info specifica room
   */
  async getRoomInfo(roomName) {
    try {
      console.log(`📥 Recupero info room: ${roomName}`);
      
      const response = await this.proxyService.callMongoDB(`/api/rooms/${roomName}`, 'GET');
      
      console.log(`✅ Info room ${roomName} recuperate`);
      return response.data;
      
    } catch (error) {
      throw error;
    }
  }
  

  /**
   * Aggiorna lastActivity di una room
   */
  async updateRoomActivity(roomName) {
    try {
      const updateData = {
        lastActivity: new Date().toISOString()
      };
      
      const response = await this.proxyService.callMongoDB(
        `/api/rooms/${roomName}`, 
        'PUT', 
        updateData
      );
      
      console.log(`🔄 Activity aggiornata per room: ${roomName}`);
      return response.data;
      
    } catch (error) {
      throw error;
    }
  }

  /**
   * Cancella room dal MongoDB
   */
  async deleteRoom(roomName) {
    try {
      console.log(`🗑️ Cancellazione room: ${roomName}`);
      
      const response = await this.proxyService.callMongoDB(`/api/rooms/${roomName}`, 'DELETE');
      
      console.log(`✅ Room ${roomName} cancellata da MongoDB`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = RoomService;