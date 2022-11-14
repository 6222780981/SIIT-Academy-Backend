const express = require('express');

const weekController = require('../controllers/weekController');

const router = express.Router();

router.route('/').get(weekController.getWeek);
router.route('/').post(weekController.postWeek);
router.route('/').delete(weekController.deleteWeek);
router.route('/').patch(weekController.patchWeek);
router.route('/assignment/').get(weekController.getAssignment);
router.route('/assignment/').post(weekController.postAssignment);
router.route('/assignment/').delete(weekController.deleteAssignment);
router.route('/material/').post(weekController.postMaterial);
router.route('/material/').get(weekController.getMaterial);
router.route('/material/').delete(weekController.deleteMaterial);
router.route('/assignment/submission/').get(weekController.getSubmission);
router.route('/assignment/submission/').post(weekController.postSubmission);
router.route('/assignment/submission/').delete(weekController.deleteSubmission);
router.route('/assignment/all-submission/').get(weekController.getAllSubmission);
router.route('/video-progress/').patch(weekController.patchVideoProgress);
router.route('/video-progress/').get(weekController.getVideoProgress);
module.exports = router;
