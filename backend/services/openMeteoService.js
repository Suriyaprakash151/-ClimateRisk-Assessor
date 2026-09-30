const axios = require('axios');

/**
 * Fetch Open-Meteo weather data (current + 14 days past + 7 days forecast)
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 */
const fetchOpenMeteoData = async (lat, lng) => {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,soil_moisture_0_to_7cm&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max&past_days=14&forecast_days=7&timezone=auto`;
    
    console.log(`[Open-Meteo Service] Fetching data for coordinates: (${lat}, ${lng})`);
    const response = await axios.get(url, { timeout: 8000 });
    const data = response.data;

    const currentTemp = data.current?.temperature_2m ?? 28;
    const currentPrecip = data.current?.precipitation ?? 0;
    const currentWind = data.current?.wind_speed_10m ?? 15;
    const currentSoil = data.current?.soil_moisture_0_to_7cm ?? 0.22;

    const daily = data.daily || {};
    const tempMaxArr = daily.temperature_2m_max || [];
    const tempMinArr = daily.temperature_2m_min || [];
    const precipSumArr = daily.precipitation_sum || [];
    const windSpeedMaxArr = daily.wind_speed_10m_max || [];
    const timeArr = daily.time || [];

    const daysAbove35C = tempMaxArr.filter(t => t >= 35).length;
    const maxTemp = tempMaxArr.length > 0 ? Math.max(...tempMaxArr) : currentTemp;
    const minTemp = tempMinArr.length > 0 ? Math.min(...tempMinArr) : currentTemp - 8;
    const avg30dTemp = tempMaxArr.length > 0 ? (tempMaxArr.reduce((a, b) => a + b, 0) / tempMaxArr.length) : currentTemp;
    
    const sumPrecip = precipSumArr.reduce((a, b) => a + (b || 0), 0);
    const maxDailyPrecip = precipSumArr.length > 0 ? Math.max(...precipSumArr) : currentPrecip;
    
    // Calculate consecutive dry days (< 1.0mm)
    let maxDry = 0;
    let currentDry = 0;
    precipSumArr.forEach(p => {
      if ((p || 0) < 1.0) {
        currentDry++;
        if (currentDry > maxDry) maxDry = currentDry;
      } else {
        currentDry = 0;
      }
    });

    const maxWind30d = windSpeedMaxArr.length > 0 ? Math.max(...windSpeedMaxArr) : currentWind;

    // Build history objects
    const dailyHistory = timeArr.map((date, idx) => ({
      date,
      tempMax: tempMaxArr[idx] ?? currentTemp,
      tempMin: tempMinArr[idx] ?? (currentTemp - 5),
      precipSum: precipSumArr[idx] ?? 0,
      windSpeedMax: windSpeedMaxArr[idx] ?? currentWind
    }));

    return {
      temperature: {
        current: Number(currentTemp.toFixed(1)),
        max: Number(maxTemp.toFixed(1)),
        min: Number(minTemp.toFixed(1)),
        avg30d: Number(avg30dTemp.toFixed(1)),
        daysAbove35C
      },
      precipitation: {
        current: Number(currentPrecip.toFixed(1)),
        sum30d: Number(sumPrecip.toFixed(1)),
        maxDaily: Number(maxDailyPrecip.toFixed(1)),
        consecutiveDryDays: maxDry,
        deficitPct: Math.max(0, Math.min(100, Number(((100 - sumPrecip) / 100 * 100).toFixed(1))))
      },
      wind: {
        current: Number(currentWind.toFixed(1)),
        max30d: Number(maxWind30d.toFixed(1))
      },
      soilMoisture: {
        current: Number(currentSoil.toFixed(2)),
        deficitPct: Math.max(0, Math.min(100, Number(((0.45 - currentSoil) / 0.45 * 100).toFixed(1))))
      },
      dailyHistory,
      source: 'Open-Meteo API'
    };
  } catch (error) {
    console.warn(`[Open-Meteo Service Warning] API call failed: ${error.message}. Generating mock baseline climate profile for coordinates (${lat}, ${lng}).`);
    
    // Fallback baseline realistic generator
    const baseTemp = 25 + (Math.sin(lat) * 5);
    const basePrecip = Math.max(0, 50 + (Math.cos(lng) * 40));
    
    const mockHistory = [];
    const today = new Date();
    for (let i = 20; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayTempMax = Number((baseTemp + (Math.sin(i) * 6)).toFixed(1));
      const dayTempMin = Number((dayTempMax - 7 - (Math.cos(i) * 2)).toFixed(1));
      const dayPrecip = Number(Math.max(0, (Math.sin(i * 1.5) * 25)).toFixed(1));
      const dayWind = Number((12 + (Math.cos(i) * 15)).toFixed(1));
      mockHistory.push({
        date: dateStr,
        tempMax: dayTempMax,
        tempMin: dayTempMin,
        precipSum: dayPrecip,
        windSpeedMax: dayWind
      });
    }

    const tempMaxArr = mockHistory.map(h => h.tempMax);
    const precipArr = mockHistory.map(h => h.precipSum);
    const windArr = mockHistory.map(h => h.windSpeedMax);

    return {
      temperature: {
        current: Number(baseTemp.toFixed(1)),
        max: Math.max(...tempMaxArr),
        min: Math.min(...mockHistory.map(h => h.tempMin)),
        avg30d: Number(baseTemp.toFixed(1)),
        daysAbove35C: tempMaxArr.filter(t => t >= 35).length
      },
      precipitation: {
        current: 0,
        sum30d: Number(precipArr.reduce((a, b) => a + b, 0).toFixed(1)),
        maxDaily: Math.max(...precipArr),
        consecutiveDryDays: 8,
        deficitPct: 35
      },
      wind: {
        current: 15,
        max30d: Math.max(...windArr)
      },
      soilMoisture: {
        current: 0.20,
        deficitPct: 45
      },
      dailyHistory: mockHistory,
      source: 'Simulated Fallback'
    };
  }
};

module.exports = { fetchOpenMeteoData };
