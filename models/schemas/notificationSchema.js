const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { ObjectId } = require('mongodb');
const { controllers } = require('../../controllers/notificationController');
const NotificationSchema = new Schema({
    sender: { type: ObjectId, ref: 'user' },
    job: { type: ObjectId, ref: 'job' },
    evaluation: { type: ObjectId, ref: 'evaluation' },
    candidate: { type: ObjectId, ref: 'candidate' },
    receiver: { type: ObjectId, ref: 'user', required: true },
    type: {
        type: String,
        enum: Object.keys(controllers.NotificationType),
        required: true,
    },
    message: { type: String },
    read: { type: Boolean, default: false },
    created: { type: Date, default: Date.now },
    active: { type: Boolean, default: true },
});
const NotificationModel = mongoose.model('notification', NotificationSchema);

module.exports = NotificationSchema;
