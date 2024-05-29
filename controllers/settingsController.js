const Joi = require('joi');
const putSettings = require('./settings/putSettings');
const patchSettings = require('./settings/patchSettings');
const getSettings = require('./settings/getSettings');
const { parseErrors } = require('../utils/parseJoiErrors');

const postSettingsValidator = Joi.object({
    mainColor: Joi.string().required().length(7),
    secondaryColor: Joi.string().required().length(7),
    bgColor: Joi.string().required().length(7),
    name: Joi.string().required(),
    logo: Joi.string().allow(''),
}).error((errors) => {
    return parseErrors(errors);
});

const patchSettingsValidator = Joi.object({
    isProfileSeen: Joi.boolean().required(),
    isResumeSeen: Joi.boolean().required(),
    isEvoluationPassed: Joi.boolean().required(),
}).error((errors) => {
    return parseErrors(errors);
});

exports.controllers = {
    postSettingsValidator,
    patchSettingsValidator,
    getSettings,
    putSettings,
    patchSettings,
};
