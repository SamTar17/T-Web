const express = require('express')
const router = express.Router()

router.get('/health', (req,res) => {
    res.status(200).json({
        status: 'ok',
        message: 'server is running',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        enviroment: process.env.NODE_ENV
    });
});

module.exports = router;