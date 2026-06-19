'use client';

import React from 'react';
import { useStore } from '@/store/useStore';

export default function ProfilePage() {
  const { currentUser, users, karma, logout } = useStore();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error('Error logging out:', err);
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto min-h-screen animate-in fade-in duration-500">
      <header className="mb-8 md:mb-10">
        <h1 className="text-2xl md:text-3xl font-extrabold text-[var(--text-main)] tracking-tight">Settings</h1>
        <p className="text-xs md:text-sm text-[var(--text-muted)] font-medium mt-1">Manage your identity and view the organization directory.</p>
      </header>

      {/* Profile Details Card */}
      <section className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl p-6 md:p-8 mb-8 md:mb-10 shadow-sm relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-[var(--accent)]" />
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-[var(--accent)] to-rose-400 dark:from-red-900/50 dark:to-rose-600/50 flex items-center justify-center text-3xl font-black text-white uppercase shadow-inner select-none transition-transform duration-300 group-hover:scale-105">
            {currentUser?.name?.charAt(0) || '?'}
          </div>
          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-center sm:justify-start">
              <h2 className="text-2xl font-bold text-[var(--text-main)]">{currentUser?.name?.split(' (')[0]}</h2>
              <span className={`self-center text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest ${
                currentUser?.role === 'admin' 
                  ? 'bg-red-100 text-red-600 dark:bg-red-950/30 dark:text-red-400' 
                  : 'bg-green-100 text-green-600 dark:bg-green-950/30 dark:text-green-400'
              }`}>
                {currentUser?.role}
              </span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-3 text-xs md:text-sm">
               <span className="font-bold text-red-500 flex items-center justify-center sm:justify-start gap-1">
                 <i className="fas fa-award"></i> Karma Points: {karma}
               </span>
               <span className="hidden sm:inline text-[var(--text-muted)] font-bold">•</span>
               <span className="text-[var(--text-muted)] font-mono break-all sm:break-normal">
                 ID: {currentUser?.id}
               </span>
            </div>
          </div>
        </div>
      </section>

      {/* Directory Section */}
      <section className="mb-8 md:mb-10">
        <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--text-muted)] mb-4 flex items-center gap-2">
          <i className="fas fa-users"></i> Registered Profiles ({users.length})
        </h3>
        
        {users.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {users.map(u => (
              <div 
                key={u.id}
                className={`p-4 rounded-xl border flex items-center justify-between transition-all bg-[var(--bg-secondary)] border-[var(--border-color)] hover:border-gray-400 dark:hover:border-gray-600 shadow-sm ${
                  u.id === currentUser?.id ? 'ring-1 ring-[var(--accent)]/30 border-[var(--accent)]/50' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[var(--border-color)] flex items-center justify-center font-bold text-sm text-[var(--text-main)] uppercase border border-[var(--border-color)]">
                    {u.name?.charAt(0) || '?'}
                  </div>
                  <div>
                    <span className="font-bold text-[var(--text-main)] block leading-tight">
                      {u.name} {u.id === currentUser?.id && <span className="text-xs font-normal text-[var(--text-muted)]">(You)</span>}
                    </span>
                    <span className={`inline-block text-[8px] font-extrabold uppercase tracking-widest mt-1 ${
                      u.role === 'admin' ? 'text-red-500' : 'text-green-500'
                    }`}>
                      {u.role}
                    </span>
                  </div>
                </div>
                {u.id === currentUser?.id && (
                  <span className="text-[10px] bg-[var(--accent)] text-white font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Active
                  </span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-sm text-[var(--text-muted)] italic bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)]">
            Loading directory...
          </div>
        )}
      </section>

      {/* Session Management Section */}
      <section className="pt-6 border-t border-[var(--border-color)]">
        <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--text-muted)] mb-4">
          Session Management
        </h3>
        <button
          onClick={handleLogout}
          className="px-5 py-3 text-sm font-bold text-white bg-[var(--accent)] hover:bg-[var(--accent-hover)] rounded-xl transition-all shadow-md flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
        >
          <i className="fas fa-sign-out-alt"></i> Sign Out of Session
        </button>
      </section>
    </div>
  );
}
