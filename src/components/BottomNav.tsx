'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useStore } from '@/store/useStore';

const BottomNav = () => {
  const pathname = usePathname();
  const currentUser = useStore((state) => state.currentUser);

  const tabs = [
    { name: 'My Day', path: '/home', icon: 'fa-sun' },
    { name: 'Inbox', path: '/tasks', icon: 'fa-inbox' },
    { name: 'Track', path: '/track', icon: 'fa-users', adminOnly: true },
    { name: 'Settings', path: '/profile', icon: 'fa-cog' },
  ];

  const visibleTabs = tabs.filter(tab => !tab.adminOnly || currentUser?.role === 'admin');

  return (
    <nav className="bottom-nav">
      {visibleTabs.map((tab) => (
        <Link 
          key={tab.path} 
          href={tab.path}
          className={`nav-tab ${pathname === tab.path ? 'active' : ''}`}
        >
          <i className={`fas ${tab.icon}`}></i>
          <span>{tab.name}</span>
        </Link>
      ))}
    </nav>
  );
};

export default BottomNav;
