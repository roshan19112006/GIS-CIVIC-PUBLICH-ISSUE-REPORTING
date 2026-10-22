import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  FileText,
  MapPin,
  Clock,
  CheckCircle,
  AlertCircle,
  User,
  Shield,
  Wrench,
  Camera,
  Star,
  ArrowLeft,
  Calendar,
  Building,
  History,
  Share2
} from 'lucide-react';
import issueService from '../services/issueService';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import CivicMap from '../components/CivicMap';

export const IssueDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchIssueDetail = async () => {
    setLoading(true);
    try {
      const res = await issueService.getIssueById(id);
      if (res.data?.success) {
        setIssue(res.data.data);
      } else {
        setError('Issue not found');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to load issue details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssueDetail();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-8 text-center text-slate-500">
        <div>
          <span className="inline-block w-8 h-8 border-3 border-civic-600 border-t-transparent rounded-full animate-spin mb-3" />
          <div className="text-sm font-semibold">Loading complaint records & history...</div>
        </div>
      </div>
    );
  }

  if (error || !issue) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">Complaint Not Found</h2>
        <p className="text-xs text-slate-500">{error || 'The requested civic issue could not be retrieved.'}</p>
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold"
        >
          &larr; Go Back
        </button>
      </div>
    );
  }

  const complaintPhoto = issue.images?.find(img => img.image_type === 'complaint');
  const resolutionPhoto = issue.images?.find(img => img.image_type === 'resolution');

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Top Breadcrumb & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>

        <div className="flex items-center gap-3">
          <span className="font-mono text-sm font-black text-civic-700 bg-civic-50 px-3 py-1 rounded-lg border border-civic-200">
            {issue.ticket_id}
          </span>
          <StatusBadge status={issue.status} />
          <PriorityBadge priority={issue.priority} />
        </div>
      </div>

      {/* Main Issue Header */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200 space-y-4">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">
          <span className="flex items-center gap-1.5 font-medium text-slate-700">
            <Building className="w-3.5 h-3.5 text-slate-400" /> {issue.category_name}
          </span>
          <span>•</span>
          <span className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-slate-400" /> {issue.ward_name || 'Ward Area'}
          </span>
          <span>•</span>
          <span className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" /> Reported on {new Date(issue.created_at).toLocaleString([], { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          {issue.title}
        </h1>

        <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
          {issue.description}
        </p>

        {issue.address && (
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 flex items-start gap-2">
            <MapPin className="w-4 h-4 text-civic-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block text-slate-900">Geographic Address:</span>
              <span>{issue.address}</span>
            </div>
          </div>
        )}
      </div>

      {/* Before & After Dual Photographs Comparison */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200 space-y-4">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Camera className="w-4 h-4 text-civic-600" /> Photographic Evidence & Physical Verification
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Before Photo */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700 uppercase tracking-wide">
                1. Initial Complaint Photo
              </span>
              <span className="text-[10px] text-slate-400">Captured by Citizen</span>
            </div>
            <div className="h-64 rounded-xl overflow-hidden bg-slate-900 border border-slate-200 relative">
              {complaintPhoto ? (
                <img
                  src={complaintPhoto.image_url}
                  alt="Complaint Before"
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                  No initial photo uploaded
                </div>
              )}
            </div>
          </div>

          {/* After Photo (Resolution) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700 uppercase tracking-wide">
                2. Resolution Completion Photo
              </span>
              <span className="text-[10px] text-emerald-600 font-semibold">Verified by Field Officer</span>
            </div>
            <div className="h-64 rounded-xl overflow-hidden bg-slate-900 border border-slate-200 relative">
              {resolutionPhoto || issue.resolution?.completion_photo_url ? (
                <img
                  src={resolutionPhoto?.image_url || issue.resolution?.completion_photo_url}
                  alt="Resolution After"
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs p-4 text-center">
                  <Clock className="w-8 h-8 mb-2 opacity-50" />
                  <span>Resolution in progress</span>
                  <span className="text-[10px] text-slate-500 mt-1">Completion photo will appear once officer resolves the task</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Resolution Notes if available */}
        {issue.resolution && (
          <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1.5 text-xs">
            <div className="font-bold text-emerald-900 flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-600" /> Official Resolution Notes:
            </div>
            <p className="text-emerald-800 leading-relaxed">
              {issue.resolution.resolution_notes}
            </p>
            <div className="text-[10px] text-emerald-600 pt-1">
              Recorded on {new Date(issue.resolution.resolved_at).toLocaleString()} by Officer {issue.resolution.resolved_by_name || 'Assigned Officer'}
            </div>
          </div>
        )}

        {/* Citizen Feedback Rating if available */}
        {issue.feedback && (
          <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-1.5 text-xs">
            <div className="font-bold text-amber-900 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Star className="w-4 h-4 fill-amber-500 text-amber-500" /> Citizen Review & Satisfaction:
              </span>
              <span className="text-amber-800 font-bold">{issue.feedback.rating}/5 Stars</span>
            </div>
            {issue.feedback.comments && (
              <p className="text-amber-800 italic">
                "{issue.feedback.comments}"
              </p>
            )}
            {issue.feedback.reopen_requested ? (
              <div className="text-rose-700 font-semibold text-[11px] pt-1">
                ⚠️ Citizen requested reopening: {issue.feedback.reopen_reason || 'Unsatisfactory resolution.'}
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* Grid: Coordinates Map & Status Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Interactive Mini Map */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-civic-600" /> Geospatial Location
          </h3>

          <div className="rounded-xl overflow-hidden border border-slate-200">
            <CivicMap
              center={[parseFloat(issue.latitude), parseFloat(issue.longitude)]}
              zoom={16}
              markers={[issue]}
              height="260px"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-[10px] font-semibold text-slate-400 block uppercase">Latitude</span>
              <span className="font-mono font-bold text-slate-800">{Number(issue.latitude).toFixed(6)}</span>
            </div>
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-[10px] font-semibold text-slate-400 block uppercase">Longitude</span>
              <span className="font-mono font-bold text-slate-800">{Number(issue.longitude).toFixed(6)}</span>
            </div>
          </div>
        </div>

        {/* Right: Full Status History Timeline */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <History className="w-4 h-4 text-civic-600" /> Audit Timeline & State Transitions
          </h3>

          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {issue.status_history?.map((step, idx) => (
              <div key={step.id || idx} className="relative">
                {/* Timeline dot */}
                <span className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-civic-600 ring-4 ring-white" />

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 capitalize">
                      {step.new_status.replace('_', ' ')}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(step.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600">
                    {step.remarks || 'Status updated'}
                  </p>

                  <div className="text-[10px] text-slate-400">
                    Updated by: <span className="font-semibold text-slate-700">{step.changed_by_name || 'System'}</span> ({step.changed_by_role || 'user'})
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default IssueDetailPage;
