import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  MapPin,
  Filter,
  Flame,
  Layers,
  ArrowRight,
  ExternalLink,
  Search,
  CheckCircle,
  AlertCircle,
  Camera,
  Compass
} from 'lucide-react';
import issueService from '../services/issueService';
import CivicMap from '../components/CivicMap';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';

export const GISMapPage = () => {
  const [issues, setIssues] = useState([]);
  const [categories, setCategories] = useState([]);
  const [wards, setWards] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [wardFilter, setWardFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  // Selected issue for preview drawer
  const [activeIssue, setActiveIssue] = useState(null);

  const fetchGisData = async () => {
    setLoading(true);
    try {
      const [gisRes, catRes, wardRes] = await Promise.all([
        issueService.getGisIssues({
          status: statusFilter || undefined,
          category_id: categoryFilter || undefined,
          ward_id: wardFilter || undefined,
          priority: priorityFilter || undefined
        }),
        issueService.getCategories(),
        issueService.getWards()
      ]);

      if (gisRes.data?.success) setIssues(gisRes.data.data || []);
      if (catRes.data?.success) setCategories(catRes.data.data || []);
      if (wardRes.data?.success) setWards(wardRes.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGisData();
  }, [statusFilter, categoryFilter, wardFilter, priorityFilter]);

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden bg-slate-100">
      {/* Top Filter Header Bar */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 shrink-0 flex flex-wrap items-center justify-between gap-4 z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-civic-50 flex items-center justify-center text-civic-600">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-black text-slate-900 leading-tight">
              Civic GIS Geospatial Explorer
            </h1>
            <p className="text-[11px] text-slate-500">
              Showing {issues.length} geocoded municipal complaints
            </p>
          </div>
        </div>

        {/* Filter Selects */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700"
          >
            <option value="">Status: All</option>
            <option value="pending">Pending</option>
            <option value="assigned">Assigned</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="reopened">Reopened</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700"
          >
            <option value="">Category: All</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <select
            value={wardFilter}
            onChange={(e) => setWardFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700"
          >
            <option value="">Ward: All</option>
            {wards.map((w) => (
              <option key={w.id} value={w.id}>{w.ward_number} - {w.ward_name}</option>
            ))}
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700"
          >
            <option value="">Priority: All</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Main Map Canvas Area */}
      <div className="flex-1 relative">
        <CivicMap
          markers={issues}
          height="100%"
          showHeatmapToggle={true}
          onMarkerClick={(issue) => setActiveIssue(issue)}
        />

        {/* Selected Marker Slide-In Drawer */}
        {activeIssue && (
          <div className="absolute top-4 left-4 z-[1000] max-w-sm w-full bg-white rounded-2xl shadow-2xl border border-slate-200 p-5 space-y-4 animate-in slide-in-from-left duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="font-mono text-xs font-bold text-civic-700 bg-civic-50 px-2 py-0.5 rounded border border-civic-200">
                {activeIssue.ticket_id}
              </span>
              <button
                onClick={() => setActiveIssue(null)}
                className="text-slate-400 hover:text-slate-700 text-base font-bold"
              >
                &times;
              </button>
            </div>

            {activeIssue.thumbnail_url && (
              <img
                src={activeIssue.thumbnail_url}
                alt="Complaint"
                className="w-full h-36 object-cover rounded-xl border border-slate-200"
              />
            )}

            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <StatusBadge status={activeIssue.status} />
                <PriorityBadge priority={activeIssue.priority} />
              </div>

              <h3 className="text-sm font-bold text-slate-900">
                {activeIssue.title}
              </h3>

              <p className="text-xs text-slate-600 line-clamp-3">
                {activeIssue.description}
              </p>

              {activeIssue.address && (
                <div className="text-xs text-slate-500 pt-1">
                  📍 {activeIssue.address}
                </div>
              )}

              <div className="text-[11px] text-slate-400 font-mono">
                Lat: {Number(activeIssue.latitude).toFixed(5)}, Lng: {Number(activeIssue.longitude).toFixed(5)}
              </div>
            </div>

            <Link
              to={`/issues/${activeIssue.id}`}
              className="w-full py-2 px-3 bg-civic-600 hover:bg-civic-700 text-white rounded-lg text-xs font-semibold shadow-xs transition flex items-center justify-center gap-1.5"
            >
              Open Full Detail & Audit Timeline <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default GISMapPage;
