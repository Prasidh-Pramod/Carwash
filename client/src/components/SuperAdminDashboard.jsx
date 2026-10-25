import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Users, 
  DollarSign, 
  Car, 
  ShieldCheck, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  ExternalLink, 
  MoreVertical, 
  Flame, 
  Lock, 
  RefreshCw, 
  Plus, 
  Sparkles,
  Phone,
  Mail,
  Trash2
} from 'lucide-react';
import { api } from '../api';

export default function SuperAdminDashboard({ 
  currentUser, 
  onImpersonateFacility, 
  onReturnToFacility 
}) {
  const [stats, setStats] = useState(null);
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, ACTIVE, TRIAL, SUSPENDED
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [statsData, facilitiesData] = await Promise.all([
        api.getAdminStats(),
        api.getAdminFacilities()
      ]);
      setStats(statsData);
      setFacilities(facilitiesData);
    } catch (err) {
      console.error('Failed to load superadmin data:', err);
      setError(err.message || 'Failed to load master console');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateSubscription = async (facilityId, status, plan, extendDays = 0) => {
    setActionLoadingId(facilityId);
    try {
      await api.updateFacilitySubscription(facilityId, {
        status,
        plan,
        extend_days: extendDays
      });
      await loadData();
    } catch (err) {
      alert(`Failed to update subscription: ${err.message}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteFacility = async (facilityId, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}" and all its test data? This cannot be undone.`)) {
      return;
    }
    setActionLoadingId(facilityId);
    try {
      await api.deleteFacility(facilityId);
      await loadData();
    } catch (err) {
      alert(`Failed to delete facility: ${err.message}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Filter facilities
  const filtered = facilities.filter(f => {
    if (statusFilter !== 'ALL' && f.subscription_status !== statusFilter) {
      return false;
    }
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      f.name?.toLowerCase().includes(q) ||
      f.owner_name?.toLowerCase().includes(q) ||
      f.owner_email?.toLowerCase().includes(q) ||
      f.city?.toLowerCase().includes(q) ||
      f.phone?.includes(q)
    );
  });

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 p-5 sm:p-6 rounded-2xl shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900">Platform Super Admin Console</h1>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 font-mono font-bold border border-purple-200">
                  MASTER CONTROLLER
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Logged in as <strong>{currentUser?.email}</strong> • Managing all registered car washes and subscription paywalls.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-300 transition flex items-center gap-1.5 shadow-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Total Facilities</span>
            <Building2 className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            {stats?.totalFacilities ?? '...'}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Car wash businesses</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Paying Subscribers</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-600 font-mono">
            {stats?.activeSubscribers ?? '...'}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Active paid licenses</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">14-Day Free Trials</span>
            <Flame className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600 font-mono">
            {stats?.trialFacilities ?? '...'}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Prospects in trial period</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Platform Washes</span>
            <Car className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            {stats?.totalWashes ?? '...'}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Cars processed across all bays</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Tracked Revenue</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            ${stats?.totalRevenue ?? '...'}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Settled invoices processed</div>
        </div>

      </div>

      {/* Facilities Master Ledger */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        
        {/* Toolbar: Search & Status Filters */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          
          {/* Status Tabs */}
          <div className="flex items-center gap-1 bg-slate-200/60 p-1 rounded-xl text-xs font-semibold">
            {[
              { key: 'ALL', label: `All Facilities (${facilities.length})` },
              { key: 'ACTIVE', label: `Active (${facilities.filter(f => f.subscription_status === 'ACTIVE').length})` },
              { key: 'TRIAL', label: `In Trial (${facilities.filter(f => f.subscription_status === 'TRIAL').length})` },
              { key: 'SUSPENDED', label: `Suspended (${facilities.filter(f => f.subscription_status === 'SUSPENDED' || f.subscription_status === 'EXPIRED').length})` },
            ].map(t => (
              <button
                key={t.key}
                onClick={() => setStatusFilter(t.key)}
                className={`py-1.5 px-3 rounded-lg transition ${
                  statusFilter === t.key
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Search box */}
          <div className="w-full md:w-80 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search facility, owner name, email, city..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600"
            />
          </div>

        </div>

        {/* Facilities Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/80 text-slate-600 font-semibold uppercase tracking-wider border-b border-slate-200 text-[11px]">
              <tr>
                <th className="py-3 px-4">Car Wash Business</th>
                <th className="py-3 px-4">Owner Contact</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Registered Date</th>
                <th className="py-3 px-4">Activity & Volume</th>
                <th className="py-3 px-4">Subscription Plan</th>
                <th className="py-3 px-4 text-right">Master Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No car wash facilities match the selected filter.
                  </td>
                </tr>
              ) : (
                filtered.map(dealer => {
                  const isCurrentActionLoading = actionLoadingId === dealer.id;
                  const isTrial = dealer.subscription_status === 'TRIAL';
                  const isActive = dealer.subscription_status === 'ACTIVE';
                  const isSuspended = dealer.subscription_status === 'SUSPENDED' || dealer.subscription_status === 'EXPIRED';

                  return (
                    <tr key={dealer.id} className="hover:bg-slate-50/70 transition group">
                      
                      {/* Facility */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                          <span>{dealer.name}</span>
                          {dealer.has_fourth_wash_promo ? (
                            <span title="4th Wash Free Promo Engine Active" className="cursor-help">🔥</span>
                          ) : null}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          ID: {dealer.id}
                        </div>
                      </td>

                      {/* Owner */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">
                          {dealer.owner_name || 'Owner'}
                        </div>
                        <div className="text-slate-500 text-[11px] flex items-center gap-1 mt-0.5">
                          <Mail className="w-3 h-3 text-slate-400" />
                          <span>{dealer.owner_email || dealer.email}</span>
                        </div>
                        {dealer.phone && (
                          <div className="text-slate-500 text-[11px] flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3 text-emerald-600" />
                            <span>{dealer.phone}</span>
                          </div>
                        )}
                      </td>

                      {/* Location */}
                      <td className="py-3.5 px-4 text-slate-600">
                        <div className="font-medium text-slate-800">{dealer.city || 'Not specified'}</div>
                        <div className="text-[10px] text-slate-400 truncate max-w-[150px]">{dealer.address || '-'}</div>
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                        <div>{new Date(dealer.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                        <div className="text-[10px] text-slate-400">{new Date(dealer.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      </td>

                      {/* Activity */}
                      <td className="py-3.5 px-4 font-mono">
                        <div className="text-slate-900 font-bold">
                          {dealer.wash_count || 0} washes
                        </div>
                        <div className="text-[10px] text-slate-500 font-sans">
                          ${dealer.revenue_collected} billed
                        </div>
                      </td>

                      {/* Subscription Status */}
                      <td className="py-3.5 px-4">
                        <div>
                          {isActive && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>{dealer.subscription_plan || 'Active Pro'}</span>
                            </span>
                          )}
                          {isTrial && (
                            <div>
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                                <Clock className="w-3 h-3 text-amber-600" />
                                <span>Trial ({dealer.days_remaining_trial ?? 14} days left)</span>
                              </span>
                            </div>
                          )}
                          {isSuspended && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                              <Lock className="w-3 h-3 text-rose-600" />
                              <span>Suspended / Expired</span>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          
                          {/* Impersonate / Step Into Dashboard */}
                          <button
                            onClick={() => onImpersonateFacility(dealer.id)}
                            title="Open and view this car wash dashboard as owner"
                            className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white border border-blue-200 transition text-[11px] font-semibold flex items-center gap-1"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>View Bay</span>
                          </button>

                          {/* Quick Subscription Actions */}
                          {isTrial && (
                            <>
                              <button
                                onClick={() => handleUpdateSubscription(dealer.id, 'ACTIVE', 'Pro Unlimited ($99/mo)')}
                                disabled={isCurrentActionLoading}
                                title="Activate paid monthly license"
                                className="px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-200 transition text-[11px] font-semibold"
                              >
                                + Activate
                              </button>
                              <button
                                onClick={() => handleUpdateSubscription(dealer.id, 'TRIAL', dealer.subscription_plan, 14)}
                                disabled={isCurrentActionLoading}
                                title="Extend trial by +14 days"
                                className="px-2 py-1 rounded-lg bg-amber-50 hover:bg-amber-600 text-amber-800 hover:text-white border border-amber-200 transition text-[11px] font-semibold"
                              >
                                +14D Trial
                              </button>
                            </>
                          )}

                          {isActive && (
                            <button
                              onClick={() => handleUpdateSubscription(dealer.id, 'SUSPENDED', dealer.subscription_plan)}
                              disabled={isCurrentActionLoading}
                              title="Suspend facility access"
                              className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 border border-slate-200 transition text-[11px] font-semibold"
                            >
                              Suspend
                            </button>
                          )}

                          {isSuspended && (
                            <button
                              onClick={() => handleUpdateSubscription(dealer.id, 'ACTIVE', 'Pro Unlimited ($99/mo)')}
                              disabled={isCurrentActionLoading}
                              title="Reactivate subscription"
                              className="px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-200 transition text-[11px] font-semibold"
                            >
                              Reactivate
                            </button>
                          )}

                          {/* Delete test dealer */}
                          <button
                            onClick={() => handleDeleteFacility(dealer.id, dealer.name)}
                            disabled={isCurrentActionLoading}
                            title="Delete facility and test data"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
}
