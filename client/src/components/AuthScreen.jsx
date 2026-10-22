import React, { useState } from 'react';
import { 
  Sparkles, 
  Lock, 
  Mail, 
  Building2, 
  User, 
  Phone, 
  MapPin, 
  Flame, 
  ArrowRight, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';

export default function AuthScreen({ onLoginSuccess }) {
  const [tab, setTab] = useState('login'); // 'login' | 'register'
  
  // Login Form
  const [loginEmail, setLoginEmail] = useState('sparkle@carwash.com');
  const [loginPassword, setLoginPassword] = useState('Password123!');
  
  // Register Form
  const [regName, setRegName] = useState('');
  const [regCarwash, setRegCarwash] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regCity, setRegCity] = useState('');
  const [regHasPromo, setRegHasPromo] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      onLoginSuccess(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: regName,
          carwash_name: regCarwash,
          email: regEmail,
          password: regPassword,
          phone: regPhone,
          city: regCity,
          has_fourth_wash_promo: regHasPromo
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');
      onLoginSuccess(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const quickLoginAs = (email, password) => {
    setLoginEmail(email);
    setLoginPassword(password);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans">
      
      {/* Background Glow Orbs */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-lg z-10">
        
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600 via-brand-500 to-cyan-400 text-white shadow-xl shadow-brand-500/20 mb-3">
            <Sparkles className="w-7 h-7 animate-pulse" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            WashFlow <span className="text-brand-400">Owner Portal</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Private Car Wash Operations, Live Bay Tracking & WhatsApp Dispatch
          </p>
        </div>

        {/* Card */}
        <div className="bg-slate-900/90 backdrop-blur border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
          
          {/* Navigation Tabs: Login vs Register */}
          <div className="grid grid-cols-2 p-1 bg-slate-950 rounded-xl mb-6 border border-slate-800 text-xs font-bold">
            <button
              onClick={() => { setTab('login'); setError(''); }}
              className={`py-2 rounded-lg transition ${
                tab === 'login' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Car Wash Owner Login
            </button>
            <button
              onClick={() => { setTab('register'); setError(''); }}
              className={`py-2 rounded-lg transition ${
                tab === 'register' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Register New Car Wash
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {tab === 'login' ? (
            /* LOGIN FORM */
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Owner Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="owner@yourcarwash.com"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-gradient-to-r from-brand-500 to-cyan-500 hover:from-brand-600 hover:to-cyan-600 text-white shadow-lg shadow-brand-500/25 transition flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
              >
                <span>{loading ? 'Authenticating...' : 'Sign In to My Car Wash'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* One-Click Demo Logins */}
              <div className="pt-4 border-t border-slate-800">
                <div className="text-[11px] font-semibold text-slate-400 mb-2">
                  ⚡ One-Click Demo Owner Accounts:
                </div>
                <div className="space-y-1.5">
                  <button
                    type="button"
                    onClick={() => quickLoginAs('sparkle@carwash.com', 'Password123!')}
                    className="w-full p-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-left text-xs transition flex items-center justify-between"
                  >
                    <div>
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <span>SparkleWash Pro Hub</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          4th Wash Free Active
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400">Alex Parker • sparkle@carwash.com</div>
                    </div>
                    <span className="text-[10px] text-brand-400 font-bold">Select</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => quickLoginAs('apex@carwash.com', 'Password123!')}
                    className="w-full p-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-left text-xs transition flex items-center justify-between"
                  >
                    <div>
                      <div className="font-bold text-white">Apex Executive Auto Spa</div>
                      <div className="text-[10px] text-slate-400">Elena Vance • apex@carwash.com</div>
                    </div>
                    <span className="text-[10px] text-brand-400 font-bold">Select</span>
                  </button>
                </div>
              </div>
            </form>
          ) : (
            /* REGISTER FORM */
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Your Name</label>
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Car Wash Name</label>
                  <input
                    type="text"
                    required
                    value={regCarwash}
                    onChange={(e) => setRegCarwash(e.target.value)}
                    placeholder="e.g. Crystal Foam Wash"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="owner@crystalwash.com"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Password</label>
                  <input
                    type="password"
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">WhatsApp Business Phone</label>
                  <input
                    type="text"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="+1 (555) 123-4567"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">City / Location</label>
                  <input
                    type="text"
                    value={regCity}
                    onChange={(e) => setRegCity(e.target.value)}
                    placeholder="Dallas, TX"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              {/* Extra Feature Promo Option */}
              <div className="p-3 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-xl">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={regHasPromo}
                    onChange={(e) => setRegHasPromo(e.target.checked)}
                    className="mt-0.5 rounded border-amber-600 text-amber-500 focus:ring-0"
                  />
                  <div>
                    <span className="text-xs font-bold text-amber-300 flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5" /> Enable 4th Wash Free for 2+ Vehicles
                    </span>
                    <p className="text-[11px] text-slate-300 mt-0.5">
                      Subscribed customers who enroll 2 or more cars receive every 4th wash 100% free.
                    </p>
                  </div>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-gradient-to-r from-brand-500 to-cyan-500 hover:from-brand-600 hover:to-cyan-600 text-white shadow-lg shadow-brand-500/25 transition flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
              >
                <span>{loading ? 'Creating Car Wash...' : 'Complete Registration & Open Dashboard'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

        </div>

      </div>
    </div>
  );
}
