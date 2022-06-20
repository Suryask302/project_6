
require('dotenv').config()
const { verify } = require('jsonwebtoken')
const createError = require('http-errors')

/*                                    middleware for verify Jwt tokens                                       */

const protected = async (req, res, next) => {

    try {

        if (!req.headers['authorization']) {
            return next(createError.Unauthorized())
        }

        const authHeader = req.headers['authorization']
        const token = authHeader.split(' ')[1]

        const decodeToken = verify(token, process.env.JWT_SECRET, (err, data) => {
            if (err) throw createError(401, `invalid Or Expired Token`);
            return data
        })

        req['loggedInUser'] = decodeToken.userId
        req['usersCreditScore'] = decodeToken.creditScore
        next()


    } catch (error) {
        next(error)
    }
}

/*                                          Exporting Middleware                                      */

module.exports = {
    protected
}