import React, { useState } from 'react';
import { 
  X, 
  CheckCircle2, 
  Smartphone, 
  Receipt, 
  Sparkles, 
  DollarSign, 
  ShieldCheck, 
  Flame, 
  ArrowRight,
  Zap,
  Layers,
  Award,
  ChevronRight
} from 'lucide-react';

export default function PitchDeckModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const [carsPerDay, setCarsPerDay] = useState(60);

  // ROI Calculator
  const smsSavedPerMonth = Math.round(carsPerDay * 30 * 0.05); // Saving $0.05 per SMS
  const hardwareSavingsOneTime = 6500; // Legacy POS hardware cost
  const loyaltyRevenueBoost = Math.round(carsPerDay * 30 * 0.25 * 35); // 25% repeat boost at $35 ticket

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-[#111827] border border-slate-800 w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-600/30">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-base">WashFlow Enterprise Solution</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  Value Pitch Deck
                </span>
              </div>
              <p className="text-xs text-slate-400">
                The next-generation operations & automated customer retention platform for modern car washes.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-8 space-y-8 text-slate-200">
          
          {/* Key Value Pillars Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <Smartphone className="w-4 h-4" />
              </div>
              <div className="font-bold text-white text-sm">Automated WhatsApp Messaging</div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Eliminate expensive legacy SMS gateways. Customers receive instant branded intake tickets, live bay tracking links, and digital receipts on WhatsApp.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="font-bold text-white text-sm">Customer Live Progress Portal</div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Customers scan a QR or tap their WhatsApp link to view their wash live. Eliminates waiting lounge anxiety and staff inquiries.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
                <Award className="w-4 h-4" />
              </div>
              <div className="font-bold text-white text-sm">Automated 4th Wash Free Engine</div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Incentivizes customers to enroll 2+ family or company fleet vehicles. The system automatically detects and applies 100% free washes upon qualification.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <Receipt className="w-4 h-4" />
              </div>
              <div className="font-bold text-white text-sm">Triplicate Audit Receipts</div>
              <p className="text-xs text-slate-400 leading-relaxed">
                1-click print produces Original Customer Copy, Duplicate Accounts Copy, and Triplicate Bay Gate Pass on standard thermal receipt printers.
              </p>
            </div>

          </div>

          {/* ROI Calculator Section */}
          <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950/40 border border-blue-500/30 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs uppercase font-bold text-blue-400 tracking-wider">
                  Interactive Dealership ROI Calculator
                </span>
                <h3 className="text-lg font-bold text-white mt-0.5">
                  Estimated Financial Impact for Your Facility
                </h3>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400">Daily Volume:</span>
                <div className="text-xl font-bold font-mono text-white">{carsPerDay} cars/day</div>
              </div>
            </div>

            {/* Slider */}
            <div>
              <input 
                type="range"
                min="10"
                max="250"
                step="5"
                value={carsPerDay}
                onChange={(e) => setCarsPerDay(Number(e.target.value))}
                className="w-full accent-blue-500 cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-slate-500 mt-1">
                <span>10 Cars/Day (Boutique)</span>
                <span>100 Cars/Day (Busy Center)</span>
                <span>250+ Cars/Day (High Volume)</span>
              </div>
            </div>

            {/* ROI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 text-center">
                <div className="text-[11px] text-slate-400">Monthly SMS Costs Saved</div>
                <div className="text-xl font-bold font-mono text-emerald-400 mt-1">${smsSavedPerMonth}/mo</div>
                <div className="text-[10px] text-slate-500 mt-0.5">via WhatsApp Automation</div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 text-center">
                <div className="text-[11px] text-slate-400">One-Time Hardware Savings</div>
                <div className="text-xl font-bold font-mono text-blue-400 mt-1">${hardwareSavingsOneTime}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">No proprietary POS required</div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 text-center">
                <div className="text-[11px] text-slate-400">Projected Loyalty Upsell Lift</div>
                <div className="text-xl font-bold font-mono text-purple-400 mt-1">+${loyaltyRevenueBoost.toLocaleString()}/mo</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Multi-vehicle retention boost</div>
              </div>
            </div>
          </div>

          {/* Architecture & Deployment */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <div className="font-semibold text-white">Full Cloud & Progressive Web App (PWA) Ready</div>
                <div className="text-slate-400 text-[11px]">Installable on any iPad, Android Tablet, or PC terminal with instant WebSocket sync.</div>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-400">
            Ready to deploy for your facility?
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition flex items-center gap-1.5"
          >
            <span>Close & Return to Live App</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </div>
  );
}
