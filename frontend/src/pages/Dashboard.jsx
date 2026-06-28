import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { showToast } from '../components/Toast';
import MetricCard from '../components/MetricCard';
import { 
  DollarSign, 
  ShoppingCart, 
  Users, 
  Package, 
  Percent, 
  TrendingUp,
  Activity,
  Award
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

// Theme-compatible chart color constants
const COLORS = {
  indigo: '#6366f1',
  violet: '#8b5cf6',
  emerald: '#10b981',
  rose: '#f43f5e',
  amber: '#f59e0b',
  sky: '#0ea5e9',
  slate: '#64748b'
};

const PIE_COLORS = [COLORS.emerald, COLORS.amber, COLORS.rose];

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [kpiData, setKpiData] = useState(null);
  const [chartData, setChartData] = useState(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [kpiRes, chartRes] = await Promise.all([
        api.get('/dashboard'),
        api.get('/analytics')
      ]);
      setKpiData(kpiRes.data);
      setChartData(chartRes.data);
    } catch (err) {
      console.error(err);
      showToast('Failed to load dashboard metrics.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // Listen to topbar refresh trigger
    const handleGlobalRefresh = () => {
      fetchDashboardData();
    };

    window.addEventListener('app-refresh', handleGlobalRefresh);
    return () => window.removeEventListener('app-refresh', handleGlobalRefresh);
  }, []);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(val);
  };

  const formatNumber = (val) => {
    return new Intl.NumberFormat('en-US').format(val);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Completed':
        return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400';
      case 'Pending':
        return 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400';
      default:
        return 'bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400';
    }
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-fade-in">
      
      {/* 1. Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <MetricCard
          title="Total Revenue"
          value={loading ? '' : formatCurrency(kpiData?.total_revenue)}
          icon={DollarSign}
          color="brand"
          change={loading ? undefined : `${kpiData?.monthly_growth >= 0 ? '+' : ''}${kpiData?.monthly_growth}%`}
          changeType={loading ? undefined : (kpiData?.monthly_growth >= 0 ? 'positive' : 'negative')}
          loading={loading}
        />
        <MetricCard
          title="Total Orders"
          value={loading ? '' : formatNumber(kpiData?.total_orders)}
          icon={ShoppingCart}
          color="emerald"
          loading={loading}
        />
        <MetricCard
          title="Total Customers"
          value={loading ? '' : formatNumber(kpiData?.total_customers)}
          icon={Users}
          color="blue"
          loading={loading}
        />
        <MetricCard
          title="Total Products"
          value={loading ? '' : formatNumber(kpiData?.total_products)}
          icon={Package}
          color="amber"
          loading={loading}
        />
        <MetricCard
          title="Avg Order Value"
          value={loading ? '' : formatCurrency(kpiData?.avg_order_value)}
          icon={TrendingUp}
          color="violet"
          loading={loading}
        />
        <MetricCard
          title="Monthly Growth"
          value={loading ? '' : `${kpiData?.monthly_growth >= 0 ? '+' : ''}${kpiData?.monthly_growth}%`}
          icon={Percent}
          color={kpiData?.monthly_growth >= 0 ? 'emerald' : 'rose'}
          loading={loading}
        />
      </div>

      {/* 2. Primary Charts: Line & Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Line Chart: Monthly Revenue */}
        <div className="p-5 md:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-premium">
          <h3 className="font-display font-bold text-base text-slate-800 dark:text-slate-100 mb-4">
            Monthly Revenue Trends
          </h3>
          <div className="h-80 w-full">
            {loading ? (
              <div className="h-full flex items-center justify-center bg-slate-50/50 dark:bg-slate-950/20 rounded-xl animate-pulse" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData?.revenue_by_month} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.15)" />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                  <Tooltip formatter={(value) => [formatCurrency(value), 'Revenue']} />
                  <Legend />
                  <Line
                    name="Completed Revenue"
                    type="monotone"
                    dataKey="revenue"
                    stroke={COLORS.indigo}
                    strokeWidth={3}
                    activeDot={{ r: 6 }}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Bar Chart: Sales by Category */}
        <div className="p-5 md:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-premium">
          <h3 className="font-display font-bold text-base text-slate-800 dark:text-slate-100 mb-4">
            Sales Revenue by Category
          </h3>
          <div className="h-80 w-full">
            {loading ? (
              <div className="h-full flex items-center justify-center bg-slate-50/50 dark:bg-slate-950/20 rounded-xl animate-pulse" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData?.category_distribution} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.15)" />
                  <XAxis dataKey="category" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                  <Tooltip formatter={(value) => [formatCurrency(value), 'Sales']} />
                  <Bar dataKey="value" name="Revenue" fill={COLORS.sky} radius={[6, 6, 0, 0]}>
                    {chartData?.category_distribution?.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={index === 0 ? COLORS.indigo : index === 1 ? COLORS.sky : COLORS.emerald} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

      </div>

      {/* 3. Secondary Charts: Area & Pie */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Area Chart: Revenue Growth */}
        <div className="lg:col-span-2 p-5 md:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-premium">
          <h3 className="font-display font-bold text-base text-slate-800 dark:text-slate-100 mb-4">
            Daily Revenue Trends (Last 30 Active Days)
          </h3>
          <div className="h-80 w-full">
            {loading ? (
              <div className="h-full flex items-center justify-center bg-slate-50/50 dark:bg-slate-950/20 rounded-xl animate-pulse" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData?.revenue_trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.emerald} stopOpacity={0.2}/>
                      <stop offset="95%" stopColor={COLORS.emerald} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.15)" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                  <Tooltip formatter={(value) => [formatCurrency(value), 'Revenue']} />
                  <Area
                    name="Daily Revenue"
                    type="monotone"
                    dataKey="revenue"
                    stroke={COLORS.emerald}
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Pie Chart: Orders by Status */}
        <div className="p-5 md:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-premium">
          <h3 className="font-display font-bold text-base text-slate-800 dark:text-slate-100 mb-4">
            Order Status Breakdown
          </h3>
          <div className="h-80 w-full relative flex items-center justify-center">
            {loading ? (
              <div className="h-full w-full flex items-center justify-center bg-slate-50/50 dark:bg-slate-950/20 rounded-xl animate-pulse" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center">
                <ResponsiveContainer width="100%" height="70%">
                  <PieChart>
                    <Pie
                      data={chartData?.status_distribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="count"
                      nameKey="status"
                    >
                      {chartData?.status_distribution?.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [formatNumber(value), 'Sales Count']} />
                  </PieChart>
                </ResponsiveContainer>
                {/* Custom Legend */}
                <div className="flex justify-center gap-4 mt-2">
                  {chartData?.status_distribution?.map((entry, index) => (
                    <div key={entry.status} className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                      <span 
                        className="w-2.5 h-2.5 rounded-full" 
                        style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }} 
                      />
                      <span className="capitalize">{entry.status} ({entry.count})</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* 4. Recent Activity and Top Performing Products Panels */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        
        {/* Recent Activity Panel */}
        <div className="p-5 md:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-premium">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-display font-bold text-base text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Activity size={18} className="text-brand-500" />
              Recent Activities
            </h3>
            <span className="text-xs text-slate-400">Latest 5 sales</span>
          </div>
          
          <div className="space-y-4">
            {loading ? (
              [...Array(5)].map((_, i) => (
                <div key={i} className="flex justify-between items-center py-2 animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-800" />
                    <div className="space-y-1.5">
                      <div className="h-3.5 w-28 bg-slate-200 dark:bg-slate-800 rounded" />
                      <div className="h-3 w-36 bg-slate-200 dark:bg-slate-800 rounded" />
                    </div>
                  </div>
                  <div className="h-4 w-12 bg-slate-200 dark:bg-slate-800 rounded" />
                </div>
              ))
            ) : kpiData?.recent_activity?.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-500">No activity recorded.</div>
            ) : (
              kpiData?.recent_activity?.map((act) => (
                <div 
                  key={act.id} 
                  className="flex justify-between items-center p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-600 dark:text-slate-300">
                      {act.customer_name.substring(0, 1)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {act.customer_name} bought <span className="font-bold text-brand-600 dark:text-brand-400">{act.product_name}</span>
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        {act.quantity} unit{act.quantity > 1 ? 's' : ''} • {act.date}
                      </p>
                    </div>
                  </div>
                  <div className="text-right ml-2 shrink-0">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {formatCurrency(act.total_price)}
                    </p>
                    <span className={`inline-block text-[9px] px-1.5 py-0.5 rounded font-semibold mt-1 ${getStatusBadge(act.status)}`}>
                      {act.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Performing Products Panel */}
        <div className="p-5 md:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-premium">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-display font-bold text-base text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Award size={18} className="text-brand-500" />
              Top Performing Products
            </h3>
            <span className="text-xs text-slate-400">By sales volume</span>
          </div>
          
          <div className="space-y-4">
            {loading ? (
              [...Array(5)].map((_, i) => (
                <div key={i} className="flex justify-between items-center py-2 animate-pulse">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-800" />
                    <div className="space-y-1.5 flex-1">
                      <div className="h-3.5 w-1/3 bg-slate-200 dark:bg-slate-800 rounded" />
                      <div className="h-3 w-1/4 bg-slate-200 dark:bg-slate-800 rounded" />
                    </div>
                  </div>
                  <div className="h-4 w-16 bg-slate-200 dark:bg-slate-800 rounded" />
                </div>
              ))
            ) : kpiData?.top_products?.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-500">No products recorded.</div>
            ) : (
              kpiData?.top_products?.map((prod, index) => (
                <div 
                  key={prod.product_name} 
                  className="flex justify-between items-center p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0
                      ${index === 0 ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400' : 
                        index === 1 ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' :
                        index === 2 ? 'bg-orange-50 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400' :
                        'bg-slate-50 text-slate-500 dark:bg-slate-900 dark:text-slate-500'}
                    `}>
                      #{index + 1}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {prod.product_name}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        Category: {prod.category_name} • {prod.units_sold} units sold
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {formatCurrency(prod.revenue)}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Total Revenue</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
      
    </div>
  );
};

export default Dashboard;
