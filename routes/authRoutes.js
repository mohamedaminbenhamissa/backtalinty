const express = require('express');
const router = express.Router();
const validator = require('express-joi-validation').createValidator({
    // This options forces validation to pass any errors the express
    // error handler instead of generating a 400 error
    passError: true,
});

const authController = require('../controllers/authController');

const { checkCanAccessResource } = require('../middlewares/authMiddleware');

//UNCOMMENT THIS TO POPULATE DB
/*router.post(
  '/populate',
  authController.controllers.populate
);*/

router.post(
    /*
    #swagger.tags = ['Auth']
    #swagger.path = ['/api/v1/auth/login']
    #swagger.description = 'Login using email and password'
    #swagger.parameters['email'] = { in: 'body', description: 'Email', required: true}
    #swagger.parameters['password'] = { in: 'body', description: 'Password', required: true}
    #swagger.responses[401] = {
        description: 'Wrong parameters'
    }
    #swagger.responses[200] = {
        description: 'Sucessfully login'
    }
    #swagger.responses[500] = {
        description: 'Server error'
   }
   */
    '/login',
    authController.controllers.postLogin
);
router.post(
    // #swagger.tags = ['Auth']
    // #swagger.description = 'TEST 2'
    '/user',
    validator.body(authController.controllers.addUserValidator),
    authController.controllers.postUser
);
router.get(
    '/user/:id',
    //send fields to validator because paylaod is a string and not an object
    (request, response, next) => {
        const payload = JSON.parse(request.query.payload);
        request.params.fields = payload.fields;
        //we don't need it anymore
        delete request.query.payload;
        next();
    },
    validator.params(authController.controllers.getUserValidator),
    authController.controllers.getUser
);
router.get(
    '/user',
    //send params and fields to valdator because paylaod is a string and not an object
    (request, response, next) => {
        const payload = JSON.parse(request.query.payload);
        request.query.params = payload.params;
        request.query.fields = payload.fields;
        //we don't need it anymore
        delete request.query.payload;
        next();
    },
    validator.query(authController.controllers.getUsersValidator),
    authController.controllers.getUsers
);
router.patch(
    '/user/affect/:oldRole/:newRole',
    checkCanAccessResource,
    validator.params(
        authController.controllers.patchAffectToUsersRoleValidator
    ),
    authController.controllers.patchAffectToUsersRole
);
router.patch(
    '/request-password',
    validator.body(authController.controllers.requestPasswordValidator),
    authController.controllers.patchRequestPassword
);
router.patch(
    '/recover-password/:token',
    validator.params(authController.controllers.resetPasswordParamsValidator),
    validator.body(authController.controllers.recoverPasswordValidator),
    authController.controllers.patchRecoverPassword
);
router.get(
    '/check-token/:token',
    validator.params(authController.controllers.resetPasswordParamsValidator),
    authController.controllers.getCheckToken
);
router.patch(
    '/user/:id',
    checkCanAccessResource,
    validator.params(authController.controllers.patchUserValidator),
    validator.body(authController.controllers.addUserValidator),
    authController.controllers.patchUser
);
router.patch(
    '/user/:id/delete',
    checkCanAccessResource,
    validator.params(authController.controllers.patchUserValidator),
    authController.controllers.deleteUser
);
router.post(
    '/role',
    checkCanAccessResource,
    validator.body(authController.controllers.roleValidator),
    authController.controllers.postRole
);

router.get(
    '/role/:id',
    (request, response, next) => {
        const payload = JSON.parse(request.query.payload);
        request.params.params = payload.params;
        request.params.fields = payload.fields;
        //we don't need it anymore
        delete request.query.payload;
        next();
    },
    validator.params(authController.controllers.getRoleValidator),
    authController.controllers.getRole
);
router.get(
    '/role',
    //send params and fields to valdator because paylaod is a string and not an object
    (request, response, next) => {
        const payload = JSON.parse(request.query.payload);
        request.query.params = payload.params;
        request.query.fields = payload.fields;
        //we don't need it anymore
        delete request.query.payload;
        next();
    },

    validator.query(authController.controllers.getRolesValidator),
    authController.controllers.getRoles
);
router.patch(
    '/role/:id',
    validator.params(authController.controllers.IdParamsValidator),
    validator.body(authController.controllers.roleValidator),
    authController.controllers.patchRole
);
router.delete(
    '/role/:id',
    validator.params(authController.controllers.deleteRoleValidator),
    authController.controllers.deleteRole
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
