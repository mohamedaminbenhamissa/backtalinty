const Joi = require('joi');
const JoiOID = require('joi-oid');
const { parseErrors } = require('../utils/parseJoiErrors');
const { getNotifications } = require('./notifications/getNotification');
const { deleteNotification } = require('./notifications/deleteNotification');
const NotificationType = {
    jobApplication: 'jobApplication',
    evaluationFinished: 'evaluationFinished',
    userAffectation: 'userAffectation',
    userMentioned: 'userMentioned',
};

exports.controllers = {
    NotificationType,
    getNotifications,
    deleteNotification,
};
