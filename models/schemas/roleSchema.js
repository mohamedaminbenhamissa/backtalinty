const mongoose = require('mongoose');

const RoleSchema = mongoose.Schema({
    roleName: { type: String, required: true },
    active: { type: Boolean, required: true, default: true },
    permissions: { type: Object, required: true },
});

const RoleModel = mongoose.model('role', RoleSchema);
module.exports = RoleSchema;
