'use client';

import React, { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { supabase } from '@/lib/supabaseClient';

export default function ProfilePage() {
  const { currentUser, users, karma, logout, fetchUserData } = useStore();

  // Rename state
  const [isEditing, setIsEditing] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Sync state with current user name
  useEffect(() => {
    if (currentUser?.name) {
      setNameInput(currentUser.name);
    }
  }, [currentUser?.name]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error('Error logging out:', err);
    }
  };

  const handleSaveName = async () => {
    if (!nameInput.trim() || !currentUser?.id) return;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ name: nameInput.trim() })
        .eq('id', currentUser.id);
      if (error) throw error;
      // Re-fetch to sync the store with the updated profile
      await fetchUserData();
      setIsEditing(false);
    } catch (err) {
      console.error('Error updating name:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto min-h-screen animate-in fade-in duration-500">
      {/* Page Header */}
      <header className="mb-8 md:mb-10">
        <h1 className="text-2xl md:text-3xl font-extrabold text-[var(--text-main)] tracking-tight flex items-center gap-3">
          <i className="fas fa-sliders-h text-xl text-[var(--accent)] opacity-80"></i>
          Settings & Profile
        </h1>
        <p className="text-xs md:text-sm text-[var(--text-muted)] font-medium mt-1">
          Manage your identity, display name, and active session preferences.
        </p>
      </header>

      {/* Profile Details Card */}
      <section className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl p-6 md:p-8 mb-8 shadow-sm relative overflow-hidden transition-all duration-300 hover:shadow-md">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-[var(--accent)]" />

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Avatar with Active Status Indicator */}
          <div className="relative group shrink-0">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-[var(--accent)] to-rose-400 dark:from-red-900/50 dark:to-rose-600/50 flex items-center justify-center text-3xl font-black text-white uppercase shadow-lg select-none transition-transform duration-300 group-hover:scale-105">
              {currentUser?.name?.charAt(0) || '?'}
            </div>
            <span
              className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-[var(--bg-secondary)] rounded-full"
              title="Active User"
            />
          </div>

          {/* User Details & Rename Input */}
          <div className="flex-1 w-full text-center sm:text-left space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-center sm:justify-between">

              {/* Name View vs Edit Mode */}
              {isEditing ? (
                <div className="flex items-center gap-2 w-full max-w-md">
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    placeholder="Enter new display name"
                    autoFocus
                    className="flex-1 px-3.5 py-1.5 text-sm font-semibold text-[var(--text-main)] bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 focus:border-[var(--accent)] transition-all"
                  />
                  <button
                    type="button"
                    onClick={handleSaveName}
                    disabled={isSaving || !nameInput.trim()}
                    className="px-3 py-1.5 text-xs font-bold text-white bg-[var(--accent)] hover:bg-[var(--accent-hover)] rounded-xl transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <i className="fas fa-check text-[10px]"></i> Save
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setNameInput(currentUser?.name || '');
                    }}
                    className="px-3 py-1.5 text-xs font-bold text-[var(--text-muted)] bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-all"
                  >
                    <i className="fas fa-times text-[10px]"></i>
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2.5 justify-center sm:justify-start">
                  <h2 className="text-2xl font-bold text-[var(--text-main)] tracking-tight">
                    {currentUser?.name?.split(' (')[0] || 'User Profile'}
                  </h2>
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="p-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--accent)] bg-gray-100 dark:bg-gray-800/60 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    title="Rename Profile"
                  >
                    <i className="fas fa-pen text-[11px]"></i>
                  </button>
                </div>
              )}

              {/* Role Badge (Fixed Label Display) */}
              <span
                className={`self-center sm:self-auto text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest border ${currentUser?.role === 'admin'
                  ? 'bg-red-50 text-red-600 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/40'
                  : 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/40'
                  }`}
              >
                {currentUser?.role || 'Member'}
              </span>
            </div>

            {/* Sub-meta details */}
            <p className="text-xs text-[var(--text-muted)] font-medium">
              Karma Score: <span className="font-bold text-[var(--text-main)]">{karma ?? 0}</span> &bull; Total Directory Users: <span className="font-bold text-[var(--text-main)]">{users?.length || 0}</span>
            </p>
          </div>
        </div>
      </section>

      {/* Session Management Section */}
      <section className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl p-6 md:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-main)] flex items-center gap-2">
              <i className="fas fa-shield-alt text-rose-500 text-sm"></i>
              Session Management
            </h3>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Sign out from your active workspace session on this browser.
            </p>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full sm:w-auto px-5 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
          >
            <i className="fas fa-sign-out-alt"></i> Sign Out of Session
          </button>
        </div>
      </section>
    </div>
  );
}