const axios = require("axios");
const { servicesConfig } = require("../config/index");

const allowed_methods = ["GET", "POST", "PUT", "DELETE"];

class ProxyCallerServices {
  constructor() {
    this.flaskUrl = servicesConfig.flask.url;
    this.mongodbUrl = servicesConfig.mongo.url;
    this.flaskTimeout = servicesConfig.flask.timeout;
    this.mongodbTimeout = servicesConfig.mongo.timeout;

    console.log("ProxyCallerServices inizializzato con Circuit Breaker");
    console.log(`Flask: ${this.flaskUrl}`);
    console.log(`MongoDB: ${this.mongodbUrl}`);
  }

  async callFlask(endpoint, method = "GET", data = null) {
    try {
      const axios_call_config = {
        method: allowed_methods.includes(method) ? method : "GET",
        url: `${this.flaskUrl}${endpoint}`,
        timeout: this.flaskTimeout,
      };

      if (data && ["POST", "PUT"].includes(method)) {
        axios_call_config.data = data;
      }

      const response = await axios(axios_call_config);
      return response;
    } catch (error) {
      error.additionalDetails = {serviceType: 'FLASK_SERVER'}
      throw error;
    }
  }

  async callMongoDB(endpoint, method = "GET", data = null) {
    try {
      const axios_call_config = {
        method: method && allowed_methods.includes(method) ? method : "GET",
        url: `${this.mongodbUrl}${endpoint}`,
        timeout: this.mongodbTimeout,
        maxRedirects: 0,
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
      error.serviceType = 'MONGO_SERVER';
      throw error;
    }
  }
}

module.exports = ProxyCallerServices;
