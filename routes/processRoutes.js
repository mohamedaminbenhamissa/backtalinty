const express = require('express');
const router = express.Router();
const validator = require('express-joi-validation').createValidator({
    // This options forces validation to pass any errors the express
    // error handler instead of generating a 400 error
    passError: true,
});

const processController = require('../controllers/processController');

router.post(
    '/',
    validator.body(processController.controllers.postProcessValidator),
    processController.controllers.postProcess
);
router.get(
    '/:id',
    (request, response, next) => {
        const payload = JSON.parse(request.query.payload);
        request.params.params = payload.params;
        request.params.fields = payload.fields;
        //we don't need it anymore
        delete request.query.payload;
        next();
    },
    validator.params(processController.controllers.getProcessValidator),
    processController.controllers.getProcess
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
    validator.query(processController.controllers.getProcessesValidator),
    processController.controllers.getProcesses
);
router.patch(
    'edit/:id',
    validator.params(processController.controllers.IdParamsValidator),
    validator.body(processController.controllers.processValidator),
    processController.controllers.patchProcess
);
router.patch(
    '/positions',
    validator.body(processController.controllers.processBacthUpdateValidator),
    processController.controllers.patchProcess
);
router.delete(
    '/:id',
    validator.params(processController.controllers.IdParamsValidator),
    processController.controllers.deleteProcess
);

// a middleware function with no mount path. This code is executed for every request to the router so that we can return custom Joi Errors
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
