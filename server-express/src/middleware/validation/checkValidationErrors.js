const { validationResult } = require("express-validator");

const checkValidationErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const validationError = new Error("Parametri di ricerca non validi");
    validationError.name = "ValidationError";
    validationError.code = "VALIDATION_ERROR_SEARCH_MOVIES";
    validationError.status = 400;

    

    validationError.additionalDetails = errors.mapped();



    return next(validationError);
  }

  next();
};

module.exports = { checkValidationErrors };
