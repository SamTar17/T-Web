const ReviewModel = require("../models/ReviewModel");

/**
 * ReviewController - Gestisce le richieste HTTP per le recensioni
 *
 * RESPONSABILITÀ DEL CONTROLLER (come hai intuito correttamente):
 * - Validazione dei parametri in arrivo
 * - Chiamata al Model appropriato
 * - Gestione degli errori e traduzione in risposte HTTP
 * - Logging per debugging
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
    // STEP 1: VALIDAZIONE INPUT
    // Qui il Controller si prende la responsabilità di verificare che i dati in arrivo siano sensati
    const movieId = parseInt(req.params.movieId);

    // Validazione: deve essere un numero positivo
    if (isNaN(movieId) || movieId <= 0) {
      console.warn(
        `⚠️ Richiesta recensioni con movieId non valido: ${req.params.movieId}`
      );
      return res.status(400).json({
        success: false,
        error: "ID film non valido. Deve essere un numero positivo.",
        code: "INVALID_MOVIE_ID",
      });
    }

    // STEP 2: LOGGING PER DEBUGGING
    // Il Controller logga informazioni utili per capire cosa sta succedendo
    console.log(`📥 Richiesta recensioni per film ID: ${movieId}`);

    // STEP 3: CHIAMATA AL MODEL
    // Qui delega al Model il compito di recuperare i dati
    const reviews = await ReviewModel.getReviewsByMovieId(movieId);

    // STEP 4: ELABORAZIONE DEL RISULTATO
    // Il Controller decide come interpretare il risultato del Model
    if (reviews.length === 0) {
      // Questo NON è un errore - è un caso normale che gestiamo elegantemente
      console.log(`📊 Nessuna recensione trovata per film ID: ${movieId}`);
      return res.status(200).json({
        success: true,
        message: "Film trovato ma senza recensioni disponibili",
        movieId: movieId,
        reviews: [],
        count: 0,
      });
    }

    // STEP 5: RISPOSTA DI SUCCESSO
    // Il Controller formatta la risposta in modo standardizzato
    console.log(
      `✅ Inviate ${reviews.length} recensioni per film ID: ${movieId}`
    );

    res.status(200).json({
      success: true,
      movieId: movieId,
      reviews: reviews,
      count: reviews.length,
      message: `${reviews.length} recensioni trovate`,
    });
  } catch (error) {
    // STEP 6: GESTIONE ERRORI SISTEMICI
    // Il Controller trasforma errori tecnici in risposte HTTP comprensibili
    console.error(
      `❌ Errore durante recupero recensioni per ID ${req.params.movieId}:`,
      error.message
    );

    // Potremmo distinguere diversi tipi di errore qui (database offline, timeout, etc.)
    res.status(500).json({
      success: false,
      error: "Errore interno del server durante il recupero delle recensioni",
      code: "INTERNAL_SERVER_ERROR",
      movieId: req.params.movieId,
    });
  }
  /**
   * NUOVA FUNZIONE NEL ReviewController: Gestisce richieste per statistiche recensioni
   *
   * ENDPOINT: GET /api/reviews/movie/:movieId/stats
   *
   * FILOSOFIA: Questo controller segue gli stessi principi del controller per le recensioni,
   * ma gestisce le specificità delle statistiche aggregate.
   *
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async function getMovieReviewStats(req, res) {
    try {
      // STEP 1: VALIDAZIONE INPUT (identica al controller precedente)
      //
      // PERCHÉ RIPETERE LA VALIDAZIONE: Anche se questo endpoint potrebbe essere
      // chiamato subito dopo aver chiamato l'endpoint delle recensioni (che ha
      // già validato lo stesso movieId), non possiamo assumere questo flusso.
      // Ogni endpoint deve essere autonomo e validare i propri input.
      const movieId = parseInt(req.params.movieId);

      if (isNaN(movieId) || movieId <= 0) {
        console.warn(
          `⚠️ Richiesta statistiche con movieId non valido: ${req.params.movieId}`
        );
        return res.status(400).json({
          success: false,
          error: "ID film non valido. Deve essere un numero positivo.",
          code: "INVALID_MOVIE_ID",
        });
      }

      // STEP 2: LOGGING SPECIFICO PER LE STATISTICHE
      //
      // Nota come il messaggio di log è specifico per le statistiche.
      // Questo ci aiuterà nei log di produzione a distinguere tra richieste
      // di recensioni e richieste di statistiche.
      console.log(
        `📊 Richiesta statistiche recensioni per film ID: ${movieId}`
      );

      // STEP 3: CHIAMATA AL MODEL
      //
      // Qui delghiamo al Model il complesso lavoro di aggregazione.
      // Il Controller non deve sapere nulla di aggregation pipeline o
      // calcoli matematici - si fida che il Model farà il lavoro corretto.
      const stats = await ReviewModel.getMovieReviewStats(movieId);

      // STEP 4: GESTIONE DEL CASO "NESSUNA RECENSIONE"
      //
      // DECISIONE DI DESIGN IMPORTANTE: Come gestiamo un film senza recensioni?
      // Abbiamo diverse opzioni:
      // A) Errore 404 "Film non trovato"
      // B) Successo 200 con messaggio "Nessuna recensione"
      // C) Successo 200 con statistiche "zero"
      //
      // Scegliamo l'opzione C perché è più utile per il frontend.
      // Il frontend può sempre mostrare "Questo film non ha ancora recensioni"
      // ma avere una struttura dati consistente semplifica enormemente
      // la gestione nel codice frontend.
      if (stats === null) {
        console.log(
          `📊 Nessuna recensione per statistiche film ID: ${movieId}`
        );

        // RISPOSTA STRUTTURATA per film senza recensioni
        // Nota come manteniamo la stessa struttura dati che avremmo
        // se ci fossero recensioni, ma con valori "zero" o null appropriati.
        return res.status(200).json({
          success: true,
          movieId: movieId,
          hasReviews: false,
          message:
            "Film trovato ma senza recensioni disponibili per il calcolo delle statistiche",
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

      // STEP 5: ARRICCHIMENTO DEI DATI (VALORE AGGIUNTO DEL CONTROLLER)
      //
      // Il Controller non si limita a passare attraverso i dati del Model.
      // Può aggiungere informazioni derivate che sono utili per il frontend
      // ma che non appartengono logicamente al Model.

      // Esempio: Classificazione qualitativa del punteggio
      let scoreClassification = "unknown";
      if (stats.averageScore !== null) {
        if (stats.averageScore >= 4.0) scoreClassification = "excellent";
        else if (stats.averageScore >= 3.5) scoreClassification = "good";
        else if (stats.averageScore >= 2.5) scoreClassification = "average";
        else scoreClassification = "poor";
      }

      // Esempio: Livello di copertura delle recensioni
      let reviewCoverage = "low";
      if (stats.totalReviews >= 100) reviewCoverage = "high";
      else if (stats.totalReviews >= 20) reviewCoverage = "medium";

      // STEP 6: RISPOSTA DI SUCCESSO STRUTTURATA
      //
      // Nota come la risposta segue lo stesso pattern del controller precedente
      // (success, movieId, message) ma include dati specifici per le statistiche.
      console.log(
        `✅ Statistiche calcolate per film ID: ${movieId} - Media: ${stats.averageScore}, Recensioni: ${stats.totalReviews}`
      );

      res.status(200).json({
        success: true,
        movieId: movieId,
        hasReviews: true,
        message: `Statistiche calcolate da ${stats.totalReviews} recensioni`,

        // Statistiche raw dal Model
        stats: stats,

        // Dati derivati aggiunti dal Controller per migliorare UX
        metadata: {
          scoreClassification: scoreClassification,
          reviewCoverage: reviewCoverage,
          recommendationStrength:
            stats.totalReviews >= 10 ? "reliable" : "limited",

          // Timestamp per cache invalidation nel frontend
          calculatedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      // STEP 7: GESTIONE ERRORI (identica ma con logging specifico)
      //
      // Nota come il messaggio di errore è specifico per le statistiche,
      // ma la struttura della risposta è identica al controller precedente.
      // Questa consistenza è cruciale per il codice che consuma l'API.
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

  // EXPORT: Aggiungiamo la nuova funzione alle esportazioni esistenti
}

module.exports = {
  getReviewsByMovieId,
  getMovieReviewStats, // <- Nuova funzione
};
