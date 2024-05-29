const mongoose = require('mongoose');

const QuestionSchema = mongoose.Schema({
    name: { type: String, required: true },
    type: { type: String, required: true },
    category: { type: Array, required: true },
    difficulty: { type: String, required: true },
    applyPenalty: { type: Boolean, required: true },
    isSearchable: { type: Boolean, required: true },
    correctAnswer: { type: Array, required: true },
    answers: { type: Array, required: true },
    allowedTime: { type: Number, required: true },
    enableLimit: { type: Boolean, required: true, default: false },
    wordsOrChar: { type: String, required: false },
    fileSize: { type: String, required: false },
    videoLength: { type: Number, required: false },
    limit: { type: Number, required: false },
    description: { type: String, required: true },
    isTrainingQuestion: { type: Boolean, default: false },
    isRandomResponseChecker: { type: Boolean, default: false },
    active: { type: Boolean, required: true, default: true },
});

const QuestionModel = mongoose.model('question', QuestionSchema);
module.exports = QuestionSchema;
