// middleware/validation/commonPatterns.js
const { query, param } = require('express-validator');

const validateTitle = query('title')
  .optional()
  .trim()
  .isLength({ min: 2, max: 100 })
  .withMessage('Il titolo deve essere tra 2 e 100 caratteri');

const validatePage = query('page')
  .optional()
  .isInt({ min: 1, max: 10000 })
  .withMessage('La pagina deve essere un numero tra 1 e 10000')
  .toInt();

// Pattern 3: Validazione per limit (elementi per pagina)
const validateLimit = query('limit')
  .optional()
  .isInt({ min: 1, max: 100 }).withMessage('Il limite deve essere un numero tra 1 e 100')
  .toInt();

// Pattern 4: Validazione per movieId (ID del film)
const validateMovieId = param('movieId')
  .isInt({ min: 1 }).withMessage('ID film deve essere un numero positivo')
  .toInt();

module.exports = {
  validateTitle,
  validatePage,
  validateLimit,
  validateMovieId
};