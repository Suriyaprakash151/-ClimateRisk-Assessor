import React from 'react';
import Layout from '../components/layout/Layout';
import { BookOpen, Database, Calculator, Layers, ShieldCheck, ArrowDown } from 'lucide-react';

const Methodology = () => {
  return (
    <Layout title="Risk Engine Methodology">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header Title Card */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm space-y-2">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            How Risk Is Calculated
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            The ClimateRisk Assessor utilizes a 100% deterministic, rule-based mathematical risk engine. All hazard indicator scores are computed directly from Open-Meteo physical meteorological telemetry without stochastic or AI black-box predictions.
          </p>
        </div>

        {/* Pipeline Diagram */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm uppercase tracking-wider">
            Assessment Calculation Pipeline
          </h3>

          <div className="flex flex-col md:flex-row items-center justify-between gap-3 text-center text-xs">
            <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700 w-full md:w-auto flex-1">
              <Database className="w-4 h-4 mx-auto mb-1 text-slate-600 dark:text-slate-300" />
              <span className="font-bold block">1. Climate Data</span>
              <span className="text-[10px] text-slate-500">Open-Meteo API</span>
            </div>
            <ArrowDown className="w-4 h-4 text-slate-400 md:rotate-[-90deg] shrink-0" />

            <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700 w-full md:w-auto flex-1">
              <Calculator className="w-4 h-4 mx-auto mb-1 text-slate-600 dark:text-slate-300" />
              <span className="font-bold block">2. Normalize Indicators</span>
              <span className="text-[10px] text-slate-500">Scale to 0–100</span>
            </div>
            <ArrowDown className="w-4 h-4 text-slate-400 md:rotate-[-90deg] shrink-0" />

            <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700 w-full md:w-auto flex-1">
              <Layers className="w-4 h-4 mx-auto mb-1 text-slate-600 dark:text-slate-300" />
              <span className="font-bold block">3. Hazard Scores</span>
              <span className="text-[10px] text-slate-500">Drought/Heat/Storm/Flood</span>
            </div>
            <ArrowDown className="w-4 h-4 text-slate-400 md:rotate-[-90deg] shrink-0" />

            <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700 w-full md:w-auto flex-1">
              <ShieldCheck className="w-4 h-4 mx-auto mb-1 text-emerald-600" />
              <span className="font-bold block">4. Composite Risk</span>
              <span className="text-[10px] text-slate-500">Apply Config Weights</span>
            </div>
          </div>
        </div>

        {/* Hazard Formulas Breakdown */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm uppercase tracking-wider">
            Deterministic Mathematical Formulas
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Drought Formula */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded border border-slate-200 dark:border-slate-700 space-y-2">
              <h4 className="font-bold text-amber-700 dark:text-amber-400">1. Drought Risk Score</h4>
              <p className="font-mono text-[11px] bg-white dark:bg-slate-800 p-2 rounded border border-slate-200 dark:border-slate-700">
                0.40 × Rainfall Deficit Score<br/>
                + 0.30 × Soil Moisture Deficit Score<br/>
                + 0.30 × Consecutive Dry Days Score
              </p>
            </div>

            {/* Heatwave Formula */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded border border-slate-200 dark:border-slate-700 space-y-2">
              <h4 className="font-bold text-red-700 dark:text-red-400">2. Heatwave Risk Score</h4>
              <p className="font-mono text-[11px] bg-white dark:bg-slate-800 p-2 rounded border border-slate-200 dark:border-slate-700">
                0.60 × Temperature Exceedance Score<br/>
                + 0.40 × Heat Index Score
              </p>
            </div>

            {/* Storm Formula */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded border border-slate-200 dark:border-slate-700 space-y-2">
              <h4 className="font-bold text-indigo-700 dark:text-indigo-400">3. Storm Risk Score</h4>
              <p className="font-mono text-[11px] bg-white dark:bg-slate-800 p-2 rounded border border-slate-200 dark:border-slate-700">
                0.60 × Maximum Wind Speed Score<br/>
                + 0.40 × Extreme Precipitation Score
              </p>
            </div>

            {/* Flood Formula */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded border border-slate-200 dark:border-slate-700 space-y-2">
              <h4 className="font-bold text-cyan-700 dark:text-cyan-400">4. Flood Risk Score</h4>
              <p className="font-mono text-[11px] bg-white dark:bg-slate-800 p-2 rounded border border-slate-200 dark:border-slate-700">
                0.60 × Rainfall Intensity Score<br/>
                + 0.40 × Cumulative Precipitation Score
              </p>
            </div>
          </div>

          <div className="p-4 bg-slate-100 dark:bg-slate-900 rounded border border-slate-300 dark:border-slate-700 space-y-1">
            <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs">Composite Risk Score (Default Weights: 0.25 each)</h4>
            <p className="font-mono text-xs">
              Composite Risk = (Drought Risk × 0.25) + (Heatwave Risk × 0.25) + (Storm Risk × 0.25) + (Flood Risk × 0.25)
            </p>
          </div>
        </div>

        {/* Risk Classification Scale Table */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm space-y-3">
          <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm uppercase tracking-wider">
            Risk Score Classification Scale
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-center font-medium">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded">
              <span className="font-bold text-emerald-800 dark:text-emerald-300 block">Low Risk</span>
              <span className="font-mono">0 – 24</span>
            </div>

            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded">
              <span className="font-bold text-amber-800 dark:text-amber-300 block">Moderate Risk</span>
              <span className="font-mono">25 – 49</span>
            </div>

            <div className="p-3 bg-orange-50 dark:bg-orange-950/40 border border-orange-300 dark:border-orange-800 rounded">
              <span className="font-bold text-orange-800 dark:text-orange-300 block">High Risk</span>
              <span className="font-mono">50 – 74</span>
            </div>

            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-800 rounded">
              <span className="font-bold text-red-800 dark:text-red-300 block">Severe Risk</span>
              <span className="font-mono">75 – 100</span>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Methodology;
