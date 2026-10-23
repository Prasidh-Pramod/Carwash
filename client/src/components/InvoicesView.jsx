import React, { useState, useMemo } from 'react';
import { 
  Receipt, 
  Search, 
  Share2, 
  CheckCircle2, 
  Clock, 
  CreditCard, 
  DollarSign, 
  Flame,
  MessageSquare,
  ExternalLink,
  Calendar,
  User,
  Car,
  Filter,
  RotateCcw,
  X,
  ChevronDown
} from 'lucide-react';

function getLocalDateString(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDateTime(dateStr) {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (e) {
    return dateStr;
  }
}

export default function InvoicesView({ 
  invoices = [], 
  dealer = { currency: '$' }, 
  onSelectInvoice,
  onSendWhatsAppInvoice
}) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [customerFilter, setCustomerFilter] = useState('ALL');
  const [vehicleFilter, setVehicleFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('');
  const [dateType, setDateType] = useState('ANY'); // 'ANY' | 'CHECKIN' | 'BILLED'

  // Extract unique customer list from invoices
  const customerOptions = useMemo(() => {
    const map = new Map();
    invoices.forEach(inv => {
      const name = inv.customer_name?.trim();
      if (name && !map.has(name)) {
        map.set(name, {
          name,
          phone: inv.customer_phone || ''
        });
      }
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [invoices]);

  // Extract unique vehicle list from invoices
  const vehicleOptions = useMemo(() => {
    const map = new Map();
    invoices.forEach(inv => {
      const plate = inv.license_plate?.trim();
      if (plate && !map.has(plate)) {
        map.set(plate, {
          plate,
          makeModel: `${inv.vehicle_make || ''} ${inv.vehicle_model || ''}`.trim()
        });
      }
    });
    return Array.from(map.values()).sort((a, b) => a.plate.localeCompare(b.plate));
  }, [invoices]);

  // Comprehensive multi-criteria filtering
  const filtered = useMemo(() => {
    return invoices.filter(inv => {
      // 1. Status Filter
      if (statusFilter !== 'ALL' && inv.status !== statusFilter) return false;

      // 2. Customer Filter
      if (customerFilter !== 'ALL' && inv.customer_name !== customerFilter) {
        return false;
      }

      // 3. Vehicle Filter
      if (vehicleFilter !== 'ALL' && inv.license_plate !== vehicleFilter) {
        return false;
      }

      // 4. Date Filter
      if (dateFilter) {
        const checkinLocal = getLocalDateString(inv.check_in_time || inv.queue_time);
        const billedLocal = getLocalDateString(inv.issued_at);

        if (dateType === 'CHECKIN') {
          if (checkinLocal !== dateFilter) return false;
        } else if (dateType === 'BILLED') {
          if (billedLocal !== dateFilter) return false;
        } else {
          // ANY: matches if either check-in date or billed date matches
          if (checkinLocal !== dateFilter && billedLocal !== dateFilter) return false;
        }
      }

      // 5. Search Text Filter
      if (search) {
        const q = search.toLowerCase().trim();
        const matches = (
          inv.invoice_number?.toLowerCase().includes(q) ||
          inv.wash_code?.toLowerCase().includes(q) ||
          inv.customer_name?.toLowerCase().includes(q) ||
          inv.customer_phone?.toLowerCase().includes(q) ||
          inv.license_plate?.toLowerCase().includes(q) ||
          inv.vehicle_make?.toLowerCase().includes(q) ||
          inv.vehicle_model?.toLowerCase().includes(q) ||
          inv.service_name?.toLowerCase().includes(q)
        );
        if (!matches) return false;
      }

      return true;
    });
  }, [invoices, statusFilter, customerFilter, vehicleFilter, dateFilter, dateType, search]);

  // Metrics
  const totalSettledRevenue = useMemo(() => {
    return invoices
      .filter(i => i.status === 'PAID')
      .reduce((sum, i) => sum + Number(i.total || 0), 0);
  }, [invoices]);

  const pendingCount = useMemo(() => {
    return invoices.filter(i => i.status === 'PENDING').length;
  }, [invoices]);

  const filteredTotal = useMemo(() => {
    return filtered.reduce((sum, i) => sum + Number(i.total || 0), 0);
  }, [filtered]);

  const hasActiveFilters = 
    statusFilter !== 'ALL' || 
    customerFilter !== 'ALL' || 
    vehicleFilter !== 'ALL' || 
    dateFilter !== '' || 
    search !== '';

  const handleResetFilters = () => {
    setStatusFilter('ALL');
    setCustomerFilter('ALL');
    setVehicleFilter('ALL');
    setDateFilter('');
    setDateType('ANY');
    setSearch('');
  };

  const handleSetToday = () => {
    setDateFilter(getLocalDateString(new Date()));
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-400">Total Settled Revenue</div>
            <div className="text-2xl font-extrabold text-white font-mono mt-1">
              {dealer.currency}{totalSettledRevenue.toFixed(2)}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-400">Invoices Pending Settlement</div>
            <div className="text-2xl font-extrabold text-amber-300 font-mono mt-1">
              {pendingCount}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-400">WhatsApp Delivery Status</div>
            <div className="text-2xl font-extrabold text-emerald-400 font-mono mt-1">
              {invoices.filter(i => i.whatsapp_sent).length} / {invoices.length}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <MessageSquare className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Advanced Filter Toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
        
        {/* Controls Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
          
          {/* 1. Global Search (cols 1-3) */}
          <div className="lg:col-span-3 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search invoice, customer, plate..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-brand-500 transition"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* 2. Customer Filter Dropdown (cols 4-5) */}
          <div className="lg:col-span-2 relative">
            <div className="relative flex items-center">
              <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
              <select
                value={customerFilter}
                onChange={(e) => setCustomerFilter(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-8 pr-7 py-2 text-xs text-white focus:outline-none focus:border-brand-500 appearance-none transition cursor-pointer"
              >
                <option value="ALL">All Customers ({customerOptions.length})</option>
                {customerOptions.map(c => (
                  <option key={c.name} value={c.name}>
                    {c.name} {c.phone ? `(${c.phone})` : ''}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 pointer-events-none" />
            </div>
          </div>

          {/* 3. Vehicle Filter Dropdown (cols 6-7) */}
          <div className="lg:col-span-2 relative">
            <div className="relative flex items-center">
              <Car className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
              <select
                value={vehicleFilter}
                onChange={(e) => setVehicleFilter(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-8 pr-7 py-2 text-xs text-white focus:outline-none focus:border-brand-500 appearance-none transition cursor-pointer"
              >
                <option value="ALL">All Vehicles ({vehicleOptions.length})</option>
                {vehicleOptions.map(v => (
                  <option key={v.plate} value={v.plate}>
                    {v.plate} {v.makeModel ? `• ${v.makeModel}` : ''}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 pointer-events-none" />
            </div>
          </div>

          {/* 4. Date Picker & Scope (cols 8-10) */}
          <div className="lg:col-span-3 flex items-center gap-1.5">
            <div className="relative flex-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                title="Filter by Date"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-8 pr-2 py-1.5 text-xs text-white focus:outline-none focus:border-brand-500 transition cursor-pointer"
              />
            </div>

            {/* Date Type Selector (Check-In vs Billed vs Any) */}
            <select
              value={dateType}
              onChange={(e) => setDateType(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-xl px-2 py-1.5 text-[11px] text-slate-300 focus:outline-none focus:border-brand-500 transition cursor-pointer"
              title="Date filter mode"
            >
              <option value="ANY">Any Date</option>
              <option value="CHECKIN">Check-In</option>
              <option value="BILLED">Billed</option>
            </select>

            <button
              onClick={handleSetToday}
              className={`px-2 py-1.5 rounded-xl text-[11px] font-semibold border transition ${
                dateFilter === getLocalDateString(new Date())
                  ? 'bg-brand-500/20 text-brand-300 border-brand-500/40'
                  : 'bg-slate-800 text-slate-400 hover:text-white border-slate-700'
              }`}
              title="Filter by Today's date"
            >
              Today
            </button>
          </div>

          {/* 5. Status Pills & Reset (cols 11-12) */}
          <div className="lg:col-span-2 flex items-center justify-end gap-1.5">
            <div className="inline-flex rounded-xl bg-slate-800/80 p-0.5 border border-slate-700">
              {['ALL', 'PAID', 'PENDING'].map(st => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                    statusFilter === st
                      ? 'bg-brand-500 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 transition"
                title="Reset all filters"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

        </div>

        {/* Active Filter Chips & Summary Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/60 text-xs">
          <div className="flex items-center gap-2 text-slate-400 flex-wrap">
            <span className="font-medium text-slate-300">
              Showing <strong className="text-white font-mono">{filtered.length}</strong> of {invoices.length} invoices
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-300">
              Filtered Value: <strong className="text-emerald-400 font-mono">{dealer.currency}{filteredTotal.toFixed(2)}</strong>
            </span>

            {/* Active filter badges */}
            {customerFilter !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-300 text-[11px] border border-brand-500/30">
                <User className="w-3 h-3" />
                <span>{customerFilter}</span>
                <button onClick={() => setCustomerFilter('ALL')} className="hover:text-white ml-0.5">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {vehicleFilter !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[11px] border border-amber-500/30">
                <Car className="w-3 h-3" />
                <span>{vehicleFilter}</span>
                <button onClick={() => setVehicleFilter('ALL')} className="hover:text-white ml-0.5">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {dateFilter && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[11px] border border-cyan-500/30">
                <Calendar className="w-3 h-3" />
                <span>{dateFilter} ({dateType})</span>
                <button onClick={() => setDateFilter('')} className="hover:text-white ml-0.5">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {statusFilter !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[11px] border border-slate-700">
                <span>Status: {statusFilter}</span>
                <button onClick={() => setStatusFilter('ALL')} className="hover:text-white ml-0.5">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>

          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 underline underline-offset-2"
            >
              Clear all filters
            </button>
          )}
        </div>

      </div>

      {/* Invoice Table or Empty State */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {filtered.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 text-slate-400 flex items-center justify-center mx-auto">
              <Filter className="w-6 h-6" />
            </div>
            <div className="text-white font-bold text-sm">No Invoices Match Your Criteria</div>
            <p className="text-slate-400 text-xs max-w-sm mx-auto">
              No billing records found matching the active customer, vehicle, date, or status filters.
            </p>
            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="mt-2 px-3.5 py-1.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold transition shadow-lg shadow-brand-500/20"
              >
                Reset All Filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/60 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4">Invoice & Ticket</th>
                  <th className="py-3.5 px-4">Customer & Vehicle</th>
                  <th className="py-3.5 px-4">Intake & Billing Dates</th>
                  <th className="py-3.5 px-4">Service & Treatment</th>
                  <th className="py-3.5 px-4">Total</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">WhatsApp</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filtered.map(inv => {
                  const isPaid = inv.status === 'PAID';
                  const isFree = Boolean(inv.is_free_wash);
                  const hasWaSent = Boolean(inv.whatsapp_sent);
                  const checkInTime = inv.check_in_time || inv.queue_time;

                  return (
                    <tr key={inv.id} className="hover:bg-slate-800/40 transition">
                      
                      {/* 1. Invoice & Ticket ID */}
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-bold text-white">{inv.invoice_number}</div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Receipt className="w-3 h-3 text-brand-400" />
                          <span>Ticket: {inv.wash_code}</span>
                        </div>
                      </td>

                      {/* 2. Customer & Vehicle */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-200">{inv.customer_name}</div>
                        <div className="text-[11px] text-amber-300 font-mono font-bold mt-0.5">
                          {inv.license_plate}{' '}
                          <span className="font-sans text-slate-400 font-normal">
                            ({inv.vehicle_make} {inv.vehicle_model})
                          </span>
                        </div>
                        {inv.customer_phone && (
                          <div className="text-[10px] text-slate-500">{inv.customer_phone}</div>
                        )}
                      </td>

                      {/* 3. Intake Check-in Date & Billed Date */}
                      <td className="py-3.5 px-4">
                        {/* Check-In Date */}
                        <div className="flex items-center gap-1.5 text-slate-300">
                          <Clock className="w-3 h-3 text-cyan-400 shrink-0" />
                          <span className="text-[11px]">
                            <strong className="text-slate-400 font-normal">In: </strong>
                            {checkInTime ? formatDateTime(checkInTime) : '—'}
                          </span>
                        </div>

                        {/* Billed Date */}
                        <div className="flex items-center gap-1.5 text-slate-400 text-[10px] mt-1">
                          <Calendar className="w-3 h-3 text-slate-500 shrink-0" />
                          <span>
                            <strong className="text-slate-500 font-normal">Billed: </strong>
                            {formatDateTime(inv.issued_at)}
                          </span>
                        </div>
                      </td>

                      {/* 4. Service & Treatment */}
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-300">{inv.service_name}</div>
                        {isFree ? (
                          <div className="inline-flex items-center gap-1 text-[10px] text-amber-300 font-bold bg-amber-500/10 px-1.5 py-0.5 rounded mt-0.5">
                            <Flame className="w-3 h-3 text-amber-400" />
                            4th Wash Free Loyalty!
                          </div>
                        ) : (
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {inv.addons && inv.addons.length > 0 ? `+ ${inv.addons.length} Add-on(s)` : 'Standard Service'}
                          </div>
                        )}
                      </td>

                      {/* 5. Total */}
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-extrabold text-sm text-white">
                          {inv.dealer_currency || dealer.currency}{Number(inv.total || 0).toFixed(2)}
                        </div>
                        {Number(inv.discount) > 0 && (
                          <div className="text-[10px] text-amber-400">
                            Saved: {inv.dealer_currency || dealer.currency}{Number(inv.discount).toFixed(2)}
                          </div>
                        )}
                      </td>

                      {/* 6. Status */}
                      <td className="py-3.5 px-4">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          isPaid 
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}>
                          {inv.status}
                        </span>
                      </td>

                      {/* 7. WhatsApp Delivery */}
                      <td className="py-3.5 px-4">
                        {hasWaSent ? (
                          <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Delivered</span>
                          </span>
                        ) : (
                          <span className="text-slate-500 text-[11px]">Not Sent Yet</span>
                        )}
                      </td>

                      {/* 8. Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onSelectInvoice(inv)}
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
                          >
                            View Receipt
                          </button>
                          <button
                            onClick={() => onSendWhatsAppInvoice(inv.id)}
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/30 transition flex items-center gap-1"
                            title="Send to WhatsApp"
                          >
                            <Share2 className="w-3 h-3 text-emerald-400" />
                            <span>WhatsApp</span>
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
