const Joi = require('joi');
const JoiOID = require('joi-oid');
const postEmail = require('./emails/postEmail');
const deleteEmail = require('./emails/deleteEmail');
const patchEmail = require('./emails/patchEmail');
const { getEmail, getEmails } = require('./emails/getEmail');
const { parseErrors } = require('../utils/parseJoiErrors');

const postEmailValidator = Joi.object({
    subject: Joi.string().required(),
    design: Joi.string().required(),
    html: Joi.string().required(),
    attachments: Joi.string().allow(''),
}).error((errors) => {
    return parseErrors(errors);
});

const getEmailsValidator = Joi.object({
    params: Joi.object().required().keys({
        active: Joi.boolean(),
        isLocked: Joi.boolean(),
    }),
    fields: Joi.array()
        .items(Joi.string())
        .required()
        .unique((a, b) => a === b),
}).error((errors) => {
    return parseErrors(errors);
});
const getEmailValidator = Joi.object({
    id: Joi.string().required(),
    params: Joi.object().required().keys({
        active: Joi.boolean(),
        subject: Joi.string(),
        content: JoiOID.string(),
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
    postEmail,
    postEmailValidator,
    getEmails,
    getEmailsValidator,
    deleteEmail,
    IdParamsValidator,
    getEmail,
    getEmailValidator,
    patchEmail,
};
