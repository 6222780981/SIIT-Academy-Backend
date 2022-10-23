const express = require('express');

const weekController = require('../controllers/weekController');

const router = express.Router();

router.route('/').get(weekController.getWeek);
router.route('/assignment/').post(weekController.postAssignment);

module.exports = router;
