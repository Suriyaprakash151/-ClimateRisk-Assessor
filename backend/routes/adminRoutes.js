const express = require('express');
const router = express.Router();
const { getConfig, updateConfig, getUsers, updateUserRole } = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/config', getConfig);
router.put('/config', authorize('Admin'), updateConfig);
router.get('/users', authorize('Admin'), getUsers);
router.put('/users/:id/role', authorize('Admin'), updateUserRole);

module.exports = router;
