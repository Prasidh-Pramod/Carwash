import React, { useState } from 'react';
import { 
  Building2, 
  Flame, 
  MessageSquare, 
  Save, 
  CheckCircle2, 
  ShieldCheck, 
  Info,
  DollarSign,
  Phone
} from 'lucide-react';

export default function DealerSettingsModal({ dealer, onUpdateDealer }) {
  const [name, setName] = useState(dealer?.name || '');
  const [phone, setPhone] = useState(dealer?.phone || '');
  const [address, setAddress] = useState(dealer?.address || '');
  const [city, setCity] = useState(dealer?.city || '');
  const [currency, setCurrency] = useState(dealer?.currency || '$');
  const [hasPromo, setHasPromo] = useState(Boolean(dealer?.has_fourth_wash_promo));
  const [promoTitle, setPromoTitle] = useState(dealer?.promo_title || '4th Wash Free Loyalty Pass');
  const [promoDesc, setPromoDesc] = useState(dealer?.promo_description || 'Subscribed members with 2 or more registered vehicles receive every 4th wash 100% FREE!');
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);

    try {
      await onUpdateDealer(dealer.id, {
        name,
        phone,
        address,
        city,
        currency,
        has_fourth_wash_promo: hasPromo ? 1 : 0,
        promo_title: promoTitle,
        promo_description: promoDesc
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      
      {/* Title */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-white">Dealer Loyalty Rules & Settings</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure dealership details, WhatsApp dispatch settings, and dealer-specific promo perks.
          </p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-brand-500/10 text-brand-400 flex items-center justify-center">
          <Building2 className="w-5 h-5" />
        </div>
      </div>

      <form onSubmit={handleSave} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl">
        
        {/* Dealership Basic Info */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider text-[11px] text-slate-400">
            Dealership Information
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Dealership Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Contact Phone</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-slate-300 block mb-1">Street Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">City & State</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>
        </div>

        {/* DEALER SPECIFIC PROMO ENGINE (User's Extra Feature) */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border border-amber-500/30 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-2.5">
              <Flame className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-bold text-white">
                  Special Loyalty Rule: 4th Wash Free (2+ Vehicles)
                </h3>
                <p className="text-xs text-slate-300 mt-1">
                  Enables the custom perk where <strong>Subscribed Customers who add 2 or more vehicles</strong> receive their <strong>4th wash completely FREE</strong>.
                </p>
                <div className="text-[11px] text-amber-300 mt-1 flex items-center gap-1">
                  <Info className="w-3.5 h-3.5" />
                  <span>Configured specifically for this carwash dealer; other dealers maintain standard loyalty rules.</span>
                </div>
              </div>
            </div>

            {/* Switch Toggle */}
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={hasPromo}
                onChange={(e) => setHasPromo(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
            </label>
          </div>

          {hasPromo && (
            <div className="space-y-3 pt-3 border-t border-amber-500/20">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Promo Display Title</label>
                <input
                  type="text"
                  value={promoTitle}
                  onChange={(e) => setPromoTitle(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Customer Terms & Description</label>
                <textarea
                  rows={2}
                  value={promoDesc}
                  onChange={(e) => setPromoDesc(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white resize-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* WhatsApp Notification Message Templates Preview */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider text-[11px] text-slate-400 flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
            <span>Automated WhatsApp Message Triggers</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700 text-xs">
              <div className="font-bold text-white mb-1">1. Intake Check-in</div>
              <p className="text-[11px] text-slate-400">
                Dispatches ticket #, assigned bay, estimated time and real-time live tracker link.
              </p>
            </div>
            <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700 text-xs">
              <div className="font-bold text-white mb-1">2. In-Wash Started</div>
              <p className="text-[11px] text-slate-400">
                Alerts user that foaming & high-pressure wash has begun.
              </p>
            </div>
            <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700 text-xs">
              <div className="font-bold text-white mb-1">3. Ready for Pickup + Invoice</div>
              <p className="text-[11px] text-slate-400">
                Notifies car is clean with finished photo, bay pickup lane & itemized invoice.
              </p>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          <div>
            {savedSuccess && (
              <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Dealer settings updated successfully!
              </span>
            )}
          </div>
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-brand-500 hover:bg-brand-600 text-white shadow-lg shadow-brand-500/25 transition flex items-center gap-2 active:scale-95 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Dealer Configuration'}</span>
          </button>
        </div>

      </form>

    </div>
  );
}
