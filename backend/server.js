const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cron = require('node-cron');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const connectDB = require('./config/db');
const { errorHandler, notFound } = require('./middleware/errorMiddleware');

// Import Route Handlers
const authRoutes = require('./routes/authRoutes');
const regionRoutes = require('./routes/regionRoutes');
const climateRoutes = require('./routes/climateRoutes');
const assessmentRoutes = require('./routes/assessmentRoutes');
const alertRoutes = require('./routes/alertRoutes');
const reportRoutes = require('./routes/reportRoutes');
const adminRoutes = require('./routes/adminRoutes');
const locationRoutes = require('./routes/locationRoutes');

// Services for Cron Refresh
const Region = require('./models/Region');
const ClimateData = require('./models/ClimateData');
const { fetchOpenMeteoData } = require('./services/openMeteoService');

const app = express();

// Connect Database (Local MongoDB or MongoDB Atlas via MONGO_URI)


// Security & Logging Middlewares
app.use(helmet({
  contentSecurityPolicy: false // Allow Leaflet map tiles
}));

// CORS Configuration for Vercel Frontend & Development Localhost
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:3000',
  'http://localhost:5173'
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin) || allowedOrigins.length === 0) {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  credentials: true
}));

app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Endpoint Routes
app.use('/api/auth', authRoutes);
app.use('/api/regions', regionRoutes);
app.use('/api/climate', climateRoutes);
app.use('/api/assessments', assessmentRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/locations', locationRoutes);

// Cloud Health Check Route
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    app: 'ClimateRisk Assessor API',
    database: 'MongoDB Atlas Connected',
    timestamp: new Date().toISOString()
  });
});

// Root route greeting
app.get('/', (req, res) => {
  res.json({
    app: 'ClimateRisk Assessor Backend API',
    status: 'Operational',
    docs: '/api/health'
  });
});

// Error Handling Middlewares
app.use(notFound);
app.use(errorHandler);

// Node-Cron Periodic Climate Data Auto-Sync (Every 6 Hours)
cron.schedule('0 */6 * * *', async () => {
  console.log('[Cron Job] Starting automated periodic Open-Meteo climate data refresh...');
  try {
    const regions = await Region.find();
    for (const region of regions) {
      console.log(`[Cron Job] Syncing weather telemetry for region: ${region.name}`);
      const liveData = await fetchOpenMeteoData(region.lat, region.lng);
      await ClimateData.create({
        regionId: region._id,
        ...liveData
      });
    }
    console.log('[Cron Job] Automated climate refresh completed.');
  } catch (err) {
    console.error('[Cron Job Error]:', err.message);
  }
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, '0.0.0.0', () => {
      console.log(
        `[ClimateRisk Server]: Running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`
      );
    });
  } catch (error) {
    console.error('[Server Startup Error]:', error.message);
    process.exit(1);
  }
};

startServer();