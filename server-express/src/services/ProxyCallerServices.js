// gestore di chiamate ai microservizi

const axios = require("axios");
const { servicesConfig } = require("../config/index");

const allowed_methods = ["GET", "POST", "PUT", "DELETE"];

const axiosRetry = require("axios-retry");

// Imposta retry massimo a 3 con backoff esponenziale
axiosRetry(axios, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (error) =>
    error.code === "ECONNABORTED" || error.response?.status >= 500,
});

class ProxyCallerServices {
  constructor() {
    this.flaskUrl = servicesConfig.flask.url;
    this.mongodbUrl = servicesConfig.mongo.url;
    this.flaskTimeout = servicesConfig.flask.timeout;
    this.mongodbTimeout = servicesConfig.mongo.timeout;

    console.log("ProxyCallerServices inizializzato");
    console.log(`Flask: ${this.flaskUrl}`);
    console.log(`MongoDB: ${this.mongodbUrl}`);
  }

  /**
   * Chiamata a Flask server
   * @param endpoint
   * @param method
   * @param data - solo per PUT o POST
   * @returns {Promise<Object>} - Ritorna la risposta HTTP (`axios response`).
   * @throws {Error} - Lancia un errore con un messaggio in caso di fallimento della chiamata.
   */
  async callFlask(endpoint, method = "GET", data = null) {
    try {
      const axios_call_config = {
        method: method && allowed_methods.includes(method) ? method : "GET",
        url: `${this.flaskUrl}${endpoint}`,
        timeout: this.flaskTimeout,
      };

      if (data && (method === "POST" || method === "PUT")) {
        axios_call_config.data = data;
      }

      const response = await axios(axios_call_config);

      console.log(`Flask response: ${response.status}`);
      return response;

    } catch (error) {
      console.error(
        `❌ ProxyCallerServices -> Errore Flask ${endpoint}:`,
        error.message
      );
      error.myMessage = 'Errore in callFlask'
      throw error;
    }
  }

  /**
   * Chiamata a MongoDB server
   * @param endpoint
   * @param method
   * @param data - solo per PUT o POST
   *
   * @returns {Promise<Object>} - Ritorna la risposta HTTP (`axios response`).
   * @throws {Error} - Lancia un errore con un messaggio in caso di fallimento della chiamata.
   */
  async callMongoDB(endpoint, method = "GET", data = null) {
    try {
      const axios_call_config = {
        method: method && allowed_methods.includes(method) ? method : "GET",
        url: `${this.mongodbUrl}${endpoint}`,
        timeout: this.mongodbTimeout,
      };

      if (data && (method === "POST" || method === "PUT")) {
        axios_call_config.data = data;
      }

      const response = await axios(axios_call_config);
      console.log(`MongoDB response: ${response.status}`);
      return response;
      
    } catch (error) {
      console.error(
        `❌ProxyCallerServices -> Errore MongoDB ${endpoint}:`,
        error.message
      );
      error.myMessage = 'Errore in callMongoDB'
      throw error;
    }
  }
}

module.exports = ProxyCallerServices;
