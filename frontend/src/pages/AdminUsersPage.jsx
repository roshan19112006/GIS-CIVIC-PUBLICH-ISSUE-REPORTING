import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Shield,
  Wrench,
  User,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Lock,
  Mail,
  Phone,
  Building
} from 'lucide-react';
import issueService from '../services/issueService';
import Sidebar from '../components/Sidebar';

export const AdminUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [wards, setWards] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [roleFilter, setRoleFilter] = useState('');
  const [search, setSearch] = useState('');

  // New Officer Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('Password@123');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('officer');
  const [departmentId, setDepartmentId] = useState('');
  const [wardId, setWardId] = useState('');
  const [badgeNumber, setBadgeNumber] = useState('');
  const [creating, setCreating] = useState(false);
  const [modalError, setModalError] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const [userRes, deptRes, wardRes] = await Promise.all([
        issueService.getUsers({ role: roleFilter || undefined, search: search || undefined }),
        issueService.getDepartments(),
        issueService.getWards()
      ]);

      if (userRes.data?.success) setUsers(userRes.data.data || []);
      if (deptRes.data?.success) setDepartments(deptRes.data.data || []);
      if (wardRes.data?.success) setWards(wardRes.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter, search]);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!name || !email) {
      setModalError('Name and email are required.');
      return;
    }

    setCreating(true);
    setModalError(null);

    try {
      const res = await issueService.createUser({
        name: name.trim(),
        email: email.trim(),
        password,
        role,
        phone: phone.trim() || null,
        department_id: departmentId ? parseInt(departmentId, 10) : null,
        ward_id: wardId ? parseInt(wardId, 10) : null,
        badge_number: badgeNumber.trim() || null
      });

      if (res.data?.success) {
        setShowCreateModal(false);
        setName('');
        setEmail('');
        setPhone('');
        setBadgeNumber('');
        fetchUsers();
      } else {
        setModalError(res.data?.message || 'Failed to create user');
      }
    } catch (err) {
      console.error(err);
      setModalError(err.response?.data?.message || 'Failed to create user');
    } finally {
      setCreating(false);
    }
  };

  const handleToggleActive = async (user) => {
    try {
      await issueService.updateUser(user.id, { is_active: !user.is_active });
      fetchUsers();
    } catch (err) {
      console.error(err);
      alert('Failed to update user status.');
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] bg-slate-50">
      <Sidebar />

      <main className="flex-1 p-4 sm:p-8 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              User & Officer Administration
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Create and manage municipal field officer accounts, assign departmental wards, and supervise citizens.
            </p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-civic-600 hover:bg-civic-700 text-white font-semibold text-xs shadow-sm transition"
          >
            <UserPlus className="w-4 h-4" /> Create New Officer Account
          </button>
        </div>

        {/* Users Filter Bar */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4 bg-slate-50/60">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-bold text-slate-700">Accounts ({users.length}):</span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Search name, badge..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 pr-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-hidden w-40 sm:w-48"
                />
              </div>

              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700"
              >
                <option value="">Role: All</option>
                <option value="officer">Field Officers</option>
                <option value="citizen">Citizens</option>
                <option value="admin">Administrators</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">Name & Email</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Ward</th>
                  <th className="py-3 px-4">Badge #</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500">
                      Loading user records...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      No users match the criteria.
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{u.name}</div>
                        <div className="text-[11px] text-slate-400">{u.email}</div>
                      </td>
                      <td className="py-3 px-4 capitalize">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold ${
                          u.role === 'admin' ? 'bg-rose-100 text-rose-800' : u.role === 'officer' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        {u.department_name || '—'}
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        {u.ward_name ? `${u.ward_number} (${u.ward_name})` : '—'}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">
                        {u.badge_number || '—'}
                      </td>
                      <td className="py-3 px-4">
                        {u.is_active ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold text-[11px]">
                            <CheckCircle className="w-3.5 h-3.5" /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-rose-600 font-semibold text-[11px]">
                            <XCircle className="w-3.5 h-3.5" /> Inactive
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {u.role !== 'admin' && (
                          <button
                            onClick={() => handleToggleActive(u)}
                            className="px-2.5 py-1 text-[11px] font-semibold rounded border border-slate-200 hover:bg-slate-100 text-slate-700"
                          >
                            {u.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Create Officer Account Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                Create Field Officer Account
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            {modalError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl">
                {modalError}
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Officer Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ramesh Chandra"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Official Email Address *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="officer.name@civic.gov"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Badge Number</label>
                  <input
                    type="text"
                    value={badgeNumber}
                    onChange={(e) => setBadgeNumber(e.target.value)}
                    placeholder="e.g. RO-502"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98450 00000"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Department</label>
                  <select
                    value={departmentId}
                    onChange={(e) => setDepartmentId(e.target.value)}
                    className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white"
                  >
                    <option value="">Select Dept</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.code}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Primary Ward</label>
                  <select
                    value={wardId}
                    onChange={(e) => setWardId(e.target.value)}
                    className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white"
                  >
                    <option value="">Select Ward</option>
                    {wards.map((w) => (
                      <option key={w.id} value={w.id}>{w.ward_number}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Temporary Password</label>
                <input
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 bg-civic-600 hover:bg-civic-700 text-white rounded-lg font-semibold disabled:opacity-50"
                >
                  {creating ? 'Saving...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsersPage;
