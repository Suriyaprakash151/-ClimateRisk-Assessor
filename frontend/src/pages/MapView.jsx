import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import LoadingSpinner from '../components/common/LoadingSpinner';
import RiskMap from '../components/map/RiskMap';
import API from '../services/api';
import Toast from '../components/common/Toast';
import { Layers, ShieldCheck, MapPin } from 'lucide-react';

const MapView = () => {
  const [regions, setRegions] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchMapData();
  }, []);

  const fetchMapData = async () => {
    setLoading(true);
    try {
      const [regRes, assRes] = await Promise.all([
        API.get('/regions'),
        API.get('/assessments')
      ]);
      setRegions(regRes.data);
      setAssessments(assRes.data);
    } catch (err) {
      setToast({ message: 'Failed to load geospatial telemetry', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleAssessRegion = async (region) => {
    try {
      await API.post('/assessments', { regionId: region._id });
      setToast({ message: `Telemetry re-assessed for ${region.name}`, type: 'success' });
      fetchMapData();
    } catch (err) {
      setToast({ message: 'Assessment failed', type: 'error' });
    }
  };

  if (loading) {
    return (
      <Layout title="Geospatial Risk Map">
        <LoadingSpinner label="Loading Leaflet map layers and region markers..." />
      </Layout>
    );
  }

  return (
    <Layout title="Geospatial Risk Map">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-emerald-500" />
          <div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">Interactive Risk Layer Map</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Click any marker to view real-time hazard breakdown and popups</p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs font-medium">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span> Low (&lt;30)</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-amber-500 inline-block"></span> Moderate (30-54)</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-orange-500 inline-block"></span> High (55-74)</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-rose-500 inline-block"></span> Severe (&ge;75)</span>
        </div>
      </div>

      <div className="h-[620px] w-full">
        <RiskMap regions={regions} assessments={assessments} onAssessRegion={handleAssessRegion} />
      </div>
    </Layout>
  );
};

export default MapView;
