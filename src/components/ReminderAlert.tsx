'use client';

import React, { useEffect, useState } from 'react';
import { useStore } from '@/store/useStore';
import { Task } from '@/lib/types';

const ReminderAlert = () => {
  const { tasks, currentUser, dismissNotification } = useStore();
  const [activeNotification, setActiveNotification] = useState<Task | null>(null);

  const triggerAlert = (task: Task) => {
    setActiveNotification(task);
    try {
      new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3').play();
    } catch (e) {
      console.warn("Audio play failed", e);
    }
  };

  useEffect(() => {
    const checkReminders = () => {
      if (!currentUser) return;
      
      const now = new Date();
      tasks.forEach(t => {
        if (t.status === 'completed' || t.notified || !t.reminder || !t.dueDate || t.assigneeId !== currentUser.id) return;
        
        const due = new Date(t.dueDate);
        const remTime = new Date(due.getTime() - (parseInt(t.reminder) * 60000));
        
        if (now >= remTime) {
          triggerAlert(t);
        }
      });
    };

    const interval = setInterval(checkReminders, 30000);
    return () => clearInterval(interval);
  }, [tasks, currentUser]);

  const handleDismiss = () => {
    if (activeNotification) {
      dismissNotification(activeNotification.id);
      setActiveNotification(null);
    }
  };

  if (!activeNotification) return null;

  return (
    <div className="fixed top-6 right-6 z-[9999] animate-in slide-in-from-right-full duration-300">
      <div className="bg-[var(--bg-primary)] border-l-4 border-yellow-500 shadow-2xl p-5 rounded-r-xl flex items-center gap-5 min-w-[320px]">
        <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-600 animate-bounce">
          <i className="fas fa-bell text-xl"></i>
        </div>
        <div className="flex-1">
          <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-1">Upcoming Task</p>
          <p className="text-sm font-bold text-[var(--text-main)] line-clamp-2">{activeNotification.title}</p>
        </div>
        <button 
          onClick={handleDismiss}
          className="text-gray-400 hover:text-[var(--text-main)] p-2 transition-colors"
        >
          <i className="fas fa-times"></i>
        </button>
      </div>
    </div>
  );
};

export default ReminderAlert;
