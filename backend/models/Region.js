const mongoose = require('mongoose');

const regionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Region name is required'],
    trim: true,
    unique: true
  },
  type: {
    type: String,
    enum: ['City', 'District', 'Industrial Site', 'Farmland'],
    default: 'City'
  },
  lat: {
    type: Number,
    required: [true, 'Latitude is required'],
    min: -90,
    max: 90
  },
  lng: {
    type: Number,
    required: [true, 'Longitude is required'],
    min: -180,
    max: 180
  },
  population: {
    type: Number,
    default: 0
  },
  areaSqKm: {
    type: Number,
    default: 100
  },
  notes: {
    type: String,
    default: ''
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

module.exports = mongoose.model('Region', regionSchema);
