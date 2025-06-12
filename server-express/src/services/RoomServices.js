/**
 * ROOM SERVICE - MongoDB adapter per room operations
 * (Stesso pattern di MessageService ma per room)
 */

class RoomService {
  constructor(proxyService) {
    this.proxyService = proxyService;

  }

  /**
   * Crea nuova room su MongoDB
   */
  async createRoom(roomData) {
    try {
      console.log(`🎬 Creazione room: ${roomData.roomName}`);
      
      const response = await this.proxyService.callMongoDB('/api/rooms', 'POST', roomData);
      
      console.log(`✅ Room ${roomData.roomName} creata su MongoDB- status : ${response.status}`);
     
    } catch (error) {
      console.error(`❌ Errore creazione room ${roomData.roomName}:`, error.message);
      throw new Error(`Room creation failed: ${error.message}`);
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
      console.error('❌ Errore recupero lista room:', error.message);
      return { success: false, error: error.message, rooms: [] };
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
      console.log(`❌ Room ${roomName} non trovata: ${error.message}`);
      return { exists: false, error: error.message };
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
      console.error(`❌ Errore recupero info room ${roomName}:`, error.message);
      return { success: false, error: error.message };
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
      console.error(`❌ Errore aggiornamento activity room ${roomName}:`, error.message);
      // Non bloccare se questo fallisce
      return { success: false, error: error.message };
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
      console.error(`❌ Errore cancellazione room ${roomName}:`, error.message);
      throw new Error(`Room deletion failed: ${error.message}`);
    }
  }

  /**
   * Ottieni statistiche room
   */
  getStats() {
    return {
      service: 'RoomService',
      proxyAvailable: !!this.proxyService
    };
  }
}

module.exports = RoomService;