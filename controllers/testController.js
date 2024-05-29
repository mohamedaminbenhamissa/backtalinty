const Joi = require('joi');
const JoiOID = require('joi-oid');
const putTest = require('./tests/putTest');
const deleteTest = require('./tests/deleteTest');
const { duplicateTest, postTest } = require('./tests/postTest');
const { getTest, getTests } = require('./tests/getTest');
const { parseErrors } = require('../utils/parseJoiErrors');

const postTestValidator = Joi.object({
    name: Joi.string().required(),
    description: Joi.string().required(),
    minScore: Joi.number().min(0).max(100).required(),
    maxScore: Joi.number().min(0).max(100).required(),
    webcamScreenshots: Joi.boolean().required(),
    disableCopyPaste: Joi.boolean().required(),
    monitorTabs: Joi.boolean().required(),
    lockTestAfterRefresh: Joi.boolean().required(),
    enableExposureLimit: Joi.boolean().required(),
    exposureLimit: Joi.number().required(),
    enableFeedback: Joi.boolean().required(),
    enableTrainingQuestions: Joi.boolean().required(),
    numberOfTrainingQuestions: Joi.number().max(3).required(),
    enableRandomResponsesChecker: Joi.boolean().required(),
    enableExtraTime: Joi.boolean().required(),
    extraTime: Joi.number().required(),
    introVideo: Joi.string().uri().allow(''),
    outroVideo: Joi.string().uri().allow(''),
    // .items(JoiOID.objectId())
    testFor: Joi.array()
        .items()
        .unique((a, b) => a === b),
    allowedTime: Joi.number().greater(10).required(),
    packs: Joi.array()
        .items(JoiOID.objectId().required())
        .unique((a, b) => a === b)
        .min(1)
        .required(),
}).error((errors) => {
    return parseErrors(errors);
});
const postTestCheckQuestionsExist = async (req, res, next) => {
    try {
        const Question = req.questions;
        const testInformation = req.body;
        const questions = testInformation.questions;
        const existingQuestions = await Question.countDocuments(
            { _id: { $in: questions } },
            ['_id']
        );
        if (questions.length === existingQuestions) next();
        else res.status(400).send("Une des questions n'existe plus");
    } catch (e) {
        return res.status(500).send('Error: ' + e.message);
    }
};
const postTestCheckPacksExist = async (req, res, next) => {
    try {
        const Pack = req.Pack;
        const testInformation = req.body;
        const packs = testInformation.packs;
        const existingPacks = await Pack.countDocuments(
            { _id: { $in: packs } },
            ['_id']
        );
        if (packs.length === existingPacks) next();
        else res.status(400).send("Un des packs n'existe plus");
    } catch (e) {
        return res.status(500).send('Error: ' + e.message);
    }
};
const getTestValidator = Joi.object({
    id: JoiOID.objectId().required(),
}).error((errors) => {
    return parseErrors(errors);
});
const getTestsValidator = Joi.object({
    params: Joi.object()
        .required()
        .keys({
            active: Joi.boolean(),
            name: Joi.string(),
            scoreMin: Joi.number().min(0).max(100),
            scoreMax: Joi.number().min(0).max(100),
            allowedTime: Joi.number().min(10).max(18000),
            packs: Joi.array()
                .items(JoiOID.objectId())
                .unique((a, b) => a === b)
                .min(2),
            videoStart: Joi.string().uri(),
            videoEnd: Joi.string().uri(),
            enableScreenshots: Joi.boolean(),
            disableCopyPaste: Joi.boolean(),
            enableExposureLimit: Joi.boolean(),
            enableFeedback: Joi.boolean(),
            trainingQuestions: Joi.number().min(0).max(5),
            enableAdditionalTime: Joi.number().min(0).max(50),
        }),
    fields: Joi.array()
        .items(Joi.string())
        .required()
        .unique((a, b) => a === b),
}).error((errors) => {
    return parseErrors(errors);
});
exports.controllers = {
    postTestValidator,
    postTestCheckQuestionsExist,
    postTestCheckPacksExist,
    postTest,
    duplicateTest,
    getTestValidator,
    getTest,
    getTestsValidator,
    getTests,
    putTest,
    deleteTest,
};
