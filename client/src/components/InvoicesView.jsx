import React, { useState } from 'react';
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
  ExternalLink
} from 'lucide-react';

export default function InvoicesView({ 
  invoices, 
  dealer, 
  onSelectInvoice,
  onSendWhatsAppInvoice
}) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const filtered = invoices.filter(inv => {
    const matchesStatus = statusFilter === 'ALL' || inv.status === statusFilter;
    if (!matchesStatus) return false;

    if (!search) return true;
    const q = search.toLowerCase();
    return (
      inv.invoice_number?.toLowerCase().includes(q) ||
      inv.customer_name?.toLowerCase().includes(q) ||
      inv.license_plate?.toLowerCase().includes(q) ||
      inv.service_name?.toLowerCase().includes(q)
    );
  });

  const totalRevenue = invoices
    .filter(i => i.status === 'PAID')
    .reduce((sum, i) => sum + Number(i.total), 0);

  const pendingCount = invoices.filter(i => i.status === 'PENDING').length;

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-400">Total Settled Revenue</div>
            <div className="text-2xl font-extrabold text-white font-mono mt-1">
              {dealer.currency}{totalRevenue.toFixed(2)}
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

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
        <div className="flex items-center gap-2">
          {['ALL', 'PENDING', 'PAID'].map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                statusFilter === st
                  ? 'bg-brand-500 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="w-full sm:w-72 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search invoice, customer, plate..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-brand-500"
          />
        </div>
      </div>

      {/* Invoice Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/60 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4">Invoice #</th>
                <th className="py-3.5 px-4">Customer & Vehicle</th>
                <th className="py-3.5 px-4">Service & Treatment</th>
                <th className="py-3.5 px-4">Total</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">WhatsApp Delivery</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filtered.map(inv => {
                const isPaid = inv.status === 'PAID';
                const isFree = Boolean(inv.is_free_wash);
                const hasWaSent = Boolean(inv.whatsapp_sent);

                return (
                  <tr key={inv.id} className="hover:bg-slate-800/40 transition">
                    
                    {/* Invoice ID */}
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-bold text-white">{inv.invoice_number}</div>
                      <div className="text-[10px] text-slate-400">Code: {inv.wash_code}</div>
                    </td>

                    {/* Customer & Plate */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-200">{inv.customer_name}</div>
                      <div className="text-[11px] text-amber-300 font-mono font-bold">
                        {inv.license_plate} <span className="font-sans text-slate-400 font-normal">({inv.vehicle_make} {inv.vehicle_model})</span>
                      </div>
                    </td>

                    {/* Service */}
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-300">{inv.service_name}</div>
                      {isFree ? (
                        <div className="inline-flex items-center gap-1 text-[10px] text-amber-300 font-bold bg-amber-500/10 px-1.5 py-0.5 rounded">
                          <Flame className="w-3 h-3 text-amber-400" />
                          4th Wash Free Applied!
                        </div>
                      ) : (
                        <div className="text-[10px] text-slate-400">
                          {inv.addons && inv.addons.length > 0 ? `+ ${inv.addons.length} Add-on(s)` : 'Standard Wash'}
                        </div>
                      )}
                    </td>

                    {/* Total */}
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-extrabold text-sm text-white">
                        {inv.dealer_currency}{Number(inv.total).toFixed(2)}
                      </div>
                      {Number(inv.discount) > 0 && (
                        <div className="text-[10px] text-amber-400">
                          Saved: {inv.dealer_currency}{Number(inv.discount).toFixed(2)}
                        </div>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        isPaid ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}>
                        {inv.status}
                      </span>
                    </td>

                    {/* WhatsApp Status */}
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

                    {/* Actions */}
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
      </div>

    </div>
  );
}
