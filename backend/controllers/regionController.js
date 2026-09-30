const Region = require('../models/Region');
const ClimateData = require('../models/ClimateData');
const Assessment = require('../models/Assessment');
const Alert = require('../models/Alert');
const { fetchOpenMeteoData } = require('../services/openMeteoService');
const { evaluateRisk } = require('../services/riskEngine');
const Config = require('../models/Config');

// @desc    Get all regions
// @route   GET /api/regions
// @access  Private
const getRegions = async (req, res, next) => {
  try {
    const regions = await Region.find().populate('createdBy', 'name email role').sort({ createdAt: -1 });
    res.json(regions);
  } catch (error) {
    next(error);
  }
};

// @desc    Get single region by ID with latest climate & assessment data
// @route   GET /api/regions/:id
// @access  Private
const getRegionById = async (req, res, next) => {
  try {
    const region = await Region.findById(req.params.id).populate('createdBy', 'name email role');
    if (!region) {
      return res.status(404).json({ message: 'Region not found' });
    }

    const latestClimate = await ClimateData.findOne({ regionId: region._id }).sort({ fetchedAt: -1 });
    const latestAssessment = await Assessment.findOne({ regionId: region._id }).sort({ createdAt: -1 });

    res.json({
      region,
      latestClimate,
      latestAssessment
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new region & automatically trigger initial climate fetch and risk evaluation
// @route   POST /api/regions
// @access  Private (Admin, Analyst)
const createRegion = async (req, res, next) => {
  try {
    const { name, type, lat, lng, population, areaSqKm, notes } = req.body;

    if (!name || lat === undefined || lng === undefined) {
      return res.status(400).json({ message: 'Name, latitude, and longitude are required' });
    }

    const existingRegion = await Region.findOne({ name: name.trim() });
    if (existingRegion) {
      return res.status(400).json({ message: 'Region with this name already exists' });
    }

    const region = await Region.create({
      name: name.trim(),
      type: type || 'City',
      lat: Number(lat),
      lng: Number(lng),
      population: population ? Number(population) : 0,
      areaSqKm: areaSqKm ? Number(areaSqKm) : 100,
      notes: notes || '',
      createdBy: req.user._id
    });

    // Auto-fetch climate data and create baseline assessment
    try {
      const openMeteoData = await fetchOpenMeteoData(region.lat, region.lng);
      const climateDoc = await ClimateData.create({
        regionId: region._id,
        ...openMeteoData
      });

      const sysConfig = await Config.findOne().sort({ updatedAt: -1 });
      const weights = sysConfig?.weights;
      const thresholds = sysConfig?.thresholds;

      const evalResult = evaluateRisk(climateDoc, weights, thresholds, region.type);
      
      const assessment = await Assessment.create({
        regionId: region._id,
        createdBy: req.user._id,
        scores: evalResult.scores,
        riskLevel: evalResult.riskLevel,
        hazardDetails: evalResult.hazardDetails,
        recommendations: evalResult.recommendations,
        isSimulation: false
      });

      // Auto alert trigger if composite risk >= threshold
      const alertThreshold = thresholds?.highRiskAlertThreshold || 55;
      if (evalResult.scores.composite >= alertThreshold) {
        await Alert.create({
          regionId: region._id,
          assessmentId: assessment._id,
          hazardType: 'Composite',
          riskScore: evalResult.scores.composite,
          riskLevel: evalResult.riskLevel,
          message: `Automatic alert: ${region.name} registered ${evalResult.riskLevel} composite climate risk (${evalResult.scores.composite}/100).`,
          status: 'new'
        });
      }
    } catch (err) {
      console.error(`[Region Creation] Initial climate fetch error for ${region.name}:`, err.message);
    }

    res.status(201).json(region);
  } catch (error) {
    next(error);
  }
};

// @desc    Update region
// @route   PUT /api/regions/:id
// @access  Private (Admin, Analyst)
const updateRegion = async (req, res, next) => {
  try {
    const region = await Region.findById(req.params.id);
    if (!region) {
      return res.status(404).json({ message: 'Region not found' });
    }

    const { name, type, lat, lng, population, areaSqKm, notes } = req.body;
    
    if (name) region.name = name.trim();
    if (type) region.type = type;
    if (lat !== undefined) region.lat = Number(lat);
    if (lng !== undefined) region.lng = Number(lng);
    if (population !== undefined) region.population = Number(population);
    if (areaSqKm !== undefined) region.areaSqKm = Number(areaSqKm);
    if (notes !== undefined) region.notes = notes;

    const updatedRegion = await region.save();
    res.json(updatedRegion);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete region and related data
// @route   DELETE /api/regions/:id
// @access  Private (Admin)
const deleteRegion = async (req, res, next) => {
  try {
    const region = await Region.findById(req.params.id);
    if (!region) {
      return res.status(404).json({ message: 'Region not found' });
    }

    await ClimateData.deleteMany({ regionId: region._id });
    await Assessment.deleteMany({ regionId: region._id });
    await Alert.deleteMany({ regionId: region._id });
    await region.deleteOne();

    res.json({ message: `Region '${region.name}' and associated data successfully removed.` });
  } catch (error) {
    next(error);
  }
};

module.exports = { getRegions, getRegionById, createRegion, updateRegion, deleteRegion };
