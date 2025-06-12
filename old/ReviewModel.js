const databaseManager = require("../../../services/DatabaseManager");

/**
 * ReviewModel - Gestisce l'accesso ai dati delle recensioni  
 * 
 * Metodi statici :  
 * - getReviewsCollection()  
 * - getReviewsById()
 */
class ReviewModel {
  /**
   * Ottiene la connessione alla collezione reviews di MongoDB
   */
  static getReviewsCollection() {
    const reviewsConnection = databaseManager.getReviewsCollection();
    return reviewsConnection;
  }

  /**
   * Recupera recensioni di un film specifico tramite ID
   *
   * @param {number} movieId - ID del film nel database PostgreSQL
   * @returns {Promise<Array>} Array di recensioni per il film
   */
  static async getReviewsById(movieId) {
    try {
      console.log(`🔍 Cercando recensioni per film ID: ${movieId}`);

      const collection = this.getReviewsCollection();

      const reviews = await collection
        .find({
          id_movies: movieId, 
        })
        .toArray(); // Converte il cursor MongoDB in array JavaScript

      console.log(
        `✅ Trovate ${reviews.length} recensioni per film ID ${movieId}`
      );

      return reviews;

    } catch (error) {
      // GESTIONE ERRORI: Loggiamo l'errore e lo rilanciamo per il controller
      console.error(
        `❌ Errore ReviewModel -> getReviewsById ${movieId}:`,
        error.message
      );
      throw error; // Il controller gestirà la risposta HTTP appropriata!!!!!!!
    }
  }
  /**
   * Calcola statistiche recensioni
   *
   * @param {number} movieId 
   * @returns {Promise<Object>}
   */
  static async getMovieReviewStats(movieId) {
    try {
      const collection = this.getReviewsCollection();

      const pipeline = [
        {
          $match: {
            id_movies: movieId, // Filtra solo recensioni di questo film
          },
        },
        {
          $group: {
            _id: null, // non raggruppa

            totalReviews: {
              $sum: 1, 
            },

            averageScore: {
              $avg: "$review_score",
            },

            maxScore: {
              $max: "$review_score",
            },

            minScore: {
              $min: "$review_score", 
            },

            positiveReviews: {
              $sum: {
                $cond: [
                  { $gte: ["$review_score", 6] }, 
                  1,
                  0,
                ],
              },
            },
            negativeReviews: {
              $sum: {
                $cond: [
                  { $lt: ["$review_score", 6] }, 
                  1, 
                  0, 
                ],
              },
            },

            reviewTypes: {
              $push: "$review_type",
            },
          },
        },
//=== pulizia dati === 
        {
          $project: {
            _id: 0,
            totalReviews: 1,
            maxScore: 1,
            minScore: 1,
            averageScore: {
              $round: ["$averageScore", 2],
            },
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
            positiveReviews: 1,
            negativeReviews: 1,

            reviewTypeDistribution: {
              $let: {
                vars: {

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
                  $arrayToObject: "$$typeGroups",
                },
              },
            },
          },
        },
      ];

      const result = await collection.aggregate(pipeline).toArray();

      if (result.length === 0) {
        return null; 
      }

      const stats = result[0];

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
