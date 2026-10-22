import React, { useState, useEffect } from 'react';
import { Activity, Shield, Clock, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import issueService from '../services/issueService';
import Sidebar from '../components/Sidebar';

export const AuditLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await issueService.getAuditLogs({ page, limit: 15 });
      if (res.data?.success) {
        setLogs(res.data.data || []);
        setTotalPages(res.data.totalPages || 1);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page]);

  return (
    <div className="flex min-h-[calc(100vh-4rem)] bg-slate-50">
      <Sidebar />

      <main className="flex-1 p-4 sm:p-8 max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Security & Workflow Audit Trail
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Immutable system audit logs recording authentication, assignment events, and status transitions.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50/60 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-purple-600" /> System Events
            </span>
            <span className="text-xs text-slate-500">Page {page} of {totalPages}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Entity</th>
                  <th className="py-3 px-4">IP Address</th>
                  <th className="py-3 px-4">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500 font-sans">
                      Loading audit logs from MySQL...
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 font-sans">
                      No audit events recorded yet.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition text-[11px]">
                      <td className="py-2.5 px-4 text-slate-500 whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </td>
                      <td className="py-2.5 px-4 font-bold text-civic-700">
                        {log.action}
                      </td>
                      <td className="py-2.5 px-4 font-sans text-slate-800">
                        {log.user_name || 'System / Guest'}
                        {log.user_role && <span className="text-[10px] text-slate-400 block">({log.user_role})</span>}
                      </td>
                      <td className="py-2.5 px-4 text-slate-600 capitalize">
                        {log.entity_type} #{log.entity_id || 'N/A'}
                      </td>
                      <td className="py-2.5 px-4 text-slate-400">
                        {log.ip_address || '127.0.0.1'}
                      </td>
                      <td className="py-2.5 px-4 text-slate-500 max-w-xs truncate" title={JSON.stringify(log.details)}>
                        {log.details ? JSON.stringify(log.details) : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="p-3 bg-slate-50/50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <div>Audit retention active</div>
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
    </div>
  );
};

export default AuditLogsPage;
