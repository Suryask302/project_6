/*                                         Error Handlers                                                      */

const createError = require('http-errors')

const notFound = (req, res, next) => {
    next(createError(404, 'The Page You are Looking for is Not Found'))
}

const errorHandler = (err, req, res, next) => {

    res.status(err.status || 500)
    res.send({
        error: {
            status: err.status || 500,
            message: err.message
        }
    })
}

/*                                          Exporting To Index.js                                        */

module.exports = {

    notFound,
    errorHandler

}