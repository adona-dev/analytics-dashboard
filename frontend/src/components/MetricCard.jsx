import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

const MetricCard = ({ title, value, icon: Icon, change, changeType, color = 'brand', loading = false }) => {
  if (loading) {
    return (
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-premium animate-pulse">
        <div className="flex justify-between items-start">
          <div className="space-y-3 flex-1">
            <div className="h-3 w-2/5 bg-slate-200 dark:bg-slate-800 rounded" />
            <div className="h-7 w-3/5 bg-slate-200 dark:bg-slate-800 rounded" />
          </div>
          <div className="w-10 h-10 bg-slate-200 dark:bg-slate-800 rounded-xl" />
        </div>
        <div className="mt-4 h-4 w-1/2 bg-slate-200 dark:bg-slate-800 rounded" />
      </div>
    );
  }

  // Determine badge colors based on changeType
  const isPositive = changeType === 'positive';
  const isNegative = changeType === 'negative';
  
  const getBadgeStyle = () => {
    if (isPositive) return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400';
    if (isNegative) return 'bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400';
    return 'bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-400';
  };

  const getIconContainerStyle = () => {
    switch (color) {
      case 'emerald':
        return 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400';
      case 'rose':
        return 'bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400';
      case 'amber':
        return 'bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400';
      case 'blue':
        return 'bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400';
      default:
        return 'bg-brand-50 text-brand-600 dark:bg-brand-950/30 dark:text-brand-400';
    }
  };

  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-premium hover:shadow-lg dark:hover:shadow-black/10 hover:-translate-y-0.5 transition-all duration-300 group">
      <div className="flex justify-between items-start">
        <div>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            {title}
          </span>
          <h3 className="font-display font-bold text-2xl md:text-3xl text-slate-800 dark:text-slate-100 tracking-tight mt-1">
            {value}
          </h3>
        </div>
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-105 ${getIconContainerStyle()}`}>
          <Icon size={20} />
        </div>
      </div>

      {change !== undefined && (
        <div className="mt-4 flex items-center gap-2">
          <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-lg text-xs font-semibold ${getBadgeStyle()}`}>
            {isPositive && <ArrowUpRight size={14} />}
            {isNegative && <ArrowDownRight size={14} />}
            {!isPositive && !isNegative && <Minus size={14} />}
            {change}
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            vs last month
          </span>
        </div>
      )}
    </div>
  );
};

export default MetricCard;
