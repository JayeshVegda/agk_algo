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
        // Try direct password, and if 'root', try 'root1234' fallback
        try {
          const authData = await pb.collection('users').authWithPassword(email, password);
          onAuthSuccess(authData.record);
        } catch (initialErr) {
          if (password === 'root') {
            const authData = await pb.collection('users').authWithPassword(email, 'root1234');
            onAuthSuccess(authData.record);
          } else {
            throw initialErr;
          }
        }
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Authentication error. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-white p-1 rounded cursor-pointer"
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
          <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-400 mb-4 font-mono">
            ⚠ {error}
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
              className="flex items-center justify-between p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
            >
              <span className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-amber-400" />
                <span>👑 Jayesh Vegda <span className="text-[11px] font-normal text-amber-400/80">(Admin Role)</span></span>
              </span>
              <span className="text-[10px] font-mono text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded">1-Click Login →</span>
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={() => handleQuickLogin('user@akgalgo.local', 'root1234')}
              className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
            >
              <span className="flex items-center gap-2">
                <User className="h-4 w-4 text-emerald-400" />
                <span>📈 Alex Trader <span className="text-[11px] font-normal text-emerald-400/80">(Perfect Plan)</span></span>
              </span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded">1-Click Login →</span>
            </button>
          </div>
        </div>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border/50"></div></div>
          <div className="relative flex justify-center text-[10px] uppercase font-mono"><span className="bg-card px-2 text-slate-500">Or Manual Credentials</span></div>
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
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-white placeholder:text-slate-600"
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
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-white placeholder:text-slate-600"
              placeholder="trader@example.com"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-slate-400">Password</label>
              <span className="text-[10px] text-slate-500">Demo password is: root1234</span>
            </div>
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
            {loading ? 'Authenticating...' : isRegister ? 'Create Account' : 'Sign In to Terminal'}
          </button>
        </form>

        <div className="text-center text-xs text-slate-400 pt-4 border-t border-border/40 mt-4 font-mono">
          {isRegister ? (
            <span>
              Already a member?{' '}
              <button
                type="button"
                onClick={() => setIsRegister(false)}
                className="text-blue-400 hover:underline font-bold cursor-pointer"
              >
                Sign In
              </button>
            </span>
          ) : (
            <span>
              New trader?{' '}
              <button
                type="button"
                onClick={() => setIsRegister(true)}
                className="text-blue-400 hover:underline font-bold cursor-pointer"
              >
                Create Account
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
