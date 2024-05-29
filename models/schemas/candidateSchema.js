const mongoose = require('mongoose');
const { ObjectId } = require('mongodb');
const CandidateSchema = mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    resumes: [{ type: String, required: true }],
    evaluations: [{ type: ObjectId, ref: 'evaluation', default: [] }],
    phoneNumbers: [{ type: String, default: [] }],
    certifications: [{ type: String, default: [] }],
    languages: [{ type: String, default: [] }],
    emails: [{ type: String, default: [] }],
    websites: [{ type: String, default: [] }],
    hardSkills: [{ type: Object, default: [] }],
    softSkills: [{ type: Object, default: [] }],
    education: [{ type: Object, default: [] }],
    workExperience: [{ type: Object, default: [] }],
    totalYearsOfExperience: { type: String, default: null },
    summary: { type: String, default: null },
    currentOrganization: { type: String, default: null },
    redactedContent: { type: String, default: null },
    dateOfBirth: { type: String, default: null },
    jobTitle: { type: String, default: null },
    facebook: { type: String, default: null },
    linkedin: { type: String, default: null },
    github: { type: String, default: null },
    gitlab: { type: String, default: null },
    youtube: { type: String, default: null },
    created: { type: Date, required: true, default: Date.now },
    parsed: { type: Boolean, default: false },
    profileComplete: { type: Number, default: false },
    smartAnalysis: { type: Object },
    customFields: { type: Object },
    duplicate: [
        { type: ObjectId, ref: 'candidate', default: [] },
    ] /*new added to test the merge candidate*/,
});

const CandidateModel = mongoose.model('candidate', CandidateSchema);
module.exports = CandidateSchema;
