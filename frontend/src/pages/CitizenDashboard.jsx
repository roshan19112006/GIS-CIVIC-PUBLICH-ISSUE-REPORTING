import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  PlusCircle,
  Star,
  MapPin,
  Camera,
  ExternalLink,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import issueService from '../services/issueService';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import StatCard from '../components/StatCard';
import Sidebar from '../components/Sidebar';

export const CitizenDashboard = () => {
  const { user } = useAuth();
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');

  // Feedback modal state
  const [activeFeedbackIssue, setActiveFeedbackIssue] = useState(null);
  const [rating, setRating] = useState(5);
  const [isSatisfied, setIsSatisfied] = useState(true);
  const [comments, setComments] = useState('');
  const [reopenRequested, setReopenRequested] = useState(false);
  const [reopenReason, setReopenReason] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState(null);

  const fetchIssues = async () => {
    setLoading(true);
    try {
      const res = await issueService.getIssues({ mine: 'true', status: filterStatus || undefined });
      if (res.data?.success) {
        setIssues(res.data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssues();
  }, [filterStatus]);

  const handleOpenFeedback = (issue) => {
    setActiveFeedbackIssue(issue);
    setRating(5);
    setIsSatisfied(true);
    setComments('');
    setReopenRequested(false);
    setReopenReason('');
    setFeedbackSuccess(null);
  };

  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    if (!activeFeedbackIssue) return;

    setSubmittingFeedback(true);
    try {
      const res = await issueService.submitFeedback(activeFeedbackIssue.id, {
        rating,
        is_satisfied: isSatisfied,
        comments,
        reopen_requested: reopenRequested,
        reopen_reason: reopenReason
      });

      if (res.data?.success) {
        setFeedbackSuccess(res.data.message);
        setTimeout(() => {
          setActiveFeedbackIssue(null);
          fetchIssues();
        }, 1500);
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to submit feedback.');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const totalCount = issues.length;
  const pendingCount = issues.filter(i => i.status === 'pending').length;
  const inProgressCount = issues.filter(i => ['assigned', 'in_progress'].includes(i.status)).length;
  const resolvedCount = issues.filter(i => ['resolved', 'closed'].includes(i.status)).length;

  return (
    <div className="flex min-h-[calc(100vh-4rem)] bg-slate-50">
      <Sidebar />

      <main className="flex-1 p-4 sm:p-8 max-w-7xl mx-auto">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Citizen Complaint Workspace
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Welcome back, <span className="font-semibold text-slate-800">{user?.name}</span>. Track and verify your reported civic issues.
            </p>
          </div>

          <Link
            to="/report"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-civic-600 hover:bg-civic-700 text-white font-semibold text-xs shadow-sm transition active:scale-95"
          >
            <PlusCircle className="w-4 h-4" /> Report New Civic Issue
          </Link>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            title="My Total Issues"
            value={totalCount}
            subtitle="Submitted across all wards"
            icon={FileText}
            color="blue"
          />
          <StatCard
            title="Pending Review"
            value={pendingCount}
            subtitle="Awaiting admin assignment"
            icon={Clock}
            color="amber"
          />
          <StatCard
            title="In Resolution"
            value={inProgressCount}
            subtitle="Field crew assigned"
            icon={AlertCircle}
            color="purple"
          />
          <StatCard
            title="Successfully Resolved"
            value={resolvedCount}
            subtitle="Completed & verified"
            icon={CheckCircle}
            color="emerald"
          />
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-6">
          <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2 overflow-x-auto">
              <button
                onClick={() => setFilterStatus('')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  filterStatus === '' ? 'bg-civic-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                All Issues ({totalCount})
              </button>
              <button
                onClick={() => setFilterStatus('pending')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  filterStatus === 'pending' ? 'bg-amber-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Pending
              </button>
              <button
                onClick={() => setFilterStatus('in_progress')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  filterStatus === 'in_progress' ? 'bg-purple-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                In Progress
              </button>
              <button
                onClick={() => setFilterStatus('resolved')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  filterStatus === 'resolved' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Resolved
              </button>
            </div>
          </div>

          {/* Issue Cards Table / Grid */}
          <div className="divide-y divide-slate-100">
            {loading ? (
              <div className="p-12 text-center text-slate-500 text-xs">
                <span className="inline-block w-5 h-5 border-2 border-civic-600 border-t-transparent rounded-full animate-spin mb-2" />
                <div>Loading your submitted complaints...</div>
              </div>
            ) : issues.length === 0 ? (
              <div className="p-16 text-center">
                <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-slate-700">No complaints found</h3>
                <p className="text-xs text-slate-500 mt-1">You haven't reported any civic distress in this category.</p>
                <Link
                  to="/report"
                  className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-civic-600 text-white text-xs font-semibold rounded-lg hover:bg-civic-700 transition"
                >
                  <PlusCircle className="w-3.5 h-3.5" /> Submit First Report
                </Link>
              </div>
            ) : (
              issues.map((issue) => (
                <div key={issue.id} className="p-5 hover:bg-slate-50/80 transition flex flex-col md:flex-row gap-5 items-start justify-between">
                  {/* Left: Thumbnail & Details */}
                  <div className="flex gap-4 items-start flex-1">
                    <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                      {issue.thumbnail_url ? (
                        <img
                          src={issue.thumbnail_url}
                          alt="Thumbnail"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                          <Camera className="w-6 h-6" />
                        </div>
                      )}
                    </div>

                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-civic-700">
                          {issue.ticket_id}
                        </span>
                        <StatusBadge status={issue.status} />
                        <PriorityBadge priority={issue.priority} />
                      </div>

                      <h3 className="text-sm font-bold text-slate-900 leading-snug">
                        {issue.title}
                      </h3>

                      <p className="text-xs text-slate-500 line-clamp-2">
                        {issue.description}
                      </p>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-400 pt-1">
                        <span>🏷️ {issue.category_name}</span>
                        {issue.ward_name && <span>🏛️ {issue.ward_name}</span>}
                        {issue.address && <span className="line-clamp-1">📍 {issue.address}</span>}
                        <span>🕒 {new Date(issue.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between w-full md:w-auto gap-2 shrink-0 pt-2 md:pt-0">
                    <Link
                      to={`/issues/${issue.id}`}
                      className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition flex items-center gap-1"
                    >
                      View Timeline <ExternalLink className="w-3 h-3" />
                    </Link>

                    {/* If resolved and not rated yet, prompt review */}
                    {issue.status === 'resolved' && (
                      <button
                        onClick={() => handleOpenFeedback(issue)}
                        className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-semibold shadow-xs transition flex items-center gap-1"
                      >
                        <Star className="w-3.5 h-3.5 fill-white" /> Rate Resolution
                      </button>
                    )}

                    {issue.citizen_rating && (
                      <div className="flex items-center gap-1 text-xs text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                        <span>Rated: {issue.citizen_rating}/5</span>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {/* Citizen Feedback / Reopen Modal */}
      {activeFeedbackIssue && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Review & Rate Resolution
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  Ticket #{activeFeedbackIssue.ticket_id}
                </p>
              </div>
              <button
                onClick={() => setActiveFeedbackIssue(null)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            {feedbackSuccess ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl text-center space-y-2">
                <CheckCircle className="w-8 h-8 text-emerald-600 mx-auto" />
                <div className="font-bold text-sm">Thank You!</div>
                <div>{feedbackSuccess}</div>
              </div>
            ) : (
              <form onSubmit={handleSubmitFeedback} className="space-y-4">
                {/* Resolution photo thumbnail */}
                {activeFeedbackIssue.resolution_thumbnail_url && (
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 block">
                      Field Officer's Completion Photo:
                    </label>
                    <img
                      src={activeFeedbackIssue.resolution_thumbnail_url}
                      alt="Resolution Proof"
                      className="w-full h-40 object-cover rounded-xl border border-slate-200"
                    />
                  </div>
                )}

                {/* Star rating selector */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2">
                    How satisfied are you with this municipal repair?
                  </label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => {
                          setRating(star);
                          if (star <= 2) {
                            setIsSatisfied(false);
                          } else {
                            setIsSatisfied(true);
                            setReopenRequested(false);
                          }
                        }}
                        className="p-1 focus:outline-hidden hover:scale-110 transition"
                      >
                        <Star
                          className={`w-7 h-7 ${
                            star <= rating
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-slate-200'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="text-xs font-bold text-slate-700 ml-2">
                      {rating === 5 ? 'Excellent' : rating === 4 ? 'Good' : rating === 3 ? 'Average' : rating === 2 ? 'Poor' : 'Unacceptable'}
                    </span>
                  </div>
                </div>

                {/* Satisfaction toggle */}
                <div className="flex items-center gap-4 pt-1">
                  <label className="text-xs font-semibold text-slate-700">Is issue resolved?</label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => { setIsSatisfied(true); setReopenRequested(false); }}
                      className={`px-3 py-1 text-xs rounded-md font-semibold transition ${
                        isSatisfied ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      Yes, Satisfied
                    </button>
                    <button
                      type="button"
                      onClick={() => { setIsSatisfied(false); setReopenRequested(true); }}
                      className={`px-3 py-1 text-xs rounded-md font-semibold transition ${
                        !isSatisfied ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      No, Unsatisfactory
                    </button>
                  </div>
                </div>

                {/* If unsatisfied, show Reopen Complaint Option */}
                {!isSatisfied && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-2">
                    <label className="flex items-center gap-2 text-xs font-bold text-rose-800">
                      <input
                        type="checkbox"
                        checked={reopenRequested}
                        onChange={(e) => setReopenRequested(e.target.checked)}
                        className="rounded text-rose-600 focus:ring-rose-500"
                      />
                      <span>Reopen this complaint for re-inspection</span>
                    </label>

                    {reopenRequested && (
                      <div>
                        <label className="block text-[11px] font-semibold text-rose-900 mb-1">
                          Reason for Reopening *
                        </label>
                        <textarea
                          required
                          rows={2}
                          value={reopenReason}
                          onChange={(e) => setReopenReason(e.target.value)}
                          placeholder="e.g. Pothole was only filled with sand, it washed away in rain..."
                          className="w-full px-2.5 py-1.5 bg-white border border-rose-200 rounded text-xs text-slate-900 focus:outline-hidden"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Comments */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Feedback Comments
                  </label>
                  <textarea
                    rows={3}
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    placeholder="Provide any comments about the officer's work, timeliness, or quality..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-hidden"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setActiveFeedbackIssue(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingFeedback}
                    className="px-4 py-2 bg-civic-600 hover:bg-civic-700 text-white rounded-lg text-xs font-semibold shadow-sm transition disabled:opacity-50"
                  >
                    {submittingFeedback ? 'Submitting...' : 'Submit Review'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CitizenDashboard;
