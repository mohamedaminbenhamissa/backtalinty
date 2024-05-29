const express = require('express');
const router = express.Router();

const validator = require('express-joi-validation').createValidator({});
const packController = require('../controllers/packController');

router.post(
    '/',
    validator.body(packController.controllers.postPackValidator),
    packController.controllers.postPackCheckQuestionsExist,
    packController.controllers.postPack
);

// duplicate a pack
router.post(
    '/:id',
    validator.body(packController.controllers.postPackValidator),
    validator.params(packController.controllers.getPackValidator),
    packController.controllers.postPackCheckQuestionsExist,
    packController.controllers.duplicatePack
);
router.get(
    '/:id',
    validator.params(packController.controllers.getPackValidator),
    packController.controllers.getPack
);
router.get(
    '/:id/stats',
    validator.params(packController.controllers.getPackValidator),
    packController.controllers.getStatsOfPack
);
router.delete(
    '/:id',
    validator.params(packController.controllers.getPackValidator),
    packController.controllers.deletePack
);
router.get(
    '/',
    (request, response, next) => {
        const payload = JSON.parse(request.query.payload);
        request.query.params = payload.params;
        request.query.fields = payload.fields;
        //we don't need it anymore
        delete request.query.payload;
        next();
    },
    validator.query(packController.controllers.getPacksValidator),
    packController.controllers.getPacks
);
router.patch(
    '/:id',
    validator.params(packController.controllers.getPackValidator),
    validator.body(packController.controllers.postPackValidator),
    packController.controllers.postPackCheckQuestionsExist,
    packController.controllers.putPack
);
module.exports = router;
