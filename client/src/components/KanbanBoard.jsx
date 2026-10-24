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
  ExternalLink,
  Pencil,
  X,
  SlidersHorizontal,
  ChevronRight
} from 'lucide-react';

const COLUMNS = [
  { id: 'QUEUED', title: '1. Queued & Intake', shortTitle: 'Queued', color: 'border-slate-800 bg-slate-900/50', icon: Clock, badgeColor: 'bg-amber-500/10 text-amber-300 border border-amber-500/20' },
  { id: 'IN_WASH', title: '2. In Wash Bay', shortTitle: 'In Bay', color: 'border-slate-800 bg-slate-900/50', icon: Droplets, badgeColor: 'bg-blue-500/10 text-blue-300 border border-blue-500/20' },
  { id: 'QUALITY_CHECK', title: '3. Detail & QC', shortTitle: 'Detail / QC', color: 'border-slate-800 bg-slate-900/50', icon: Sparkles, badgeColor: 'bg-purple-500/10 text-purple-300 border border-purple-500/20' },
  { id: 'COMPLETED', title: '4. Ready for Pickup', shortTitle: 'Ready', color: 'border-slate-800 bg-slate-900/50', icon: CheckCircle, badgeColor: 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20' },
  { id: 'DELIVERED', title: '5. Delivered & Settled', shortTitle: 'Delivered', color: 'border-slate-800 bg-slate-900/50', icon: CheckCheck, badgeColor: 'bg-slate-800 text-slate-300 border border-slate-700' },
];

export default function KanbanBoard({ 
  washes, 
  onStatusChange, 
  onOpenInvoice, 
  onSendWhatsApp,
  onOpenInspection,
  onUpdateWashDetails,
  onArchiveWash,
  onClearAllDelivered,
  dealer 
}) {
  const [filterQuery, setFilterQuery] = useState('');
  const [editingWash, setEditingWash] = useState(null);
  const [newBay, setNewBay] = useState(1);
  const [newStaff, setNewStaff] = useState('');
  
  // Mobile Stage Filter (Crucial for mobile phones / tablets)
  const [mobileStageFilter, setMobileStageFilter] = useState('ALL');

  const openEditModal = (wash) => {
    setEditingWash(wash);
    setNewBay(wash.bay_number || 1);
    setNewStaff(wash.washer_staff || '');
  };

  const handleSaveDetails = async () => {
    if (!editingWash || !onUpdateWashDetails) return;
    await onUpdateWashDetails(editingWash.id, {
      bay_number: Number(newBay),
      washer_staff: newStaff
    });
    setEditingWash(null);
  };

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

  // Determine which columns to show (on mobile, respect the stage filter)
  const displayedColumns = COLUMNS.filter(col => {
    if (mobileStageFilter === 'ALL') return true;
    return col.id === mobileStageFilter;
  });

  return (
    <div className="space-y-4 sm:space-y-6">
      
      {/* Top Banner & Quick Stats */}
      <div className="bg-[#111827] border border-slate-800 p-4 sm:p-5 rounded-2xl shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">Live Wash Bays & Workflow</h1>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono">
              {filteredWashes.length} Active
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
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
          />
        </div>
      </div>

      {/* Mobile Stage Selector Tab Bar (Visible on phones & narrow screens) */}
      <div className="md:hidden flex items-center gap-1.5 overflow-x-auto pb-1 -mx-2 px-2 scrollbar-none text-xs">
        <button
          onClick={() => setMobileStageFilter('ALL')}
          className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition ${
            mobileStageFilter === 'ALL'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          All Bays ({filteredWashes.length})
        </button>
        {COLUMNS.map(col => {
          const count = filteredWashes.filter(w => w.status === col.id).length;
          const isSelected = mobileStageFilter === col.id;
          return (
            <button
              key={col.id}
              onClick={() => setMobileStageFilter(col.id)}
              className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <span>{col.shortTitle}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                isSelected ? 'bg-blue-800 text-white' : 'bg-slate-800 text-slate-400'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Kanban Board Columns Grid */}
      <div className={`grid gap-4 ${
        mobileStageFilter !== 'ALL' 
          ? 'grid-cols-1' 
          : 'grid-cols-1 md:grid-cols-3 lg:grid-cols-5'
      }`}>
        {displayedColumns.map(col => {
          const colWashes = filteredWashes.filter(w => w.status === col.id);
          const ColIcon = col.icon;

          return (
            <div 
              key={col.id} 
              className={`rounded-2xl border p-3.5 flex flex-col min-h-[450px] sm:min-h-[550px] transition bg-[#111827]/90 ${col.color}`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <ColIcon className="w-4 h-4 text-slate-400" />
                  <span className="font-semibold text-xs text-slate-200">{col.title}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {col.id === 'DELIVERED' && colWashes.length > 0 && onClearAllDelivered && (
                    <button
                      onClick={onClearAllDelivered}
                      className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 px-2 py-0.5 rounded-md flex items-center gap-1 font-semibold transition"
                      title="Clear all delivered and settled cars from bays"
                    >
                      Clear All
                    </button>
                  )}
                  <span className={`text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full ${col.badgeColor}`}>
                    {colWashes.length}
                  </span>
                </div>
              </div>

              {/* Cards Container */}
              <div className="space-y-3 flex-1 overflow-y-auto pr-0.5">
                {colWashes.length === 0 ? (
                  <div className="h-32 rounded-xl border border-dashed border-slate-800 flex flex-col items-center justify-center text-slate-500 text-xs">
                    No vehicles in this stage
                  </div>
                ) : (
                  colWashes.map(wash => {
                    const next = getNextStatus(wash.status);
                    const elapsed = getElapsedMinutes(wash.in_wash_time || wash.queue_time);
                    const isFree = Boolean(wash.is_free_wash);

                    return (
                      <div
                        key={wash.id}
                        className={`bg-slate-900 border rounded-xl p-3.5 shadow-sm transition-all duration-150 relative group ${
                          wash.status === 'IN_WASH' 
                            ? 'border-blue-500/50 ring-1 ring-blue-500/20' 
                            : 'border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        {/* Plate & Wash Code Header */}
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-1.5">
                            <span className="bg-[#0B0F19] text-amber-300 font-mono font-bold text-xs px-2.5 py-1 rounded-md border border-slate-800 shadow-inner flex items-center gap-1">
                              <CarFront className="w-3.5 h-3.5 text-amber-400" />
                              {wash.license_plate}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">
                              #{wash.wash_code}
                            </span>
                          </div>

                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700/60">
                            Bay {wash.bay_number}
                          </span>
                        </div>

                        {/* Vehicle & Customer Info */}
                        <div className="mb-2">
                          <div className="text-xs font-semibold text-slate-100">
                            {wash.vehicle_make} {wash.vehicle_model}
                          </div>
                          <div className="text-[11px] text-slate-400 flex items-center justify-between mt-0.5">
                            <span>{wash.customer_name}</span>
                            <span className="font-mono text-[10px]">{wash.customer_phone}</span>
                          </div>
                        </div>

                        {/* Service & Addons */}
                        <div className="bg-[#0B0F19] rounded-lg p-2 mb-2 border border-slate-800 text-[11px]">
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

                        {/* 4th Wash Free Badge */}
                        {isFree && (
                          <div className="mb-2.5 p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-300 flex items-center gap-1.5">
                            <Flame className="w-4 h-4 text-amber-400 shrink-0" />
                            <div>
                              <span className="font-bold">4th Wash 100% FREE</span>
                              <div className="text-[10px] text-amber-400/80">
                                Loyalty Multi-Vehicle Perk Active
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Timer / Staff Reassignment */}
                        <div className="flex items-center justify-between text-[10px] text-slate-400 mb-3 pt-1 border-t border-slate-800">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-blue-400" />
                            {elapsed ? `${elapsed} mins ago` : 'Just queued'}
                          </span>
                          <button
                            type="button"
                            onClick={() => openEditModal(wash)}
                            className="flex items-center gap-1 text-slate-300 hover:text-blue-400 transition"
                            title="Reassign Bay or Staff"
                          >
                            <span>Bay #{wash.bay_number}</span> • <span>{wash.washer_staff || 'Staff'}</span>
                            <Pencil className="w-2.5 h-2.5 text-slate-500" />
                          </button>
                        </div>

                        {/* Actions Toolbar */}
                        <div className="space-y-1.5">
                          {/* Next Transition Button */}
                          {next && (
                            <button
                              onClick={() => onStatusChange(wash.id, next)}
                              className={`w-full py-2 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition active:scale-[0.99] ${
                                next === 'COMPLETED'
                                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
                                  : next === 'IN_WASH'
                                  ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-sm'
                                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                              }`}
                            >
                              <span>Advance to {next.replace('_', ' ')}</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Clear from Bay if Delivered */}
                          {wash.status === 'DELIVERED' && onArchiveWash && (
                            <button
                              type="button"
                              onClick={() => onArchiveWash(wash.id)}
                              className="w-full py-2 px-2.5 rounded-lg text-xs font-semibold bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-300 border border-emerald-500/30 flex items-center justify-center gap-1.5 transition"
                            >
                              <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Clear from Active Bay (Done)</span>
                            </button>
                          )}

                          {/* Quick WhatsApp & Invoice Buttons */}
                          <div className="grid grid-cols-2 gap-1.5 pt-1">
                            <button
                              onClick={() => onSendWhatsApp(wash)}
                              className="py-1.5 px-2 rounded-lg bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-300 border border-emerald-500/30 text-[11px] font-medium flex items-center justify-center gap-1 transition"
                            >
                              <MessageSquare className="w-3 h-3 text-emerald-400" />
                              <span>WhatsApp</span>
                            </button>

                            <button
                              onClick={() => onOpenInvoice(wash.id)}
                              className="py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[11px] font-medium flex items-center justify-center gap-1 transition"
                            >
                              <Receipt className="w-3 h-3 text-slate-400" />
                              <span>Invoice</span>
                            </button>
                          </div>
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

      {/* Quick Edit Bay & Staff Modal */}
      {editingWash && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-slate-800 rounded-2xl w-full max-w-sm p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-white">Reassign Bay & Technician</h3>
                <p className="text-[11px] text-slate-400 font-mono">
                  {editingWash.license_plate} • Ticket #{editingWash.wash_code}
                </p>
              </div>
              <button 
                onClick={() => setEditingWash(null)} 
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Assigned Wash Bay</label>
                <select
                  value={newBay}
                  onChange={(e) => setNewBay(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="1">Bay #1 - Foam Cannon & High Pressure</option>
                  <option value="2">Bay #2 - Touchless Hydro Express</option>
                  <option value="3">Bay #3 - Ceramic & Detailing Bay</option>
                  <option value="4">Bay #4 - Interior Vacuum & Shampoo</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Technician / Washer Staff</label>
                <input
                  type="text"
                  value={newStaff}
                  onChange={(e) => setNewStaff(e.target.value)}
                  placeholder="e.g. Carlos R."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                />
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {['Carlos R.', 'Mike D.', 'Dave S.', 'Sam K.'].map((staff) => (
                    <button
                      key={staff}
                      type="button"
                      onClick={() => setNewStaff(staff)}
                      className="text-[10px] px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition"
                    >
                      {staff}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditingWash(null)}
                className="px-3.5 py-1.5 rounded-xl text-xs text-slate-400 hover:text-white transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveDetails}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-sm transition active:scale-95"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
