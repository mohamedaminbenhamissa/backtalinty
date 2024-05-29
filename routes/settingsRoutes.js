const express = require('express');
const router = express.Router();

const validator = require('express-joi-validation').createValidator({});
const settingsController = require('../controllers/settingsController');

router.get('/', settingsController.controllers.getSettings);

router.put(
    '/',
    validator.body(settingsController.controllers.postSettingsValidator),
    settingsController.controllers.putSettings
);

router.patch(
    '/',
    validator.body(settingsController.controllers.patchSettingsValidator),
    settingsController.controllers.patchSettings
);
module.exports = router;
