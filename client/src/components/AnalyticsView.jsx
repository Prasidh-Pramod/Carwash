import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  Clock, 
  Car, 
  Users, 
  Download, 
  CheckCircle2, 
  Flame, 
  ArrowUpRight,
  ShieldCheck,
  Calendar,
  Layers,
  Award,
  Zap
} from 'lucide-react';

export default function AnalyticsView({ washes = [], invoices = [], customers = [], dealer = { currency: '$' } }) {
  const [timeRange, setTimeRange] = useState('ALL'); // 'ALL' | 'TODAY' | 'WEEK'

  // Filter datasets by time range
  const filteredInvoices = useMemo(() => {
    if (timeRange === 'ALL') return invoices;
    const now = new Date();
    return invoices.filter(inv => {
      const d = new Date(inv.issued_at || inv.created_at);
      if (timeRange === 'TODAY') {
        return d.toDateString() === now.toDateString();
      }
      if (timeRange === 'WEEK') {
        const diffDays = (now - d) / (1000 * 60 * 60 * 24);
        return diffDays <= 7;
      }
      return true;
    });
  }, [invoices, timeRange]);

  const filteredWashes = useMemo(() => {
    if (timeRange === 'ALL') return washes;
    const now = new Date();
    return washes.filter(w => {
      const d = new Date(w.queue_time || w.created_at);
      if (timeRange === 'TODAY') {
        return d.toDateString() === now.toDateString();
      }
      if (timeRange === 'WEEK') {
        const diffDays = (now - d) / (1000 * 60 * 60 * 24);
        return diffDays <= 7;
      }
      return true;
    });
  }, [washes, timeRange]);

  // Financial Metrics
  const settledRevenue = useMemo(() => {
    return filteredInvoices
      .filter(i => i.status === 'PAID')
      .reduce((sum, i) => sum + Number(i.total || 0), 0);
  }, [filteredInvoices]);

  const avgTicketPrice = useMemo(() => {
    const paid = filteredInvoices.filter(i => i.status === 'PAID');
    if (paid.length === 0) return 0;
    return settledRevenue / paid.length;
  }, [filteredInvoices, settledRevenue]);

  // Turnaround Time Calculation (Queue to Completed/Delivered)
  const avgTurnaroundMins = useMemo(() => {
    const completed = filteredWashes.filter(w => w.completed_time && w.queue_time);
    if (completed.length === 0) return 22; // default industry benchmark
    const totalMinutes = completed.reduce((acc, w) => {
      const q = new Date(w.queue_time).getTime();
      const c = new Date(w.completed_time).getTime();
      const diff = Math.max(5, Math.round((c - q) / 60000));
      return acc + diff;
    }, 0);
    return Math.round(totalMinutes / completed.length);
  }, [filteredWashes]);

  // Service Breakdown
  const serviceStats = useMemo(() => {
    const map = new Map();
    filteredWashes.forEach(w => {
      const name = w.service_name || 'Standard Wash';
      map.set(name, (map.get(name) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([name, count]) => ({
        name,
        count,
        percent: filteredWashes.length ? Math.round((count / filteredWashes.length) * 100) : 0
      }))
      .sort((a, b) => b.count - a.count);
  }, [filteredWashes]);

  // Bay Utilization
  const bayStats = useMemo(() => {
    const bays = { 'Bay 1': 0, 'Bay 2': 0, 'Bay 3': 0 };
    filteredWashes.forEach(w => {
      const key = `Bay ${w.bay_number || 1}`;
      if (bays[key] !== undefined) bays[key]++;
      else bays[key] = 1;
    });
    return Object.entries(bays).map(([bay, count]) => ({ bay, count }));
  }, [filteredWashes]);

  // Hourly Traffic Heatmap (Bucketed: Morning, Mid-day, Afternoon, Evening)
  const rushHours = useMemo(() => {
    const buckets = [
      { label: '08:00 - 11:00 (Morning Rush)', count: 0 },
      { label: '11:00 - 14:00 (Lunch Rush)', count: 0 },
      { label: '14:00 - 17:00 (Afternoon Flow)', count: 0 },
      { label: '17:00 - 20:00 (Evening Rush)', count: 0 },
    ];
    filteredWashes.forEach(w => {
      if (!w.queue_time) return;
      const hour = new Date(w.queue_time).getHours();
      if (hour >= 8 && hour < 11) buckets[0].count++;
      else if (hour >= 11 && hour < 14) buckets[1].count++;
      else if (hour >= 14 && hour < 17) buckets[2].count++;
      else if (hour >= 17 && hour < 20) buckets[3].count++;
    });
    return buckets;
  }, [filteredWashes]);

  // Export Financial Ledger to CSV
  const handleExportCSV = () => {
    const headers = ['Invoice Number', 'Ticket Code', 'Date', 'Customer Name', 'Phone', 'License Plate', 'Vehicle', 'Service', 'Total Amount', 'Status', 'Payment Method'];
    const rows = filteredInvoices.map(i => [
      i.invoice_number,
      i.wash_code,
      i.issued_at,
      `"${i.customer_name || ''}"`,
      `"${i.customer_phone || ''}"`,
      i.license_plate,
      `"${i.vehicle_make || ''} ${i.vehicle_model || ''}"`,
      `"${i.service_name || ''}"`,
      i.total,
      i.status,
      i.payment_method || 'Pending'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `washflow-reconciliation-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header & Range Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#111827] border border-slate-800 p-5 rounded-2xl shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white tracking-tight">Executive Performance & Revenue</h1>
            <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
              Live BI Engine
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time throughput metrics, financial reconciliation, and bay capacity analytics.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Time Scope Toggle */}
          <div className="inline-flex rounded-xl bg-slate-900 p-0.5 border border-slate-800 text-xs font-semibold">
            {['ALL', 'WEEK', 'TODAY'].map(t => (
              <button
                key={t}
                onClick={() => setTimeRange(t)}
                className={`px-3 py-1.5 rounded-lg transition ${
                  timeRange === t ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                {t === 'ALL' ? 'All Time' : t === 'WEEK' ? 'Last 7 Days' : 'Today'}
              </button>
            ))}
          </div>

          {/* Export CSV Button */}
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition flex items-center gap-1.5"
            title="Download End-Of-Day Reconciliation Spreadsheet"
          >
            <Download className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Settled Revenue */}
        <div className="bg-[#111827] border border-slate-800 p-5 rounded-2xl shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Settled Revenue</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-white mt-2">
            {dealer.currency}{settledRevenue.toFixed(2)}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-emerald-400 mt-2 font-medium">
            <ArrowUpRight className="w-3 h-3" />
            <span>{filteredInvoices.filter(i => i.status === 'PAID').length} Paid Invoices</span>
          </div>
        </div>

        {/* Average Turnaround Speed */}
        <div className="bg-[#111827] border border-slate-800 p-5 rounded-2xl shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Avg Turnaround Speed</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-white mt-2">
            {avgTurnaroundMins} <span className="text-sm font-normal text-slate-400">mins/car</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-blue-400 mt-2 font-medium">
            <CheckCircle2 className="w-3 h-3" />
            <span>Optimal Bay Throughput</span>
          </div>
        </div>

        {/* Average Ticket Value */}
        <div className="bg-[#111827] border border-slate-800 p-5 rounded-2xl shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Average Ticket Value</span>
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-white mt-2">
            {dealer.currency}{avgTicketPrice.toFixed(2)}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-2 font-medium">
            <span>Per Serviced Vehicle</span>
          </div>
        </div>

        {/* Fleet & Customer Retention */}
        <div className="bg-[#111827] border border-slate-800 p-5 rounded-2xl shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Registered Customers</span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-white mt-2">
            {customers.length} <span className="text-sm font-normal text-slate-400">profiles</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-purple-400 mt-2 font-medium">
            <ShieldCheck className="w-3 h-3" />
            <span>{customers.filter(c => c.is_subscribed).length} Subscribed Members</span>
          </div>
        </div>

      </div>

      {/* Two Column Section: Services & Peak Hours */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Package Popularity Breakdown */}
        <div className="bg-[#111827] border border-slate-800 p-5 rounded-2xl shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-400" />
              <span>Service Tier Distribution</span>
            </h2>
            <span className="text-xs text-slate-400">{filteredWashes.length} total washes</span>
          </div>

          <div className="space-y-3 pt-1">
            {serviceStats.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs">No wash data in this time range</div>
            ) : (
              serviceStats.map(s => (
                <div key={s.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-200">{s.name}</span>
                    <span className="font-mono text-slate-400">{s.count} washes ({s.percent}%)</span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(5, s.percent)}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Rush Hours & Peak Traffic */}
        <div className="bg-[#111827] border border-slate-800 p-5 rounded-2xl shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-cyan-400" />
              <span>Peak Intake Rush Windows</span>
            </h2>
            <span className="text-xs text-slate-400">Facility Traffic</span>
          </div>

          <div className="space-y-3 pt-1">
            {rushHours.map(r => {
              const max = Math.max(1, ...rushHours.map(h => h.count));
              const pct = Math.round((r.count / max) * 100);
              return (
                <div key={r.label} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-200">{r.label}</span>
                    <span className="font-mono text-cyan-400 font-semibold">{r.count} cars</span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                    <div 
                      className="bg-cyan-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(4, pct)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Bay Utilization Section */}
      <div className="bg-[#111827] border border-slate-800 p-5 rounded-2xl shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Car className="w-4 h-4 text-emerald-400" />
            <span>Wash Bay Productivity & Allocation</span>
          </h2>
          <span className="text-xs text-slate-400">Live Bay Load</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
          {bayStats.map(b => (
            <div key={b.bay} className="p-4 rounded-xl bg-slate-900/90 border border-slate-800/90 flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-slate-400">{b.bay}</div>
                <div className="text-xl font-bold font-mono text-white mt-1">{b.count} vehicles</div>
              </div>
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold font-mono text-xs">
                #{b.bay.replace('Bay ', '')}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
