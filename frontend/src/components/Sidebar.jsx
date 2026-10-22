import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  MapPin,
  PlusCircle,
  Users,
  ShieldAlert,
  Flame,
  CheckCircle,
  Clock,
  Download,
  Activity
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Sidebar = () => {
  const { user } = useAuth();
  if (!user) return null;

  const role = user.role;

  const navItemClass = ({ isActive }) =>
    `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition ${
      isActive
        ? 'bg-civic-50 text-civic-700 font-semibold'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
    }`;

  return (
    <aside className="w-64 bg-white border-r border-slate-200 min-h-[calc(100vh-4rem)] p-4 flex flex-col justify-between hidden md:flex">
      <div className="space-y-6">
        {/* Role indicator header */}
        <div className="px-3 py-2 bg-slate-50 rounded-lg border border-slate-200/60">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            {role === 'admin' ? 'Administration Portal' : role === 'officer' ? 'Field Operations' : 'Citizen Workspace'}
          </div>
          <div className="text-xs font-semibold text-slate-800 mt-0.5 truncate">{user.name}</div>
          {user.badge_number && (
            <div className="text-[10px] text-civic-600 font-mono mt-0.5">Badge #{user.badge_number}</div>
          )}
        </div>

        {/* Navigation list */}
        <nav className="space-y-1">
          {/* Admin Links */}
          {role === 'admin' && (
            <>
              <NavLink to="/admin" end className={navItemClass}>
                <LayoutDashboard className="w-4 h-4 text-civic-600" />
                Dashboard & KPIs
              </NavLink>
              <NavLink to="/admin/issues" className={navItemClass}>
                <FileText className="w-4 h-4 text-slate-500" />
                All Complaints
              </NavLink>
              <NavLink to="/map" className={navItemClass}>
                <MapPin className="w-4 h-4 text-rose-500" />
                GIS Map & Heatmap
              </NavLink>
              <NavLink to="/admin/users" className={navItemClass}>
                <Users className="w-4 h-4 text-emerald-500" />
                Officers & Users
              </NavLink>
              <NavLink to="/admin/audit-logs" className={navItemClass}>
                <Activity className="w-4 h-4 text-purple-500" />
                Audit Logs
              </NavLink>
            </>
          )}

          {/* Officer Links */}
          {role === 'officer' && (
            <>
              <NavLink to="/officer" end className={navItemClass}>
                <Clock className="w-4 h-4 text-blue-600" />
                Assigned Work Orders
              </NavLink>
              <NavLink to="/map" className={navItemClass}>
                <MapPin className="w-4 h-4 text-rose-500" />
                GIS Task Map
              </NavLink>
            </>
          )}

          {/* Citizen Links */}
          {role === 'citizen' && (
            <>
              <NavLink to="/citizen" end className={navItemClass}>
                <FileText className="w-4 h-4 text-civic-600" />
                My Complaints
              </NavLink>
              <NavLink to="/report" className={navItemClass}>
                <PlusCircle className="w-4 h-4 text-emerald-600" />
                Report New Issue
              </NavLink>
              <NavLink to="/map" className={navItemClass}>
                <MapPin className="w-4 h-4 text-rose-500" />
                Civic Issues Map
              </NavLink>
            </>
          )}
        </nav>
      </div>

      {/* Quick Info Box */}
      <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 text-xs text-blue-900 space-y-1">
        <div className="font-semibold flex items-center gap-1.5">
          <ShieldAlert className="w-3.5 h-3.5 text-blue-600" /> Civic Tech SLA
        </div>
        <p className="text-[11px] text-blue-700 leading-relaxed">
          Standard SLA for High/Urgent complaints is 24-48 hours. Photo verification required.
        </p>
      </div>
    </aside>
  );
};

export default Sidebar;
