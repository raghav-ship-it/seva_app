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
  const [view, setView] = useState<'login' | 'verify'>('login');
  const [error, setError] = useState('');
  const [resendMsg, setResendMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isSignup) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { 
            data: { name },
            emailRedirectTo: `${window.location.origin}/home`
          },
        });
        if (error) throw error;
        setView('verify');
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        
        let { data: profile, error: profileError } = await supabase
          .from('profiles').select('*').eq('id', data.user.id).single();
          
        if (profileError && profileError.code === 'PGRST116') {
          const { data: newProfile, error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: data.user.id,
              name: data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'User',
              role: 'user'
            })
            .select()
            .single();
            
          if (insertError) throw insertError;
          profile = newProfile;
          profileError = null;
        } else if (profileError) {
          throw profileError;
        }
        
        if (profile) setCurrentUser({ id: profile.id, name: profile.name, role: profile.role });
        router.replace('/home');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendMsg('');
    const { error } = await supabase.auth.resend({ type: 'signup', email });
    setResendMsg(error ? error.message : 'Email resent! Check your inbox.');
  };

  const handleRefresh = async () => {
    setResendMsg('');
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setResendMsg('Not verified yet. Try again shortly.');
      return;
    }
    let { data: profile, error: profileError } = await supabase
      .from('profiles').select('*').eq('id', session.user.id).single();
      
    if (profileError && profileError.code === 'PGRST116') {
      const { data: newProfile, error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: session.user.id,
          name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
          role: 'user'
        })
        .select()
        .single();
      if (!insertError) {
        profile = newProfile;
        profileError = null;
      }
    }
    
    if (profileError || !profile) {
      setResendMsg('Profile not ready yet. Please wait a moment.');
      return;
    }
    setCurrentUser({ id: profile.id, name: profile.name, role: profile.role });
    router.replace('/home');
  };

  const handleChangeAccount = () => {
    setView('login');
    setIsSignup(true);
    setPassword('');
    setName('');
    setError('');
    setResendMsg('');
  };

  if (view === 'verify') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)] p-4">
        <div className="w-full max-w-sm bg-[var(--bg-secondary,var(--bg-primary))] border border-[var(--border-color)] rounded-2xl shadow-xl overflow-hidden">
          <div className="h-1 w-full bg-[var(--border-color)] relative overflow-hidden">
            <div
              className="absolute h-full bg-[var(--accent)] rounded-full"
              style={{ animation: 'progressSlide 1.8s ease-in-out infinite', width: '40%' }}
            />
          </div>
          <style>{`@keyframes progressSlide { 0% { left: -40%; } 100% { left: 100%; } }`}</style>

          <div className="p-8">
            <div className="flex items-center gap-2.5 mb-8">
              <div className="w-9 h-9 bg-[var(--accent)] rounded-lg flex items-center justify-center text-white shadow-md">
                <i className="fas fa-check-double text-sm"></i>
              </div>
              <span className="font-bold text-xl tracking-tight">Seva</span>
            </div>

            <h1 className="text-lg font-bold mb-4">Check Your Email</h1>
            <p className="text-sm text-[var(--text-muted)] mb-3 leading-relaxed">
              Click the link we sent to <span className="font-bold text-[var(--text-main)]">{email}</span> to verify your account and start your seva.
            </p>
            <p className="text-sm text-[var(--text-muted)] mb-8 leading-relaxed">
              Check your spam folder if it doesn&apos;t show up.
            </p>

            {resendMsg && (
              <p className="text-xs text-[var(--accent)] mb-4 text-center">{resendMsg}</p>
            )}

            <div className="flex flex-col gap-3">
              <button
                onClick={() => window.open('mailto:' + email)}
                className="w-full py-2.5 text-sm font-bold text-white bg-[var(--accent)] rounded-lg hover:opacity-90 transition-opacity"
              >
                Open Email
              </button>
              <button
                onClick={handleResend}
                className="w-full py-2.5 text-sm font-semibold border border-[var(--border-color)] rounded-lg hover:bg-[var(--bg-primary)] transition-colors"
              >
                Resend Email
              </button>
              <button
                onClick={handleRefresh}
                className="w-full py-2.5 text-sm font-semibold border border-[var(--border-color)] rounded-lg hover:bg-[var(--bg-primary)] transition-colors"
              >
                Already verified? Refresh
              </button>
              <button
                onClick={handleChangeAccount}
                className="w-full py-2.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
              >
                Change Account
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
