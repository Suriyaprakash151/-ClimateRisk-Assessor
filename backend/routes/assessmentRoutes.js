const express = require('express');
const router = express.Router();
const {
  getAssessments,
  getAssessmentById,
  createAssessment,
  compareRegions,
  simulateScenario
} = require('../controllers/assessmentController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
  .get(getAssessments)
  .post(authorize('Admin', 'Analyst'), createAssessment);

router.post('/compare', compareRegions);
router.post('/simulate', simulateScenario);

router.get('/:id', getAssessmentById);

module.exports = router;
