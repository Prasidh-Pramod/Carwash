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
import { detectCurrency } from '../utils/currency';

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
    <div className="space-y-5 text-slate-900">
      
      {/* Top Banner & Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500">Total Settled Revenue</div>
            <div className="text-2xl font-bold text-slate-900 font-mono mt-1">
              {dealer.currency}{totalSettledRevenue.toFixed(2)}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500">Invoices Pending Settlement</div>
            <div className="text-2xl font-bold text-amber-700 font-mono mt-1">
              {pendingCount}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500">WhatsApp Delivery Status</div>
            <div className="text-2xl font-bold text-emerald-600 font-mono mt-1">
              {invoices.filter(i => i.whatsapp_sent).length} / {invoices.length}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <MessageSquare className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Advanced Filter Toolbar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
        
        {/* Controls Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
          
          {/* 1. Global Search */}
          <div className="lg:col-span-3 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search invoice, customer, plate..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* 2. Customer Filter Dropdown */}
          <div className="lg:col-span-2 relative">
            <div className="relative flex items-center">
              <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
              <select
                value={customerFilter}
                onChange={(e) => setCustomerFilter(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-8 pr-7 py-2 text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500 appearance-none transition cursor-pointer"
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

          {/* 3. Vehicle Filter Dropdown */}
          <div className="lg:col-span-2 relative">
            <div className="relative flex items-center">
              <Car className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
              <select
                value={vehicleFilter}
                onChange={(e) => setVehicleFilter(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-8 pr-7 py-2 text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500 appearance-none transition cursor-pointer"
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

          {/* 4. Date Picker & Scope */}
          <div className="lg:col-span-3 flex items-center gap-1.5">
            <div className="relative flex-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                title="Filter by Date"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-8 pr-2 py-1.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500 transition cursor-pointer"
              />
            </div>

            <select
              value={dateType}
              onChange={(e) => setDateType(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-xl px-2 py-1.5 text-[11px] text-slate-700 focus:bg-white focus:outline-none focus:border-blue-500 transition cursor-pointer"
              title="Date filter mode"
            >
              <option value="ANY">Any Date</option>
              <option value="CHECKIN">Check-In</option>
              <option value="BILLED">Billed</option>
            </select>

            <button
              onClick={handleSetToday}
              className={`px-2.5 py-1.5 rounded-xl text-[11px] font-semibold border transition ${
                dateFilter === getLocalDateString(new Date())
                  ? 'bg-blue-50 text-blue-700 border-blue-300'
                  : 'bg-slate-50 text-slate-600 hover:text-slate-900 border-slate-300'
              }`}
              title="Filter by Today's date"
            >
              Today
            </button>
          </div>

          {/* 5. Status Pills & Reset */}
          <div className="lg:col-span-2 flex items-center justify-end gap-1.5">
            <div className="inline-flex rounded-xl bg-slate-100 p-0.5 border border-slate-200">
              {['ALL', 'PAID', 'PENDING'].map(st => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                    statusFilter === st
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-amber-600 border border-slate-300 transition"
                title="Reset all filters"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

        </div>

        {/* Active Filter Chips & Summary Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-2 text-slate-600 flex-wrap">
            <span className="font-medium">
              Showing <strong className="text-slate-900 font-mono">{filtered.length}</strong> of {invoices.length} invoices
            </span>
            <span className="text-slate-300">•</span>
            <span>
              Filtered Value: <strong className="text-emerald-700 font-mono">{dealer.currency}{filteredTotal.toFixed(2)}</strong>
            </span>

            {/* Active filter badges */}
            {customerFilter !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[11px] border border-blue-200">
                <User className="w-3 h-3" />
                <span>{customerFilter}</span>
                <button onClick={() => setCustomerFilter('ALL')} className="hover:text-blue-900 ml-0.5">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {vehicleFilter !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[11px] border border-amber-200">
                <Car className="w-3 h-3" />
                <span>{vehicleFilter}</span>
                <button onClick={() => setVehicleFilter('ALL')} className="hover:text-amber-900 ml-0.5">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {dateFilter && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-800 text-[11px] border border-cyan-200">
                <Calendar className="w-3 h-3" />
                <span>{dateFilter} ({dateType})</span>
                <button onClick={() => setDateFilter('')} className="hover:text-cyan-900 ml-0.5">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {statusFilter !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] border border-slate-300">
                <span>Status: {statusFilter}</span>
                <button onClick={() => setStatusFilter('ALL')} className="hover:text-slate-900 ml-0.5">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>

          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="text-[11px] text-amber-600 hover:text-amber-700 font-semibold flex items-center gap-1 underline underline-offset-2"
            >
              Clear all filters
            </button>
          )}
        </div>

      </div>

      {/* Invoice Table or Empty State */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        {filtered.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto border border-slate-200">
              <Filter className="w-6 h-6" />
            </div>
            <div className="text-slate-900 font-bold text-sm">No Invoices Match Your Criteria</div>
            <p className="text-slate-500 text-xs max-w-sm mx-auto">
              No billing records found matching the active customer, vehicle, date, or status filters.
            </p>
            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="mt-2 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs"
              >
                Reset All Filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
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
              <tbody className="divide-y divide-slate-100">
                {filtered.map(inv => {
                  const isPaid = inv.status === 'PAID';
                  const isFree = Boolean(inv.is_free_wash);
                  const hasWaSent = Boolean(inv.whatsapp_sent);
                  const checkInTime = inv.check_in_time || inv.queue_time;
                  const rowCurrency = detectCurrency(inv.customer_phone, inv.dealer_currency || dealer.currency);

                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/80 transition">
                      
                      {/* 1. Invoice & Ticket ID */}
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-bold text-slate-900">{inv.invoice_number}</div>
                        <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Receipt className="w-3 h-3 text-blue-600" />
                          <span>Ticket: {inv.wash_code}</span>
                        </div>
                      </td>

                      {/* 2. Customer & Vehicle */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{inv.customer_name}</div>
                        <div className="text-[11px] text-slate-700 font-mono font-bold mt-0.5">
                          <span className="bg-slate-900 text-amber-300 px-1.5 py-0.2 rounded text-[10px]">{inv.license_plate}</span>{' '}
                          <span className="font-sans text-slate-500 font-normal">
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
                        <div className="flex items-center gap-1.5 text-slate-700">
                          <Clock className="w-3 h-3 text-blue-600 shrink-0" />
                          <span className="text-[11px]">
                            <strong className="text-slate-400 font-normal">In: </strong>
                            {checkInTime ? formatDateTime(checkInTime) : '—'}
                          </span>
                        </div>

                        {/* Billed Date */}
                        <div className="flex items-center gap-1.5 text-slate-500 text-[10px] mt-1">
                          <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>
                            <strong className="text-slate-400 font-normal">Billed: </strong>
                            {formatDateTime(inv.issued_at)}
                          </span>
                        </div>
                      </td>

                      {/* 4. Service & Treatment */}
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-900">{inv.service_name}</div>
                        {isFree ? (
                          <div className="inline-flex items-center gap-1 text-[10px] text-amber-800 font-bold bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded mt-0.5">
                            <Flame className="w-3 h-3 text-amber-600" />
                            4th Wash Free Loyalty!
                          </div>
                        ) : (
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            {inv.addons && inv.addons.length > 0 ? (
                              <span className="text-blue-700 font-medium">+{inv.addons.length} Add-on(s)</span>
                            ) : (
                              'Standard Service'
                            )}
                          </div>
                        )}
                      </td>

                      {/* 5. Total */}
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-extrabold text-sm text-slate-900">
                          {rowCurrency}{Number(inv.total || 0).toFixed(2)}
                        </div>
                        {Number(inv.discount) > 0 && (
                          <div className="text-[10px] text-amber-700 font-semibold">
                            Saved: {rowCurrency}{Number(inv.discount).toFixed(2)}
                          </div>
                        )}
                      </td>

                      {/* 6. Status */}
                      <td className="py-3.5 px-4">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          isPaid 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}>
                          {inv.status}
                        </span>
                      </td>

                      {/* 7. WhatsApp Delivery */}
                      <td className="py-3.5 px-4">
                        {hasWaSent ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Delivered</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Not Sent Yet</span>
                        )}
                      </td>

                      {/* 8. Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onSelectInvoice(inv)}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 transition"
                          >
                            View Receipt
                          </button>
                          <button
                            onClick={() => onSendWhatsAppInvoice(inv.id)}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition flex items-center gap-1"
                            title="Send to WhatsApp"
                          >
                            <Share2 className="w-3 h-3 text-emerald-600" />
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
