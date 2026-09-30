import React from 'react';

const LoadingSpinner = ({ label = 'Loading telemetry & risk metrics...' }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-600 rounded-full animate-spin"></div>
      {label && <p className="mt-3 text-sm font-medium text-slate-600 dark:text-slate-400 animate-pulse">{label}</p>}
    </div>
  );
};

export default LoadingSpinner;
