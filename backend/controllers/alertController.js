const Alert = require('../models/Alert');

// @desc    Get all alerts with optional status filter
// @route   GET /api/alerts
// @access  Private
const getAlerts = async (req, res, next) => {
  try {
    const { status, regionId } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (regionId) filter.regionId = regionId;

    const alerts = await Alert.find(filter)
      .populate('regionId', 'name type lat lng')
      .populate('assessmentId', 'scores riskLevel')
      .sort({ createdAt: -1 });

    res.json(alerts);
  } catch (error) {
    next(error);
  }
};

// @desc    Update alert status (new -> acknowledged -> resolved)
// @route   PATCH /api/alerts/:id/status
// @access  Private (Admin, Analyst)
const updateAlertStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!status || !['new', 'acknowledged', 'resolved'].includes(status)) {
      return res.status(400).json({ message: 'Valid status required: new, acknowledged, or resolved' });
    }

    const alert = await Alert.findById(req.params.id);
    if (!alert) {
      return res.status(404).json({ message: 'Alert not found' });
    }

    alert.status = status;
    await alert.save();

    const updatedAlert = await Alert.findById(alert._id)
      .populate('regionId', 'name type lat lng')
      .populate('assessmentId', 'scores riskLevel');

    res.json(updatedAlert);
  } catch (error) {
    next(error);
  }
};

module.exports = { getAlerts, updateAlertStatus };
