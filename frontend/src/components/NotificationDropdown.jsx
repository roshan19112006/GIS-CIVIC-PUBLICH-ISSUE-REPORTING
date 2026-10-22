import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, Clock, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import issueService from '../services/issueService';

export const NotificationDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    try {
      const res = await issueService.getNotifications();
      if (res.data?.success) {
        setNotifications(res.data.data || []);
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch (err) {
      console.warn('Could not fetch notifications:', err.message);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // 30s poll
    return () => clearInterval(interval);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkRead = async (id, e) => {
    e.stopPropagation();
    try {
      await issueService.markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await issueService.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  const handleItemClick = (notification) => {
    if (!notification.is_read) {
      issueService.markNotificationRead(notification.id).catch(() => {});
      setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, is_read: 1 } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
    setIsOpen(false);
    if (notification.issue_id) {
      navigate(`/issues/${notification.issue_id}`);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
        title="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white shadow-sm ring-2 ring-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden animate-in fade-in duration-150">
          <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-900 text-sm">Notifications</span>
              {unreadCount > 0 && (
                <span className="bg-civic-100 text-civic-700 text-xs px-2 py-0.5 rounded-full font-medium">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-civic-600 hover:text-civic-700 font-medium hover:underline flex items-center gap-1"
              >
                <Check className="w-3 h-3" /> Mark all as read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-sm">
                No notifications yet.
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleItemClick(n)}
                  className={`p-3.5 hover:bg-slate-50 transition cursor-pointer flex gap-3 ${
                    !n.is_read ? 'bg-blue-50/40' : ''
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className={`text-xs font-semibold ${!n.is_read ? 'text-slate-900' : 'text-slate-700'}`}>
                        {n.title}
                      </h4>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(n.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 line-clamp-2">{n.message}</p>
                  </div>
                  {!n.is_read && (
                    <button
                      onClick={(e) => handleMarkRead(n.id, e)}
                      title="Mark as read"
                      className="p-1 text-slate-400 hover:text-slate-700 rounded self-start"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
