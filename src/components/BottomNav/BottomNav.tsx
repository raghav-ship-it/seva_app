'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useStore } from '@/store/useStore';
import styles from './BottomNav.module.css';

const BottomNav = () => {
  const pathname = usePathname();
  const { currentUser } = useStore();

  if (!currentUser) return null;

  const tabs = [
    { name: 'My Day', path: '/home', icon: 'fa-sun' },
    { name: 'Inbox', path: '/tasks', icon: 'fa-inbox' },
    { name: 'Upcoming', path: '/upcoming', icon: 'fa-calendar-day' },
  ];

  if (currentUser.role === 'admin') {
    tabs.push({ name: 'Everyone', path: '/track', icon: 'fa-users' });
  }

  tabs.push({ name: 'Profile', path: '/profile', icon: 'fa-user-circle' });

  return (
    <nav className={styles.bottomNav}>
      {tabs.map((tab) => (
        <Link 
          key={tab.path} 
          href={tab.path}
          className={`${styles.navTab} ${pathname === tab.path ? styles.active : ''}`}
        >
          <i className={`fas ${tab.icon}`}></i>
          <span>{tab.name}</span>
        </Link>
      ))}
    </nav>
  );
};

export default BottomNav;
