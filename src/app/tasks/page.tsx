'use client';

import React from 'react';
import { useStore } from '@/store/useStore';
import TaskItem from '@/components/TaskItem';
import FAB from '@/components/FAB';
import ReminderAlert from '@/components/ReminderAlert';

export default function TasksPage() {
  const { tasks, currentUser, clearCompleted } = useStore();
  
  const inboxTasks = tasks.filter(t => 
    t.assigneeId === currentUser?.id && 
    t.status !== 'completed'
  );

  const completedCount = tasks.filter(t => 
    t.assigneeId === currentUser?.id && 
    t.status === 'completed'
  ).length;

  return (
    <div className="p-5 md:p-10 max-w-4xl mx-auto min-h-screen pb-32 animate-in fade-in duration-500">
      <header className="mb-6 md:mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[var(--text-main)] tracking-tight">Inbox</h1>
          <p className="text-xs md:text-sm text-[var(--text-muted)] font-medium mt-1">Everything assigned to you.</p>
        </div>
        {completedCount > 0 && (
          <button 
            onClick={clearCompleted}
            className="text-[10px] md:text-sm font-bold text-gray-400 hover:text-red-500 transition-colors flex items-center gap-2 self-start md:self-auto"
          >
            <i className="fas fa-broom"></i> Clear Completed ({completedCount})
          </button>
        )}
      </header>

      <section className="flex flex-col gap-1">
        {inboxTasks.length > 0 ? (
          inboxTasks.map(t => (
            <TaskItem key={t.id} task={t} />
          ))
        ) : (
          <div className="py-20 text-center">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-blue-50 rounded-full flex items-center justify-center text-blue-500 text-2xl md:text-3xl mx-auto mb-6">
              <i className="fas fa-inbox"></i>
            </div>
            <h3 className="text-base md:text-lg font-bold text-[var(--text-main)]">Inbox is empty</h3>
            <p className="text-xs md:text-sm text-[var(--text-muted)] mt-1">Ready for a new adventure?</p>
          </div>
        )}
      </section>

      <FAB />
      <ReminderAlert />
    </div>
  );
}
