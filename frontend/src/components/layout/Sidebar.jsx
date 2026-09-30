import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  MapPin, 
  Map as MapIcon, 
  ClipboardCheck,
  Sliders, 
  Bell, 
  FileText,
  BookOpen,
  ShieldCheck, 
  Globe,
  LogOut
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Sidebar = () => {
  const { user, logout } = useAuth();

  const navItems = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'Regions', path: '/regions', icon: MapPin },
    { label: 'Risk Map', path: '/map', icon: MapIcon },
    { label: 'Assessments', path: '/assessments', icon: ClipboardCheck },
    { label: 'Simulator', path: '/simulator', icon: Sliders },
    { label: 'Alerts', path: '/alerts', icon: Bell },
    { label: 'Reports', path: '/reports', icon: FileText },
    { label: 'Methodology', path: '/methodology', icon: BookOpen },
  ];

  if (user && user.role === 'Admin') {
    navItems.push({ label: 'Admin Panel', path: '/admin', icon: ShieldCheck });
  }

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col h-screen sticky top-0 border-r border-slate-800 shrink-0 z-30 font-sans">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-800 flex items-center gap-3">
        <div className="p-2 bg-slate-800 text-emerald-400 rounded border border-slate-700">
          <Globe className="w-5 h-5" />
        </div>
        <div>
          <h1 className="font-bold text-slate-100 text-base leading-tight tracking-tight">ClimateRisk Assessor</h1>
          <p className="text-[10px] text-slate-400 leading-snug">Resilience Planning System</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-slate-800 text-emerald-400 font-semibold border-l-2 border-emerald-500 pl-2.5'
                    : 'hover:bg-slate-800/60 text-slate-400 hover:text-slate-200'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* User Footer Profile */}
      {user && (
        <div className="p-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-7 h-7 rounded bg-slate-800 text-slate-200 flex items-center justify-center font-bold text-xs shrink-0 border border-slate-700">
              {user.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="truncate">
              <p className="text-xs font-medium text-slate-200 truncate leading-tight">{user.name}</p>
              <span className="text-[10px] text-slate-400 block font-mono">
                {user.role}
              </span>
            </div>
          </div>
          <button
            onClick={logout}
            title="Log Out"
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
