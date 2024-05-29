const Joi = require('joi');
const JoiOID = require('joi-oid');
const {
    addComment,
    updateStep,
    resendEmail,
    addTime,
    startEvaluation,
    saveProgress,
    addFeedback,
    lockEvaluation,
    lockEvaluationFromCandidate,
    addAdminEvaluationToQuestion,
    changeUser,
} = require('./evaluations/putEvaluation');
const {
    getScore,
    getCandidates,
    getEvaluationHistory,
    getEvaluationForAdmin,
    getEvaluation,
    getEvaluations,
    getNextQuestion,
} = require('./evaluations/getEvaluation');
const { postEvaluation } = require('./evaluations/postEvaluation');
const { deleteEvaluation } = require('./evaluations/deleteEvaluation');
const { patchEvaluationStatus } = require('./evaluations/patchEvaluation');
const { postVideo } = require('./evaluations/postVideo');
const { saveScreenshot } = require('./evaluations/saveScreenshot');
const { parseErrors } = require('../utils/parseJoiErrors');
const getCalendarEvents = require('../controllers/calendar/getEvents');
const cancelCalendarEvent = require('../controllers/calendar/postEvent');
const postEvaluationValidator = Joi.object({
    jobId: JoiOID.objectId().required(),
    email: Joi.string().email().required(),
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    resume: Joi.any(),
}).error((errors) => {
    return parseErrors(errors);
});
const postEvaluationVideoValidator = Joi.object({
    video: Joi.any().meta({ swaggerType: 'file' }).allow('').required(),
}).error((errors) => {
    return parseErrors(errors);
});
const getEvaluationValidator = Joi.object({
    id: Joi.string().required(),
}).error((errors) => {
    return parseErrors(errors);
});
const patchEvaluationParamsValidator = Joi.object({
    id: Joi.string().required(),
    packId: JoiOID.objectId().required(),
}).error((errors) => {
    return parseErrors(errors);
});
const patchEvaluationAddAdminEvaluationToQuestionParamsValidator = Joi.object({
    evaluationId: Joi.string().required(),
    questionId: Joi.string().required(),
}).error((errors) => {
    return parseErrors(errors);
});
const patchEvaluationAddAdminEvaluationToQuestionBodyValidator = Joi.object({
    feedback: Joi.number().required(),
}).error((errors) => {
    return parseErrors(errors);
});
const patchEvaluationBodyValidator = Joi.object({
    hasHandicap: Joi.boolean().required(),
}).error((errors) => {
    return parseErrors(errors);
});
const patchEvaluationSaveProgressBodyValidator = Joi.object({
    answers: Joi.array().required(),
}).error((errors) => {
    return parseErrors(errors);
});
const patchEvaluationAddFeedbackBodyValidator = Joi.object({
    feedback: Joi.object().required(),
}).error((errors) => {
    return parseErrors(errors);
});
const getEvaluationsValidator = Joi.object({
    params: Joi.object(),
    fields: Joi.array()
        .items(Joi.string())
        .unique((a, b) => a === b),
}).error((errors) => {
    return parseErrors(errors);
});
const patchEvaluationStatusValidator = Joi.object({
    processId: JoiOID.objectId().required(),
});
exports.controllers = {
    postEvaluationValidator,
    postEvaluationVideoValidator,
    getEvaluationValidator,
    patchEvaluationParamsValidator,
    patchEvaluationSaveProgressBodyValidator,
    patchEvaluationAddFeedbackBodyValidator,
    patchEvaluationBodyValidator,
    postEvaluation,
    getEvaluation,
    getEvaluations,
    getNextQuestion,
    startEvaluation,
    saveProgress,
    addFeedback,
    postVideo,
    saveScreenshot,
    lockEvaluation,
    lockEvaluationFromCandidate,
    addTime,
    getEvaluationsValidator,
    patchEvaluationAddAdminEvaluationToQuestionParamsValidator,
    patchEvaluationAddAdminEvaluationToQuestionBodyValidator,
    addAdminEvaluationToQuestion,
    getEvaluationForAdmin,
    getCandidates,
    getScore,
    addComment,
    resendEmail,
    getEvaluationHistory,
    updateStep,
    changeUser,
    deleteEvaluation,
    patchEvaluationStatusValidator,
    patchEvaluationStatus,
    getCalendarEvents,
    cancelCalendarEvent,
};
