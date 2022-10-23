const express = require('express');

const weekController = require('../controllers/weekController');

const router = express.Router();

router.route('/').get(weekController.getWeek);

module.exports = router;
