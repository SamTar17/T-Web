// middleware/validation/moviesValidation.js
const { query } = require("express-validator");
const { valTitle, valPage, valLimit } = require("./common");
const {checkValidationErrors} =  require('./checkValidationErrors')

const valYearFrom = query("year_from")
  .optional()
  .isInt({ min: 1900, max: 2050 })
  .withMessage("Anno inizio deve essere tra 1900 e 2050")
  .toInt();

const valYearTo = query("year_to")
  .optional()
  .isInt({ min: 1900, max: 2050 })
  .withMessage("Anno fine deve essere tra 1900 e 2050")
  .toInt();

const valMinRating = query("min_rating")
  .optional()
  .isFloat({ min: 0, max: 5 })
  .withMessage("Voto minimo deve essere tra 0 e 5")
  .toFloat();

const valMaxRating = query("max_rating")
  .optional()
  .isFloat({ min: 0, max: 5 })
  .withMessage("Voto massimo deve essere tra 0 e 5")
  .toFloat();

const validateMovieSearch = [
  valTitle,
  valPage,
  valLimit,
  valYearFrom,
  valYearTo,
  valMinRating,
  valMaxRating,
  checkValidationErrors,
];

module.exports = {
  validateMovieSearch,
};
