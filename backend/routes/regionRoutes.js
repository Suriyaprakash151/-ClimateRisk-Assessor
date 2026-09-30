const express = require('express');
const router = express.Router();
const { getRegions, getRegionById, createRegion, updateRegion, deleteRegion } = require('../controllers/regionController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
  .get(getRegions)
  .post(authorize('Admin', 'Analyst'), createRegion);

router.route('/:id')
  .get(getRegionById)
  .put(authorize('Admin', 'Analyst'), updateRegion)
  .delete(authorize('Admin'), deleteRegion);

module.exports = router;
