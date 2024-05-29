const mongoose = require('mongoose');
const { ObjectId } = require('mongodb');

const TokenSchema = mongoose.Schema({
    user: { type: ObjectId, ref: 'user', required: true },
    token: { type: String, required: true },
    publicToken: { type: String, required: true },
    createdAt: { type: Date, default: Date.now, expires: 3600 * 48 }, //48hours
});

const TokenModel = mongoose.model('token', TokenSchema);
module.exports = TokenSchema;
