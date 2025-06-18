const { getReviewModel } = require("../models/ReviewModel");

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
      console.error("errore in getReviewsByMovieID, movieID non valido");

      return res.status(400).json({
        success: false,
        error: " movieID non valido",
        message: "errore in getReviewsByMovieID, movieID non valido",
        movieId: movieId,
      });
    }

    // === VALIDAZIONE PARAMETRI DI PAGINAZIONE ===

    const parsedPage = parseInt(req.query.page);
    const page = !isNaN(parsedPage) && parsedPage > 0 ? parsedPage : 1;

    const valid_sort_by = ["review_date", "review_score"];
    const sortBy = valid_sort_by.includes(req.query.sortBy)
      ? req.query.sortBy
      : "review_date";
    const orderBy = req.query.orderBy === "asc" ? 1 : -1;

    // ==== CHIAMATA AL MODEL ====

    const reviewModel = getReviewModel();

    const pagination = {
      page: page,
      limit: 10,
      sortBy: sortBy,
      sortOrder: orderBy,
    };

    const reviewsById = await reviewModel.getReviewsByMovieId(
      movieId,
      pagination
    );

    // === COSTRUZIONE RISPOSTE TO MAIN SERVER ===

    if (reviewsById.reviews.length === 0) {
      return res.status(200).json({
        success: true,
        message: "Nessuna recensione disponibile",
        movieId: movieId,
        reviews: [],
        count: 0,
      });
    }

    return res.status(200).json({
      success: true,
      reviews: reviewsById.reviews,
      pagination: {
        currentPage: pagination.page,
        totalPages: Math.ceil(reviewsById.totalCount / pagination.limit),
        totalResults: reviewsById.totalCount,
        hasNext: pagination.page * pagination.limit < reviewsById.totalCount,
        hasPrev: pagination.page > 1,
      },
      count: reviewsById.reviews.length,
      message: `${reviewsById.reviews.length} recensioni trovate`,
    });
  } catch (err) {
    console.error("errore in getReviewsByMovieID,");
    return res.status(500).json({
      success: false,
      error: err.message,
      message: "errore in getReviewsByMovieID",
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
      console.error("errore in getReviewsByMovieID, movieID non valido");

      return res.status(400).json({
        success: false,
        error: " movieID non valido",
        message: "errore in getReviewsByMovieID, movieID non valido",
        movieId: movieId,
      });
    }

    //=== MODELS ===
    const reviewModel = getReviewModel();
    const stats = await reviewModel.getReviewsStatistics(movieId);

    if (stats === null) {
      return res.status(200).json({
        success: true,
        movieId: movieId,
        hasReviews: false,
        message: "Nessun recensione",
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
  } catch (err) {
    console.error("errore in getMovieReviewStats,");
    return res.status(500).json({
      success: false,
      error: err.message,
      message: "errore in getMovieReviewStats",
    });
  }
}

module.exports = {
  getReviewsByMovieId,
  getMovieReviewStats,
};
