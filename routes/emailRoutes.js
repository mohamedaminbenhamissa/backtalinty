const express = require('express');
const router = express.Router();
const validator = require('express-joi-validation').createValidator({
    // This options forces validation to pass any errors the express
    // error handler instead of generating a 400 error
    passError: true,
});
const { checkCanAccessResource } = require('../middlewares/authMiddleware');
const emailController = require('../controllers/emailController');

router.post(
    '/',
    validator.body(emailController.controllers.postEmailValidator),
    emailController.controllers.postEmail
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
    validator.query(emailController.controllers.getEmailsValidator),
    emailController.controllers.getEmails
);
router.get(
    '/:id',
    validator.params(emailController.controllers.IdParamsValidator),
    emailController.controllers.getEmail
);
router.patch(
    '/:id',
    validator.params(emailController.controllers.IdParamsValidator),
    validator.body(emailController.controllers.postEmailValidator),
    emailController.controllers.patchEmail
);
router.delete(
    '/:id',
    validator.params(emailController.controllers.IdParamsValidator),
    emailController.controllers.deleteEmail
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
