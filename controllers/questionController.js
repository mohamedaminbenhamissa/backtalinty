const { getQuestion, getQuestions } = require('./questions/getQuestion');
const postQuestion = require('./questions/postQuestion');
const htmlInput = require('joi-html-input');
const Joi = require('joi').extend(htmlInput);
const JoiOID = require('joi-oid');
const deleteQuestion = require('./questions/deleteQuestion');
const patchQuestion = require('./questions/patchQuestion');
const {
    getQuestionsOfPack,
    getQuestionsOfTest,
} = require('./questions/getQuestion');
const { parseErrors } = require('../utils/parseJoiErrors');

const questionValidator = Joi.object({
    name: Joi.string().required(),
    type: Joi.string().required(),
    category: Joi.array().min(1).required(),
    difficulty: Joi.string().required(),
    applyPenalty: Joi.boolean().required(),
    isSearchable: Joi.boolean().required(),
    enableLimit: Joi.alternatives().conditional('type', {
        is: ['text', 'shortText', 'file', 'video', 'code', 'list'],
        then: Joi.boolean().required(),
        otherwise: Joi.optional(),
    }),
    wordsOrChar: Joi.alternatives().conditional('type', {
        is: ['text', 'shortText'],
        then: Joi.string().required(),
        otherwise: Joi.optional(),
    }),
    fileSize: Joi.alternatives().conditional('type', {
        is: ['file'],
        then: Joi.string().required(),
        otherwise: Joi.optional(),
    }),
    videoLength: Joi.alternatives().conditional('type', {
        is: ['video'],
        then: Joi.number()
            .min(30)
            .max(60 * 60 * 5)
            .required(),
        otherwise: Joi.optional(),
    }),
    limit: Joi.alternatives().conditional('type', {
        is: ['video', 'text', 'shortText', 'file'],
        then: Joi.number().min(1).max(10000).required(),
        otherwise: Joi.optional(),
    }),
    answers: Joi.alternatives().conditional('type', {
        is: ['text', 'shortText', 'file', 'video', 'code'],
        then: Joi.optional(),
        otherwise: Joi.array().min(2).required(),
    }),
    correctAnswer: Joi.alternatives().conditional('type', {
        is: ['text', 'shortText', 'file', 'video', 'code', 'list'],
        then: Joi.optional(),
        otherwise: Joi.array().min(1).max(10).required(),
    }),
    allowedTime: Joi.number()
        .min(30)
        .max(60 * 60 * 5)
        .required(),
    description: Joi.any().required(),
}).error((errors) => {
    return parseErrors(errors);
});
const getQuestionsValidator = Joi.object({
    params: Joi.object()
        .required()
        .keys({
            active: Joi.boolean(),
            name: Joi.string(),
            type: Joi.string(),
            category: Joi.string(),
            difficulty: Joi.string(),
            applyPenalty: Joi.boolean(),
            testId: JoiOID.objectId(),
            allowedTime: Joi.number().min(10).max(5400),
        }),

    fields: Joi.array()
        .items(Joi.string())
        .required()
        .unique((a, b) => a === b),
}).error((errors) => {
    return parseErrors(errors);
});

const getQuestionValidator = Joi.object({
    id: JoiOID.objectId().required(),
    params: Joi.object()
        .required()
        .keys({
            active: Joi.boolean(),
            name: Joi.string(),
            type: Joi.string(),
            category: Joi.string(),
            difficulty: Joi.string(),
            applyPenalty: Joi.boolean(),
            allowedTime: Joi.number().min(10).max(5400),
        }),
    fields: Joi.array()
        .items(Joi.string())
        .required()
        .unique((a, b) => a === b),
}).error((errors) => {
    return parseErrors(errors);
});
const IdParamsValidator = Joi.object({
    id: JoiOID.objectId().required(),
}).error((errors) => {
    return parseErrors(errors);
});
exports.controllers = {
    questionValidator,
    postQuestion,
    getQuestion,
    getQuestions,
    patchQuestion,
    getQuestionsValidator,
    getQuestionValidator,
    IdParamsValidator,
    deleteQuestion,
    getQuestionsOfTest,
    getQuestionsOfPack,
};
