const ReviewModel = require("../models/ReviewModel");

/**
 * ReviewController - Gestisce le richieste HTTP per le recensioni
 *
 * - Validazione dei parametri in arrivo
 * - Chiamata a ReviewModel
 * - Gestione degli errori
 * - traduzione in risposte HTTP
 * - Formattazione della risposta finale
 */

/**
 * Recupera recensioni per un film specifico
 *
 * ENDPOINT: GET /api/reviews/movie/:movieId
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getReviewsByMovieId(req, res) {
  try {
    // === VALIDAZIONE ID ===

    const movieId = parseInt(req.params.movieId);

    if (isNaN(movieId) || movieId <= 0) {
      return res.status(400).json({
        success: false,
        error: "ID film non valido",
        code: "INVALID_MOVIE_ID",
      });
    }

    // ==== CHIAMATA AL MODEL ====

    const reviews = await ReviewModel.getReviewsById(movieId);

    // === COSTRUZIONE RISPOSTE TO MAIN SERVER ===

    if (reviews.length === 0) {
      return res.status(200).json({
        success: true,
        message: "Nessuna recensione disponibile",
        movieId: movieId,
        reviews: [],
        count: 0,
      });
    }

    res.status(200).json({
      success: true,
      movieId: movieId,
      reviews: reviews,
      count: reviews.length,
      message: `${reviews.length} recensioni trovate`,
    });
  } catch (error) {
    console.error(
      `❌ Errore durante recupero recensioni per ID ${req.params.movieId}:`,
      error.message
    );

    res.status(500).json({
      success: false,
      error: "Errore interno del server durante il recupero delle recensioni",
      code: "INTERNAL_SERVER_ERROR",
      movieId: req.params.movieId,
    });
  }
}
/**
 * Gestisce richieste per statistiche recensioni
 *
 * ENDPOINT: GET /api/reviews/movie/:movieId/stats
 *
 * @param {Object} req 
 * @param {Object} res
 */
async function getMovieReviewStats(req, res) {
  try {

    const movieId = parseInt(req.params.movieId);

    if (isNaN(movieId) || movieId <= 0) {
      return res.status(400).json({
        success: false,
        error: "ID film non valido.",
        code: "INVALID_MOVIE_ID",
      });
    }

    //=== MODELS === 

    const stats = await ReviewModel.getMovieReviewStats(movieId);

    if (stats === null) {

      return res.status(200).json({
        success: true,
        movieId: movieId,
        hasReviews: false,
        message:
          "Nessun recensione",
        stats: {
          totalReviews: 0,
          averageScore: null,
          maxScore: null,
          minScore: null,
          positiveReviews: 0,
          negativeReviews: 0,
          positivePercentage: null,
          negativePercentage: null,
          publisherCount: 0,
          reviewTypeDistribution: {},
        },
      });
    }

    res.status(200).json({
      success: true,
      movieId: movieId,
      hasReviews: true,
      message: `Statistiche calcolate da ${stats.totalReviews} recensioni`,
      stats: stats,
    });

  } catch (error) {
    console.error(
      `❌ Errore durante calcolo statistiche per ID ${req.params.movieId}:`,
      error.message
    );

    res.status(500).json({
      success: false,
      error: "Errore interno del server durante il calcolo delle statistiche",
      code: "INTERNAL_SERVER_ERROR",
      movieId: req.params.movieId,
    });
  }
}

module.exports = {
  getReviewsByMovieId,
  getMovieReviewStats,
};
