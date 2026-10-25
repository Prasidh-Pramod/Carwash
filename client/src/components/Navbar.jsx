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
  ShieldCheck
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

  const isSuperAdmin = user?.role === 'SUPERADMIN' || user?.email?.toLowerCase() === 'prasidh25@gmail.com';

  const navItems = [
    ...(isSuperAdmin ? [{ id: 'superadmin', label: 'Platform Master Console', icon: ShieldCheck, isSpecial: true }] : []),
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
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200 text-slate-800 shadow-xs select-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-3">
            
            {/* Logo & Facility Identity */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm shrink-0">
                <Car className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm sm:text-base tracking-tight text-slate-900 truncate max-w-[150px] sm:max-w-xs">
                    {carwash?.name || 'WashFlow Facility'}
                  </span>
                  <span className="hidden sm:inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-mono font-medium bg-blue-50 text-blue-700 border border-blue-200">
                    PRO
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 truncate">
                  {carwash?.city ? `${carwash.city} • ` : ''}Managed by {user?.name || 'Owner'}
                </p>
              </div>
            </div>

            {/* Action Tools & User Menu */}
            <div className="flex items-center gap-2">
              
              {/* Super Admin Master Console Button */}
              {isSuperAdmin && (
                <button
                  onClick={() => setActiveTab('superadmin')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-xs ${
                    activeTab === 'superadmin'
                      ? 'bg-purple-600 text-white shadow-purple-200'
                      : 'bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100'
                  }`}
                  title="Open Master Super Admin Console"
                >
                  <ShieldCheck className="w-4 h-4 text-purple-600 group-hover:text-purple-700" />
                  <span>Master Console</span>
                </button>
              )}

              {/* Pitch Deck / Commercial Showcase */}
              <button
                onClick={onOpenPitchModal}
                className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition"
                title="Open Commercial Pitch & Value Overview"
              >
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span>Why WashFlow?</span>
              </button>

              {/* Install PWA Button */}
              {isInstallable && (
                <button
                  onClick={handleInstallClick}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition"
                  title="Install WashFlow App onto device"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Install App</span>
                </button>
              )}

              {/* WhatsApp Drawer Trigger */}
              <button
                onClick={onToggleWhatsAppDrawer}
                className="relative flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition"
                title="Open Live WhatsApp Notification Simulator"
              >
                <Smartphone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="hidden md:inline">WhatsApp Logs</span>
                {unreadWaCount > 0 && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                )}
              </button>

              {/* Check-In Car (Prominent) */}
              <button
                onClick={onOpenCheckIn}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden xs:inline">Check-In</span>
                <span className="hidden sm:inline">Vehicle</span>
              </button>

              {/* Sign Out */}
              <button
                onClick={onLogout}
                className="p-2 sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-medium text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition flex items-center gap-1 border border-transparent hover:border-rose-200"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>

            </div>

          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden md:flex space-x-1 border-t border-slate-100 pt-1.5 pb-2 text-xs overflow-x-auto">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              const activeClass = item.isSpecial
                ? 'bg-purple-50 text-purple-700 font-bold border border-purple-200 shadow-xs'
                : 'bg-blue-50 text-blue-700 font-semibold border border-blue-200 shadow-xs';

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium transition whitespace-nowrap ${
                    isActive
                      ? activeClass
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${item.isSpecial ? 'text-purple-600' : ''}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar (PWA Experience) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur border-t border-slate-200 flex items-center justify-around px-2 py-1.5 text-[10px] pb-[max(0.375rem,env(safe-area-inset-bottom))] shadow-xl select-none">
        
        {/* Bays */}
        <button
          onClick={() => setActiveTab('washes')}
          className={`flex flex-col items-center gap-0.5 p-1 rounded-lg transition ${
            activeTab === 'washes' ? 'text-blue-600 font-bold' : 'text-slate-500'
          }`}
        >
          <Car className="w-4 h-4" />
          <span>Bays</span>
        </button>

        {/* Analytics */}
        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex flex-col items-center gap-0.5 p-1 rounded-lg transition ${
            activeTab === 'analytics' ? 'text-blue-600 font-bold' : 'text-slate-500'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Reports</span>
        </button>

        {/* Centered Elevated Check-In Button */}
        <button
          onClick={onOpenCheckIn}
          className="flex flex-col items-center justify-center -mt-4 w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/30 border-2 border-white active:scale-95 transition"
          title="Check-in Vehicle"
        >
          <Plus className="w-6 h-6" />
        </button>

        {/* Invoices */}
        <button
          onClick={() => setActiveTab('invoices')}
          className={`flex flex-col items-center gap-0.5 p-1 rounded-lg transition ${
            activeTab === 'invoices' ? 'text-blue-600 font-bold' : 'text-slate-500'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Billing</span>
        </button>

        {/* Customers / Settings Toggle */}
        <button
          onClick={() => setActiveTab(activeTab === 'customers' ? 'settings' : 'customers')}
          className={`flex flex-col items-center gap-0.5 p-1 rounded-lg transition ${
            activeTab === 'customers' || activeTab === 'settings' ? 'text-blue-600 font-bold' : 'text-slate-500'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>{activeTab === 'settings' ? 'Settings' : 'Customers'}</span>
        </button>

      </nav>
    </>
  );
}
