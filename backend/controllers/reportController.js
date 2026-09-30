const Assessment = require('../models/Assessment');

// @desc    Export assessment report history in CSV format
// @route   GET /api/reports/csv
// @access  Private
const exportCSV = async (req, res, next) => {
  try {
    const assessments = await Assessment.find()
      .populate('regionId', 'name type population')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    const headers = [
      'Assessment ID',
      'Region Name',
      'Region Type',
      'Population',
      'Risk Level',
      'Composite Score',
      'Drought Score',
      'Heatwave Score',
      'Storm Score',
      'Flood Score',
      'Assessed By',
      'Created Date'
    ];

    const rows = assessments.map(a => [
      `"${a._id}"`,
      `"${a.regionId?.name || 'N/A'}"`,
      `"${a.regionId?.type || 'N/A'}"`,
      a.regionId?.population || 0,
      `"${a.riskLevel}"`,
      a.scores?.composite || 0,
      a.scores?.drought || 0,
      a.scores?.heatwave || 0,
      a.scores?.storm || 0,
      a.scores?.flood || 0,
      `"${a.createdBy?.name || 'System'}"`,
      `"${new Date(a.createdAt).toISOString()}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="ClimateRisk_Assessments_Report.csv"');
    res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
};

// @desc    Get structured report summary payload for frontend PDF generator
// @route   GET /api/reports/summary
// @access  Private
const getReportSummary = async (req, res, next) => {
  try {
    const assessments = await Assessment.find()
      .populate('regionId', 'name type population lat lng')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    const stats = {
      totalAssessments: assessments.length,
      highRiskCount: assessments.filter(a => ['High', 'Severe'].includes(a.riskLevel)).length,
      moderateRiskCount: assessments.filter(a => a.riskLevel === 'Moderate').length,
      lowRiskCount: assessments.filter(a => a.riskLevel === 'Low').length,
      averageCompositeScore: assessments.length > 0 
        ? Number((assessments.reduce((acc, curr) => acc + (curr.scores?.composite || 0), 0) / assessments.length).toFixed(1))
        : 0
    };

    res.json({
      generatedAt: new Date().toISOString(),
      stats,
      assessments
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { exportCSV, getReportSummary };
