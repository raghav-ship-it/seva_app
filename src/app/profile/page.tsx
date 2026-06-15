'use client';

import React from 'react';
import { useStore } from '@/store/useStore';

export default function ProfilePage() {
  const { currentUser, switchUser, users, karma } = useStore();

  return (
    <div className="p-10 max-w-4xl mx-auto min-h-screen">
      <header className="mb-10">
        <h1 className="text-3xl font-extrabold text-[var(--text-main)] tracking-tight">Settings</h1>
        <p className="text-[var(--text-muted)] font-medium mt-1">Manage your identity and preferences.</p>
      </header>

      <section className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl p-8 mb-10">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 rounded-full bg-gray-300 flex items-center justify-center text-2xl font-black text-gray-600 uppercase shadow-inner">
            {currentUser?.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-[var(--text-main)]">{currentUser?.name.split(' (')[0]}</h2>
              <span className={`text-xs font-black px-2.5 py-1 rounded-full uppercase tracking-widest ${
                currentUser?.role === 'admin' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
              }`}>
                {currentUser?.role}
              </span>
            </div>
            <div className="flex items-center gap-4 mt-2">
               <span className="text-sm font-bold text-red-500">Karma: {karma}</span>
               <span className="text-[var(--text-muted)] text-sm">•</span>
               <span className="text-[var(--text-muted)] text-sm">{currentUser?.id}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="mb-10">
        <h3 className="text-sm font-bold text-[var(--text-main)] mb-4">Switch User (Prototyping)</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {users.map(u => (
            <button 
              key={u.id}
              onClick={() => switchUser(u.id)}
              className={`p-4 rounded-xl border text-left transition-all ${
                u.id === currentUser?.id 
                  ? 'border-[var(--accent)] bg-red-50/10 ring-2 ring-red-500/10' 
                  : 'border-[var(--border-color)] hover:border-gray-400 bg-[var(--bg-secondary)]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-[var(--text-main)]">{u.name}</span>
                {u.id === currentUser?.id && <i className="fas fa-check-circle text-[var(--accent)]"></i>}
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-1 uppercase tracking-widest font-black">{u.role}</p>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
