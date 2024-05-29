const { postImage } = require('./files/postFiles');

const { parseErrors } = require('../utils/parseJoiErrors');

exports.controllers = {
    postImage,
};
