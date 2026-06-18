'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { useStore } from '@/store/useStore';

export default function LoginPage() {
  const router = useRouter();
  const setCurrentUser = useStore(s => s.setCurrentUser);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isSignup, setIsSignup] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isSignup) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { name } },
        });
        if (error) throw error;
        const { data: profile } = await supabase
          .from('profiles').select('*').eq('id', data.user!.id).single();
        if (profile) setCurrentUser({ id: profile.id, name: profile.name, role: profile.role });
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        const { data: profile } = await supabase
          .from('profiles').select('*').eq('id', data.user.id).single();
        if (profile) setCurrentUser({ id: profile.id, name: profile.name, role: profile.role });
      }
      router.replace('/home');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)] p-4">
      <div className="w-full max-w-sm bg-[var(--bg-secondary,var(--bg-primary))] border border-[var(--border-color)] rounded-2xl p-8 shadow-xl">
        <div className="flex items-center gap-2.5 mb-8">
          <div className="w-9 h-9 bg-[var(--accent)] rounded-lg flex items-center justify-center text-white shadow-md">
            <i className="fas fa-check-double text-sm"></i>
          </div>
          <span className="font-bold text-xl tracking-tight">Seva</span>
        </div>
        <h1 className="text-lg font-bold mb-6">{isSignup ? 'Create account' : 'Sign in'}</h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {isSignup && (
            <input
              type="text"
              placeholder="Your name"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              className="w-full text-sm px-3 py-2.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] outline-none focus:border-[var(--accent)]"
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="w-full text-sm px-3 py-2.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] outline-none focus:border-[var(--accent)]"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            className="w-full text-sm px-3 py-2.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] outline-none focus:border-[var(--accent)]"
          />
          {error && <p className="text-xs text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 text-sm font-bold text-white bg-[var(--accent)] rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity mt-1"
          >
            {loading ? 'Please wait...' : isSignup ? 'Create account' : 'Sign in'}
          </button>
        </form>
        <button
          onClick={() => { setIsSignup(!isSignup); setError(''); }}
          className="mt-4 w-full text-xs text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
        >
          {isSignup ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
        </button>
      </div>
    </div>
  );
}
