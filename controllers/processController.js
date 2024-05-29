const Joi = require('joi');
const JoiOID = require('joi-oid');
const deleteProcess = require('./process/deleteProcess');
const patchProcess = require('./process/patchProcess');
const { getProcess, getProcesses } = require('./process/getProcess');
const postProcess = require('./process/postProcess');
const { parseErrors } = require('../utils/parseJoiErrors');
const postProcessValidator = Joi.object({
    name: Joi.string().required(),
    email: Joi.string().allow(null, ''),
    position: Joi.number().min(0).max(100).required(),
    hasEvaluation: Joi.boolean().required(),
}).error((errors) => {
    return parseErrors(errors);
});
const getProcessesValidator = Joi.object({
    params: Joi.object()
        .required()
        .keys({
            active: Joi.boolean(),
            name: Joi.string(),
            emailBefore: Joi.string(),
            emailAfter: Joi.string(),
            hasEvaluation: Joi.boolean(),
            position: Joi.number().min(0).max(100),
        }),

    fields: Joi.array()
        .items(Joi.string())
        .required()
        .unique((a, b) => a === b),
}).error((errors) => {
    return parseErrors(errors);
});
const processBacthUpdateValidator = Joi.object({
    data: Joi.array().required(),
}).error((errors) => {
    return parseErrors(errors);
});

const getProcessValidator = Joi.object({
    id: JoiOID.objectId().required(),
    params: Joi.object()
        .required()
        .keys({
            active: Joi.boolean(),
            name: Joi.string(),
            emailBefore: Joi.string(),
            emailAfter: Joi.string(),
            hasEvaluation: Joi.boolean(),
            position: Joi.number().min(0).max(100),
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
    postProcessValidator,
    postProcess,
    getProcessValidator,
    getProcess,
    getProcessesValidator,
    getProcesses,
    patchProcess,
    IdParamsValidator,
    deleteProcess,
    processBacthUpdateValidator,
};
