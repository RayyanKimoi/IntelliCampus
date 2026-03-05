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
  User,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export default function RegisterPage() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();

  const clearFieldError = (field: string) =>
    setFieldErrors(prev => ({ ...prev, [field]: '' }));

  const validate = () => {
    const errors: Record<string, string> = {};
    if (!firstName.trim()) errors.firstName = 'First name is required';
    if (!lastName.trim()) errors.lastName = 'Last name is required';
    if (!email.trim()) {
      errors.email = 'Email is required';
    } else if (!email.includes('@')) {
      errors.email = 'Email is invalid';
    }
    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }
    if (!confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalError('');
    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;
    setLoading(true);
    try {
      await register({
        name: `${firstName.trim()} ${lastName.trim()}`,
        email,
        password,
        role: 'student',
      });
    } catch (err: any) {
      setGlobalError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fieldBase = "h-11 text-sm rounded-xl border text-slate-800 placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-[#006EB2]/40 transition-all duration-200";
  const fieldOk: React.CSSProperties = { backgroundColor: '#F4F7FB', borderColor: 'rgba(0,110,178,0.18)' };
  const fieldErr: React.CSSProperties = { backgroundColor: '#F4F7FB', borderColor: 'rgba(220,48,48,0.45)' };
  const fs = (field: string) => (fieldErrors[field] ? fieldErr : fieldOk);
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
          href="/auth/login"
          className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg border transition-all duration-200 hover:border-[#006EB2] hover:text-[#006EB2]"
          style={{ borderColor: 'rgba(0,110,178,0.2)', color: 'rgba(12,26,46,0.6)', backgroundColor: 'rgba(244,247,251,0.8)' }}
        >
          Sign in <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </header>

      {/* Centered card */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-4 py-10">
        <div
          className="w-full max-w-sm rounded-2xl border p-8 space-y-5"
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
            <h1 className="text-2xl font-extrabold text-slate-900">Create an account</h1>
            <p className="text-sm" style={{ color: 'rgba(12,26,46,0.5)' }}>Join IntelliCampus to start learning</p>
          </div>

          {/* Global error */}
          {globalError && (
            <div
              className="rounded-xl px-4 py-3 text-sm border"
              style={{ backgroundColor: 'rgba(220,48,48,0.07)', borderColor: 'rgba(220,48,48,0.2)', color: '#c0392b' }}
            >
              {globalError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* First Name + Last Name */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className={labelClass} style={labelStyle}>First Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'rgba(0,110,178,0.55)' }} />
                  <Input
                    id="firstName" type="text" placeholder="John"
                    value={firstName} onChange={(e) => { setFirstName(e.target.value); clearFieldError('firstName'); }}
                    className={`pl-10 ${fieldBase}`} style={fs('firstName')}
                  />
                </div>
                {fieldErrors.firstName && <p className="text-[11px] text-red-500">{fieldErrors.firstName}</p>}
              </div>
              <div className="space-y-1.5">
                <label className={labelClass} style={labelStyle}>Last Name</label>
                <Input
                  id="lastName" type="text" placeholder="Doe"
                  value={lastName} onChange={(e) => { setLastName(e.target.value); clearFieldError('lastName'); }}
                  className={`px-3 ${fieldBase}`} style={fs('lastName')}
                />
                {fieldErrors.lastName && <p className="text-[11px] text-red-500">{fieldErrors.lastName}</p>}
              </div>
            </div>

            {/* College Email */}
            <div className="space-y-1.5">
              <label className={labelClass} style={labelStyle}>College Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'rgba(0,110,178,0.55)' }} />
                <Input
                  id="email" type="text" placeholder="you@university.edu"
                  value={email} onChange={(e) => { setEmail(e.target.value); clearFieldError('email'); }}
                  autoComplete="email"
                  className={`pl-10 ${fieldBase}`} style={fs('email')}
                />
              </div>
              {fieldErrors.email && <p className="text-[11px] text-red-500">{fieldErrors.email}</p>}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className={labelClass} style={labelStyle}>Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'rgba(0,110,178,0.55)' }} />
                <Input
                  id="password" type={showPassword ? 'text' : 'password'} placeholder="Min. 8 characters"
                  value={password} onChange={(e) => { setPassword(e.target.value); clearFieldError('password'); }}
                  autoComplete="new-password"
                  className={`pl-10 pr-10 ${fieldBase}`} style={fs('password')}
                />
                <button type="button" onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded transition-colors hover:text-[#006EB2]"
                  style={{ color: 'rgba(12,26,46,0.35)' }}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {fieldErrors.password && <p className="text-[11px] text-red-500">{fieldErrors.password}</p>}
            </div>

            {/* Re-enter Password */}
            <div className="space-y-1.5">
              <label className={labelClass} style={labelStyle}>Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'rgba(0,110,178,0.55)' }} />
                <Input
                  id="confirmPassword" type={showConfirm ? 'text' : 'password'} placeholder="Re-enter your password"
                  value={confirmPassword} onChange={(e) => { setConfirmPassword(e.target.value); clearFieldError('confirmPassword'); }}
                  autoComplete="new-password"
                  className={`pl-10 pr-10 ${fieldBase}`} style={fs('confirmPassword')}
                />
                <button type="button" onClick={() => setShowConfirm(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded transition-colors hover:text-[#006EB2]"
                  style={{ color: 'rgba(12,26,46,0.35)' }}
                  aria-label={showConfirm ? 'Hide password' : 'Show password'}
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {fieldErrors.confirmPassword && <p className="text-[11px] text-red-500">{fieldErrors.confirmPassword}</p>}
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
                <><Loader2 className="w-4 h-4 animate-spin" /> Creating account...</>
              ) : (
                <>Create Account <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          {/* Footer link */}
          <p className="text-center text-sm" style={{ color: 'rgba(12,26,46,0.45)' }}>
            Already have an account?{' '}
            <Link href="/auth/login" className="font-semibold text-[#006EB2] hover:text-[#003F7A] transition-colors">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
