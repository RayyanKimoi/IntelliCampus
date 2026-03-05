'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Input } from '@/components/ui/input';
import { AuthBackground } from '@/components/ui/auth-background';
import {
  GraduationCap,
  Loader2,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fieldClass = "h-11 text-sm rounded-xl border text-slate-800 placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-[#006EB2]/40 transition-all duration-200";
  const fieldStyle: React.CSSProperties = { backgroundColor: '#F4F7FB', borderColor: 'rgba(0,110,178,0.18)' };
  const labelClass = "text-xs font-semibold uppercase tracking-widest";
  const labelStyle = { color: 'rgba(0,47,76,0.55)' };

  return (
    <div className="relative min-h-screen flex flex-col text-slate-900">
      <AuthBackground />

      {/* Navbar */}
      <header
        className="relative z-20 flex items-center justify-between px-6 py-4 border-b"
        style={{ borderColor: 'rgba(0,110,178,0.12)', backgroundColor: 'rgba(238,242,248,0.92)', backdropFilter: 'blur(12px)' }}
      >
        <Link href="/" className="flex items-center gap-2">
          <img src="/icons/logo.png" alt="IntelliCampus" className="h-8 w-8 object-contain" />
          <span className="font-bold text-slate-900 text-sm tracking-tight">IntelliCampus</span>
        </Link>
        <Link
          href="/auth/register"
          className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg border transition-all duration-200 hover:border-[#006EB2] hover:text-[#006EB2]"
          style={{ borderColor: 'rgba(0,110,178,0.2)', color: 'rgba(12,26,46,0.6)', backgroundColor: 'rgba(244,247,251,0.8)' }}
        >
          Create account <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </header>

      {/* Centered card */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-4 py-10">
        <div
          className="w-full max-w-sm rounded-2xl border p-8 space-y-6"
          style={{
            backgroundColor: '#FFFFFF',
            borderColor: 'rgba(0,110,178,0.13)',
            boxShadow: '0 0 40px rgba(0,110,178,0.08), 0 20px 40px rgba(0,0,0,0.07)',
          }}
        >
          {/* Header */}
          <div className="text-center space-y-1">
            <div className="flex justify-center mb-4">
              <img src="/icons/logo.png" alt="IntelliCampus" className="h-16 w-16 object-contain" />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900">Welcome back</h1>
            <p className="text-sm" style={{ color: 'rgba(12,26,46,0.5)' }}>Sign in to your IntelliCampus account</p>
          </div>

          {/* Error */}
          {error && (
            <div
              className="rounded-xl px-4 py-3 text-sm border"
              style={{ backgroundColor: 'rgba(220,48,48,0.07)', borderColor: 'rgba(220,48,48,0.2)', color: '#c0392b' }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div className="space-y-1.5">
              <label className={labelClass} style={labelStyle}>Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'rgba(0,110,178,0.55)' }} />
                <Input
                  id="email" type="email" placeholder="you@university.edu"
                  value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email"
                  className={`pl-10 ${fieldClass}`} style={fieldStyle}
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className={labelClass} style={labelStyle}>Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'rgba(0,110,178,0.55)' }} />
                <Input
                  id="password" type={showPassword ? 'text' : 'password'} placeholder=""
                  value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password"
                  className={`pl-10 pr-10 ${fieldClass}`} style={fieldStyle}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded transition-colors hover:text-[#006EB2]"
                  style={{ color: 'rgba(12,26,46,0.35)' }}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2 transition-all duration-300 disabled:opacity-60 mt-1"
              style={{
                background: loading ? '#8AAEC8' : 'linear-gradient(135deg,#002F4C,#006EB2)',
                boxShadow: loading ? 'none' : '0 0 20px rgba(0,110,178,0.3)',
              }}
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</>
              ) : (
                <>Sign In <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          {/* Footer link */}
          <p className="text-center text-sm" style={{ color: 'rgba(12,26,46,0.45)' }}>
            Don't have an account?{' '}
            <Link href="/auth/register" className="font-semibold text-[#006EB2] hover:text-[#003F7A] transition-colors">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
