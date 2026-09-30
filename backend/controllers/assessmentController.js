const Assessment = require('../models/Assessment');
const Region = require('../models/Region');
const ClimateData = require('../models/ClimateData');
const Alert = require('../models/Alert');
const Config = require('../models/Config');
const { evaluateRisk } = require('../services/riskEngine');

// @desc    Get all assessments
// @route   GET /api/assessments
// @access  Private
const getAssessments = async (req, res, next) => {
  try {
    const { regionId, riskLevel, limit } = req.query;
    const filter = {};
    
    if (regionId) filter.regionId = regionId;
    if (riskLevel) filter.riskLevel = riskLevel;

    const query = Assessment.find(filter)
      .populate('regionId', 'name type lat lng population')
      .populate('createdBy', 'name email role')
      .sort({ createdAt: -1 });

    if (limit) query.limit(Number(limit));

    const assessments = await query.exec();
    res.json(assessments);
  } catch (error) {
    next(error);
  }
};

// @desc    Get single assessment by ID
// @route   GET /api/assessments/:id
// @access  Private
const getAssessmentById = async (req, res, next) => {
  try {
    const assessment = await Assessment.findById(req.params.id)
      .populate('regionId')
      .populate('createdBy', 'name email role');

    if (!assessment) {
      return res.status(404).json({ message: 'Assessment not found' });
    }

    res.json(assessment);
  } catch (error) {
    next(error);
  }
};

// @desc    Create/Run new risk assessment for a region
// @route   POST /api/assessments
// @access  Private (Admin, Analyst)
const createAssessment = async (req, res, next) => {
  try {
    const { regionId } = req.body;
    if (!regionId) {
      return res.status(400).json({ message: 'regionId is required' });
    }

    const region = await Region.findById(regionId);
    if (!region) {
      return res.status(404).json({ message: 'Region not found' });
    }

    // Get latest climate data
    let climate = await ClimateData.findOne({ regionId: region._id }).sort({ fetchedAt: -1 });
    if (!climate) {
      return res.status(400).json({ message: 'No climate data available for this region. Please sync climate data first.' });
    }

    const sysConfig = await Config.findOne().sort({ updatedAt: -1 });
    const weights = sysConfig?.weights;
    const thresholds = sysConfig?.thresholds;

    const evalResult = evaluateRisk(climate, weights, thresholds, region.type);

    const assessment = await Assessment.create({
      regionId: region._id,
      createdBy: req.user._id,
      scores: evalResult.scores,
      riskLevel: evalResult.riskLevel,
      hazardDetails: evalResult.hazardDetails,
      recommendations: evalResult.recommendations,
      isSimulation: false
    });

    // Auto alert trigger
    const alertThreshold = thresholds?.highRiskAlertThreshold || 55;
    if (evalResult.scores.composite >= alertThreshold) {
      await Alert.create({
        regionId: region._id,
        assessmentId: assessment._id,
        hazardType: 'Composite',
        riskScore: evalResult.scores.composite,
        riskLevel: evalResult.riskLevel,
        message: `High Climate Risk Alert: ${region.name} assessed with ${evalResult.riskLevel} risk (${evalResult.scores.composite}/100).`,
        status: 'new'
      });
    }

    const populatedAssessment = await Assessment.findById(assessment._id)
      .populate('regionId', 'name type lat lng population')
      .populate('createdBy', 'name email role');

    res.status(201).json(populatedAssessment);
  } catch (error) {
    next(error);
  }
};

// @desc    Compare two region assessments side-by-side
// @route   POST /api/assessments/compare
// @access  Private
const compareRegions = async (req, res, next) => {
  try {
    const { regionId1, regionId2 } = req.body;
    if (!regionId1 || !regionId2) {
      return res.status(400).json({ message: 'Both regionId1 and regionId2 are required for comparison' });
    }

    const [assessment1, assessment2] = await Promise.all([
      Assessment.findOne({ regionId: regionId1 }).populate('regionId').sort({ createdAt: -1 }),
      Assessment.findOne({ regionId: regionId2 }).populate('regionId').sort({ createdAt: -1 })
    ]);

    if (!assessment1 || !assessment2) {
      return res.status(404).json({ message: 'One or both regions do not have completed assessments for comparison' });
    }

    res.json({
      region1: assessment1,
      region2: assessment2,
      difference: {
        composite: Number((assessment1.scores.composite - assessment2.scores.composite).toFixed(1)),
        drought: Number((assessment1.scores.drought - assessment2.scores.drought).toFixed(1)),
        heatwave: Number((assessment1.scores.heatwave - assessment2.scores.heatwave).toFixed(1)),
        storm: Number((assessment1.scores.storm - assessment2.scores.storm).toFixed(1)),
        flood: Number((assessment1.scores.flood - assessment2.scores.flood).toFixed(1))
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Run Scenario Simulation live recomputation
// @route   POST /api/assessments/simulate
// @access  Private
const simulateScenario = async (req, res, next) => {
  try {
    const { regionId, tempOffsetC = 0, precipDeltaPct = 0, windOffsetKmH = 0 } = req.body;
    if (!regionId) {
      return res.status(400).json({ message: 'regionId is required' });
    }

    const region = await Region.findById(regionId);
    if (!region) {
      return res.status(404).json({ message: 'Region not found' });
    }

    let climateDoc = await ClimateData.findOne({ regionId: region._id }).sort({ fetchedAt: -1 });
    if (!climateDoc) {
      return res.status(404).json({ message: 'No climate data found for this region' });
    }

    // Clone climate data and apply offsets
    const simulatedClimate = JSON.parse(JSON.stringify(climateDoc));
    
    // Apply temperature offset (+°C)
    simulatedClimate.temperature.max += Number(tempOffsetC);
    simulatedClimate.temperature.current += Number(tempOffsetC);
    if (tempOffsetC > 0) {
      simulatedClimate.temperature.daysAbove35C += Math.floor(Number(tempOffsetC) * 1.5);
    }

    // Apply precipitation delta % (- % reduces rain and increases drought deficit)
    const precipFactor = (100 - Number(precipDeltaPct)) / 100;
    simulatedClimate.precipitation.sum30d = Number((simulatedClimate.precipitation.sum30d * precipFactor).toFixed(1));
    simulatedClimate.precipitation.maxDaily = Number((simulatedClimate.precipitation.maxDaily * precipFactor).toFixed(1));
    simulatedClimate.precipitation.deficitPct = Math.min(100, Math.max(0, Number((simulatedClimate.precipitation.deficitPct + Number(precipDeltaPct)).toFixed(1))));
    if (precipDeltaPct > 0) {
      simulatedClimate.precipitation.consecutiveDryDays += Math.floor(Number(precipDeltaPct) / 5);
      simulatedClimate.soilMoisture.deficitPct = Math.min(100, Number((simulatedClimate.soilMoisture.deficitPct + (Number(precipDeltaPct) * 0.8)).toFixed(1)));
    }

    // Apply wind speed offset (+ km/h)
    simulatedClimate.wind.max30d += Number(windOffsetKmH);

    const sysConfig = await Config.findOne().sort({ updatedAt: -1 });
    const weights = sysConfig?.weights;
    const thresholds = sysConfig?.thresholds;

    const evalResult = evaluateRisk(simulatedClimate, weights, thresholds, region.type);

    // Get baseline evaluation for clear comparison
    const baselineEval = evaluateRisk(climateDoc, weights, thresholds, region.type);

    res.json({
      region: { id: region._id, name: region.name, type: region.type },
      simulatedParams: { tempOffsetC, precipDeltaPct, windOffsetKmH },
      baseline: baselineEval,
      simulated: evalResult,
      deltas: {
        composite: Number((evalResult.scores.composite - baselineEval.scores.composite).toFixed(1)),
        drought: Number((evalResult.scores.drought - baselineEval.scores.drought).toFixed(1)),
        heatwave: Number((evalResult.scores.heatwave - baselineEval.scores.heatwave).toFixed(1)),
        storm: Number((evalResult.scores.storm - baselineEval.scores.storm).toFixed(1)),
        flood: Number((evalResult.scores.flood - baselineEval.scores.flood).toFixed(1))
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAssessments,
  getAssessmentById,
  createAssessment,
  compareRegions,
  simulateScenario
};
