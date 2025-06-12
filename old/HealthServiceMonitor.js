const axios = require("axios");

class ServiceHealthMonitor {
  constructor() {
    // Configurazione servizi da monitorare
    this.services = {
      mongodb: {
        name: "MongoDB Server",
        url: process.env.MONGO_SERVER_URL,
        healthEndpoint: "/api/health",
        status: "unknown",
        lastCheck: null,
        lastError: null,
      },
      flask: {
        name: "Flask Server",
        url: process.env.FLASK_SERVER_URL,
        healthEndpoint: "/api/health",
        status: "unknown",
        lastCheck: null,
        lastError: null,
      },
    };

    // Configurazione monitoring
    this.checkInterval = 30000; // 30 secondi
    this.timeout = 5000; // 5 secondi timeout
    this.timer = null;

    console.log("📊 ServiceHealthMonitor inizializzato");
  }

  /**
   * Avvia il monitoring periodico
   */
  start() {
    console.log(
      `🔄 Avvio monitoring servizi (ogni ${this.checkInterval / 1000}s)`
    );

    // Check immediato
    this.checkAllServices();

    // Setup timer periodico
    this.timer = setInterval(() => {
      this.checkAllServices();
    }, this.checkInterval);

    console.log("✅ ServiceHealthMonitor avviato");
  }

  /**
   * Ferma il monitoring
   */
  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      console.log("🛑 ServiceHealthMonitor fermato");
    }
  }

  /**
   * Controlla lo stato di tutti i servizi
   */
  async checkAllServices() {
    console.log("🔍 Controllo stato servizi...");

    //array di promise
    const checkPromises = Object.keys(this.services).map((serviceKey) =>
      this.checkService(serviceKey)
    );

    await Promise.allSettled(checkPromises);

    // Log summary
    const summary = this.getHealthSummary();
    console.log(
      `📊 Health Check: ${summary.online}/${summary.total} servizi online`
    );
  }

  /**
   * Controlla un singolo servizio
   */
  async checkService(serviceKey) {
    const service = this.services[serviceKey];
    const checkUrl = `${service.url}${service.healthEndpoint}`;

    try {
      console.log(`🔍 Checking ${service.name}...`);

      const response = await axios.get(checkUrl, {
        timeout: this.timeout,
        validateStatus: (status) => status === 200, // Solo 200 è success
      });

      // Success
      service.status = "online";
      service.lastCheck = new Date();
      service.lastError = null;

      console.log(`✅ ${service.name} online (${response.status})`);
    } catch (error) {
      // Failure
      const prevStatus = service.status;
      service.status = "offline";
      service.lastCheck = new Date();
      service.lastError = error.message;

      // Log con dettagli errore
      if (error.code === "ECONNREFUSED") {
        console.log(`❌ ${service.name} offline (server down)`);
      } else if (error.code === "ENOTFOUND") {
        console.log(`❌ ${service.name} offline (DNS error)`);
      } else if (error.code === "ETIMEDOUT") {
        console.log(`❌ ${service.name} offline (timeout)`);
      } else {
        console.log(`❌ ${service.name} offline (${error.message})`);
      }

      // Notifica se status è cambiato
      if (prevStatus === "online") {
        console.warn(`🚨 ${service.name} è andato OFFLINE!`);
      }
    }
  }

  /**
   * Verifica se un servizio specifico è online
   */
  isServiceOnline(serviceKey) {
    const service = this.services[serviceKey];
    return service.status === "online";
  }

  /**
   * Verifica se MongoDB è online (helper per ChatHandler)
   */
  isMongoDBOnline() {
    return this.isServiceOnline("mongodb");
  }

  /**
   * Verifica se Flask è online (helper per API calls)
   */
  isFlaskOnline() {
    return this.isServiceOnline("flask");
  }

  /**
   * Ottieni summary dello stato dei servizi
   */
  getHealthSummary() {
    const serviceKeys = Object.keys(this.services);
    const onlineServices = serviceKeys.filter(
      (key) => this.services[key].status === "online"
    );
    const offlineServices = serviceKeys.filter(
      (key) => this.services[key].status === "offline"
    );

    return {
      total: serviceKeys.length,
      online: onlineServices.length,
      offline: offlineServices.length,
      onlineServices: onlineServices,
      offlineServices: offlineServices,
    };
  }
}
module.exports = ServiceHealthMonitor;
