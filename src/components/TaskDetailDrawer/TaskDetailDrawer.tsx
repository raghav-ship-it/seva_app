'use client';

import React, { useState, useEffect, useRef } from 'react';
import { getLocalIsoDateTime } from '@/lib/date';
import { useStore } from '@/store/useStore';
import { Priority, Recurrence, TaskAttachment } from '@/lib/types';
import styles from './TaskDetailDrawer.module.css';


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
  } = useStore();

  const task = tasks.find(t => t.id === activeDetailTaskId);
  
  const [title, setTitle] = useState(task?.title || '');
  const [desc, setDesc] = useState(task?.desc || '');
  const [commentText, setCommentText] = useState('');
  const [stagedAttachments, setStagedAttachments] = useState<TaskAttachment[]>([]);
  const [activeSelect, setActiveSelect] = useState<'assignee' | 'project' | 'priority' | 'reminder' | 'recurrence' | 'tags' | 'alarm' | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const timelineEndRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef(0);

  // Swipe-to-close logic
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEndY = e.changedTouches[0].clientY;
    if (touchEndY - touchStartY.current > 100) {
      closeTaskDetail();
    }
  };

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
  if (!task.project) emptyTokens.push({ name: 'Project', icon: 'folder', type: 'project' });
  if (task.tags.length === 0) emptyTokens.push({ name: 'Tags', icon: 'tag', type: 'tags' });
  if (!task.priority) emptyTokens.push({ name: 'Priority', icon: 'flag', type: 'priority' });

  const handleUpdate = (fields: Partial<typeof task>) => {
    updateTaskFields(task.id, fields, currentUser.name);
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() && stagedAttachments.length === 0) return;
    addTaskComment(task.id, currentUser.name, commentText, stagedAttachments);
    setCommentText('');
    setStagedAttachments([]);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    const newAttachments: TaskAttachment[] = Array.from(files).map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      type: file.type.startsWith('image/') ? 'image' : 'file',
      url: URL.createObjectURL(file),
      size: `${Math.round(file.size / 1024)} KB`,
      uploadedAt: new Date().toISOString(),
      uploadedBy: currentUser.id
    }));
    
    setStagedAttachments([...stagedAttachments, ...newAttachments]);
  };

  const removeStagedAttachment = (id: string) => {
    setStagedAttachments(stagedAttachments.filter(a => a.id !== id));
  };

  // Activity Feed Combine (logs + comments)
  const activityFeed = [
    ...(task.logs || []).map(l => ({ ...l, type: 'log' })),
    ...(task.comments || []).map(c => ({ ...c, type: 'comment' }))
  ].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  // Gita Logic: Choose a quote based on project or description
  
  

  return (
    <div className={`fixed inset-0 z-[1000] flex items-end justify-center ${styles.drawerOverlay}`} onClick={closeTaskDetail}>
      {/* Gita Wisdom Tooltip/Floating Element */}
      <div 
        className={`relative ${styles.drawerContainer} ${styles.drawerSlideUp}`}
        onClick={e => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Header Drag Handle */}
        <div className={styles.handle} />
        
        <div className={styles.contentArea}>
          {/* Main Content Area */}
          <div className="flex flex-col gap-6">
            
            {/* Title & Top Action Bar */}
            <div className="flex flex-col gap-4">
              <div className="flex items-start justify-between">
                <input 
                  value={title}
                  onChange={(e) => { setTitle(e.target.value); handleUpdate({ title: e.target.value }); }}
                  className={styles.taskTitleInput}
                  placeholder="Task Name"
                />
                <button 
                  onClick={closeTaskDetail}
                  className="w-10 h-10 rounded-full hover:bg-[var(--border-color)] flex items-center justify-center text-gray-400 transition-colors"
                >
                  <i className="fas fa-times text-xl"></i>
                </button>
              </div>

              {/* Toolbar */}
              {emptyTokens.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 mb-2 p-3 bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/30 rounded-xl">
                  <span className="text-[10px] font-bold text-orange-600 uppercase tracking-widest mr-2">Fill out:</span>
                  {emptyTokens.map(tok => (
                    <button 
                      key={tok.type}
                      onClick={() => setActiveSelect(tok.type as any)}
                      className="flex items-center gap-1.5 bg-white dark:bg-gray-800 border border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-300 px-2 py-1 rounded-lg text-[10px] font-bold hover:bg-orange-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <i className={`fas fa-${tok.icon} text-[8px]`}></i>
                      {tok.name}
                    </button>
                  ))}
                </div>
              )}
              <div className={styles.toolbar}>
                {/* Project Select */}
                <div className="relative" ref={activeSelect === 'project' ? dropdownRef : null}>
                  <button 
                    onClick={() => setActiveSelect(activeSelect === 'project' ? null : 'project')}
                    className={`${styles.tagPill} ${
                      task.project ? 'text-green-600 bg-green-50/50' : 'text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    <i className="fas fa-folder text-[10px]"></i>
                    {task.project || 'Project'}
                  </button>
                  {activeSelect === 'project' && (
                    <div className={styles.dropdown}>
                      <div className="px-2 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Select Project</div>
                      {projects.map(p => (
                        <button 
                          key={p} 
                          onClick={() => { handleUpdate({ project: p }); setActiveSelect(null); }}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-left hover:bg-[var(--border-color)] ${task.project === p ? 'bg-orange-50 text-orange-600 font-bold' : ''}`}
                        >
                          <i className="fas fa-circle text-[8px]"></i> {p}
                        </button>
                      ))}
                      <div className="border-t border-[var(--border-color)] mt-1 pt-1">
                        <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-gray-400 hover:text-gray-600 italic">
                          <i className="fas fa-plus text-[10px]"></i> New Project
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Due Date & Time */}
                <div className={`${styles.dateSelect} ${task.dueDate ? 'text-orange-600 bg-orange-50/50' : 'text-gray-500'}`}>
                  <button 
                    onClick={() => {
                        const iso = getLocalIsoDateTime(0, '12:00');
                        const [date, time] = iso.split('T');
                        handleUpdate({ dueDate: date, dueTime: time });
                    }}
                    className="mr-2 text-[8px] hover:text-orange-600"
                    title="Set for Today"
                  >
                    <i className="fas fa-calendar-day"></i>
                  </button>
                  <i className="fas fa-calendar-alt text-[10px]"></i>
                  <input 
                    type="date"
                    value={task.dueDate || ''}
                    onChange={(e) => handleUpdate({ dueDate: e.target.value })}
                    className={styles.dateSelectInput}
                  />
                  <input 
                    type="time"
                    value={task.dueTime || ''}
                    onChange={(e) => handleUpdate({ dueTime: e.target.value })}
                    className={styles.dateSelectInput}
                  />
                </div>

                {/* Recurrence Select */}
                <div className="relative" ref={activeSelect === 'recurrence' ? dropdownRef : null}>
                  <button 
                    onClick={() => setActiveSelect(activeSelect === 'recurrence' ? null : 'recurrence')}
                    className={`${styles.tagPill} ${task.recurrence ? 'text-blue-600 bg-blue-50/50' : 'text-gray-500'}`}
                  >
                    <i className="fas fa-sync-alt text-[10px]"></i>
                    {task.recurrence || 'Recurrence'}
                  </button>
                  {activeSelect === 'recurrence' && (
                    <div className={styles.dropdown}>
                      {(['daily', 'weekly', 'monthly'] as Recurrence[]).map(r => (
                        <button 
                          key={r || 'none'}
                          onClick={() => { handleUpdate({ recurrence: r }); setActiveSelect(null); }}
                          className={`px-3 py-2 rounded-lg text-xs text-left hover:bg-[var(--border-color)] ${task.recurrence === r ? 'bg-orange-50 text-orange-600 font-bold' : ''}`}
                        >
                          {r ? r.charAt(0).toUpperCase() + r.slice(1) : 'No Recurrence'}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Assignee Select */}
                <div className="relative" ref={activeSelect === 'assignee' ? dropdownRef : null}>
                  <button 
                    onClick={() => setActiveSelect(activeSelect === 'assignee' ? null : 'assignee')}
                    className={`${styles.tagPill} ${
                      task.assigneeId ? 'text-blue-600 bg-blue-50/50' : 'text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    <i className="fas fa-user text-[10px]"></i>
                    {users.find(u => u.id === task.assigneeId)?.name.split(' (')[0] || 'Assignee'}
                  </button>
                  {activeSelect === 'assignee' && (
                    <div className={styles.dropdown}>
                      {users.map(u => (
                        <button 
                          key={u.id} 
                          onClick={() => { handleUpdate({ assigneeId: u.id }); setActiveSelect(null); }}
                          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-left hover:bg-[var(--border-color)] ${task.assigneeId === u.id ? 'bg-orange-50 text-orange-600 font-bold' : ''}`}
                        >
                          <div className="w-5 h-5 rounded-full bg-orange-100 flex items-center justify-center text-[10px]">
                            {u.name.charAt(0)}
                          </div>
                          {u.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Priority Select */}
                <div className="relative" ref={activeSelect === 'priority' ? dropdownRef : null}>
                  <button 
                    onClick={() => setActiveSelect(activeSelect === 'priority' ? null : 'priority')}
                    className={`${styles.tagPill} ${
                      task.priority === 'p1' ? 'text-red-600 bg-red-50' : 
                      task.priority === 'p2' ? 'text-orange-600 bg-orange-50' :
                      task.priority === 'p3' ? 'text-blue-600 bg-blue-50' : 'text-gray-500'
                    }`}
                  >
                    <i className="fas fa-flag text-[10px]"></i>
                    {task.priority?.toUpperCase() || 'Priority'}
                  </button>
                  {activeSelect === 'priority' && (
                    <div className={styles.dropdown}>
                      {['p1', 'p2', 'p3', 'p4'].map(p => (
                        <button 
                          key={p} 
                          onClick={() => { handleUpdate({ priority: p as Priority }); setActiveSelect(null); }}
                          className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs hover:bg-[var(--border-color)] font-bold"
                        >
                          <i className={`fas fa-flag ${p === 'p1' ? 'text-red-500' : p === 'p2' ? 'text-orange-500' : p === 'p3' ? 'text-blue-500' : 'text-gray-400'}`}></i>
                          Priority {p.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Alarm Select */}
                <div className="relative" ref={activeSelect === 'alarm' ? dropdownRef : null}>
                  <button 
                    onClick={() => setActiveSelect(activeSelect === 'alarm' ? null : 'alarm')}
                    className={`${styles.tagPill} text-gray-500 hover:bg-gray-50`}
                  >
                    <i className="fas fa-bell text-[10px]"></i>
                    Alarm
                  </button>
                  {activeSelect === 'alarm' && (
                    <div className={styles.dropdown}>
                      <button 
                        onClick={() => { 
                          // Placeholder for alarm scheduling logic
                          setActiveSelect(null);
                        }}
                        className="px-3 py-2 rounded-lg text-xs text-left hover:bg-[var(--border-color)]"
                      >
                        Set Reminder
                      </button>
                    </div>
                  )}
                </div>

                {/* Tags Select */}
                <div className="relative" ref={activeSelect === 'tags' ? dropdownRef : null}>
                  <button 
                    onClick={() => setActiveSelect(activeSelect === 'tags' ? null : 'tags')}
                    className={`${styles.tagPill} text-purple-600 bg-purple-50/50 hover:bg-purple-50`}
                  >
                    <i className="fas fa-tag text-[10px]"></i>
                    {task.tags.length > 0 ? `${task.tags.length} Tags` : 'Tags'}
                  </button>
                  {activeSelect === 'tags' && (
                    <div className={styles.dropdown}>
                      {tags.map(t => (
                        <button 
                          key={t} 
                          onClick={() => { 
                            const newTags = task.tags.includes(t) ? task.tags.filter(xt => xt !== t) : [...task.tags, t];
                            handleUpdate({ tags: newTags });
                          }}
                          className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs hover:bg-[var(--border-color)] ${task.tags.includes(t) ? 'bg-purple-50 text-purple-600 font-bold' : ''}`}
                        >
                          <span>{t}</span>
                          {task.tags.includes(t) && <i className="fas fa-check text-[10px]"></i>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">
                <i className="fas fa-align-left"></i> Description
              </div>
              <textarea 
                value={desc}
                onChange={(e) => { setDesc(e.target.value); handleUpdate({ desc: e.target.value }); }}
                className={styles.descTextArea}
                placeholder="Add a detailed description... maybe some scriptures?"
              />
            </div>

            {/* Activity Timeline */}
            <div className="flex flex-col gap-4 mt-2">
              <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
                <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  <i className="fas fa-bolt"></i> Activity Feed
                </div>
                <div className="text-[10px] text-gray-400 font-bold">{activityFeed.length} Items</div>
              </div>

              <div className="flex flex-col">
                {activityFeed.map((item: any, index) => {
                  if (item.type === 'log') {
                    return (
                      <div key={item.id || index} className={`${styles.timelineItemSystem} text-xs py-1 mb-2 ml-4`}>
                        <span className="text-gray-400 font-medium mr-1.5">{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        <span className="text-[var(--text-muted)]">{item.text}</span>
                      </div>
                    );
                  } else {
                    const author = users.find(u => u.id === item.authorId);
                    const isMe = item.authorId === currentUser?.id;
                    return (
                      <div key={item.id || index} className={`${styles.commentRow} ${isMe ? styles.commentRowMe : ''}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0 border mt-1 ${isMe ? 'bg-orange-100 text-orange-600 border-orange-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                          {author?.name.charAt(0)}
                        </div>
                        <div className={`${styles.commentBubble} ${isMe ? styles.commentBubbleRight : styles.commentBubbleLeft}`}>
                          <div className={`${styles.commentMeta} ${isMe ? styles.commentMetaMe : ''}`}>
                            <span className="text-[10px] font-black text-[var(--text-main)] uppercase tracking-wider">{author?.name.split(' (')[0]}</span>
                            <span className="text-[9px] text-gray-400 font-bold">{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <p className={`text-sm text-[var(--text-main)] mt-0.5 whitespace-pre-wrap leading-relaxed ${isMe ? 'text-right' : 'text-left'}`}>{item.text}</p>
                          
                          {item.attachments && item.attachments.length > 0 && (
                            <div className={`flex flex-wrap gap-2 mt-2 ${isMe ? 'justify-end' : 'justify-start'}`}>
                              {item.attachments.map((a: any) => (
                                <div key={a.id} className="p-2 rounded-lg bg-white/50 border border-[var(--border-color)] flex items-center gap-2 group cursor-pointer hover:border-orange-500/30 transition-all">
                                  <i className={`fas ${a.type === 'image' ? 'fa-image text-blue-500' : 'fa-file-alt text-gray-500'} text-[10px]`}></i>
                                  <span className="text-[9px] font-bold text-[var(--text-main)] max-w-[80px] truncate">{a.name}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }
                })}
                <div ref={timelineEndRef} />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Comment Input Bar */}
        <div className="p-4 border-t border-[var(--border-color)] bg-[var(--bg-primary)] flex flex-col gap-3 rounded-b-2xl">
          {stagedAttachments.length > 0 && (
            <div className="flex flex-wrap gap-2 px-2">
              {stagedAttachments.map(a => (
                <div key={a.id} className="relative group">
                  <div className="bg-orange-50 border border-orange-200 rounded-lg py-1 px-3 flex items-center gap-2 text-[10px] font-bold text-orange-600 pr-8">
                    <i className="fas fa-paperclip"></i>
                    {a.name}
                  </div>
                  <button 
                    onClick={() => removeStagedAttachment(a.id)}
                    className="absolute right-1 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center text-orange-400 hover:text-red-500"
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={handleCommentSubmit} className="flex items-center gap-3">
            <button 
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-10 h-10 rounded-xl hover:bg-[var(--border-color)] flex items-center justify-center text-gray-400 transition-all active:scale-95"
            >
              <i className="fas fa-paperclip"></i>
              <input 
                type="file" 
                multiple 
                className="hidden" 
                ref={fileInputRef} 
                onChange={handleFileUpload}
              />
            </button>
            <input 
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="flex-1 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-orange-500/50 transition-all"
              placeholder="Write a comment or share progress..."
            />
            <button 
              type="submit"
              disabled={!commentText.trim() && stagedAttachments.length === 0}
              className="w-10 h-10 bg-orange-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20 transition-all active:scale-90 disabled:opacity-30 disabled:grayscale"
            >
              <i className="fas fa-paper-plane text-sm"></i>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TaskDetailDrawer;
