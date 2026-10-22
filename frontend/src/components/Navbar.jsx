import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { MapPin, PlusCircle, LogIn, UserPlus, LogOut, LayoutDashboard, Shield, Wrench, User, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import NotificationDropdown from './NotificationDropdown';

export const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getDashboardPath = () => {
    if (!user) return '/login';
    if (user.role === 'admin') return '/admin';
    if (user.role === 'officer') return '/officer';
    return '/citizen';
  };

  const roleBadgeConfig = {
    admin: { label: 'Administrator', bg: 'bg-rose-100 text-rose-800 border-rose-200', icon: Shield },
    officer: { label: 'Field Officer', bg: 'bg-blue-100 text-blue-800 border-blue-200', icon: Wrench },
    citizen: { label: 'Citizen', bg: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: User }
  };

  const RoleIcon = user?.role && roleBadgeConfig[user.role]?.icon ? roleBadgeConfig[user.role].icon : User;

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200/90 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-civic-600 flex items-center justify-center text-white shadow-sm shadow-civic-500/20 group-hover:bg-civic-700 transition">
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <span className="text-lg font-black text-slate-900 tracking-tight block leading-tight">
                Civic<span className="text-civic-600">GIS</span>
              </span>
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block leading-none">
                Chennai Municipal Corporation
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link
              to="/"
              className={`text-sm font-medium transition ${
                location.pathname === '/' ? 'text-civic-600' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Overview
            </Link>
            <Link
              to="/map"
              className={`text-sm font-medium transition ${
                location.pathname === '/map' ? 'text-civic-600' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              GIS Explorer
            </Link>

            {isAuthenticated ? (
              <Link
                to={getDashboardPath()}
                className={`text-sm font-medium transition flex items-center gap-1.5 ${
                  location.pathname.startsWith('/admin') ||
                  location.pathname.startsWith('/officer') ||
                  location.pathname.startsWith('/citizen')
                    ? 'text-civic-600 font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </Link>
            ) : null}

            {/* Quick Action: Report Issue */}
            <Link
              to="/report"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-civic-600 hover:bg-civic-700 text-white text-xs font-semibold shadow-sm shadow-civic-600/30 transition hover:shadow-md active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              Report Issue
            </Link>
          </nav>

          {/* Right Action Area */}
          <div className="hidden md:flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <NotificationDropdown />

                <div className="h-6 w-px bg-slate-200" />

                {/* User profile & role pill */}
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-xs font-bold text-slate-900 leading-tight">{user.name}</div>
                    <span
                      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold border ${
                        roleBadgeConfig[user.role]?.bg || 'bg-slate-100'
                      }`}
                    >
                      <RoleIcon className="w-2.5 h-2.5" />
                      {roleBadgeConfig[user.role]?.label || user.role}
                    </span>
                  </div>

                  <button
                    onClick={handleLogout}
                    className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                    title="Sign Out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center gap-2 md:hidden">
            {isAuthenticated && <NotificationDropdown />}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-5 space-y-3">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm font-medium text-slate-700 hover:text-civic-600"
          >
            Overview
          </Link>
          <Link
            to="/map"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm font-medium text-slate-700 hover:text-civic-600"
          >
            GIS Explorer
          </Link>
          <Link
            to="/report"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm font-semibold text-civic-600"
          >
            + Report Civic Issue
          </Link>

          {isAuthenticated ? (
            <>
              <Link
                to={getDashboardPath()}
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-sm font-medium text-slate-700 hover:text-civic-600"
              >
                Dashboard ({user.name})
              </Link>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full text-left py-2 text-sm font-medium text-rose-600"
              >
                Sign Out
              </button>
            </>
          ) : (
            <div className="pt-2 flex flex-col gap-2">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2 text-sm font-medium bg-slate-100 text-slate-800 rounded-lg"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2 text-sm font-medium bg-civic-600 text-white rounded-lg"
              >
                Register Citizen Account
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};

export default Navbar;
