const express = require('express');
const router = express.Router();

const validator = require('express-joi-validation').createValidator({});
const candidateController = require('../controllers/candidateController');
const { checkCanAccessResource } = require('../middlewares/authMiddleware');

router.patch(
    '/:id/generateSmartAnalysis/',
    validator.params(candidateController.controllers.getCandidateValidator),
    candidateController.controllers.generateSmartAnalysis
);
router.patch(
    '/:id/parseResume/',
    validator.params(candidateController.controllers.getCandidateValidator),
    candidateController.controllers.parseResume
);

router.patch(
    '/:id/addCustomField/',
    validator.params(candidateController.controllers.getCandidateValidator),
    candidateController.controllers.addCustomField
);
router.get(
    '/',
    checkCanAccessResource,
    candidateController.controllers.getListCandidates
);

router.get(
    '/:id/duplicates/',
    checkCanAccessResource,
    validator.params(candidateController.controllers.getCandidateValidator),
    candidateController.controllers.getDuplicate
);
router.patch(
    '/:id/mergeCandidate/',
    validator.params(candidateController.controllers.getCandidateValidator),
    candidateController.controllers.mergeCandidate
);
router.patch(
    '/:id/notDuplicate/',
    validator.params(candidateController.controllers.getCandidateValidator),
    candidateController.controllers.notDuplicate
);
router.get(
    '/KanbanColumns',
    checkCanAccessResource,
    candidateController.controllers.getKanbanColumns
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
