const mongoose = require('mongoose');
const emailSchema = mongoose.Schema({
    html: { type: String, required: true },
    design: { type: Object, required: true },
    subject: { type: String, required: true },
    attachments: [{ type: String }],
    active: { type: Boolean, default: true },
    isLocked: { type: Boolean, default: false },
});

const EmailModel = mongoose.model('email', emailSchema);
module.exports = emailSchema;
