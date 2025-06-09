const express = require('express');
const { saveMessage,getLatestMessages,getMessagesBefore} = require('../controllers/chatController');

const router = express.Router();

// Route temporanea per test
router.post('/messages', saveMessage);
router.get('/messages/:roomName', getLatestMessages);
router.get('/messages/:roomName/before/:timestamp', getMessagesBefore);
module.exports = router;