const express = require('express');
const { getReviewsByMovieId, getMovieReviewStats } = require('../controllers/reviewController');

const router = express.Router();

router.get('/reviews/movie/:movieId', getReviewsByMovieId);
router.get('/reviews/movie/:movieId/stats', getMovieReviewStats);

module.exports = router;