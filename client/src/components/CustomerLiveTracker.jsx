import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { 
  Car, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  Phone, 
  MapPin, 
  ShieldCheck, 
  Receipt, 
  Flame, 
  ExternalLink,
  Droplets,
  Wind,
  Check
} from 'lucide-react';

export default function CustomerLiveTracker({ washes, dealer, onOpenInvoice }) {
  const [selectedWashId, setSelectedWashId] = useState(washes[0]?.id || '');
  const [liveWash, setLiveWash] = useState(null);

  const activeWash = liveWash || washes.find(w => w.id === selectedWashId) || washes[0];

  useEffect(() => {
    if (activeWash) {
      setLiveWash(washes.find(w => w.id === selectedWashId) || washes[0]);
    }
  }, [selectedWashId, washes]);

  // Connect to real-time tracker room
  useEffect(() => {
    if (!activeWash) return;

    const socket = io(window.location.origin, {
      transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
      socket.emit('join:tracker', activeWash.id);
    });

    socket.on('tracker:status_changed', (payload) => {
      if (payload.wash && payload.wash.id === activeWash.id) {
        setLiveWash(prev => ({ ...(prev || activeWash), ...payload.wash }));
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [activeWash?.id]);

  if (!activeWash) {
    return (
      <div className="py-20 text-center text-slate-400">
        No active vehicle wash to track currently.
      </div>
    );
  }

  const STAGES = [
    { key: 'QUEUED', label: 'Vehicle Intake & Bay Queue', desc: 'Checked in and queued for assigned bay' },
    { key: 'IN_WASH', label: 'Active Foam & Pressure Wash', desc: 'High-pressure foam cannon & undercarriage rinse' },
    { key: 'QUALITY_CHECK', label: 'Hand Dry, Vacuum & Inspection', desc: 'Microfiber drying, tire dressing & QC check' },
    { key: 'COMPLETED', label: 'Sparkling Clean & Ready for Pickup!', desc: 'Parked in exit lane ready for collection' },
  ];

  const getStageIndex = (status) => {
    switch (status) {
      case 'QUEUED': return 0;
      case 'IN_WASH': return 1;
      case 'QUALITY_CHECK': return 2;
      case 'COMPLETED':
      case 'DELIVERED': return 3;
      default: return 0;
    }
  };

  const currentIdx = getStageIndex(activeWash.status);
  const isFree = Boolean(activeWash.is_free_wash);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      
      {/* Selector banner for testing different active cars */}
      <div className="bg-white border border-slate-200 p-3.5 rounded-2xl flex items-center justify-between text-xs text-slate-600 shadow-xs">
        <span className="text-slate-500 font-medium">
          Viewing Public Customer Tracking Portal for:
        </span>
        <select
          value={activeWash.id}
          onChange={(e) => setSelectedWashId(e.target.value)}
          className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-600 font-mono"
        >
          {washes.map(w => (
            <option key={w.id} value={w.id}>
              {w.license_plate} ({w.customer_name}) - [{w.status}]
            </option>
          ))}
        </select>
      </div>

      {/* Customer Mobile Phone Card Frame */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 relative overflow-hidden">

        {/* Header: Dealer Info */}
        <div className="text-center pb-6 border-b border-slate-200 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Live Wash Bay Progress</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900">{dealer.name}</h2>
          <p className="text-xs text-slate-500 mt-0.5">{dealer.address}, {dealer.city}</p>
        </div>

        {/* Car Badge & Status */}
        <div className="my-6 p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-center text-blue-600">
              <Car className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono font-bold bg-slate-900 text-amber-300 px-2.5 py-0.5 rounded border border-slate-800 shadow-xs">
                  {activeWash.license_plate}
                </span>
                <span className="text-xs text-slate-800 font-semibold">
                  {activeWash.vehicle_make} {activeWash.vehicle_model}
                </span>
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Owner: <strong>{activeWash.customer_name}</strong> • Ticket: #{activeWash.wash_code}
              </div>
            </div>
          </div>

          <div className="text-center sm:text-right">
            <span className="text-[10px] uppercase font-semibold text-slate-500 block">Assigned Bay</span>
            <span className="text-lg font-mono font-black text-blue-600">
              Bay #{activeWash.bay_number}
            </span>
          </div>
        </div>

        {/* 4th Wash Free Celebration Banner if applicable */}
        {isFree && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-3">
            <Flame className="w-6 h-6 text-amber-600 shrink-0 animate-bounce" />
            <div>
              <span className="font-bold text-sm">🎉 4th Wash 100% FREE!</span>
              <p className="text-[11px] text-amber-700 mt-0.5">
                Thank you for being a subscribed multi-vehicle member at {dealer.name}! This wash is on us.
              </p>
            </div>
          </div>
        )}

        {/* Progress Stepper */}
        <div className="space-y-6 my-8 relative">
          {STAGES.map((stage, idx) => {
            const isCompleted = idx < currentIdx;
            const isCurrent = idx === currentIdx;
            const isUpcoming = idx > currentIdx;

            return (
              <div key={stage.key} className="flex items-start gap-4 relative">
                {/* Connector line */}
                {idx < STAGES.length - 1 && (
                  <div className={`absolute left-4 top-8 w-0.5 h-10 ${
                    idx < currentIdx ? 'bg-blue-600' : 'bg-slate-200'
                  }`} />
                )}

                {/* Circle Icon */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold transition z-10 ${
                  isCompleted 
                    ? 'bg-blue-600 text-white shadow-xs' 
                    : isCurrent 
                    ? 'bg-amber-500 text-white ring-4 ring-amber-100 animate-pulse' 
                    : 'bg-slate-100 border border-slate-200 text-slate-400'
                }`}>
                  {isCompleted ? <Check className="w-4 h-4" /> : idx + 1}
                </div>

                {/* Text */}
                <div className="flex-1 pt-0.5">
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-bold ${
                      isCurrent ? 'text-amber-800' : isCompleted ? 'text-slate-900' : 'text-slate-400'
                    }`}>
                      {stage.label}
                    </span>
                    {isCurrent && (
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                        In Progress Now
                      </span>
                    )}
                    {isCompleted && (
                      <span className="text-[10px] text-emerald-600 font-semibold">Done</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {stage.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Buttons: Call Dealer & View Invoice */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-slate-200">
          <a
            href={`tel:${dealer.phone}`}
            className="py-2.5 px-4 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-semibold transition flex items-center justify-center gap-2"
          >
            <Phone className="w-4 h-4 text-emerald-600" />
            <span>Call Dealer Front Desk</span>
          </a>

          <button
            onClick={() => onOpenInvoice(activeWash.id)}
            className="py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition shadow-xs flex items-center justify-center gap-2"
          >
            <Receipt className="w-4 h-4" />
            <span>View Wash Receipt / Invoice</span>
          </button>
        </div>

      </div>

    </div>
  );
}
