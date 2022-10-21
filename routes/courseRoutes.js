const express = require('express');

const courseController = require('../controllers/courseController');

const router = express.Router();

router.route('/').post(courseController.postCourse);
router.route('/').get(courseController.getCourse);
router.route('/').delete(courseController.deleteCourse);
router.route('/student/').patch(courseController.patchStudent);
module.exports = router;
