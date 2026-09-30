const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  regionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Region',
    required: true
  },
  assessmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assessment'
  },
  hazardType: {
    type: String,
    enum: ['Drought', 'Heatwave', 'Storm', 'Flood', 'Composite'],
    required: true
  },
  riskScore: {
    type: Number,
    required: true
  },
  riskLevel: {
    type: String,
    enum: ['Low', 'Moderate', 'High', 'Severe'],
    required: true
  },
  message: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['new', 'acknowledged', 'resolved'],
    default: 'new'
  }
}, { timestamps: true });

module.exports = mongoose.model('Alert', alertSchema);
