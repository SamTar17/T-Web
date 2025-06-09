require('dotenv').config()
const app = require('./src/app')

const PORT = process.env.PORT

const server = app.listen(PORT, () => {
    console.log('SERVER CHAT ATTIVO')
    console.log(`porta del server ${PORT}`)
    console.log(`🎯 Environment: ${process.env.NODE_ENV}`);
    console.log('🔥 Socket.io ready for real-time connections!');
})

process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down chat server...');
    server.close(() => {
        console.log('Chat server closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down chat server...');
    server.close(() => {
        console.log('Chat server closed');
        process.exit(0);
    });
});