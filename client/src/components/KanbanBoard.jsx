import React, { useState } from 'react';
import { 
  Clock, 
  ArrowRight, 
  CheckCircle, 
  Droplets, 
  Sparkles, 
  CheckCheck, 
  Receipt, 
  Phone, 
  MessageSquare, 
  AlertCircle,
  Camera,
  CarFront,
  Flame,
  ExternalLink
} from 'lucide-react';

const COLUMNS = [
  { id: 'QUEUED', title: '1. Queued & Checked In', color: 'border-amber-500/30 bg-amber-500/5', icon: Clock, badgeColor: 'bg-amber-500/20 text-amber-300' },
  { id: 'IN_WASH', title: '2. In Wash Bay', color: 'border-blue-500/30 bg-blue-500/5', icon: Droplets, badgeColor: 'bg-blue-500/20 text-blue-300' },
  { id: 'QUALITY_CHECK', title: '3. Detail & QC Inspection', color: 'border-purple-500/30 bg-purple-500/5', icon: Sparkles, badgeColor: 'bg-purple-500/20 text-purple-300' },
  { id: 'COMPLETED', title: '4. Ready for Pickup', color: 'border-emerald-500/30 bg-emerald-500/5', icon: CheckCircle, badgeColor: 'bg-emerald-500/20 text-emerald-300' },
  { id: 'DELIVERED', title: '5. Delivered & Settled', color: 'border-slate-700 bg-slate-800/20', icon: CheckCheck, badgeColor: 'bg-slate-700 text-slate-300' },
];

export default function KanbanBoard({ 
  washes, 
  onStatusChange, 
  onOpenInvoice, 
  onSendWhatsApp,
  onOpenInspection,
  dealer 
}) {
  const [filterQuery, setFilterQuery] = useState('');

  const filteredWashes = washes.filter(w => {
    if (!filterQuery) return true;
    const q = filterQuery.toLowerCase();
    return (
      w.license_plate?.toLowerCase().includes(q) ||
      w.customer_name?.toLowerCase().includes(q) ||
      w.wash_code?.toLowerCase().includes(q) ||
      w.service_name?.toLowerCase().includes(q)
    );
  });

  const getNextStatus = (current) => {
    switch (current) {
      case 'QUEUED': return 'IN_WASH';
      case 'IN_WASH': return 'QUALITY_CHECK';
      case 'QUALITY_CHECK': return 'COMPLETED';
      case 'COMPLETED': return 'DELIVERED';
      default: return null;
    }
  };

  const getElapsedMinutes = (dateStr) => {
    if (!dateStr) return null;
    const mins = Math.max(1, Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60)));
    return mins;
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Quick Stats */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800/80 to-slate-900 border border-slate-800 p-4 sm:p-5 rounded-2xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-white">Live Bay Management & WhatsApp Hub</h1>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-brand-500/10 text-brand-400 border border-brand-500/20">
              {dealer?.name}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time status transitions automatically notify customers on WhatsApp with track links and invoices.
          </p>
        </div>

        {/* Search / Filter */}
        <div className="w-full md:w-72">
          <input
            type="text"
            placeholder="Search plate, customer, code..."
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-brand-500 transition"
          />
        </div>
      </div>

      {/* Kanban Board Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {COLUMNS.map(col => {
          const colWashes = filteredWashes.filter(w => w.status === col.id);
          const ColIcon = col.icon;

          return (
            <div 
              key={col.id} 
              className={`rounded-2xl border p-3.5 flex flex-col min-h-[600px] transition ${col.color}`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <ColIcon className="w-4 h-4 text-slate-300" />
                  <span className="font-bold text-xs text-slate-200">{col.title}</span>
                </div>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${col.badgeColor}`}>
                  {colWashes.length}
                </span>
              </div>

              {/* Cards Container */}
              <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                {colWashes.length === 0 ? (
                  <div className="h-36 rounded-xl border border-dashed border-slate-800/80 flex flex-col items-center justify-center text-slate-500 text-xs">
                    No vehicles here
                  </div>
                ) : (
                  colWashes.map(wash => {
                    const next = getNextStatus(wash.status);
                    const elapsed = getElapsedMinutes(wash.in_wash_time || wash.queue_time);
                    const isFree = Boolean(wash.is_free_wash);

                    return (
                      <div
                        key={wash.id}
                        className={`bg-slate-800/90 hover:bg-slate-800 border rounded-xl p-3.5 shadow-lg transition-all duration-200 relative group ${
                          wash.status === 'IN_WASH' ? 'border-brand-500/40 glow-active' : 'border-slate-700/80'
                        }`}
                      >
                        {/* Plate & Wash Code Header */}
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-1.5">
                            <span className="bg-slate-950 text-amber-300 font-mono font-bold text-xs px-2.5 py-1 rounded-md border border-slate-700 shadow-inner flex items-center gap-1">
                              <CarFront className="w-3.5 h-3.5 text-amber-400" />
                              {wash.license_plate}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">
                              #{wash.wash_code}
                            </span>
                          </div>

                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-700/60 text-slate-300">
                            Bay {wash.bay_number}
                          </span>
                        </div>

                        {/* Vehicle Info */}
                        <div className="mb-2">
                          <div className="text-xs font-semibold text-slate-100">
                            {wash.vehicle_make} {wash.vehicle_model}
                          </div>
                          <div className="text-[11px] text-slate-400 flex items-center justify-between">
                            <span>{wash.customer_name}</span>
                            <span className="font-mono text-[10px]">{wash.customer_phone}</span>
                          </div>
                        </div>

                        {/* Service & Addons */}
                        <div className="bg-slate-900/60 rounded-lg p-2 mb-2 border border-slate-800 text-[11px]">
                          <div className="text-slate-300 font-medium">
                            {wash.service_name}
                          </div>
                          {wash.addons && wash.addons.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {wash.addons.map((ad, idx) => (
                                <span key={idx} className="text-[9px] px-1.5 py-0.2 bg-slate-800 text-slate-400 rounded">
                                  +{ad.name}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* 4th Wash Free Badge (Loyalty Highlight!) */}
                        {isFree && (
                          <div className="mb-2.5 p-2 rounded-lg bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/40 text-[11px] text-amber-200 flex items-center gap-1.5">
                            <Flame className="w-4 h-4 text-amber-400 shrink-0" />
                            <div>
                              <span className="font-bold">4th Wash 100% FREE!</span>
                              <div className="text-[10px] text-amber-300/80">
                                Subscribed 2+ Vehicles Loyalty Perk Applied
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Timer / Staff */}
                        <div className="flex items-center justify-between text-[10px] text-slate-400 mb-3 pt-1 border-t border-slate-700/50">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-brand-400" />
                            {elapsed ? `${elapsed} mins ago` : 'Just queued'}
                          </span>
                          <span>Staff: {wash.washer_staff || 'Staff'}</span>
                        </div>

                        {/* Actions Toolbar */}
                        <div className="space-y-1.5">
                          {/* Next Transition Button */}
                          {next && (
                            <button
                              onClick={() => onStatusChange(wash.id, next)}
                              className={`w-full py-1.5 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                                next === 'COMPLETED'
                                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30'
                                  : next === 'IN_WASH'
                                  ? 'bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-600/30'
                                  : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                              }`}
                            >
                              <span>Advance to {next.replace('_', ' ')}</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Quick WhatsApp & Invoice Buttons */}
                          <div className="grid grid-cols-2 gap-1.5 pt-1">
                            {/* WhatsApp Button */}
                            <button
                              onClick={() => onSendWhatsApp(wash)}
                              className="py-1 px-2 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-500/30 text-[11px] font-medium flex items-center justify-center gap-1 transition"
                              title="Send WhatsApp update to customer"
                            >
                              <MessageSquare className="w-3 h-3 text-emerald-400" />
                              <span>WhatsApp</span>
                            </button>

                            {/* View Invoice */}
                            <button
                              onClick={() => onOpenInvoice(wash.id)}
                              className="py-1 px-2 rounded-lg bg-slate-700/60 hover:bg-slate-700 text-slate-300 border border-slate-600/50 text-[11px] font-medium flex items-center justify-center gap-1 transition"
                              title="View and print invoice"
                            >
                              <Receipt className="w-3 h-3 text-slate-300" />
                              <span>Invoice</span>
                            </button>
                          </div>

                          {/* Inspection Photo preview if available */}
                          {wash.before_photo && (
                            <div className="pt-1 flex items-center justify-between text-[10px] text-slate-400">
                              <span className="flex items-center gap-1">
                                <Camera className="w-3 h-3 text-slate-400" /> Photo attached
                              </span>
                              <a 
                                href={wash.before_photo} 
                                target="_blank" 
                                rel="noreferrer"
                                className="text-brand-400 hover:underline flex items-center gap-0.5"
                              >
                                View <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            </div>
                          )}
                        </div>

                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
