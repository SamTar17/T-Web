// middleware/validation/moviesValidation.js
const { validationResult, query } = require("express-validator");
const { validateTitle, validatePage, validateLimit } = require("./common");

const validateYearFrom = query("year_from")
  .optional()
  .isInt({ min: 1900, max: 2050 })
  .withMessage("Anno inizio deve essere tra 1900 e 2050")
  .toInt();

const validateYearTo = query("year_to")
  .optional()
  .isInt({ min: 1900, max: 2050 })
  .withMessage("Anno fine deve essere tra 1900 e 2050")
  .toInt();

const validateMinRating = query("min_rating")
  .optional()
  .isFloat({ min: 0, max: 5 })
  .withMessage("Voto minimo deve essere tra 0 e 5")
  .toFloat();

const validateMaxRating = query("max_rating")
  .optional()
  .isFloat({ min: 0, max: 5 })
  .withMessage("Voto massimo deve essere tra 0 e 5")
  .toFloat();

const checkValidationErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    
    const validationError = new Error('Parametri di ricerca non validi');
    validationError.name = 'ValidationError';  
    validationError.code = 'VALIDATION_ERROR_SEARCH_MOVIES'
    validationError.status = 400;              
    validationError.validationDetails = errors.array();
    
    return next(validationError);
    
}

  next();
};

const validateMovieSearch = [
  validateTitle,
  validatePage,
  validateLimit,
  validateYearFrom,
  validateYearTo,
  validateMinRating,
  validateMaxRating,
  checkValidationErrors,
];

module.exports = {
  validateMovieSearch,
};
