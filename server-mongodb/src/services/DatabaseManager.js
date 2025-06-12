const mongoose = require("mongoose");

class DatabaseManager {
  constructor() {
    this.connection = null;
    this.isConnected = false;
  }

  async connect() {
    const uri = process.env.MONGODB_URI;
    const db_name = process.env.DB_NAME;
    
    try {
      if (this.isConnected) {
        console.log("🔄 Già connesso al db mongo");
        return this.connection;
      }

      console.log("🔌 Connessione database film_mongo");

      // Crea connessione
      this.connection = await mongoose.createConnection(`${uri}/${db_name}`, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });

      // ASPETTA che sia davvero connesso
      await new Promise((resolve, reject) => {
        if (this.connection.readyState === 1) {
          this.isConnected = true;
          resolve();
          return;
        }

        this.connection.on("connected", () => {
          this.isConnected = true;
          console.log("✅ Database mongo connesso!");
          resolve();
        });

        this.connection.on("error", (error) => {
          this.isConnected = false;
          reject(error);
        });
      });
      
      console.log("✅ MongoDB connesso con successo!");

    } catch (error) {
      console.error("❌ Errore connessione:", error.message);
      this.isConnected = false;
      this.connection = null;
      throw error;
    }
  }

  getConnection() {
    if (!this.isConnected || !this.connection) {
      throw new Error("Database non connesso. Chiamare connect() prima di accedere alla connessione.");
    }
    return this.connection;
  }

  async disconnect() {
    try {
      if (this.connection) {
        await this.connection.close();
        console.log("🔌 Connessione database chiusa");
      }
      this.isConnected = false;
      this.connection = null;
    } catch (error) {
      console.error("❌ Errore chiusura:", error.message);
      throw error;
    }
  }
}

// Singleton
module.exports = new DatabaseManager();