const databaseManager = require("../../chat/services/DatabaseManager");

/**
 * ReviewModel - Gestisce l'accesso ai dati delle recensioni
 *
 * FILOSOFIA: Iniziamo con una funzione semplice e la espandiamo gradualmente.
 * Ogni funzione avrà una responsabilità specifica e chiara.
 */
class ReviewModel {
  /**
   * Ottiene la connessione alla collezione reviews di MongoDB
   *
   * PERCHÉ QUESTO METODO: Centralizzare l'accesso alla collezione ci permette
   * di cambiare la logica di connessione in futuro senza modificare ogni funzione.
   */
  static getReviewsCollection() {
    const reviewsConnection = databaseManager.getReviewsConnection();
    return reviewsConnection.db.collection("reviews");
  }

  /**
   * FUNZIONE BASE: Recupera recensioni di un film specifico tramite ID
   *
   * @param {number} movieId - ID del film nel database PostgreSQL
   * @returns {Promise<Array>} Array di recensioni per il film
   *
   * LOGICA: Questa è la funzione fondamentale. Dato l'ID del film che arriva
   * dal server centrale (che a sua volta lo ha dal database PostgreSQL),
   * cerchiamo tutte le recensioni che hanno quel id_movies corrispondente.
   */
  static async getReviewsByMovieId(movieId) {
    try {
      console.log(`🔍 Cercando recensioni per film ID: ${movieId}`);

      // Otteniamo la collezione MongoDB
      const collection = this.getReviewsCollection();

      // Query semplice: trova tutti i documenti dove id_movies = movieId
      const reviews = await collection
        .find({
          id_movies: movieId, // Il campo che hai aggiunto con il matching
        })
        .toArray(); // Converte il cursor MongoDB in array JavaScript

      console.log(
        `✅ Trovate ${reviews.length} recensioni per film ID ${movieId}`
      );

      // GESTIONE CASO NORMALE: Restituiamo sempre un array, anche se vuoto
      // Questo è importante: un film senza recensioni non è un errore!
      return reviews;
    } catch (error) {
      // GESTIONE ERRORI: Loggiamo l'errore e lo rilanciamo per il controller
      console.error(
        `❌ Errore recupero recensioni per film ID ${movieId}:`,
        error.message
      );
      throw error; // Il controller gestirà la risposta HTTP appropriata
    }
  }
  /**
   * NUOVA FUNZIONE NEL ReviewModel: Calcola statistiche recensioni
   *
   * TEORIA DELLE AGGREGATION PIPELINE:
   * Un'aggregazione è come una catena di montaggio dove ogni "stage"
   * trasforma i dati in modo specifico. I dati fluiscono da uno stage
   * al successivo, venendo elaborati step by step.
   *
   * @param {number} movieId - ID del film nel database PostgreSQL
   * @returns {Promise<Object>} Statistiche aggregate delle recensioni
   */
  static async getMovieReviewStats(movieId) {
    try {
      console.log(
        `📊 Calcolando statistiche recensioni per film ID: ${movieId}`
      );

      // Otteniamo la collezione MongoDB
      const collection = this.getReviewsCollection();

      /**
       * AGGREGATION PIPELINE SPIEGATA STAGE PER STAGE
       *
       * Ogni elemento dell'array rappresenta uno "stage" della pipeline.
       * I dati fluiscono dall'alto verso il basso, trasformandosi ad ogni passaggio.
       */
      const pipeline = [
        /**
         * STAGE 1: $match - Il Filtro Iniziale
         *
         * Questo è equivalente al WHERE in SQL. Selezioniamo solo i documenti
         * che corrispondono ai nostri criteri. È importante mettere $match
         * il prima possibile nella pipeline per ridurre il numero di documenti
         * che gli stage successivi devono elaborare.
         *
         * PRIMA: Tutti i documenti della collezione reviews
         * DOPO: Solo le recensioni del film specificato
         */
        {
          $match: {
            id_movies: movieId, // Filtra solo recensioni di questo film
          },
        },

        /**
         * STAGE 2: $group - Il Cuore del Calcolo
         *
         * Questo stage raggruppa tutti i documenti che sono passati dal $match
         * e calcola valori aggregati. È qui che avviene la "magia" del calcolo
         * delle statistiche.
         *
         * _id: null significa "metti tutto in un singolo gruppo"
         * Ogni campo dopo _id definisce un calcolo da fare su questo gruppo.
         *
         * PRIMA: Array di documenti recensione individuali
         * DOPO: Un singolo documento con tutte le statistiche calcolate
         */
        {
          $group: {
            _id: null, // Raggruppa tutto insieme (non creare sottogruppi)

            /**
             * CALCOLI STATISTICI BASE
             * Questi usano gli "accumulator operators" di MongoDB
             */
            totalReviews: {
              $sum: 1, // Conta ogni documento che passa (equivale a COUNT(*))
            },

            averageScore: {
              $avg: "$review_score", // Calcola la media del campo review_score
            },

            maxScore: {
              $max: "$review_score", // Trova il valore massimo
            },

            minScore: {
              $min: "$review_score", // Trova il valore minimo
            },

            /**
             * CALCOLI PIÙ SOFISTICATI: Analisi della Distribuzione
             *
             * Questi calcoli ci danno insight più profondi sui pattern delle recensioni.
             * Usando $sum con condizioni, possiamo contare quante recensioni
             * soddisfano criteri specifici.
             */

            // Conta recensioni positive (assumendo che punteggi >= 3.5 siano positivi)
            positiveReviews: {
              $sum: {
                $cond: [
                  { $gte: ["$review_score", 3.5] }, // Se review_score >= 3.5
                  1, // allora aggiungi 1 al conteggio
                  0, // altrimenti aggiungi 0
                ],
              },
            },

            // Conta recensioni negative (punteggi < 3.5)
            negativeReviews: {
              $sum: {
                $cond: [
                  { $lt: ["$review_score", 3.5] }, // Se review_score < 3.5
                  1, // allora aggiungi 1 al conteggio
                  0, // altrimenti aggiungi 0
                ],
              },
            },

            /**
             * ANALISI QUALITATIVA: Distribuzione per Tipo di Review
             *
             * Questo ci dice quante recensioni sono "Fresh", "Rotten", etc.
             * $push raccoglie tutti i valori in un array che poi processeremo.
             */
            reviewTypes: {
              $push: "$review_type", // Crea un array con tutti i review_type
            },

            /**
             * ANALISI DELLE FONTI: Publisher Unici
             *
             * $addToSet è come $push ma elimina automaticamente i duplicati.
             * Ci dice quanti publisher diversi hanno recensito questo film.
             */
            uniquePublishers: {
              $addToSet: "$publisher_name", // Array di publisher unici
            },
          },
        },

        /**
         * STAGE 3: $project - Formattazione del Risultato Finale
         *
         * Questo stage ci permette di "ripulire" il risultato, rimuovendo campi
         * non necessari, rinominando campi, e facendo calcoli finali sui dati
         * che abbiamo aggregato nello stage precedente.
         *
         * È come l'ultimo controllo qualità prima di spedire il prodotto finale.
         *
         * PRIMA: Documento con dati grezzi dell'aggregazione
         * DOPO: Documento pulito e formattato per l'uso nel frontend
         */
        {
          $project: {
            _id: 0, // Rimuovi il campo _id dal risultato finale

            // Statistiche base (passate direttamente)
            totalReviews: 1,
            maxScore: 1,
            minScore: 1,

            // Media arrotondata a 2 decimali per leggibilità
            averageScore: {
              $round: ["$averageScore", 2],
            },

            // Calcolo delle percentuali
            positivePercentage: {
              $round: [
                {
                  $multiply: [
                    { $divide: ["$positiveReviews", "$totalReviews"] },
                    100,
                  ],
                },
                1, // Arrotonda a 1 decimale
              ],
            },

            negativePercentage: {
              $round: [
                {
                  $multiply: [
                    { $divide: ["$negativeReviews", "$totalReviews"] },
                    100,
                  ],
                },
                1,
              ],
            },

            // Conteggi assoluti
            positiveReviews: 1,
            negativeReviews: 1,

            // Numero di publisher unici (calcolato dalla lunghezza dell'array)
            publisherCount: {
              $size: "$uniquePublishers",
            },

            /**
             * ELABORAZIONE AVANZATA: Distribuzione Tipi di Review
             *
             * Questo è il calcolo più complesso. Prendiamo l'array di review_type
             * e lo trasformiamo in un oggetto che conta quante volte appare
             * ogni tipo. È equivalente a un GROUP BY review_type COUNT(*) in SQL.
             */
            reviewTypeDistribution: {
              $let: {
                vars: {
                  // Crea array di oggetti {k: "tipo", v: conteggio}
                  typeGroups: {
                    $map: {
                      input: {
                        $setUnion: ["$reviewTypes", []], // Rimuove duplicati
                      },
                      as: "type",
                      in: {
                        k: "$$type", // Il tipo di review (es. "Fresh")
                        v: {
                          $size: {
                            $filter: {
                              input: "$reviewTypes",
                              cond: { $eq: ["$$this", "$$type"] },
                            },
                          },
                        },
                      },
                    },
                  },
                },
                in: {
                  $arrayToObject: "$$typeGroups", // Converte array in oggetto
                },
              },
            },
          },
        },
      ];

      /**
       * ESECUZIONE DELLA PIPELINE
       *
       * Ora che abbiamo definito tutti gli stage, eseguiamo la pipeline.
       * Il risultato sarà un array con un singolo documento che contiene
       * tutte le nostre statistiche calcolate.
       */
      const result = await collection.aggregate(pipeline).toArray();

      // GESTIONE CASO: Nessuna Recensione Trovata
      if (result.length === 0) {
        console.log(`📊 Nessuna recensione trovata per film ID: ${movieId}`);
        return null; // Il controller gestirà questo caso
      }

      const stats = result[0]; // Prendiamo il primo (e unico) risultato

      console.log(
        `✅ Statistiche calcolate per film ID ${movieId}: ${stats.totalReviews} recensioni, media ${stats.averageScore}`
      );

      return stats;
    } catch (error) {
      console.error(
        `❌ Errore calcolo statistiche per film ID ${movieId}:`,
        error.message
      );
      throw error; // Il controller gestirà l'errore HTTP
    }
  }
}

module.exports = ReviewModel;
