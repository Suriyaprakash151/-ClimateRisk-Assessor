import React from 'react';

const RiskBadge = ({ level, score, showScore = true }) => {
  // Determine risk level based on score if score is provided
  let computedLevel = level;
  if (score !== undefined && score !== null) {
    const s = Math.round(score);
    if (s < 25) computedLevel = 'Low';
    else if (s < 50) computedLevel = 'Moderate';
    else if (s < 75) computedLevel = 'High';
    else computedLevel = 'Severe';
  }

  const getStyle = () => {
    switch (computedLevel) {
      case 'Severe':
        return 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 border-red-300 dark:border-red-800';
      case 'High':
        return 'bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300 border-orange-300 dark:border-orange-800';
      case 'Moderate':
        return 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-300 dark:border-amber-800';
      case 'Low':
      default:
        return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800';
    }
  };

  const getDotColor = () => {
    switch (computedLevel) {
      case 'Severe': return 'bg-red-600';
      case 'High': return 'bg-orange-600';
      case 'Moderate': return 'bg-amber-600';
      case 'Low':
      default: return 'bg-emerald-600';
    }
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded border text-xs font-semibold ${getStyle()}`}>
      <span className={`w-2 h-2 rounded-full ${getDotColor()}`}></span>
      <span>{computedLevel}</span>
      {showScore && score !== undefined && score !== null && (
        <span className="font-mono text-[11px] opacity-80">({Math.round(score)})</span>
      )}
    </span>
  );
};

export default RiskBadge;
