'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import toast from 'react-hot-toast';
import { AxiosError } from 'axios';
import { api } from '@/lib/api';

function ResetForm() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get('token') ?? '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) return toast.error('Passwords do not match');
    setBusy(true);
    try {
      await api.post('/auth/reset-password', { token, password });
      toast.success('Password updated! Please sign in.');
      router.replace('/login');
    } catch (err) {
      const msg = (err as AxiosError<{ message: string }>).response?.data?.message ?? 'Reset failed';
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }

  if (!token) {
    return (
      <div className="text-center">
        <h1 className="mb-2 text-xl font-bold">Invalid link</h1>
        <p className="mb-6 text-sm text-gray-500">This reset link is missing or malformed.</p>
        <Link href="/forgot-password" className="btn-primary w-full">Request a new link</Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit}>
      <h1 className="mb-1 text-xl font-bold">Set a new password</h1>
      <p className="mb-6 text-sm text-gray-500">Choose a strong password you&apos;ll remember.</p>

      <label className="mb-1 block text-sm font-medium">New password</label>
      <input className="input mb-4" type="password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} required />

      <label className="mb-1 block text-sm font-medium">Confirm password</label>
      <input className="input mb-6" type="password" minLength={6} value={confirm} onChange={(e) => setConfirm(e.target.value)} required />

      <button className="btn-primary w-full" disabled={busy}>
        {busy ? 'Updating…' : 'Update password'}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="card w-full max-w-sm">
        <Suspense fallback={<p className="text-gray-400">Loading…</p>}>
          <ResetForm />
        </Suspense>
      </div>
    </div>
  );
}
