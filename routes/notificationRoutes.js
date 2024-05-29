const express = require('express');
const router = express.Router();
const { checkCanAccessResource } = require('../middlewares/authMiddleware');
const validator = require('express-joi-validation').createValidator({});
const notificationController = require('../controllers/notificationController');

router.get(
    '/',
    checkCanAccessResource,
    notificationController.controllers.getNotifications
);
router.delete('/:id', notificationController.controllers.deleteNotification);
router.use((err, req, res, next) => {
    if (err && err.error && err.error.isJoi) {
        // we had a joi error, let's return a custom 400 json response
        res.status(400).json({
            data: err.error.toString().replace('ValidationError: ', ''),
        });
    } else if (err && err.error) {
        // pass on to another error handler
        next(err);
    }
});
module.exports = router;
