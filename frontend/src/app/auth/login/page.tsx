'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { GraduationCap, Loader2 } from 'lucide-react';

const DEMO_ACCOUNTS = [
  { label: 'Student',  email: 'student@campus.edu', password: 'student123', color: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100' },
  { label: 'Teacher',  email: 'teacher@campus.edu', password: 'teacher123', color: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' },
  { label: 'Admin',    email: 'admin@campus.edu',   password: 'admin123',   color: 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100' },
];

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (account: typeof DEMO_ACCOUNTS[0]) => {
    setEmail(account.email);
    setPassword(account.password);
    setError('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <GraduationCap className="h-10 w-10 text-primary" />
            <span className="text-2xl font-bold">IntelliCampus</span>
          </Link>
        </div>

        {/* Demo credentials panel */}
        <div className="mb-4 rounded-xl border border-dashed border-border bg-muted/40 p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Demo accounts — click to fill</p>
          <div className="flex gap-2">
            {DEMO_ACCOUNTS.map(acc => (
              <button
                key={acc.label}
                type="button"
                onClick={() => fillDemo(acc)}
                className={`flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${acc.color}`}
              >
                {acc.label}
              </button>
            ))}
          </div>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Welcome back</CardTitle>
            <CardDescription>Sign in to your account to continue</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <div className="rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@university.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sign In
              </Button>
              <p className="text-sm text-muted-foreground text-center">
                Don&apos;t have an account?{' '}
                <Link href="/auth/register" className="text-primary hover:underline font-medium">
                  Register
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
