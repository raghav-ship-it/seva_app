'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '@/store/useStore';
import styles from './MobileTopBar.module.css';

const MobileTopBar = () => {
  const { 
    toggleSidebar, 
    currentUser, 
    adminNotifications, 
    dismissAdminNotification, 
    clearAdminNotifications,
    openTaskDetail
  } = useStore();
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!currentUser) return null;

  const unreadNotifs = (adminNotifications || []).filter(n => !n.read);

  return (
    <div className={styles.topBar}>
      <button 
        onClick={toggleSidebar}
        className={styles.hamburger}
        aria-label="Toggle Sidebar"
      >
        <i className="fas fa-bars"></i>
      </button>
      <div className={styles.logo}>
        <div className={styles.logoIcon}>
          <i className="fas fa-check-double"></i>
        </div>
        <span className={styles.logoText}>Seva</span>
      </div>
      
      {currentUser.role === 'admin' ? (
        <div className="relative" ref={dropdownRef}>
          <button 
            className={styles.notificationBtn} 
            aria-label="Notifications"
            onClick={() => setIsNotifOpen(!isNotifOpen)}
          >
            <i className="fas fa-bell"></i>
            {unreadNotifs.length > 0 && (
              <span className={styles.notificationBadge}></span>
            )}
          </button>

          {/* Alerts Dropdown Overlay */}
          {isNotifOpen && (
            <div className="absolute right-0 mt-2 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl shadow-2xl p-3 z-[1001] min-w-[280px] max-h-[360px] overflow-y-auto flex flex-col gap-2">
              <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-2 mb-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Admin Notifications</span>
                {unreadNotifs.length > 0 && (
                  <button 
                    onClick={clearAdminNotifications}
                    className="text-[9px] text-red-500 hover:text-red-600 font-bold"
                  >
                    Clear All
                  </button>
                )}
              </div>
              
              {unreadNotifs.length > 0 ? (
                <div className="flex flex-col gap-1.5">
                  {unreadNotifs.map(n => (
                    <div 
                      key={n.id} 
                      className="flex flex-col p-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg hover:border-red-500/20 cursor-pointer transition-colors relative group/notif"
                      onClick={() => { openTaskDetail(n.taskId); setIsNotifOpen(false); }}
                    >
                      <p className="text-[11px] text-[var(--text-main)] font-medium leading-relaxed pr-5">
                        {n.text}
                      </p>
                      <span className="text-[8px] text-gray-400 mt-1">
                        {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' on ' + new Date(n.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </span>
                      <button
                        onClick={(e) => { e.stopPropagation(); dismissAdminNotification(n.id); }}
                        className="absolute top-2 right-2 text-gray-400 hover:text-red-500 text-[10px] transition-opacity"
                        title="Mark as read"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-xs text-gray-400 italic">No new admin alerts.</div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="w-10" /> // Spacer for non-admins
      )}
    </div>
  );
};

export default MobileTopBar;
