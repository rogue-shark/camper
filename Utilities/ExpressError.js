class ExpressError extends Error {
    constructor(message, statusCode) {
        super(); //which is going to call the Error constructor (i.e the parent)
        this.message = message;
        this.statusCode = statusCode;
    }
}

module.exports = ExpressError;