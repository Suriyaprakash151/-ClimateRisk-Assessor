import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import StatCard from '../components/common/StatCard';
import RiskBadge from '../components/common/RiskBadge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Toast from '../components/common/Toast';
import RiskMap from '../components/map/RiskMap';
import API from '../services/api';

import { 
  MapPin, 
  AlertTriangle, 
  ShieldAlert, 
  Activity, 
  Filter, 
  ArrowRight,
  TrendingUp,
  Database,
  Layers,
  FileText
} from 'lucide-react';

import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, LineChart, Line
} from 'recharts';

const Dashboard = () => {
  const [regions, setRegions] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [selectedHazard, setSelectedHazard] = useState('all');
  const [selectedRegion, setSelectedRegion] = useState('all');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      const [regRes, assRes, altRes] = await Promise.all([
        API.get('/regions'),
        API.get('/assessments'),
        API.get('/alerts')
      ]);

      setRegions(regRes.data);
      setAssessments(assRes.data);
      setAlerts(altRes.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load climate overview telemetry');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout title="Climate Risk Overview">
        <LoadingSpinner label="Retrieving regional telemetry and climate metrics..." />
      </Layout>
    );
  }

  // Derived Stats
  const totalRegions = regions.length;
  const highRiskRegionsCount = assessments.filter(a => Math.round(a.scores?.composite || 0) >= 50 && Math.round(a.scores?.composite || 0) < 75).length;
  const severeRiskRegionsCount = assessments.filter(a => Math.round(a.scores?.composite || 0) >= 75).length;
  const activeAlertsCount = alerts.filter(a => a.status === 'new').length;
  const avgRiskIndex = assessments.length > 0
    ? Number((assessments.reduce((acc, curr) => acc + (curr.scores?.composite || 0), 0) / assessments.length).toFixed(1))
    : 0;

  // Chart Data: Hazard Risk Comparison per Region
  const hazardChartData = regions.map(r => {
    const ass = assessments.find(a => String(a.regionId?._id || a.regionId) === String(r._id));
    return {
      name: r.name,
      Drought: ass?.scores?.drought ?? 0,
      Heatwave: ass?.scores?.heatwave ?? 0,
      Storm: ass?.scores?.storm ?? 0,
      Flood: ass?.scores?.flood ?? 0,
      Composite: ass?.scores?.composite ?? 0
    };
  });

  // Radar Chart average hazard scores
  const radarData = [
    { hazard: 'Drought', score: Number((assessments.reduce((a, b) => a + (b.scores?.drought || 0), 0) / (assessments.length || 1)).toFixed(1)) },
    { hazard: 'Heatwave', score: Number((assessments.reduce((a, b) => a + (b.scores?.heatwave || 0), 0) / (assessments.length || 1)).toFixed(1)) },
    { hazard: 'Storm', score: Number((assessments.reduce((a, b) => a + (b.scores?.storm || 0), 0) / (assessments.length || 1)).toFixed(1)) },
    { hazard: 'Flood', score: Number((assessments.reduce((a, b) => a + (b.scores?.flood || 0), 0) / (assessments.length || 1)).toFixed(1)) },
  ];

  return (
    <Layout title="Climate Risk Overview">
      {error && <Toast message={error} type="error" onClose={() => setError('')} />}

      {/* Top Filter Toolbar */}
      <div className="bg-white dark:bg-slate-800 p-3.5 rounded-lg border border-slate-200 dark:border-slate-700/80 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500" />
          <span className="font-semibold text-slate-700 dark:text-slate-300">Filter Overview:</span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">Region:</span>
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="px-2.5 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-xs font-medium text-slate-700 dark:text-slate-200"
            >
              <option value="all">All Regions ({regions.length})</option>
              {regions.map(r => (
                <option key={r._id} value={r._id}>{r.name} ({r.type})</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">Hazard:</span>
            <select
              value={selectedHazard}
              onChange={(e) => setSelectedHazard(e.target.value)}
              className="px-2.5 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-xs font-medium text-slate-700 dark:text-slate-200"
            >
              <option value="all">All Hazards</option>
              <option value="drought">Drought</option>
              <option value="heatwave">Heatwave</option>
              <option value="storm">Storm</option>
              <option value="flood">Flood</option>
            </select>
          </div>
        </div>
      </div>

      {/* 5 Top Summary Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Regions"
          value={totalRegions}
          subtitle="Monitored territories"
          icon={MapPin}
        />
        <StatCard
          title="High Risk Regions"
          value={highRiskRegionsCount}
          subtitle="Score 50 – 74"
          icon={ShieldAlert}
        />
        <StatCard
          title="Severe Risk Regions"
          value={severeRiskRegionsCount}
          subtitle="Score 75 – 100"
          icon={AlertTriangle}
        />
        <StatCard
          title="Active Alerts"
          value={activeAlertsCount}
          subtitle="Requires attention"
          icon={AlertTriangle}
        />
        <StatCard
          title="Average Risk Index"
          value={`${avgRiskIndex} / 100`}
          subtitle="Across all territories"
          icon={Activity}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Regional Hazard Breakdown Bar Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-xs uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Regional Climate Risk Comparison
            </h3>
            <span className="text-xs text-slate-400 font-mono">Scale: 0–100</span>
          </div>

          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hazardChartData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc', borderRadius: '4px', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                {(selectedHazard === 'all' || selectedHazard === 'drought') && <Bar dataKey="Drought" fill="#d97706" radius={[2, 2, 0, 0]} />}
                {(selectedHazard === 'all' || selectedHazard === 'heatwave') && <Bar dataKey="Heatwave" fill="#dc2626" radius={[2, 2, 0, 0]} />}
                {(selectedHazard === 'all' || selectedHazard === 'storm') && <Bar dataKey="Storm" fill="#4f46e5" radius={[2, 2, 0, 0]} />}
                {(selectedHazard === 'all' || selectedHazard === 'flood') && <Bar dataKey="Flood" fill="#0891b2" radius={[2, 2, 0, 0]} />}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Regional Climate Risk Profile Radar */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 text-xs uppercase tracking-wider">
            Regional Climate Risk Profile
          </h3>
          <div className="h-[280px] w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid opacity={0.2} />
                <PolarAngleAxis dataKey="hazard" stroke="#94a3b8" fontSize={11} />
                <PolarRadiusAxis domain={[0, 100]} stroke="#94a3b8" fontSize={10} />
                <Radar name="Avg Hazard Risk" dataKey="score" stroke="#059669" fill="#059669" fillOpacity={0.35} />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Geospatial Map Preview & Active Alerts Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-xs uppercase tracking-wider flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Regional Risk Map Preview
            </h3>
            <a href="/map" className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1">
              Open Full GIS Map <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
          <RiskMap regions={regions} assessments={assessments} />
        </div>

        {/* Recent Assessments & Alerts Panel */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col h-[560px]">
          <div className="flex items-center justify-between mb-3 border-b border-slate-200 dark:border-slate-700 pb-2">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-xs uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              Active System Alerts ({alerts.filter(a => a.status === 'new').length})
            </h3>
            <a href="/alerts" className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold hover:underline">
              View All
            </a>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
            {alerts.filter(a => a.status === 'new').length === 0 ? (
              <p className="text-xs text-slate-500 italic text-center py-16">No active unacknowledged alerts.</p>
            ) : (
              alerts.filter(a => a.status === 'new').map((alert) => (
                <div key={alert._id} className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-slate-100">{alert.regionId?.name}</span>
                    <RiskBadge level={alert.riskLevel} score={alert.riskScore} />
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 leading-snug">{alert.message}</p>
                  <span className="text-[10px] text-slate-400 block font-mono">{new Date(alert.createdAt).toLocaleString()}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
