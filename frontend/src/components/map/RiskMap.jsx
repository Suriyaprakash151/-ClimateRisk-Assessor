import React from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip } from 'react-leaflet';
import RiskBadge from '../common/RiskBadge';

const RiskMap = ({ regions = [], assessments = [], onAssessRegion }) => {
  // Center of India baseline coordinates
  const defaultCenter = [20.5937, 78.9629];
  const defaultZoom = 5;

  const getMarkerColor = (score) => {
    const s = Math.round(score);
    if (s >= 75) return '#dc2626'; // Severe (Red)
    if (s >= 50) return '#ea580c'; // High (Orange)
    if (s >= 25) return '#d97706'; // Moderate (Amber)
    return '#16a34a';             // Low (Green)
  };

  const getAssessmentForRegion = (regionId) => {
    return assessments.find(a => String(a.regionId?._id || a.regionId) === String(regionId));
  };

  return (
    <div className="h-[520px] w-full rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 relative shadow-sm">
      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {regions.map((region) => {
          const assessment = getAssessmentForRegion(region._id);
          const score = assessment?.scores?.composite ?? 20;
          const riskLevel = assessment?.riskLevel ?? 'Low';
          const color = getMarkerColor(score);

          return (
            <CircleMarker
              key={region._id}
              center={[region.lat, region.lng]}
              radius={14}
              pathOptions={{
                color: color,
                fillColor: color,
                fillOpacity: 0.65,
                weight: 2
              }}
            >
              <Tooltip permanent={false} direction="top">
                <div className="font-semibold text-xs">{region.name} ({riskLevel} Risk: {Math.round(score)})</div>
              </Tooltip>
              
              <Popup>
                <div className="p-1 min-w-[220px] font-sans">
                  <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-slate-200">
                    <h4 className="font-bold text-slate-900 text-sm">{region.name}</h4>
                    <RiskBadge level={riskLevel} score={score} />
                  </div>
                  
                  <p className="text-xs text-slate-600 mb-1"><strong>Type:</strong> {region.type}</p>
                  <p className="text-xs text-slate-600 mb-2"><strong>Population:</strong> {region.population?.toLocaleString()}</p>
                  
                  <p className="text-[11px] font-semibold text-slate-700 mb-1 uppercase tracking-wider">
                    View latest climate hazard breakdown
                  </p>

                  {assessment && (
                    <div className="grid grid-cols-2 gap-1 text-[11px] bg-slate-50 p-2 rounded border border-slate-200 mb-3 font-mono">
                      <div>Drought: <span className="font-bold">{assessment.scores.drought}</span></div>
                      <div>Heatwave: <span className="font-bold">{assessment.scores.heatwave}</span></div>
                      <div>Storm: <span className="font-bold">{assessment.scores.storm}</span></div>
                      <div>Flood: <span className="font-bold">{assessment.scores.flood}</span></div>
                    </div>
                  )}

                  {onAssessRegion && (
                    <button
                      onClick={() => onAssessRegion(region)}
                      className="w-full py-1.5 px-3 bg-slate-800 hover:bg-slate-900 text-white rounded text-xs font-medium transition-colors"
                    >
                      Run Telemetry Assessment
                    </button>
                  )}
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default RiskMap;
