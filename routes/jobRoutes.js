const express = require('express');
const router = express.Router();
const validator = require('express-joi-validation').createValidator({
    // This options forces validation to pass any errors the express
    // error handler instead of generating a 400 error
    passError: true,
});
const { checkCanAccessResource } = require('../middlewares/authMiddleware');
const jobController = require('../controllers/jobController');

router.post(
    '/',
    validator.body(jobController.controllers.postJobValidator),
    jobController.controllers.postJob
);
router.get(
    '/',
    (request, response, next) => {
        const payload = request.query.payload;
        request.query.params = payload.params;
        request.query.fields = payload.fields.split(',');
        //we don't need it anymore
        delete request.query.payload;
        next();
    },
    validator.query(jobController.controllers.getJobsValidator),
    jobController.controllers.getJobs
);
router.get(
    '/admin',
    (request, response, next) => {
        const payload = JSON.parse(request.query.payload);
        request.query.params = payload.params;
        request.query.fields = payload.fields;
        //we don't need it anymore
        delete request.query.payload;
        next();
    },
    checkCanAccessResource,
    validator.query(jobController.controllers.getJobsValidator),
    jobController.controllers.getJobsForAdmin
);
router.get(
    '/:id',
    validator.params(jobController.controllers.IdParamsValidator),
    jobController.controllers.getJob
);
router.get('/:id/getJobStats', jobController.controllers.getJobStats);
router.patch(
    '/:id',
    validator.params(jobController.controllers.IdParamsValidator),
    validator.body(jobController.controllers.postJobValidator),
    jobController.controllers.patchJob
);
router.post(
    '/rephraseJobDescription',
    jobController.controllers.rephraseJobDescription
);
router.post('/sendJobEmail', jobController.controllers.sendJobEmail);
router.post(
    '/suggestJobDescription',
    jobController.controllers.suggestJobDescription
);
router.delete(
    '/:id',
    validator.params(jobController.controllers.IdParamsValidator),
    jobController.controllers.deleteJob
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
