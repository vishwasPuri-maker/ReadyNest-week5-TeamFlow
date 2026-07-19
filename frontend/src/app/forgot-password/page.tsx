'use client';

import Link from 'next/link';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch {
      toast.error('Something went wrong');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="card w-full max-w-sm">
        {sent ? (
          <div className="text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-2xl">📧</div>
            <h1 className="mb-1 text-xl font-bold">Check your inbox</h1>
            <p className="mb-6 text-sm text-gray-500">
              If an account exists for <span className="font-medium">{email}</span>, we&apos;ve sent a
              password-reset link. It expires in 1 hour.
            </p>
            <Link href="/login" className="btn-primary w-full">Back to sign in</Link>
          </div>
        ) : (
          <form onSubmit={onSubmit}>
            <h1 className="mb-1 text-xl font-bold">Forgot password?</h1>
            <p className="mb-6 text-sm text-gray-500">Enter your email and we&apos;ll send a reset link.</p>

            <label className="mb-1 block text-sm font-medium">Email</label>
            <input
              className="input mb-6"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <button className="btn-primary w-full" disabled={busy}>
              {busy ? 'Sending…' : 'Send reset link'}
            </button>
            <p className="mt-4 text-center text-sm text-gray-500">
              Remembered it?{' '}
              <Link href="/login" className="font-medium text-brand-600">Sign in</Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
