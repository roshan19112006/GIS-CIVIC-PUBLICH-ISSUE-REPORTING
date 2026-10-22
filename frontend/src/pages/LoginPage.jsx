import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { MapPin, LogIn, Lock, Mail, ShieldAlert, Sparkles, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(
    new URLSearchParams(location.search).get('expired') ? 'Your session has expired. Please sign in again.' : null
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setLoading(true);
    setError(null);

    const res = await login(email, password);
    setLoading(false);

    if (res.success) {
      if (res.user.role === 'admin') navigate('/admin');
      else if (res.user.role === 'officer') navigate('/officer');
      else navigate('/citizen');
    } else {
      setError(res.message);
    }
  };

  const handleDemoFill = (demoEmail) => {
    setEmail(demoEmail);
    setPassword('Password@123');
    setError(null);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <div className="max-w-md w-full space-y-8 bg-white p-8 sm:p-10 rounded-2xl shadow-xl border border-slate-200">
        <div className="text-center">
          <div className="mx-auto w-12 h-12 rounded-xl bg-civic-600 flex items-center justify-center text-white shadow-md shadow-civic-500/30">
            <MapPin className="w-7 h-7" />
          </div>
          <h2 className="mt-4 text-2xl font-black text-slate-900 tracking-tight">
            Sign In to CivicGIS
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Civic Issue Reporting & Municipal Management Platform
          </p>
        </div>

        {/* Demo Accounts Quick-Select for College Evaluators */}
        <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2">
          <div className="text-[11px] font-bold text-blue-900 flex items-center gap-1.5 uppercase tracking-wide">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" /> College Evaluation Quick Fill:
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleDemoFill('admin@civic.gov')}
              className="px-2 py-1.5 bg-white hover:bg-rose-50 text-rose-800 border border-rose-200 rounded text-[11px] font-semibold transition"
            >
              👑 Admin
            </button>
            <button
              type="button"
              onClick={() => handleDemoFill('officer.roads@civic.gov')}
              className="px-2 py-1.5 bg-white hover:bg-blue-50 text-blue-800 border border-blue-200 rounded text-[11px] font-semibold transition"
            >
              👷 Officer
            </button>
            <button
              type="button"
              onClick={() => handleDemoFill('citizen@gmail.com')}
              className="px-2 py-1.5 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-200 rounded text-[11px] font-semibold transition"
            >
              👤 Citizen
            </button>
          </div>
          <div className="text-[10px] text-blue-700 text-center">
            Password for all accounts is: <code className="bg-white px-1 py-0.5 rounded font-mono font-bold">Password@123</code>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@domain.com"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-civic-500 focus:border-transparent transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-civic-500 focus:border-transparent transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-lg bg-civic-600 hover:bg-civic-700 text-white font-semibold text-sm shadow-sm transition transform active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <LogIn className="w-4 h-4" /> Sign In
              </>
            )}
          </button>
        </form>

        <div className="text-center text-xs text-slate-500">
          Don't have a citizen account?{' '}
          <Link to="/register" className="font-semibold text-civic-600 hover:underline">
            Register now
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
