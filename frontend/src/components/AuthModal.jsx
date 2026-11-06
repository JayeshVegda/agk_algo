import React, { useState, useEffect } from 'react';
import { pb } from '../lib/pocketbase';
import { Zap, X, Lock, Mail, CheckCircle } from 'lucide-react';
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

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen]);

  if (!isOpen) return null;

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
          name: name || email.split('@')[0]
        });
        const authData = await pb.collection('users').authWithPassword(email, password);
        onAuthSuccess(authData.record);
      } else {
        const authData = await pb.collection('users').authWithPassword(email, password);
        onAuthSuccess(authData.record);
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Authentication error. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
      <Card className="w-full max-w-md shadow-2xl relative bg-akg-card border border-akg-hairline text-akg-text max-h-[92vh] flex flex-col overflow-hidden my-auto rounded-xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-akg-muted hover:text-akg-text p-1 rounded-md cursor-pointer z-10 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <CardHeader className="space-y-2 p-4 sm:p-5 pb-2 text-center items-center shrink-0">
          <img
            src="/assets/logos/akg-algo-metallic-footer.webp"
            alt="AKG ALGO"
            className="h-10 sm:h-12 w-auto mx-auto object-contain mb-1 opacity-90"
          />
          <div className="flex justify-center">
            <Badge variant="emerald" className="gap-1.5 py-0.5 px-2.5 text-[11px]">
              <Zap className="h-3 w-3" />
              <span>Terminal Authentication</span>
            </Badge>
          </div>
          <CardTitle className="text-lg sm:text-xl font-bold text-akg-text pt-1">
            {isRegister ? 'Create Trader Account' : 'Sign In to Terminal'}
          </CardTitle>
          <CardDescription className="text-xs text-akg-muted">
            {isRegister
              ? 'Instant access to signals and bot downloads'
              : 'Sign in to access your live algorithmic feeds'}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-3.5 p-4 sm:p-5 pt-1 flex-1 overflow-y-auto">
          {error && (
            <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-400">
              ⚠ {error}
            </div>
          )}

          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-akg-hairline"></div></div>
            <div className="relative flex justify-center text-[10px] uppercase font-mono"><span className="bg-akg-card px-2 text-akg-muted">Manual Credentials</span></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3 text-xs">
            {isRegister && (
              <div>
                <label htmlFor="auth-trader-name" className="block text-akg-text font-semibold mb-1">Trader Name</label>
                <input
                  type="text"
                  name="traderName"
                  id="auth-trader-name"
                  autoComplete="name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-akg-hairline bg-akg-raised px-3 py-2 text-akg-text placeholder:text-akg-muted/60 focus:border-akg-accent focus:outline-none"
                  placeholder="Jayesh V."
                />
              </div>
            )}

            <div>
              <label htmlFor="auth-email" className="block text-akg-text font-semibold mb-1">Email Address</label>
              <input
                type="email"
                name="email"
                id="auth-email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-akg-hairline bg-akg-raised px-3 py-2 text-akg-text placeholder:text-akg-muted/60 focus:border-akg-accent focus:outline-none"
                placeholder="trader@example.com"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="auth-password" className="text-akg-text font-semibold">Password</label>
              </div>
              <input
                type="password"
                name="password"
                id="auth-password"
                autoComplete={isRegister ? 'new-password' : 'current-password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-akg-hairline bg-akg-raised px-3 py-2 text-akg-text focus:border-akg-accent focus:outline-none"
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

          <div className="text-center text-xs text-akg-muted pt-3 border-t border-akg-hairline">
            {isRegister ? (
              <span>
                Already a member?{' '}
                <button
                  type="button"
                  onClick={() => setIsRegister(false)}
                  className="text-akg-accent hover:underline font-semibold cursor-pointer"
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
                  className="text-akg-accent hover:underline font-semibold cursor-pointer"
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
