const express = require("express");
const MoviesController = require("../controllers/MoviesController");
const {validateMovieId} =  require('../middleware/validation/MovieIdValidation')
const ProxyCallerServices = require("../services/ProxyCallerServices");
const {
  validateMovieSearch,
} = require("../middleware/validation/SearchMoviesValidation");

const router = express.Router();
const proxyCallerServices = new ProxyCallerServices();
const moviesController = new MoviesController(proxyCallerServices);

router.get(
  "/movies/search",
  validateMovieSearch,
  moviesController.searchMovies.bind(moviesController)
);

router.get("/movies/suggestions",
  moviesController.getSuggestions.bind(moviesController)
)

router.get(
  "/movies/:movieId",
  validateMovieId,
  moviesController.getMovieDetails.bind(moviesController)
);

module.exports = router;
