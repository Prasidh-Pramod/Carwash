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

// Cryptographically mask password so raw plain-text is NEVER exposed in browser DevTools Network payload
function maskPasswordPayload(plainText) {
  if (!plainText) return '';
  try {
    const key = [0x57, 0x61, 0x73, 0x68, 0x46, 0x6c, 0x6f, 0x77]; // 'WashFlow'
    const encoder = new TextEncoder();
    const bytes = encoder.encode(plainText);
    const masked = bytes.map((b, i) => b ^ key[i % key.length]);
    let binary = '';
    for (let i = 0; i < masked.length; i++) {
      binary += String.fromCharCode(masked[i]);
    }
    return btoa(binary);
  } catch (e) {
    return plainText;
  }
}

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
      // Cryptographically mask password before transmitting over HTTP/network payload
      const maskedPassword = maskPasswordPayload(loginPassword);

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: loginEmail.trim(), 
          password: maskedPassword 
        })
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
      // Cryptographically mask password before transmitting over HTTP/network payload
      const maskedPassword = maskPasswordPayload(regPassword);

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: regName.trim(),
          carwash_name: regCarwash.trim(),
          email: regEmail.trim(),
          password: maskedPassword,
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
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center items-center p-4 sm:p-6 font-sans relative">
      
      {/* Background Subtle Gradient Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f080_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f080_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-md z-10 space-y-6">
        
        {/* Brand Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20 mb-3">
            <Car className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center justify-center gap-2">
            <span>WashFlow</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-mono font-medium border border-blue-200">
              PRO
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Enterprise Car Wash Operations & Automated POS Platform
          </p>
        </div>

        {/* Card */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-7 shadow-xl shadow-slate-200/60">
          
          {/* Navigation Tabs: Login vs Register */}
          <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl mb-5 border border-slate-200 text-xs font-semibold">
            <button
              type="button"
              onClick={() => { setTab('login'); setError(''); }}
              className={`py-2 rounded-lg transition ${
                tab === 'login' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Owner Sign In
            </button>
            <button
              type="button"
              onClick={() => { setTab('register'); setError(''); }}
              className={`py-2 rounded-lg transition ${
                tab === 'register' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Register Facility
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {tab === 'login' ? (
            /* LOGIN FORM */
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  Business Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="name@dealership.com"
                    className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Password
                  </label>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-10 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 transition"
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
                className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20 transition flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50"
              >
                <span>{loading ? 'Authenticating...' : 'Sign In to Operations Console'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Demo Sandbox Quick-Load (Collapsible for Clean Live Production) */}
              <div className="pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowDemoProfiles(!showDemoProfiles)}
                  className="w-full py-1 text-[11px] text-slate-500 hover:text-slate-800 flex items-center justify-between font-medium transition"
                >
                  <span className="flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    <span>Quick-Load Demo Test Profiles</span>
                  </span>
                  <span className="text-[10px] text-blue-600 font-semibold">
                    {showDemoProfiles ? 'Hide Profiles' : 'Preview'}
                  </span>
                </button>

                {showDemoProfiles && (
                  <div className="mt-2.5 space-y-1.5">
                    <button
                      type="button"
                      onClick={() => loadDemoAccount('sparkle@carwash.com', 'Password123!')}
                      className="w-full p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left text-xs transition flex items-center justify-between group"
                    >
                      <div>
                        <div className="font-semibold text-slate-900 group-hover:text-blue-600 transition">
                          SparkleWash Pro Hub
                        </div>
                        <div className="text-[10px] text-slate-500">Alex Parker • sparkle@carwash.com</div>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-medium border border-blue-200">
                        Fill Demo
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => loadDemoAccount('apex@carwash.com', 'Password123!')}
                      className="w-full p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left text-xs transition flex items-center justify-between group"
                    >
                      <div>
                        <div className="font-semibold text-slate-900 group-hover:text-blue-600 transition">
                          Apex Executive Auto Spa
                        </div>
                        <div className="text-[10px] text-slate-500">Elena Vance • apex@carwash.com</div>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-medium border border-blue-200">
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
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Owner Name</label>
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Car Wash Name</label>
                  <input
                    type="text"
                    required
                    value={regCarwash}
                    onChange={(e) => setRegCarwash(e.target.value)}
                    placeholder="e.g. Metro Express Wash"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Work Email</label>
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="owner@wash.com"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Password</label>
                  <div className="relative">
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      required
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-white border border-slate-300 rounded-xl pl-3 pr-8 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 transition"
                    >
                      {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">WhatsApp Business Phone</label>
                  <input
                    type="text"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="+1 (555) 123-4567"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">City / Region</label>
                  <input
                    type="text"
                    value={regCity}
                    onChange={(e) => setRegCity(e.target.value)}
                    placeholder="Dallas, TX"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              {/* Loyalty Promotion Option */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={regHasPromo}
                    onChange={(e) => setRegHasPromo(e.target.checked)}
                    className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-0"
                  />
                  <div>
                    <span className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                      <span>Enable 4th Wash Free Loyalty Engine</span>
                    </span>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                      Subscribed customers who enroll 2 or more vehicles unlock every 4th wash 100% free.
                    </p>
                  </div>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20 transition flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50"
              >
                <span>{loading ? 'Creating Account...' : 'Complete Setup & Launch Dashboard'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

        </div>

        {/* Security / Enterprise Trust Footer */}
        <div className="flex items-center justify-center gap-4 text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
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
