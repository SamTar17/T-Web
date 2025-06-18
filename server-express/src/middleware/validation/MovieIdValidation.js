const { valMovieId } = require("./common");
const {checkValidationErrors} =  require('./checkValidationErrors')

validateMovieId = [
    valMovieId,
    checkValidationErrors
]

module.exports = {
  validateMovieId,
};
