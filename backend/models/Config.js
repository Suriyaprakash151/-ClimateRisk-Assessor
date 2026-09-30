const mongoose = require('mongoose');

const configSchema = new mongoose.Schema({
  weights: {
    drought: { type: Number, default: 0.30 },
    heatwave: { type: Number, default: 0.25 },
    storm: { type: Number, default: 0.25 },
    flood: { type: Number, default: 0.20 }
  },
  thresholds: {
    heatwaveTempC: { type: Number, default: 35 },
    droughtDryDays: { type: Number, default: 14 },
    stormWindKmH: { type: Number, default: 60 },
    floodPrecipMm: { type: Number, default: 50 },
    highRiskAlertThreshold: { type: Number, default: 55 }
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

module.exports = mongoose.model('Config', configSchema);
