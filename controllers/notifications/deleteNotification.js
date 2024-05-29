const mongoose = require('mongoose');
const i18n = require('i18n');
const deleteNotification = async (req, res) => {
    try {
        const Notification = req.Notification;
        const notificationId = req.params.id;
        if (mongoose.Types.ObjectId.isValid(notificationId)) {
            const notification = await Notification.findByIdAndDelete(
                notificationId
            );
            if (!notification) {
                return res
                    .status(500)
                    .send(i18n.__('An unknown problem has occurred, please try again later'));
            }
        } else {
            await Notification.deleteMany({});
        }

        res.status(204).send();
    } catch (e) {
        return res.status(500).send('Error: ' + e.message);
    }
};

module.exports = { deleteNotification };
