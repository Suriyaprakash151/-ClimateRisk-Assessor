const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const User = require('./models/User');
const Region = require('./models/Region');
const ClimateData = require('./models/ClimateData');
const Assessment = require('./models/Assessment');
const Alert = require('./models/Alert');
const Config = require('./models/Config');
const defaultWeights = require('./config/defaultWeights');
const { fetchOpenMeteoData } = require('./services/openMeteoService');
const { evaluateRisk } = require('./services/riskEngine');

const seedData = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/climaterisk_db';
    console.log(`[Seed Script] Connecting to MongoDB at ${mongoUri}...`);
    await mongoose.connect(mongoUri);

    console.log('[Seed Script] Clearing old data...');
    await Promise.all([
      User.deleteMany({}),
      Region.deleteMany({}),
      ClimateData.deleteMany({}),
      Assessment.deleteMany({}),
      Alert.deleteMany({}),
      Config.deleteMany({})
    ]);

    console.log('[Seed Script] Creating system default configuration...');
    const config = await Config.create({
      weights: defaultWeights.weights,
      thresholds: defaultWeights.thresholds
    });

    console.log('[Seed Script] Creating users...');
    const salt = await bcrypt.genSalt(10);
    const adminPassword = await bcrypt.hash('Admin@123', salt);
    const analystPassword = await bcrypt.hash('Analyst@123', salt);
    const viewerPassword = await bcrypt.hash('Viewer@123', salt);

    const adminUser = await User.create({
      name: 'Global Administrator',
      email: 'admin@test.com',
      password: adminPassword,
      role: 'Admin'
    });

    const analystUser = await User.create({
      name: 'Senior Climate Analyst',
      email: 'analyst@test.com',
      password: analystPassword,
      role: 'Analyst'
    });

    const viewerUser = await User.create({
      name: 'Public Stakeholder',
      email: 'viewer@test.com',
      password: viewerPassword,
      role: 'Viewer'
    });

    console.log('[Seed Script] Seeding default regions: Chennai, Mumbai, Delhi, Rajasthan...');
    const sampleRegions = [
      {
        name: 'Chennai',
        type: 'City',
        lat: 13.0827,
        lng: 80.2707,
        population: 11000000,
        areaSqKm: 426,
        notes: 'Coastal major metropolitan hub vulnerable to cyclone storm surges, urban flooding, and acute summer heat.'
      },
      {
        name: 'Mumbai',
        type: 'Industrial Site',
        lat: 19.0760,
        lng: 72.8777,
        population: 20000000,
        areaSqKm: 603,
        notes: 'Key industrial manufacturing & financial port corridor subject to heavy monsoon flooding and sea level rise.'
      },
      {
        name: 'Delhi',
        type: 'District',
        lat: 28.6139,
        lng: 77.2090,
        population: 30000000,
        areaSqKm: 1484,
        notes: 'National capital territory facing extreme heatwave events (>45°C) and severe water table depletion.'
      },
      {
        name: 'Rajasthan',
        type: 'Farmland',
        lat: 26.9124,
        lng: 75.7873,
        population: 68000008,
        areaSqKm: 342239,
        notes: 'Arid agricultural expanse experiencing severe drought deficit, extreme soil moisture loss, and crop failure.'
      }
    ];

    for (const regData of sampleRegions) {
      console.log(`[Seed Script] Processing region: ${regData.name}...`);
      const region = await Region.create({
        ...regData,
        createdBy: adminUser._id
      });

      // Fetch or generate climate profile
      const openMeteoData = await fetchOpenMeteoData(region.lat, region.lng);
      const climateDoc = await ClimateData.create({
        regionId: region._id,
        ...openMeteoData
      });

      // Evaluate initial risk
      const evalResult = evaluateRisk(climateDoc, config.weights, config.thresholds, region.type);

      const assessment = await Assessment.create({
        regionId: region._id,
        createdBy: analystUser._id,
        scores: evalResult.scores,
        riskLevel: evalResult.riskLevel,
        hazardDetails: evalResult.hazardDetails,
        recommendations: evalResult.recommendations,
        isSimulation: false
      });

      // Create initial alert if score >= 55
      if (evalResult.scores.composite >= 55) {
        await Alert.create({
          regionId: region._id,
          assessmentId: assessment._id,
          hazardType: 'Composite',
          riskScore: evalResult.scores.composite,
          riskLevel: evalResult.riskLevel,
          message: `CRITICAL ALERT: ${region.name} exhibits ${evalResult.riskLevel} risk level (${evalResult.scores.composite}/100) based on recent meteorological telemetry.`,
          status: 'new'
        });
      }
    }

    console.log('\n=============================================================');
    console.log(' SEED COMPLETED SUCCESSFULLY!');
    console.log(' Created Users:');
    console.log(' - Admin:   admin@test.com / Admin@123');
    console.log(' - Analyst: analyst@test.com / Analyst@123');
    console.log(' - Viewer:  viewer@test.com / Viewer@123');
    console.log(' Created Regions: Chennai, Mumbai, Delhi, Rajasthan');
    console.log('=============================================================\n');

    process.exit(0);
  } catch (error) {
    console.error('[Seed Error]:', error);
    process.exit(1);
  }
};

seedData();
