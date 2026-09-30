const express = require('express');
const router = express.Router();
const { searchLocations, assessLocation } = require('../controllers/locationController');

router.get('/search', searchLocations);
router.post('/assess', assessLocation);

module.exports = router;
