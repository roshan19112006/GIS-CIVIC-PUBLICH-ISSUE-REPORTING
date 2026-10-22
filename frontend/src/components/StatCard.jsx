import React from 'react';

export const StatCard = ({ title, value, subtitle, icon: Icon, color = 'blue', onClick }) => {
  const colorMap = {
    blue: {
      bg: 'bg-blue-50',
      text: 'text-blue-600',
      border: 'border-blue-100',
      badge: 'bg-blue-100 text-blue-800'
    },
    amber: {
      bg: 'bg-amber-50',
      text: 'text-amber-600',
      border: 'border-amber-100',
      badge: 'bg-amber-100 text-amber-800'
    },
    purple: {
      bg: 'bg-purple-50',
      text: 'text-purple-600',
      border: 'border-purple-100',
      badge: 'bg-purple-100 text-purple-800'
    },
    emerald: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-600',
      border: 'border-emerald-100',
      badge: 'bg-emerald-100 text-emerald-800'
    },
    rose: {
      bg: 'bg-rose-50',
      text: 'text-rose-600',
      border: 'border-rose-100',
      badge: 'bg-rose-100 text-rose-800'
    },
    slate: {
      bg: 'bg-slate-50',
      text: 'text-slate-600',
      border: 'border-slate-100',
      badge: 'bg-slate-100 text-slate-800'
    }
  };

  const scheme = colorMap[color] || colorMap.blue;

  return (
    <div
      onClick={onClick}
      className={`bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm hover:shadow-md transition duration-200 flex flex-col justify-between ${
        onClick ? 'cursor-pointer hover:border-slate-300' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-500">{title}</span>
        {Icon && (
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${scheme.bg} ${scheme.text}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="mt-3">
        <div className="text-3xl font-extrabold text-slate-900 tracking-tight">{value}</div>
        {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
      </div>
    </div>
  );
};

export default StatCard;
