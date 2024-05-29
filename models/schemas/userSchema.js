const mongoose = require('mongoose');
const { ObjectId } = require('mongodb');

const UserSchema = mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String },
    phone: { type: String, unique: true },
    job: { type: String },
    attempts: { type: Number, required: true, default: 0 },
    role: { type: ObjectId, ref: 'role', required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    notificationPreferences: {
        emailNotification: { type: Boolean, required: true, default: true },
        pushNotification: { type: Boolean, required: true, default: true },
        browserNotification: { type: Boolean, required: true, default: true },
    },
    avatar: { type: String, required: true },
    active: { type: Boolean, required: true, default: true },
    createdAt: { type: Date, default: Date.now },
    lastConnection: { type: Date },
});

const UserModel = mongoose.model('user', UserSchema);
module.exports = UserSchema;
