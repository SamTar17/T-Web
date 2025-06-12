require("dotenv").config();

//server principale

const serverConfig = {
  port: process.env.PORT,
  enviroment: process.env.NODE_ENV,
};

//microservizi

const servicesConfig = {
  flask: {
    url: process.env.FLASK_SERVER_URL,
    timeout: 5000,
  },

  mongo: {
    url: process.env.MONGO_SERVER_URL,
    timeout: 5000,
  },
};

//socket

const socketConfig = {
  cors: {
    origin: [
      process.env.FLASK_SERVER_URL,
      process.env.MONGO_SERVER_URL,
      "http://127.0.0.1:5500",
    ],
    methods: ["GET", "POST"],
    credentials: true,
  },
};

//middleware

corsConfig = {
  origin: [
    process.env.FLASK_SERVER_URL, // server chat
    process.env.MONGO_SERVER_URL, // server flask
    "http://127.0.0.1:5500", // frontend
  ],
  credentials: true, // Permette invio cookies/auth headers
};

morganConfig = "dev";

jsonConfig = {};
urlencodedConfig = { extended: true };

module.exports = {
  serverConfig,
  servicesConfig,
  socketConfig,
  corsConfig,
  morganConfig,
  jsonConfig,
  urlencodedConfig,
};
