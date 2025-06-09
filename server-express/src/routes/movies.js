const express = require('express')
const axios = require('axios')
require('dotenv').config();

const FLASK_URL = process.env.FLASK_SERVER_URL
const router = express.Router()

router.get('/movies', async (req,res,next) => {
    try {

    } catch (error) {

    }
});

module.exports = router;