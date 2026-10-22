import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  MapPin,
  Camera,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Layers,
  Clock,
  Star,
  Users,
  Compass
} from 'lucide-react';
import issueService from '../services/issueService';
import { useAuth } from '../context/AuthContext';
import CivicMap from '../components/CivicMap';

export const LandingPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    assigned: 0,
    in_progress: 0,
    resolved: 0,
    slaComplianceRate: 100,
    avgRating: 0
  });
  const [categories, setCategories] = useState([]);
  const [mapMarkers, setMapMarkers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, catRes, gisRes] = await Promise.all([
          issueService.getStats(),
          issueService.getCategories(),
          issueService.getGisIssues()
        ]);

        if (statsRes.data?.success) setStats(statsRes.data.data);
        if (catRes.data?.success) setCategories(catRes.data.data || []);
        if (gisRes.data?.success) setMapMarkers(gisRes.data.data || []);
      } catch (err) {
        console.warn('Landing data fetch:', err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleQuickDemoLogin = async (email) => {
    const res = await login(email, 'Password@123');
    if (res.success) {
      if (res.user.role === 'admin') navigate('/admin');
      else if (res.user.role === 'officer') navigate('/officer');
      else navigate('/citizen');
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800 text-white pt-20 pb-28 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Subtle grid pattern background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-civic-500/10 border border-civic-400/30 text-civic-300 text-xs font-semibold uppercase tracking-wider mb-6">
            <Sparkles className="w-3.5 h-3.5 text-civic-400" /> Greater Chennai Corporation (GCC) Civic GIS
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight max-w-4xl mx-auto leading-tight sm:leading-tight">
            Transparent, GIS-Powered <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-blue-400 via-civic-400 to-teal-300 bg-clip-text text-transparent">
              Civic Issue Resolution
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Empowering citizens to report municipal distress with real GPS coordinates and photos, while providing city administrators and field officers intelligent dispatch and verification tools.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/report"
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-civic-600 hover:bg-civic-500 text-white font-semibold text-sm shadow-lg shadow-civic-600/30 transition transform active:scale-95 flex items-center justify-center gap-2"
            >
              <Camera className="w-4 h-4" /> Report an Issue Now
            </Link>
            <Link
              to="/map"
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-semibold text-sm transition flex items-center justify-center gap-2"
            >
              <Compass className="w-4 h-4 text-civic-400" /> Explore GIS Map
            </Link>
          </div>

          {/* Quick Demo Access Bar */}
          <div className="mt-12 max-w-2xl mx-auto p-3 bg-slate-800/80 backdrop-blur-md rounded-2xl border border-slate-700/80 shadow-xl">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
              ⚡ College Evaluation — Instant 1-Click Demo Login:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                onClick={() => handleQuickDemoLogin('admin@civic.gov')}
                className="px-3 py-2 bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/60 rounded-lg text-xs font-semibold transition"
              >
                👑 Admin Portal
              </button>
              <button
                onClick={() => handleQuickDemoLogin('officer.roads@civic.gov')}
                className="px-3 py-2 bg-blue-950/60 hover:bg-blue-900/80 text-blue-300 border border-blue-800/60 rounded-lg text-xs font-semibold transition"
              >
                👷 Field Officer
              </button>
              <button
                onClick={() => handleQuickDemoLogin('citizen@gmail.com')}
                className="px-3 py-2 bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-800/60 rounded-lg text-xs font-semibold transition"
              >
                👤 Citizen Portal
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Live Statistics Counter based on real database records */}
      <section className="-mt-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-white p-6 rounded-2xl shadow-xl border border-slate-200/80">
          <div className="text-center p-3 border-r border-slate-100 last:border-none">
            <div className="text-2xl sm:text-3xl font-black text-slate-900">
              {loading ? '...' : stats.total}
            </div>
            <div className="text-xs font-medium text-slate-500 mt-1">Total Reported Issues</div>
          </div>
          <div className="text-center p-3 border-r border-slate-100 last:border-none">
            <div className="text-2xl sm:text-3xl font-black text-emerald-600">
              {loading ? '...' : stats.resolved}
            </div>
            <div className="text-xs font-medium text-slate-500 mt-1">Issues Resolved</div>
          </div>
          <div className="text-center p-3 border-r border-slate-100 last:border-none">
            <div className="text-2xl sm:text-3xl font-black text-civic-600">
              {loading ? '...' : `${stats.slaComplianceRate}%`}
            </div>
            <div className="text-xs font-medium text-slate-500 mt-1">SLA Compliance</div>
          </div>
          <div className="text-center p-3">
            <div className="text-2xl sm:text-3xl font-black text-amber-500 flex items-center justify-center gap-1">
              {loading ? '...' : stats.avgRating > 0 ? stats.avgRating : '5.0'}
              <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
            </div>
            <div className="text-xs font-medium text-slate-500 mt-1">Citizen Satisfaction</div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-xs font-bold text-civic-600 tracking-wider uppercase">How It Works</h2>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            End-to-End Civic Resolution Lifecycle
          </h3>
          <p className="text-sm text-slate-500 mt-2">
            Every step is authenticated, geolocated, and tracked with verifiable photographic evidence.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition">
            <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-black text-lg mb-4">
              1
            </div>
            <h4 className="text-base font-bold text-slate-900 mb-2">Capture & Geotag</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Citizens capture photos, detect high-precision GPS coordinates, or pick location on the interactive map with reverse geocoding.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition">
            <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-black text-lg mb-4">
              2
            </div>
            <h4 className="text-base font-bold text-slate-900 mb-2">Admin Dispatch</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Municipal administrators review the ticket, assess priority, set SLA deadlines, and dispatch a work order to the zonal field officer.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition">
            <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-black text-lg mb-4">
              3
            </div>
            <h4 className="text-base font-bold text-slate-900 mb-2">Field Officer Resolves</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Officers inspect on site, execute repairs, and upload mandatory completion photographic evidence with resolution notes.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black text-lg mb-4">
              4
            </div>
            <h4 className="text-base font-bold text-slate-900 mb-2">Citizen Verifies & Rates</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Citizens review the resolution photo, submit star ratings, or reopen complaints if repairs are unsatisfactory.
            </p>
          </div>
        </div>
      </section>

      {/* Civic Issue Categories */}
      <section className="py-16 bg-slate-100/60 px-4 sm:px-6 lg:px-8 border-y border-slate-200/60">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-xs font-bold text-civic-600 tracking-wider uppercase">Municipal Coverage</h2>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
              Civic Categories Managed
            </h3>
            <p className="text-sm text-slate-500 mt-2">
              Issues are automatically mapped to designated municipal departments with tailored SLA targets.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs hover:border-civic-300 hover:shadow-sm transition"
              >
                <div className="flex items-center justify-between mb-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: cat.color_code || '#026fc7' }}
                  >
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    SLA: {cat.sla_hours}h
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-900">{cat.name}</h4>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                  {cat.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Live GIS Map Preview */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-8 gap-4">
          <div>
            <h2 className="text-xs font-bold text-civic-600 tracking-wider uppercase">Geographic Information System</h2>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
              Live Civic Complaint Map
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              Interactive map visualizing real complaints persisted in the MySQL database.
            </p>
          </div>
          <Link
            to="/map"
            className="inline-flex items-center gap-1 text-sm font-semibold text-civic-600 hover:text-civic-700 hover:underline"
          >
            Open Full GIS Platform &rarr;
          </Link>
        </div>

        <CivicMap
          markers={mapMarkers}
          height="450px"
          showHeatmapToggle={true}
        />
      </section>

      {/* CTA Banner */}
      <section className="bg-civic-700 text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Ready to improve your neighborhood?
          </h2>
          <p className="text-civic-100 text-sm sm:text-base max-w-2xl mx-auto">
            Report civic issues in less than 60 seconds with your smartphone camera and GPS location.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/report"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white text-civic-800 font-bold text-sm shadow-md hover:bg-civic-50 transition"
            >
              Submit Civic Complaint
            </Link>
            <Link
              to="/register"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-civic-800/80 hover:bg-civic-900 text-white font-bold text-sm border border-civic-600 transition"
            >
              Create Citizen Account
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
