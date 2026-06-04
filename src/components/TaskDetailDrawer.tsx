'use client';

import React, { useState, useEffect, useRef } from 'react';
import { getLocalIsoDateTime } from '@/lib/date';
import { useStore } from '@/store/useStore';
import { Priority, Recurrence, TaskAttachment } from '@/lib/types';

const WISDOM_QUOTES: Record<string, { quote: string; source: string }> = {
  'work': {
    quote: "Perform your prescribed duty, for action is better than inaction.",
    source: "Bhagavad-gita 3.8"
  },
  'marketing': {
    quote: "Whatever action a great man performs, common men follow.",
    source: "Bhagavad-gita 3.21"
  },
  'urgent': {
    quote: "One who does not react to the dualities of pleasure and pain is fit for liberation.",
    source: "Bhagavad-gita 2.15"
  },
  'low-effort': {
    quote: "Yoga is the journey of the self, through the self, to the self.",
    source: "Bhagavad-gita 6.18"
  },
  'personal': {
    quote: "A person who is not disturbed by the incessant flow of desires can alone achieve peace.",
    source: "Bhagavad-gita 2.70"
  },
  'shopping': {
    quote: "He who is regulated in his habits of eating and sleeping can mitigate all pains.",
    source: "Bhagavad-gita 6.17"
  },
  'cleaning': {
    quote: "The temple of the Lord should be kept clean and decorated. Cleanliness is next to godliness.",
    source: "Nectar of Devotion"
  }
};

const TaskDetailDrawer = () => {
  const { 
    tasks, 
    activeDetailTaskId, 
    closeTaskDetail, 
    currentUser, 
    users, 
    projects, 
    tags,
    updateTaskFields, 
    addTaskComment,
    addTag,
    addProject
  } = useStore();

  const task = tasks.find(t => t.id === activeDetailTaskId);
  
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [commentText, setCommentText] = useState('');
  const [stagedAttachments, setStagedAttachments] = useState<TaskAttachment[]>([]);
  const [activeSelect, setActiveSelect] = useState<'assignee' | 'project' | 'priority' | 'reminder' | 'recurrence' | 'tags' | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const timelineEndRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load task data when task changes
  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDesc(task.desc);
      setCommentText('');
      setStagedAttachments([]);
      setActiveSelect(null);
    }
  }, [task]);

  // Scroll to bottom of timeline when logs/comments change
  useEffect(() => {
    if (task) {
      timelineEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [task?.logs, task?.comments]);

  // Click outside to close dropdowns
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setActiveSelect(null);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  if (!task || !currentUser) return null;

  // Determine unimplemented tokens for the carousel
  const emptyTokens: Array<{ name: string; icon: string; type: string }> = [];
  if (!task.dueDate) emptyTokens.push({ name: 'Due Date', icon: 'calendar', type: 'dueDate' });
  if (!task.assigneeId) emptyTokens.push({ name: 'Assignee', icon: 'user', type: 'assigneeId' });
  if (!task.project) emptyTokens.push({ name: 'Project', icon: 'circle text-[6px]', type: 'project' });
  if (task.tags.length === 0) emptyTokens.push({ name: 'Tags', icon: 'hashtag', type: 'tags' });
  if (!task.reminder) emptyTokens.push({ name: 'Reminder', icon: 'bell', type: 'reminder' });
  if (!task.recurrence) emptyTokens.push({ name: 'Recurrence', icon: 'redo', type: 'recurrence' });

  // Handle auto-saving fields on blur/change
  const handleFieldChange = (fields: Partial<typeof task>) => {
    updateTaskFields(task.id, fields, currentUser.name);
  };

  const handleCarouselClick = (type: string) => {
    if (type === 'dueDate') {
      const today = getLocalIsoDateTime(0, '12:00');
      handleFieldChange({ dueDate: today });
    } else if (type === 'assigneeId') {
      handleFieldChange({ assigneeId: currentUser.id });
    } else if (type === 'project') {
      handleFieldChange({ project: projects[0] || 'Work' });
    } else if (type === 'tags') {
      handleFieldChange({ tags: ['Work'] });
    } else if (type === 'reminder') {
      handleFieldChange({ reminder: '10' });
    } else if (type === 'recurrence') {
      handleFieldChange({ recurrence: 'daily' });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const newAttachments: TaskAttachment[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const sizeStr = (file.size / 1024).toFixed(1) + ' KB';
      newAttachments.push({ name: file.name, size: sizeStr });
    }
    setStagedAttachments(prev => [...prev, ...newAttachments]);
  };

  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() && stagedAttachments.length === 0) return;
    
    addTaskComment(task.id, currentUser.name, commentText.trim(), stagedAttachments);
    setCommentText('');
    setStagedAttachments([]);
  };

  const removeStagedAttachment = (index: number) => {
    setStagedAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // Compile chronologically combined timeline of logs and comments
  const combinedTimeline = [
    ...(task.logs || []).map(l => ({ ...l, sortKey: l.timestamp, isLog: true })),
    ...(task.comments || []).map(c => ({ ...c, sortKey: c.timestamp, isLog: false }))
  ].sort((a, b) => a.sortKey.localeCompare(b.sortKey));

  // Wisdom Panel tags
  const activeWisdom = task.tags
    .map(t => WISDOM_QUOTES[t.toLowerCase()])
    .find(q => q !== undefined);

  return (
    <div className="fixed inset-0 z-[1000] flex items-end justify-center drawer-overlay">
      {/* Clicking overlay closes drawer */}
      <div className="absolute inset-0" onClick={closeTaskDetail} />
      
      <div className="relative bg-[var(--bg-primary)] border-t border-[var(--border-color)] w-full max-w-2xl h-[85vh] max-h-[750px] rounded-t-2xl shadow-2xl flex flex-col drawer-slide-up overflow-visible">
        
        {/* Drawer Handle / Drag bar */}
        <div className="w-full flex justify-center py-3 cursor-pointer" onClick={closeTaskDetail}>
          <div className="w-12 h-1.5 bg-gray-300 dark:bg-neutral-700 rounded-full hover:bg-gray-400 transition-colors" />
        </div>

        {/* Close Button */}
        <button 
          onClick={closeTaskDetail}
          className="absolute right-5 top-4 w-8 h-8 rounded-lg hover:bg-[var(--border-color)] flex items-center justify-center text-gray-400 hover:text-[var(--text-main)] transition-colors active:scale-95"
          title="Close drawer"
        >
          <i className="fas fa-times"></i>
        </button>

        {/* Header / Editable Area */}
        <div className="px-6 pb-2 border-b border-[var(--border-color)]">
          <input 
            type="text" 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => handleFieldChange({ title: title.trim() })}
            className="w-[90%] text-lg font-bold bg-transparent text-[var(--text-main)] outline-none border-b border-transparent focus:border-red-500/30 py-1"
            placeholder="Task title"
          />
          <textarea 
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            onBlur={() => handleFieldChange({ desc: desc.trim() })}
            className="w-full mt-1.5 text-xs text-[var(--text-muted)] bg-transparent outline-none border-b border-transparent focus:border-red-500/20 py-1 resize-none h-[40px] no-scrollbar"
            placeholder="Add description..."
          />
        </div>

        {/* Scrollable Contents (Split into metadata + timeline) */}
        <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-6 no-scrollbar">
          
          {/* 1. Unimplemented Carousel */}
          {emptyTokens.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Unimplemented Shorthands</p>
              <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar scroll-smooth">
                {emptyTokens.map(tok => (
                  <button
                    key={tok.type}
                    onClick={() => handleCarouselClick(tok.type)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-muted)] text-xs font-semibold hover:border-[var(--accent)] hover:text-[var(--accent)] transition-all cursor-pointer whitespace-nowrap active:scale-95"
                  >
                    <i className={`fas fa-${tok.icon} text-[10px]`}></i>
                    <span>+ Add {tok.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 2. Implemented Vertical Details */}
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Task Details</p>
            <div className="flex flex-col gap-2 relative" ref={dropdownRef}>
              
              {/* Due Date */}
              {task.dueDate && (
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)]">
                  <span className="text-xs font-bold text-[var(--text-muted)] flex items-center gap-2">
                    <i className="fas fa-calendar w-4 text-center"></i> Due Date
                  </span>
                  <div className="flex items-center gap-2">
                    <input 
                      type="datetime-local" 
                      value={task.dueDate}
                      onChange={(e) => handleFieldChange({ dueDate: e.target.value })}
                      className="text-xs p-1 border border-[var(--border-color)] rounded bg-[var(--bg-primary)] text-[var(--text-main)] outline-none"
                    />
                    <button 
                      onClick={() => handleFieldChange({ dueDate: null })} 
                      className="text-xs text-gray-400 hover:text-red-500 p-1"
                      title="Clear field"
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                </div>
              )}

              {/* Assignee */}
              {task.assigneeId && (
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)]">
                  <span className="text-xs font-bold text-[var(--text-muted)] flex items-center gap-2">
                    <i className="fas fa-user w-4 text-center"></i> Assignee
                  </span>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setActiveSelect(activeSelect === 'assignee' ? null : 'assignee')}
                      className="text-xs font-semibold px-2 py-1 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded text-[var(--text-main)] hover:bg-[var(--border-color)]"
                    >
                      {users.find(u => u.id === task.assigneeId)?.name.split(' (')[0] || 'Unassigned'}
                    </button>
                    <button 
                      onClick={() => handleFieldChange({ assigneeId: '' })} 
                      className="text-xs text-gray-400 hover:text-red-500 p-1"
                      title="Clear field"
                    >
                      <i className="fas fa-times"></i>
                    </button>

                    {activeSelect === 'assignee' && (
                      <div className="absolute right-0 top-full mt-1 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl shadow-2xl p-2 z-50 min-w-[180px] flex flex-col gap-0.5">
                        {users.map(u => (
                          <button
                            key={u.id}
                            onClick={() => { handleFieldChange({ assigneeId: u.id }); setActiveSelect(null); }}
                            className={`text-left px-2.5 py-1.5 text-xs font-medium rounded-lg hover:bg-[var(--border-color)] ${task.assigneeId === u.id ? 'bg-red-50 text-[var(--accent)] font-semibold' : ''}`}
                          >
                            {u.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Project */}
              {task.project && (
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)]">
                  <span className="text-xs font-bold text-[var(--text-muted)] flex items-center gap-2">
                    <i className="fas fa-circle text-[6px] w-4 text-center"></i> Project
                  </span>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setActiveSelect(activeSelect === 'project' ? null : 'project')}
                      className="text-xs font-semibold px-2 py-1 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded text-[var(--text-main)] hover:bg-[var(--border-color)]"
                    >
                      {task.project}
                    </button>
                    <button 
                      onClick={() => handleFieldChange({ project: null })} 
                      className="text-xs text-gray-400 hover:text-red-500 p-1"
                      title="Clear field"
                    >
                      <i className="fas fa-times"></i>
                    </button>

                    {activeSelect === 'project' && (
                      <div className="absolute right-0 top-full mt-1 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl shadow-2xl p-2 z-50 min-w-[180px] flex flex-col gap-0.5">
                        {projects.map(p => (
                          <button
                            key={p}
                            onClick={() => { handleFieldChange({ project: p }); setActiveSelect(null); }}
                            className={`text-left px-2.5 py-1.5 text-xs font-medium rounded-lg hover:bg-[var(--border-color)] ${task.project === p ? 'bg-green-50 text-green-600 font-semibold' : ''}`}
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Priority */}
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)]">
                <span className="text-xs font-bold text-[var(--text-muted)] flex items-center gap-2">
                  <i className="fas fa-flag w-4 text-center"></i> Priority
                </span>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setActiveSelect(activeSelect === 'priority' ? null : 'priority')}
                    className={`text-xs font-bold px-2 py-1 border rounded uppercase ${
                      task.priority === 'p1' ? 'text-red-500 border-red-200 bg-red-50' :
                      task.priority === 'p2' ? 'text-orange-500 border-orange-200 bg-orange-50' :
                      task.priority === 'p3' ? 'text-blue-500 border-blue-200 bg-blue-50' : 'text-gray-400 border-gray-200 bg-gray-50'
                    }`}
                  >
                    {task.priority.toUpperCase()}
                  </button>

                  {activeSelect === 'priority' && (
                    <div className="absolute right-0 top-full mt-1 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl shadow-2xl p-1.5 z-50 min-w-[120px] flex flex-col gap-0.5">
                      {(['p1', 'p2', 'p3', 'p4'] as Priority[]).map(p => (
                        <button
                          key={p}
                          onClick={() => { handleFieldChange({ priority: p }); setActiveSelect(null); }}
                          className="text-left px-2.5 py-1 text-xs font-semibold hover:bg-[var(--bg-secondary)] rounded-md flex items-center gap-2"
                        >
                          <i className={`fas fa-flag ${
                            p === 'p1' ? 'text-red-500' :
                            p === 'p2' ? 'text-orange-500' :
                            p === 'p3' ? 'text-blue-500' : 'text-gray-400'
                          }`}></i>
                          <span>{p.toUpperCase()}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Tags */}
              {task.tags.length > 0 && (
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)]">
                  <span className="text-xs font-bold text-[var(--text-muted)] flex items-center gap-2">
                    <i className="fas fa-hashtag w-4 text-center"></i> Tags
                  </span>
                  <div className="flex items-center gap-2 flex-wrap justify-end max-w-[65%]">
                    {task.tags.map(t => (
                      <span key={t} className="tag-pill text-purple-600 dark:text-purple-400 font-bold flex items-center gap-1">
                        {t}
                        <button 
                          onClick={() => handleFieldChange({ tags: task.tags.filter(tag => tag !== t) })}
                          className="hover:text-red-500 ml-0.5 text-[9px]"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                    <button 
                      onClick={() => setActiveSelect(activeSelect === 'tags' ? null : 'tags')}
                      className="text-[10px] font-bold text-gray-400 hover:text-[var(--text-main)] px-1.5 py-0.5 border border-dashed border-gray-300 rounded"
                    >
                      + Add
                    </button>

                    {activeSelect === 'tags' && (
                      <div className="absolute right-0 top-full mt-1 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl shadow-2xl p-2 z-50 min-w-[180px] max-h-[160px] overflow-y-auto flex flex-col gap-0.5">
                        {tags.filter(t => !task.tags.includes(t)).map(t => (
                          <button
                            key={t}
                            onClick={() => { handleFieldChange({ tags: [...task.tags, t] }); setActiveSelect(null); }}
                            className="text-left px-2.5 py-1.5 text-xs font-medium rounded-lg hover:bg-[var(--border-color)]"
                          >
                            #{t}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Reminder */}
              {task.reminder && (
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)]">
                  <span className="text-xs font-bold text-[var(--text-muted)] flex items-center gap-2">
                    <i className="fas fa-bell w-4 text-center"></i> Reminder
                  </span>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setActiveSelect(activeSelect === 'reminder' ? null : 'reminder')}
                      className="text-xs font-semibold px-2 py-1 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded text-[var(--text-main)] hover:bg-[var(--border-color)]"
                    >
                      {task.reminder}m before
                    </button>
                    <button 
                      onClick={() => handleFieldChange({ reminder: null })} 
                      className="text-xs text-gray-400 hover:text-red-500 p-1"
                      title="Clear field"
                    >
                      <i className="fas fa-times"></i>
                    </button>

                    {activeSelect === 'reminder' && (
                      <div className="absolute right-0 top-full mt-1 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl shadow-2xl p-2 z-50 min-w-[150px] flex flex-col gap-0.5">
                        {[
                          { label: 'At due time', val: '0' },
                          { label: '10m before', val: '10' },
                          { label: '30m before', val: '30' },
                          { label: '1h before', val: '60' }
                        ].map(r => (
                          <button
                            key={r.val}
                            onClick={() => { handleFieldChange({ reminder: r.val }); setActiveSelect(null); }}
                            className={`text-left px-2.5 py-1.5 text-xs font-medium rounded-lg hover:bg-[var(--border-color)] ${task.reminder === r.val ? 'bg-red-50 text-[var(--accent)]' : ''}`}
                          >
                            {r.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Recurrence */}
              {task.recurrence && (
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)]">
                  <span className="text-xs font-bold text-[var(--text-muted)] flex items-center gap-2">
                    <i className="fas fa-redo w-4 text-center text-xs"></i> Recurrence
                  </span>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setActiveSelect(activeSelect === 'recurrence' ? null : 'recurrence')}
                      className="text-xs font-semibold px-2 py-1 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded text-[var(--text-main)] hover:bg-[var(--border-color)] capitalize"
                    >
                      {task.recurrence}
                    </button>
                    <button 
                      onClick={() => handleFieldChange({ recurrence: null })} 
                      className="text-xs text-gray-400 hover:text-red-500 p-1"
                      title="Clear field"
                    >
                      <i className="fas fa-times"></i>
                    </button>

                    {activeSelect === 'recurrence' && (
                      <div className="absolute right-0 top-full mt-1 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl shadow-2xl p-2 z-50 min-w-[140px] flex flex-col gap-0.5">
                        {[
                          { label: 'Daily', val: 'daily' },
                          { label: 'Weekly', val: 'weekly' },
                          { label: 'Monthly', val: 'monthly' }
                        ].map(rec => (
                          <button
                            key={rec.val}
                            onClick={() => { handleFieldChange({ recurrence: rec.val as any }); setActiveSelect(null); }}
                            className={`text-left px-2.5 py-1.5 text-xs font-medium rounded-lg hover:bg-[var(--border-color)] capitalize ${task.recurrence === rec.val ? 'bg-red-50 text-[var(--accent)] font-semibold' : ''}`}
                          >
                            {rec.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* 3. Dynamic Wisdom Card */}
          {activeWisdom && (
            <div className="p-4 bg-orange-50/50 dark:bg-orange-950/10 border-l-4 border-orange-500 rounded-r-xl">
              <div className="text-[10px] font-bold text-orange-600 dark:text-orange-400 uppercase tracking-widest flex items-center gap-1.5 mb-1">
                <i className="fas fa-feather-alt"></i> Wisdom panel
              </div>
              <p className="text-xs text-[var(--text-muted)] italic leading-relaxed">
                "{activeWisdom.quote}"
              </p>
              <span className="block text-[10px] font-semibold text-gray-500 text-right mt-0.5">
                — {activeWisdom.source}
              </span>
            </div>
          )}

          {/* 4. Activity & Threaded Comments Timeline */}
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Activity & Threads</p>
            <div className="flex flex-col gap-4">
              {combinedTimeline.length > 0 ? (
                combinedTimeline.map((item, index) => {
                  const dateFormatted = new Date(item.sortKey).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' on ' + new Date(item.sortKey).toLocaleDateString([], { month: 'short', day: 'numeric' });
                  
                  if (item.isLog) {
                    // System activity log (non-editable)
                    return (
                      <div key={item.id || index} className="timeline-item-system text-xs py-1">
                        <span className="font-bold text-[var(--text-main)]">{item.user} </span>
                        <span className="text-[var(--text-muted)] italic">{item.text}</span>
                        <span className="block text-[9px] text-gray-400 mt-0.5">{dateFormatted}</span>
                      </div>
                    );
                  } else {
                    // User threaded comment
                    return (
                      <div key={item.id || index} className="timeline-item-comment py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-red-100 dark:bg-red-950/30 text-[var(--accent)] flex items-center justify-center text-[10px] font-black uppercase">
                            {item.author?.charAt(0)}
                          </div>
                          <div>
                            <span className="text-xs font-bold text-[var(--text-main)]">{item.author}</span>
                            <span className="text-[9px] text-gray-400 ml-2">{dateFormatted}</span>
                          </div>
                        </div>
                        <p className="text-xs text-[var(--text-main)] mt-1.5 pl-0.5 leading-relaxed bg-[var(--bg-secondary)] border border-[var(--border-color)] px-3 py-2 rounded-xl">
                          {item.text}
                        </p>
                        
                        {/* Attachments inside comment */}
                        {item.attachments && item.attachments.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2 pl-0.5">
                            {item.attachments.map((att, aIdx) => (
                              <button
                                key={aIdx}
                                onClick={() => alert(`Simulated file download of "${att.name}" (${att.size})`)}
                                className="inline-flex items-center gap-2 text-[10px] px-2.5 py-1.5 border border-[var(--border-color)] rounded-lg bg-[var(--bg-primary)] hover:border-red-500 hover:text-red-500 transition-colors"
                              >
                                <i className="fas fa-file-alt text-gray-400"></i>
                                <span className="font-semibold truncate max-w-[120px]">{att.name}</span>
                                <span className="text-[9px] text-gray-400">({att.size})</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  }
                })
              ) : (
                <div className="text-center py-6 text-xs text-gray-400 italic">No comments or activity log yet.</div>
              )}
              <div ref={timelineEndRef} />
            </div>
          </div>

        </div>

        {/* Unified Comment / Attachment input form */}
        <form onSubmit={handlePostComment} className="p-4 border-t border-[var(--border-color)] bg-[var(--bg-secondary)] rounded-b-2xl">
          {/* Staged attachments list */}
          {stagedAttachments.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {stagedAttachments.map((att, index) => (
                <span key={index} className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-1 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg text-[var(--text-main)]">
                  <i className="fas fa-paperclip text-gray-400"></i>
                  <span className="truncate max-w-[120px]">{att.name}</span>
                  <button type="button" onClick={() => removeStagedAttachment(index)} className="text-red-500 ml-1 hover:text-red-600">✕</button>
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2.5">
            {/* Attachment paperclip trigger */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-8 h-8 rounded-lg hover:bg-[var(--border-color)] border border-[var(--border-color)] bg-[var(--bg-primary)] flex items-center justify-center text-gray-400 hover:text-[var(--text-main)] transition-colors active:scale-95"
              title="Add attachment"
            >
              <i className="fas fa-paperclip"></i>
            </button>
            <input 
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleFileUpload}
            />

            <input 
              type="text" 
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Post a comment or update to the thread..."
              className="flex-1 text-xs py-2 px-3 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl outline-none focus:border-red-500/30 text-[var(--text-main)] transition-colors"
            />
            
            <button
              type="submit"
              disabled={!commentText.trim() && stagedAttachments.length === 0}
              className="px-4 py-2 bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] font-bold text-xs rounded-xl shadow-md shadow-red-500/10 disabled:opacity-40 disabled:pointer-events-none transition-all active:scale-95"
            >
              Send
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default TaskDetailDrawer;
