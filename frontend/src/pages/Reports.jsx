import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import LoadingSpinner from '../components/common/LoadingSpinner';
import RiskBadge from '../components/common/RiskBadge';
import Toast from '../components/common/Toast';
import API from '../services/api';
import { Download, Printer, ArrowRightLeft, FileText, Search, Filter, Database } from 'lucide-react';

const Reports = () => {
  const [assessments, setAssessments] = useState([]);
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRiskFilter, setSelectedRiskFilter] = useState('all');

  // Region Comparison state
  const [regionId1, setRegionId1] = useState('');
  const [regionId2, setRegionId2] = useState('');
  const [comparison, setComparison] = useState(null);
  const [comparing, setComparing] = useState(false);

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const [assRes, regRes] = await Promise.all([
        API.get('/assessments'),
        API.get('/regions')
      ]);
      setAssessments(assRes.data);
      setRegions(regRes.data);

      if (regRes.data.length >= 2) {
        setRegionId1(regRes.data[0]._id);
        setRegionId2(regRes.data[1]._id);
      }
    } catch (err) {
      setToast({ message: 'Failed to fetch report audit history', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleCompare = async () => {
    if (!regionId1 || !regionId2) return;
    if (regionId1 === regionId2) {
      setToast({ message: 'Please select two different regions for comparison', type: 'warning' });
      return;
    }
    setComparing(true);
    try {
      const res = await API.post('/assessments/compare', { regionId1, regionId2 });
      setComparison(res.data);
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Comparison failed', type: 'error' });
    } finally {
      setComparing(false);
    }
  };

  const handleCSVExport = () => {
    window.open('/api/reports/csv', '_blank');
  };

  const handlePrintPDF = () => {
    window.print();
  };

  const filteredAssessments = assessments.filter((a) => {
    const regionName = a.regionId?.name || '';
    const matchesSearch = regionName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRisk = selectedRiskFilter === 'all' || a.riskLevel === selectedRiskFilter;
    return matchesSearch && matchesRisk;
  });

  if (loading) {
    return (
      <Layout title="Assessment Reports & Audit Logs">
        <LoadingSpinner label="Compiling report audit trail..." />
      </Layout>
    );
  }

  return (
    <Layout title="Assessment Reports & Audit Logs">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Top Export Toolbar */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div>
          <h3 className="font-bold text-slate-800 dark:text-slate-100 text-xs uppercase tracking-wider">Assessment Report Hub</h3>
          <p className="text-xs text-slate-500">Export audit trail datasets to CSV or print formatted executive PDF reports</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCSVExport}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold flex items-center gap-1.5 shadow-sm"
          >
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
          <button
            onClick={handlePrintPDF}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded text-xs font-semibold flex items-center gap-1.5 shadow-sm"
          >
            <Printer className="w-3.5 h-3.5" /> Print PDF Report
          </button>
        </div>
      </div>

      {/* Print PDF Cover Header (Visible ONLY during window.print()) */}
      <div className="hidden print:block mb-6 p-6 border-b border-slate-300 space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">ClimateRisk Assessor</h1>
            <p className="text-xs text-slate-600">Climate Risk Assessment & Resilience Planning System</p>
          </div>
          <span className="text-xs text-slate-500 font-mono">Generated: {new Date().toLocaleDateString()}</span>
        </div>
        <p className="text-xs text-slate-500 pt-2 border-t">
          Official Assessment Audit Report | Data Source: Open-Meteo API | Risk Model: Deterministic Rule-Based System
        </p>
      </div>

      {/* Region Comparative Analysis Section */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm space-y-4 print:border-none print:shadow-none">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 text-xs uppercase tracking-wider flex items-center gap-2">
            <ArrowRightLeft className="w-4 h-4 text-emerald-600" />
            Side-by-Side Region Comparison
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-3 print:hidden text-xs">
          <select
            value={regionId1}
            onChange={(e) => setRegionId1(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded font-medium"
          >
            {regions.map(r => (
              <option key={r._id} value={r._id}>{r.name} ({r.type})</option>
            ))}
          </select>

          <span className="font-bold text-slate-400">VS</span>

          <select
            value={regionId2}
            onChange={(e) => setRegionId2(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded font-medium"
          >
            {regions.map(r => (
              <option key={r._id} value={r._id}>{r.name} ({r.type})</option>
            ))}
          </select>

          <button
            onClick={handleCompare}
            disabled={comparing}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded text-xs font-semibold flex items-center gap-1"
          >
            Compare
          </button>
        </div>

        {comparison && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 text-xs">
            {/* Region 1 */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-900 dark:text-slate-100">{comparison.region1.regionId?.name}</h4>
                <RiskBadge level={comparison.region1.riskLevel} score={comparison.region1.scores?.composite} />
              </div>
              <div className="grid grid-cols-2 gap-1.5 font-mono pt-1">
                <div>Drought: <strong>{comparison.region1.scores?.drought}</strong></div>
                <div>Heatwave: <strong>{comparison.region1.scores?.heatwave}</strong></div>
                <div>Storm: <strong>{comparison.region1.scores?.storm}</strong></div>
                <div>Flood: <strong>{comparison.region1.scores?.flood}</strong></div>
              </div>
            </div>

            {/* Region 2 */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-900 dark:text-slate-100">{comparison.region2.regionId?.name}</h4>
                <RiskBadge level={comparison.region2.riskLevel} score={comparison.region2.scores?.composite} />
              </div>
              <div className="grid grid-cols-2 gap-1.5 font-mono pt-1">
                <div>Drought: <strong>{comparison.region2.scores?.drought}</strong></div>
                <div>Heatwave: <strong>{comparison.region2.scores?.heatwave}</strong></div>
                <div>Storm: <strong>{comparison.region2.scores?.storm}</strong></div>
                <div>Flood: <strong>{comparison.region2.scores?.flood}</strong></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filterable Assessment History Table */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden space-y-3">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3 text-xs">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-600" />
            Assessment Audit Log ({filteredAssessments.length})
          </h3>

          <div className="flex items-center gap-2 print:hidden">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search region..."
                className="pl-8 pr-3 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-xs"
              />
            </div>

            <select
              value={selectedRiskFilter}
              onChange={(e) => setSelectedRiskFilter(e.target.value)}
              className="px-2.5 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-xs font-medium"
            >
              <option value="all">All Risk Levels</option>
              <option value="Low">Low</option>
              <option value="Moderate">Moderate</option>
              <option value="High">High</option>
              <option value="Severe">Severe</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="p-3">Region</th>
                <th className="p-3">Type</th>
                <th className="p-3">Composite Risk</th>
                <th className="p-3">Drought</th>
                <th className="p-3">Heatwave</th>
                <th className="p-3">Storm</th>
                <th className="p-3">Flood</th>
                <th className="p-3">Assessed By</th>
                <th className="p-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 font-mono text-[11px]">
              {filteredAssessments.map((a) => (
                <tr key={a._id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/30 font-sans">
                  <td className="p-3 font-bold text-slate-900 dark:text-slate-100">{a.regionId?.name || 'N/A'}</td>
                  <td className="p-3">{a.regionId?.type || 'City'}</td>
                  <td className="p-3">
                    <RiskBadge level={a.riskLevel} score={a.scores?.composite} />
                  </td>
                  <td className="p-3 font-mono">{a.scores?.drought}</td>
                  <td className="p-3 font-mono">{a.scores?.heatwave}</td>
                  <td className="p-3 font-mono">{a.scores?.storm}</td>
                  <td className="p-3 font-mono">{a.scores?.flood}</td>
                  <td className="p-3">{a.createdBy?.name || 'System'}</td>
                  <td className="p-3 text-slate-400 font-mono">{new Date(a.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Data Attribution Footer */}
      <div className="p-4 bg-slate-100 dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <span><strong>Weather Data:</strong> Open-Meteo API</span>
          <span>•</span>
          <span><strong>Map Data:</strong> OpenStreetMap / Leaflet</span>
          <span>•</span>
          <span><strong>Risk Model:</strong> Deterministic Rule-Based System</span>
        </div>
        <span>ClimateRisk Assessor &copy; 2026</span>
      </div>
    </Layout>
  );
};

export default Reports;
