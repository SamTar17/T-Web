require("dotenv").config();

//server principale

const serverConfig = {
  port: process.env.PORT,
  enviroment: process.env.NODE_ENV,
};


//middleware

corsConfig = {
  origin: [
    process.env.MAIN_SERVER_URL, // server chat
    "http://127.0.0.1:5500", // frontend
  ],
  credentials: true, // Permette invio cookies/auth headers
};

morganConfig = "dev";

jsonConfig = {};
urlencodedConfig = { extended: true };

module.exports = {
  serverConfig,
  corsConfig,
  morganConfig,
  jsonConfig,
  urlencodedConfig,
};
