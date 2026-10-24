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
      <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">Customer & Multi-Vehicle Hub</h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              {customers.length} Members
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
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
            className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white transition"
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
              className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between transition hover:border-slate-300 hover:shadow-sm"
            >
              {/* Top Row: Info & Subscription Badge */}
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-slate-900">{cust.name}</h3>
                      {isSub ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                          <Crown className="w-3 h-3 text-amber-600" />
                          {cust.subscription_plan || 'Subscribed Member'}
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                          Non-Subscribed
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-emerald-600" />
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
                    className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white border border-blue-200 transition"
                  >
                    + Check-In
                  </button>
                </div>

                {/* Loyalty Rules & Progress Card */}
                {dealer.has_fourth_wash_promo ? (
                  <div className={`p-3 rounded-xl border mb-4 text-xs transition ${
                    isEligible 
                      ? 'bg-amber-50/70 border-amber-200 text-amber-900' 
                      : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5 font-bold">
                        <Flame className={`w-3.5 h-3.5 ${isEligible ? 'text-amber-600 animate-pulse' : 'text-slate-400'}`} />
                        <span>Loyalty Status: 4th Wash Free Perk</span>
                      </div>
                      <span className="font-mono text-[11px] text-slate-500">
                        {completedWashes} washes completed
                      </span>
                    </div>

                    <p className="text-[11px] leading-relaxed text-slate-600">
                      {loyalty.reason}
                    </p>

                    {/* Progress indicators: 1) Subscribed? 2) >= 2 Vehicles? 3) Wash counter */}
                    <div className="grid grid-cols-3 gap-1.5 mt-2.5 pt-2 border-t border-slate-200/80 text-[10px]">
                      <div className={`px-2 py-1 rounded flex items-center gap-1 border ${isSub ? 'bg-emerald-50 text-emerald-800 border-emerald-200 font-medium' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Subscribed</span>
                      </div>
                      <div className={`px-2 py-1 rounded flex items-center gap-1 border ${vehicleCount >= 2 ? 'bg-emerald-50 text-emerald-800 border-emerald-200 font-medium' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                        <CheckCircle2 className="w-3 h-3" />
                        <span>2+ Cars ({vehicleCount}/2)</span>
                      </div>
                      <div className={`px-2 py-1 rounded flex items-center gap-1 border ${loyalty.isFourthWashMultiple ? 'bg-amber-100 text-amber-900 border-amber-300 font-bold' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Next: Wash #{loyalty.nextWashNumber}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 mb-4 text-xs text-slate-500">
                    Standard Dealer Tier • {completedWashes} total washes
                  </div>
                )}

                {/* Vehicles List */}
                <div className="space-y-2 mb-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                      <Car className="w-3.5 h-3.5 text-blue-600" />
                      <span>Enrolled Vehicles ({vehicleCount})</span>
                    </span>
                    <button
                      onClick={() => onOpenAddVehicle(cust)}
                      className="text-[11px] text-blue-600 hover:text-blue-700 font-medium flex items-center gap-0.5"
                    >
                      <Plus className="w-3 h-3" /> Add Vehicle
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {cust.vehicles && cust.vehicles.length > 0 ? (
                      cust.vehicles.map(v => (
                        <div 
                          key={v.id} 
                          className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 flex items-center justify-between"
                        >
                          <div>
                            <span className="bg-slate-900 text-amber-300 font-mono font-bold text-xs px-2 py-0.5 rounded border border-slate-800 shadow-xs inline-block mb-1">
                              {v.license_plate}
                            </span>
                            <div className="text-xs text-slate-800 font-semibold">
                              {v.make} {v.model}
                            </div>
                            <div className="text-[10px] text-slate-500">
                              {v.color} • {v.vehicle_type}
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] text-slate-500 block font-medium">Washes</span>
                            <span className="text-xs font-mono font-bold text-blue-600">{v.wash_count || 0}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-2 py-3 text-center text-xs text-slate-500 border border-dashed border-slate-300 rounded-xl bg-slate-50/50">
                        No vehicles added yet
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom Actions: Toggle Subscription */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-500 font-medium">
                  {isSub ? 'Subscription: Active' : 'Subscription: Inactive'}
                </span>
                <button
                  onClick={() => onToggleSubscription(cust.id, !isSub)}
                  className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition ${
                    isSub
                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
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
