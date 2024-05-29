const mongoose = require('mongoose');

const SettingsSchema = mongoose.Schema({
    mainColor: { type: String, required: true },
    secondaryColor: { type: String, required: true },
    bgColor: { type: String, required: true },
    name: { type: String, required: true },
    logo: { type: String, required: true },
    isProfileSeen: { type: Boolean, required: true, default: false },
    isResumeSeen: { type: Boolean, required: true, default: false },
    isEvoluationPassed: { type: Boolean, required: true, default: false },
});

const SettingsModel = mongoose.model('settings', SettingsSchema);
module.exports = SettingsSchema;
