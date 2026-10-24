import React, { useState } from 'react';
import { pb } from '../lib/pocketbase';
import { Zap, X, Shield, User, Lock, Mail, CheckCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <Card className="w-full max-w-md shadow-2xl relative bg-[#10141B] border-white/10 text-[#E7E9EF]">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-[#A6ADB9] hover:text-white p-1 rounded cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        <CardHeader className="space-y-2 pb-4 text-center items-center">
          <img 
            src="/assets/logos/akg-algo-symbol-transparent.png" 
            alt="AKG ALGO" 
            className="h-12 w-auto mx-auto object-contain mb-1"
          />
          <div className="flex justify-center">
            <Badge variant="gold" className="gap-1.5 py-0.5 px-2.5 text-[11px]">
              <Zap className="h-3 w-3" />
              <span>Terminal Authentication</span>
            </Badge>
          </div>
          <CardTitle className="text-xl font-bold text-white pt-1">
            {isRegister ? 'Create Trader Account' : 'Sign In to Terminal'}
          </CardTitle>
          <CardDescription className="text-xs text-[#A6ADB9]">
            {isRegister
              ? 'Instant access to signals & bot downloads'
              : 'Sign in to access your live algorithmic feeds'}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/15 p-3 text-xs text-rose-300">
              ⚠ {error}
            </div>
          )}

          {/* 1-Click Access Area */}
          <div className="p-3.5 rounded-2xl border border-white/10 bg-white/5 space-y-2">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#A6ADB9]">
              ⚡ One-Click Instant Access
            </div>
            <div className="grid gap-2">
              <button
                type="button"
                disabled={loading}
                onClick={() => handleQuickLogin('jayeshvegda@gmail.com', 'root1234')}
                className="flex items-center justify-between p-2.5 rounded-xl bg-[#F3C653]/15 border border-[#F3C653]/30 text-[#F3C653] hover:bg-[#F3C653]/25 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
              >
                <span className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  <span>👑 Jayesh Vegda <span className="text-[11px] font-normal text-[#A6ADB9]">(Admin Role)</span></span>
                </span>
                <span className="text-[10px] bg-[#F3C653] text-[#07090D] px-2 py-0.5 rounded font-bold">1-Click →</span>
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={() => handleQuickLogin('user@akgalgo.local', 'root1234')}
                className="flex items-center justify-between p-2.5 rounded-xl bg-[#00D878]/15 border border-[#00D878]/30 text-[#00D878] hover:bg-[#00D878]/25 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
              >
                <span className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>📈 Alex Trader <span className="text-[11px] font-normal text-[#A6ADB9]">(Perfect Plan)</span></span>
                </span>
                <span className="text-[10px] bg-[#00D878] text-[#07090D] px-2 py-0.5 rounded font-bold">1-Click →</span>
              </button>
            </div>
          </div>

          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
            <div className="relative flex justify-center text-[10px] uppercase font-semibold"><span className="bg-[#10141B] px-2 text-[#A6ADB9]">Or Manual Credentials</span></div>
          </div>

          {/* Manual Form */}
          <form onSubmit={handleSubmit} className="space-y-3 text-xs">
            {isRegister && (
              <div>
                <label className="block text-[#E7E9EF] font-semibold mb-1">Trader Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-white placeholder:text-[#A6ADB9] focus:border-[#F3C653] focus:outline-none"
                  placeholder="Jayesh V."
                />
              </div>
            )}

            <div>
              <label className="block text-[#E7E9EF] font-semibold mb-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-white placeholder:text-[#A6ADB9] focus:border-[#F3C653] focus:outline-none"
                placeholder="trader@example.com"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[#E7E9EF] font-semibold">Password</label>
                <span className="text-[10px] text-[#A6ADB9]">Default: root1234</span>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-white focus:border-[#F3C653] focus:outline-none"
                placeholder="••••••••"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full justify-center pt-2.5 pb-2.5 mt-2 font-bold"
            >
              {loading ? 'Authenticating...' : isRegister ? 'Create Account' : 'Sign In to Terminal'}
            </Button>
          </form>

          <div className="text-center text-xs text-[#A6ADB9] pt-3 border-t border-white/10">
            {isRegister ? (
              <span>
                Already a member?{' '}
                <button
                  type="button"
                  onClick={() => setIsRegister(false)}
                  className="text-[#F3C653] hover:underline font-bold cursor-pointer"
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
                  className="text-[#F3C653] hover:underline font-bold cursor-pointer"
                >
                  Create Account
                </button>
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
