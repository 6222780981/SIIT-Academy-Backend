const express = require('express');

const weekController = require('../controllers/weekController');

const router = express.Router();

router.route('/').get(weekController.getWeek);
router.route('/').post(weekController.postWeek);
router.route('/').delete(weekController.deleteWeek);
router.route('/').patch(weekController.patchWeek);
router.route('/assignment/').post(weekController.postAssignment);
router.route('/material/').post(weekController.postMaterial);
router.route('/assignment/submission/').get(weekController.getSubmission);
router.route('/assignment/submission/').post(weekController.postSubmission);
router.route('/assignment/submission/').delete(weekController.deleteSubmission);

module.exports = router;
