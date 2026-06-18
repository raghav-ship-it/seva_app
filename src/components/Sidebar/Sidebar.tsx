'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import styles from './Sidebar.module.css';

const Sidebar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { 
    currentUser, 
    switchUser, 
    users, 
    projects, 
    tags,
    toggleTheme, 
    karma, 
    tasks,
    adminNotifications,
    dismissAdminNotification,
    clearAdminNotifications,
    openTaskDetail,
    isSidebarOpen,
    closeSidebar,
  } = useStore();

  const [projectsCollapsed, setProjectsCollapsed] = useState(false);
  const [tagsCollapsed, setTagsCollapsed] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!currentUser) return null;

  // Close sidebar on navigation (mobile)
  const handleNavClick = () => {
    if (window.innerWidth <= 768) {
      closeSidebar();
    }
  };

  // Calculate counts for badges
  const myDayCount = tasks.filter(t => 
    t.myDay && 
    t.assigneeId === currentUser.id && 
    t.status !== 'completed'
  ).length;

  const inboxCount = tasks.filter(t => 
    t.assigneeId === currentUser.id && 
    t.status !== 'completed'
  ).length;

  const upcomingCount = tasks.filter(t => 
    t.dueDate && 
    t.assigneeId === currentUser.id && 
    t.status !== 'completed'
  ).length;

  const navItems = [
    { name: 'My Day', path: '/home', icon: 'fa-sun', color: 'text-yellow-500', count: myDayCount },
    { name: 'Inbox', path: '/tasks', icon: 'fa-inbox', color: 'text-blue-500', count: inboxCount },
    { name: 'Upcoming', path: '/upcoming', icon: 'fa-calendar-day', color: 'text-green-500', count: upcomingCount },
  ];

  // Admin Notification stack filter
  const unreadNotifs = (adminNotifications || []).filter(n => !n.read);

  return (
    <>
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[998] md:hidden animate-in fade-in duration-300" 
          onClick={closeSidebar}
        />
      )}

      <aside className={`${styles.sidebarContainer} ${isSidebarOpen ? styles.open : ''} bg-[var(--sidebar-bg)] border-r border-[var(--border-color)] p-5 flex flex-col gap-5 h-full relative z-[999]`}>
        {/* Header Logo & Buttons */}
        <div className="flex items-center justify-between px-3 mb-2 relative">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-[var(--accent)] rounded-lg flex items-center justify-center text-white shadow-md shadow-red-500/10">
              <i className="fas fa-check-double text-sm"></i>
            </div>
            <span className="font-bold text-lg tracking-tight">Seva</span>
          </div>
          
          <div className="flex items-center gap-1">
            {/* Admin Alerts Bell */}
            {currentUser.role === 'admin' && (
              <div className="relative" ref={notifRef}>
                <button 
                  onClick={() => setIsNotifOpen(!isNotifOpen)}
                  className={`w-8 h-8 rounded-lg hover:bg-[var(--border-color)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-main)] transition-all relative active:scale-95 ${
                    isNotifOpen ? 'bg-[var(--border-color)] text-[var(--accent)]' : ''
                  }`}
                  title="Admin Alerts"
                >
                  <i className="fas fa-bell"></i>
                  {unreadNotifs.length > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full animate-ping" />
                  )}
                  {unreadNotifs.length > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full" />
                  )}
                </button>

                {/* Alerts Dropdown Overlay */}
                {isNotifOpen && (
                  <div className="absolute right-0 mt-2 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl shadow-2xl p-3 z-[999] min-w-[280px] max-h-[360px] overflow-y-auto flex flex-col gap-2">
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
                            onClick={() => { openTaskDetail(n.taskId); setIsNotifOpen(false); handleNavClick(); }}
                          >
                            <p className="text-[11px] text-[var(--text-main)] font-medium leading-relaxed pr-5">
                              {n.text}
                            </p>
                            <span className="text-[8px] text-gray-400 mt-1">
                              {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' on ' + new Date(n.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                            </span>
                            <button
                              onClick={(e) => { e.stopPropagation(); dismissAdminNotification(n.id); }}
                              className="absolute top-2 right-2 text-gray-400 hover:text-red-500 text-[10px] opacity-0 group-hover/notif:opacity-100 transition-opacity"
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
            )}

            <button 
              onClick={toggleTheme} 
              className="w-8 h-8 rounded-lg hover:bg-[var(--border-color)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-main)] transition-all active:scale-95"
              title="Toggle Theme"
            >
              <i className="fas fa-moon"></i>
            </button>

            {/* Close Button (Mobile Only) */}
            <button 
              onClick={closeSidebar}
              className="w-8 h-8 rounded-lg hover:bg-[var(--border-color)] flex items-center justify-center text-[var(--text-muted)] md:hidden transition-all active:scale-95"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
        </div>

      {/* Switch Identity (Prototyping) */}
      <div className="px-3 mb-2">
        <p className="text-[10px] font-bold text-gray-400 uppercase mb-2 tracking-widest">Active Identity</p>
        <div className="relative">
          <select 
            value={currentUser.id} 
            onChange={(e) => switchUser(e.target.value)}
            className="w-full text-xs py-2 px-3 pr-8 rounded-lg border border-[var(--border-color)] outline-none bg-[var(--bg-primary)] font-bold cursor-pointer appearance-none transition-all hover:border-gray-400"
          >
            {users.map(u => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 text-xs">
            <i className="fas fa-chevron-down"></i>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex flex-col gap-0.5">
        {navItems.map((item) => (
          <Link 
            key={item.path} 
            href={item.path}
            onClick={handleNavClick}
            className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all group ${
              pathname === item.path 
                ? 'bg-[var(--border-color)] text-[var(--text-main)] font-semibold' 
                : 'text-[var(--text-main)] hover:bg-[var(--border-color)]'
            }`}
          >
            <div className="flex items-center gap-3">
              <i className={`fas ${item.icon} w-5 text-center ${item.color} transition-transform group-hover:scale-110`}></i>
              <span>{item.name}</span>
            </div>
            {item.count > 0 && (
              <span className="text-[10px] font-bold bg-[var(--border-color)] px-2 py-0.5 rounded-full text-[var(--text-muted)] border border-[var(--border-color)]">
                {item.count}
              </span>
            )}
          </Link>
        ))}
        
        {currentUser.role === 'admin' && (
          <Link 
            href="/track"
            onClick={handleNavClick}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              pathname === '/track' 
                ? 'bg-[var(--border-color)] text-[var(--text-main)] font-semibold' 
                : 'text-[var(--text-main)] hover:bg-[var(--border-color)]'
            }`}
          >
            <i className="fas fa-users w-5 text-center text-purple-500"></i>
            <span>Everyone</span>
          </Link>
        )}
      </nav>

      {/* Projects Section */}
      <div className="mt-4 flex-1 overflow-y-auto no-scrollbar flex flex-col gap-5">
        <div>
          <div className="px-3 mb-1.5 flex items-center justify-between text-xs font-bold text-gray-400 uppercase tracking-widest">
            <button 
              onClick={() => setProjectsCollapsed(!projectsCollapsed)} 
              className="hover:text-[var(--text-main)] flex items-center gap-1.5 transition-colors"
            >
              <i className={`fas fa-chevron-down text-[9px] transition-transform duration-200 ${projectsCollapsed ? '-rotate-90' : ''}`}></i>
              <span>Projects</span>
            </button>
          </div>
          
          {!projectsCollapsed && (
            <div className="flex flex-col gap-0.5 animate-in fade-in slide-in-from-top-1 duration-150">
              {projects.map(p => {
                const projectTaskCount = tasks.filter(t => t.project === p && t.status !== 'completed' && t.assigneeId === currentUser.id).length;
                return (
                  <div 
                    key={p} 
                    onClick={() => { router.push(`/tasks?project=${encodeURIComponent(p)}`); handleNavClick(); }}
                    className="flex items-center justify-between px-3 py-1.5 text-sm text-[var(--text-main)] hover:bg-[var(--border-color)] rounded-lg cursor-pointer transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <i className="fas fa-circle text-[8px] w-5 text-center text-gray-400 group-hover:text-[var(--accent)] transition-colors"></i>
                      <span>{p}</span>
                    </div>
                    {projectTaskCount > 0 && (
                      <span className="text-[9px] font-bold text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        {projectTaskCount}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Tags Section */}
        <div>
          <div className="px-3 mb-1.5 flex items-center justify-between text-xs font-bold text-gray-400 uppercase tracking-widest">
            <button 
              onClick={() => setTagsCollapsed(!tagsCollapsed)} 
              className="hover:text-[var(--text-main)] flex items-center gap-1.5 transition-colors"
            >
              <i className={`fas fa-chevron-down text-[9px] transition-transform duration-200 ${tagsCollapsed ? '-rotate-90' : ''}`}></i>
              <span>Tags</span>
            </button>
          </div>
          
          {!tagsCollapsed && (
            <div className="flex flex-col gap-0.5 animate-in fade-in slide-in-from-top-1 duration-150">
              {tags.map(t => {
                const tagTaskCount = tasks.filter(task => task.tags.includes(t) && task.status !== 'completed' && task.assigneeId === currentUser.id).length;
                return (
                  <div 
                    key={t} 
                    onClick={() => { router.push(`/tasks?tag=${encodeURIComponent(t)}`); handleNavClick(); }}
                    className="flex items-center justify-between px-3 py-1.5 text-sm text-[var(--text-main)] hover:bg-[var(--border-color)] rounded-lg cursor-pointer transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <i className="fas fa-hashtag text-[10px] w-5 text-center text-gray-400"></i>
                      <span>{t}</span>
                    </div>
                    {tagTaskCount > 0 && (
                      <span className="text-[9px] font-bold bg-[var(--border-color)] text-gray-400 px-1.5 py-0.5 rounded-md">
                        {tagTaskCount}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* User Profile Block */}
      <div className="mt-auto pt-4 border-t border-[var(--border-color)]">
        <div className="flex items-center gap-3 px-3">
          <div className="w-9 h-9 rounded-full bg-red-100 dark:bg-red-950/30 text-[var(--accent)] flex items-center justify-center text-sm font-black uppercase shadow-inner border border-[var(--border-color)]">
            {currentUser.name.charAt(0)}
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-[var(--text-main)] ">{currentUser.name.split(' (')[0]}</span>
              <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded-full uppercase tracking-tighter ${
                currentUser.role === 'admin' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-300' : 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-300'
              }`}>
                {currentUser.role}
              </span>
            </div>
            <div className="text-[10px] font-bold text-red-500 mt-0.5 flex items-center gap-1">
              <i className="fas fa-award text-[8px]"></i> Karma: {karma}
            </div>
          </div>
        </div>
      </div>
    </aside>
    </>
  );
};

export default Sidebar;
