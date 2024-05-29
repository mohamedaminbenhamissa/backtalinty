const express = require('express');
const router = express.Router();

const validator = require('express-joi-validation').createValidator({});
const testController = require('../controllers/testController');

router.post(
    '/',
    validator.body(testController.controllers.postTestValidator),
    testController.controllers.postTestCheckPacksExist,
    testController.controllers.postTest
);

// duplicate a test
router.post(
    '/:id',
    validator.body(testController.controllers.postTestValidator),
    validator.params(testController.controllers.getTestValidator),
    testController.controllers.postTestCheckPacksExist,
    testController.controllers.duplicateTest
);
router.get(
    '/:id',
    validator.params(testController.controllers.getTestValidator),
    testController.controllers.getTest
);
router.delete(
    '/:id',
    validator.params(testController.controllers.getTestValidator),
    testController.controllers.deleteTest
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
    validator.query(testController.controllers.getTestsValidator),
    testController.controllers.getTests
);
router.patch(
    '/:id',
    validator.params(testController.controllers.getTestValidator),
    validator.body(testController.controllers.postTestValidator),
    testController.controllers.postTestCheckPacksExist,
    testController.controllers.putTest
);
module.exports = router;
