'use client';

import React from 'react';
import { useStore } from '@/store/useStore';
import TaskItem from '@/components/TaskItem/TaskItem';
import FAB from '@/components/FAB/FAB';
import ReminderAlert from '@/components/ReminderAlert';
import { getLocalDateStr } from '@/lib/date';
import { doesTaskOccurOnDate } from '@/lib/recurrence';

// Integrated SunLottie Component with matching background capabilities
function SunLottie({ className, size = 240 }: { className?: string; size?: number; }) {
  const wrapperStyle: React.CSSProperties = {
    width: size,
    height: size,
    borderRadius: '50%',
    overflow: 'hidden',
    display: 'inline-block',
    background: 'transparent', // Modified to perfectly match the layout background
    boxShadow: '0 8px 24px rgba(245, 158, 11, 0.15)' // Warm ambient glow matching the yellow sun accent
  };

  const videoStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
    pointerEvents: 'none'
  };

  return (
    <div className={className} style={wrapperStyle} aria-hidden>
      <video
        src="/animations/my-day.mp4"
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        style={videoStyle}
      />
    </div>
  );
}

export default function HomePage() {
  const { tasks, currentUser, clearMyDay } = useStore();
  
  const todayStr = getLocalDateStr();

  const myDayTasks = tasks.filter(t => 
    t.myDay && 
    t.assigneeId === currentUser?.id && 
    t.status !== 'completed'
  );

  const suggestions = tasks.filter(t => 
    !t.myDay && 
    (t.dueDate?.startsWith(todayStr) || doesTaskOccurOnDate(t.dueDate, t.recurrence, todayStr)) &&
    t.assigneeId === currentUser?.id && 
    t.status !== 'completed'
  );

  return (
    <div className="p-10 max-w-4xl mx-auto min-h-screen pb-32">
      <header className="mb-10 flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-[var(--text-main)] tracking-tight">My Day</h1>
          <p className="text-[var(--text-muted)] font-medium mt-1">Focus on what matters most today.</p>
        </div>
        {myDayTasks.length > 0 && (
          <button 
            onClick={clearMyDay}
            className="text-xs font-bold text-orange-500 hover:text-orange-600 flex items-center gap-2 transition-colors px-3 py-1.5 hover:bg-orange-50 rounded-lg"
          >
            <i className="fas fa-magic"></i> Clear My Day
          </button>
        )}
      </header>

      <section className="flex flex-col gap-1">
        {myDayTasks.length > 0 ? (
          myDayTasks.map(t => (
            <TaskItem key={t.id} task={t} />
          ))
        ) : (
          <div className="py-12 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Replaced static icon element with your large, sleek SunLottie component */}
            <div className="flex items-center justify-center mb-6">
              <SunLottie />
            </div>
            <h3 className="text-xl font-bold text-[var(--text-main)] mt-4">What do you need to get done Today?</h3>
            <p className="text-sm text-[var(--text-muted)] mt-1">By default, tasks added here will be scheduled for today. Tap + to add a task.</p>
          </div>
        )}
      </section>

      {suggestions.length > 0 && (
        <section className="mt-16 animate-in fade-in duration-1000">
          <h3 className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.2em] mb-6 border-b border-[var(--border-color)] pb-3">
            Suggested for today
          </h3>
          <div className="flex flex-col gap-1">
            {suggestions.map(t => (
              <TaskItem key={t.id} task={t} />
            ))}
          </div>
        </section>
      )}

      <FAB />
      <ReminderAlert />
    </div>
  );
}