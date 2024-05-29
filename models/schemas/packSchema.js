const mongoose = require('mongoose');
const { ObjectId } = require('mongodb');

const PackSchema = mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    minScore: { type: Number, min: 0 },
    maxScore: { type: Number, max: 100 },
    randomQuestions: { type: Boolean, default: true },
    randomOrder: { type: Boolean, default: true },
    category: { type: Array, required: true },
    difficulty: { type: String, required: true },
    allowedTime: { type: Number, required: true },
    questions: [
        { type: ObjectId, ref: 'question', required: true },
        { type: Number, required: true },
    ],
    active: { type: Boolean, default: true },
    parent: { type: ObjectId, ref: 'test' },
});

const PackModel = mongoose.model('pack', PackSchema);
module.exports = PackSchema;
