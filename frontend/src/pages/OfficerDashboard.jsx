import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Wrench,
  Clock,
  CheckCircle,
  AlertTriangle,
  MapPin,
  Camera,
  Upload,
  ArrowRight,
  Share2,
  Filter,
  Check,
  RotateCcw,
  ExternalLink,
  ShieldAlert
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import issueService from '../services/issueService';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import StatCard from '../components/StatCard';
import CivicMap from '../components/CivicMap';
import Sidebar from '../components/Sidebar';

export const OfficerDashboard = () => {
  const { user } = useAuth();
  const [issues, setIssues] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  // Modals
  const [activeResolveIssue, setActiveResolveIssue] = useState(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [resolutionPhoto, setResolutionPhoto] = useState(null);
  const [resolutionPhotoPreview, setResolutionPhotoPreview] = useState(null);
  const [resolving, setResolving] = useState(false);
  const [resolveError, setResolveError] = useState(null);

  const [activeReferIssue, setActiveReferIssue] = useState(null);
  const [targetDeptId, setTargetDeptId] = useState('');
  const [referReason, setReferReason] = useState('');
  const [referring, setReferring] = useState(false);
  const [referError, setReferError] = useState(null);

  const fetchWorkOrders = async () => {
    setLoading(true);
    try {
      const [issueRes, deptRes] = await Promise.all([
        issueService.getIssues({
          mine: 'true',
          status: statusFilter || undefined,
          priority: priorityFilter || undefined
        }),
        issueService.getDepartments()
      ]);

      if (issueRes.data?.success) setIssues(issueRes.data.data || []);
      if (deptRes.data?.success) setDepartments(deptRes.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkOrders();
  }, [statusFilter, priorityFilter]);

  // Action: Accept work order / move to in_progress
  const handleStartWork = async (issueId) => {
    try {
      const res = await issueService.updateStatus(issueId, {
        status: 'in_progress',
        remarks: `Work order accepted by ${user?.name}. Team deployed to site.`
      });
      if (res.data?.success) {
        fetchWorkOrders();
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to update work order status.');
    }
  };

  // Action: Open Resolve Modal
  const handleOpenResolve = (issue) => {
    setActiveResolveIssue(issue);
    setResolutionNotes('');
    setResolutionPhoto(null);
    setResolutionPhotoPreview(null);
    setResolveError(null);
  };

  const handleResolutionPhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setResolveError('Photo file size exceeds 5MB limit.');
        return;
      }
      setResolutionPhoto(file);
      setResolutionPhotoPreview(URL.createObjectURL(file));
      setResolveError(null);
    }
  };

  const handleSubmitResolution = async (e) => {
    e.preventDefault();
    if (!resolutionNotes || resolutionNotes.trim().length < 10) {
      setResolveError('Resolution notes must be at least 10 characters long describing the physical work.');
      return;
    }
    if (!resolutionPhoto) {
      setResolveError('Resolution completion photograph is required as physical proof of work.');
      return;
    }

    setResolving(true);
    setResolveError(null);

    try {
      const formData = new FormData();
      formData.append('resolution_notes', resolutionNotes.trim());
      formData.append('resolution_image', resolutionPhoto);

      const res = await issueService.resolveIssue(activeResolveIssue.id, formData);
      if (res.data?.success) {
        setActiveResolveIssue(null);
        fetchWorkOrders();
      } else {
        setResolveError(res.data?.message || 'Failed to complete resolution.');
      }
    } catch (err) {
      console.error(err);
      setResolveError(err.response?.data?.message || 'Failed to save resolution details.');
    } finally {
      setResolving(false);
    }
  };

  // Action: Open Refer Modal
  const handleOpenRefer = (issue) => {
    setActiveReferIssue(issue);
    setTargetDeptId('');
    setReferReason('');
    setReferError(null);
  };

  const handleSubmitReferral = async (e) => {
    e.preventDefault();
    if (!referReason || referReason.trim().length < 5) {
      setReferError('A clear referral reason is required.');
      return;
    }

    setReferring(true);
    setReferError(null);

    try {
      const res = await issueService.referIssue(activeReferIssue.id, {
        target_department_id: targetDeptId ? parseInt(targetDeptId, 10) : null,
        reason: referReason.trim()
      });
      if (res.data?.success) {
        setActiveReferIssue(null);
        fetchWorkOrders();
      } else {
        setReferError(res.data?.message || 'Failed to refer complaint.');
      }
    } catch (err) {
      console.error(err);
      setReferError(err.response?.data?.message || 'Failed to refer complaint.');
    } finally {
      setReferring(false);
    }
  };

  // Stats calculation
  const totalAssigned = issues.length;
  const inProgressCount = issues.filter(i => i.status === 'in_progress').length;
  const pendingAcceptance = issues.filter(i => i.status === 'assigned').length;
  const completedCount = issues.filter(i => ['resolved', 'closed'].includes(i.status)).length;

  return (
    <div className="flex min-h-[calc(100vh-4rem)] bg-slate-50">
      <Sidebar />

      <main className="flex-1 p-4 sm:p-8 max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
                Badge #{user?.badge_number || 'OFFICER'}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                {user?.department_name || 'Municipal Works'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
              Field Officer Operations
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Manage work orders, inspect geotagged civic issues, and verify physical resolution.
            </p>
          </div>

          <Link
            to="/map"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-sm transition"
          >
            <MapPin className="w-4 h-4 text-rose-400" /> Full GIS Operations Map
          </Link>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            title="Assigned Tasks"
            value={totalAssigned}
            subtitle="Current queue"
            icon={Clock}
            color="blue"
          />
          <StatCard
            title="Pending Acceptance"
            value={pendingAcceptance}
            subtitle="Needs dispatch accept"
            icon={AlertTriangle}
            color="amber"
          />
          <StatCard
            title="In Progress"
            value={inProgressCount}
            subtitle="Crew on site"
            icon={Wrench}
            color="purple"
          />
          <StatCard
            title="Completed & Closed"
            value={completedCount}
            subtitle="Resolution verified"
            icon={CheckCircle}
            color="emerald"
          />
        </div>

        {/* Map Preview of Tasks */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-civic-600" /> Geographic Dispatch of Assigned Tasks
            </h3>
            <span className="text-xs text-slate-500">
              {issues.length} active work orders pinned
            </span>
          </div>

          <CivicMap
            markers={issues}
            height="320px"
          />
        </div>

        {/* Work Orders List */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Filters Bar */}
          <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4 bg-slate-50/50">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-bold text-slate-700">Filter Work Orders:</span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-hidden"
              >
                <option value="">All Statuses</option>
                <option value="assigned">Assigned</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
              </select>

              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-hidden"
              >
                <option value="">All Priorities</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          {/* Cards List */}
          <div className="divide-y divide-slate-100">
            {loading ? (
              <div className="p-12 text-center text-slate-500 text-xs">
                <span className="inline-block w-5 h-5 border-2 border-civic-600 border-t-transparent rounded-full animate-spin mb-2" />
                <div>Loading assigned work orders...</div>
              </div>
            ) : issues.length === 0 ? (
              <div className="p-16 text-center">
                <CheckCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-slate-700">No active work orders</h3>
                <p className="text-xs text-slate-500 mt-1">All tasks are currently completed or none match the filter.</p>
              </div>
            ) : (
              issues.map((issue) => (
                <div key={issue.id} className="p-6 hover:bg-slate-50/70 transition space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs font-bold text-civic-700 bg-civic-50 px-2 py-0.5 rounded border border-civic-200">
                        {issue.ticket_id}
                      </span>
                      <StatusBadge status={issue.status} />
                      <PriorityBadge priority={issue.priority} />
                      <span className="text-xs text-slate-500">
                        📍 {issue.ward_name || 'Ward Area'}
                      </span>
                    </div>

                    <div className="text-xs text-slate-400">
                      SLA Deadline:{' '}
                      <span className={`font-semibold ${
                        issue.deadline && new Date(issue.deadline) < new Date() && !['resolved', 'closed'].includes(issue.status)
                          ? 'text-rose-600'
                          : 'text-slate-700'
                      }`}>
                        {issue.deadline ? new Date(issue.deadline).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Standard 48h'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
                    {/* Complaint Photo */}
                    <div className="md:col-span-3">
                      <div className="h-36 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 relative group">
                        {issue.thumbnail_url ? (
                          <img
                            src={issue.thumbnail_url}
                            alt="Complaint"
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400">
                            <Camera className="w-8 h-8" />
                          </div>
                        )}
                        <span className="absolute bottom-2 left-2 bg-slate-900/80 text-white text-[10px] px-2 py-0.5 rounded backdrop-blur-xs font-semibold">
                          Citizen Photo
                        </span>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="md:col-span-6 space-y-2">
                      <h3 className="text-sm font-bold text-slate-900">
                        {issue.title}
                      </h3>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {issue.description}
                      </p>
                      {issue.address && (
                        <div className="text-xs text-slate-500 flex items-start gap-1 pt-1">
                          <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400 mt-0.5" />
                          <span>{issue.address}</span>
                        </div>
                      )}
                      <div className="text-[11px] text-slate-400 font-mono">
                        GPS: {Number(issue.latitude).toFixed(5)}, {Number(issue.longitude).toFixed(5)}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="md:col-span-3 flex flex-col gap-2">
                      {issue.status === 'assigned' && (
                        <button
                          onClick={() => handleStartWork(issue.id)}
                          className="w-full py-2 px-3 bg-civic-600 hover:bg-civic-700 text-white rounded-lg text-xs font-semibold shadow-xs transition flex items-center justify-center gap-1.5"
                        >
                          <Check className="w-3.5 h-3.5" /> Accept & Start Work
                        </button>
                      )}

                      {issue.status === 'in_progress' && (
                        <button
                          onClick={() => handleOpenResolve(issue)}
                          className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition flex items-center justify-center gap-1.5"
                        >
                          <Camera className="w-3.5 h-3.5" /> Complete & Resolve
                        </button>
                      )}

                      {!['resolved', 'closed'].includes(issue.status) && (
                        <button
                          onClick={() => handleOpenRefer(issue)}
                          className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5"
                        >
                          <Share2 className="w-3.5 h-3.5" /> Refer to Other Dept
                        </button>
                      )}

                      <Link
                        to={`/issues/${issue.id}`}
                        className="w-full py-2 px-3 text-center border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1"
                      >
                        Details & Timeline <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {/* Resolve Issue Modal with Mandatory Photo Upload */}
      {activeResolveIssue && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Mark Complaint Resolved
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  Ticket #{activeResolveIssue.ticket_id}
                </p>
              </div>
              <button
                onClick={() => setActiveResolveIssue(null)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            {resolveError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{resolveError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitResolution} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Upload Resolution Completion Photograph *
                </label>
                <p className="text-[11px] text-slate-500 mb-2">
                  Physical photo proof of completed repair work is mandatory before closing the ticket.
                </p>

                {resolutionPhotoPreview ? (
                  <div className="relative rounded-xl overflow-hidden border border-slate-200 h-44 bg-slate-900">
                    <img
                      src={resolutionPhotoPreview}
                      alt="Completion Preview"
                      className="w-full h-full object-contain"
                    />
                    <button
                      type="button"
                      onClick={() => { setResolutionPhoto(null); setResolutionPhotoPreview(null); }}
                      className="absolute top-2 right-2 p-1 bg-rose-600 text-white rounded-full hover:bg-rose-700"
                    >
                      &times;
                    </button>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-xl p-5 flex flex-col items-center justify-center cursor-pointer bg-slate-50 hover:bg-emerald-50/20 transition">
                    <Camera className="w-8 h-8 text-slate-400 mb-1" />
                    <span className="text-xs font-semibold text-slate-700">Take or upload completion photo</span>
                    <input
                      type="file"
                      required
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleResolutionPhotoChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Resolution Notes & Technical Details *
                </label>
                <textarea
                  required
                  rows={4}
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Describe repair materials used, quantity, crew dispatch, site inspection, and current condition..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveResolveIssue(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resolving}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  {resolving ? 'Recording Resolution...' : 'Submit Resolution Proof'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Refer Issue Modal */}
      {activeReferIssue && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                Refer Complaint to Another Department
              </h3>
              <button
                onClick={() => setActiveReferIssue(null)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            {referError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl">
                {referError}
              </div>
            )}

            <form onSubmit={handleSubmitReferral} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Target Municipal Department (Optional recommendation)
                </label>
                <select
                  value={targetDeptId}
                  onChange={(e) => setTargetDeptId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white"
                >
                  <option value="">Let Administrator Reassign</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Referral Reason *
                </label>
                <textarea
                  required
                  rows={3}
                  value={referReason}
                  onChange={(e) => setReferReason(e.target.value)}
                  placeholder="e.g. Issue involves underground water supply line rather than road bitumen..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveReferIssue(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={referring}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition disabled:opacity-50"
                >
                  {referring ? 'Referring...' : 'Submit Referral'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OfficerDashboard;
