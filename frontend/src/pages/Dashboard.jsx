import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import StatCard from '../components/common/StatCard';
import RiskBadge from '../components/common/RiskBadge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Toast from '../components/common/Toast';
import RiskMap from '../components/map/RiskMap';
import API from '../services/api';

import { 
  Search, 
  MapPin, 
  AlertTriangle, 
  ShieldAlert, 
  Activity, 
  Filter, 
  ArrowRight,
  TrendingUp,
  Database,
  Layers,
  Save,
  Printer,
  ChevronDown,
  ChevronUp,
  Clock,
  Globe,
  Sliders
} from 'lucide-react';

import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';

const Dashboard = () => {
  const [regions, setRegions] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);

  // Global Location Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchProgressStep, setSearchProgressStep] = useState('');
  const [activeLocationAssessment, setActiveLocationAssessment] = useState(null);
  const [expandedFactor, setExpandedFactor] = useState(null);
  const [isSaved, setIsSaved] = useState(false);
  const [savingAssessment, setSavingAssessment] = useState(false);

  // Filters
  const [selectedHazard, setSelectedHazard] = useState('all');
  const [selectedRegion, setSelectedRegion] = useState('all');

  const popularPills = ['Chennai, India', 'Mumbai, India', 'Delhi, India', 'Coimbatore, India', 'Bangalore, India', 'Rajasthan, India', 'London, UK', 'New York, USA'];

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

  // Search Input Handler for live geocoding suggestions
  const handleQueryChange = async (val) => {
    setSearchQuery(val);
    if (val.trim().length >= 3) {
      try {
        const res = await API.get(`/locations/search?q=${encodeURIComponent(val)}`);
        setSearchSuggestions(res.data || []);
      } catch (err) {
        setSearchSuggestions([]);
      }
    } else {
      setSearchSuggestions([]);
    }
  };

  // Execute Global Location Assessment Workflow
  const handleAssessLocation = async (targetQuery = searchQuery, targetCoords = null) => {
    if (!targetQuery && !targetCoords) return;
    setIsSearching(true);
    setError('');
    setIsSaved(false);

    try {
      setSearchProgressStep('Finding location coordinates...');
      await new Promise(r => setTimeout(r, 250));

      setSearchProgressStep('Fetching climate telemetry from Open-Meteo...');
      await new Promise(r => setTimeout(r, 250));

      setSearchProgressStep('Calculating deterministic hazard scores...');
      await new Promise(r => setTimeout(r, 250));

      setSearchProgressStep('Generating resilience action plan...');

      const payload = targetCoords 
        ? { name: targetQuery, lat: targetCoords.lat, lng: targetCoords.lng }
        : { query: targetQuery };

      const res = await API.post('/locations/assess', payload);
      setActiveLocationAssessment(res.data);
      setSearchSuggestions([]);
      setToast({ message: `Climate risk assessment generated for ${res.data.location?.name}!`, type: 'success' });
    } catch (err) {
      setError(err.response?.data?.message || 'Location could not be found. Please check location name and try again.');
    } finally {
      setIsSearching(false);
      setSearchProgressStep('');
    }
  };

  // Save Assessment to Database
  const handleSaveAssessment = async () => {
    if (!activeLocationAssessment) return;
    setSavingAssessment(true);
    try {
      await API.post('/locations/assess', {
        name: activeLocationAssessment.location?.name,
        lat: activeLocationAssessment.location?.lat,
        lng: activeLocationAssessment.location?.lng,
        saveToDb: true
      });
      setIsSaved(true);
      setToast({ message: `Assessment for ${activeLocationAssessment.location?.name} saved to registry!`, type: 'success' });
      fetchDashboardData();
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Failed to save assessment', type: 'error' });
    } finally {
      setSavingAssessment(false);
    }
  };

  if (loading) {
    return (
      <Layout title="Climate Risk Overview">
        <LoadingSpinner label="Retrieving regional telemetry and climate metrics..." />
      </Layout>
    );
  }

  // Derived Summary Stats
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

  const radarData = [
    { hazard: 'Drought', score: Number((assessments.reduce((a, b) => a + (b.scores?.drought || 0), 0) / (assessments.length || 1)).toFixed(1)) },
    { hazard: 'Heatwave', score: Number((assessments.reduce((a, b) => a + (b.scores?.heatwave || 0), 0) / (assessments.length || 1)).toFixed(1)) },
    { hazard: 'Storm', score: Number((assessments.reduce((a, b) => a + (b.scores?.storm || 0), 0) / (assessments.length || 1)).toFixed(1)) },
    { hazard: 'Flood', score: Number((assessments.reduce((a, b) => a + (b.scores?.flood || 0), 0) / (assessments.length || 1)).toFixed(1)) },
  ];

  return (
    <Layout title="Climate Risk Overview">
      {error && <Toast message={error} type="error" onClose={() => setError('')} />}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* ======================================================== */}
      {/* 1. PROMINENT GLOBAL LOCATION SEARCH SECTION */}
      {/* ======================================================== */}
      <div className="bg-slate-900 text-white p-6 rounded-lg shadow-md border border-slate-800 space-y-4 font-sans">
        <div className="space-y-1">
          <h2 className="text-base font-bold flex items-center gap-2 tracking-wide uppercase text-emerald-400">
            <Globe className="w-5 h-5" /> Global Location Climate Hazard Assessor
          </h2>
          <p className="text-xs text-slate-300">
            Enter any city, district, state, country or landmark to automatically generate live climate hazard scores from Open-Meteo telemetry.
          </p>
        </div>

        {/* Search Input Bar */}
        <div className="relative max-w-3xl">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleQueryChange(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAssessLocation()}
                placeholder="Enter location name (e.g. Chennai, India | London, UK | Coimbatore, India)..."
                className="w-full pl-9 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 font-medium"
              />

              {/* Suggestions Dropdown */}
              {searchSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-50 bg-slate-800 border border-slate-700 rounded-b mt-1 shadow-xl overflow-hidden">
                  {searchSuggestions.map((item, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        setSearchQuery(item.name);
                        handleAssessLocation(item.name, { lat: item.lat, lng: item.lng });
                      }}
                      className="p-2.5 hover:bg-slate-700 text-xs text-slate-200 cursor-pointer flex items-center gap-2 border-b border-slate-700/50 last:border-none"
                    >
                      <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="truncate">{item.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => handleAssessLocation()}
              disabled={isSearching || !searchQuery.trim()}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white rounded text-xs font-bold uppercase tracking-wider shadow transition-colors flex items-center gap-2 shrink-0"
            >
              {isSearching ? 'Processing...' : 'Assess Location'}
            </button>
          </div>

          {/* Popular Quick-Select Pills */}
          <div className="flex flex-wrap items-center gap-1.5 mt-3 text-[11px] text-slate-400">
            <span className="font-semibold text-slate-400">Quick Try:</span>
            {popularPills.map((pill) => (
              <button
                key={pill}
                onClick={() => {
                  setSearchQuery(pill);
                  handleAssessLocation(pill);
                }}
                className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition-colors"
              >
                {pill.split(',')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Search Progress Loading State */}
        {isSearching && (
          <div className="p-4 bg-slate-800/80 rounded border border-slate-700 flex items-center gap-3 text-xs text-emerald-400">
            <div className="w-4 h-4 border-2 border-emerald-500/20 border-t-emerald-400 rounded-full animate-spin"></div>
            <span className="font-mono">{searchProgressStep}</span>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* 2. AUTOMATIC LOCATION ASSESSMENT SCORECARD RESULT */}
      {/* ======================================================== */}
      {activeLocationAssessment && (
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-md p-6 space-y-6 font-sans">
          {/* Location Result Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-700 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  {activeLocationAssessment.location?.name}
                </h3>
                <RiskBadge level={activeLocationAssessment.riskLevel} score={activeLocationAssessment.scores?.composite} />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono">
                Coordinates: <strong>{activeLocationAssessment.location?.lat?.toFixed(4)}°N, {activeLocationAssessment.location?.lng?.toFixed(4)}°E</strong> | 
                Source: <strong>{activeLocationAssessment.dataSource?.provider} ({activeLocationAssessment.dataSource?.type})</strong>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleSaveAssessment}
                disabled={isSaved || savingAssessment}
                className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  isSaved
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300'
                    : 'bg-slate-800 hover:bg-slate-900 text-white'
                }`}
              >
                <Save className="w-3.5 h-3.5" />
                {isSaved ? 'Saved to Registry' : savingAssessment ? 'Saving...' : 'Save Assessment'}
              </button>

              <button
                onClick={() => window.print()}
                className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded text-xs font-semibold flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" /> Print Report
              </button>
            </div>
          </div>

          {/* Hazard Risk Cards (0-100) */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
            {/* Drought */}
            <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700 space-y-1">
              <span className="text-slate-500 block uppercase font-semibold text-[10px]">Drought Risk</span>
              <div className="flex items-baseline justify-between">
                <span className="text-xl font-bold font-mono text-amber-700 dark:text-amber-400">{activeLocationAssessment.scores?.drought}</span>
                <span className="text-[10px] text-slate-400">/ 100</span>
              </div>
              <RiskBadge level={activeLocationAssessment.hazardDetails?.drought?.level} showScore={false} />
            </div>

            {/* Heatwave */}
            <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700 space-y-1">
              <span className="text-slate-500 block uppercase font-semibold text-[10px]">Heatwave Risk</span>
              <div className="flex items-baseline justify-between">
                <span className="text-xl font-bold font-mono text-red-700 dark:text-red-400">{activeLocationAssessment.scores?.heatwave}</span>
                <span className="text-[10px] text-slate-400">/ 100</span>
              </div>
              <RiskBadge level={activeLocationAssessment.hazardDetails?.heatwave?.level} showScore={false} />
            </div>

            {/* Storm */}
            <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700 space-y-1">
              <span className="text-slate-500 block uppercase font-semibold text-[10px]">Storm Risk</span>
              <div className="flex items-baseline justify-between">
                <span className="text-xl font-bold font-mono text-indigo-700 dark:text-indigo-400">{activeLocationAssessment.scores?.storm}</span>
                <span className="text-[10px] text-slate-400">/ 100</span>
              </div>
              <RiskBadge level={activeLocationAssessment.hazardDetails?.storm?.level} showScore={false} />
            </div>

            {/* Flood */}
            <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700 space-y-1">
              <span className="text-slate-500 block uppercase font-semibold text-[10px]">Flood Risk</span>
              <div className="flex items-baseline justify-between">
                <span className="text-xl font-bold font-mono text-cyan-700 dark:text-cyan-400">{activeLocationAssessment.scores?.flood}</span>
                <span className="text-[10px] text-slate-400">/ 100</span>
              </div>
              <RiskBadge level={activeLocationAssessment.hazardDetails?.flood?.level} showScore={false} />
            </div>

            {/* Composite */}
            <div className="col-span-2 sm:col-span-1 p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded border border-emerald-300 dark:border-emerald-800 space-y-1">
              <span className="text-emerald-800 dark:text-emerald-300 block uppercase font-bold text-[10px]">Composite Risk</span>
              <div className="flex items-baseline justify-between">
                <span className="text-xl font-bold font-mono text-emerald-800 dark:text-emerald-300">{activeLocationAssessment.scores?.composite}</span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400">/ 100</span>
              </div>
              <RiskBadge level={activeLocationAssessment.riskLevel} showScore={false} />
            </div>
          </div>

          {/* Explainable Contributing Factors Accordion */}
          <div className="space-y-3 border-t border-slate-200 dark:border-slate-700 pt-4">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Key Contributing Factors & Deterministic Formulas
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {/* Drought Factor */}
              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700 space-y-1.5">
                <div className="flex justify-between font-bold">
                  <span>Drought Factors</span>
                  <span className="font-mono text-amber-600">{activeLocationAssessment.scores?.drought}/100</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 font-mono bg-white dark:bg-slate-800 p-2 rounded border border-slate-200 dark:border-slate-700">
                  Formula: 0.40 × Deficit({activeLocationAssessment.hazardDetails?.drought?.factors?.rainfallDeficitScore ?? 20}) + 0.30 × Soil({activeLocationAssessment.hazardDetails?.drought?.factors?.soilMoistureDeficitScore ?? 25}) + 0.30 × DryDays({activeLocationAssessment.hazardDetails?.drought?.factors?.consecutiveDryDaysScore ?? 20})
                </p>
              </div>

              {/* Heatwave Factor */}
              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700 space-y-1.5">
                <div className="flex justify-between font-bold">
                  <span>Heatwave Factors</span>
                  <span className="font-mono text-red-600">{activeLocationAssessment.scores?.heatwave}/100</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 font-mono bg-white dark:bg-slate-800 p-2 rounded border border-slate-200 dark:border-slate-700">
                  Formula: 0.60 × TempExceedance({activeLocationAssessment.hazardDetails?.heatwave?.factors?.temperatureExceedanceScore ?? 30}) + 0.40 × HeatIndex({activeLocationAssessment.hazardDetails?.heatwave?.factors?.heatIndexScore ?? 0})
                </p>
              </div>

              {/* Storm Factor */}
              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700 space-y-1.5">
                <div className="flex justify-between font-bold">
                  <span>Storm Factors</span>
                  <span className="font-mono text-indigo-600">{activeLocationAssessment.scores?.storm}/100</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 font-mono bg-white dark:bg-slate-800 p-2 rounded border border-slate-200 dark:border-slate-700">
                  Formula: 0.60 × MaxWind({activeLocationAssessment.hazardDetails?.storm?.factors?.maxWindSpeedScore ?? 15}) + 0.40 × ExtremePrecip({activeLocationAssessment.hazardDetails?.storm?.factors?.extremePrecipitationScore ?? 10})
                </p>
              </div>

              {/* Flood Factor */}
              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700 space-y-1.5">
                <div className="flex justify-between font-bold">
                  <span>Flood Factors</span>
                  <span className="font-mono text-cyan-600">{activeLocationAssessment.scores?.flood}/100</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 font-mono bg-white dark:bg-slate-800 p-2 rounded border border-slate-200 dark:border-slate-700">
                  Formula: 0.60 × Intensity({activeLocationAssessment.hazardDetails?.flood?.factors?.rainfallIntensityScore ?? 15}) + 0.40 × Cumulative({activeLocationAssessment.hazardDetails?.flood?.factors?.cumulativePrecipitationScore ?? 20})
                </p>
              </div>
            </div>
          </div>

          {/* Rule-Based Resilience Recommendations */}
          <div className="space-y-3 border-t border-slate-200 dark:border-slate-700 pt-4">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Automated Resilience Action Plan
            </h4>
            <ul className="space-y-2 text-xs">
              {activeLocationAssessment.recommendations?.map((rec, idx) => (
                <li key={idx} className="p-2.5 bg-slate-50 dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-700 dark:bg-slate-400 mt-1.5 shrink-0"></span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. EXECUTIVE REGIONAL OVERVIEW METRICS */}
      {/* ======================================================== */}
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
