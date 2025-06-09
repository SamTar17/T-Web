const io_client = require("socket.io-client");

function createClientChatServer(url_server, options = {}) {
  const default_options = {
    autoConnect: true,
    reconnection: true,
    reconnectionDelay: 2000,
    reconnectionAttempts: 5,
    timeout: 8000,
  };

  const clientOptions = { ...default_options, ...options };
  const client = io_client(chatServerUrl, clientOptions);
  return client;
}

module.exports = {createChatServerClient};
