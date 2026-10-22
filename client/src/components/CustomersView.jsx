import React, { useState } from 'react';
import { 
  Users, 
  Car, 
  CheckCircle2, 
  Flame, 
  Plus, 
  Search, 
  Crown, 
  Phone, 
  Mail, 
  Calendar, 
  AlertCircle 
} from 'lucide-react';

export default function CustomersView({ 
  customers, 
  dealer, 
  onOpenAddVehicle, 
  onToggleSubscription,
  onCheckInCustomer
}) {
  const [search, setSearch] = useState('');

  const filtered = customers.filter(c => {
    if (!search) return true;
    const q = search.toLowerCase();
    const hasPlate = c.vehicles?.some(v => v.license_plate.toLowerCase().includes(q));
    return c.name.toLowerCase().includes(q) || c.phone.includes(q) || hasPlate;
  });

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-white">Customer & Multi-Vehicle Hub</h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-brand-500/10 text-brand-400 border border-brand-500/30">
              {customers.length} Members
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Manage multi-vehicle profiles and track 4th wash free loyalty progression.
          </p>
        </div>

        {/* Search */}
        <div className="w-full md:w-80 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search name, phone, license plate..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-brand-500"
          />
        </div>
      </div>

      {/* Customer Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
        {filtered.map(cust => {
          const isSub = Boolean(cust.is_subscribed);
          const loyalty = cust.loyalty || {};
          const isEligible = Boolean(loyalty.eligible);
          const vehicleCount = cust.vehicles?.length || 0;
          const completedWashes = cust.total_washes || 0;

          return (
            <div 
              key={cust.id} 
              className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-lg flex flex-col justify-between transition hover:border-slate-600"
            >
              {/* Top Row: Info & Subscription Badge */}
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-white">{cust.name}</h3>
                      {isSub ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          <Crown className="w-3 h-3 text-amber-400" />
                          {cust.subscription_plan || 'Subscribed Member'}
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-700 text-slate-300">
                          Non-Subscribed
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-emerald-400" />
                        {cust.phone}
                      </span>
                      {cust.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3 text-slate-400" />
                          {cust.email}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => onCheckInCustomer(cust)}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-brand-500/20 hover:bg-brand-500 text-brand-300 hover:text-white border border-brand-500/40 transition"
                  >
                    + Check-In
                  </button>
                </div>

                {/* Loyalty Rules & Progress Card */}
                {dealer.has_fourth_wash_promo ? (
                  <div className={`p-3 rounded-xl border mb-4 text-xs transition ${
                    isEligible 
                      ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-amber-500/50 text-amber-200' 
                      : 'bg-slate-900/60 border-slate-700/60 text-slate-300'
                  }`}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5 font-bold">
                        <Flame className={`w-3.5 h-3.5 ${isEligible ? 'text-amber-400 animate-pulse' : 'text-slate-400'}`} />
                        <span>Loyalty Status: 4th Wash Free Perk</span>
                      </div>
                      <span className="font-mono text-[11px] text-slate-400">
                        {completedWashes} washes completed
                      </span>
                    </div>

                    <p className="text-[11px] leading-relaxed opacity-90">
                      {loyalty.reason}
                    </p>

                    {/* Progress indicators: 1) Subscribed? 2) >= 2 Vehicles? 3) Wash counter */}
                    <div className="grid grid-cols-3 gap-1.5 mt-2.5 pt-2 border-t border-slate-700/40 text-[10px]">
                      <div className={`px-2 py-1 rounded flex items-center gap-1 ${isSub ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'}`}>
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Subscribed</span>
                      </div>
                      <div className={`px-2 py-1 rounded flex items-center gap-1 ${vehicleCount >= 2 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'}`}>
                        <CheckCircle2 className="w-3 h-3" />
                        <span>2+ Cars ({vehicleCount}/2)</span>
                      </div>
                      <div className={`px-2 py-1 rounded flex items-center gap-1 ${loyalty.isFourthWashMultiple ? 'bg-amber-500/20 text-amber-300 font-bold' : 'bg-slate-800 text-slate-400'}`}>
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Next: Wash #{loyalty.nextWashNumber}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-2.5 rounded-xl bg-slate-900/40 border border-slate-800 mb-4 text-xs text-slate-400">
                    Standard Dealer Tier • {completedWashes} total washes
                  </div>
                )}

                {/* Vehicles List */}
                <div className="space-y-2 mb-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                      <Car className="w-3.5 h-3.5 text-brand-400" />
                      <span>Enrolled Vehicles ({vehicleCount})</span>
                    </span>
                    <button
                      onClick={() => onOpenAddVehicle(cust)}
                      className="text-[11px] text-brand-400 hover:text-brand-300 font-medium flex items-center gap-0.5"
                    >
                      <Plus className="w-3 h-3" /> Add Vehicle
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {cust.vehicles && cust.vehicles.length > 0 ? (
                      cust.vehicles.map(v => (
                        <div 
                          key={v.id} 
                          className="bg-slate-900/70 border border-slate-700/60 rounded-xl p-2.5 flex items-center justify-between"
                        >
                          <div>
                            <span className="bg-slate-950 text-amber-300 font-mono font-bold text-xs px-2 py-0.5 rounded border border-slate-700 inline-block mb-1">
                              {v.license_plate}
                            </span>
                            <div className="text-xs text-slate-200 font-medium">
                              {v.make} {v.model}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {v.color} • {v.vehicle_type}
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] text-slate-400 block">Washes</span>
                            <span className="text-xs font-mono font-bold text-brand-400">{v.wash_count || 0}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-2 py-3 text-center text-xs text-slate-500 border border-dashed border-slate-700 rounded-xl">
                        No vehicles added yet
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom Actions: Toggle Subscription */}
              <div className="pt-3 border-t border-slate-700/60 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  {isSub ? 'Subscription: Active' : 'Subscription: Inactive'}
                </span>
                <button
                  onClick={() => onToggleSubscription(cust.id, !isSub)}
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium transition ${
                    isSub
                      ? 'bg-slate-700/60 hover:bg-slate-700 text-slate-300'
                      : 'bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/40'
                  }`}
                >
                  {isSub ? 'Cancel Subscription' : '★ Upgrade to Subscribed Member'}
                </button>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
}
