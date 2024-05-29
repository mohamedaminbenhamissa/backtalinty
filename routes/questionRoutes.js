const express = require('express');
const router = express.Router();
const validator = require('express-joi-validation').createValidator({
    // This options forces validation to pass any errors the express
    // error handler instead of generating a 400 error
    passError: true,
});

const questionController = require('../controllers/questionController');

router.post(
    '/',
    validator.body(questionController.controllers.questionValidator),
    questionController.controllers.postQuestion
);
router.get(
    '/:id',
    (request, response, next) => {
        const payload = JSON.parse(request.query.payload);
        request.params.params = payload.params;
        request.params.fields = payload.fields;
        //we don't need it anymore
        delete request.query.payload;
        next();
    },
    validator.params(questionController.controllers.getQuestionValidator),
    questionController.controllers.getQuestion
);
router.get(
    '/affectedToTest/:id',
    (request, response, next) => {
        const payload = JSON.parse(request.query.payload);
        request.params.params = payload.params;
        request.params.fields = payload.fields;
        //we don't need it anymore
        delete request.query.payload;
        next();
    },
    validator.params(questionController.controllers.getQuestionValidator),
    questionController.controllers.getQuestionsOfTest
);
router.get(
    '/affectedToPack/:id',
    (request, response, next) => {
        const payload = JSON.parse(request.query.payload);
        request.params.params = payload.params;
        request.params.fields = payload.fields;
        //we don't need it anymore
        delete request.query.payload;
        next();
    },
    validator.params(questionController.controllers.getQuestionValidator),
    questionController.controllers.getQuestionsOfPack
);
router.get(
    '/',
    (request, response, next) => {
        const payload = JSON.parse(request.query.payload);
        request.query.params = payload.params;
        request.query.fields = payload.fields;
        //we don't need it anymore
        delete request.query.payload;
        next();
    },
    validator.query(questionController.controllers.getQuestionsValidator),
    questionController.controllers.getQuestions
);
router.patch(
    '/:id',
    validator.params(questionController.controllers.IdParamsValidator),
    validator.body(questionController.controllers.questionValidator),
    questionController.controllers.patchQuestion
);
router.delete(
    '/:id',
    validator.params(questionController.controllers.IdParamsValidator),
    questionController.controllers.deleteQuestion
);
// a middleware function with no mount path. This code is executed for every request to the router so that we can return custom Joi Errors
router.use((err, req, res, next) => {
    if (err && err.error && err.error.isJoi) {
        // we had a joi error, let's return a custom 400 json response
        res.status(400).json({
            data: err.error.toString().replace('ValidationError: ', ''),
        });
    } else if (err && err.error) {
        // pass on to another error handler
        next(err);
    }
});

module.exports = router;
