import React from 'react';

const priorityConfig = {
  low: {
    label: 'Low',
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-200'
  },
  medium: {
    label: 'Medium',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200'
  },
  high: {
    label: 'High',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200'
  },
  urgent: {
    label: 'Urgent',
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200'
  }
};

export const PriorityBadge = ({ priority }) => {
  const config = priorityConfig[priority] || priorityConfig.medium;

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${config.bg} ${config.text} ${config.border}`}>
      {config.label}
    </span>
  );
};

export default PriorityBadge;
