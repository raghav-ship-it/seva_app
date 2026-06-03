'use client';

import React, { useEffect } from 'react';
import { useStore } from '@/store/useStore';
import QuickEntryModal from './QuickEntryModal';
import TaskDetailDrawer from './TaskDetailDrawer';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const theme = useStore((state) => state.theme);
  const isQuickEntryOpen = useStore((state) => state.isQuickEntryOpen);
  const closeQuickEntry = useStore((state) => state.closeQuickEntry);
  const quickEntryDefaults = useStore((state) => state.quickEntryDefaults);

  useEffect(() => {
    document.documentElement.className = theme === 'dark' ? 'dark-theme' : 'light-theme';
  }, [theme]);

  return (
    <>
      {children}
      <QuickEntryModal 
        isOpen={isQuickEntryOpen} 
        onClose={closeQuickEntry} 
        defaultDueDate={quickEntryDefaults.dueDate}
        defaultProject={quickEntryDefaults.project}
      />
      <TaskDetailDrawer />
    </>
  );
}
