import React from 'react';
import { 
  Sparkles, 
  Car, 
  Users, 
  Receipt, 
  Settings, 
  Plus, 
  Smartphone,
  Building2,
  Flame,
  LogOut,
  UserCheck
} from 'lucide-react';

export default function Navbar({ 
  carwash, 
  user,
  onLogout,
  activeTab, 
  setActiveTab, 
  onOpenCheckIn,
  onToggleWhatsAppDrawer,
  unreadWaCount = 0
}) {
  const hasPromo = Boolean(carwash?.has_fourth_wash_promo);

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur border-b border-slate-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo & Car Wash Business Info */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 via-brand-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-brand-500/20 text-white">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base sm:text-lg tracking-tight text-white">
                  {carwash?.name || 'My Car Wash'}
                </span>
                {hasPromo && (
                  <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    <Flame className="w-3 h-3 text-amber-400" />
                    4th Free Promo Active
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">
                {carwash?.city || 'Location'} • Managed by {user?.name || 'Owner'}
              </p>
            </div>
          </div>

          {/* Action Center & User Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* WhatsApp Simulator Drawer Toggle */}
            <button
              onClick={onToggleWhatsAppDrawer}
              className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-950/70 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-900/50 transition"
              title="Open Live WhatsApp Notification Simulator"
            >
              <Smartphone className="w-4 h-4 text-emerald-400" />
              <span className="hidden md:inline">WhatsApp Logs</span>
              {unreadWaCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              )}
            </button>

            {/* Check-In Car Button */}
            <button
              onClick={onOpenCheckIn}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-brand-500 to-cyan-500 hover:from-brand-600 hover:to-cyan-600 text-white shadow-lg shadow-brand-500/25 transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Check-In Car</span>
            </button>

            {/* User Profile & Sign Out */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
              <button
                onClick={onLogout}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium text-slate-400 hover:text-rose-300 hover:bg-rose-950/30 border border-transparent hover:border-rose-500/30 transition"
                title="Sign Out of Car Wash Portal"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>

          </div>

        </div>

        {/* Navigation Tabs */}
        <nav className="flex space-x-1 sm:space-x-4 border-t border-slate-800/80 pt-2 pb-2 text-xs overflow-x-auto">
          <button
            onClick={() => setActiveTab('washes')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium transition whitespace-nowrap ${
              activeTab === 'washes'
                ? 'bg-slate-800 text-brand-400 font-semibold border border-slate-700 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Car className="w-4 h-4" />
            <span>Live Wash Bays</span>
          </button>

          <button
            onClick={() => setActiveTab('customers')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium transition whitespace-nowrap ${
              activeTab === 'customers'
                ? 'bg-slate-800 text-brand-400 font-semibold border border-slate-700 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Customers & Multi-Vehicles</span>
          </button>

          <button
            onClick={() => setActiveTab('invoices')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium transition whitespace-nowrap ${
              activeTab === 'invoices'
                ? 'bg-slate-800 text-brand-400 font-semibold border border-slate-700 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>Invoices & Billing</span>
          </button>

          <button
            onClick={() => setActiveTab('tracker')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium transition whitespace-nowrap ${
              activeTab === 'tracker'
                ? 'bg-slate-800 text-brand-400 font-semibold border border-slate-700 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Customer Live Tracker</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium transition whitespace-nowrap ${
              activeTab === 'settings'
                ? 'bg-slate-800 text-brand-400 font-semibold border border-slate-700 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Loyalty Rules & Settings</span>
          </button>
        </nav>
      </div>
    </header>
  );
}
