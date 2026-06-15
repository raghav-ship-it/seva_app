'use client';

import React from 'react';
import { useStore } from '@/store/useStore';
import { usePathname } from 'next/navigation';
import styles from './FAB.module.css';

const FAB = () => {
  const isQuickEntryOpen = useStore((state) => state.isQuickEntryOpen);
  const openQuickEntry = useStore((state) => state.openQuickEntry);
  const closeQuickEntry = useStore((state) => state.closeQuickEntry);
  const pathname = usePathname();

  return (
    <button 
      className={styles.fab} 
      onClick={() => {
        if (isQuickEntryOpen) closeQuickEntry();
        else {
          const defaults = {
             myDay: pathname === '/home'
          };
          openQuickEntry(defaults);
        }
      }}
      title="Add Task"
    >
      <i className="fas fa-plus"></i>
    </button>
  );
};

export default FAB;
