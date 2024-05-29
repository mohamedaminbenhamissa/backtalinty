const mongoose = require('mongoose');
const { ObjectId } = require('mongodb');

const EvaluationSchema = mongoose.Schema({
    test: { type: ObjectId, ref: 'test', required: true },
    job: { type: ObjectId, ref: 'job', required: true },
    status: { type: ObjectId, ref: 'process', required: true },
    currentUser: { type: ObjectId, ref: 'user', default: null },
    steps: [
        {
            author: { type: ObjectId, ref: 'user' },
            comment: { type: String, required: true },
            date: { type: Date, required: true, default: Date.now },
            step: { type: ObjectId, ref: 'process' },
        },
    ],
    publicUrl: { type: String, required: true },
    resume: { type: String, required: true },
    created: { type: Date, required: true, default: Date.now },
    score: { type: Number },
    scorePerPack: [
        {
            id: { type: ObjectId, ref: 'pack' },
            score: String,
        },
    ],
    hasHandicap: { type: Boolean, default: false },
    startDate: { type: Date },
    finishDate: { type: Date },
    feedbacks: [{ type: Object }],
    comments: [
        {
            author: { type: ObjectId, ref: 'user', required: true },
            comment: { type: String, required: true },
            date: { type: Date, required: true, default: Date.now },
        },
    ],
    packsStarted: {
        type: [
            {
                startDate: Date,
                endDate: Date,
                actualEndDate: Date,
                id: { type: ObjectId, ref: 'pack' },
            },
        ],
        default: [],
    },
    packs: [{ type: Object, default: [] }],
    questions: [{ type: Object, default: [] }],
    answers: [{ type: Object, default: [] }],
    active: { type: Boolean, default: true },
    locked: { type: Date },
    lockedReason: { type: String },
});

const EvaluationModel = mongoose.model('evaluation', EvaluationSchema);
module.exports = EvaluationSchema;
