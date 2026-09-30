import React from 'react';

const StatCard = ({ title, value, subtitle, icon: Icon, valueColor = 'text-slate-900 dark:text-slate-100' }) => {
  return (
    <div className="bg-white dark:bg-slate-800 p-3.5 rounded border border-slate-200 dark:border-slate-700/80 shadow-xs flex items-center justify-between">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{title}</p>
        <h3 className={`text-lg font-bold mt-0.5 font-mono ${valueColor}`}>{value}</h3>
        {subtitle && <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
      {Icon && (
        <div className="p-2 rounded bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 shrink-0">
          <Icon className="w-4 h-4" />
        </div>
      )}
    </div>
  );
};

export default StatCard;
