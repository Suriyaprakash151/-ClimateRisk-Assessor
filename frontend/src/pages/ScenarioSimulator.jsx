import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import LoadingSpinner from '../components/common/LoadingSpinner';
import RiskBadge from '../components/common/RiskBadge';
import Toast from '../components/common/Toast';
import API from '../services/api';
import { Sliders, Thermometer, CloudRain, Wind, ShieldAlert, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';

const ScenarioSimulator = () => {
  const [regions, setRegions] = useState([]);
  const [selectedRegionId, setSelectedRegionId] = useState('');
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState(null);
  const [toast, setToast] = useState(null);

  // Sliders (-5 to +5 temp, -50 to +50 rainfall, -30 to +30 wind)
  const [tempOffsetC, setTempOffsetC] = useState(2.0);
  const [precipDeltaPct, setPrecipDeltaPct] = useState(20);
  const [windOffsetPct, setWindOffsetPct] = useState(15);

  useEffect(() => {
    fetchRegions();
  }, []);

  const fetchRegions = async () => {
    setLoading(true);
    try {
      const res = await API.get('/regions');
      setRegions(res.data);
      if (res.data.length > 0) {
        setSelectedRegionId(res.data[0]._id);
      }
    } catch (err) {
      setToast({ message: 'Failed to load regions for simulator', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedRegionId) {
      runSimulation();
    }
  }, [selectedRegionId, tempOffsetC, precipDeltaPct, windOffsetPct]);

  const runSimulation = async () => {
    if (!selectedRegionId) return;
    setSimulating(true);
    try {
      const res = await API.post('/assessments/simulate', {
        regionId: selectedRegionId,
        tempOffsetC: Number(tempOffsetC),
        precipDeltaPct: Number(precipDeltaPct),
        windOffsetKmH: Number(windOffsetPct) * 0.5
      });
      setSimulationResult(res.data);
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Simulation error', type: 'error' });
    } finally {
      setSimulating(false);
    }
  };

  if (loading) {
    return (
      <Layout title="Climate Scenario Simulator">
        <LoadingSpinner label="Initializing climate scenario simulator..." />
      </Layout>
    );
  }

  const baseline = simulationResult?.baseline;
  const simulated = simulationResult?.simulated;
  const deltas = simulationResult?.deltas;

  const chartData = [
    {
      hazard: 'Composite Risk',
      Current: baseline?.scores?.composite ?? 0,
      Simulated: simulated?.scores?.composite ?? 0
    },
    {
      hazard: 'Drought Risk',
      Current: baseline?.scores?.drought ?? 0,
      Simulated: simulated?.scores?.drought ?? 0
    },
    {
      hazard: 'Heatwave Risk',
      Current: baseline?.scores?.heatwave ?? 0,
      Simulated: simulated?.scores?.heatwave ?? 0
    },
    {
      hazard: 'Storm Risk',
      Current: baseline?.scores?.storm ?? 0,
      Simulated: simulated?.scores?.storm ?? 0
    },
    {
      hazard: 'Flood Risk',
      Current: baseline?.scores?.flood ?? 0,
      Simulated: simulated?.scores?.flood ?? 0
    },
  ];

  return (
    <Layout title="Climate Scenario Simulator">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Mandatory Disclaimer Badge */}
      <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 p-3 rounded-lg flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span><strong>SIMULATION ONLY:</strong> Adjusting scenario parameters recomputes risk scores dynamically for planning purposes. Original regional assessment records are not modified.</span>
        </div>
        <span className="font-mono text-[10px] font-bold px-2 py-0.5 bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-100 rounded uppercase">
          Simulation Sandbox
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Slider Control Panel */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm space-y-5">
          <div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-xs uppercase tracking-wider flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Scenario Controls
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Stress-test climate risk variables (-5°C to +5°C temperature, -50% to +50% rainfall).
            </p>
          </div>

          {/* Region Dropdown */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
              Select Region
            </label>
            <select
              value={selectedRegionId}
              onChange={(e) => setSelectedRegionId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-xs font-medium"
            >
              {regions.map((r) => (
                <option key={r._id} value={r._id}>{r.name} ({r.type})</option>
              ))}
            </select>
          </div>

          {/* Slider 1: Temperature Change (-5°C to +5°C) */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-700">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Thermometer className="w-4 h-4 text-red-500" /> Temperature Change
              </span>
              <span className="font-mono font-bold text-red-600 bg-red-50 dark:bg-red-950/40 px-2 py-0.5 rounded border border-red-200 dark:border-red-800">
                {tempOffsetC > 0 ? `+${tempOffsetC}` : tempOffsetC}°C
              </span>
            </div>
            <input
              type="range"
              min="-5"
              max="5"
              step="0.5"
              value={tempOffsetC}
              onChange={(e) => setTempOffsetC(e.target.value)}
              className="w-full accent-red-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>-5°C</span>
              <span>0°C (Baseline)</span>
              <span>+5°C</span>
            </div>
          </div>

          {/* Slider 2: Rainfall Change (-50% to +50%) */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-700">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <CloudRain className="w-4 h-4 text-amber-500" /> Rainfall Change
              </span>
              <span className="font-mono font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                {precipDeltaPct > 0 ? `+${precipDeltaPct}` : precipDeltaPct}%
              </span>
            </div>
            <input
              type="range"
              min="-50"
              max="50"
              step="5"
              value={precipDeltaPct}
              onChange={(e) => setPrecipDeltaPct(e.target.value)}
              className="w-full accent-amber-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>-50% (Drought)</span>
              <span>0% (Normal)</span>
              <span>+50% (Heavy Rain)</span>
            </div>
          </div>

          {/* Slider 3: Wind Speed Change (-30% to +30%) */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-700">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Wind className="w-4 h-4 text-indigo-500" /> Wind Speed Change
              </span>
              <span className="font-mono font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-800">
                {windOffsetPct > 0 ? `+${windOffsetPct}` : windOffsetPct}%
              </span>
            </div>
            <input
              type="range"
              min="-30"
              max="30"
              step="5"
              value={windOffsetPct}
              onChange={(e) => setWindOffsetPct(e.target.value)}
              className="w-full accent-indigo-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>-30%</span>
              <span>0% (Baseline)</span>
              <span>+30%</span>
            </div>
          </div>
        </div>

        {/* Right Simulation Outputs */}
        <div className="lg:col-span-2 space-y-6">
          {/* Comparison Cards: Current vs Scenario vs Difference */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Current */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm space-y-2">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Current Scenario</span>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-100">{baseline?.scores?.composite ?? 0}</span>
                <RiskBadge level={baseline?.riskLevel} score={baseline?.scores?.composite} />
              </div>
            </div>

            {/* Simulated */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm space-y-2">
              <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase">Simulated Scenario</span>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold font-mono text-emerald-700 dark:text-emerald-300">{simulated?.scores?.composite ?? 0}</span>
                <RiskBadge level={simulated?.riskLevel} score={simulated?.scores?.composite} />
              </div>
            </div>

            {/* Difference */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm space-y-2">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Difference</span>
              <div className="flex items-center justify-between">
                <span className={`text-2xl font-bold font-mono ${deltas?.composite >= 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                  {deltas?.composite >= 0 ? `+${deltas?.composite}` : deltas?.composite}
                </span>
                <span className="text-xs text-slate-500">Points Shift</span>
              </div>
            </div>
          </div>

          {/* Bar Chart Comparison */}
          <div className="bg-white dark:bg-slate-800 p-5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-xs uppercase tracking-wider">
              Current vs Simulated Risk Breakdown
            </h3>
            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="hazard" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} domain={[0, 100]} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc', borderRadius: '4px', fontSize: '12px' }} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Bar dataKey="Current" fill="#94a3b8" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="Simulated" fill="#059669" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Practical Resilience Recommendations for Simulated Scenario */}
          <div className="bg-white dark:bg-slate-800 p-5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm space-y-3">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-xs uppercase tracking-wider">
              Simulated Resilience Recommendations
            </h3>
            <ul className="space-y-2 text-xs">
              {simulated?.recommendations?.map((rec, idx) => (
                <li key={idx} className="p-2.5 bg-slate-50 dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-600 mt-1.5 shrink-0"></span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ScenarioSimulator;
