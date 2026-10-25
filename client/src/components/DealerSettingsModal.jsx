import React, { useState } from 'react';
import { 
  Building2, 
  Flame, 
  MessageSquare, 
  Save, 
  CheckCircle2, 
  DollarSign, 
  Plus, 
  Trash2, 
  Pencil, 
  Sparkles, 
  Layers, 
  Wrench, 
  Clock, 
  Check, 
  X, 
  Tag, 
  Globe, 
  Info,
  Car
} from 'lucide-react';
import { CURRENCY_OPTIONS, detectCurrency } from '../utils/currency';
import { api } from '../api';

const DEFAULT_BAYS = [
  "Bay #1 - Foam Cannon & High Pressure",
  "Bay #2 - Touchless Hydro Express",
  "Bay #3 - Ceramic & Detailing Bay",
  "Bay #4 - Interior Vacuum & Shampoo"
];

const DEFAULT_TECHNICIANS = [
  "Carlos R.",
  "David K.",
  "Alex P.",
  "Elena V."
];

export default function DealerSettingsModal({ 
  dealer, 
  onUpdateDealer, 
  services = [], 
  onRefreshServices 
}) {
  const [activeTab, setActiveTab] = useState('dealership'); // 'dealership' | 'packages' | 'addons' | 'bays' | 'loyalty'

  // Dealership info state
  const [name, setName] = useState(dealer?.name || '');
  const [phone, setPhone] = useState(dealer?.phone || '');
  const [email, setEmail] = useState(dealer?.email || '');
  const [address, setAddress] = useState(dealer?.address || '');
  const [city, setCity] = useState(dealer?.city || '');
  const [currency, setCurrency] = useState(dealer?.currency || '$');
  const [hasPromo, setHasPromo] = useState(Boolean(dealer?.has_fourth_wash_promo));
  const [promoTitle, setPromoTitle] = useState(dealer?.promo_title || '4th Wash Free Loyalty Pass');
  const [promoDesc, setPromoDesc] = useState(dealer?.promo_description || 'Subscribed members with 2 or more registered vehicles receive every 4th wash 100% FREE!');
  
  // Bays & Technicians state
  const [bays, setBays] = useState(dealer?.bays && dealer.bays.length > 0 ? dealer.bays : DEFAULT_BAYS);
  const [technicians, setTechnicians] = useState(dealer?.technicians && dealer.technicians.length > 0 ? dealer.technicians : DEFAULT_TECHNICIANS);
  const [newBayInput, setNewBayInput] = useState('');
  const [newTechInput, setNewTechInput] = useState('');

  // Service Edit / Create Modal state
  const [editingService, setEditingService] = useState(null); // null or service object or { isNew: true, category: 'Package' | 'Addon' }
  const [svcName, setSvcName] = useState('');
  const [svcDesc, setSvcDesc] = useState('');
  const [svcPrice, setSvcPrice] = useState('');
  const [svcDuration, setSvcDuration] = useState('30');
  const [svcCategory, setSvcCategory] = useState('Package');
  const [serviceActionLoading, setServiceActionLoading] = useState(false);

  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState('');

  const packageServices = services.filter(s => s.category === 'Package' || !s.category);
  const addonServices = services.filter(s => s.category === 'Addon');

  // Save Dealership, Currency & Operations config
  const handleSaveGeneral = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    setSavedSuccess('');

    try {
      await onUpdateDealer(dealer.id, {
        name,
        phone,
        email,
        address,
        city,
        currency,
        bays,
        technicians,
        has_fourth_wash_promo: hasPromo ? 1 : 0,
        promo_title: promoTitle,
        promo_description: promoDesc
      });
      setSavedSuccess('Dealership configuration & operations saved successfully!');
      setTimeout(() => setSavedSuccess(''), 4000);
    } catch (err) {
      alert(`Failed to save settings: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Bays management
  const handleAddBay = () => {
    if (!newBayInput.trim()) return;
    const updated = [...bays, newBayInput.trim()];
    setBays(updated);
    setNewBayInput('');
  };

  const handleRemoveBay = (idx) => {
    if (bays.length <= 1) {
      alert('You must have at least one wash bay configured.');
      return;
    }
    const updated = bays.filter((_, i) => i !== idx);
    setBays(updated);
  };

  // Technicians management
  const handleAddTechnician = () => {
    if (!newTechInput.trim()) return;
    const updated = [...technicians, newTechInput.trim()];
    setTechnicians(updated);
    setNewTechInput('');
  };

  const handleRemoveTechnician = (idx) => {
    if (technicians.length <= 1) {
      alert('You must have at least one technician configured.');
      return;
    }
    const updated = technicians.filter((_, i) => i !== idx);
    setTechnicians(updated);
  };

  // Open Service Create / Edit
  const openNewServiceModal = (category = 'Package') => {
    setEditingService({ isNew: true, category });
    setSvcName('');
    setSvcDesc('');
    setSvcPrice(category === 'Package' ? '25.00' : '15.00');
    setSvcDuration(category === 'Package' ? '30' : '15');
    setSvcCategory(category);
  };

  const openEditServiceModal = (service) => {
    setEditingService(service);
    setSvcName(service.name || '');
    setSvcDesc(service.description || '');
    setSvcPrice(String(service.base_price || ''));
    setSvcDuration(String(service.duration_mins || 30));
    setSvcCategory(service.category || 'Package');
  };

  const handleSaveService = async (e) => {
    e.preventDefault();
    if (!svcName.trim() || !svcPrice) {
      alert('Service name and price are required');
      return;
    }

    setServiceActionLoading(true);
    try {
      if (editingService.isNew) {
        await api.createService(dealer.id, {
          name: svcName.trim(),
          description: svcDesc.trim(),
          base_price: parseFloat(svcPrice) || 0,
          duration_mins: parseInt(svcDuration, 10) || 30,
          category: svcCategory
        });
      } else {
        await api.updateService(dealer.id, editingService.id, {
          name: svcName.trim(),
          description: svcDesc.trim(),
          base_price: parseFloat(svcPrice) || 0,
          duration_mins: parseInt(svcDuration, 10) || 30,
          category: svcCategory
        });
      }

      if (onRefreshServices) {
        await onRefreshServices();
      }
      setEditingService(null);
    } catch (err) {
      alert(`Error saving service: ${err.message}`);
    } finally {
      setServiceActionLoading(false);
    }
  };

  const handleDeleteService = async (serviceId, serviceName) => {
    if (!window.confirm(`Are you sure you want to delete "${serviceName}"?`)) {
      return;
    }
    try {
      await api.deleteService(dealer.id, serviceId);
      if (onRefreshServices) {
        await onRefreshServices();
      }
    } catch (err) {
      alert(`Failed to delete service: ${err.message}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">Facility Operations & Pricing Manager</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200 uppercase tracking-wider">
              {dealer.name}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Customize wash packages, prices, add-on treatments, bays, technicians, and international country currency.
          </p>
        </div>
        
        <button
          onClick={handleSaveGeneral}
          disabled={saving}
          className="px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition flex items-center gap-2 self-start sm:self-auto disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving Changes...' : 'Save All Settings'}</span>
        </button>
      </div>

      {savedSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 shadow-xs animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{savedSuccess}</span>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-200/60 rounded-xl overflow-x-auto text-xs font-semibold">
        <button
          onClick={() => setActiveTab('dealership')}
          className={`px-3.5 py-2 rounded-lg transition shrink-0 flex items-center gap-1.5 ${
            activeTab === 'dealership'
              ? 'bg-white text-slate-900 shadow-xs font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Building2 className="w-3.5 h-3.5 text-blue-600" />
          <span>Dealership & Currency</span>
        </button>

        <button
          onClick={() => setActiveTab('packages')}
          className={`px-3.5 py-2 rounded-lg transition shrink-0 flex items-center gap-1.5 ${
            activeTab === 'packages'
              ? 'bg-white text-slate-900 shadow-xs font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          <span>Wash Packages ({packageServices.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('addons')}
          className={`px-3.5 py-2 rounded-lg transition shrink-0 flex items-center gap-1.5 ${
            activeTab === 'addons'
              ? 'bg-white text-slate-900 shadow-xs font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Tag className="w-3.5 h-3.5 text-indigo-600" />
          <span>Add-On Treatments ({addonServices.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('bays')}
          className={`px-3.5 py-2 rounded-lg transition shrink-0 flex items-center gap-1.5 ${
            activeTab === 'bays'
              ? 'bg-white text-slate-900 shadow-xs font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Wrench className="w-3.5 h-3.5 text-amber-600" />
          <span>Bays & Staff ({bays.length} Bays)</span>
        </button>

        <button
          onClick={() => setActiveTab('loyalty')}
          className={`px-3.5 py-2 rounded-lg transition shrink-0 flex items-center gap-1.5 ${
            activeTab === 'loyalty'
              ? 'bg-white text-slate-900 shadow-xs font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Flame className="w-3.5 h-3.5 text-amber-500" />
          <span>4th Wash Free Loyalty</span>
        </button>
      </div>

      {/* ================= TAB 1: DEALERSHIP & CURRENCY ================= */}
      {activeTab === 'dealership' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6 shadow-xs">
          
          {/* Currency Configuration (USER REQUEST #2) */}
          <div className="p-5 rounded-2xl bg-blue-50/70 border border-blue-200 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Globe className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-slate-900">
                  Dealership Currency & International Country Adaptation
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  Choose your dealership's default currency symbol. Our engine also includes <strong>automatic country intelligence</strong>: when a customer phone begins with <strong>+91 (India)</strong>, all their invoices, receipts, and intake tickets automatically calculate and display in <strong>₹ (Rupees)</strong>!
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="text-xs font-semibold text-slate-800 block mb-1">
                  Dealership Default Currency
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-600"
                >
                  {CURRENCY_OPTIONS.map(opt => (
                    <option key={opt.code} value={opt.symbol}>
                      {opt.label}
                    </option>
                  ))}
                  <option value="$">$ (USD - United States)</option>
                  <option value="₹">₹ (INR - India)</option>
                </select>
              </div>

              <div className="p-3 bg-white rounded-xl border border-blue-200 text-xs text-slate-700 flex flex-col justify-center">
                <div className="font-bold text-slate-900 flex items-center gap-1.5 mb-1">
                  <span>🇮🇳 Live +91 Rule Active</span>
                </div>
                <div className="text-[11px] text-slate-500">
                  Customers with <strong>+91</strong> phone numbers will always see <strong>₹ (Rupees)</strong>. Other customers default to <strong>{currency}</strong>.
                </div>
              </div>
            </div>
          </div>

          {/* Dealership Info */}
          <div className="space-y-4">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Dealership Profile Details
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Car Wash Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Contact Phone</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Contact Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-slate-700 block mb-1">Street Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">City, State / Region</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-200">
            <button
              onClick={handleSaveGeneral}
              disabled={saving}
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Profile & Currency'}</span>
            </button>
          </div>

        </div>
      )}

      {/* ================= TAB 2: WASH PACKAGES & PRICING ================= */}
      {activeTab === 'packages' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Custom Wash Packages & Pricing</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Define the primary vehicle wash packages offered to incoming customers with custom pricing.
              </p>
            </div>
            <button
              onClick={() => openNewServiceModal('Package')}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Wash Package</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {packageServices.map(pkg => (
              <div 
                key={pkg.id}
                className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col justify-between hover:border-slate-300 transition"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="font-bold text-slate-900 text-sm">{pkg.name}</span>
                    <span className="font-mono font-extrabold text-blue-600 text-sm">
                      {currency}{Number(pkg.base_price).toFixed(2)}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 leading-relaxed mb-3 line-clamp-3">
                    {pkg.description || 'Full vehicle treatment and bay rinse.'}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-400 flex items-center gap-1 text-[11px]">
                    <Clock className="w-3.5 h-3.5" />
                    <span>~{pkg.duration_mins || 30} mins</span>
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => openEditServiceModal(pkg)}
                      className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition"
                      title="Edit package & price"
                    >
                      <Pencil className="w-3.5 h-3.5 text-blue-600" />
                    </button>
                    <button
                      onClick={() => handleDeleteService(pkg.id, pkg.name)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                      title="Delete package"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= TAB 3: ADD-ON TREATMENTS ================= */}
      {activeTab === 'addons' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Add-On Treatments & Pricing</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Offer optional protective coatings, waxes, and sanitization upsells that customers can add to any package.
              </p>
            </div>
            <button
              onClick={() => openNewServiceModal('Addon')}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Treatment</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {addonServices.map(addon => (
              <div 
                key={addon.id}
                className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col justify-between hover:border-slate-300 transition"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <span className="font-bold text-slate-900 text-sm">{addon.name}</span>
                    <span className="font-mono font-bold text-indigo-600 text-xs">
                      +{currency}{Number(addon.base_price).toFixed(2)}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 leading-relaxed mb-3 line-clamp-2">
                    {addon.description || 'Special vehicle add-on treatment.'}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-400 text-[11px] flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>~{addon.duration_mins || 15} mins</span>
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => openEditServiceModal(addon)}
                      className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition"
                      title="Edit treatment & price"
                    >
                      <Pencil className="w-3.5 h-3.5 text-indigo-600" />
                    </button>
                    <button
                      onClick={() => handleDeleteService(addon.id, addon.name)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                      title="Delete treatment"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= TAB 4: BAYS & TECHNICIANS ================= */}
      {activeTab === 'bays' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Wash Bays Manager */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Wrench className="w-4 h-4 text-amber-600" />
                <span>Wash Bays Configuration</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Add, label, or customize active wash lanes and detailing bays.
              </p>
            </div>

            {/* Add bay input */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. Bay #5 - Hand Polish & Wax Lane"
                value={newBayInput}
                onChange={(e) => setNewBayInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddBay())}
                className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-600"
              />
              <button
                type="button"
                onClick={handleAddBay}
                className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold transition"
              >
                + Add
              </button>
            </div>

            {/* List of Bays */}
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {bays.map((bay, idx) => (
                <div 
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <span className="font-semibold text-slate-800">{bay}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveBay(idx)}
                    className="p-1 rounded-lg text-slate-400 hover:text-rose-600 transition"
                    title="Remove bay"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={handleSaveGeneral}
              disabled={saving}
              className="w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition"
            >
              {saving ? 'Saving...' : 'Save Bays'}
            </button>
          </div>

          {/* Assigned Technicians Manager */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Car className="w-4 h-4 text-blue-600" />
                <span>Technicians & Detailers</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage staff names that appear during intake and live bay assignment.
              </p>
            </div>

            {/* Add technician input */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. Rahul M. or Suresh K."
                value={newTechInput}
                onChange={(e) => setNewTechInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTechnician())}
                className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-600"
              />
              <button
                type="button"
                onClick={handleAddTechnician}
                className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition"
              >
                + Add
              </button>
            </div>

            {/* List of Technicians */}
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {technicians.map((tech, idx) => (
                <div 
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <span className="font-semibold text-slate-800">{tech}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveTechnician(idx)}
                    className="p-1 rounded-lg text-slate-400 hover:text-rose-600 transition"
                    title="Remove technician"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={handleSaveGeneral}
              disabled={saving}
              className="w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition"
            >
              {saving ? 'Saving...' : 'Save Technicians'}
            </button>
          </div>

        </div>
      )}

      {/* ================= TAB 5: 4TH WASH FREE LOYALTY ================= */}
      {activeTab === 'loyalty' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6 shadow-xs">
          
          <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-2.5">
                <Flame className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Special Loyalty Rule: 4th Wash Free (2+ Vehicles)
                  </h3>
                  <p className="text-xs text-slate-600 mt-1">
                    Enables the custom perk where <strong>Subscribed Customers who add 2 or more vehicles</strong> receive their <strong>4th wash completely FREE</strong>.
                  </p>
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
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
              </label>
            </div>

            {hasPromo && (
              <div className="space-y-3 pt-3 border-t border-amber-200">
                <div>
                  <label className="text-xs font-semibold text-slate-800 block mb-1">Promo Display Title</label>
                  <input
                    type="text"
                    value={promoTitle}
                    onChange={(e) => setPromoTitle(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-800 block mb-1">Customer Terms & Description</label>
                  <textarea
                    rows={2}
                    value={promoDesc}
                    onChange={(e) => setPromoDesc(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 resize-none focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-200">
            <button
              onClick={handleSaveGeneral}
              disabled={saving}
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Loyalty Settings'}</span>
            </button>
          </div>

        </div>
      )}

      {/* ================= MODAL: ADD / EDIT SERVICE & PRICE ================= */}
      {editingService && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  {editingService.isNew ? `Add New ${svcCategory}` : `Edit ${editingService.name}`}
                </h3>
              </div>
              <button
                onClick={() => setEditingService(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveService} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Service / Package Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Express Exterior Wash or Hand Wax Treatment"
                  value={svcName}
                  onChange={(e) => setSvcName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Price ({currency})
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-xs font-bold text-slate-500">{currency}</span>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="25.00"
                      value={svcPrice}
                      onChange={(e) => setSvcPrice(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-7 pr-3 py-2 text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Est. Duration (Mins)</label>
                  <input
                    type="number"
                    min="5"
                    step="5"
                    value={svcDuration}
                    onChange={(e) => setSvcDuration(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Category Type</label>
                <select
                  value={svcCategory}
                  onChange={(e) => setSvcCategory(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600"
                >
                  <option value="Package">Primary Wash Package</option>
                  <option value="Addon">Add-On Upsell Treatment</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Details of what is included in this treatment..."
                  value={svcDesc}
                  onChange={(e) => setSvcDesc(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 resize-none focus:bg-white focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingService(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={serviceActionLoading}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>{serviceActionLoading ? 'Saving...' : 'Save & Publish Price'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
