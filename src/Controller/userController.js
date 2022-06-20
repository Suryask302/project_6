/*                                             userLogic                                             */

require('dotenv').config()
const user = require('../Models/userModel')
const { hash, compare } = require('bcrypt')
const jwt = require('jsonwebtoken')
const createError = require('http-errors')

const {

    isValid,
    isValidPhone,
    isValidEmail,
    isValidObjectId

} = require('../utils/validators')


/*                                          POST /register                                              */

const register = async (req, res, next) => {

    try {

        if (Object.keys(req.body).length == 0) {
            throw createError(400, 'request Body should not be empty')
        }

        let {

            fname,
            lname,
            email,
            phone,
            password,
            creditScore

        } = req.body

        /*                                      validations                                        */

        if (!isValid(fname)) {
            throw createError(400, 'please Enter a Valid First Name')
        }
           
        if (!isValid(lname)) {
            throw createError(400, 'please Enter a Valid Last Name')
        }
            
        if (!isValid(email) || !isValidEmail(email)) {
            throw createError(400, 'Email is Required And should be a Valid Email id')
        }
            

        const isEmailInUse = await user.findOne({ email: email })
        if (isEmailInUse) {
            throw createError(409, `${email} is Already In use`)
        }

        if (!isValidPhone(phone) || !isValid(phone)) {
            throw createError(400, 'phone number is required and should be a valid Phone number')
        }
            
        const isPhoneInUse = await user.findOne({ phone: phone })
        if (isPhoneInUse) {
            throw createError(409, `${phone} is Already In Use`)
        }

        if (!isValid(password)) {
            throw createError(400, 'invalid input ->>> password')
        }

        password = await hash(password, 10)

        if ('creditScore' in req.body) {

            if (typeof creditScore != 'number' || (parseInt(creditScore) === NaN)) {
                throw createError(400, 'invalid CreditScore Entered')
            }

        }


        let newdata = await user.create({
            fname,
            lname,
            email,
            phone,
            password,
            creditScore: creditScore ? creditScore : 500
        })

        res.status(201).json(newdata)
        return

    } catch (error) {
        next(error)
    }
}

/*                                              POST /login                                             */

const login = async (req, res, next) => {

    try {

        if (Object.keys(req.body).length == 0) {
            throw createError(400, 'request Body should not be empty')
        }

        let { email, password } = req.body

        if (!isValid(email) || !isValidEmail(email)) {
            throw createError(400, `please enter a valid email id`)
        }

        const isUserExist = await user.findOne({ email }) 

        if (!isUserExist) {
            throw createError(404, 'user Not Found')
        }

        const isMatched = await compare(password, isUserExist.password)

        if (!isMatched) {
            throw createError(400, `invalid Password`)
        }

        const payload = {
            userId: isUserExist._id.toString(),
            creditScore : isUserExist.creditScore
        }

        const options = {
            expiresIn: '1h'
        }

        const token = jwt.sign(

            payload,
            process.env.JWT_SECRET,
            options

        )

        res.json({

            'status': true,
            'Data': {
                'userId': isUserExist._id,
                'Token': token
            }
        })
        return

    } catch (error) {
        next(error)
    }
}


/*                                        GET /user/:userId/profile                                          */

const getUser = async (req, res, next) => {

    try {

        if (!Object.keys(req.params).includes('userId') || Object.keys(req.params).length === 0) {
            throw createError(400, 'please Provide UserID In Params')
        }

        const { userId } = req.params

        if (!isValidObjectId(userId)) {
            throw createError(400, `${userId} is Not a valid UserId`)
        }

        if (userId != req.loggedInUser) {
            throw createError(401, 'Unauthorized Access')
        }

        const isValidUser = await user.findById(userId)
        res.status(200)
        res.json({
            'status' : 200,
            'message' : 'success',
            'data' : isValidUser
        })
        return

    } catch (error) {
        next(error)
    }

}

/*                                      PUT /user/:userId/profile                                     */

const updateUser = async (req, res, next) => {

    try {

        if (Object.keys(req.params).length == 0)
            throw createError(400, 'Invalid path Params')

        if (!isValidObjectId(req.params.userId))
            throw createError(400, `${req.params.userId} is Not Valid User Id`)

        /*                           Authorization                                */

        if (req.params.userId != req['loggedInUser']) {
            throw createError(401, `Unauthorized Access`)
        }

        if (Object.keys(req.body).length == 0)
            throw createError(400, 'request Body should not be empty')

        let { fname, lname, email, phone } = req.body

        let updateQuery = {}

        if ('fname' in req.body) {

            if (!isValid(fname)) {
                throw createError(400, 'please Enter a Valid First Name')
            }

            if (!updateQuery.hasOwnProperty('$set')) {
                updateQuery['$set'] = {}
            }

            updateQuery['$set']['fname'] = fname
        }


        if ('lname' in req.body) {

            if (!isValid(lname)) {
                throw createError(400, `${lname} is Not A valid lname`)
            }

            if (!updateQuery.hasOwnProperty('$set')) {
                updateQuery['$set'] = {}
            }

            updateQuery['$set']['lname'] = lname
        }


        if ('email' in req.body) {

            if (!isValidEmail(email))
                throw createError(400, `${email} is Not a Valid Email Id`)

            const checkUnique = await user.findOne({ email: email })
            if (checkUnique)
                throw createError(409, `${email} is already in use`)

            if (!updateQuery.hasOwnProperty('$set')) {
                updateQuery['$set'] = {}
            }

            updateQuery['$set']['email'] = email
        }


        if ('phone' in req.body) {

            if (!isValidPhone(phone)) {
                throw createError(400, `${phone} is Not a valid Phone Number`)
            }

            const checkUnique = await user.findOne({ phone: phone })
            if (checkUnique)
                throw createError(409, `${phone} is already in use`)

            if (!updateQuery.hasOwnProperty('$set')) {
                updateQuery['$set'] = {}
            }

            updateQuery['$set']['phone'] = phone
        }

        const updatedData = await user.findOneAndUpdate(

            { _id: req.params.userId },
            updateQuery,
            { new: true }

        )

        res.send(updatedData)

    } catch (error) {
        next(error)
    }
}

/*                                         Exporting Business Logic                                         */

module.exports = {

    register,
    login,
    getUser,
    updateUser

}