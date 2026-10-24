import React, { useState, useEffect } from 'react';
import { 
  X, 
  Car, 
  User, 
  Sparkles, 
  Check, 
  Flame, 
  AlertCircle, 
  Plus, 
  Phone, 
  Camera, 
  ShieldCheck,
  MessageSquare
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function CheckInModal({
  isOpen,
  onClose,
  dealer,
  customers,
  services,
  onCheckInSuccess,
  onOpenAddVehicle
}) {
  if (!isOpen) return null;

  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [selectedAddons, setSelectedAddons] = useState([]);
  const [bayNumber, setBayNumber] = useState(1);
  const [washerStaff, setWasherStaff] = useState('Carlos R.');
  const [beforePhoto, setBeforePhoto] = useState('');
  const [notes, setNotes] = useState('');
  const [sendWhatsApp, setSendWhatsApp] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // New customer inline toggle
  const [isCreatingNewCustomer, setIsCreatingNewCustomer] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustPlate, setNewCustPlate] = useState('');
  const [newCustMake, setNewCustMake] = useState('');
  const [newCustModel, setNewCustModel] = useState('');
  const [newCustSubscribed, setNewCustSubscribed] = useState(true);

  // Set default service
  useEffect(() => {
    if (services && services.length > 0 && (!selectedServiceId || !services.some(s => s.id === selectedServiceId))) {
      const defaultPkg = services.find(s => s.category === 'Package') || services[0];
      setSelectedServiceId(defaultPkg.id);
    }
  }, [services, selectedServiceId]);

  // Set default customer or auto-open new customer intake if none exist
  useEffect(() => {
    if (!customers || customers.length === 0) {
      setIsCreatingNewCustomer(true);
    } else if (!selectedCustomerId && !isCreatingNewCustomer) {
      setSelectedCustomerId(customers[0].id);
      if (customers[0].vehicles && customers[0].vehicles.length > 0) {
        setSelectedVehicleId(customers[0].vehicles[0].id);
      }
    }
  }, [customers, selectedCustomerId, isCreatingNewCustomer]);

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);
  
  // When selected customer changes, update selected vehicle
  useEffect(() => {
    if (selectedCustomer && selectedCustomer.vehicles && selectedCustomer.vehicles.length > 0) {
      setSelectedVehicleId(selectedCustomer.vehicles[0].id);
    } else {
      setSelectedVehicleId('');
    }
  }, [selectedCustomerId]);

  const customerLoyalty = selectedCustomer?.loyalty;
  const isEligibleForFreeWash = Boolean(customerLoyalty?.eligible);

  // Calculations
  const serviceObj = services.find(s => s.id === selectedServiceId) || { base_price: 0, name: '' };
  const addonsTotal = selectedAddons.reduce((sum, item) => sum + item.price, 0);
  const subtotal = serviceObj.base_price + addonsTotal;
  const discount = isEligibleForFreeWash ? serviceObj.base_price : 0;
  const taxable = Math.max(0, subtotal - discount);
  const tax = Number((taxable * 0.08).toFixed(2));
  const finalTotal = Number((taxable + tax).toFixed(2));

  const toggleAddon = (addon) => {
    if (selectedAddons.some(a => a.id === addon.id)) {
      setSelectedAddons(selectedAddons.filter(a => a.id !== addon.id));
    } else {
      setSelectedAddons([...selectedAddons, { id: addon.id, name: addon.name, price: addon.base_price }]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const dealerId = dealer?.id || dealer?.dealer_id;
    if (!dealerId) {
      setError('Dealer profile not found. Please log in again.');
      setLoading(false);
      return;
    }

    try {
      let custId = selectedCustomerId;
      let vehId = selectedVehicleId;

      // Handle inline new customer creation
      if (isCreatingNewCustomer) {
        if (!newCustName.trim()) {
          throw new Error('Please enter customer full name.');
        }
        if (!newCustPhone.trim()) {
          throw new Error('Please enter customer phone number.');
        }
        if (!newCustPlate.trim()) {
          throw new Error('Please enter vehicle license plate.');
        }

        const resCust = await fetch('/api/customers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            dealer_id: dealerId,
            name: newCustName.trim(),
            phone: newCustPhone.trim(),
            is_subscribed: newCustSubscribed ? 1 : 0,
            subscription_plan: newCustSubscribed ? 'Gold Membership' : 'None',
            vehicles: [
              {
                license_plate: newCustPlate.trim().toUpperCase(),
                make: newCustMake.trim() || 'Make',
                model: newCustModel.trim() || 'Model'
              }
            ]
          })
        });

        const createdCustData = await resCust.json();
        if (!resCust.ok) throw new Error(createdCustData.error || 'Failed to create customer');
        
        custId = createdCustData.id;
        vehId = createdCustData.vehicles?.[0]?.id;
      }

      if (!custId || !vehId) {
        throw new Error('Please select or create a customer and vehicle.');
      }

      const activeServiceId = selectedServiceId || (services && services[0]?.id);
      if (!activeServiceId) {
        throw new Error('Please select a wash service package.');
      }

      // Checkin vehicle
      const res = await fetch('/api/washes/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dealer_id: dealerId,
          customer_id: custId,
          vehicle_id: vehId,
          service_id: activeServiceId,
          addons: selectedAddons,
          bay_number: Number(bayNumber),
          washer_staff: washerStaff,
          before_photo: beforePhoto || null,
          notes,
          send_whatsapp: sendWhatsApp
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Check-in failed');

      // Trigger confetti if free wash was awarded!
      if (isEligibleForFreeWash) {
        confetti({
          particleCount: 120,
          spread: 70,
          origin: { y: 0.6 }
        });
      }

      setNewCustName('');
      setNewCustPhone('');
      setNewCustPlate('');
      setNewCustMake('');
      setNewCustModel('');
      setError('');

      onCheckInSuccess(data);
      onClose();
    } catch (err) {
      console.error('CheckIn error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const packageServices = services.filter(s => s.category === 'Package');
  const addonServices = services.filter(s => s.category === 'Addon');

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white border border-slate-200 w-full max-w-2xl max-h-[92vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header (Always Visible at Top) */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-200 bg-slate-50/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <Car className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Intake & Wash Check-In</h2>
              <p className="text-xs text-slate-500">{dealer.name}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form with Scrollable Content & Sticky Footer */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
          
          {/* Scrollable Form Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}
          
          {/* Customer Selection or Inline Add */}
          <div className="space-y-3">
            {/* Segmented Switcher */}
            <div className="bg-slate-100 p-1 rounded-xl flex items-center border border-slate-200 gap-1">
              <button
                type="button"
                onClick={() => {
                  setIsCreatingNewCustomer(false);
                  setError('');
                }}
                disabled={customers.length === 0}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition ${
                  !isCreatingNewCustomer
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed'
                }`}
              >
                <User className="w-3.5 h-3.5 text-blue-600" />
                <span>Existing Customer ({customers.length})</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsCreatingNewCustomer(true);
                  setError('');
                }}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition ${
                  isCreatingNewCustomer
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Plus className="w-3.5 h-3.5 text-blue-600" />
                <span>+ Add New Customer</span>
              </button>
            </div>

            {!isCreatingNewCustomer ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Select Customer */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">Select Customer</label>
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                  >
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.phone}) - {c.is_subscribed ? '⭐ Subscribed' : 'Standard'}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Select Vehicle */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-semibold text-slate-700">Select Vehicle</label>
                    {selectedCustomer && (
                      <button
                        type="button"
                        onClick={() => onOpenAddVehicle(selectedCustomer)}
                        className="text-[11px] text-blue-600 hover:underline flex items-center gap-0.5 font-medium"
                      >
                        + Add 2nd Vehicle
                      </button>
                    )}
                  </div>
                  <select
                    value={selectedVehicleId}
                    onChange={(e) => setSelectedVehicleId(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600 font-mono"
                  >
                    {selectedCustomer?.vehicles?.map(v => (
                      <option key={v.id} value={v.id}>
                        {v.license_plate} - {v.make} {v.model} ({v.color})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ) : (
              /* Inline New Customer Form */
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="text-[11px] font-bold text-blue-700 flex items-center gap-1.5 pb-1 border-b border-slate-200">
                  <Plus className="w-3.5 h-3.5" />
                  <span>Enter New Customer & Vehicle Details:</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[10px] text-slate-600 block mb-0.5 font-semibold">Customer Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Alex Johnson"
                      value={newCustName}
                      onChange={(e) => setNewCustName(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-600 block mb-0.5 font-semibold">WhatsApp Phone *</label>
                    <input
                      type="text"
                      placeholder="e.g. +1 555-234-5678"
                      value={newCustPhone}
                      onChange={(e) => setNewCustPhone(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="text-[10px] text-slate-600 block mb-0.5 font-semibold">License Plate *</label>
                    <input
                      type="text"
                      placeholder="e.g. 7XYZ99"
                      value={newCustPlate}
                      onChange={(e) => setNewCustPlate(e.target.value.toUpperCase())}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-amber-300 font-mono uppercase focus:outline-none focus:border-blue-600 shadow-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-600 block mb-0.5 font-semibold">Car Make</label>
                    <input
                      type="text"
                      placeholder="e.g. Honda"
                      value={newCustMake}
                      onChange={(e) => setNewCustMake(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-600 block mb-0.5 font-semibold">Car Model</label>
                    <input
                      type="text"
                      placeholder="e.g. Civic"
                      value={newCustModel}
                      onChange={(e) => setNewCustModel(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                    />
                  </div>
                </div>
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 pt-1">
                  <input
                    type="checkbox"
                    checked={newCustSubscribed}
                    onChange={(e) => setNewCustSubscribed(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-0"
                  />
                  <span className="font-medium">Enroll in Loyalty Membership Subscription (Unlocks Free Wash Perks)</span>
                </label>
              </div>
            )}
          </div>

          {/* LOYALTY CALLOUT / PROMO STATUS (4TH WASH FREE!) */}
          {!isCreatingNewCustomer && customerLoyalty && (
            <div className={`p-3.5 rounded-xl border transition ${
              isEligibleForFreeWash 
                ? 'bg-amber-50 border-amber-200 text-amber-900'
                : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2">
                  <Flame className={`w-4 h-4 shrink-0 mt-0.5 ${isEligibleForFreeWash ? 'text-amber-600 animate-bounce' : 'text-slate-400'}`} />
                  <div>
                    <div className="text-xs font-bold flex items-center gap-2">
                      <span>{customerLoyalty.perkSummary}</span>
                      {isEligibleForFreeWash && (
                        <span className="bg-amber-100 text-amber-900 border border-amber-300 font-extrabold text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider">
                          100% Free Wash
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] mt-0.5 text-slate-600">
                      {customerLoyalty.reason}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-[10px] text-slate-500 font-medium">Total Washes</div>
                  <div className="text-xs font-mono font-bold text-slate-900">
                    {customerLoyalty.currentWashCount} completed
                  </div>
                </div>
              </div>

              {/* Action advice if close or missing */}
              {customerLoyalty.missingRequirement === 'vehicles' && (
                <div className="mt-2 pt-2 border-t border-amber-200 flex items-center justify-between text-[11px] text-amber-800">
                  <span>💡 Tip: Add customer's second vehicle now to activate 4th wash free eligibility!</span>
                  <button
                    type="button"
                    onClick={() => onOpenAddVehicle(selectedCustomer)}
                    className="font-bold underline ml-2 text-blue-600"
                  >
                    Add Vehicle
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Service Package Selection */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-800">Select Wash Package</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {packageServices.map(srv => {
                const isSelected = selectedServiceId === srv.id;
                return (
                  <div
                    key={srv.id}
                    onClick={() => setSelectedServiceId(srv.id)}
                    className={`p-3 rounded-xl border cursor-pointer transition ${
                      isSelected
                        ? 'bg-blue-50/80 border-2 border-blue-600 text-slate-900 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold">{srv.name}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-blue-600" />}
                    </div>
                    <div className="text-[11px] text-slate-500 line-clamp-2 mb-2">
                      {srv.description}
                    </div>
                    <div className="text-xs font-mono font-extrabold text-blue-600">
                      {dealer.currency}{Number(srv.base_price).toFixed(2)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Add-on Services */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-800">Optional Add-On Treatments</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {addonServices.map(addon => {
                const isChecked = selectedAddons.some(a => a.id === addon.id);
                return (
                  <label
                    key={addon.id}
                    onClick={() => toggleAddon(addon)}
                    className={`flex items-center justify-between p-2.5 rounded-xl border text-xs cursor-pointer transition select-none ${
                      isChecked 
                        ? 'bg-blue-50 border-blue-300 text-blue-900 font-medium' 
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <div className="font-semibold text-slate-800">{addon.name}</div>
                      <div className="text-[10px] text-blue-600 font-mono font-medium">+{dealer.currency}{Number(addon.base_price).toFixed(2)}</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}}
                      className="rounded border-slate-300 text-blue-600 focus:ring-0"
                    />
                  </label>
                );
              })}
            </div>
          </div>

          {/* Bay Assignment & Staff */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-800 block mb-1">Assign Wash Bay</label>
              <select
                value={bayNumber}
                onChange={(e) => setBayNumber(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
              >
                <option value={1}>Bay #1 - Foam Cannon & High Pressure</option>
                <option value={2}>Bay #2 - Touchless Hydro Express</option>
                <option value={3}>Bay #3 - Ceramic & Detailing Bay</option>
                <option value={4}>Bay #4 - Interior Vacuum & Shampoo</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-800 block mb-1">Assigned Technician</label>
              <input
                type="text"
                value={washerStaff}
                onChange={(e) => setWasherStaff(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
              />
            </div>
          </div>

          {/* Vehicle Pre-Inspection / Scratches Photo & Notes */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-slate-500" />
                <span>Pre-Inspection (Scratch/Dent Documentation)</span>
              </label>
              <span className="text-[10px] text-slate-500">Protects dealership against prior damage claims</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Before-wash photo URL or image link..."
                value={beforePhoto}
                onChange={(e) => setBeforePhoto(e.target.value)}
                className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600"
              />
              <input
                type="text"
                placeholder="Intake notes (e.g. Scratches on left fender, fragrance-free)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600"
              />
            </div>
          </div>

          {/* WhatsApp Automated Delivery Checkbox */}
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-600" />
              <div>
                <div className="text-xs font-bold text-emerald-900">Send Instant WhatsApp Intake Confirmation</div>
                <div className="text-[10px] text-emerald-700">Sends ticket #{'auto'}, bay assignment & live tracking link</div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={sendWhatsApp}
              onChange={(e) => setSendWhatsApp(e.target.checked)}
              className="w-4 h-4 rounded border-emerald-400 text-emerald-600 focus:ring-0"
            />
          </div>

          {/* Pricing Summary */}
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 flex items-center justify-between text-xs">
            <div className="space-y-0.5">
              <div className="text-slate-600">Subtotal: {dealer.currency}{subtotal.toFixed(2)}</div>
              {isEligibleForFreeWash && (
                <div className="text-amber-700 font-bold">
                  Loyalty Discount: -{dealer.currency}{discount.toFixed(2)} (100% Free!)
                </div>
              )}
              <div className="text-slate-600">Tax (8%): {dealer.currency}{tax.toFixed(2)}</div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-slate-500 uppercase font-semibold">Total Due</div>
              <div className="text-lg font-mono font-extrabold text-slate-900">
                {dealer.currency}{finalTotal.toFixed(2)}
              </div>
            </div>
          </div>

          </div> {/* End Scrollable Form Body */}

          {/* Sticky Footer Action Bar (Always Visible at Bottom of Modal) */}
          <div className="px-6 py-3.5 border-t border-slate-200 bg-white/95 backdrop-blur shrink-0 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500 font-medium">Total:</span>
              <span className="text-base font-mono font-extrabold text-slate-900">
                {dealer.currency}{finalTotal.toFixed(2)}
              </span>
              {isEligibleForFreeWash && (
                <span className="bg-amber-100 text-amber-900 border border-amber-300 font-bold text-[10px] px-2 py-0.5 rounded-full uppercase">
                  100% Free
                </span>
              )}
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition active:scale-95 disabled:opacity-50"
              >
                {loading ? 'Checking in...' : 'Confirm Intake & Generate Ticket'}
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
}
