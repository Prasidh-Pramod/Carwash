import React, { useState, useEffect } from 'react';
import { 
  Car, 
  Users, 
  Receipt, 
  Settings, 
  Plus, 
  Smartphone,
  LogOut,
  BarChart3,
  Sparkles,
  Download,
  Zap,
  Menu,
  X
} from 'lucide-react';

export default function Navbar({ 
  carwash, 
  user,
  onLogout,
  activeTab, 
  setActiveTab, 
  onOpenCheckIn,
  onToggleWhatsAppDrawer,
  onOpenPitchModal,
  unreadWaCount = 0
}) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);

  // Capture PWA Install Prompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Check if already in standalone PWA mode
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
      setIsInstallable(false);
    }

    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      alert('To install WashFlow on iOS:\n1. Tap the Share button in Safari.\n2. Tap "Add to Home Screen".');
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstallable(false);
    }
    setDeferredPrompt(null);
  };

  const navItems = [
    { id: 'washes', label: 'Wash Bays', icon: Car },
    { id: 'analytics', label: 'Analytics & Revenue', icon: BarChart3 },
    { id: 'customers', label: 'Customers & Fleets', icon: Users },
    { id: 'invoices', label: 'Invoices & Billing', icon: Receipt },
    { id: 'tracker', label: 'Customer Live Tracker', icon: Sparkles },
    { id: 'settings', label: 'Settings & Loyalty', icon: Settings },
  ];

  return (
    <>
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-[#111827]/95 backdrop-blur border-b border-slate-800 text-white select-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-3">
            
            {/* Logo & Facility Identity */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm shrink-0">
                <Car className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm sm:text-base tracking-tight text-white truncate max-w-[150px] sm:max-w-xs">
                    {carwash?.name || 'WashFlow Facility'}
                  </span>
                  <span className="hidden sm:inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-mono font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    PRO
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 truncate">
                  {carwash?.city ? `${carwash.city} • ` : ''}Managed by {user?.name || 'Owner'}
                </p>
              </div>
            </div>

            {/* Action Tools & User Menu */}
            <div className="flex items-center gap-2">
              
              {/* Pitch Deck / Commercial Showcase */}
              <button
                onClick={onOpenPitchModal}
                className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
                title="Open Commercial Pitch & Value Overview"
              >
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Why WashFlow?</span>
              </button>

              {/* Install PWA Button */}
              {isInstallable && (
                <button
                  onClick={handleInstallClick}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/30 hover:bg-blue-500/20 transition"
                  title="Install WashFlow App onto device"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Install App</span>
                </button>
              )}

              {/* WhatsApp Drawer Trigger */}
              <button
                onClick={onToggleWhatsAppDrawer}
                className="relative flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-950/60 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-900/40 transition"
                title="Open Live WhatsApp Notification Simulator"
              >
                <Smartphone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="hidden md:inline">WhatsApp Logs</span>
                {unreadWaCount > 0 && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                )}
              </button>

              {/* Check-In Car (Prominent) */}
              <button
                onClick={onOpenCheckIn}
                className="flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-sm transition active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden xs:inline font-bold">Check-In</span>
                <span className="hidden sm:inline font-bold">Vehicle</span>
              </button>

              {/* Sign Out */}
              <button
                onClick={onLogout}
                className="p-2 sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-medium text-slate-400 hover:text-rose-300 hover:bg-rose-950/20 transition flex items-center gap-1 border border-transparent hover:border-rose-500/20"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>

            </div>

          </div>

          {/* Desktop Navigation Tabs (Hidden on small mobile screens) */}
          <nav className="hidden md:flex space-x-1 border-t border-slate-800/80 pt-1.5 pb-2 text-xs overflow-x-auto">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium transition whitespace-nowrap ${
                    isActive
                      ? 'bg-slate-800 text-blue-400 font-semibold border border-slate-700/80 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar (PWA Experience for Phones) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#111827]/95 backdrop-blur border-t border-slate-800/90 flex items-center justify-around px-2 py-1.5 text-[10px] pb-[max(0.375rem,env(safe-area-inset-bottom))] shadow-2xl select-none">
        
        {/* Bays */}
        <button
          onClick={() => setActiveTab('washes')}
          className={`flex flex-col items-center gap-0.5 p-1 rounded-lg transition ${
            activeTab === 'washes' ? 'text-blue-400 font-bold' : 'text-slate-400'
          }`}
        >
          <Car className="w-4 h-4" />
          <span>Bays</span>
        </button>

        {/* Analytics */}
        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex flex-col items-center gap-0.5 p-1 rounded-lg transition ${
            activeTab === 'analytics' ? 'text-blue-400 font-bold' : 'text-slate-400'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Reports</span>
        </button>

        {/* Centered Elevated Check-In Button */}
        <button
          onClick={onOpenCheckIn}
          className="flex flex-col items-center justify-center -mt-4 w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/40 border-2 border-[#111827] active:scale-95 transition"
          title="Check-in Vehicle"
        >
          <Plus className="w-6 h-6" />
        </button>

        {/* Invoices */}
        <button
          onClick={() => setActiveTab('invoices')}
          className={`flex flex-col items-center gap-0.5 p-1 rounded-lg transition ${
            activeTab === 'invoices' ? 'text-blue-400 font-bold' : 'text-slate-400'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Billing</span>
        </button>

        {/* Customers / Settings Toggle */}
        <button
          onClick={() => setActiveTab(activeTab === 'customers' ? 'settings' : 'customers')}
          className={`flex flex-col items-center gap-0.5 p-1 rounded-lg transition ${
            activeTab === 'customers' || activeTab === 'settings' ? 'text-blue-400 font-bold' : 'text-slate-400'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>{activeTab === 'settings' ? 'Settings' : 'Customers'}</span>
        </button>

      </nav>
    </>
  );
}
