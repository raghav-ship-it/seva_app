'use client';

import React, { useEffect } from 'react';
import { useStore } from '@/store/useStore';
import TaskDetailDrawer from '@/components/TaskDetailDrawer/TaskDetailDrawer';
import QuickEntryModal from '@/components/QuickEntryModal/QuickEntryModal';
import styles from './ClientLayout.module.css';

const ClientLayout = ({ children }: { children: React.ReactNode }) => {
  const { theme, activeDetailTaskId, isQuickEntryOpen, quickEntryDefaults, closeQuickEntry } = useStore();
  const isDarkMode = theme === 'dark';
  const isTaskDetailOpen = activeDetailTaskId !== null;

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark-theme');
    } else {
      document.documentElement.classList.remove('dark-theme');
    }
  }, [isDarkMode]);

  return (
    <div className={`flex w-full h-full relative ${isDarkMode ? 'dark-theme' : ''}`}>
      <div className={`flex-1 flex flex-col w-full h-full ${styles.glassSurface} relative z-10`}>
        {children}
      </div>

      {isTaskDetailOpen && <TaskDetailDrawer key={activeDetailTaskId} />}
      {isQuickEntryOpen && (
        <QuickEntryModal 
          isOpen={isQuickEntryOpen} 
          onClose={closeQuickEntry}
          defaultDueDate={quickEntryDefaults.dueDate}
          defaultProject={quickEntryDefaults.project}
          defaultMyDay={quickEntryDefaults.myDay}
        />
      )}
    </div>
  );
};

export default ClientLayout;
