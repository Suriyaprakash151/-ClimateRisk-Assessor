const express = require('express');
const router = express.Router();
const { getAlerts, updateAlertStatus } = require('../controllers/alertController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', getAlerts);
router.patch('/:id/status', authorize('Admin', 'Analyst'), updateAlertStatus);

module.exports = router;
