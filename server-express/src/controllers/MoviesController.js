// controllers/MoviesController.js
class MoviesController {
  constructor(proxyService) {
    this.proxyCallerServices = proxyService;
  }

  async searchMovies(req, res, next) {
    try {
      const searchParams = new URLSearchParams();

      if (req.query.title) searchParams.set("title", req.query.title);
      if (req.query.page) searchParams.set("page", req.query.page);
      if (req.query.limit) searchParams.set("limit", req.query.limit);
      if (req.query.genre) searchParams.set("genre", req.query.genre);
      if (req.query.year_from)
        searchParams.set("year_from", req.query.year_from);
      if (req.query.year_to) searchParams.set("year_to", req.query.year_to);
      if (req.query.min_rating)
        searchParams.set("min_rating", req.query.min_rating);
      if (req.query.max_rating)
        searchParams.set("max_rating", req.query.max_rating);

      const endpoint = `/api/movies/search?${searchParams.toString()}`;
      const flaskResponse = await this.proxyCallerServices.callFlask(endpoint);

      res.json(flaskResponse.data);
    } catch (error) {
      next(error);
    }
  }

  async getMovieDetails(req, res, next) {
    try {
      const movieId = parseInt(req.params.movieId);

      console.log(`Recuperando dati aggregati per film ID: ${movieId}`);

      const [movieResult, reviewsResults, reviewsStats] =
        await Promise.allSettled([
          this.proxyCallerServices.callFlask(`/api/movies/${movieId}`),
          this.proxyCallerServices.callMongoDB(`/api/reviews/movie/${movieId}`),
          this.proxyCallerServices.callMongoDB(
            `/api/reviews/movie/${movieId}/stats`
          ),
        ]);

      if (movieResult.status === "rejected") {
        const error = movieResult.reason;
        error.additionalDetails = {
          ...(error.additionalDetails ?? {}),
          message: error.response?.data?.error || null,
          idMovie: error.response?.data?.movie_id || null,
          reviewsResults: reviewsResults.status,
        };
        next(error);
        
      } else {
        const response = {};

        if (reviewsResults.status === "rejected") {
          response.reviews = null;
          response.reviewsStat = null;
        } else {
          response.reviews = reviewsResults.value.data;
          response.reviewsStat = reviewsStats.value.data;
        }

        response.movieDetails = movieResult.value.data;

        res.status(200).json(response);
      }
    } catch (error) {
      next(error);
    }
  }

  async getSuggestions(req,res,next){
    try {
      const searchParams = new URLSearchParams();
      if (req.query.q) searchParams.set('q' ,req.query.q);

      const endpoint = `/api/movies/suggestions?${searchParams.toString()}`;
      const flaskResponse = await this.proxyCallerServices.callFlask(endpoint);
      res.json(flaskResponse.data);

    }catch (error){
      next(error)
    }
  }
}

module.exports = MoviesController;
