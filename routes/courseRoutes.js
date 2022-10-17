const express = require('express');

const userController = require('../controllers/courseController');

const router = express.Router();
router.route('/').post(courseController.postCourse);

module.exports = router;