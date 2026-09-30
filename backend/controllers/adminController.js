const Config = require('../models/Config');
const User = require('../models/User');
const defaultWeights = require('../config/defaultWeights');

// @desc    Get global risk configuration (weights and thresholds)
// @route   GET /api/admin/config
// @access  Private
const getConfig = async (req, res, next) => {
  try {
    let config = await Config.findOne().sort({ updatedAt: -1 });
    if (!config) {
      config = await Config.create({
        weights: defaultWeights.weights,
        thresholds: defaultWeights.thresholds,
        updatedBy: req.user._id
      });
    }
    res.json(config);
  } catch (error) {
    next(error);
  }
};

// @desc    Update global risk configuration
// @route   PUT /api/admin/config
// @access  Private (Admin)
const updateConfig = async (req, res, next) => {
  try {
    const { weights, thresholds } = req.body;

    if (weights) {
      const sum = Number((weights.drought + weights.heatwave + weights.storm + weights.flood).toFixed(2));
      if (Math.abs(sum - 1.0) > 0.01) {
        return res.status(400).json({ message: `Hazard weights must sum to 1.00 (Current total: ${sum})` });
      }
    }

    let config = await Config.findOne().sort({ updatedAt: -1 });
    if (!config) {
      config = new Config();
    }

    if (weights) config.weights = weights;
    if (thresholds) config.thresholds = thresholds;
    config.updatedBy = req.user._id;

    const updatedConfig = await config.save();
    res.json({ message: 'Risk Engine configuration updated successfully', config: updatedConfig });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users list
// @route   GET /api/admin/users
// @access  Private (Admin)
const getUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    next(error);
  }
};

// @desc    Update user role
// @route   PUT /api/admin/users/:id/role
// @access  Private (Admin)
const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!role || !['Admin', 'Analyst', 'Viewer'].includes(role)) {
      return res.status(400).json({ message: 'Role must be Admin, Analyst, or Viewer' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.role = role;
    await user.save();

    res.json({ message: `User ${user.name} role updated to ${role}`, user: { _id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    next(error);
  }
};

module.exports = { getConfig, updateConfig, getUsers, updateUserRole };
