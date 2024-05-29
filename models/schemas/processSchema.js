const mongoose = require('mongoose');
const { ObjectId } = require('mongodb');
const ProcessSchema = mongoose.Schema({
    name: { type: String, required: true },
    email: { type: ObjectId, ref: 'email' },
    position: { type: Number, required: true },
    hasEvaluation: { type: Boolean, required: true, default: false },
    active: { type: Boolean, required: true, default: true },
});

const ProcessModel = mongoose.model('process', ProcessSchema);
module.exports = ProcessSchema;
