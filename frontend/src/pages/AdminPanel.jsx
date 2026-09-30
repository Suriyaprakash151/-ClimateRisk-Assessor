import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Toast from '../components/common/Toast';
import API from '../services/api';
import { ShieldCheck, Users, Sliders, Save, CheckCircle2, Server } from 'lucide-react';

const AdminPanel = () => {
  const [users, setUsers] = useState([]);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  // Form states for config (Default weights 0.25 each)
  const [weights, setWeights] = useState({
    drought: 0.25,
    heatwave: 0.25,
    storm: 0.25,
    flood: 0.25
  });

  const [thresholds, setThresholds] = useState({
    heatwaveTempC: 35,
    droughtDryDays: 14,
    stormWindKmH: 60,
    floodPrecipMm: 50,
    highRiskAlertThreshold: 50
  });

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [uRes, cRes] = await Promise.all([
        API.get('/admin/users'),
        API.get('/admin/config')
      ]);
      setUsers(uRes.data);
      setConfig(cRes.data);
      if (cRes.data?.weights) setWeights(cRes.data.weights);
      if (cRes.data?.thresholds) setThresholds(cRes.data.thresholds);
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Failed to load admin controls', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await API.put(`/admin/users/${userId}/role`, { role: newRole });
      setToast({ message: 'User role updated successfully', type: 'success' });
      fetchAdminData();
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Role update failed', type: 'error' });
    }
  };

  const handleSaveConfig = async (e) => {
    e.preventDefault();
    const sum = Number((Number(weights.drought) + Number(weights.heatwave) + Number(weights.storm) + Number(weights.flood)).toFixed(2));
    if (Math.abs(sum - 1.0) > 0.01) {
      setToast({ message: `Hazard weights must sum exactly to 1.00 (100%). Current sum: ${sum}`, type: 'error' });
      return;
    }

    setSaving(true);
    try {
      await API.put('/admin/config', {
        weights: {
          drought: Number(weights.drought),
          heatwave: Number(weights.heatwave),
          storm: Number(weights.storm),
          flood: Number(weights.flood)
        },
        thresholds: {
          heatwaveTempC: Number(thresholds.heatwaveTempC),
          droughtDryDays: Number(thresholds.droughtDryDays),
          stormWindKmH: Number(thresholds.stormWindKmH),
          floodPrecipMm: Number(thresholds.floodPrecipMm),
          highRiskAlertThreshold: Number(thresholds.highRiskAlertThreshold)
        }
      });
      setToast({ message: 'Risk Engine configuration updated successfully!', type: 'success' });
      fetchAdminData();
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Config save failed', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout title="Administration Panel">
        <LoadingSpinner label="Loading admin settings and user directory..." />
      </Layout>
    );
  }

  const currentWeightsSum = Number((Number(weights.drought) + Number(weights.heatwave) + Number(weights.storm) + Number(weights.flood)).toFixed(2));

  return (
    <Layout title="Administration Panel">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risk Engine Weights & Threshold Config */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
          <div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-xs uppercase tracking-wider flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-600" />
              Risk Configuration & Weights
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Configure hazard weighting coefficients (must total 1.00 / 100%) and system alert thresholds.
            </p>
          </div>

          <form onSubmit={handleSaveConfig} className="space-y-4">
            <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                <span>Hazard Weights (Sum: {currentWeightsSum})</span>
                {Math.abs(currentWeightsSum - 1.0) <= 0.01 ? (
                  <span className="text-emerald-600 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Valid (1.00)</span>
                ) : (
                  <span className="text-red-600 font-bold">Must equal 1.00</span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-500 mb-1">Drought Weight (Default: 0.25)</label>
                  <input
                    type="number"
                    step="0.05"
                    min="0"
                    max="1"
                    value={weights.drought}
                    onChange={(e) => setWeights({ ...weights, drought: e.target.value })}
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Heatwave Weight (Default: 0.25)</label>
                  <input
                    type="number"
                    step="0.05"
                    min="0"
                    max="1"
                    value={weights.heatwave}
                    onChange={(e) => setWeights({ ...weights, heatwave: e.target.value })}
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Storm Weight (Default: 0.25)</label>
                  <input
                    type="number"
                    step="0.05"
                    min="0"
                    max="1"
                    value={weights.storm}
                    onChange={(e) => setWeights({ ...weights, storm: e.target.value })}
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Flood Weight (Default: 0.25)</label>
                  <input
                    type="number"
                    step="0.05"
                    min="0"
                    max="1"
                    value={weights.flood}
                    onChange={(e) => setWeights({ ...weights, flood: e.target.value })}
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">System Alert & Indicator Cutoffs</span>
              
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-500 mb-1">Heatwave Temp (°C)</label>
                  <input
                    type="number"
                    value={thresholds.heatwaveTempC}
                    onChange={(e) => setThresholds({ ...thresholds, heatwaveTempC: e.target.value })}
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Drought Dry Days</label>
                  <input
                    type="number"
                    value={thresholds.droughtDryDays}
                    onChange={(e) => setThresholds({ ...thresholds, droughtDryDays: e.target.value })}
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Storm Wind (km/h)</label>
                  <input
                    type="number"
                    value={thresholds.stormWindKmH}
                    onChange={(e) => setThresholds({ ...thresholds, stormWindKmH: e.target.value })}
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">High Risk Alert Score</label>
                  <input
                    type="number"
                    value={thresholds.highRiskAlertThreshold}
                    onChange={(e) => setThresholds({ ...thresholds, highRiskAlertThreshold: e.target.value })}
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded font-mono"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white rounded text-xs font-semibold flex items-center justify-center gap-2 shadow-sm"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Updating Parameters...' : 'Save Risk Parameters'}
            </button>
          </form>
        </div>

        {/* User RBAC Directory & System Info */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 p-5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm space-y-3">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-xs uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-600" />
              User Directory & Role Authorization
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-900/60 uppercase text-[10px] font-semibold tracking-wider text-slate-500 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="p-2.5">User</th>
                    <th className="p-2.5">Email</th>
                    <th className="p-2.5">Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                  {users.map((u) => (
                    <tr key={u._id}>
                      <td className="p-2.5 font-bold text-slate-900 dark:text-slate-100">{u.name}</td>
                      <td className="p-2.5 font-mono text-[11px] text-slate-500">{u.email}</td>
                      <td className="p-2.5">
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u._id, e.target.value)}
                          className="px-2 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-xs font-medium"
                        >
                          <option value="Admin">Admin</option>
                          <option value="Analyst">Analyst</option>
                          <option value="Viewer">Viewer</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* System Information Panel */}
          <div className="bg-white dark:bg-slate-800 p-5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm space-y-2 text-xs">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-xs uppercase tracking-wider flex items-center gap-2">
              <Server className="w-4 h-4 text-slate-600" /> System Information
            </h3>
            <div className="grid grid-cols-2 gap-2 text-slate-600 dark:text-slate-400 font-mono text-[11px] pt-1 border-t border-slate-200 dark:border-slate-700">
              <div>Environment: <strong>Development / Node v24</strong></div>
              <div>Database: <strong>MongoDB Local</strong></div>
              <div>Telemetry Refresh: <strong>Every 6 Hours (node-cron)</strong></div>
              <div>Model: <strong>Deterministic Rule Engine</strong></div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AdminPanel;
