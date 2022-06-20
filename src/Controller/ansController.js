/*                                             answersLogic                                             */

const Questions = require('../Models/queModel')
const user = require('../Models/userModel')
const answers = require('../Models/ansModel')
const createError = require('http-errors')
const { isValid, isValidObjectId } = require('../utils/validators')
const ansModel = require('../Models/ansModel')

/*                                             POST /answer                                               */

const addAnswer = async (req, res, next) => {

    try {

        if (Object.keys(req.body).length === 0) {
            throw createError(400, `request Body Should Not Be Empty`)
        }

        let { answeredBy, text, questionId } = req.body

        if (!isValid(answeredBy)) {
            throw createError(400, `Please Provide a AnsweredBy Id`)
        }

        if (!isValidObjectId(answeredBy)) {
            throw createError(400, `invalid id`)
        }

        if (!isValid(questionId)) {
            throw createError(400, `Please Provide a questions Id`)
        }

        if (!isValidObjectId(questionId)) {
            throw createError(400, `invalid id`)
        }

        if (!isValid(text)) {
            throw createError(400, `Answer Field Should Not Be Empty`)
        }

        if (answeredBy != req['loggedInUser']) {
            throw createError(401, `Unauthorised Access! `)
        }

        const checkTheQue = await Questions.findOne({ _id: questionId, isDeleted: false })

        if (!checkTheQue) {
            throw createError(404, 'the Question You Are trying To answer dosent Exist')
        }

        if (checkTheQue.askedBy == answeredBy) {
            throw createError(400, `you cant Answer Your Own Question`)
        }

        const isAlreadyAnswered = await ansModel.find(

            {
                questionId: questionId,
                isDeleted: false
            }

        ).lean()

        const checkIfSameUserSameAnswer = isAlreadyAnswered.find(e => e.answeredBy == answeredBy && e.text === text)

        if (checkIfSameUserSameAnswer) {
            throw createError(409, `you have already answered that question with exact same answer`)
        }

        const checkIfsameAnswer = isAlreadyAnswered.find(e => e.text === text)

        if (checkIfsameAnswer) {
            throw createError(409, `exact same answer for this question is already present`)
        }

        await user.findByIdAndUpdate(req['loggedInUser'],
            { $inc: { creditScore: +200 } }
        )

        const newAnswer = await answers.create({ answeredBy, text, questionId })

        res.status(200)
        res.json({

            "status": 200,
            "message": `your answer has been submited`,
            "data": newAnswer

        })
        return

    } catch (error) {
        next(error)
    }
}


/*                                     GET questions/:questionId/answer                                        */

const getAnswer = async (req, res, next) => {

    try {

        let questionId = req.params.questionId

        if (!questionId) {
            throw createError(400, `invalid Path ! please provide Question id in the params`)
        }

        if (!isValidObjectId(questionId)) {
            throw createError(400, `${questionId} is Not a Valid Question id`)
        }

        let answersData = await ansModel.find({ questionId: questionId, isDeleted: false, deletedAt: null })
            .sort({ createdAt: -1 })
            .select({ answeredBy: 1, text: 1, _id: 0 })
            .populate('answeredBy', 'fname lname')
            .populate('questionId', 'description')


        if (answersData.length == 0) {
            throw createError(404, 'No answers found for this question')
        }

        res.status(200)
        res.json({

            "status": "success",
            "data": answersData

        })
        return


    } catch (error) {
        next(error)
    }

}


/*                                        DELETE answers/:answerId                                             */

const deleteAnswer = async (req, res, next) => {

    try {

        const answerId = req.params.answerId

        if (!answerId) {
            throw createError(400, `invalid path ! please provide answerId in path`)
        }

        if (!isValidObjectId(answerId)) {
            throw createError(400, `${answerId} is Not A Valid AnswerId`)
        }

        if (Object.keys(req.body).length == 0) {
            throw createError(400, `request body should not be empty`)
        }

        let { userId, questionId } = req.body

        if (!isValid(userId)) {
            throw createError(400, `please provide userId`)
        }

        if (!isValidObjectId(userId)) {
            throw createError(400, `${userId} is Not a valid user id`)
        }

        if (!isValid(questionId)) {
            throw createError(400, `please provide questionId`)
        }

        if (!isValidObjectId(questionId)) {
            throw createError(400, `${questionId} is Not a valid questionId`)
        }

        if (userId != req['loggedInUser']) {
            throw createError.Unauthorized()
        }

        const checkAnswer = await ansModel.findById(answerId)

        if (!checkAnswer) {
            throw createError.NotFound()
        }

        if (checkAnswer.answeredBy != req['loggedInUser']) {
            throw createError.Forbidden()
        }

        await ansModel.findByIdAndUpdate(answerId, { isDeleted: true, deletedAt: Date.now() })
        res.status(200)
        res.json({

            "status": "success",
            "message": "answer deleted"
            
        })
        return

    } catch (error) {
        next(error)
    }

}

/*                                        Exporting Business Logic                                       */

module.exports = {

    addAnswer,
    getAnswer,
    deleteAnswer

}