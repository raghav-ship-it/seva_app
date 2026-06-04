'use client';

import React from 'react';
import { Task } from '@/lib/types';
import { getLocalDateStr,isTimeOverdueToday,formatTimeStr } from '@/lib/date';
import { useStore } from '@/store/useStore';
import confetti from 'canvas-confetti';

interface TaskItemProps {
  task: Task;
  showAssignee?: boolean;
}

const TaskItem: React.FC<TaskItemProps> = ({ task, showAssignee }) => {
  const { toggleTaskCompletion, updateTaskStatus, toggleMyDay, deleteTask, users, openTaskDetail } = useStore();
  
  const dDate = task.dueDate ? new Date(task.dueDate) : null;
const now = new Date();
const todayStr = getLocalDateStr();

// Calculate overdue status dynamically
const isDateOverdue = dDate && dDate < now && !task.dueDate?.startsWith(todayStr);
const isTimeOverdue = !task.dueDate && task.dueTime && isTimeOverdueToday(task.dueTime);
const isOverdue = (isDateOverdue || isTimeOverdue) && task.status !== 'completed';
  const assignee = users.find(u => u.id === task.assigneeId);
  const assigneeName = assignee?.name.split(' (')[0] || 'Unknown';

  const statusMap = {
    'pending': { label: 'Pending', class: 'status-pending' },
    'in_progress': { label: 'Doing', class: 'status-progress' },
    'review': { label: 'In Review', class: 'status-review' },
    'completed': { label: 'Completed', class: 'status-completed' }
  };
  
  const s = statusMap[task.status] || statusMap.pending;

  const handleCompleteToggle = () => {
    if (task.status !== 'completed') {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.85, x: 0.5 },
        colors: ['#de4c4a', '#eb8909', '#246fe0', '#0e8a16', '#a855f7'],
        disableForReducedMotion: true
      });
    }
    toggleTaskCompletion(task.id);
  };

  return (
    <div className={`task-item ${task.priority} ${task.status === 'completed' ? 'opacity-50' : ''} transition-all hover:bg-[var(--bg-secondary)] px-4 group`}>
      {/* Checkbox */}
      <div 
        className={`checkbox ${task.status === 'completed' ? 'checked' : ''} mt-1`} 
        onClick={handleCompleteToggle}
        title={task.status === 'completed' ? "Mark as Incomplete" : "Mark as Completed"}
      />
      
      {/* Task Info Area */}
      <div 
        className="flex-1 min-w-0 cursor-pointer"
        onClick={() => openTaskDetail(task.id)}
      >
        <div className="flex items-center gap-2">
          <span className={`status-badge ${s.class}`}>{s.label}</span>
          <span className={`text-sm font-semibold tracking-tight text-[var(--text-main)] truncate ${
            task.status === 'completed' ? 'line-through text-[var(--text-muted)] font-medium' : ''
          }`}>
            {task.title}
          </span>
        </div>
        
        {/* Description (Todoist style) */}
        {task.desc && (
          <p className={`text-xs text-[var(--text-muted)] mt-1 pr-6 leading-normal break-words ${
            task.status === 'completed' ? 'line-through opacity-80' : ''
          }`}>
            {task.desc}
          </p>
        )}
        
        {/* Metadata Badges */}
        <div className="flex flex-wrap gap-2 mt-2 items-center">
          {/* Project */}
          {task.project && (
            <span className="tag-pill text-green-600 dark:text-green-400 font-bold flex items-center gap-1">
              <i className="fas fa-circle text-[6px]"></i> {task.project}
            </span>
          )}

          {/* Due Date */}
          {(task.dueDate || task.dueTime) && (
  <span className={`text-[10px] font-bold flex items-center gap-1.5 ${
    isOverdue ? 'text-red-500 font-extrabold animate-pulse' : 'text-orange-600 font-medium'
  }`}>
    <i className="fas fa-clock text-[9px]"></i> 
    
    {/* Case 1: Has both or just date */}
    {task.dueDate && dDate?.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
    
    {/* Case 2: Time-only (e.g., Recurring daily tasks) */}
    {!task.dueDate && task.dueTime && `Daily at ${formatTimeStr(task.dueTime)}`}
    
    {isOverdue && ' (Overdue)'}
  </span>
)}
          
          {/* Tags */}
          {task.tags.map(tag => (
            <span key={tag} className="tag-pill">{tag}</span>
          ))}
          
          {/* Recurrence */}
          {task.recurrence && (
            <span className="tag-pill text-purple-500 flex items-center gap-1">
              <i className="fas fa-redo text-[8px]"></i> {task.recurrence}
            </span>
          )}
          
          {/* Assignee */}
          {showAssignee && (
            <span className="tag-pill text-blue-500 font-bold flex items-center gap-1">
              <i className="fas fa-user text-[8px]"></i> {assigneeName}
            </span>
          )}
        </div>
      </div>

      {/* Task Row Actions */}
      <div className="flex items-center gap-2.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <select 
          value={task.status} 
          onChange={(e) => updateTaskStatus(task.id, e.target.value as any)}
          className="text-[10px] bg-[var(--bg-primary)] border border-[var(--border-color)] rounded px-1.5 py-0.5 outline-none font-medium cursor-pointer transition-colors hover:border-gray-400 text-[var(--text-main)]"
        >
          <option value="pending">Pending</option>
          <option value="in_progress">Doing</option>
          <option value="review">Review</option>
          <option value="completed">Done</option>
        </select>
        
        <button 
          onClick={() => toggleMyDay(task.id)}
          className={`w-7 h-7 rounded-lg hover:bg-[var(--border-color)] flex items-center justify-center transition-all ${
            task.myDay ? 'text-yellow-500' : 'text-gray-400 hover:text-yellow-400'
          }`}
          title={task.myDay ? "Remove from My Day" : "Add to My Day"}
        >
          <i className="fas fa-sun text-sm"></i>
        </button>
        
        <button 
          onClick={() => deleteTask(task.id)}
          className="w-7 h-7 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 flex items-center justify-center text-gray-400 hover:text-red-500 transition-all"
          title="Delete task"
        >
          <i className="fas fa-trash text-xs"></i>
        </button>
      </div>
    </div>
  );
};

export default TaskItem;
