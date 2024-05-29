const Joi = require('joi');

const { getCustomFields } = require('./curstomFields/getCustomFields');
const { parseErrors } = require('../utils/parseJoiErrors');

const getCustomFieldsValidator = Joi.object({
    params: Joi.object().required().keys({
        name: Joi.string(),
    }),
    fields: Joi.array()
        .items(Joi.string())
        .required()
        .unique((a, b) => a === b),
}).error((errors) => {
    return parseErrors(errors);
});

exports.controllers = {
    getCustomFieldsValidator,
    getCustomFields,
};
