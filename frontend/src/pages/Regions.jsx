import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import LoadingSpinner from '../components/common/LoadingSpinner';
import RiskBadge from '../components/common/RiskBadge';
import Toast from '../components/common/Toast';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Plus, RefreshCw, Trash2, Edit3, MapPin, Play, X, Eye } from 'lucide-react';

const Regions = () => {
  const { user } = useAuth();
  const [regions, setRegions] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState(null);

  // Selected Region for Detail Modal
  const [viewingRegion, setViewingRegion] = useState(null);

  // Form Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRegion, setEditingRegion] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'City',
    lat: '',
    lng: '',
    population: '',
    areaSqKm: '',
    notes: ''
  });

  const isEditable = user?.role === 'Admin' || user?.role === 'Analyst';
  const isAdmin = user?.role === 'Admin';

  useEffect(() => {
    fetchRegionsAndAssessments();
  }, []);

  const fetchRegionsAndAssessments = async () => {
    setLoading(true);
    try {
      const [regRes, assRes] = await Promise.all([
        API.get('/regions'),
        API.get('/assessments')
      ]);
      setRegions(regRes.data);
      setAssessments(assRes.data);
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Failed to fetch regions', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (region = null) => {
    if (region) {
      setEditingRegion(region);
      setFormData({
        name: region.name,
        type: region.type,
        lat: region.lat,
        lng: region.lng,
        population: region.population || '',
        areaSqKm: region.areaSqKm || '',
        notes: region.notes || ''
      });
    } else {
      setEditingRegion(null);
      setFormData({
        name: '',
        type: 'City',
        lat: '',
        lng: '',
        population: '',
        areaSqKm: '',
        notes: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingRegion(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      if (editingRegion) {
        await API.put(`/regions/${editingRegion._id}`, formData);
        setToast({ message: `Region '${formData.name}' updated successfully`, type: 'success' });
      } else {
        await API.post('/regions', formData);
        setToast({ message: `Region '${formData.name}' registered & telemetry synced!`, type: 'success' });
      }
      handleCloseModal();
      fetchRegionsAndAssessments();
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Operation failed', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete region '${name}'?`)) return;
    try {
      await API.delete(`/regions/${id}`);
      setToast({ message: `Region '${name}' removed successfully`, type: 'success' });
      fetchRegionsAndAssessments();
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Delete failed', type: 'error' });
    }
  };

  const handleForceSync = async (regionId, name) => {
    setActionLoading(true);
    try {
      await API.post(`/climate/${regionId}`);
      setToast({ message: `Open-Meteo telemetry refreshed for ${name}!`, type: 'success' });
      fetchRegionsAndAssessments();
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Sync failed', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRunAssessment = async (regionId, name) => {
    setActionLoading(true);
    try {
      await API.post('/assessments', { regionId });
      setToast({ message: `Assessment computed for ${name}!`, type: 'success' });
      fetchRegionsAndAssessments();
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Assessment trigger failed', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const getLatestAssessment = (regionId) => {
    return assessments.find(a => String(a.regionId?._id || a.regionId) === String(regionId));
  };

  if (loading) {
    return (
      <Layout title="Region Registry">
        <LoadingSpinner label="Loading territory registry data table..." />
      </Layout>
    );
  }

  return (
    <Layout title="Region Registry">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Geographic regions monitored for climate hazard assessments and resilience planning.
        </p>
        {isEditable && (
          <button
            onClick={() => handleOpenModal()}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded text-xs font-semibold flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" /> Add Region
          </button>
        )}
      </div>

      {/* Clean Enterprise Data Table */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="p-3">Region Name</th>
                <th className="p-3">Type</th>
                <th className="p-3">Location</th>
                <th className="p-3">Latest Risk Score</th>
                <th className="p-3">Risk Level</th>
                <th className="p-3">Last Assessment</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {regions.map((region) => {
                const ass = getLatestAssessment(region._id);
                return (
                  <tr key={region._id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/40 transition-colors">
                    <td className="p-3 font-bold text-slate-900 dark:text-slate-100">{region.name}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px]">
                        {region.type}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-[11px] text-slate-500">
                      {region.lat.toFixed(3)}°N, {region.lng.toFixed(3)}°E
                    </td>
                    <td className="p-3 font-mono font-bold">
                      {ass ? `${ass.scores?.composite} / 100` : 'N/A'}
                    </td>
                    <td className="p-3">
                      {ass ? (
                        <RiskBadge level={ass.riskLevel} score={ass.scores?.composite} />
                      ) : (
                        <span className="text-slate-400 italic">Unassessed</span>
                      )}
                    </td>
                    <td className="p-3 font-mono text-[11px] text-slate-400">
                      {ass ? new Date(ass.createdAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="p-3 text-right space-x-1.5">
                      <button
                        onClick={() => setViewingRegion(region)}
                        title="View Region Details"
                        className="p-1 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleForceSync(region._id, region.name)}
                        disabled={actionLoading}
                        title="Force Open-Meteo Sync"
                        className="p-1 text-slate-500 hover:text-emerald-600"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>

                      {isEditable && (
                        <button
                          onClick={() => handleRunAssessment(region._id, region.name)}
                          disabled={actionLoading}
                          title="Run Risk Assessment"
                          className="px-2 py-1 bg-emerald-600/10 hover:bg-emerald-600 text-emerald-700 dark:text-emerald-300 hover:text-white rounded text-[11px] font-semibold transition-colors"
                        >
                          Assess
                        </button>
                      )}

                      {isEditable && (
                        <button
                          onClick={() => handleOpenModal(region)}
                          title="Edit Region"
                          className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      )}

                      {isAdmin && (
                        <button
                          onClick={() => handleDelete(region._id, region.name)}
                          title="Delete Region"
                          className="p-1 text-slate-400 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Region Detail Modal */}
      {viewingRegion && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg max-w-2xl w-full p-6 shadow-xl space-y-4 font-sans">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">{viewingRegion.name} Detailed Profile</h3>
                <p className="text-xs text-slate-500">Type: {viewingRegion.type} | Coordinates: {viewingRegion.lat}°, {viewingRegion.lng}°</p>
              </div>
              <button onClick={() => setViewingRegion(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded border">
                <div>Population: <span className="font-bold">{viewingRegion.population?.toLocaleString() || 'N/A'}</span></div>
                <div>Area: <span className="font-bold">{viewingRegion.areaSqKm || '100'} sq km</span></div>
              </div>

              {viewingRegion.notes && (
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded border">
                  <span className="font-bold block mb-1">Vulnerability Notes:</span>
                  <p className="text-slate-600 dark:text-slate-300 italic">{viewingRegion.notes}</p>
                </div>
              )}
            </div>

            <div className="text-right pt-2 border-t border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setViewingRegion(null)}
                className="px-4 py-1.5 bg-slate-800 text-white rounded text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Region Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                {editingRegion ? 'Edit Region' : 'Register New Region'}
              </h3>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">Region Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Bangalore"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-xs"
                  >
                    <option value="City">City</option>
                    <option value="District">District</option>
                    <option value="Industrial Site">Industrial Site</option>
                    <option value="Farmland">Farmland</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">Population</label>
                  <input
                    type="number"
                    value={formData.population}
                    onChange={(e) => setFormData({ ...formData, population: e.target.value })}
                    placeholder="12000000"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">Latitude (°N)</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={formData.lat}
                    onChange={(e) => setFormData({ ...formData, lat: e.target.value })}
                    placeholder="12.9716"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">Longitude (°E)</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={formData.lng}
                    onChange={(e) => setFormData({ ...formData, lng: e.target.value })}
                    placeholder="77.5946"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">Notes</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Urban tech corridor..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-1.5 bg-emerald-600 text-white rounded text-xs font-semibold hover:bg-emerald-500"
                >
                  {actionLoading ? 'Saving...' : editingRegion ? 'Update' : 'Create & Sync'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Regions;
