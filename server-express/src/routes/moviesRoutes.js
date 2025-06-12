const express = require("express");
const MoviesController = require("../controllers/MoviesController");
const ProxyCallerServices = require("../services/ProxyCallerServices");
const {
  validateMovieSearch,
} = require("../middleware/validation/moviesValidation");

const router = express.Router();
const proxyCallerServices = new ProxyCallerServices();
const moviesController = new MoviesController(proxyCallerServices);

router.get(
  "/movies/search",
  validateMovieSearch,
  moviesController.searchMovies.bind(moviesController)
);




module.exports = router;
