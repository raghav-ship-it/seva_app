'use client';

import React from 'react';
import { useStore } from '@/store/useStore';
import TaskItem from '@/components/TaskItem/TaskItem';
import FAB from '@/components/FAB/FAB';
import { redirect } from 'next/navigation';
import ReminderAlert from '@/components/ReminderAlert';

export default function TrackPage() {
  const { tasks, currentUser } = useStore();
  
  if (currentUser?.role !== 'admin') {
    redirect('/home');
  }

  const activeTasks = tasks.filter(t => t.status !== 'completed');

  return (
    <div className="p-10 max-w-4xl mx-auto min-h-screen pb-32">
      <header className="mb-10">
        <h1 className="text-3xl font-extrabold text-[var(--text-main)] tracking-tight flex items-center gap-3">
          Everyone
          <span className="text-[10px] font-black bg-red-100 text-red-600 px-2 py-0.5 rounded-full uppercase tracking-widest">Admin</span>
        </h1>
        <p className="text-[var(--text-muted)] font-medium mt-1">Global visibility across all users.</p>
      </header>

      <section className="flex flex-col gap-1">
        {activeTasks.length > 0 ? (
          activeTasks.map(t => (
            <TaskItem key={t.id} task={t} showAssignee />
          ))
        ) : (
          <div className="py-20 text-center animate-in fade-in duration-500">
            <div className="w-20 h-20 bg-purple-50 rounded-full flex items-center justify-center text-purple-500 text-3xl mx-auto mb-6">
              <i className="fas fa-users"></i>
            </div>
            <h3 className="text-lg font-bold text-[var(--text-main)]">No active tasks globally</h3>
            <p className="text-sm text-[var(--text-muted)] mt-1">The whole team is caught up!</p>
          </div>
        )}
      </section>

      <FAB />
      <ReminderAlert />
    </div>
  );
}
