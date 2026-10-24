import React, { useState } from 'react';
import { pb } from '../lib/pocketbase';
import { Zap, X, Shield, User, Lock, Mail, CheckCircle } from 'lucide-react';

export function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleQuickLogin = async (loginEmail, loginPass) => {
    setError(null);
    setLoading(true);
    try {
      const authData = await pb.collection('users').authWithPassword(loginEmail, loginPass);
      onAuthSuccess(authData.record);
      onClose();
    } catch (err) {
      setError(err.message || 'Quick login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (isRegister) {
        await pb.collection('users').create({
          email,
          password,
          passwordConfirm: password,
          name: name || email.split('@')[0],
          role: 'user',
          plan: 'NONE',
          verified: true
        });
        const authData = await pb.collection('users').authWithPassword(email, password);
        onAuthSuccess(authData.record);
      } else {
        const authData = await pb.collection('users').authWithPassword(email, password);
        onAuthSuccess(authData.record);
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Authentication error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="space-y-1 mb-5">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-blue-400 border border-blue-500/20">
            <Zap className="h-3 w-3" /> Terminal Authentication
          </div>
          <h2 className="text-xl font-bold text-white pt-1">
            {isRegister ? 'Create Trader Account' : 'Sign In to Terminal'}
          </h2>
          <p className="text-xs text-slate-400">
            {isRegister
              ? 'Instant access to institutional signals & bot downloads'
              : 'Sign in to access your live algorithmic feeds'}
          </p>
        </div>

        {error && (
          <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-400 mb-4">
            {error}
          </div>
        )}

        {/* 1-Click Access Area */}
        <div className="mb-5 p-3.5 rounded-xl border border-border/80 bg-background/80 space-y-2">
          <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
            ⚡ One-Click Instant Access
          </div>
          <div className="grid gap-2">
            <button
              type="button"
              disabled={loading}
              onClick={() => handleQuickLogin('jayeshvegda@gmail.com', 'root1234')}
              className="flex items-center justify-between p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 text-xs font-semibold transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Shield className="h-3.5 w-3.5 text-amber-400" />
                Jayesh Vegda (Admin Role)
              </span>
              <span className="text-[10px] font-mono text-amber-400">1-Click Login →</span>
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={() => handleQuickLogin('user@akgalgo.local', 'root1234')}
              className="flex items-center justify-between p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20 text-xs font-semibold transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <User className="h-3.5 w-3.5 text-emerald-400" />
                Alex Trader (Demo Member)
              </span>
              <span className="text-[10px] font-mono text-emerald-400">1-Click Login →</span>
            </button>
          </div>
        </div>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border/50"></div></div>
          <div className="relative flex justify-center text-[10px] uppercase font-mono"><span className="bg-card px-2 text-slate-500">Or Email Credentials</span></div>
        </div>

        {/* Manual Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs font-mono">
          {isRegister && (
            <div>
              <label className="block text-slate-400 mb-1">Trader Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-white"
                placeholder="Jayesh V."
              />
            </div>
          )}

          <div>
            <label className="block text-slate-400 mb-1">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-white"
              placeholder="trader@example.com"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-white"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow transition-all cursor-pointer disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : isRegister ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <div className="text-center text-xs text-slate-400 pt-4 border-t border-border/40 mt-4">
          {isRegister ? (
            <span>
              Already a member?{' '}
              <button
                onClick={() => setIsRegister(false)}
                className="text-blue-400 font-semibold hover:underline"
              >
                Sign In
              </button>
            </span>
          ) : (
            <span>
              New trader?{' '}
              <button
                onClick={() => setIsRegister(true)}
                className="text-blue-400 font-semibold hover:underline"
              >
                Register free account
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
