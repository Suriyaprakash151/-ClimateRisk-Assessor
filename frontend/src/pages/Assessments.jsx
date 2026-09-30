import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import LoadingSpinner from '../components/common/LoadingSpinner';
import RiskBadge from '../components/common/RiskBadge';
import Toast from '../components/common/Toast';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ClipboardCheck, Play, Calendar, Database, Info, Filter, ArrowRight } from 'lucide-react';

const Assessments = () => {
  const { user } = useAuth();
  const [assessments, setAssessments] = useState([]);
  const [regions, setRegions] = useState([]);
  const [selectedRegionId, setSelectedRegionId] = useState('all');
  const [selectedAssessment, setSelectedAssessment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [toast, setToast] = useState(null);

  const isEditable = user?.role === 'Admin' || user?.role === 'Analyst';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [assRes, regRes] = await Promise.all([
        API.get('/assessments'),
        API.get('/regions')
      ]);
      setAssessments(assRes.data);
      setRegions(regRes.data);
      if (assRes.data.length > 0) {
        setSelectedAssessment(assRes.data[0]);
      }
    } catch (err) {
      setToast({ message: 'Failed to fetch assessments log', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleRunAssessment = async (regionId) => {
    if (!regionId) return;
    setTriggering(true);
    try {
      const res = await API.post('/assessments', { regionId });
      setToast({ message: 'New telemetry assessment successfully generated!', type: 'success' });
      fetchData();
      setSelectedAssessment(res.data);
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Assessment trigger failed', type: 'error' });
    } finally {
      setTriggering(false);
    }
  };

  const filteredAssessments = assessments.filter(a => {
    if (selectedRegionId !== 'all' && String(a.regionId?._id || a.regionId) !== selectedRegionId) return false;
    return true;
  });

  if (loading) {
    return (
      <Layout title="Telemetry Risk Assessments">
        <LoadingSpinner label="Loading regional hazard evaluation logs..." />
      </Layout>
    );
  }

  return (
    <Layout title="Telemetry Risk Assessments">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Assessment Log List */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-2">
              <ClipboardCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Assessment History
            </h3>
            <select
              value={selectedRegionId}
              onChange={(e) => setSelectedRegionId(e.target.value)}
              className="px-2.5 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-xs font-medium"
            >
              <option value="all">All Regions</option>
              {regions.map(r => (
                <option key={r._id} value={r._id}>{r.name}</option>
              ))}
            </select>
          </div>

          {isEditable && (
            <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700 space-y-2">
              <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block uppercase">Run New Telemetry Evaluation</span>
              <div className="flex gap-2">
                <select
                  id="triggerRegionSelect"
                  className="flex-1 px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs font-medium"
                >
                  {regions.map(r => (
                    <option key={r._id} value={r._id}>{r.name} ({r.type})</option>
                  ))}
                </select>
                <button
                  onClick={() => {
                    const select = document.getElementById('triggerRegionSelect');
                    if (select) handleRunAssessment(select.value);
                  }}
                  disabled={triggering}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded text-xs font-semibold flex items-center gap-1 shrink-0"
                >
                  <Play className="w-3 h-3 fill-current" /> Run
                </button>
              </div>
            </div>
          )}

          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {filteredAssessments.map(a => (
              <div
                key={a._id}
                onClick={() => setSelectedAssessment(a)}
                className={`p-3 rounded border text-xs cursor-pointer transition-colors ${
                  selectedAssessment?._id === a._id
                    ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-slate-900 dark:text-slate-100">{a.regionId?.name}</span>
                  <RiskBadge level={a.riskLevel} score={a.scores?.composite} />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                  <span>{new Date(a.createdAt).toLocaleString()}</span>
                  <span>By: {a.createdBy?.name?.split(' ')[0] || 'System'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Detailed Assessment Scorecard & Contributing Factors */}
        <div className="lg:col-span-2 space-y-6">
          {selectedAssessment ? (
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
              {/* Header Info */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-700 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    {selectedAssessment.regionId?.name} Assessment Scorecard
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Region Type: <strong>{selectedAssessment.regionId?.type}</strong> | Coordinates: <strong>{selectedAssessment.regionId?.lat?.toFixed(2)}°, {selectedAssessment.regionId?.lng?.toFixed(2)}°</strong>
                  </p>
                </div>
                <div className="text-right">
                  <RiskBadge level={selectedAssessment.riskLevel} score={selectedAssessment.scores?.composite} />
                  <span className="text-[10px] text-slate-400 block mt-1 font-mono">
                    Assessed: {new Date(selectedAssessment.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Hazard Breakdown with Contributing Factor Indicators */}
              <div className="space-y-4">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Hazard Breakdown & Contributing Factor Analysis
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {/* Drought */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded border border-slate-200 dark:border-slate-700 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 dark:text-slate-200">Drought Hazard</span>
                      <span className="font-mono font-bold text-amber-600">{selectedAssessment.scores?.drought} / 100</span>
                    </div>
                    <div className="space-y-1 text-[11px] text-slate-600 dark:text-slate-400 border-t border-slate-200 dark:border-slate-700 pt-2">
                      <div className="flex justify-between">
                        <span>Precipitation Deficit:</span>
                        <span className="font-mono">{selectedAssessment.hazardDetails?.drought?.metrics?.deficitPct ?? '10'}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Consecutive Dry Days:</span>
                        <span className="font-mono">{selectedAssessment.hazardDetails?.drought?.metrics?.consecutiveDryDays ?? '5'} days</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Soil Moisture Level:</span>
                        <span className="font-mono">{selectedAssessment.hazardDetails?.drought?.metrics?.soilMoisture ?? '0.22'} m³/m³</span>
                      </div>
                    </div>
                  </div>

                  {/* Heatwave */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded border border-slate-200 dark:border-slate-700 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 dark:text-slate-200">Heatwave Hazard</span>
                      <span className="font-mono font-bold text-red-600">{selectedAssessment.scores?.heatwave} / 100</span>
                    </div>
                    <div className="space-y-1 text-[11px] text-slate-600 dark:text-slate-400 border-t border-slate-200 dark:border-slate-700 pt-2">
                      <div className="flex justify-between">
                        <span>Days &gt; 35°C Count:</span>
                        <span className="font-mono">{selectedAssessment.hazardDetails?.heatwave?.metrics?.daysAbove35C ?? '0'} days</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Max Recorded Temperature:</span>
                        <span className="font-mono">{selectedAssessment.hazardDetails?.heatwave?.metrics?.maxTemp ?? '32'}°C</span>
                      </div>
                    </div>
                  </div>

                  {/* Storm */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded border border-slate-200 dark:border-slate-700 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 dark:text-slate-200">Storm Hazard</span>
                      <span className="font-mono font-bold text-indigo-600">{selectedAssessment.scores?.storm} / 100</span>
                    </div>
                    <div className="space-y-1 text-[11px] text-slate-600 dark:text-slate-400 border-t border-slate-200 dark:border-slate-700 pt-2">
                      <div className="flex justify-between">
                        <span>Max Wind Speed:</span>
                        <span className="font-mono">{selectedAssessment.hazardDetails?.storm?.metrics?.maxWindSpeed ?? '15'} km/h</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Max 24h Rainfall:</span>
                        <span className="font-mono">{selectedAssessment.hazardDetails?.storm?.metrics?.maxDailyPrecip ?? '12'} mm</span>
                      </div>
                    </div>
                  </div>

                  {/* Flood */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded border border-slate-200 dark:border-slate-700 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 dark:text-slate-200">Flood Hazard</span>
                      <span className="font-mono font-bold text-cyan-600">{selectedAssessment.scores?.flood} / 100</span>
                    </div>
                    <div className="space-y-1 text-[11px] text-slate-600 dark:text-slate-400 border-t border-slate-200 dark:border-slate-700 pt-2">
                      <div className="flex justify-between">
                        <span>30-Day Cumulative Precip:</span>
                        <span className="font-mono">{selectedAssessment.hazardDetails?.flood?.metrics?.sum30dPrecip ?? '45'} mm</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Peak Daily Intensity:</span>
                        <span className="font-mono">{selectedAssessment.hazardDetails?.flood?.metrics?.maxDailyPrecip ?? '12'} mm/day</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actionable Resilience Recommendations */}
              <div className="space-y-3 border-t border-slate-200 dark:border-slate-700 pt-4">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Rule-Based Resilience Action Plan
                </h4>
                <ul className="space-y-2">
                  {selectedAssessment.recommendations?.map((rec, idx) => (
                    <li key={idx} className="text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2 bg-slate-50 dark:bg-slate-900/40 p-2.5 rounded border border-slate-200 dark:border-slate-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-1.5 shrink-0"></span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-800 p-12 rounded-lg text-center border border-slate-200 dark:border-slate-700">
              <p className="text-sm font-medium text-slate-500">Select an assessment from the left log to inspect scorecards.</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Assessments;
