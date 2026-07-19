'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { AxiosError } from 'axios';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('admin@acme.com');
  const [password, setPassword] = useState('password123');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await login(email, password);
      toast.success('Welcome back!');
      router.replace('/dashboard');
    } catch (err) {
      const msg = (err as AxiosError<{ message: string }>).response?.data?.message ?? 'Login failed';
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <form onSubmit={onSubmit} className="card w-full max-w-sm">
        <h1 className="mb-1 text-xl font-bold">Sign in to TeamFlow</h1>
        <p className="mb-6 text-sm text-gray-500">Enter your credentials to continue.</p>

        <label className="mb-1 block text-sm font-medium">Email</label>
        <input className="input mb-4" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />

        <div className="mb-1 flex items-center justify-between">
          <label className="block text-sm font-medium">Password</label>
          <Link href="/forgot-password" className="text-xs font-medium text-brand-600">Forgot?</Link>
        </div>
        <input className="input mb-6" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />

        <button className="btn-primary w-full" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>

        <p className="mt-4 text-center text-sm text-gray-500">
          No account?{' '}
          <Link href="/register" className="font-medium text-brand-600">Create one</Link>
        </p>
      </form>
    </div>
  );
}
