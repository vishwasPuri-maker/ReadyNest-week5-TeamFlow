'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';

// Shown at the top of the app when the logged-in user hasn't verified their email.
export function VerifyBanner() {
  const { user, refreshUser } = useAuth();
  const [busy, setBusy] = useState(false);

  if (!user || user.emailVerified) return null;

  async function resend() {
    if (!user) return;
    setBusy(true);
    try {
      await api.post('/auth/resend-verification', { email: user.email });
      toast.success('Verification email sent — check your inbox');
    } catch {
      toast.error('Could not send email');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-lg px-4 py-2.5 text-sm text-graphite"
      style={{ background: '#eff6fe' }}
    >
      <span>
        Your email <span className="font-medium">{user.email}</span> isn&apos;t verified yet.
      </span>
      <div className="flex gap-4">
        <button onClick={resend} disabled={busy} className="font-medium text-actionblue hover:underline disabled:opacity-50">
          {busy ? 'Sending…' : 'Resend email'}
        </button>
        <button onClick={() => refreshUser()} className="font-medium text-actionblue hover:underline">
          I&apos;ve verified
        </button>
      </div>
    </div>
  );
}
