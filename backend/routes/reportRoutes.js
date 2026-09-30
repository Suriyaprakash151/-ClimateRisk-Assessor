const express = require('express');
const router = express.Router();
const { exportCSV, getReportSummary } = require('../controllers/reportController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/csv', exportCSV);
router.get('/summary', getReportSummary);

module.exports = router;
