const express = require('express');

const courseController = require('../controllers/courseController');

const router = express.Router();

router.route('/').post(courseController.postCourse);
router.route('/').get(courseController.getCourseTest);
router.route('/student/').patch(courseController.patchStudent);
module.exports = router;
