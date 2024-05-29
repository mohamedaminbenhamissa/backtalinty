const mongoose = require('mongoose');

const getNotifications = async (req, res) => {
    try {
        const userId = mongoose.Types.ObjectId(req.user.userId);
        const Notification = req.Notification;
        const notifications = await Notification.find(
            { read: false, receiver: userId },
            'sender evaluation type created candidate job message'
        )
            .populate({ path: 'candidate', select: 'firstName lastName -_id' })
            .populate({ path: 'sender', select: 'firstName lastName -_id ' })
            .populate({ path: 'job', select: 'name -_id ' })
            .sort([['created', -1]])
            .lean();
        return res.status(200).json(notifications);
    } catch (e) {
        return res.status(500).send('Error: ' + e.message);
    }
};

module.exports = {
    getNotifications,
};
