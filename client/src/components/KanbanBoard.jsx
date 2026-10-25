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
  Plus,
  Check,
  DollarSign
} from 'lucide-react';
import { detectCurrency } from '../utils/currency';

const COLUMNS = [
  { id: 'QUEUED', title: '1. Queued & Intake', shortTitle: 'Queued', color: 'border-slate-200 bg-slate-100/70', icon: Clock, badgeColor: 'bg-amber-100 text-amber-800 border border-amber-300' },
  { id: 'IN_WASH', title: '2. In Wash Bay', shortTitle: 'In Bay', color: 'border-slate-200 bg-slate-100/70', icon: Droplets, badgeColor: 'bg-blue-100 text-blue-800 border border-blue-300' },
  { id: 'QUALITY_CHECK', title: '3. Detail & QC', shortTitle: 'Detail / QC', color: 'border-slate-200 bg-slate-100/70', icon: Sparkles, badgeColor: 'bg-purple-100 text-purple-800 border border-purple-300' },
  { id: 'COMPLETED', title: '4. Ready for Pickup', shortTitle: 'Ready', color: 'border-slate-200 bg-slate-100/70', icon: CheckCircle, badgeColor: 'bg-emerald-100 text-emerald-800 border border-emerald-300' },
  { id: 'DELIVERED', title: '5. Delivered & Settled', shortTitle: 'Delivered', color: 'border-slate-200 bg-slate-100/70', icon: CheckCheck, badgeColor: 'bg-slate-200 text-slate-800 border border-slate-300' },
];

export default function KanbanBoard({ 
  washes = [], 
  services = [],
  onStatusChange, 
  onOpenInvoice, 
  onSendWhatsApp, 
  onOpenInspection,
  onUpdateWashDetails,
  onArchiveWash,
  onClearAllDelivered,
  dealer = { currency: '$' }
}) {
  const [filterQuery, setFilterQuery] = useState('');
  const [mobileStageFilter, setMobileStageFilter] = useState('ALL');

  // Edit Wash & Services Modal State
  const [editingWash, setEditingWash] = useState(null);
  const [newBay, setNewBay] = useState(1);
  const [newStaff, setNewStaff] = useState('');
  const [newServiceId, setNewServiceId] = useState('');
  const [newAddons, setNewAddons] = useState([]);
  const [newNotes, setNewNotes] = useState('');

  // Packages and Add-ons from services list
  const availablePackages = services.filter(s => s.category === 'Package' || !s.category);
  const availableAddons = services.filter(s => s.category === 'Addon');

  // Dynamic Bays & Staff (USER REQUEST #1)
  const availableBays = dealer?.bays && dealer.bays.length > 0 
    ? dealer.bays 
    : [
        "Bay #1 - Foam Cannon & High Pressure",
        "Bay #2 - Touchless Hydro Express",
        "Bay #3 - Ceramic & Detailing Bay",
        "Bay #4 - Interior Vacuum & Shampoo"
      ];

  const availableTechnicians = dealer?.technicians && dealer.technicians.length > 0
    ? dealer.technicians
    : ["Carlos R.", "David K.", "Alex P.", "Elena V."];

  // Dynamic International Currency Detection (USER REQUEST #2)
  const editCurrency = detectCurrency(editingWash?.customer_phone, dealer?.currency || '$');

  const openEditModal = (wash) => {
    setEditingWash(wash);
    setNewBay(wash.bay_number || 1);
    setNewStaff(wash.washer_staff || '');
    setNewServiceId(wash.service_id || '');
    setNewAddons(wash.addons || []);
    setNewNotes(wash.notes || '');
  };

  const handleToggleAddon = (addon) => {
    const exists = newAddons.some(a => a.id === addon.id || a.name === addon.name);
    if (exists) {
      setNewAddons(newAddons.filter(a => a.id !== addon.id && a.name !== addon.name));
    } else {
      setNewAddons([...newAddons, { id: addon.id, name: addon.name, price: Number(addon.base_price || addon.price || 0) }]);
    }
  };

  // Live Recalculation for Modal Preview
  const selectedServiceObj = availablePackages.find(p => p.id === newServiceId) || 
    { name: editingWash?.service_name || 'Wash Service', base_price: editingWash?.service_price || 25 };
  
  const currentBasePrice = Number(selectedServiceObj.base_price || selectedServiceObj.price || 25);
  const currentAddonsTotal = newAddons.reduce((sum, a) => sum + (Number(a.price) || 0), 0);
  const currentSubtotal = currentBasePrice + currentAddonsTotal;
  const isFreeWash = Boolean(editingWash?.is_free_wash);
  const currentDiscount = isFreeWash ? currentBasePrice : 0;
  const currentTaxable = Math.max(0, currentSubtotal - currentDiscount);
  const currentTax = Number((currentTaxable * 0.08).toFixed(2));
  const currentTotal = Number((currentTaxable + currentTax).toFixed(2));

  const handleSaveDetails = async () => {
    if (!editingWash || !onUpdateWashDetails) return;
    await onUpdateWashDetails(editingWash.id, {
      bay_number: Number(newBay),
      washer_staff: newStaff,
      service_id: newServiceId || undefined,
      addons: newAddons,
      notes: newNotes
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

  const displayedColumns = COLUMNS.filter(col => {
    if (mobileStageFilter === 'ALL') return true;
    return col.id === mobileStageFilter;
  });

  return (
    <div className="space-y-4 sm:space-y-5">
      
      {/* Top Banner & Quick Stats */}
      <div className="bg-white border border-slate-200 p-4 sm:p-5 rounded-2xl shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">Live Wash Bay Operations</h1>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 font-mono">
              {filteredWashes.length} Active Vehicles
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time bay workflow with automatic WhatsApp notifications and instant add-on treatment updates.
          </p>
        </div>

        {/* Search / Filter */}
        <div className="w-full md:w-72">
          <input
            type="text"
            placeholder="Search license plate, customer, ticket..."
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
          />
        </div>
      </div>

      {/* Mobile Stage Selector Tab Bar */}
      <div className="md:hidden flex items-center gap-1.5 overflow-x-auto pb-1 -mx-2 px-2 scrollbar-none text-xs">
        <button
          onClick={() => setMobileStageFilter('ALL')}
          className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition ${
            mobileStageFilter === 'ALL'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900'
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
              className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>{col.shortTitle}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                isSelected ? 'bg-blue-800 text-white' : 'bg-slate-100 text-slate-600'
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
              className={`rounded-2xl border p-3.5 flex flex-col min-h-[450px] sm:min-h-[550px] transition ${col.color}`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <ColIcon className="w-4 h-4 text-slate-500" />
                  <span className="font-bold text-xs text-slate-800">{col.title}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {col.id === 'DELIVERED' && colWashes.length > 0 && onClearAllDelivered && (
                    <button
                      onClick={onClearAllDelivered}
                      className="text-[10px] bg-slate-200 hover:bg-slate-300 text-slate-700 px-2 py-0.5 rounded-md flex items-center gap-1 font-semibold transition"
                      title="Clear all delivered vehicles"
                    >
                      Clear All
                    </button>
                  )}
                  <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full ${col.badgeColor}`}>
                    {colWashes.length}
                  </span>
                </div>
              </div>

              {/* Cards Container */}
              <div className="space-y-3 flex-1 overflow-y-auto pr-0.5">
                {colWashes.length === 0 ? (
                  <div className="h-32 rounded-xl border border-dashed border-slate-300/80 flex flex-col items-center justify-center text-slate-400 text-xs">
                    No vehicles in this bay
                  </div>
                ) : (
                  colWashes.map(wash => {
                    const next = getNextStatus(wash.status);
                    const elapsed = getElapsedMinutes(wash.in_wash_time || wash.queue_time);
                    const isFree = Boolean(wash.is_free_wash);

                    return (
                      <div
                        key={wash.id}
                        className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all text-slate-900 relative"
                      >
                        {/* Plate & Wash Code Header */}
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-1.5">
                            <span className="bg-slate-900 text-amber-300 font-mono font-bold text-xs px-2.5 py-1 rounded-md shadow-xs flex items-center gap-1">
                              <CarFront className="w-3.5 h-3.5 text-amber-400" />
                              {wash.license_plate}
                            </span>
                            <span className="text-[10px] font-mono text-slate-500">
                              #{wash.wash_code}
                            </span>
                          </div>

                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                            Bay {wash.bay_number}
                          </span>
                        </div>

                        {/* Vehicle & Customer Info */}
                        <div className="mb-2">
                          <div className="text-xs font-bold text-slate-900">
                            {wash.vehicle_make} {wash.vehicle_model}
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center justify-between mt-0.5">
                            <span>{wash.customer_name}</span>
                            <span className="font-mono text-[10px]">{wash.customer_phone}</span>
                          </div>
                        </div>

                        {/* Service & Addons (Clickable to Edit/Upgrade!) */}
                        <div className="bg-slate-50 rounded-lg p-2.5 mb-2.5 border border-slate-200 text-[11px]">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-900 font-bold">{wash.service_name}</span>
                            <button
                              type="button"
                              onClick={() => openEditModal(wash)}
                              className="text-[10px] text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-0.5"
                              title="Add Extra Services or Upgrade Treatment"
                            >
                              <span>+ Add Extra</span>
                              <Pencil className="w-2.5 h-2.5" />
                            </button>
                          </div>
                          {wash.addons && wash.addons.length > 0 ? (
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {wash.addons.map((ad, idx) => (
                                <span key={idx} className="text-[9px] px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded font-medium border border-blue-200">
                                  +{ad.name}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <div className="text-[10px] text-slate-400 mt-0.5">Standard wash package</div>
                          )}
                        </div>

                        {/* 4th Wash Free Badge */}
                        {isFree && (
                          <div className="mb-2.5 p-2 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-900 flex items-center gap-1.5">
                            <Flame className="w-4 h-4 text-amber-500 shrink-0" />
                            <div>
                              <span className="font-bold">4th Wash 100% FREE!</span>
                              <div className="text-[10px] text-amber-700">
                                Multi-Vehicle Loyalty Rule Active
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Timer / Staff / Bay */}
                        <div className="flex items-center justify-between text-[10px] text-slate-500 mb-3 pt-1 border-t border-slate-100">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-blue-600" />
                            {elapsed ? `${elapsed} mins ago` : 'Just queued'}
                          </span>
                          <button
                            type="button"
                            onClick={() => openEditModal(wash)}
                            className="flex items-center gap-1 text-slate-700 hover:text-blue-600 font-medium transition"
                            title="Edit Bay, Staff, or Services"
                          >
                            <span>Bay #{wash.bay_number}</span> • <span>{wash.washer_staff || 'Staff'}</span>
                            <Pencil className="w-2.5 h-2.5 text-slate-400" />
                          </button>
                        </div>

                        {/* Actions Toolbar */}
                        <div className="space-y-1.5">
                          {/* Next Transition Button */}
                          {next && (
                            <button
                              onClick={() => onStatusChange(wash.id, next)}
                              className={`w-full py-2 px-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-[0.99] shadow-xs ${
                                next === 'COMPLETED'
                                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                  : next === 'IN_WASH'
                                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                  : 'bg-slate-800 hover:bg-slate-900 text-white'
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
                              className="w-full py-1.5 px-2.5 rounded-lg text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center justify-center gap-1.5 transition"
                            >
                              <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Clear from Active Bay (Done)</span>
                            </button>
                          )}

                          {/* Quick WhatsApp & Invoice Buttons */}
                          <div className="grid grid-cols-2 gap-1.5 pt-1">
                            <button
                              onClick={() => onSendWhatsApp(wash)}
                              className="py-1.5 px-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-[11px] font-semibold flex items-center justify-center gap-1 transition"
                            >
                              <MessageSquare className="w-3 h-3 text-emerald-600" />
                              <span>WhatsApp</span>
                            </button>

                            <button
                              onClick={() => onOpenInvoice(wash.id)}
                              className="py-1.5 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-[11px] font-semibold flex items-center justify-center gap-1 transition"
                            >
                              <Receipt className="w-3 h-3 text-slate-600" />
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

      {/* COMPREHENSIVE EDIT SERVICES & TREATMENTS MODAL */}
      {editingWash && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-5 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto text-slate-900">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="text-base font-bold text-slate-900">Modify Services, Add-ons & Bay</h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  {editingWash.license_plate} ({editingWash.vehicle_make} {editingWash.vehicle_model}) • Ticket #{editingWash.wash_code}
                </p>
              </div>
              <button 
                onClick={() => setEditingWash(null)} 
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* SECTION 1: Base Package Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                1. Base Wash Package
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {availablePackages.map((pkg) => {
                  const isSelected = newServiceId === pkg.id || (!newServiceId && editingWash.service_name === pkg.name);
                  return (
                    <button
                      key={pkg.id}
                      type="button"
                      onClick={() => setNewServiceId(pkg.id)}
                      className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/70 ring-1 ring-blue-600'
                          : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-xs text-slate-900">{pkg.name}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">{pkg.description}</div>
                      </div>
                      <div className="font-mono font-bold text-xs text-blue-700 mt-2">
                        {dealer.currency}{Number(pkg.base_price).toFixed(2)}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* SECTION 2: Extra Treatments & Add-ons (The Core User Request!) */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                  2. Extra Services & Add-on Treatments
                </label>
                <span className="text-[11px] text-slate-500">
                  {newAddons.length} selected
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Toggle any additional services requested by the customer. Invoice total will recalculate automatically.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {availableAddons.map((addon) => {
                  const isChecked = newAddons.some(a => a.id === addon.id || a.name === addon.name);
                  return (
                    <button
                      key={addon.id}
                      type="button"
                      onClick={() => handleToggleAddon(addon)}
                      className={`p-2.5 rounded-xl border text-left transition flex items-center justify-between ${
                        isChecked
                          ? 'border-blue-600 bg-blue-50/80 text-blue-900'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded flex items-center justify-center border ${
                          isChecked ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 bg-white'
                        }`}>
                          {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <div>
                          <div className="font-semibold text-xs">{addon.name}</div>
                          <div className="text-[10px] text-slate-500">{addon.description}</div>
                        </div>
                      </div>
                      <span className="font-mono font-bold text-xs text-blue-700 ml-2">
                        +{editCurrency}{Number(addon.base_price).toFixed(2)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* SECTION 3: Live Updated Total Calculation Banner */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-slate-600">
                <span>Base Package ({selectedServiceObj.name}):</span>
                <span className="font-mono font-semibold">{editCurrency}{currentBasePrice.toFixed(2)}</span>
              </div>
              {currentAddonsTotal > 0 && (
                <div className="flex items-center justify-between text-slate-600">
                  <span>Extra Add-ons ({newAddons.length}):</span>
                  <span className="font-mono font-semibold text-blue-600">+{editCurrency}{currentAddonsTotal.toFixed(2)}</span>
                </div>
              )}
              {isFreeWash && (
                <div className="flex items-center justify-between text-amber-700 font-semibold">
                  <span>Loyalty 4th Wash Free Discount:</span>
                  <span className="font-mono">-{editCurrency}{currentDiscount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-slate-500 text-[11px]">
                <span>Estimated Tax (8%):</span>
                <span className="font-mono">{editCurrency}{currentTax.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-slate-900 font-bold text-sm pt-2 border-t border-slate-200">
                <span>Recalculated Total:</span>
                <span className="font-mono text-base text-blue-600 font-extrabold">{editCurrency}{currentTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* SECTION 4: Bay & Staff Assignment */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-100 text-xs">
              <div>
                <label className="text-xs font-semibold text-slate-800 block mb-1">Assigned Wash Bay</label>
                <select
                  value={newBay}
                  onChange={(e) => setNewBay(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500 font-medium"
                >
                  {availableBays.map((bName, idx) => (
                    <option key={idx} value={idx + 1}>{bName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-800 block mb-1">Technician / Staff Member</label>
                <div className="relative">
                  <input
                    type="text"
                    list="kanban-technicians-list"
                    value={newStaff}
                    onChange={(e) => setNewStaff(e.target.value)}
                    placeholder="e.g. Carlos R."
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500 font-medium"
                  />
                  <datalist id="kanban-technicians-list">
                    {availableTechnicians.map((t, idx) => (
                      <option key={idx} value={t} />
                    ))}
                  </datalist>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setEditingWash(null)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveDetails}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition active:scale-95 flex items-center gap-1.5"
              >
                <span>Save Changes & Recalculate Total</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
