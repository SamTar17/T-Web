const express = require('express');
const { getReviewsByMovieId, getMovieReviewStats } = require('../controllers/reviewController');

const router = express.Router();

/**
 * FILOSOFIA DELLE ROUTE: Ogni Route è un contratto
 * 
 * Quando definiamo una Route, stiamo creando un contratto pubblico che dice:
 * "Se invii una richiesta HTTP in questo formato specifico, riceverai una risposta in questo formato specifico"
 * 
 * Questo contratto deve essere:
 * - Intuitivo (facile da capire al primo sguardo)
 * - Consistente (segue pattern prevedibili)
 * - Stabile (non cambia frequentemente)
 * - Documentato (chiaro nelle aspettative)
 */

/**
 * GET /api/reviews/movie/:movieId
 * 
 * DESIGN DECISION: Perché abbiamo scelto questo pattern URL?
 * 
 * Struttura: /api/reviews/movie/:movieId
 * - /api = namespace generale dell'applicazione
 * - /reviews = tipo di risorsa che stiamo gestendo
 * - /movie = sotto-categoria che specifica il contesto
 * - /:movieId = parametro variabile che identifica la risorsa specifica
 * 
 * ALTERNATIVE CONSIDERATE:
 * - /api/movie/:movieId/reviews (film-centrico)
 * - /api/reviews?movieId=:movieId (query-parameter based)
 * 
 * Abbiamo scelto il pattern attuale perché:
 * 1. È reviews-centrico (siamo nel server delle recensioni)
 * 2. È RESTful e intuitivo
 * 3. È facilmente estendibile per altri tipi di query sulle recensioni
 * 
 * ESEMPI DI USO:
 * GET /api/reviews/movie/123 → Recensioni del film con ID 123
 * GET /api/reviews/movie/456 → Recensioni del film con ID 456
 * 
 * FORMATO RISPOSTA ATTESA:
 * Success (200): { success: true, reviews: [...], count: N }
 * Validation Error (400): { success: false, error: "...", code: "..." }
 * Server Error (500): { success: false, error: "...", code: "..." }
 */
router.get('/reviews/movie/:movieId', getReviewsByMovieId);
router.get('/reviews/movie/:movieId/stats', getMovieReviewStats);
/**
 * ESTENSIBILITÀ FUTURA
 * 
 * Questo pattern URL ci permette di aggiungere facilmente altri endpoint correlati:
 * - GET /api/reviews/movie/:movieId/stats (statistiche)
 * - GET /api/reviews/movie/:movieId/summary (riassunto)
 * - GET /api/reviews/critic/:criticName (recensioni per critico)
 * - GET /api/reviews/publisher/:publisherName (recensioni per editore)
 * 
 * La consistenza nel naming aiuta gli sviluppatori a predire come funzionano altri endpoint
 * anche senza leggere documentazione dettagliata.
 */

module.exports = router;