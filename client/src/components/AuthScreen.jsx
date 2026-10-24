import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  Building2, 
  User, 
  Phone, 
  MapPin, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle,
  Eye,
  EyeOff,
  Car,
  Sparkles,
  Zap
} from 'lucide-react';

export default function AuthScreen({ onLoginSuccess }) {
  const [tab, setTab] = useState('login'); // 'login' | 'register'
  
  // Login Form (Starts clean/unfilled for security)
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  
  // Register Form
  const [regName, setRegName] = useState('');
  const [regCarwash, setRegCarwash] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regPhone, setRegPhone] = useState('');
  const [regCity, setRegCity] = useState('');
  const [regHasPromo, setRegHasPromo] = useState(true);

  // Demo Sandbox Switcher
  const [showDemoProfiles, setShowDemoProfiles] = useState(false);

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
        body: JSON.stringify({ email: loginEmail.trim(), password: loginPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Authentication failed. Please verify your credentials.');
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
          name: regName.trim(),
          carwash_name: regCarwash.trim(),
          email: regEmail.trim(),
          password: regPassword,
          phone: regPhone.trim(),
          city: regCity.trim(),
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

  const loadDemoAccount = (email, pwd) => {
    setLoginEmail(email);
    setLoginPassword(pwd);
    setError('');
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] flex flex-col justify-center items-center p-4 sm:p-6 font-sans relative">
      
      {/* Background Subtle Gradient Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293710_1px,transparent_1px),linear-gradient(to_bottom,#1f293710_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-md z-10 space-y-6">
        
        {/* Brand Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20 mb-3">
            <Car className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center justify-center gap-2">
            <span>WashFlow</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 font-mono font-medium border border-blue-500/20">
              PRO
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Enterprise Car Wash Operations & Automated POS Platform
          </p>
        </div>

        {/* Card */}
        <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6 sm:p-7 shadow-xl">
          
          {/* Navigation Tabs: Login vs Register */}
          <div className="grid grid-cols-2 p-1 bg-slate-900 rounded-xl mb-5 border border-slate-800/80 text-xs font-semibold">
            <button
              type="button"
              onClick={() => { setTab('login'); setError(''); }}
              className={`py-2 rounded-lg transition ${
                tab === 'login' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Owner Sign In
            </button>
            <button
              type="button"
              onClick={() => { setTab('register'); setError(''); }}
              className={`py-2 rounded-lg transition ${
                tab === 'register' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Register Facility
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
                <label className="text-xs font-medium text-slate-300 block mb-1.5">
                  Business Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="name@dealership.com"
                    className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-slate-300">
                    Password
                  </label>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl pl-9 pr-10 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200 transition"
                    title={showLoginPassword ? 'Mask password' : 'Show password'}
                  >
                    {showLoginPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/20 transition flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50"
              >
                <span>{loading ? 'Authenticating...' : 'Sign In to Operations Console'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Demo Sandbox Quick-Load (Collapsible for Clean Live Production) */}
              <div className="pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowDemoProfiles(!showDemoProfiles)}
                  className="w-full py-1 text-[11px] text-slate-400 hover:text-slate-200 flex items-center justify-between font-medium transition"
                >
                  <span className="flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span>Quick-Load Demo Test Profiles</span>
                  </span>
                  <span className="text-[10px] text-blue-400 font-semibold">
                    {showDemoProfiles ? 'Hide Profiles' : 'Preview'}
                  </span>
                </button>

                {showDemoProfiles && (
                  <div className="mt-2.5 space-y-1.5">
                    <button
                      type="button"
                      onClick={() => loadDemoAccount('sparkle@carwash.com', 'Password123!')}
                      className="w-full p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800/80 border border-slate-800 text-left text-xs transition flex items-center justify-between group"
                    >
                      <div>
                        <div className="font-semibold text-slate-200 group-hover:text-blue-400 transition">
                          SparkleWash Pro Hub
                        </div>
                        <div className="text-[10px] text-slate-400">Alex Parker • sparkle@carwash.com</div>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 font-medium border border-blue-500/20">
                        Fill Demo
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => loadDemoAccount('apex@carwash.com', 'Password123!')}
                      className="w-full p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800/80 border border-slate-800 text-left text-xs transition flex items-center justify-between group"
                    >
                      <div>
                        <div className="font-semibold text-slate-200 group-hover:text-blue-400 transition">
                          Apex Executive Auto Spa
                        </div>
                        <div className="text-[10px] text-slate-400">Elena Vance • apex@carwash.com</div>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 font-medium border border-blue-500/20">
                        Fill Demo
                      </span>
                    </button>
                  </div>
                )}
              </div>
            </form>
          ) : (
            /* REGISTER FORM */
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Owner Name</label>
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Car Wash Name</label>
                  <input
                    type="text"
                    required
                    value={regCarwash}
                    onChange={(e) => setRegCarwash(e.target.value)}
                    placeholder="e.g. Metro Express Wash"
                    className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Work Email</label>
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="owner@wash.com"
                    className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Password</label>
                  <div className="relative">
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      required
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl pl-3 pr-8 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-200 transition"
                    >
                      {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">WhatsApp Business Phone</label>
                  <input
                    type="text"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="+1 (555) 123-4567"
                    className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">City / Region</label>
                  <input
                    type="text"
                    value={regCity}
                    onChange={(e) => setRegCity(e.target.value)}
                    placeholder="Dallas, TX"
                    className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Loyalty Promotion Option */}
              <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={regHasPromo}
                    onChange={(e) => setRegHasPromo(e.target.checked)}
                    className="mt-0.5 rounded border-slate-700 text-blue-600 focus:ring-0"
                  />
                  <div>
                    <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                      <span>Enable 4th Wash Free Loyalty Engine</span>
                    </span>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                      Subscribed customers who enroll 2 or more vehicles unlock every 4th wash 100% free.
                    </p>
                  </div>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/20 transition flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50"
              >
                <span>{loading ? 'Creating Account...' : 'Complete Setup & Launch Dashboard'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

        </div>

        {/* Security / Enterprise Trust Footer */}
        <div className="flex items-center justify-center gap-4 text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>256-Bit TLS Encryption</span>
          </div>
          <span>•</span>
          <div>Real-Time WebSockets</div>
          <span>•</span>
          <div>Multi-Bay Architecture</div>
        </div>

      </div>
    </div>
  );
}
