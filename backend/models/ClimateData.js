const mongoose = require('mongoose');

const climateDataSchema = new mongoose.Schema({
  regionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Region',
    required: true,
    index: true
  },
  temperature: {
    current: { type: Number, default: 25 },
    max: { type: Number, default: 32 },
    min: { type: Number, default: 18 },
    avg30d: { type: Number, default: 28 },
    daysAbove35C: { type: Number, default: 0 }
  },
  precipitation: {
    current: { type: Number, default: 0 },
    sum30d: { type: Number, default: 50 },
    maxDaily: { type: Number, default: 15 },
    consecutiveDryDays: { type: Number, default: 5 },
    deficitPct: { type: Number, default: 10 }
  },
  wind: {
    current: { type: Number, default: 12 },
    max30d: { type: Number, default: 35 }
  },
  soilMoisture: {
    current: { type: Number, default: 0.25 },
    deficitPct: { type: Number, default: 20 }
  },
  dailyHistory: [{
    date: String,
    tempMax: Number,
    tempMin: Number,
    precipSum: Number,
    windSpeedMax: Number
  }],
  source: {
    type: String,
    enum: ['Open-Meteo API', 'Simulated Fallback'],
    default: 'Open-Meteo API'
  },
  fetchedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('ClimateData', climateDataSchema);
