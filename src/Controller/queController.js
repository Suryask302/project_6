/*                                           QuestionsLogic                                            */

const Questions = require('../Models/queModel')
const user = require('../Models/userModel')
const ansModel = require('../Models/ansModel')
const createError = require('http-errors')


const {

    isValid,
    isValidObjectId,

} = require('../utils/validators')


/*                                           POST /question                                            */

const createQuestions = async (req, res, next) => {

    try {

        if (Object.keys(req.body).length == 0) {
            throw createError(400, `request body should not be empty`)
        }

        let { description, tag, askedBy } = req.body

        if (!isValid(askedBy)) {
            throw createError(400, `This Field Cannot Be Empty`)
        }

        if (!isValidObjectId(askedBy)) {
            throw createError(400, `${askedBy} is Not a valid object id`)
        }

        if (askedBy != req['loggedInUser']) {
            throw createError(401, `Unauthorized Access ${askedBy} id Does not Belongs To You`)
        }

        if (!isValid(description)) {
            throw createError(400, `please Enter The decription of the question You want to ask`)
        }

        const isQuestionAlreadyAsked = await Questions.find(

            {
                description: description,
                askedBy: askedBy
            }

        )

        if (isQuestionAlreadyAsked.length !== 0) {
            throw createError(409, `You Have Already Asked This Similar Question`)
        }

        const checkCreditScore = await user.findById(req['loggedInUser'])

        if (checkCreditScore.creditScore <= 0) {
            throw createError(400, `you Cant Ask Questions any more Due to Low CreditScore`)
        }

        await user.findByIdAndUpdate(req['loggedInUser'],
            { $inc: { creditScore: -100 } }
        )

        if (tag) {

            if (!Array.isArray(tag)) {
                throw createError(400, `please enter valid tags`)
            }

        }

        let queData = {

            description,
            tag,
            askedBy

        }

        const newQuestion = await Questions.create(queData)
        res.status(200)
        res.json({

            "status": 200,
            "message": 'Success',
            "data": newQuestion
        })
        return

    } catch (error) {
        next(error)
    }
}


/*                                            GET /questions                                          */

const getQues = async (req, res, next) => {

    try {

        const serachParams = req.query
        const filterQuery = { isDeleted: false }
        const sortQuery = {}

        let { tag, sort } = serachParams

        if ('tag' in serachParams) {

            if (isValid(tag)) {

                const tagsArr = tag.trim().split(',').map(tag => tag.trim())
                filterQuery['tag'] = { $all: tagsArr }

            }

        }

        if ('sort' in serachParams) {

            if (isValid(sort)) {

                if (sort == 'ascending') {
                    sortQuery['createdAt'] = 1
                }

                if (sort == 'decending') {
                    sortQuery['createdAt'] = -1
                }

            }

        }

        const fetchData = await Questions.find(filterQuery)
            .sort(sortQuery)
            .select({ description: 1, tag: 1, askedBy: 1 })
            .lean()

        for (let elm of fetchData) {

            let answers = await ansModel.find({ questionId: elm._id, isDeleted: false })
                .sort({ createdAt: -1 })
                .select({ answeredBy: 1, text: 1 })

            elm['answers'] = answers

        }

        res.status(200)
        res.json({

            "message": 'Success',
            "Data": fetchData

        })
        return


    } catch (error) {
        next(error)
    }


}


/*                                       GET /questions/:questionId                                      */

const getQuesById = async (req, res, next) => {

    try {

        let questionId = req.params.questionId

        if (!isValidObjectId(questionId)) {
            throw createError(400, `this >>>${questionId} is not a valid Question Id `)
        }

        let findQue = await Questions.findOne({ _id: questionId, isDeleted: false })
            .select({ description: 1, tag: 1, askedBy: 1 })
            .populate('askedBy', 'fname lname')
            .lean()

        if (!findQue) {
            throw createError(404, `The question you are looking for does not found`)
        }

        let findAnsForTheSame = await ansModel.find({ questionId: questionId, isDeleted: false })
            .sort({ createdAt: -1 })
            .select({ answeredBy: 1, text: 1 })

        findQue['answers'] = findAnsForTheSame

        res.status(200)
        res.json({

            "Status": 200,
            "Message": "Success",
            "Data": findQue

        })
        return

    } catch (error) {
        next(error)
    }

}


/*                                      PUT /questions/:questionId                                      */

const updateQuestion = async (req, res, next) => {

    try {

        if (Object.keys(req.body).length == 0) {
            throw createError(400, `request Body Should Not Be Empty`)
        }

        let questionId = req.params.questionId

        if (!questionId) {
            throw createError(400, `Invalid Input Params! Please Provide Question Id`)
        }

        if (!isValidObjectId(questionId)) {
            throw createError(400, `${questionId} is Not a valid Question Id`)
        }

        const isQuestionExist = await Questions.findOne({ _id: questionId, isDeleted: false })

        if (!isQuestionExist) {
            throw createError(400, `cant Find Question You Want To Update`)
        }

        if (req['loggedInUser'] != isQuestionExist.askedBy) {
            throw createError(401, `The resource you are trying To update doesnot belongs To you`)
        }

        let updateQuery = {}

        let { description, tag } = req.body

        if ('description' in req.body) {

            if (!isValid(description)) {
                throw createError(400, `please provide Valid description `)
            }

            if (!updateQuery.hasOwnProperty('$set')) {
                updateQuery['$set'] = {}
            }

            updateQuery['$set']['description'] = description.trim()

        }

        if ('tag' in req.body) {

            if (Array.isArray(tag)) {

                let tagArr = tag.map(e => e.trim())

                if (!updateQuery.hasOwnProperty('$addToSet')) {
                    updateQuery['addToSet'] = {}
                }

                updateQuery['$addToSet'] = { tag: { $each: [...tagArr] } }


            } else {

                if (!isValid(tag)) {
                    throw createError(400, `Please Enter Valid Tags To Update`)
                }
                let tagArr = tag.trim().split(',').map(e => e.trim())

                if (!updateQuery.hasOwnProperty('$addToSet')) {
                    updateQuery['addToSet'] = {}
                }

                updateQuery['$addToSet'] = { tag: { $each: tagArr } }

            }

        }

        let updatedData = await Questions.findByIdAndUpdate(questionId, updateQuery, { new: true })

        res.status(200)
        res.json({

            "status": 200,
            "message": "success",
            "data": updatedData

        })
        return

    } catch (error) {
        next(error)
    }
}


/*                                     DELETE /questions/:questionId                                        */

const deleteQuestion = async (req, res, next) => {

    try {

        let questionId = req.params.questionId

        if (!questionId) {
            throw createError(400, `Invalid Input Params! Please Provide Question Id`)
        }

        if (!isValidObjectId(questionId)) {
            throw createError(400, `${questionId} is Not a valid Question Id`)
        }

        const isQuestionExist = await Questions.findOne({ _id: questionId, isDeleted: false })

        if (!isQuestionExist) {
            throw createError(404, `The Question Is Already Deleted`)
        }

        if (req['loggedInUser'] != isQuestionExist.askedBy) {
            throw createError(401, `The resource you are trying To update doesnot belongs To you`)
        }

        await Questions.findOneAndUpdate(

            { questionId },
            { isDeleted: true, deletedAt: Date.now() }

        )

        res.status(200)
        res.json({

            "status": `Success`,
            "message": "question Deleted"
        })
        return

    } catch (error) {
        next(error)
    }

}

/*                                      Exporting Business Logics                                      */

module.exports = {

    createQuestions,
    getQues,
    getQuesById,
    updateQuestion,
    deleteQuestion

}
