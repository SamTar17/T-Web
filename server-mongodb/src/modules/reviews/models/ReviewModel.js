const mongoose = require("mongoose");
const databaseManager = require("../../../services/DatabaseManager");

const reviewSchema = new mongoose.Schema(
  {
    movie_title: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    review_type: {
      type: String,
      enum: {
        values: ["Fresh", "Rotten", "Certified Fresh", "Spilled"],
        message:
          "Tipo recensione deve essere: Fresh, Rotten, Certified Fresh, o Spilled",
      },
      index: true,
    },

    publisher_name: {
      type: String,
      trim: true,
    },

    id_movie: {
      type: Number,
      required: false,
      index: true,
      validate: {
        validator: function (value) {
          return (
            value === null ||
            value === undefined ||
            (Number.isInteger(value) && value > 0)
          );
        },
        message: "ID film deve essere un numero intero positivo",
      },
    },

    rotten_tomatoes_link: {
      type: String,
    },

    critic_name: {
      type: String,
    },

    review_score: {
      type: Number,
      validate: {
        validator: function (value) {
          return value > 0;
        },
        message: "review_score deve essere un numero positivo",
      },
    },

    review_date: {
      type: String,
    },
    top_critic: {
      type: Boolean,
    },
    review_content: {
      type: String,
      maxlength: 600,
    },
  },
  {
    collection: "reviews",
  }
);

reviewSchema.index({ id_movie: 1, review_date: -1 });
reviewSchema.index({ movie_title: 1, review_type: 1 });

reviewSchema.statics.getReviewsByMovieId = async function (
  movieId,
  pagination = {}
) {
  try {
    //destrutturazione dell oggetto pagination
    const {
      page = 1,
      limit = 20,
      sortBy = "review_date",
      sortOrder = -1, // -1 = DESC, 1 = ASC
    } = pagination;

    const skip = (page - 1) * limit;

    const [reviews, totalCount] = await Promise.all([
      this.find({ id_movie: movieId })
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.countDocuments({ id_movie: movieId }),
    ]);

    return { reviews, totalCount };
  } catch (error) {
    console.error(
      `❌ Mongoose: Errore recupero recensioni per film ID ${movieId}:`,
      error.message
    );
    throw error;
  }
};

reviewSchema.statics.getReviewsStatistics = async function (movieId) {
  try {
    const pipeline = [
      // === STAGE 1: FILTRO INIZIALE ===
      {
        $match: {
          id_movie: movieId,
          review_score: {
            $gt: 0, // Esclude i nan
            $exists: true, // Campo deve esistere
            $type: "number", // Deve essere un numero
          },

          review_type: {
            $in: ["Fresh", "Rotten", "Certified Fresh", "Spilled"],
          },
        },
      },

      // === STAGE 2: AGGREGAZIONE PRINCIPALE ===
      {
        $group: {
          _id: null,

          // Contatori base
          totalReviews: { $sum: 1 },

          // Statistiche punteggi (solo valori numerici validi)
          averageScore: { $avg: "$review_score" },
          maxScore: { $max: "$review_score" },
          minScore: { $min: "$review_score" },

          // 🆕 CONTEGGIO FRESH (Fresh + Certified Fresh)
          freshReviews: {
            $sum: {
              $cond: [
                { $in: ["$review_type", ["Fresh", "Certified Fresh"]] },
                1,
                0,
              ],
            },
          },

          // 🆕 CONTEGGIO ROTTEN (Rotten + Spilled)
          rottenReviews: {
            $sum: {
              $cond: [{ $in: ["$review_type", ["Rotten", "Spilled"]] }, 1, 0],
            },
          },

          // Manteniamo anche il conteggio per punteggio (backup)
          positiveScoreReviews: {
            $sum: {
              $cond: [{ $gte: ["$review_score", 6] }, 1, 0],
            },
          },

          negativeScoreReviews: {
            $sum: {
              $cond: [{ $lt: ["$review_score", 6] }, 1, 0],
            },
          },

          // Array di tutti i tipi per distribuzione dettagliata
          reviewTypes: { $push: "$review_type" },
        },
      },

      // === STAGE 3: CALCOLO PERCENTUALI E PULIZIA ===
      {
        $project: {
          _id: 0,
          totalReviews: 1,
          maxScore: 1,
          minScore: 1,

          // Punteggio medio arrotondato
          averageScore: {
            $round: ["$averageScore", 2],
          },

          // 🆕 PERCENTUALI FRESH/ROTTEN
          freshPercentage: {
            $cond: [
              { $gt: ["$totalReviews", 0] },
              {
                $round: [
                  {
                    $multiply: [
                      { $divide: ["$freshReviews", "$totalReviews"] },
                      100,
                    ],
                  },
                  1,
                ],
              },
              0,
            ],
          },

          rottenPercentage: {
            $cond: [
              { $gt: ["$totalReviews", 0] },
              {
                $round: [
                  {
                    $multiply: [
                      { $divide: ["$rottenReviews", "$totalReviews"] },
                      100,
                    ],
                  },
                  1,
                ],
              },
              0,
            ],
          },

          // Conteggi assoluti Fresh/Rotten
          freshCount: "$freshReviews",
          rottenCount: "$rottenReviews",

          // Manteniamo anche le percentuali per punteggio (per confronto)
          positiveScorePercentage: {
            $cond: [
              { $gt: ["$totalReviews", 0] },
              {
                $round: [
                  {
                    $multiply: [
                      { $divide: ["$positiveScoreReviews", "$totalReviews"] },
                      100,
                    ],
                  },
                  1,
                ],
              },
              0,
            ],
          },

          // 🆕 DISTRIBUZIONE DETTAGLIATA PER TIPO
          reviewTypeDistribution: {
            $let: {
              vars: {
                typeGroups: {
                  $map: {
                    input: { $setUnion: ["$reviewTypes", []] },
                    as: "type",
                    in: {
                      k: "$$type",
                      v: {
                        count: {
                          $size: {
                            $filter: {
                              input: "$reviewTypes",
                              cond: { $eq: ["$$this", "$$type"] },
                            },
                          },
                        },
                        percentage: {
                          $round: [
                            {
                              $multiply: [
                                {
                                  $divide: [
                                    {
                                      $size: {
                                        $filter: {
                                          input: "$reviewTypes",
                                          cond: { $eq: ["$$this", "$$type"] },
                                        },
                                      },
                                    },
                                    "$totalReviews",
                                  ],
                                },
                                100,
                              ],
                            },
                            1,
                          ],
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

    const result = await this.aggregate(pipeline);

    const stats = result.length === 0 ? null : result[0];

    console.log(
      `✅ Statistiche calcolate per film ID ${movieId}: ${stats.totalReviews} recensioni, media ${stats.averageScore}`
    );

    return stats;
  } catch (error) {
    console.error(
      `❌ Errore calcolo statistiche per film ID ${movieId}:`,
      error.message
    );
    throw error;
  }
};

function getReviewModel() {
  const connection = databaseManager.getConnection();
  return connection.model("Review", reviewSchema);
}

module.exports = { getReviewModel };
