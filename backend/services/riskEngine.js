/**
 * Deterministic Climate Risk Assessment Engine
 * 
 * Scores: 0 - 100
 * Risk Levels:
 *   0 - 24  : Low
 *  25 - 49  : Moderate
 *  50 - 74  : High
 *  75 - 100 : Severe
 */

const getRiskLevel = (score) => {
  const rounded = Math.round(score);
  if (rounded < 25) return 'Low';
  if (rounded < 50) return 'Moderate';
  if (rounded < 75) return 'High';
  return 'Severe';
};

/**
 * Drought Risk = 0.40 * Rainfall Deficit + 0.30 * Soil Moisture Deficit + 0.30 * Consecutive Dry Days
 */
const calculateDroughtScore = (climateData) => {
  const precipDeficit = Math.min(100, Math.max(0, climateData.precipitation?.deficitPct || 20));
  const soilDeficit = Math.min(100, Math.max(0, climateData.soilMoisture?.deficitPct || 25));
  const dryDays = climateData.precipitation?.consecutiveDryDays || 5;

  const dryDaysScore = Math.min(100, dryDays * 4.0);

  const score = (0.40 * precipDeficit) + (0.30 * soilDeficit) + (0.30 * dryDaysScore);
  return {
    score: Math.min(100, Math.max(0, Number(score.toFixed(1)))),
    factors: {
      rainfallDeficitScore: Number(precipDeficit.toFixed(1)),
      soilMoistureDeficitScore: Number(soilDeficit.toFixed(1)),
      consecutiveDryDaysScore: Number(dryDaysScore.toFixed(1))
    }
  };
};

/**
 * Heatwave Risk = 0.60 * Temperature Exceedance + 0.40 * Heat Index Score
 */
const calculateHeatwaveScore = (climateData) => {
  const maxTemp = climateData.temperature?.max || 30;
  const daysAbove35 = climateData.temperature?.daysAbove35C || 0;

  const tempExceedanceScore = Math.min(100, Math.max(0, maxTemp - 30) * 7.14);
  const heatIndexScore = Math.min(100, daysAbove35 * 12.5);

  const score = (0.60 * tempExceedanceScore) + (0.40 * heatIndexScore);
  return {
    score: Math.min(100, Math.max(0, Number(score.toFixed(1)))),
    factors: {
      temperatureExceedanceScore: Number(tempExceedanceScore.toFixed(1)),
      heatIndexScore: Number(heatIndexScore.toFixed(1))
    }
  };
};

/**
 * Storm Risk = 0.60 * Max Wind Speed + 0.40 * Extreme Precipitation
 */
const calculateStormScore = (climateData) => {
  const maxWind = climateData.wind?.max30d || climateData.wind?.current || 15;
  const maxDailyPrecip = climateData.precipitation?.maxDaily || 10;

  const windScore = Math.min(100, (maxWind / 100) * 100);
  const extremePrecipScore = Math.min(100, (maxDailyPrecip / 80) * 100);

  const score = (0.60 * windScore) + (0.40 * extremePrecipScore);
  return {
    score: Math.min(100, Math.max(0, Number(score.toFixed(1)))),
    factors: {
      maxWindSpeedScore: Number(windScore.toFixed(1)),
      extremePrecipitationScore: Number(extremePrecipScore.toFixed(1))
    }
  };
};

/**
 * Flood Risk = 0.60 * Rainfall Intensity + 0.40 * Cumulative Precipitation
 */
const calculateFloodScore = (climateData) => {
  const maxDailyPrecip = climateData.precipitation?.maxDaily || 10;
  const sum30d = climateData.precipitation?.sum30d || 50;

  const intensityScore = Math.min(100, (maxDailyPrecip / 75) * 100);
  const accumPrecipScore = Math.min(100, (sum30d / 250) * 100);

  const score = (0.60 * intensityScore) + (0.40 * accumPrecipScore);
  return {
    score: Math.min(100, Math.max(0, Number(score.toFixed(1)))),
    factors: {
      rainfallIntensityScore: Number(intensityScore.toFixed(1)),
      cumulativePrecipitationScore: Number(accumPrecipScore.toFixed(1))
    }
  };
};

/**
 * Rule-Based Resilience Recommendations
 */
const generateRecommendations = (scores) => {
  const recommendations = [];

  if (scores.flood >= 50) {
    recommendations.push("Review drainage capacity and clear major stormwater canals.");
    recommendations.push("Identify flood-prone infrastructure and deploy automated barrier gates.");
    recommendations.push("Update municipal emergency flood response plans.");
    recommendations.push("Review urban stormwater management policies and detention basins.");
  }

  if (scores.drought >= 50) {
    recommendations.push("Review municipal water conservation plans and enforce usage caps.");
    recommendations.push("Increase rainwater harvesting infrastructure and groundwater recharge.");
    recommendations.push("Evaluate regional water availability and reservoir storage levels.");
    recommendations.push("Review agricultural irrigation efficiency and promote drip systems.");
  }

  if (scores.heatwave >= 50) {
    recommendations.push("Establish heat-health response procedures and public cooling centers.");
    recommendations.push("Review outdoor worker heat exposure guidelines and work schedule shifts.");
    recommendations.push("Increase urban shaded areas and mandate cool-roofing materials.");
    recommendations.push("Prepare public heat wave early warning alerts.");
  }

  if (scores.storm >= 50) {
    recommendations.push("Inspect vulnerable utility transmission infrastructure and structural trees.");
    recommendations.push("Review emergency storm preparedness procedures and evacuation routes.");
    recommendations.push("Secure exposed industrial equipment and high-rise construction sites.");
    recommendations.push("Review coastal and regional storm surge warning systems.");
  }

  if (recommendations.length === 0) {
    recommendations.push("Maintain routine climate risk monitoring and update annual emergency response protocols.");
    recommendations.push("Conduct periodic infrastructure integrity checks.");
  }

  return recommendations;
};

/**
 * Run Complete Risk Engine Evaluation
 */
const evaluateRisk = (climateData, weightsConfig = null, thresholdsConfig = null) => {
  const weights = weightsConfig || { drought: 0.25, heatwave: 0.25, storm: 0.25, flood: 0.25 };

  const droughtObj = calculateDroughtScore(climateData);
  const heatwaveObj = calculateHeatwaveScore(climateData);
  const stormObj = calculateStormScore(climateData);
  const floodObj = calculateFloodScore(climateData);

  const compositeScore = Number((
    (weights.drought * droughtObj.score) +
    (weights.heatwave * heatwaveObj.score) +
    (weights.storm * stormObj.score) +
    (weights.flood * floodObj.score)
  ).toFixed(1));

  const compositeLevel = getRiskLevel(compositeScore);

  const scores = {
    drought: droughtObj.score,
    heatwave: heatwaveObj.score,
    storm: stormObj.score,
    flood: floodObj.score,
    composite: compositeScore
  };

  const hazardDetails = {
    drought: {
      level: getRiskLevel(droughtObj.score),
      score: droughtObj.score,
      factors: droughtObj.factors,
      metrics: {
        deficitPct: climateData.precipitation?.deficitPct,
        consecutiveDryDays: climateData.precipitation?.consecutiveDryDays,
        soilMoisture: climateData.soilMoisture?.current
      }
    },
    heatwave: {
      level: getRiskLevel(heatwaveObj.score),
      score: heatwaveObj.score,
      factors: heatwaveObj.factors,
      metrics: {
        daysAbove35C: climateData.temperature?.daysAbove35C,
        maxTemp: climateData.temperature?.max
      }
    },
    storm: {
      level: getRiskLevel(stormObj.score),
      score: stormObj.score,
      factors: stormObj.factors,
      metrics: {
        maxWindSpeed: climateData.wind?.max30d,
        maxDailyPrecip: climateData.precipitation?.maxDaily
      }
    },
    flood: {
      level: getRiskLevel(floodObj.score),
      score: floodScore = floodObj.score,
      factors: floodObj.factors,
      metrics: {
        sum30dPrecip: climateData.precipitation?.sum30d,
        maxDailyPrecip: climateData.precipitation?.maxDaily
      }
    }
  };

  const recommendations = generateRecommendations(scores);

  return {
    scores,
    riskLevel: compositeLevel,
    hazardDetails,
    recommendations
  };
};

module.exports = {
  evaluateRisk,
  getRiskLevel,
  calculateDroughtScore,
  calculateHeatwaveScore,
  calculateStormScore,
  calculateFloodScore,
  generateRecommendations
};
