'use client';

import React from 'react';
import { useStore } from '@/store/useStore';
import styles from './MobileTopBar.module.css';

const MobileTopBar = () => {
  const { toggleSidebar } = useStore();

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
      <button className={styles.notificationBtn} aria-label="Notifications">
        <i className="fas fa-bell"></i>
        <span className={styles.notificationBadge}></span>
      </button>
    </div>
  );
};

export default MobileTopBar;
