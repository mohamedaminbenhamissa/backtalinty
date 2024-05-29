const Joi = require('joi');
const JoiOID = require('joi-oid');
const { postJob } = require('./jobs/postJob');
const deleteJob = require('./jobs/deleteJob');
const { sendJobEmail } = require('./jobs/postJob');
const {
    patchJob,
    rephraseJobDescription,
    suggestJobDescription,
} = require('./jobs/patchJob');
const {
    getJob,
    getJobs,
    getJobsForAdmin,
    getJobStats,
} = require('./jobs/getJob');
const { parseErrors } = require('../utils/parseJoiErrors');

const postJobValidator = Joi.object({
    test: JoiOID.objectId().required(),
    name: Joi.string().required(),
    image: Joi.string().allow(''),
    users: Joi.string().required(),
    type: Joi.string().required(),
    location: Joi.string().required(),
    remote: Joi.string().required(),
    expire: Joi.number().min(0).max(12).required(),
    description: Joi.string().required(),
    public: Joi.boolean().required(),
    shareOnLinkedIn: Joi.boolean().required(),
}).error((errors) => {
    return parseErrors(errors);
});
const getJobsValidator = Joi.object({
    params: Joi.object()
        .required()
        .keys({
            active: Joi.boolean(),
            name: Joi.string(),
            test: JoiOID.objectId(),
            type: Joi.string(),
            location: Joi.string(),
            remote: Joi.string(),
            expire: Joi.number().min(0).max(12),
            description: Joi.string(),
        }),

    fields: Joi.array()
        .items(Joi.string())
        .required()
        .unique((a, b) => a === b),
}).error((errors) => {
    return parseErrors(errors);
});
const getJobValidator = Joi.object({
    id: Joi.string().required(),
    params: Joi.object()
        .required()
        .keys({
            active: Joi.boolean(),
            name: Joi.string(),
            test: JoiOID.objectId(),
            type: Joi.string(),
            location: Joi.string(),
            remote: Joi.string(),
            expire: Joi.number().min(0).max(12),
            description: Joi.string(),
        }),
    fields: Joi.array()
        .items(Joi.string())
        .required()
        .unique((a, b) => a === b),
}).error((errors) => {
    return parseErrors(errors);
});
const IdParamsValidator = Joi.object({
    id: Joi.string().required(),
}).error((errors) => {
    return parseErrors(errors);
});
exports.controllers = {
    postJob,
    postJobValidator,
    getJobs,
    getJobsValidator,
    getJobStats,
    deleteJob,
    IdParamsValidator,
    getJob,
    getJobsForAdmin,
    getJobValidator,
    patchJob,
    rephraseJobDescription,
    suggestJobDescription,
    sendJobEmail,
};
