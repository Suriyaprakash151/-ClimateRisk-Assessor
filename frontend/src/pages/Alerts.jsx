import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import LoadingSpinner from '../components/common/LoadingSpinner';
import RiskBadge from '../components/common/RiskBadge';
import Toast from '../components/common/Toast';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Bell, Filter } from 'lucide-react';

const Alerts = () => {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const isEditable = user?.role === 'Admin' || user?.role === 'Analyst';

  useEffect(() => {
    fetchAlerts();
  }, [statusFilter]);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const url = statusFilter !== 'all' ? `/alerts?status=${statusFilter}` : '/alerts';
      const res = await API.get(url);
      setAlerts(res.data);
    } catch (err) {
      setToast({ message: 'Failed to fetch alerts log', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (alertId, newStatus) => {
    try {
      await API.patch(`/alerts/${alertId}/status`, { status: newStatus });
      setToast({ message: `Alert status updated to '${newStatus}'`, type: 'success' });
      fetchAlerts();
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Update failed', type: 'error' });
    }
  };

  if (loading) {
    return (
      <Layout title="Alert Management">
        <LoadingSpinner label="Fetching climate risk alerts..." />
      </Layout>
    );
  }

  return (
    <Layout title="Alert Management">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="bg-white dark:bg-slate-800 p-3.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500" />
          <span className="font-semibold text-slate-700 dark:text-slate-300">Filter Alert Status:</span>
        </div>

        <div className="flex items-center gap-1.5">
          {['all', 'new', 'acknowledged', 'resolved'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded text-xs font-semibold capitalize transition-colors ${
                statusFilter === st
                  ? 'bg-slate-800 text-white dark:bg-slate-700'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Enterprise Alert Data Table */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="p-3">Region</th>
                <th className="p-3">Hazard</th>
                <th className="p-3">Risk Score</th>
                <th className="p-3">Risk Level</th>
                <th className="p-3">Created Date</th>
                <th className="p-3">Status</th>
                {isEditable && <th className="p-3 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {alerts.length === 0 ? (
                <tr>
                  <td colSpan={isEditable ? 7 : 6} className="p-8 text-center text-slate-400 italic">
                    No system alerts match the selected status filter.
                  </td>
                </tr>
              ) : (
                alerts.map((alert) => (
                  <tr key={alert._id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/40">
                    <td className="p-3 font-bold text-slate-900 dark:text-slate-100">{alert.regionId?.name}</td>
                    <td className="p-3 font-medium">{alert.hazardType}</td>
                    <td className="p-3 font-mono font-bold">{alert.riskScore} / 100</td>
                    <td className="p-3">
                      <RiskBadge level={alert.riskLevel} score={alert.riskScore} />
                    </td>
                    <td className="p-3 font-mono text-[11px] text-slate-400">
                      {new Date(alert.createdAt).toLocaleString()}
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-semibold uppercase ${
                        alert.status === 'new' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-300' :
                        alert.status === 'acknowledged' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-300' :
                        'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-300'
                      }`}>
                        {alert.status}
                      </span>
                    </td>
                    {isEditable && (
                      <td className="p-3 text-right space-x-1.5">
                        {alert.status === 'new' && (
                          <button
                            onClick={() => handleStatusChange(alert._id, 'acknowledged')}
                            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-[11px] font-semibold"
                          >
                            Acknowledge
                          </button>
                        )}
                        {alert.status !== 'resolved' && (
                          <button
                            onClick={() => handleStatusChange(alert._id, 'resolved')}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-900 text-white rounded text-[11px] font-semibold"
                          >
                            Resolve
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
};

export default Alerts;
