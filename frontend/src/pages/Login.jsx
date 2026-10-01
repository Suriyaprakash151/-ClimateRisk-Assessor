import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Activity, ShieldCheck, UserCheck, Eye, LogIn } from 'lucide-react';
import Toast from '../components/common/Toast';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to authenticate');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setLoading(true);
    try {
      await login(demoEmail, demoPassword);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full bg-white border border-slate-200 rounded-xl shadow-sm p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-emerald-50 text-emerald-600 rounded-xl mb-1 border border-emerald-100">
            <Activity className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">
            <span className="text-slate-900">ClimateRisk </span>
            <span className="text-emerald-600">Assessor</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium">Enterprise Digital Climate Risk & Resilience Intelligence</p>
        </div>

        {error && <Toast message={error} type="error" onClose={() => setError('')} />}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@test.com"
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-medium transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-medium transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:bg-emerald-300 text-white rounded-lg font-bold text-sm shadow-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            {loading ? 'Authenticating...' : <><LogIn className="w-4 h-4" /> SIGN IN</>}
          </button>
        </form>

        {/* Demo Fast Login Accounts */}
        <div className="pt-4 border-t border-slate-100">
          <p className="text-[11px] text-center text-slate-500 mb-2.5 uppercase tracking-wider font-semibold">Quick Demo Login Accounts</p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleDemoLogin('admin@test.com', 'Admin@123')}
              className="px-2 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold flex flex-col items-center gap-1 transition-colors cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-purple-600" />
              <span>Admin</span>
            </button>
            <button
              type="button"
              onClick={() => handleDemoLogin('analyst@test.com', 'Analyst@123')}
              className="px-2 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold flex flex-col items-center gap-1 transition-colors cursor-pointer"
            >
              <UserCheck className="w-4 h-4 text-teal-600" />
              <span>Analyst</span>
            </button>
            <button
              type="button"
              onClick={() => handleDemoLogin('viewer@test.com', 'Viewer@123')}
              className="px-2 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold flex flex-col items-center gap-1 transition-colors cursor-pointer"
            >
              <Eye className="w-4 h-4 text-slate-500" />
              <span>Viewer</span>
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-slate-500">
          Don't have an account?{' '}
          <Link to="/register" className="text-emerald-700 font-bold hover:underline">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
