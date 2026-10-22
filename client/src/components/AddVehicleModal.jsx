import React, { useState } from 'react';
import { X, Car, Plus, AlertCircle } from 'lucide-react';

export default function AddVehicleModal({
  isOpen,
  onClose,
  customer,
  onVehicleAdded
}) {
  if (!isOpen || !customer) return null;

  const [plate, setPlate] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [color, setColor] = useState('Black');
  const [vehicleType, setVehicleType] = useState('Sedan');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!plate || !make) {
      setError('License plate and Make are required');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/customers/${customer.id}/vehicles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          license_plate: plate.toUpperCase().trim(),
          make,
          model: model || 'Standard',
          color,
          vehicle_type: vehicleType
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add vehicle');

      onVehicleAdded(data);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
        
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-800/40">
          <div className="flex items-center gap-2">
            <Car className="w-4 h-4 text-brand-400" />
            <h2 className="text-sm font-bold text-white">Add Vehicle to {customer.name}</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="m-4 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="p-3 bg-brand-500/10 border border-brand-500/20 rounded-xl text-xs text-brand-300">
            Adding a 2nd vehicle will qualify subscribed members for the <strong>every 4th wash FREE</strong> dealership loyalty perk!
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">License Plate</label>
            <input
              type="text"
              required
              placeholder="e.g. 7XYZ999"
              value={plate}
              onChange={(e) => setPlate(e.target.value.toUpperCase())}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-amber-300 font-mono font-bold uppercase focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Make</label>
              <input
                type="text"
                required
                placeholder="e.g. Toyota"
                value={make}
                onChange={(e) => setMake(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Model</label>
              <input
                type="text"
                placeholder="e.g. RAV4"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Color</label>
              <input
                type="text"
                placeholder="e.g. Silver"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Vehicle Type</label>
              <select
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
              >
                <option value="Sedan">Sedan</option>
                <option value="SUV">SUV / Crossover</option>
                <option value="Truck">Truck / Pickup</option>
                <option value="Hatchback">Hatchback</option>
                <option value="Coupe">Coupe / Sport</option>
                <option value="Van">Van / Minivan</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-brand-500 hover:bg-brand-600 text-white transition active:scale-95 disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Save Vehicle'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
