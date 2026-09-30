import React, { useState, useEffect } from 'react';
import { Moon, Sun, Bell, Database } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import API from '../../services/api';

const Header = ({ title = 'Climate Risk Overview' }) => {
  const { darkMode, toggleTheme } = useTheme();
  const { user } = useAuth();
  const [unreadAlerts, setUnreadAlerts] = useState(0);

  useEffect(() => {
    const fetchAlertCount = async () => {
      try {
        const res = await API.get('/alerts?status=new');
        setUnreadAlerts(res.data.length);
      } catch (err) {
        // silent catch
      }
    };
    fetchAlertCount();
  }, []);

  return (
    <header className="h-14 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 flex items-center justify-between sticky top-0 z-20 font-sans">
      <div>
        <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-tight">{title}</h2>
        <p className="text-[11px] text-slate-500 dark:text-slate-400">Monitor regional climate hazards and resilience indicators.</p>
      </div>

      <div className="flex items-center gap-3">
        {/* Data Source Badge */}
        <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
          <Database className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
          Data Source: Open-Meteo
        </span>

        {/* Dark Mode Toggle */}
        <button
          onClick={toggleTheme}
          className="p-1.5 rounded text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>

        {/* Alerts Notification Icon */}
        <a
          href="/alerts"
          className="relative p-1.5 rounded text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="System Alerts"
        >
          <Bell className="w-4 h-4" />
          {unreadAlerts > 0 && (
            <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-red-600 text-white rounded-full text-[9px] font-bold flex items-center justify-center">
              {unreadAlerts}
            </span>
          )}
        </a>

        {/* User Info Capsule */}
        <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-slate-200 dark:border-slate-800 text-xs">
          <span className="font-semibold text-slate-800 dark:text-slate-200">{user?.name}</span>
          <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[10px] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
            {user?.role}
          </span>
        </div>
      </div>
    </header>
  );
};

export default Header;
