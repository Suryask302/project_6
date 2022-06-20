
const router = require('express').Router();

const { register, login, getUser, updateUser } = require('../Controller/userController')
const { createQuestions, getQues, getQuesById, updateQuestion, deleteQuestion } = require('../Controller/queController')
const { addAnswer, getAnswer, deleteAnswer } = require('../Controller/ansController')
const { protected } = require('../utils/auth')


router.get('/testing', (req, res) => {
    res.json({ message: 'testing data' })
})

/*                                              user routes                                                      */

router.post('/register', register)
    .get('/login', login)
    .get('/users/:userId', protected, getUser)
    .put('/Users/:userId', protected, updateUser)


/*                                             Questions routes                                                  */

router.post('/questions', protected, createQuestions)
    .get('/questions', getQues)
    .get('/questions/:questionId', getQuesById)
    .put('/questions/:questionId', protected, updateQuestion)
    .delete('/questions/:questionId', protected, deleteQuestion)


/*                                             Answers routes                                                    */


router.post('/answer', protected, addAnswer)
    .get('/answers/:questionId/answer', getAnswer)
    .delete('/answers/:answerId', protected, deleteAnswer)
    

/*                                            Exporting routes                                                  */

module.exports = router
