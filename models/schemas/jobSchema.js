const mongoose = require('mongoose');
const { ObjectId } = require('mongodb');
const JobSchema = mongoose.Schema({
    test: { type: ObjectId, ref: 'test', required: true },
    users: [{ type: ObjectId, ref: 'user', required: true }],
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    location: { type: String, required: true },
    type: { type: String, required: true },
    remote: { type: String, required: true },
    created: { type: Date, required: true, default: Date.now },
    expire: { type: Date, required: true },
    image: { type: String, required: false },
    active: { type: Boolean, default: true },
    public: { type: Boolean, default: false },
});

const JobModel = mongoose.model('job', JobSchema);
module.exports = JobSchema;
