import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  MapPin,
  Camera,
  Upload,
  AlertCircle,
  Navigation,
  CheckCircle,
  HelpCircle,
  ArrowRight,
  ShieldCheck,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import issueService from '../services/issueService';
import CivicMap from '../components/CivicMap';

export const ReportIssuePage = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [wards, setWards] = useState([]);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [wardId, setWardId] = useState('');
  const [priority, setPriority] = useState('medium');
  const [address, setAddress] = useState('Ripon Building, Periyamet, Chennai, Tamil Nadu 600003');
  const [locationType, setLocationType] = useState('gps');
  const [coords, setCoords] = useState({ lat: 13.0827, lng: 80.2707 }); // Chennai GCC Center
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const [loading, setLoading] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [error, setError] = useState(null);
  const [successData, setSuccessData] = useState(null);

  useEffect(() => {
    // If not authenticated, redirect to login with return url
    if (!isAuthenticated) {
      navigate('/login?redirect=/report');
      return;
    }

    // Load categories & wards
    Promise.all([issueService.getCategories(), issueService.getWards()])
      .then(([catRes, wardRes]) => {
        if (catRes.data?.success) {
          setCategories(catRes.data.data || []);
          if (catRes.data.data.length > 0) {
            setCategoryId(catRes.data.data[0].id);
            setPriority(catRes.data.data[0].default_priority || 'medium');
          }
        }
        if (wardRes.data?.success) setWards(wardRes.data.data || []);
      })
      .catch((err) => console.error(err));

    // Try auto-detect location on initial load if permitted
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setCoords({ lat, lng });
          setLocationType('gps');
          resolveAddress(lat, lng);
        },
        () => {}, // ignore if denied initially
        { timeout: 5000 }
      );
    }
  }, [isAuthenticated]);

  const resolveAddress = async (lat, lng) => {
    setGeocoding(true);
    try {
      const resolved = await issueService.reverseGeocode(lat, lng);
      setAddress(resolved);
    } catch (e) {
      console.warn(e);
    } finally {
      setGeocoding(false);
    }
  };

  const handleLocationSelect = ({ lat, lng, type }) => {
    setCoords({ lat, lng });
    setLocationType(type);
    resolveAddress(lat, lng);
  };

  const handleCategoryChange = (e) => {
    const selectedId = e.target.value;
    setCategoryId(selectedId);
    const cat = categories.find((c) => String(c.id) === String(selectedId));
    if (cat) {
      setPriority(cat.default_priority || 'medium');
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Image file is too large. Maximum size allowed is 5MB.');
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setError(null);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim() || !description.trim() || !categoryId) {
      setError('Please provide a title, description, and issue category.');
      return;
    }

    if (!coords.lat || !coords.lng) {
      setError('Geographic location coordinates are required.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('category_id', categoryId);
      if (wardId) formData.append('ward_id', wardId);
      formData.append('priority', priority);
      formData.append('latitude', coords.lat);
      formData.append('longitude', coords.lng);
      formData.append('location_type', locationType);
      formData.append('address', address.trim());

      if (imageFile) {
        formData.append('image', imageFile);
      }

      const res = await issueService.createIssue(formData);

      if (res.data?.success) {
        setSuccessData(res.data.issue);
      } else {
        setError(res.data?.message || 'Failed to submit complaint.');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to submit complaint to the server.');
    } finally {
      setLoading(false);
    }
  };

  if (successData) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 sm:px-6">
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-200 text-center space-y-6">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Complaint Registered Successfully!
            </h2>
            <p className="text-sm text-slate-600">
              Your civic distress report has been securely saved and dispatched for municipal review.
            </p>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl max-w-md mx-auto text-left space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 font-semibold uppercase">Unique Ticket ID</span>
              <span className="font-mono font-bold text-civic-700 bg-civic-50 px-2 py-0.5 rounded border border-civic-200">
                {successData.ticket_id}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 font-semibold">Status</span>
              <span className="font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 uppercase text-[10px]">
                {successData.status}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 font-semibold">Priority</span>
              <span className="font-semibold text-slate-800 capitalize">
                {successData.priority}
              </span>
            </div>
            {successData.deadline && (
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-semibold">SLA Target</span>
                <span className="font-semibold text-slate-800">
                  {new Date(successData.deadline).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Link
              to={`/issues/${successData.id}`}
              className="px-5 py-2.5 bg-civic-600 hover:bg-civic-700 text-white rounded-lg text-xs font-semibold shadow-sm transition flex items-center justify-center gap-1.5"
            >
              Track Complaint Status <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <button
              onClick={() => {
                setSuccessData(null);
                setTitle('');
                setDescription('');
                setImageFile(null);
                setImagePreview(null);
              }}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition"
            >
              Report Another Issue
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Report a Civic Issue
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Provide issue photographs, exact GPS coordinates, and clear details for swift municipal dispatch.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Form Details & Image */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-5">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
              1. Issue Information
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Category *
              </label>
              <select
                value={categoryId}
                onChange={handleCategoryChange}
                required
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-civic-500 transition"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} (SLA: {c.sla_hours} hrs)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Complaint Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Deep pothole causing skidding near bus stop"
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-civic-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Detailed Description *
              </label>
              <textarea
                required
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the severity, duration, and any hazards to pedestrians or vehicular traffic..."
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-civic-500 transition"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Urgency / Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:bg-white"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ward / Zone
                </label>
                <select
                  value={wardId}
                  onChange={(e) => setWardId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:bg-white"
                >
                  <option value="">Select Ward</option>
                  {wards.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.ward_number} - {w.ward_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Photograph Upload Card */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center justify-between">
              <span>2. Upload Issue Photograph</span>
              <span className="text-[10px] text-slate-400 font-normal">Max 5MB (JPEG, PNG, WebP)</span>
            </h3>

            {imagePreview ? (
              <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-900">
                <img
                  src={imagePreview}
                  alt="Complaint Preview"
                  className="w-full h-56 object-contain"
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute top-3 right-3 p-1.5 bg-rose-600 text-white rounded-full hover:bg-rose-700 shadow-md transition"
                  title="Remove Image"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="border-2 border-dashed border-slate-300 hover:border-civic-500 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer bg-slate-50/60 hover:bg-civic-50/30 transition">
                <Camera className="w-10 h-10 text-slate-400 mb-2" />
                <span className="text-xs font-semibold text-slate-700">Click to upload or take a photo</span>
                <span className="text-[10px] text-slate-400 mt-1">High quality photos help officers locate and verify issues faster</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            )}
          </div>
        </div>

        {/* Right Column: GIS Coordinates & Map Selection */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">
                3. GIS Location Tagging
              </h3>
              <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                {locationType === 'gps' ? '🛰️ GPS Captured' : '📍 Map Pinned'}
              </span>
            </div>

            <p className="text-xs text-slate-500">
              Click anywhere on the interactive map below or use the GPS button to detect your current location.
            </p>

            {/* Interactive Picker Map */}
            <CivicMap
              center={[coords.lat, coords.lng]}
              zoom={15}
              selectedLocation={coords}
              onLocationSelect={handleLocationSelect}
              interactiveSelection={true}
              height="280px"
            />

            {/* Coordinates Fields */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Latitude</label>
                <input
                  type="number"
                  step="any"
                  readOnly
                  value={coords.lat.toFixed(6)}
                  className="w-full px-2.5 py-1.5 bg-slate-100 border border-slate-200 rounded text-xs font-mono font-bold text-slate-800"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Longitude</label>
                <input
                  type="number"
                  step="any"
                  readOnly
                  value={coords.lng.toFixed(6)}
                  className="w-full px-2.5 py-1.5 bg-slate-100 border border-slate-200 rounded text-xs font-mono font-bold text-slate-800"
                />
              </div>
            </div>

            {/* Street Address */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Resolved Street Address {geocoding && <span className="text-civic-600 text-[10px]">(Resolving...)</span>}
              </label>
              <textarea
                rows={3}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Street address / landmark / cross-road description..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:bg-white"
              />
              <span className="text-[10px] text-slate-400 block mt-0.5">
                Automatically reverse-geocoded from OpenStreetMap. You can edit this field for precision.
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-civic-600 hover:bg-civic-700 text-white font-bold text-sm shadow-md shadow-civic-600/30 transition transform active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 mt-4"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Submitting to Municipal Database...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" /> Submit Civic Complaint
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ReportIssuePage;
