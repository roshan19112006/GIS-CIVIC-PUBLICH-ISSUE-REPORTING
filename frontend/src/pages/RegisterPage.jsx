import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin, UserPlus, Lock, Mail, User, Phone, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import issueService from '../services/issueService';

export const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    ward_id: ''
  });
  const [wards, setWards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    issueService.getWards().then((res) => {
      if (res.data?.success) setWards(res.data.data || []);
    }).catch(() => {});
  }, []);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password) {
      setError('Please fill in all required fields.');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    setError(null);

    const res = await register({
      ...formData,
      ward_id: formData.ward_id ? parseInt(formData.ward_id, 10) : null
    });
    setLoading(false);

    if (res.success) {
      navigate('/citizen');
    } else {
      setError(res.message);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <div className="max-w-md w-full space-y-8 bg-white p-8 sm:p-10 rounded-2xl shadow-xl border border-slate-200">
        <div className="text-center">
          <div className="mx-auto w-12 h-12 rounded-xl bg-civic-600 flex items-center justify-center text-white shadow-md shadow-civic-500/30">
            <UserPlus className="w-7 h-7" />
          </div>
          <h2 className="mt-4 text-2xl font-black text-slate-900 tracking-tight">
            Create Citizen Account
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Join the transparent municipal civic issue tracking network
          </p>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                required
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. John Citizen"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-civic-500 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address *</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="email"
                required
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="citizen@gmail.com"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-civic-500 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+91 98765 43210"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-civic-500 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Residential Ward / Zone</label>
            <select
              name="ward_id"
              value={formData.ward_id}
              onChange={handleChange}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-civic-500 transition"
            >
              <option value="">Select your local ward (optional)</option>
              {wards.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.ward_number} — {w.ward_name} ({w.zone})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Password *</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                required
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="At least 6 characters"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-civic-500 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-lg bg-civic-600 hover:bg-civic-700 text-white font-semibold text-sm shadow-sm transition transform active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <UserPlus className="w-4 h-4" /> Create Account
              </>
            )}
          </button>
        </form>

        <div className="text-center text-xs text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-civic-600 hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
