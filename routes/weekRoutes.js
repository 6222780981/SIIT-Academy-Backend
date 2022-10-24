const express = require('express');

const weekController = require('../controllers/weekController');

const router = express.Router();

router.route('/').get(weekController.getWeek);
router.route('/').post(weekController.postWeek);
router.route('/').delete(weekController.deleteWeek);
router.route('/assignment/').post(weekController.postAssignment);
router.route('/material/').post(weekController.postMaterial);
module.exports = router;
