const express = require('express');
const router = express.Router();
const { getClimateData, syncClimateData } = require('../controllers/climateController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/:regionId', getClimateData);
router.post('/:regionId', authorize('Admin', 'Analyst'), syncClimateData);

module.exports = router;
