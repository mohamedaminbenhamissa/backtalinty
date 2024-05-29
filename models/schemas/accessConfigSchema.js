const mongoose = require('mongoose');

const AccessConfigSchema = mongoose.Schema({
    subdomain: { type: String, required: true },
    name: { type: String, required: true },
    databaseURI: { type: String, required: true },
    backendURI: { type: String, required: true },
    frontendURI: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
});

const AccessConfigModel = mongoose.model('access', AccessConfigSchema);
module.exports = AccessConfigSchema;
