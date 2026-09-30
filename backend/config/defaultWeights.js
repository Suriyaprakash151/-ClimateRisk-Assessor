// Default Risk Engine Configuration
module.exports = {
  weights: {
    drought: 0.25,
    heatwave: 0.25,
    storm: 0.25,
    flood: 0.25
  },
  thresholds: {
    heatwaveTempC: 35,       // Temperature threshold for heatwave count (°C)
    droughtDryDays: 14,      // Days threshold for drought alert
    stormWindKmH: 60,        // Wind speed threshold for storm alert (km/h)
    floodPrecipMm: 50,       // 24h precipitation threshold for flood alert (mm)
    highRiskAlertThreshold: 50 // Score >= 50 (High/Severe) triggers alert
  }
};
