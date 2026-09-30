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

      <div className="space-y-5 font-sans">
        {/* ======================================================== */}
        {/* 1. COMPACT ENTERPRISE KPI CARDS */}
        {/* ======================================================== */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
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
            valueColor={highRiskRegionsCount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-slate-100'}
          />
          <StatCard
            title="Severe Risk Regions"
            value={severeRiskRegionsCount}
            subtitle="Score 75 – 100"
            icon={AlertTriangle}
            valueColor={severeRiskRegionsCount > 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-slate-100'}
          />
          <StatCard
            title="Active Alerts"
            value={activeAlertsCount}
            subtitle="Requires attention"
            icon={AlertTriangle}
            valueColor={activeAlertsCount > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-slate-900 dark:text-slate-100'}
          />
          <StatCard
            title="Average Risk Index"
            value={`${avgRiskIndex} / 100`}
            subtitle="Across all territories"
            icon={Activity}
            valueColor={avgRiskIndex >= 50 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-700 dark:text-emerald-400'}
          />
        </div>

        {/* ======================================================== */}
        {/* 2. GLOBAL LOCATION ASSESSMENT SEARCH PANEL */}
        {/* ======================================================== */}
        <div className="bg-white dark:bg-slate-800 p-4.5 rounded border border-slate-200 dark:border-slate-700 shadow-xs space-y-3">
          <div className="space-y-0.5">
            <h3 className="text-xs font-bold flex items-center gap-2 tracking-wide uppercase text-slate-800 dark:text-slate-100">
              <Globe className="w-4 h-4 text-teal-600 dark:text-teal-400" /> GLOBAL LOCATION ASSESSMENT
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Enter a city, district, state or country to assess climate hazards.
            </p>
          </div>

          {/* Search Input Bar */}
          <div className="relative max-w-3xl">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleQueryChange(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAssessLocation()}
                  placeholder="Search location (e.g. Chennai, India | London, UK | Coimbatore, India)..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-teal-600 dark:focus:border-teal-500 font-medium"
                />

                {/* Suggestions Dropdown */}
                {searchSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-50 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-b mt-1 shadow-md overflow-hidden">
                    {searchSuggestions.map((item, idx) => (
                      <div
                        key={idx}
                        onClick={() => {
                          setSearchQuery(item.name);
                          handleAssessLocation(item.name, { lat: item.lat, lng: item.lng });
                        }}
                        className="p-2.5 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs text-slate-700 dark:text-slate-200 cursor-pointer flex items-center gap-2 border-b border-slate-100 dark:border-slate-700/50 last:border-none"
                      >
                        <MapPin className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                        <span className="truncate">{item.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={() => handleAssessLocation()}
                disabled={isSearching || !searchQuery.trim()}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-teal-600 dark:hover:bg-teal-500 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white rounded text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 shrink-0"
              >
                {isSearching ? 'Processing...' : 'Assess Location'}
              </button>
            </div>

            {/* Popular Quick-Select Outline Pills */}
            <div className="flex flex-wrap items-center gap-1.5 mt-2.5 text-[11px] text-slate-500">
              <span className="font-semibold">Quick Try:</span>
              {popularPills.map((pill) => (
                <button
                  key={pill}
                  onClick={() => {
                    setSearchQuery(pill);
                    handleAssessLocation(pill);
                  }}
                  className="px-2 py-0.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded border border-slate-300 dark:border-slate-600 text-[11px] transition-colors"
                >
                  {pill.split(',')[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Search Progress Loading State */}
          {isSearching && (
            <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700 flex items-center gap-2.5 text-xs text-teal-700 dark:text-teal-400 font-mono">
              <div className="w-3.5 h-3.5 border-2 border-teal-500/20 border-t-teal-600 rounded-full animate-spin"></div>
              <span>{searchProgressStep}</span>
            </div>
          )}
        </div>

        {/* Global Location Result Scorecard */}
        {activeLocationAssessment && (
          <div className="bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 shadow-xs p-5 space-y-5 font-sans">
            {/* Location Result Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-700 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    {activeLocationAssessment.location?.name}
                  </h3>
                  <RiskBadge level={activeLocationAssessment.riskLevel} score={activeLocationAssessment.scores?.composite} />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-mono">
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
                      : 'bg-slate-900 hover:bg-slate-800 text-white dark:bg-teal-600 dark:hover:bg-teal-500'
                  }`}
                >
                  <Save className="w-3.5 h-3.5" />
                  {isSaved ? 'Saved to Registry' : savingAssessment ? 'Saving...' : 'Save Assessment'}
                </button>

                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded text-xs font-semibold flex items-center gap-1.5 border border-slate-200 dark:border-slate-600"
                >
                  <Printer className="w-3.5 h-3.5" /> Print Report
                </button>
              </div>
            </div>

            {/* Hazard Risk Cards (0-100) */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded border border-slate-200 dark:border-slate-700 space-y-1">
                <span className="text-slate-500 block uppercase font-semibold text-[10px]">Drought Risk</span>
                <div className="flex items-baseline justify-between">
                  <span className="text-lg font-bold font-mono text-amber-600 dark:text-amber-400">{activeLocationAssessment.scores?.drought}</span>
                  <span className="text-[10px] text-slate-400">/ 100</span>
                </div>
                <RiskBadge level={activeLocationAssessment.hazardDetails?.drought?.level} showScore={false} />
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded border border-slate-200 dark:border-slate-700 space-y-1">
                <span className="text-slate-500 block uppercase font-semibold text-[10px]">Heatwave Risk</span>
                <div className="flex items-baseline justify-between">
                  <span className="text-lg font-bold font-mono text-red-600 dark:text-red-400">{activeLocationAssessment.scores?.heatwave}</span>
                  <span className="text-[10px] text-slate-400">/ 100</span>
                </div>
                <RiskBadge level={activeLocationAssessment.hazardDetails?.heatwave?.level} showScore={false} />
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded border border-slate-200 dark:border-slate-700 space-y-1">
                <span className="text-slate-500 block uppercase font-semibold text-[10px]">Storm Risk</span>
                <div className="flex items-baseline justify-between">
                  <span className="text-lg font-bold font-mono text-indigo-600 dark:text-indigo-400">{activeLocationAssessment.scores?.storm}</span>
                  <span className="text-[10px] text-slate-400">/ 100</span>
                </div>
                <RiskBadge level={activeLocationAssessment.hazardDetails?.storm?.level} showScore={false} />
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded border border-slate-200 dark:border-slate-700 space-y-1">
                <span className="text-slate-500 block uppercase font-semibold text-[10px]">Flood Risk</span>
                <div className="flex items-baseline justify-between">
                  <span className="text-lg font-bold font-mono text-cyan-600 dark:text-cyan-400">{activeLocationAssessment.scores?.flood}</span>
                  <span className="text-[10px] text-slate-400">/ 100</span>
                </div>
                <RiskBadge level={activeLocationAssessment.hazardDetails?.flood?.level} showScore={false} />
              </div>

              <div className="col-span-2 sm:col-span-1 p-3 bg-slate-100 dark:bg-slate-900 rounded border border-slate-300 dark:border-slate-600 space-y-1">
                <span className="text-slate-800 dark:text-slate-200 block uppercase font-bold text-[10px]">Composite Risk</span>
                <div className="flex items-baseline justify-between">
                  <span className="text-lg font-bold font-mono text-slate-900 dark:text-slate-100">{activeLocationAssessment.scores?.composite}</span>
                  <span className="text-[10px] text-slate-500">/ 100</span>
                </div>
                <RiskBadge level={activeLocationAssessment.riskLevel} showScore={false} />
              </div>
            </div>

            {/* Formula Breakdown */}
            <div className="space-y-2.5 border-t border-slate-200 dark:border-slate-700 pt-3.5">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Key Contributing Factors & Deterministic Formulas
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs">
                <div className="p-2.5 bg-slate-50 dark:bg-slate-900/60 rounded border border-slate-200 dark:border-slate-700 space-y-1">
                  <div className="flex justify-between font-bold">
                    <span>Drought Factors</span>
                    <span className="font-mono text-amber-600">{activeLocationAssessment.scores?.drought}/100</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 font-mono bg-white dark:bg-slate-800 p-2 rounded border border-slate-200 dark:border-slate-700">
                    Formula: 0.40 × Deficit({activeLocationAssessment.hazardDetails?.drought?.factors?.rainfallDeficitScore ?? 20}) + 0.30 × Soil({activeLocationAssessment.hazardDetails?.drought?.factors?.soilMoistureDeficitScore ?? 25}) + 0.30 × DryDays({activeLocationAssessment.hazardDetails?.drought?.factors?.consecutiveDryDaysScore ?? 20})
                  </p>
                </div>

                <div className="p-2.5 bg-slate-50 dark:bg-slate-900/60 rounded border border-slate-200 dark:border-slate-700 space-y-1">
                  <div className="flex justify-between font-bold">
                    <span>Heatwave Factors</span>
                    <span className="font-mono text-red-600">{activeLocationAssessment.scores?.heatwave}/100</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 font-mono bg-white dark:bg-slate-800 p-2 rounded border border-slate-200 dark:border-slate-700">
                    Formula: 0.60 × TempExceedance({activeLocationAssessment.hazardDetails?.heatwave?.factors?.temperatureExceedanceScore ?? 30}) + 0.40 × HeatIndex({activeLocationAssessment.hazardDetails?.heatwave?.factors?.heatIndexScore ?? 0})
                  </p>
                </div>

                <div className="p-2.5 bg-slate-50 dark:bg-slate-900/60 rounded border border-slate-200 dark:border-slate-700 space-y-1">
                  <div className="flex justify-between font-bold">
                    <span>Storm Factors</span>
                    <span className="font-mono text-indigo-600">{activeLocationAssessment.scores?.storm}/100</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 font-mono bg-white dark:bg-slate-800 p-2 rounded border border-slate-200 dark:border-slate-700">
                    Formula: 0.60 × MaxWind({activeLocationAssessment.hazardDetails?.storm?.factors?.maxWindSpeedScore ?? 15}) + 0.40 × ExtremePrecip({activeLocationAssessment.hazardDetails?.storm?.factors?.extremePrecipitationScore ?? 10})
                  </p>
                </div>

                <div className="p-2.5 bg-slate-50 dark:bg-slate-900/60 rounded border border-slate-200 dark:border-slate-700 space-y-1">
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

            {/* Recommendations */}
            <div className="space-y-2 border-t border-slate-200 dark:border-slate-700 pt-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Automated Resilience Action Plan
              </h4>
              <ul className="space-y-1.5 text-xs">
                {activeLocationAssessment.recommendations?.map((rec, idx) => (
                  <li key={idx} className="p-2 bg-slate-50 dark:bg-slate-900/60 rounded border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-600 mt-1.5 shrink-0"></span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* 3 & 4. REGIONAL CLIMATE RISK COMPARISON & RISK DISTRIBUTION TABLE */}
        {/* ======================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Comparison Bar Chart (2 cols) */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-4.5 rounded border border-slate-200 dark:border-slate-700 shadow-xs space-y-3">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-xs uppercase tracking-wide flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                Regional Climate Risk Comparison
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Comparison of hazard scores across monitored regions.
              </p>
            </div>

            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hazardChartData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc', borderRadius: '4px', fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Bar dataKey="Drought" fill="#d97706" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="Heatwave" fill="#dc2626" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="Storm" fill="#4f46e5" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="Flood" fill="#0891b2" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Risk Distribution Table (1 col - Replaces Radar Chart) */}
          <div className="bg-white dark:bg-slate-800 p-4.5 rounded border border-slate-200 dark:border-slate-700 shadow-xs space-y-3 flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-xs uppercase tracking-wide">
                RISK DISTRIBUTION
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Monitored regions status overview.
              </p>
            </div>

            <div className="overflow-x-auto flex-1 mt-2">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-500 uppercase font-semibold text-[10px]">
                    <th className="py-2 px-1">Region</th>
                    <th className="py-2 px-1">Composite Risk</th>
                    <th className="py-2 px-1 text-right">Level</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 font-medium">
                  {regions.map((r) => {
                    const ass = assessments.find(a => String(a.regionId?._id || a.regionId) === String(r._id));
                    const score = ass?.scores?.composite ?? 0;
                    const level = ass?.riskLevel || (score >= 75 ? 'Severe' : score >= 50 ? 'High' : score >= 25 ? 'Moderate' : 'Low');
                    return (
                      <tr key={r._id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                        <td className="py-2 px-1 text-slate-800 dark:text-slate-200 font-semibold">{r.name}</td>
                        <td className="py-2 px-1 font-mono">{score}</td>
                        <td className="py-2 px-1 text-right">
                          <RiskBadge level={level} showScore={false} />
                        </td>
                      </tr>
                    );
                  })}
                  {regions.length === 0 && (
                    <tr>
                      <td colSpan="3" className="py-4 text-center text-slate-400 text-xs italic">No regions configured yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* 5. PROMINENT REGIONAL RISK MAP */}
        {/* ======================================================== */}
        <div className="bg-white dark:bg-slate-800 p-4.5 rounded border border-slate-200 dark:border-slate-700 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-xs uppercase tracking-wide flex items-center gap-2">
                <MapPin className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                REGIONAL RISK MAP
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Geographic distribution of monitored climate risk.
              </p>
            </div>
            <a href="/map" className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1">
              Open Full GIS Map →
            </a>
          </div>
          <RiskMap regions={regions} assessments={assessments} />
        </div>

        {/* ======================================================== */}
        {/* 6. ACTIVE SYSTEM ALERTS & RECENT ASSESSMENTS */}
        {/* ======================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Active System Alerts (Left Column) */}
          <div className="bg-white dark:bg-slate-800 p-4.5 rounded border border-slate-200 dark:border-slate-700 shadow-xs space-y-3 flex flex-col h-[320px]">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-xs uppercase tracking-wide flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                ACTIVE SYSTEM ALERTS ({alerts.filter(a => a.status === 'new').length})
              </h3>
              <a href="/alerts" className="text-[11px] text-teal-600 dark:text-teal-400 font-semibold hover:underline">
                View All
              </a>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {alerts.filter(a => a.status === 'new').length === 0 ? (
                <p className="text-xs text-slate-500 dark:text-slate-400 italic text-center py-12">No active climate-risk alerts.</p>
              ) : (
                alerts.filter(a => a.status === 'new').map((alert) => (
                  <div key={alert._id} className="p-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 dark:text-slate-100">{alert.regionId?.name || 'Region'}</span>
                      <RiskBadge level={alert.riskLevel} score={alert.riskScore} />
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 leading-snug">{alert.message}</p>
                    <span className="text-[10px] text-slate-400 block font-mono">{new Date(alert.createdAt).toLocaleString()}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Assessments (Right Column) */}
          <div className="bg-white dark:bg-slate-800 p-4.5 rounded border border-slate-200 dark:border-slate-700 shadow-xs space-y-3 flex flex-col h-[320px]">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-xs uppercase tracking-wide flex items-center gap-2">
                <Clock className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                RECENT ASSESSMENTS
              </h3>
              <a href="/assessments" className="text-[11px] text-teal-600 dark:text-teal-400 font-semibold hover:underline">
                View All
              </a>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {assessments.length === 0 ? (
                <p className="text-xs text-slate-500 dark:text-slate-400 italic text-center py-12">No recent assessment records.</p>
              ) : (
                assessments.slice(0, 5).map((ass) => (
                  <div key={ass._id} className="p-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded flex items-center justify-between text-xs">
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-slate-100">{ass.locationName || ass.regionId?.name || 'Monitored Area'}</h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                        Composite Risk: <span className="font-bold text-slate-800 dark:text-slate-200">{ass.scores?.composite}</span>
                      </p>
                    </div>
                    <div className="text-right space-y-1">
                      <RiskBadge level={ass.riskLevel} showScore={false} />
                      <span className="text-[10px] text-slate-400 block font-mono">
                        {new Date(ass.createdAt || ass.assessmentDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
