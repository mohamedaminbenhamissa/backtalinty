const express = require('express');
const router = express.Router();

const validator = require('express-joi-validation').createValidator({});
const evaluationController = require('../controllers/evaluationController');

const { checkCanAccessResource } = require('../middlewares/authMiddleware');

router.post(
    '/',
    validator.body(evaluationController.controllers.postEvaluationValidator),
    evaluationController.controllers.postEvaluation
);
router.post('/uploadVideo', evaluationController.controllers.postVideo);
router.post('/saveScreenshot', evaluationController.controllers.saveScreenshot);
router.get(
    '/evaluation/:id',
    validator.params(evaluationController.controllers.getEvaluationValidator),
    evaluationController.controllers.getEvaluation
);
router.get(
    '/history/:id',
    checkCanAccessResource,
    validator.params(evaluationController.controllers.getEvaluationValidator),
    evaluationController.controllers.getEvaluationHistory
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
    checkCanAccessResource,
    validator.query(evaluationController.controllers.getEvaluationsValidator),
    evaluationController.controllers.getEvaluations
);
router.get(
    '/admin/:id',
    validator.params(evaluationController.controllers.getEvaluationValidator),
    checkCanAccessResource,
    evaluationController.controllers.getEvaluationForAdmin
);
router.patch(
    '/:id/start/:packId',
    validator.params(
        evaluationController.controllers.patchEvaluationParamsValidator
    ),
    validator.body(
        evaluationController.controllers.patchEvaluationBodyValidator
    ),
    evaluationController.controllers.startEvaluation
);
router.patch(
    '/:id/addComment',
    validator.params(evaluationController.controllers.getEvaluationValidator),
    evaluationController.controllers.addComment
);
router.patch(
    '/:id/resendEmail',
    validator.params(evaluationController.controllers.getEvaluationValidator),
    evaluationController.controllers.resendEmail
);
router.patch(
    '/:id/updateStep',
    checkCanAccessResource,
    validator.params(evaluationController.controllers.getEvaluationValidator),
    evaluationController.controllers.updateStep
);
router.patch(
    '/:evaluationId/adminFeedback/:questionId',
    validator.params(
        evaluationController.controllers
            .patchEvaluationAddAdminEvaluationToQuestionParamsValidator
    ),
    validator.body(
        evaluationController.controllers
            .patchEvaluationAddAdminEvaluationToQuestionBodyValidator
    ),
    evaluationController.controllers.addAdminEvaluationToQuestion
);
router.get(
    '/question/:id',
    validator.params(evaluationController.controllers.getEvaluationValidator),
    evaluationController.controllers.getNextQuestion
);
router.get('/candidates/', evaluationController.controllers.getCandidates);
router.get(
    '/:id/score/',
    validator.params(evaluationController.controllers.getEvaluationValidator),
    evaluationController.controllers.getScore
);
router.patch(
    '/:id/answer/',
    validator.params(evaluationController.controllers.getEvaluationValidator),
    validator.body(
        evaluationController.controllers
            .patchEvaluationSaveProgressBodyValidator
    ),
    evaluationController.controllers.saveProgress
);
router.patch(
    '/:id/feedback/',
    validator.params(evaluationController.controllers.getEvaluationValidator),
    validator.body(
        evaluationController.controllers.patchEvaluationAddFeedbackBodyValidator
    ),
    evaluationController.controllers.addFeedback
);
router.patch(
    '/:id/lockEvaluation/',
    checkCanAccessResource,
    validator.params(evaluationController.controllers.getEvaluationValidator),
    evaluationController.controllers.lockEvaluation
);
router.patch(
    '/:id/lockEvaluationFromCandidate/',
    validator.params(evaluationController.controllers.getEvaluationValidator),
    evaluationController.controllers.lockEvaluationFromCandidate
);
router.patch(
    '/:id/addTime/',
    checkCanAccessResource,
    validator.params(evaluationController.controllers.getEvaluationValidator),
    evaluationController.controllers.addTime
);
router.patch(
    '/:id/changeUser/',
    checkCanAccessResource,
    validator.params(evaluationController.controllers.getEvaluationValidator),
    evaluationController.controllers.changeUser
);
router.delete(
    '/:id',
    validator.params(evaluationController.controllers.getEvaluationValidator),
    evaluationController.controllers.deleteEvaluation
);
router.patch(
    '/:id/updateStatus',
    validator.params(evaluationController.controllers.getEvaluationValidator),
    validator.body(
        evaluationController.controllers.patchEvaluationStatusValidator
    ),
    evaluationController.controllers.patchEvaluationStatus
);
router.get(
    '/calendarEvents',
    evaluationController.controllers.getCalendarEvents
);
router.post(
    '/cancelCalendarEvent',
    evaluationController.controllers.cancelCalendarEvent
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
