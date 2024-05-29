const mongoose = require('mongoose');
const { ObjectId } = require('mongodb');

const TestSchema = mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    minScore: { type: Number, min: 0 },
    maxScore: { type: Number, max: 100 },
    webcamScreenshots: { type: Boolean, default: false },
    disableCopyPaste: { type: Boolean, default: true },
    monitorTabs: { type: Boolean, default: true },
    lockTestAfterRefresh: { type: Boolean, default: true },
    enableExposureLimit: { type: Boolean, default: false },
    exposureLimit: { type: Number, required: true },
    enableFeedback: { type: Boolean, default: true },
    enableTrainingQuestions: { type: Boolean, default: false },
    numberOfTrainingQuestions: { type: Number, required: true },
    enableRandomResponsesChecker: { type: Boolean, default: true },
    enableExtraTime: { type: Boolean, default: false },
    extraTime: { type: Number, required: true },
    introVideo: { type: String },
    outroVideo: { type: String },
    testFor: { type: Array, required: true },
    allowedTime: { type: Number, required: true },
    packs: [{ type: ObjectId, ref: 'pack', required: true }],
    active: { type: Boolean, default: true },
    parent: { type: ObjectId, ref: 'test' },
});

const TestModel = mongoose.model('test', TestSchema);
module.exports = TestSchema;
