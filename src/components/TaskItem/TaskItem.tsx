'use client';

import React from 'react';
import { Task } from '@/lib/types';
import { getLocalDateStr, isTimeOverdueToday, formatTimeStr } from '@/lib/date';
import { useStore } from '@/store/useStore';
import styles from './TaskItem.module.css';

interface TaskItemProps {
  task: Task;
  showAssignee?: boolean;
}

const TaskItem: React.FC<TaskItemProps> = ({ task, showAssignee }) => {
  const { toggleTaskCompletion, updateTaskStatus, toggleMyDay, deleteTask, users, openTaskDetail, updateTaskFields, currentUser } = useStore();
  
  const [localTitle, setLocalTitle] = React.useState(task.title);

  React.useEffect(() => {
    setLocalTitle(task.title);
  }, [task.title]);
  
  const dDate = task.dueDate ? new Date(task.dueDate.includes('T') ? task.dueDate : `${task.dueDate}T00:00`) : null;
  const now = new Date();
  const todayStr = getLocalDateStr();

  // Calculate overdue status dynamically
  const isDateOverdue = dDate && dDate < now && !task.dueDate?.startsWith(todayStr);
  const isTimeOverdue = !task.dueDate && task.dueTime && isTimeOverdueToday(task.dueTime);
  const isOverdue = (isDateOverdue || isTimeOverdue) && task.status !== 'completed';
  const assignee = users.find(u => u.id === task.assigneeId);
  const assigneeName = assignee?.name.split(' (')[0] || 'Unknown';

  const statusMap = {
    'pending': { label: 'Pending', class: styles.statusPending },
    'in_progress': { label: 'Doing', class: styles.statusProgress },
    'review': { label: 'In Review', class: styles.statusReview },
    'completed': { label: 'Completed', class: styles.statusCompleted }
  };
  
  const s = statusMap[task.status] || statusMap.pending;

  const priorityClass = task.priority ? styles[`priority${task.priority.toUpperCase()}`] : '';

  return (
    <div className={`${styles.taskItem} ${priorityClass} ${task.status === 'completed' ? 'opacity-50' : ''} transition-all hover:bg-[var(--bg-secondary)] px-4 group`}>
      {/* Checkbox on the left */}
      <div className="flex items-start pt-1.5 flex-shrink-0">
        <div 
          className={`${styles.checkbox} ${task.status === 'completed' ? styles.checked : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            toggleTaskCompletion(task.id);
          }}
        />
      </div>

      {/* Task Info Area */}
      <div 
        className="flex-1 min-w-0 cursor-pointer"
        onClick={() => openTaskDetail(task.id)}
      >
        <div className="flex items-center gap-2">
          <textarea
            value={localTitle}
            onChange={(e) => setLocalTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                e.currentTarget.blur();
                if (localTitle !== task.title) {
                  updateTaskFields(task.id, { title: localTitle }, currentUser?.name || 'Unknown');
                }
              }
            }}
            onBlur={() => {
              if (localTitle !== task.title) {
                updateTaskFields(task.id, { title: localTitle }, currentUser?.name || 'Unknown');
              }
            }}
            onClick={(e) => e.stopPropagation()}
            className={`${styles.titleTextarea} text-base font-bold tracking-tight text-[var(--text-main)] bg-transparent border-none outline-none resize-none overflow-hidden flex-1 ${
              task.status === 'completed' ? 'line-through text-[var(--text-muted)] opacity-60' : ''
            }`}
            rows={1}
            spellCheck={false}
            wrap="off"
          />
        </div>
        
        {/* Description (Todoist style) */}
        {task.desc && (
          <p className={`text-sm text-[var(--text-muted)] mt-1.5 pr-6 leading-relaxed break-words ${
            task.status === 'completed' ? 'line-through opacity-50' : ''
          }`}>
            {task.desc}
          </p>
        )}
        
        {/* Metadata Badges */}
        <div className="flex flex-wrap gap-2 mt-2 items-center">
          {/* Project */}
          {task.project && (
            <span className={`${styles.tagPill} text-green-600 dark:text-green-400 font-bold flex items-center gap-1`}>
              <i className="fas fa-circle text-[6px]"></i> {task.project}
            </span>
          )}

          {/* Due Date */}
          {(task.dueDate || task.dueTime) && (
            <span className={`text-[10px] font-bold flex items-center gap-1.5 ${
              isOverdue ? `${styles.overdue} animate-pulse` : 'text-orange-600 font-medium'
            }`}>
              <i className="fas fa-clock text-[9px]"></i> 
              
              {/* Case 1: Has a due date with optional time */}
              {task.dueDate && (
                task.dueDate.includes('T')
                  ? dDate?.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                  : dDate?.toLocaleDateString()
              )}
              
              {/* Case 2: Time-only (e.g., Recurring daily tasks) */}
              {!task.dueDate && task.dueTime && `Daily at ${formatTimeStr(task.dueTime)}`}
              
              {isOverdue && ' (Overdue)'}
            </span>
          )}
          
          {/* Tags */}
          {task.tags.map(tag => (
            <span key={tag} className={styles.tagPill}>{tag}</span>
          ))}
          
          {/* Recurrence */}
          {task.recurrence && (
            <span className={`${styles.tagPill} text-purple-500 flex items-center gap-1`}>
              <i className="fas fa-redo text-[8px]"></i> {task.recurrence}
            </span>
          )}
          
          {/* Assignee */}
          {showAssignee && (
            <span className={`${styles.tagPill} text-blue-500 font-bold flex items-center gap-1`}>
              <i className="fas fa-user text-[8px]"></i> {assigneeName}
            </span>
          )}
        </div>
      </div>

      {/* Task Row Actions */}
      <div className="flex items-center gap-2.5 flex-shrink-0">
        <select 
          value={task.status} 
          onChange={(e) => {
            const val = e.target.value as Task['status'];
            if (val === 'completed' && task.status !== 'completed') {
              toggleTaskCompletion(task.id);
            } else if (val !== 'completed' && task.status === 'completed') {
              toggleTaskCompletion(task.id);
            } else {
              updateTaskStatus(task.id, val);
            }
          }}
          onClick={(e) => e.stopPropagation()}
          className={`${styles.statusBadge} ${s.class} border-none outline-none cursor-pointer appearance-none text-center font-bold`}
        >
          <option value="pending">Pending</option>
          <option value="in_progress">Doing</option>
          <option value="review">Review</option>
          <option value="completed">Done</option>
        </select>

        <div className="flex items-center gap-2.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
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
    </div>
  );
};

export default TaskItem;
