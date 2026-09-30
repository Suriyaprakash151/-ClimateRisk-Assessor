const { geocodeLocation } = require('../services/geocodingService');
const { fetchOpenMeteoData } = require('../services/openMeteoService');
const { evaluateRisk } = require('../services/riskEngine');
const Region = require('../models/Region');
const ClimateData = require('../models/ClimateData');
const Assessment = require('../models/Assessment');
const Alert = require('../models/Alert');
const Config = require('../models/Config');

// @desc    Geocode location search query
// @route   GET /api/locations/search
// @access  Public / Private
const searchLocations = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q || !q.trim()) {
      return res.status(400).json({ message: 'Location search query is required' });
    }

    const locations = await geocodeLocation(q);
    res.json(locations);
  } catch (error) {
    next(error);
  }
};

// @desc    Automatically generate climate hazard assessment for any location
// @route   POST /api/locations/assess
// @access  Public / Private
const assessLocation = async (req, res, next) => {
  try {
    let { name, query, lat, lng, saveToDb = false } = req.body;

    // 1. Geocode location if coordinates are missing
    if ((lat === undefined || lng === undefined) && (query || name)) {
      const geoResults = await geocodeLocation(query || name);
      if (!geoResults || geoResults.length === 0) {
        return res.status(404).json({ message: 'Location could not be found. Please check location name and try again.' });
      }
      const firstResult = geoResults[0];
      name = firstResult.name;
      lat = firstResult.lat;
      lng = firstResult.lng;
    }

    if (lat === undefined || lng === undefined) {
      return res.status(400).json({ message: 'Valid location coordinates (lat, lng) or search query are required' });
    }

    // 2. Fetch meteorological telemetry from Open-Meteo API
    const climateData = await fetchOpenMeteoData(Number(lat), Number(lng));

    // 3. Load active system weights & thresholds
    const sysConfig = await Config.findOne().sort({ updatedAt: -1 });
    const weights = sysConfig?.weights;
    const thresholds = sysConfig?.thresholds;

    // 4. Run deterministic mathematical risk engine
    const evalResult = evaluateRisk(climateData, weights, thresholds);

    const timestamp = new Date().toISOString();

    const responsePayload = {
      location: {
        name: name || `Coordinates (${Number(lat).toFixed(4)}, ${Number(lng).toFixed(4)})`,
        lat: Number(lat),
        lng: Number(lng)
      },
      dataSource: {
        provider: 'Open-Meteo API',
        type: climateData.source === 'Open-Meteo API' ? 'Latest available climate data' : 'Cached fallback climate data',
        timestamp
      },
      scores: evalResult.scores,
      riskLevel: evalResult.riskLevel,
      hazardDetails: evalResult.hazardDetails,
      recommendations: evalResult.recommendations,
      indicators: {
        temperature: climateData.temperature,
        precipitation: climateData.precipitation,
        wind: climateData.wind,
        soilMoisture: climateData.soilMoisture
      }
    };

    // 5. Optional Save Assessment to MongoDB
    if (saveToDb) {
      const regionName = (name ? name.split(',')[0] : `Location_${Date.now()}`).trim();
      let region = await Region.findOne({ name: regionName });
      if (!region) {
        region = await Region.create({
          name: regionName,
          type: 'City',
          lat: Number(lat),
          lng: Number(lng),
          notes: `Auto-registered from global search: ${name}`,
          createdBy: req.user?._id
        });
      }

      await ClimateData.create({
        regionId: region._id,
        ...climateData
      });

      const savedAssessment = await Assessment.create({
        regionId: region._id,
        createdBy: req.user?._id,
        scores: evalResult.scores,
        riskLevel: evalResult.riskLevel,
        hazardDetails: evalResult.hazardDetails,
        recommendations: evalResult.recommendations,
        isSimulation: false
      });

      if (evalResult.scores.composite >= 50) {
        await Alert.create({
          regionId: region._id,
          assessmentId: savedAssessment._id,
          hazardType: 'Composite',
          riskScore: evalResult.scores.composite,
          riskLevel: evalResult.riskLevel,
          message: `Automatic alert: ${region.name} assessed with ${evalResult.riskLevel} risk level (${evalResult.scores.composite}/100).`,
          status: 'new'
        });
      }

      responsePayload.savedId = savedAssessment._id;
    }

    res.json(responsePayload);
  } catch (error) {
    next(error);
  }
};

module.exports = { searchLocations, assessLocation };
