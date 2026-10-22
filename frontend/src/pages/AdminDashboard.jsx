import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Clock,
  CheckCircle,
  AlertTriangle,
  Users,
  Download,
  Filter,
  MapPin,
  Flame,
  Search,
  ShieldCheck,
  TrendingUp,
  Activity,
  UserCheck,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Send,
  Star
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, Legend
} from 'recharts';
import issueService from '../services/issueService';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import StatCard from '../components/StatCard';
import Sidebar from '../components/Sidebar';

const PIE_COLORS = ['#EF4444', '#F59E0B', '#06B6D4', '#EAB308', '#8B5CF6', '#64748B', '#10B981'];

export const AdminDashboard = () => {
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    assigned: 0,
    in_progress: 0,
    resolved: 0,
    closed: 0,
    overdue: 0,
    slaComplianceRate: 100,
    totalCitizens: 0,
    totalOfficers: 0,
    avgRating: 0
  });

  const [analytics, setAnalytics] = useState({
    byCategory: [],
    byStatus: [],
    byWard: [],
    officerPerformance: [],
    monthlyTrends: []
  });

  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Metadata for filter dropdowns & assignment modal
  const [departments, setDepartments] = useState([]);
  const [wards, setWards] = useState([]);
  const [categories, setCategories] = useState([]);
  const [officers, setOfficers] = useState([]);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [wardFilter, setWardFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  // Assignment Modal
  const [activeAssignIssue, setActiveAssignIssue] = useState(null);
  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [selectedOfficerId, setSelectedOfficerId] = useState('');
  const [assignPriority, setAssignPriority] = useState('medium');
  const [assignDeadline, setAssignDeadline] = useState('');
  const [assignInstructions, setAssignInstructions] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [assignError, setAssignError] = useState(null);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, analyticsRes, deptsRes, wardsRes, catsRes, officersRes] = await Promise.all([
        issueService.getStats(),
        issueService.getAnalytics(),
        issueService.getDepartments(),
        issueService.getWards(),
        issueService.getCategories(),
        issueService.getUsers({ role: 'officer' })
      ]);

      if (statsRes.data?.success) setStats(statsRes.data.data);
      if (analyticsRes.data?.success) setAnalytics(analyticsRes.data.data);
      if (deptsRes.data?.success) setDepartments(deptsRes.data.data || []);
      if (wardsRes.data?.success) setWards(wardsRes.data.data || []);
      if (catsRes.data?.success) setCategories(catsRes.data.data || []);
      if (officersRes.data?.success) setOfficers(officersRes.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchIssuesList = async () => {
    setLoading(true);
    try {
      const res = await issueService.getIssues({
        search: search || undefined,
        status: statusFilter || undefined,
        category_id: categoryFilter || undefined,
        ward_id: wardFilter || undefined,
        priority: priorityFilter || undefined,
        page,
        limit: 10
      });

      if (res.data?.success) {
        setIssues(res.data.data || []);
        setTotalPages(res.data.totalPages || 1);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    fetchIssuesList();
  }, [search, statusFilter, categoryFilter, wardFilter, priorityFilter, page]);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('preview_assign') === 'true' && issues.length > 0) {
      handleOpenAssign(issues[0]);
    }
  }, [issues]);

  // Open Assign Modal
  const handleOpenAssign = (issue) => {
    setActiveAssignIssue(issue);
    setSelectedDeptId(issue.department_id ? String(issue.department_id) : (departments[0]?.id ? String(departments[0].id) : ''));
    setSelectedOfficerId('');
    setAssignPriority(issue.priority || 'medium');

    // Default deadline: 48 hours from now
    const d = new Date(Date.now() + 48 * 3600 * 1000);
    setAssignDeadline(d.toISOString().slice(0, 16));
    setAssignInstructions('');
    setAssignError(null);
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!selectedOfficerId || !selectedDeptId) {
      setAssignError('Please select both a Department and an Officer.');
      return;
    }

    setAssigning(true);
    setAssignError(null);

    try {
      const res = await issueService.assignIssue(activeAssignIssue.id, {
        department_id: parseInt(selectedDeptId, 10),
        officer_id: parseInt(selectedOfficerId, 10),
        priority: assignPriority,
        deadline: assignDeadline,
        instructions: assignInstructions
      });

      if (res.data?.success) {
        setActiveAssignIssue(null);
        fetchIssuesList();
        fetchDashboardData();
      } else {
        setAssignError(res.data?.message || 'Assignment failed.');
      }
    } catch (err) {
      console.error(err);
      setAssignError(err.response?.data?.message || 'Failed to assign work order.');
    } finally {
      setAssigning(false);
    }
  };

  // Filter officers based on selected department in modal
  const filteredOfficers = officers.filter(o => !selectedDeptId || String(o.department_id) === String(selectedDeptId));

  return (
    <div className="flex min-h-[calc(100vh-4rem)] bg-slate-50">
      <Sidebar />

      <main className="flex-1 p-4 sm:p-8 max-w-7xl mx-auto space-y-8">
        {/* Header with Export Action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
                Administration & Governance
              </span>
              <span className="text-xs text-slate-500 font-medium">
                SLA Compliance Engine Active
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
              Municipal Operations Hub
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Real-time complaint monitoring, GIS dispatch, SLA enforcement, and officer performance tracking.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <a
              href={issueService.exportCsvUrl({
                status: statusFilter,
                category_id: categoryFilter,
                ward_id: wardFilter
              })}
              download
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold shadow-xs transition"
            >
              <Download className="w-3.5 h-3.5 text-civic-600" /> Export CSV Report
            </a>
            <Link
              to="/map"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-civic-600 hover:bg-civic-700 text-white text-xs font-semibold shadow-sm transition"
            >
              <MapPin className="w-3.5 h-3.5" /> Full GIS Platform
            </Link>
          </div>
        </div>

        {/* Top KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-3.5">
          <StatCard
            title="Total Complaints"
            value={stats.total}
            subtitle="Database records"
            icon={FileText}
            color="blue"
          />
          <StatCard
            title="Pending Review"
            value={stats.pending}
            subtitle="Needs assignment"
            icon={Clock}
            color="amber"
          />
          <StatCard
            title="In Progress"
            value={stats.in_progress}
            subtitle="Active on site"
            icon={Activity}
            color="purple"
          />
          <StatCard
            title="Resolved & Closed"
            value={stats.resolved + stats.closed}
            subtitle="Verified work"
            icon={CheckCircle}
            color="emerald"
          />
          <StatCard
            title="Overdue (SLA Breach)"
            value={stats.overdue}
            subtitle="Exceeded deadline"
            icon={AlertTriangle}
            color="rose"
          />
          <StatCard
            title="SLA Compliance Rate"
            value={`${stats.slaComplianceRate}%`}
            subtitle={`Avg Rating: ${stats.avgRating || '5.0'} ★`}
            icon={TrendingUp}
            color="slate"
          />
        </div>

        {/* Analytics Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Chart 1: Issues by Category */}
          <div className="lg:col-span-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
              Issues by Category
            </h3>
            <div className="h-56">
              {analytics.byCategory.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analytics.byCategory}
                      dataKey="count"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={4}
                    >
                      {analytics.byCategory.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color_code || PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  No categorical data
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-2 text-[10px] text-slate-500 pt-2 border-t border-slate-100">
              {analytics.byCategory.slice(0, 4).map((c, i) => (
                <span key={i} className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color_code || PIE_COLORS[i] }} />
                  {c.name}
                </span>
              ))}
            </div>
          </div>

          {/* Chart 2: Issues by Ward (BarChart) */}
          <div className="lg:col-span-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
              Complaints by Municipal Ward
            </h3>
            <div className="h-56">
              {analytics.byWard.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.byWard}>
                    <XAxis dataKey="ward_number" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                    <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px' }} />
                    <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  No ward distribution data
                </div>
              )}
            </div>
            <div className="text-[11px] text-slate-400 text-center pt-2 border-t border-slate-100">
              Ward-level load balance
            </div>
          </div>

          {/* Chart 3: Officer Performance & Ratings Table */}
          <div className="lg:col-span-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Officer Performance
              </h3>
              <Link to="/admin/users" className="text-[10px] text-civic-600 font-bold hover:underline">
                Manage Officers &rarr;
              </Link>
            </div>

            <div className="h-56 overflow-y-auto divide-y divide-slate-100 text-xs">
              {analytics.officerPerformance.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  No officer records found
                </div>
              ) : (
                analytics.officerPerformance.map((officer) => (
                  <div key={officer.id} className="py-2.5 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-800">{officer.name}</div>
                      <div className="text-[10px] text-slate-500">{officer.department_name || 'Field Officer'} • #{officer.badge_number}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-slate-900">
                        {officer.total_completed}/{officer.total_assigned} Done
                      </div>
                      <div className="text-[10px] text-amber-600 font-semibold flex items-center justify-end gap-0.5">
                        <Star className="w-2.5 h-2.5 fill-amber-500" />
                        {officer.avg_rating || '5.0'}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="text-[11px] text-slate-400 text-center pt-2 border-t border-slate-100">
              Based on work order completion logs
            </div>
          </div>
        </div>

        {/* Complaints Master Management Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden space-y-0">
          <div className="p-4 border-b border-slate-200 bg-slate-50/60 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Civic Complaints Management
              </h2>
              <p className="text-xs text-slate-500">
                Real database query results with multi-attribute filtering and direct dispatch
              </p>
            </div>

            {/* Filter Controls */}
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Search ticket, title..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  className="pl-8 pr-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-hidden w-40 sm:w-48"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700"
              >
                <option value="">Status: All</option>
                <option value="pending">Pending</option>
                <option value="assigned">Assigned</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
                <option value="reopened">Reopened</option>
              </select>

              <select
                value={categoryFilter}
                onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
                className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700"
              >
                <option value="">Category: All</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>

              <select
                value={priorityFilter}
                onChange={(e) => { setPriorityFilter(e.target.value); setPage(1); }}
                className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700"
              >
                <option value="">Priority: All</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">Ticket ID</th>
                  <th className="py-3 px-4">Title & Details</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Ward</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Assigned Officer</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-500">
                      <span className="inline-block w-5 h-5 border-2 border-civic-600 border-t-transparent rounded-full animate-spin mb-2" />
                      <div>Querying complaints from MySQL...</div>
                    </td>
                  </tr>
                ) : issues.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      No complaints match the specified filters.
                    </td>
                  </tr>
                ) : (
                  issues.map((issue) => (
                    <tr key={issue.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 font-mono font-bold text-civic-700">
                        {issue.ticket_id}
                      </td>
                      <td className="py-3 px-4 max-w-xs">
                        <div className="font-bold text-slate-900 truncate">{issue.title}</div>
                        <div className="text-[11px] text-slate-400 truncate">{issue.address || 'Address unlisted'}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        {issue.category_name}
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        {issue.ward_name || 'N/A'}
                      </td>
                      <td className="py-3 px-4">
                        <PriorityBadge priority={issue.priority} />
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={issue.status} />
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        {issue.officer_name ? (
                          <div className="font-semibold text-slate-900">
                            {issue.officer_name}
                            <span className="text-[10px] text-slate-400 block">#{issue.officer_badge}</span>
                          </div>
                        ) : (
                          <span className="text-rose-500 font-medium">Unassigned</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => handleOpenAssign(issue)}
                            className="px-2.5 py-1 bg-civic-50 hover:bg-civic-100 text-civic-700 border border-civic-200 rounded font-semibold text-[11px] transition"
                            title="Assign to Officer"
                          >
                            Assign
                          </button>
                          <Link
                            to={`/issues/${issue.id}`}
                            className="p-1 text-slate-500 hover:text-slate-900 rounded"
                            title="View Details"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="p-3 bg-slate-50/50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <div>Page {page} of {totalPages}</div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1.5 border border-slate-200 rounded bg-white hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-1.5 border border-slate-200 rounded bg-white hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Admin Assignment Modal */}
      {activeAssignIssue && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Assign Civic Complaint
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  Ticket #{activeAssignIssue.ticket_id}
                </p>
              </div>
              <button
                onClick={() => setActiveAssignIssue(null)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            {assignError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl">
                {assignError}
              </div>
            )}

            <form onSubmit={handleAssignSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Responsible Department *
                </label>
                <select
                  required
                  value={selectedDeptId}
                  onChange={(e) => {
                    setSelectedDeptId(e.target.value);
                    setSelectedOfficerId('');
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white"
                >
                  <option value="">Select Department</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Assign to Field Officer *
                </label>
                <select
                  required
                  value={selectedOfficerId}
                  onChange={(e) => setSelectedOfficerId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white"
                >
                  <option value="">Select Officer</option>
                  {filteredOfficers.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name} (Badge #{o.badge_number || 'N/A'}) - {o.ward_name || 'All Wards'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Set Priority
                  </label>
                  <select
                    value={assignPriority}
                    onChange={(e) => setAssignPriority(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    SLA Deadline *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={assignDeadline}
                    onChange={(e) => setAssignDeadline(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Field Instructions
                </label>
                <textarea
                  rows={3}
                  value={assignInstructions}
                  onChange={(e) => setAssignInstructions(e.target.value)}
                  placeholder="Specific instructions for the dispatched field officer..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveAssignIssue(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assigning}
                  className="px-5 py-2 bg-civic-600 hover:bg-civic-700 text-white rounded-lg text-xs font-semibold shadow-sm transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  {assigning ? 'Dispatching...' : 'Confirm Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
