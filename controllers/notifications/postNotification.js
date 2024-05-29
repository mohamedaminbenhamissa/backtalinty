const mongoose = require('mongoose');
const i18n = require('i18n');

const postNotification = async (req, res) => {
    try {
        const Notification = req.Notification;
        const notificationInformation = req.body;
        const notification = await Notification.create(notificationInformation);
        if (!notification)
            return res
                .status(500)
                .send(i18n.__('An unknown problem has occurred, please try again later'));

        return res.status(201).send('Created');
    } catch (e) {
        return res.status(500).send('Error: ' + e.message);
    }
};
module.exports = { postNotification };
