const Joi = require('joi');
const JoiOID = require('joi-oid');
const putPack = require('./packs/putPack');
const deletePack = require('./packs/deletePack');
const { duplicatePack, postPack } = require('./packs/postPack');
const { getPack, getPacks, getStatsOfPack } = require('./packs/getPack');
const { parseErrors } = require('../utils/parseJoiErrors');

const postPackValidator = Joi.object({
    name: Joi.string().required(),
    description: Joi.string().required(),
    minScore: Joi.number().min(0).max(100).required(),
    maxScore: Joi.number().min(0).max(100).required(),
    randomQuestions: Joi.boolean().required(),
    randomOrder: Joi.boolean().required(),
    numberOfQuestions: Joi.number().required(),
    category: Joi.array().items(Joi.string()).min(1).required(),
    difficulty: Joi.string().required(),
    allowedTime: Joi.number().greater(10).required(),
    questions: Joi.array()
        .items(JoiOID.objectId().required())
        .unique((a, b) => a === b)
        .min(1)
        .required(),
}).error((errors) => {
    return parseErrors(errors);
});
const postPackCheckQuestionsExist = async (req, res, next) => {
    try {
        const Question = req.Question;
        const packInformation = req.body;
        const questions = packInformation.questions;
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
const getPackValidator = Joi.object({
    id: JoiOID.objectId().required(),
}).error((errors) => {
    return parseErrors(errors);
});
const getPacksValidator = Joi.object({
    params: Joi.object()
        .required()
        .keys({
            active: Joi.boolean(),
            name: Joi.string(),
            scoreMin: Joi.number().min(0).max(100),
            scoreMax: Joi.number().min(0).max(100),
            allowedTime: Joi.number().min(10).max(18000),
            questions: Joi.array()
                .items(JoiOID.objectId())
                .unique((a, b) => a === b)
                .min(2),
            videoStart: Joi.string().uri(),
            videoEnd: Joi.string().uri(),
            category: Joi.string(),
            difficulty: Joi.string(),
            randomQuestions: Joi.boolean(),
            randomOrder: Joi.boolean(),
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
    postPackValidator,
    postPackCheckQuestionsExist,
    postPack,
    duplicatePack,
    getPackValidator,
    getPack,
    getPacksValidator,
    getPacks,
    getStatsOfPack,
    putPack,
    deletePack,
};
