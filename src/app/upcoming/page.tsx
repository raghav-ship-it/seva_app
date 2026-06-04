'use client';

import React from 'react';
import { useStore } from '@/store/useStore';
import TaskItem from '@/components/TaskItem';
import FAB from '@/components/FAB';
import ReminderAlert from '@/components/ReminderAlert';

export default function UpcomingPage() {
  const { tasks, currentUser, openQuickEntry } = useStore();
  
  if (!currentUser) return null;

  const now = new Date();
  
  // Format reference dates relative to user local time
  const getLocalDateStr = (offset = 0) => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayStr = getLocalDateStr(0);
  const tomorrowStr = getLocalDateStr(1);

  // Generate date strings for next 7 days (including today and tomorrow) for mapping
  const nextDaysStr: string[] = [];
  const nextDaysLabels: string[] = [];
  
  // Let's list next 7 days (day 2 to day 7)
  for (let i = 2; i <= 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    nextDaysStr.push(dateStr);
    
    const label = d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    nextDaysLabels.push(label);
  }

  // Filter tasks assigned to current user and pending
  const myTasks = tasks.filter(t => t.assigneeId === currentUser.id && t.status !== 'completed');

  // Group tasks
  const overdue: typeof tasks = [];
  const today: typeof tasks = [];
  const tomorrow: typeof tasks = [];
  const next7Days: { label: string; dateStr: string; tasks: typeof tasks }[] = nextDaysStr.map((dateStr, index) => ({
    label: nextDaysLabels[index],
    dateStr,
    tasks: []
  }));
  const later: typeof tasks = [];
  const noDate: typeof tasks = [];

  myTasks.forEach(t => {
    if (!t.dueDate) {
      noDate.push(t);
      return;
    }

    const tDateStr = t.dueDate.split('T')[0];

    if (tDateStr < todayStr) {
      overdue.push(t);
    } else if (tDateStr === todayStr) {
      today.push(t);
    } else if (tDateStr === tomorrowStr) {
      tomorrow.push(t);
    } else {
      const nextIndex = nextDaysStr.indexOf(tDateStr);
      if (nextIndex !== -1) {
        next7Days[nextIndex].tasks.push(t);
      } else {
        later.push(t);
      }
    }
  });

  const renderSection = (title: string, taskList: typeof tasks, datePreset: string | null, isOverdue = false) => {
    return (
      <section className="group/section mb-10 transition-all">
        <h2 className="text-sm font-bold border-b border-[var(--border-color)] pb-2 mb-3 text-[var(--text-main)] flex items-center justify-between">
          <span className="flex items-center gap-2">
            {title}
            {isOverdue && (
              <span className="text-[10px] font-black bg-red-100 text-red-600 px-2 py-0.5 rounded-full uppercase tracking-wider">
                Overdue
              </span>
            )}
          </span>
          <button 
            onClick={() => {
              // Open quick entry pre-populated with local date and 12:00 default time
              const isoString = datePreset ? `${datePreset}T12:00` : null;
              openQuickEntry({ dueDate: isoString });
            }}
            className="text-xs text-red-500 hover:text-red-600 font-bold opacity-0 group-hover/section:opacity-100 transition-opacity flex items-center gap-1"
          >
            <i className="fas fa-plus text-[10px]"></i> Add task
          </button>
        </h2>
        
        <div className="flex flex-col gap-0.5">
          {taskList.length > 0 ? (
            taskList.map(t => (
              <TaskItem key={t.id} task={t} />
            ))
          ) : (
            <p className="text-xs text-[var(--text-muted)] italic py-2 pl-4">No tasks scheduled.</p>
          )}
        </div>
      </section>
    );
  };

  const todayLabel = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }) + " • Today";
  const tomorrowLabel = new Date(Date.now() + 86400000).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }) + " • Tomorrow";

  return (
    <div className="p-10 max-w-4xl mx-auto min-h-screen pb-32">
      <header className="mb-10">
        <h1 className="text-3xl font-extrabold text-[var(--text-main)] tracking-tight">Upcoming</h1>
        <p className="text-[var(--text-muted)] font-medium mt-1">Calendar schedule of tasks assigned to you.</p>
      </header>

      {/* Render Overdue if there are any */}
      {overdue.length > 0 && renderSection("Overdue Tasks", overdue, todayStr, true)}

      {/* Today */}
      {renderSection(todayLabel, today, todayStr)}

      {/* Tomorrow */}
      {renderSection(tomorrowLabel, tomorrow, tomorrowStr)}

      {/* Next 7 Days */}
      {next7Days.map(dayGroup => 
        renderSection(dayGroup.label, dayGroup.tasks, dayGroup.dateStr)
      )}

      {/* Later */}
      {renderSection("Later", later, getLocalDateStr(8))}

      {/* No Date */}
      {renderSection("No Due Date", noDate, null)}

      <FAB />
      <ReminderAlert />
    </div>
  );
}
