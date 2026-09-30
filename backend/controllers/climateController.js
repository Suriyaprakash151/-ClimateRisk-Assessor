const ClimateData = require('../models/ClimateData');
const Region = require('../models/Region');
const { fetchOpenMeteoData } = require('../services/openMeteoService');

// @desc    Get climate data for a region
// @route   GET /api/climate/:regionId
// @access  Private
const getClimateData = async (req, res, next) => {
  try {
    const { regionId } = req.params;
    const climate = await ClimateData.findOne({ regionId }).sort({ fetchedAt: -1 });
    
    if (!climate) {
      return res.status(404).json({ message: 'No climate data found for this region. Try syncing climate data.' });
    }

    res.json(climate);
  } catch (error) {
    next(error);
  }
};

// @desc    Force sync climate data from Open-Meteo for a region
// @route   POST /api/climate/:regionId
// @access  Private (Admin, Analyst)
const syncClimateData = async (req, res, next) => {
  try {
    const { regionId } = req.params;
    const region = await Region.findById(regionId);
    if (!region) {
      return res.status(404).json({ message: 'Region not found' });
    }

    const liveData = await fetchOpenMeteoData(region.lat, region.lng);
    const updatedClimate = await ClimateData.create({
      regionId: region._id,
      ...liveData
    });

    res.status(201).json({
      message: `Climate data for ${region.name} successfully updated from ${liveData.source}.`,
      climate: updatedClimate
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getClimateData, syncClimateData };
