'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { AuthBackground } from '@/components/ui/auth-background';
import {
  Shield,
  Loader2,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  KeyRound,
  CheckCircle2,
} from 'lucide-react';

type LoginStep = 'credentials' | 'otp';

export default function AdminLoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<LoginStep>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Refs for OTP inputs
  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Login failed');
      }

      if (data.requiresOTP) {
        setSuccess('OTP sent to your email! Check your inbox.');
        setStep('otp');
        // Focus first OTP input after transition
        setTimeout(() => otpInputsRef.current[0]?.focus(), 100);
      }
    } catch (err: any) {
      setError(err.message || 'Invalid admin credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleOTPSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpCode = otp.join('');

    if (otpCode.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await fetch('/api/admin/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: otpCode }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'OTP verification failed');
      }

      // Store token and user data
      localStorage.setItem('token', data.data.token);
      localStorage.setItem('user', JSON.stringify(data.data.user));

      setSuccess('Login successful! Redirecting...');
      
      // Redirect to admin dashboard
      setTimeout(() => {
        router.push('/admin/dashboard');
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Invalid OTP code');
    } finally {
      setLoading(false);
    }
  };

  const handleOTPChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleOTPKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  const handleOTPPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    
    if (/^\d{6}$/.test(pastedData)) {
      const digits = pastedData.split('');
      setOtp(digits);
      otpInputsRef.current[5]?.focus();
    }
  };

  const handleResendOTP = async () => {
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to resend OTP');
      }

      setSuccess('New OTP sent to your email!');
      setOtp(['', '', '', '', '', '']);
      otpInputsRef.current[0]?.focus();
    } catch (err: any) {
      setError(err.message || 'Failed to resend OTP');
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
          href="/auth/login"
          className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg border transition-all duration-200 hover:border-[#006EB2] hover:text-[#006EB2]"
          style={{ borderColor: 'rgba(0,110,178,0.2)', color: 'rgba(12,26,46,0.6)', backgroundColor: 'rgba(244,247,251,0.8)' }}
        >
          <ArrowLeft className="w-3.5 h-3.5" /> User Login
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
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-[#002F4C] to-[#006EB2] flex items-center justify-center">
                <Shield className="h-8 w-8 text-white" />
              </div>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900">
              {step === 'credentials' ? 'Admin Login' : 'Verify OTP'}
            </h1>
            <p className="text-sm" style={{ color: 'rgba(12,26,46,0.5)' }}>
              {step === 'credentials' 
                ? 'Secure access for administrators' 
                : 'Enter the 6-digit code sent to your email'
              }
            </p>
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

          {/* Success */}
          {success && (
            <div
              className="rounded-xl px-4 py-3 text-sm border flex items-center gap-2"
              style={{ backgroundColor: 'rgba(46,184,92,0.07)', borderColor: 'rgba(46,184,92,0.2)', color: '#27ae60' }}
            >
              <CheckCircle2 className="w-4 h-4" />
              {success}
            </div>
          )}

          {/* Credentials Form */}
          {step === 'credentials' && (
            <form onSubmit={handleCredentialsSubmit} className="space-y-5">
              {/* Email */}
              <div className="space-y-1.5">
                <label className={labelClass} style={labelStyle}>Admin Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'rgba(0,110,178,0.55)' }} />
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@intellicampus.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    className={`pl-10 ${fieldClass}`}
                    style={fieldStyle}
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className={labelClass} style={labelStyle}>Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'rgba(0,110,178,0.55)' }} />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    className={`pl-10 pr-10 ${fieldClass}`}
                    style={fieldStyle}
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
                  <><Loader2 className="w-4 h-4 animate-spin" /> Verifying...</>
                ) : (
                  <>Continue <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </form>
          )}

          {/* OTP Form */}
          {step === 'otp' && (
            <form onSubmit={handleOTPSubmit} className="space-y-5">
              {/* OTP Inputs */}
              <div className="space-y-3">
                <label className={labelClass} style={labelStyle}>Verification Code</label>
                <div className="flex gap-2 justify-center" onPaste={handleOTPPaste}>
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => {
                        otpInputsRef.current[index] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOTPChange(index, e.target.value)}
                      onKeyDown={(e) => handleOTPKeyDown(index, e)}
                      className="w-12 h-14 text-center text-2xl font-bold rounded-xl border focus:outline-none focus:ring-2 focus:ring-[#006EB2] transition-all"
                      style={{
                        backgroundColor: '#F4F7FB',
                        borderColor: digit ? '#006EB2' : 'rgba(0,110,178,0.18)',
                        color: '#002F4C',
                      }}
                    />
                  ))}
                </div>
                <p className="text-xs text-center" style={{ color: 'rgba(12,26,46,0.45)' }}>
                  Code expires in 5 minutes
                </p>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2 transition-all duration-300 disabled:opacity-60"
                style={{
                  background: loading ? '#8AAEC8' : 'linear-gradient(135deg,#002F4C,#006EB2)',
                  boxShadow: loading ? 'none' : '0 0 20px rgba(0,110,178,0.3)',
                }}
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Verifying...</>
                ) : (
                  <>Verify & Login <KeyRound className="w-4 h-4" /></>
                )}
              </button>

              {/* Resend OTP */}
              <div className="text-center">
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={loading}
                  className="text-sm font-semibold text-[#006EB2] hover:text-[#003F7A] transition-colors disabled:opacity-50"
                >
                  Resend OTP
                </button>
              </div>

              {/* Back button */}
              <button
                type="button"
                onClick={() => {
                  setStep('credentials');
                  setOtp(['', '', '', '', '', '']);
                  setError('');
                  setSuccess('');
                }}
                className="w-full text-sm text-center"
                style={{ color: 'rgba(12,26,46,0.45)' }}
              >
                <ArrowLeft className="w-3.5 h-3.5 inline mr-1" />
                Back to login
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
