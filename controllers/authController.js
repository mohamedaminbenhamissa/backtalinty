const postRole = require('./auth/postRole');
const postLogin = require('./auth/postLogin');
const patchRole = require('./auth/patchRole');
const { getRole, getRoles } = require('./auth/getRole');
const { getUser, getUsers } = require('./auth/getUser');
const Joi = require('joi');
const JoiOID = require('joi-oid');
const postUser = require('./auth/postUser');
const patchUser = require('./auth/patchUser');
const deleteUser = require('./auth/deleteUser');
const patchRequestPassword = require('./auth/patchRequestPassword');
const deleteRole = require('./auth/deleteRole');
const patchAffectToUsersRole = require('./auth/patchAffectToUsersRole');
const patchRecoverPassword = require('./auth/patchRecoverPassword');
const { getCheckToken } = require('./auth/getCheckToken');
const { parseErrors } = require('../utils/parseJoiErrors');
const zxcvbn = require('zxcvbn');
const { populate, populateFunction } = require('./auth/populate');
const loginValidator = Joi.object({
    password: Joi.string().required(),
    token: Joi.string().required(),
    email: Joi.string().email().required(),
}).error((errors) => {
    return parseErrors(errors);
});
const requestPasswordValidator = Joi.object({
    email: Joi.string().email().required(),
    recaptchaToken: Joi.string().required(),
}).error((errors) => {
    return errors;
});
const recoverPasswordValidator = Joi.object({
    userInformation: Joi.object()
        .required()
        .keys({
            password: Joi.string()
                .required()
                .custom((value, helper) => {
                    if (value.length > 24)
                        return helper.message(
                            'Password must be at most 24 characters long.'
                        );
                    else if (value.length < 6)
                        return helper.message(
                            'Password must be at least 6 characters long.'
                        );
                    else if (parseInt(zxcvbn(value).score) < 3)
                        return helper.message("Password isn't strong enough.");
                    else return value;
                }),
            recaptchaToken: Joi.string().required(),
        }),
}).error((errors) => {
    return errors;
});
const resetPasswordParamsValidator = Joi.object({
    token: Joi.string().required(),
}).error((errors) => {
    return errors;
});
const IdParamsValidator = Joi.object({
    id: JoiOID.objectId().required(),
}).error((errors) => {
    return parseErrors(errors);
});
const patchUserValidator = Joi.object({
    id: JoiOID.objectId().required(),
}).error((errors) => {
    return parseErrors(errors);
});
const addUserValidator = Joi.object({
    userInformation: Joi.object()
        .required()
        .keys({
            email: Joi.string().email().required(),
            phone: Joi.string().regex(
                /^(\d{2})([-. )]*)?(\d{3})([-. )]*)?(\d{3})$/
            ).allow(''),
            role: JoiOID.objectId().required(),
            firstName: Joi.string().required(),
            lastName: Joi.string().required(),
            avatar: Joi.string(),
            job: Joi.string().allow(''),
            active: Joi.boolean(),
            notificationPreferences: Joi.object().keys({
                emailNotification: Joi.boolean().required(),
                pushNotification: Joi.boolean().required(),
                browserNotification: Joi.boolean().required(),
            }),
        }),
}).error((errors) => {
    return errors;
});
const getUserValidator = Joi.object({
    id: JoiOID.objectId().required(),
    fields: Joi.array()
        .items(Joi.string())
        .required()
        .unique((a, b) => a === b),
}).error((errors) => {
    return parseErrors(errors);
});
const getUsersValidator = Joi.object({
    params: Joi.object()
        .required()
        .keys({
            email: Joi.string().email(),
            password: Joi.string(),
            phone: Joi.string().regex(
                /^(\d{2})([-. )]*)?(\d{3})([-. )]*)?(\d{3})$/
            ),
            roleName: JoiOID.objectId(),
            firstName: Joi.string(),
            lastName: Joi.string(),
            avatar: Joi.string(),
            active: Joi.boolean(),
        }),
    fields: Joi.array()
        .items(Joi.string())
        .required()
        .unique((a, b) => a === b),
}).error((errors) => {
    return parseErrors(errors);
});

const roleValidator = Joi.object({
    roleName: Joi.string().required().min(2).max(25),
    permissions: Joi.object()
        .required()
        .keys({
            user: Joi.string().required().allow(''),
            role: Joi.string().required().allow(''),
            question: Joi.string().required().allow(''),
            test: Joi.string().required().allow(''),
            job: Joi.string().required().allow(''),
            application: Joi.string().required().allow(''),
        }),
}).error((errors) => {
    return parseErrors(errors);
});
const getRolesValidator = Joi.object({
    params: Joi.object()
        .required()
        .keys({
            roleName: Joi.string().min(2).max(25),
            active: Joi.boolean(),
            permissions: Joi.object().keys({
                user: Joi.string(),
                role: Joi.string(),
                question: Joi.string(),
                test: Joi.string(),
                job: Joi.string(),
                application: Joi.string(),
            }),
        }),
    fields: Joi.array()
        .items(Joi.string())
        .required()
        .unique((a, b) => a === b),
}).error((errors) => {
    return parseErrors(errors);
});
const deleteRoleValidator = Joi.object({
    id: JoiOID.objectId().required(),
}).error((errors) => {
    return parseErrors(errors);
});
const patchAffectToUsersRoleValidator = Joi.object({
    oldRole: JoiOID.objectId().required(),
    newRole: JoiOID.objectId().required(),
}).error((errors) => {
    return parseErrors(errors);
});
const getRoleValidator = Joi.object({
    id: JoiOID.objectId().required(),
    params: Joi.object()
        .required()
        .keys({
            roleName: Joi.string().alphanum().min(2).max(10),
            active: Joi.boolean(),
            permissions: Joi.object().keys({
                user: Joi.string(),
                role: Joi.string(),
                question: Joi.string(),
                test: Joi.string(),
                job: Joi.string(),
                application: Joi.string(),
            }),
        }),
    fields: Joi.array()
        .items(Joi.string())
        .required()
        .unique((a, b) => a === b),
}).error((errors) => {
    return parseErrors(errors);
});

exports.controllers = {
    loginValidator,
    roleValidator,
    getRolesValidator,
    getUsersValidator,
    getRoleValidator,
    getUserValidator,
    addUserValidator,
    patchUserValidator,
    requestPasswordValidator,
    recoverPasswordValidator,
    resetPasswordParamsValidator,
    patchAffectToUsersRoleValidator,
    deleteRoleValidator,
    postRole,
    patchRole,
    getRoles,
    getUsers,
    getRole,
    getUser,
    postUser,
    postLogin,
    patchUser,
    deleteUser,
    deleteRole,
    IdParamsValidator,
    patchRequestPassword,
    patchAffectToUsersRole,
    patchRecoverPassword,
    getCheckToken,
    populate,
    populateFunction,
};
