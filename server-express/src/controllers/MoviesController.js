// controllers/MoviesController.js
class MoviesController {
  constructor(proxyCallerServices) {
    this.proxyCallerServices = proxyCallerServices;
  }

  async searchMovies(req, res, next) {
    try {

      const searchParams = new URLSearchParams();
      
      if (req.query.title) searchParams.set('title', req.query.title);
      if (req.query.page) searchParams.set('page', req.query.page);
      if (req.query.limit) searchParams.set('limit', req.query.limit);
      if (req.query.genre) searchParams.set('genre', req.query.genre);
      if (req.query.year_from) searchParams.set('year_from', req.query.year_from);
      if (req.query.year_to) searchParams.set('year_to', req.query.year_to);
      if (req.query.min_rating) searchParams.set('min_rating', req.query.min_rating);
      if (req.query.max_rating) searchParams.set('max_rating', req.query.max_rating);
      
      const endpoint = `/api/movies/search?${searchParams.toString()}`;
      const flaskResponse = await this.proxyCallerServices.callFlask(endpoint);
      
      res.json(flaskResponse.data);
      
    } catch (error) {
      next(error);
    }
  }

async getMovieDetails(req, res, next) {
  try {
    // PASSAGGIO 1: Validazione iniziale del movieId
    const movieId = parseInt(req.params.movieId, 10);
    
    if (isNaN(movieId) || movieId <= 0) {
      const error = new Error('ID film deve essere un numero positivo');
      error.statusCode = 400;
      error.userFriendly = true;
      throw error;
    }

    console.log(`Recuperando dati aggregati per film ID: ${movieId}`);

    // PASSAGGIO 2: Chiamate parallele ai microservizi
    const [movieResult, reviewsResult] = await Promise.allSettled([
      this.proxyCallerServices.callFlask(`/api/movies/${movieId}`),
      this.proxyCallerServices.callMongoDB(`/api/reviews/movie/${movieId}`)
    ]);




    
    // PASSAGGIO 3: Gestione risposta Flask (critica per l'esistenza del film)
    if (movieResult.status === 'rejected') {
      const flaskError = movieResult.reason;
      
      // Analizziamo il tipo di errore da Flask
      if (flaskError.response && flaskError.response.status === 404) {
        // Flask ha risposto esplicitamente 404 - il film non esiste
        const error = new Error('Film non trovato');
        error.statusCode = 404;
        error.userFriendly = true;
        throw error;
      } else {
        // Errore di connessione o altro problema di servizio
        const error = new Error('Servizio film temporaneamente non disponibile');
        error.statusCode = 503;
        error.userFriendly = true;
        error.originalError = flaskError.message;
        throw error;
      }
    }

    // PASSAGGIO 4: Estrazione dati film (Flask ha avuto successo)
    const flaskResponse = movieResult.value.data;
    
    // Verifichiamo la struttura della risposta di Flask
    if (!flaskResponse.success || !flaskResponse.movie) {
      const error = new Error('Risposta non valida dal servizio film');
      error.statusCode = 502;
      error.userFriendly = true;
      throw error;
    }

    // PASSAGGIO 5: Gestione risposta MongoDB (non critica)
    let reviewsData = {
      available: true,
      reviews: [],
      count: 0,
      stats: null,
      error: null
    };

    if (reviewsResult.status === 'fulfilled') {
      // MongoDB ha risposto con successo
      const mongoResponse = reviewsResult.value.data;
      
      if (mongoResponse.success) {
        // Risposta normale - potrebbe essere array vuoto (normale) o con dati
        reviewsData = {
          available: true,
          reviews: mongoResponse.reviews || [],
          count: mongoResponse.count || 0,
          stats: null, // Dovremmo chiamare anche /stats se serve
          error: null
        };
        
        console.log(`Recensioni per film ${movieId}: ${reviewsData.count} trovate`);
      } else {
        // MongoDB ha risposto ma con errore applicativo
        reviewsData.available = false;
        reviewsData.error = 'Errore nel recupero delle recensioni';
        console.warn(`Errore applicativo MongoDB per film ${movieId}: ${mongoResponse.error}`);
      }
    } else {
      // MongoDB non ha risposto (errore di rete/servizio)
      reviewsData.available = false;
      reviewsData.error = 'Servizio recensioni temporaneamente non disponibile';
      console.warn(`Errore di servizio MongoDB per film ${movieId}: ${reviewsResult.reason.message}`);
    }

    // PASSAGGIO 6: Costruzione risposta aggregata consistente
    const aggregatedResponse = {
      success: true,
      movie: flaskResponse.movie,
      reviews: reviewsData,
      metadata: {
        movieId: movieId,
        retrievedAt: new Date().toISOString(),
        services: {
          movie: 'available',
          reviews: reviewsData.available ? 'available' : 'degraded'
        }
      }
    };

    res.json(aggregatedResponse);

  } catch (error) {
    // PASSAGGIO 7: Error handling consistente con i microservizi
    if (!error.statusCode) {
      error.statusCode = 500;
      error.message = 'Errore interno durante il recupero dei dati del film';
      error.userFriendly = true;
    }
    
    console.error(`Errore getMovieDetails per film ${req.params.movieId}:`, error.message);
    next(error);
  }
}


}

module.exports = MoviesController;