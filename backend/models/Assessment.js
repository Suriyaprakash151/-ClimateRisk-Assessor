const mongoose = require('mongoose');

const assessmentSchema = new mongoose.Schema({
  regionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Region',
    required: true,
    index: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  scores: {
    drought: { type: Number, required: true },
    heatwave: { type: Number, required: true },
    storm: { type: Number, required: true },
    flood: { type: Number, required: true },
    composite: { type: Number, required: true }
  },
  riskLevel: {
    type: String,
    enum: ['Low', 'Moderate', 'High', 'Severe'],
    required: true
  },
  hazardDetails: {
    drought: { level: String, score: Number, metrics: mongoose.Schema.Types.Mixed },
    heatwave: { level: String, score: Number, metrics: mongoose.Schema.Types.Mixed },
    storm: { level: String, score: Number, metrics: mongoose.Schema.Types.Mixed },
    flood: { level: String, score: Number, metrics: mongoose.Schema.Types.Mixed }
  },
  recommendations: [{ type: String }],
  simulatedParams: {
    tempOffsetC: { type: Number, default: 0 },
    precipDeltaPct: { type: Number, default: 0 },
    windOffsetKmH: { type: Number, default: 0 }
  },
  isSimulation: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model('Assessment', assessmentSchema);
